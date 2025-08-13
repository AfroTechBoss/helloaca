import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { Redis } from '@upstash/redis';

// Initialize Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rate limiting configurations
const RATE_LIMITS = {
  // General API calls
  general: {
    requests: 100,
    window: 60 * 1000, // 1 minute
  },
  // File uploads
  upload: {
    requests: 10,
    window: 60 * 1000, // 1 minute
  },
  // AI analysis (more restrictive)
  analysis: {
    requests: 5,
    window: 60 * 1000, // 1 minute
  },
  // Authentication endpoints
  auth: {
    requests: 20,
    window: 60 * 1000, // 1 minute
  },
};

// Subscription limits
const SUBSCRIPTION_LIMITS = {
  free: {
    contracts_per_month: 3,
    analyses_per_month: 3,
    file_size_mb: 5,
  },
  basic: {
    contracts_per_month: 25,
    analyses_per_month: 25,
    file_size_mb: 10,
  },
  professional: {
    contracts_per_month: 100,
    analyses_per_month: 100,
    file_size_mb: 25,
  },
  enterprise: {
    contracts_per_month: -1, // unlimited
    analyses_per_month: -1, // unlimited
    file_size_mb: 50,
  },
};

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}

export class ApiErrorResponse extends Error {
  public statusCode: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, statusCode: number = 500, code?: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Rate limiting middleware
export async function rateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS = 'general'
): Promise<boolean> {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const key = `rate_limit:${type}:${ip}`;
    const limit = RATE_LIMITS[type];

    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, Math.ceil(limit.window / 1000));
    }

    return current <= limit.requests;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If Redis fails, allow the request to proceed
    return true;
  }
}

// Check subscription limits
export async function checkSubscriptionLimits(
  userId: string,
  action: 'contract' | 'analysis',
  fileSize?: number
): Promise<{ allowed: boolean; reason?: string; limit?: number; current?: number }> {
  try {
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    const planType = subscription?.plan_type || 'free';
    const limits = SUBSCRIPTION_LIMITS[planType as keyof typeof SUBSCRIPTION_LIMITS];

    // Check file size limit
    if (fileSize && fileSize > limits.file_size_mb * 1024 * 1024) {
      return {
        allowed: false,
        reason: `File size exceeds ${limits.file_size_mb}MB limit for ${planType} plan`,
        limit: limits.file_size_mb,
      };
    }

    // Check monthly limits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const limitField = action === 'contract' ? 'contracts_per_month' : 'analyses_per_month';
    const monthlyLimit = limits[limitField];

    if (monthlyLimit === -1) {
      return { allowed: true }; // Unlimited
    }

    // Count current month usage
    const table = action === 'contract' ? 'contracts' : 'analyses';
    const { data, error } = await supabase
      .from(table)
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`);

    if (error) {
      console.error('Usage check error:', error);
      return { allowed: true }; // Allow if we can't check
    }

    const currentUsage = data?.length || 0;

    if (currentUsage >= monthlyLimit) {
      return {
        allowed: false,
        reason: `Monthly ${action} limit reached for ${planType} plan`,
        limit: monthlyLimit,
        current: currentUsage,
      };
    }

    return {
      allowed: true,
      limit: monthlyLimit,
      current: currentUsage,
    };

  } catch (error) {
    console.error('Subscription limit check error:', error);
    return { allowed: true }; // Allow if we can't check
  }
}

// Authentication middleware
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiErrorResponse('Unauthorized', 401, 'AUTH_REQUIRED');
  }
  return user;
}

// Error handler wrapper
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof ApiErrorResponse) {
        const apiError: ApiError = {
          error: error.message,
          code: error.code,
          details: error.details,
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json(apiError, { status: error.statusCode });
      }

      // Generic error
      const apiError: ApiError = {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json(apiError, { status: 500 });
    }
  };
}

// Request validation middleware
export function validateRequest<T>(
  schema: { safeParse: (data: unknown) => { success: boolean; data?: T; error?: { errors: unknown[] } } },
  data: unknown
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiErrorResponse(
      'Invalid request data',
      400,
      'VALIDATION_ERROR',
      result.error?.errors || []
    );
  }
  if (!result.data) {
    throw new ApiErrorResponse(
      'Invalid request data',
      400,
      'VALIDATION_ERROR'
    );
  }
  return result.data;
}

// CORS middleware
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// Logging middleware
export function logRequest(request: NextRequest, response?: NextResponse) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;
  const userAgent = request.headers.get('user-agent');
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
  const status = response?.status || 'pending';

  console.log(`[${timestamp}] ${method} ${url} - ${status} - ${ip} - ${userAgent}`);
}

// Health check utility
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  services: Record<string, 'up' | 'down'>;
  timestamp: string;
}> {
  const services: Record<string, 'up' | 'down'> = {};

  // Check Supabase
  try {
    await supabase.from('users').select('id').limit(1);
    services.supabase = 'up';
  } catch {
    services.supabase = 'down';
  }

  // Check Redis
  try {
    await redis.ping();
    services.redis = 'up';
  } catch {
    services.redis = 'down';
  }

  const allUp = Object.values(services).every(status => status === 'up');

  return {
    status: allUp ? 'healthy' : 'unhealthy',
    services,
    timestamp: new Date().toISOString(),
  };
}