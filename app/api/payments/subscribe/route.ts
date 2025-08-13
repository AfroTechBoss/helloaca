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

const subscribeSchema = z.object({
  plan_type: z.enum(['basic', 'professional', 'enterprise']),
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
});

// Paystack plan configurations
const PAYSTACK_PLANS = {
  basic: {
    monthly: { code: 'PLN_basic_monthly', amount: 2900 }, // ₦29
    yearly: { code: 'PLN_basic_yearly', amount: 29000 }, // ₦290
  },
  professional: {
    monthly: { code: 'PLN_pro_monthly', amount: 9900 }, // ₦99
    yearly: { code: 'PLN_pro_yearly', amount: 99000 }, // ₦990
  },
  enterprise: {
    monthly: { code: 'PLN_enterprise_monthly', amount: 29900 }, // ₦299
    yearly: { code: 'PLN_enterprise_yearly', amount: 299000 }, // ₦2990
  },
};

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

async function initializePaystackPayment(
  email: string,
  amount: number,
  planCode: string,
  reference: string
): Promise<PaystackInitializeResponse> {
  const response = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: amount * 100, // Paystack expects amount in kobo
      plan: planCode,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/callback`,
      metadata: {
        plan_type: planCode.split('_')[1],
        billing_cycle: planCode.split('_')[2],
        user_id: reference.split('_')[1],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Paystack error: ${error.message}`);
  }

  return response.json();
}

export const POST = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  const body = await request.json();
  const { plan_type, billing_cycle } = validateRequest(subscribeSchema, body);

  // Check if user already has an active subscription
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (existingSubscription) {
    throw new ApiErrorResponse('User already has an active subscription', 409, 'SUBSCRIPTION_EXISTS');
  }

  // Get plan details
  const planDetails = PAYSTACK_PLANS[plan_type][billing_cycle];
  if (!planDetails) {
    throw new ApiErrorResponse('Invalid plan configuration', 400, 'INVALID_PLAN');
  }

    // Generate unique reference
    const reference = `sub_${user.id}_${Date.now()}`;

    try {
    // Initialize Paystack payment
    const paystackResponse = await initializePaystackPayment(
      user.email!,
      planDetails.amount,
      planDetails.code,
      reference
    );

    // Create pending subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type,
        billing_cycle,
        status: 'pending',
        amount: planDetails.amount,
        currency: 'NGN',
        paystack_reference: reference,
        paystack_access_code: paystackResponse.data.access_code,
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Subscription creation error:', subscriptionError);
      throw new ApiErrorResponse('Failed to create subscription record', 500, 'DATABASE_ERROR');
    }

    // Create payment history record
    await supabase
      .from('payment_history')
      .insert({
        user_id: user.id,
        subscription_id: subscription.id,
        amount: planDetails.amount,
        currency: 'NGN',
        status: 'pending',
        payment_method: 'paystack',
        transaction_reference: reference,
      });

    const response = NextResponse.json({
      message: 'Payment initialized successfully',
      authorization_url: paystackResponse.data.authorization_url,
      reference,
      subscription_id: subscription.id,
      amount: planDetails.amount,
      plan_type,
      billing_cycle,
    });

    logRequest(request, response);
    return response;

  } catch (paystackError) {
    console.error('Paystack initialization error:', paystackError);
    throw new ApiErrorResponse('Failed to initialize payment', 500, 'PAYMENT_INITIALIZATION_FAILED', { details: paystackError instanceof Error ? paystackError.message : 'Unknown error' });
  }
});

// Get user's subscription status
export const GET = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);

  // Rate limiting
  const rateLimitPassed = await rateLimit(request, 'general');
  if (!rateLimitPassed) {
    throw new ApiErrorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
  }

  // Authentication
  const user = await requireAuth();

  // Fetch user's current subscription
  const { data: subscription, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    console.error('Subscription fetch error:', subscriptionError);
    throw new ApiErrorResponse('Failed to fetch subscription', 500, 'DATABASE_ERROR');
  }

  // Fetch payment history
  const { data: paymentHistory, error: paymentError } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (paymentError) {
    console.error('Payment history fetch error:', paymentError);
    throw new ApiErrorResponse('Failed to fetch payment history', 500, 'DATABASE_ERROR');
  }

  const response = NextResponse.json({
    subscription: subscription || null,
    payment_history: paymentHistory || [],
    has_active_subscription: subscription?.status === 'active',
  });

  logRequest(request, response);
  return response;
});