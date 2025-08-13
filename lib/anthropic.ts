import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration constants
export const CLAUDE_CONFIG = {
  model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
  maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096'),
  temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.1'),
  systemPrompt: process.env.CLAUDE_SYSTEM_PROMPT || 
    'You are an expert legal contract analyst. Analyze contracts for risks, missing clauses, and provide actionable recommendations.',
};

// Contract analysis function
export async function analyzeContract(contractContent: string) {
  try {
    const prompt = `
Please analyze the following contract and provide:

1. Overall risk assessment (score 1-10, where 10 is highest risk)
2. High-risk clauses with explanations
3. Missing important protections
4. Specific recommendations for improvement

Contract content:
${contractContent}

Please format your response as JSON with the following structure:
{
  "riskScore": number,
  "overallAssessment": "string",
  "highRiskClauses": [
    {
      "clauseText": "string",
      "riskLevel": "high|medium|low",
      "riskCategory": "string",
      "explanation": "string",
      "suggestedRevision": "string",
      "lineNumber": number,
      "section": "string"
    }
  ],
  "missingProtections": [
    {
      "protectionType": "string",
      "importance": "critical|important|recommended",
      "description": "string",
      "suggestedClause": "string",
      "legalImpact": "string"
    }
  ],
  "recommendations": ["string"]
}`;

    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: CLAUDE_CONFIG.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse the JSON response
    const analysisResult = JSON.parse(content.text);
    
    return {
      success: true,
      data: analysisResult,
    };
  } catch (error) {
    console.error('Error analyzing contract with Claude:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to generate contract suggestions
export async function generateContractSuggestions(contractType: string, requirements: string[]) {
  try {
    const prompt = `
Generate a comprehensive contract template for a ${contractType} with the following requirements:
${requirements.map(req => `- ${req}`).join('\n')}

Please provide:
1. Essential clauses that should be included
2. Risk mitigation strategies
3. Industry-specific considerations
4. Template structure

Format the response as JSON with clear sections and explanations.`;

    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: 0.3, // Slightly higher for more creative suggestions
      system: 'You are an expert contract lawyer specializing in drafting comprehensive legal agreements.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return {
      success: true,
      data: JSON.parse(content.text),
    };
  } catch (error) {
    console.error('Error generating contract suggestions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Function to explain legal terms
export async function explainLegalTerm(term: string, context?: string) {
  try {
    const prompt = context 
      ? `Explain the legal term "${term}" in the context of: ${context}`
      : `Explain the legal term "${term}" in simple, understandable language.`;

    const response = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: 1000,
      temperature: 0.1,
      system: 'You are a legal expert who explains complex legal terms in simple, accessible language.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return {
      success: true,
      explanation: content.text,
    };
  } catch (error) {
    console.error('Error explaining legal term:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}