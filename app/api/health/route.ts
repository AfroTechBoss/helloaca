import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, withErrorHandler, corsHeaders } from '@/lib/api-middleware';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const health = await healthCheck();
  
  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 503,
    headers: corsHeaders(),
  });
});

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
};