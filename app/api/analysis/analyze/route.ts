import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { validateRequest, checkSubscriptionLimits, ApiErrorResponse, withErrorHandler, logRequest, corsHeaders } from '@/lib/api-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const analyzeSchema = z.object({
  contract_id: z.string().uuid('Invalid contract ID'),
  analysis_type: z.enum(['comprehensive', 'risk_only', 'clause_only']).default('comprehensive'),
});

interface RiskClause {
  clause_text: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_category: string;
  explanation: string;
  recommendation: string;
  location: string;
}

interface MissingClause {
  clause_type: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggested_text: string;
  legal_impact: string;
}

interface AnalysisResult {
  overall_risk_score: number;
  summary: string;
  key_findings: string[];
  risk_clauses: RiskClause[];
  missing_clauses: MissingClause[];
  recommendations: string[];
}

async function extractTextFromContract(fileUrl: string): Promise<string> {
  try {
    // For now, we'll simulate text extraction
    // In a real implementation, you'd use a PDF/Word parser
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch contract file');
    }
    
    // This is a placeholder - you'd implement actual text extraction here
    // For PDF: use pdf-parse or similar
    // For Word: use mammoth or similar
    return 'Contract text would be extracted here...';
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from contract');
  }
}

async function analyzeContractWithClaude(contractText: string, contractType: string): Promise<AnalysisResult> {
  const prompt = `
You are an expert legal contract analyzer. Analyze the following ${contractType} contract and provide a comprehensive analysis.

Contract Text:
${contractText}

Please provide your analysis in the following JSON format:
{
  "overall_risk_score": <number between 0-100>,
  "summary": "<brief summary of the contract>",
  "key_findings": ["<finding1>", "<finding2>", ...],
  "risk_clauses": [
    {
      "clause_text": "<actual clause text>",
      "risk_level": "<low|medium|high|critical>",
      "risk_category": "<category like 'termination', 'liability', etc.>",
      "explanation": "<why this is risky>",
      "recommendation": "<how to mitigate>",
      "location": "<section/paragraph reference>"
    }
  ],
  "missing_clauses": [
    {
      "clause_type": "<type of missing clause>",
      "importance": "<low|medium|high|critical>",
      "description": "<what's missing>",
      "suggested_text": "<suggested clause text>",
      "legal_impact": "<potential legal consequences>"
    }
  ],
  "recommendations": ["<recommendation1>", "<recommendation2>", ...]
}

Focus on:
1. Identifying risky clauses that could be unfavorable
2. Missing standard clauses that should be included
3. Ambiguous language that could cause disputes
4. Imbalanced terms that favor one party
5. Compliance and regulatory considerations

Provide only the JSON response, no additional text.
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return JSON.parse(content.text) as AnalysisResult;
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw new Error('Failed to analyze contract with AI');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const body = await request.json();
  
  // Validate request data
  const requestSchema = z.object({
    contractId: z.string().uuid(),
    analysisType: z.enum(['full', 'risk_only', 'compliance_only']).default('full'),
  });

  const { contractId, analysisType } = validateRequest(requestSchema, body);
  const contract_id = contractId; // Use consistent variable naming

  // Check subscription limits for analysis
  const subscriptionCheck = await checkSubscriptionLimits(user.id, 'analysis');
  if (!subscriptionCheck.allowed) {
    throw new ApiErrorResponse(
      subscriptionCheck.reason || 'Analysis limit exceeded',
      403,
      'SUBSCRIPTION_LIMIT_EXCEEDED',
      {
        limit: subscriptionCheck.limit,
        current: subscriptionCheck.current
      }
    );
  }

  // Check if contract exists and belongs to user
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contract_id)
    .eq('user_id', user.id)
    .single();

  if (contractError || !contract) {
    throw new ApiErrorResponse('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  // Check if analysis already exists
  const { data: existingAnalysis } = await supabase
    .from('analyses')
    .select('id, status')
    .eq('contract_id', contract_id)
    .single();

  if (existingAnalysis) {
    if (existingAnalysis.status === 'analyzing') {
      throw new ApiErrorResponse('Analysis already in progress', 409, 'ANALYSIS_IN_PROGRESS');
    }
    if (existingAnalysis.status === 'completed') {
      throw new ApiErrorResponse(
        'Analysis already completed. Use the results endpoint to retrieve it.',
        409,
        'ANALYSIS_ALREADY_EXISTS'
      );
    }
  }

  // Update contract status to analyzing
  await supabase
    .from('contracts')
    .update({ status: 'analyzing' })
    .eq('id', contract_id);

    try {
  // Extract text from contract file (placeholder implementation)
  const contractText = await extractTextFromContract(contract.file_url);
  
  if (!contractText) {
    await supabase
      .from('contracts')
      .update({ status: 'failed' })
      .eq('id', contract_id);
    
    throw new ApiErrorResponse('Failed to extract text from contract', 500, 'TEXT_EXTRACTION_FAILED');
  }

  // Analyze contract with Claude AI
  const analysisResult = await analyzeContractWithClaude(contractText, contract.contract_type);
  
  if (!analysisResult) {
    await supabase
      .from('contracts')
      .update({ status: 'failed' })
      .eq('id', contract_id);
    
    throw new ApiErrorResponse('Failed to analyze contract', 500, 'AI_ANALYSIS_FAILED');
  }

  // Save analysis to database
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .insert({
      contract_id: contractId,
      user_id: user.id,
      status: 'completed',
      overall_risk_score: analysisResult.overall_risk_score,
      summary: analysisResult.summary,
      key_findings: analysisResult.key_findings,
      recommendations: analysisResult.recommendations,
    })
    .select()
    .single();

  if (analysisError) {
    console.error('Analysis save error:', analysisError);
    throw new ApiErrorResponse('Failed to save analysis', 500, 'DATABASE_ERROR');
  }

  // Save risk clauses
  if (analysisResult.risk_clauses && analysisResult.risk_clauses.length > 0) {
    const riskClausesData = analysisResult.risk_clauses.map(clause => ({
      analysis_id: analysis.id,
      clause_text: clause.clause_text,
      risk_level: clause.risk_level,
      risk_category: clause.risk_category,
      explanation: clause.explanation,
      recommendation: clause.recommendation,
      location: clause.location,
    }));

    const { error: riskError } = await supabase
      .from('risk_clauses')
      .insert(riskClausesData);

    if (riskError) {
      console.error('Risk clauses save error:', riskError);
    }
  }

  // Save missing clauses
  if (analysisResult.missing_clauses && analysisResult.missing_clauses.length > 0) {
    const missingClausesData = analysisResult.missing_clauses.map(clause => ({
      analysis_id: analysis.id,
      clause_type: clause.clause_type,
      importance: clause.importance,
      description: clause.description,
      suggested_text: clause.suggested_text,
      legal_impact: clause.legal_impact,
    }));

    const { error: missingError } = await supabase
      .from('missing_clauses')
      .insert(missingClausesData);

    if (missingError) {
      console.error('Missing clauses save error:', missingError);
    }
  }

  // Update contract status to completed
  await supabase
    .from('contracts')
    .update({ status: 'completed' })
    .eq('id', contract_id);

  const response = NextResponse.json({
    message: 'Analysis completed successfully',
    analysis: {
      id: analysis.id,
      status: analysis.status,
      overallRiskScore: analysis.overall_risk_score,
      summary: analysis.summary,
      keyFindings: analysis.key_findings,
      recommendations: analysis.recommendations,
      createdAt: analysis.created_at,
    },
    usage: {
      current: subscriptionCheck.current! + 1,
      limit: subscriptionCheck.limit
    }
  });

  logRequest(request, response);
  return response;

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Update contract status to failed
    await supabase
      .from('contracts')
      .update({ status: 'failed' })
      .eq('id', contract_id);
    
    if (error instanceof ApiErrorResponse) {
      throw error;
    }
    
    throw new ApiErrorResponse('Analysis failed', 500, 'ANALYSIS_ERROR');
  }
  } catch (error) {
    return withErrorHandler(() => { throw error; })();
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
};