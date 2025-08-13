import { NextRequest, NextResponse } from 'next/server';
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

const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100).optional(),
  company: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
  preferences: z.object({
    email_notifications: z.boolean().optional(),
    analysis_alerts: z.boolean().optional(),
    marketing_emails: z.boolean().optional(),
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.enum(['en', 'es', 'fr']).optional(),
  }).optional(),
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Profile fetch error:', profileError);
    throw new ApiErrorResponse('Failed to fetch profile', 500, 'DATABASE_ERROR');
  }

  // Get subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  // Get usage statistics
  const { data: contractsCount } = await supabase
    .from('contracts')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  const { data: analysesCount } = await supabase
    .from('analyses')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  // Get recent activity
  const { data: recentContracts } = await supabase
    .from('contracts')
    .select('id, title, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const response = NextResponse.json({
    profile: {
      ...profile,
      email: user.email,
    },
    subscription: subscription || null,
    usage: {
      total_contracts: contractsCount?.length || 0,
      total_analyses: analysesCount?.length || 0,
    },
    recent_activity: recentContracts || [],
  });

  logRequest(request, response);
  return response;
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  const body = await request.json();
  const updateData = validateRequest(updateProfileSchema, body);

  // Update user profile
  const { data: updatedProfile, error: updateError } = await supabase
    .from('users')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    console.error('Profile update error:', updateError);
    throw new ApiErrorResponse('Failed to update profile', 500, 'DATABASE_ERROR');
  }

  const response = NextResponse.json({
    message: 'Profile updated successfully',
    profile: {
      ...updatedProfile,
      email: user.email,
    },
  });

  logRequest(request, response);
  return response;
});

export const DELETE = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  // This is a soft delete - we'll mark the account as deleted
  // but keep the data for compliance purposes
  const { error: updateError } = await supabase
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Account deletion error:', updateError);
    throw new ApiErrorResponse('Failed to delete account', 500, 'DATABASE_ERROR');
  }

  // Cancel active subscriptions
  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('status', 'active');

  const response = NextResponse.json({
    message: 'Account deleted successfully',
  });

  logRequest(request, response);
  return response;
});