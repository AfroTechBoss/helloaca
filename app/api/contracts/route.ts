import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { validateRequest, ApiErrorResponse, logRequest, corsHeaders, withErrorHandler } from '@/lib/api-middleware';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  status: z.enum(['uploaded', 'analyzing', 'completed', 'failed']).optional(),
  contract_type: z.enum(['employment', 'service', 'nda', 'partnership', 'lease', 'other']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const { searchParams } = new URL(request.url);
  
  // Validate query parameters
  const querySchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    status: z.enum(['uploaded', 'analyzing', 'completed', 'failed']).optional(),
    contract_type: z.string().optional(),
    search: z.string().optional(),
  });

  const query = validateRequest(querySchema, {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '10',
    status: searchParams.get('status'),
    contract_type: searchParams.get('contract_type'),
    search: searchParams.get('search'),
  });

  const { page, limit, status, contract_type, search } = query;
  const pageNum = parseInt(page);
  const limitNum = Math.min(parseInt(limit), 50); // Max 50 items per page
  const offset = (pageNum - 1) * limitNum;

  // Build query
  let dbQuery = supabase
    .from('contracts')
    .select(`
      *,
      analyses(id, status, overall_risk_score, created_at)
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Apply filters
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  if (contract_type) {
    dbQuery = dbQuery.eq('contract_type', contract_type);
  }

  if (search) {
    dbQuery = dbQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply pagination
  dbQuery = dbQuery.range(offset, offset + limitNum - 1);

  const { data: contracts, error, count } = await dbQuery;

  if (error) {
    console.error('Database error:', error);
    throw new ApiErrorResponse('Failed to fetch contracts', 500, 'DATABASE_ERROR');
  }

  const response = NextResponse.json({
    contracts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum),
    },
  });

  logRequest(request, response);
  return response;

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