import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  withErrorHandler,
  requireAuth,
  rateLimit,
  ApiErrorResponse,
  corsHeaders,
  logRequest
} from '@/lib/api-middleware';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const paramsSchema = z.object({
  id: z.string().uuid('Invalid analysis ID'),
});

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  // Validate params
  const validationResult = paramsSchema.safeParse(params);
  if (!validationResult.success) {
    throw new ApiErrorResponse('Invalid analysis ID', 400, 'INVALID_ANALYSIS_ID');
  }

  const { id } = validationResult.data;

  // Fetch analysis with related data
  const { data: analysis, error: analysisError } = await supabase
    .from('analyses')
    .select(`
      *,
      contracts (
        id,
        title,
        contract_type,
        file_name,
        created_at
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (analysisError || !analysis) {
    throw new ApiErrorResponse('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  // Fetch risk clauses
  const { data: riskClauses, error: riskError } = await supabase
    .from('risk_clauses')
    .select('*')
    .eq('analysis_id', id)
    .order('risk_level', { ascending: false });

  if (riskError) {
    console.error('Risk clauses fetch error:', riskError);
    throw new ApiErrorResponse('Failed to fetch risk clauses', 500, 'DATABASE_ERROR');
  }

  // Fetch missing clauses
  const { data: missingClauses, error: missingError } = await supabase
    .from('missing_clauses')
    .select('*')
    .eq('analysis_id', id)
    .order('importance', { ascending: false });

  if (missingError) {
    console.error('Missing clauses fetch error:', missingError);
    throw new ApiErrorResponse('Failed to fetch missing clauses', 500, 'DATABASE_ERROR');
  }

  // Calculate risk distribution
  const riskDistribution = {
    critical: riskClauses?.filter(clause => clause.risk_level === 'critical').length || 0,
    high: riskClauses?.filter(clause => clause.risk_level === 'high').length || 0,
    medium: riskClauses?.filter(clause => clause.risk_level === 'medium').length || 0,
    low: riskClauses?.filter(clause => clause.risk_level === 'low').length || 0,
  };

  // Calculate missing clause importance distribution
  const missingClauseDistribution = {
    critical: missingClauses?.filter(clause => clause.importance === 'critical').length || 0,
    high: missingClauses?.filter(clause => clause.importance === 'high').length || 0,
    medium: missingClauses?.filter(clause => clause.importance === 'medium').length || 0,
    low: missingClauses?.filter(clause => clause.importance === 'low').length || 0,
  };

  const response = NextResponse.json({
    analysis: {
      ...analysis,
      risk_clauses: riskClauses || [],
      missing_clauses: missingClauses || [],
      risk_distribution: riskDistribution,
      missing_clause_distribution: missingClauseDistribution,
      total_risks: riskClauses?.length || 0,
      total_missing_clauses: missingClauses?.length || 0,
    },
  });

  logRequest(request, response);
  return response;
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  // Validate params
  const validationResult = paramsSchema.safeParse(params);
  if (!validationResult.success) {
    throw new ApiErrorResponse('Invalid analysis ID', 400, 'INVALID_ANALYSIS_ID');
  }

  const { id } = validationResult.data;

  // Check if analysis exists and belongs to user
  const { data: analysis, error: fetchError } = await supabase
    .from('analyses')
    .select('id, contract_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !analysis) {
    throw new ApiErrorResponse('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
  }

  // Delete related risk clauses
  const { error: riskDeleteError } = await supabase
    .from('risk_clauses')
    .delete()
    .eq('analysis_id', id);

  if (riskDeleteError) {
    console.error('Risk clauses deletion error:', riskDeleteError);
    throw new ApiErrorResponse('Failed to delete risk clauses', 500, 'DATABASE_ERROR');
  }

  // Delete related missing clauses
  const { error: missingDeleteError } = await supabase
    .from('missing_clauses')
    .delete()
    .eq('analysis_id', id);

  if (missingDeleteError) {
    console.error('Missing clauses deletion error:', missingDeleteError);
    throw new ApiErrorResponse('Failed to delete missing clauses', 500, 'DATABASE_ERROR');
  }

  // Delete analysis
  const { error: analysisDeleteError } = await supabase
    .from('analyses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (analysisDeleteError) {
    console.error('Analysis deletion error:', analysisDeleteError);
    throw new ApiErrorResponse('Failed to delete analysis', 500, 'DATABASE_ERROR');
  }

  // Reset contract status to uploaded
  await supabase
    .from('contracts')
    .update({ status: 'uploaded' })
    .eq('id', analysis.contract_id);

  const response = NextResponse.json({
    message: 'Analysis deleted successfully',
  });

  logRequest(request, response);
  return response;
});