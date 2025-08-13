import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import {
  withErrorHandler,
  requireAuth,
  rateLimit,
  validateRequest,
  ApiErrorResponse,
  corsHeaders,
  logRequest
} from '@/lib/api-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const paramsSchema = z.object({
  id: z.string().uuid('Invalid contract ID'),
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
    throw new ApiErrorResponse('Invalid contract ID', 400, 'INVALID_CONTRACT_ID');
  }

  const { id } = validationResult.data;

  // Fetch contract
  const { data: contract, error: dbError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (dbError || !contract) {
    throw new ApiErrorResponse('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  const response = NextResponse.json({ contract });
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
    throw new ApiErrorResponse('Invalid contract ID', 400, 'INVALID_CONTRACT_ID');
  }

  const { id } = validationResult.data;

  // Fetch contract to get file URL
  const { data: contract, error: fetchError } = await supabase
    .from('contracts')
    .select('file_url')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !contract) {
    throw new ApiErrorResponse('Contract not found', 404, 'CONTRACT_NOT_FOUND');
  }

  // Delete related analyses first (cascade)
  const { error: analysisDeleteError } = await supabase
    .from('analyses')
    .delete()
    .eq('contract_id', id);

  if (analysisDeleteError) {
    console.error('Error deleting analyses:', analysisDeleteError);
    throw new ApiErrorResponse('Failed to delete related analyses', 500, 'DATABASE_ERROR');
  }

  // Delete contract from database
  const { error: dbError } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (dbError) {
    console.error('Database error:', dbError);
    throw new ApiErrorResponse('Failed to delete contract', 500, 'DATABASE_ERROR');
  }

  // Delete file from Vercel Blob
  try {
    await del(contract.file_url, {
      token: process.env.BLOB_READ_WRITE_TOKEN!,
    });
  } catch (blobError) {
    console.error('Blob deletion error:', blobError);
    // Don't fail the request if blob deletion fails
  }

  const response = NextResponse.json({
    message: 'Contract deleted successfully',
  });

  logRequest(request, response);
  return response;
});

export const PATCH = withErrorHandler(async (
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
    throw new ApiErrorResponse('Invalid contract ID', 400, 'INVALID_CONTRACT_ID');
  }

  const { id } = validationResult.data;
  const body = await request.json();

  const updateSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    contract_type: z.enum(['employment', 'service', 'nda', 'partnership', 'lease', 'other']).optional(),
  });

  const updateData = validateRequest(updateSchema, body);

  // Update contract
  const { data: contract, error: dbError } = await supabase
    .from('contracts')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (dbError || !contract) {
    throw new ApiErrorResponse('Failed to update contract', 500, 'DATABASE_ERROR');
  }

  const response = NextResponse.json({
    message: 'Contract updated successfully',
    contract,
  });

  logRequest(request, response);
  return response;
});