import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { withErrorHandler, ApiErrorResponse, logRequest } from '@/lib/api-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      plan_type?: string;
      billing_cycle?: string;
      user_id?: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, unknown>;
      risk_action: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
    plan?: {
      id: number;
      name: string;
      plan_code: string;
      description: string;
      amount: number;
      interval: string;
      send_invoices: boolean;
      send_sms: boolean;
      currency: string;
    };
  };
}

function verifyPaystackSignature(payload: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

async function handleChargeSuccess(event: PaystackWebhookEvent) {
  const { data } = event;
  const reference = data.reference;
  
  try {
    // Find the subscription by reference
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (subscriptionError || !subscription) {
      console.error('Subscription not found for reference:', reference);
      return;
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    
    if (subscription.billing_cycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscription.billing_cycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        paystack_customer_code: data.customer.customer_code,
        paystack_authorization_code: data.authorization.authorization_code,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return;
    }

    // Update payment history
    const { error: paymentError } = await supabase
      .from('payment_history')
      .update({
        status: 'completed',
        paystack_transaction_id: data.id.toString(),
        paid_at: data.paid_at,
        payment_details: {
          gateway_response: data.gateway_response,
          channel: data.channel,
          authorization: data.authorization,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_reference', reference);

    if (paymentError) {
      console.error('Failed to update payment history:', paymentError);
    }

    // Deactivate any other active subscriptions for this user
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', subscription.user_id)
      .neq('id', subscription.id)
      .eq('status', 'active');

    console.log(`Subscription activated for user ${subscription.user_id}`);
  } catch (error) {
    console.error('Error handling charge success:', error);
  }
}

async function handleChargeFailed(event: PaystackWebhookEvent) {
  const { data } = event;
  const reference = data.reference;
  
  try {
    // Find the subscription by reference
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_reference', reference)
      .single();

    if (subscriptionError || !subscription) {
      console.error('Subscription not found for reference:', reference);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return;
    }

    // Update payment history
    const { error: paymentError } = await supabase
      .from('payment_history')
      .update({
        status: 'failed',
        paystack_transaction_id: data.id.toString(),
        payment_details: {
          gateway_response: data.gateway_response,
          message: data.message,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('transaction_reference', reference);

    if (paymentError) {
      console.error('Failed to update payment history:', paymentError);
    }

    console.log(`Payment failed for subscription ${subscription.id}`);
  } catch (error) {
    console.error('Error handling charge failed:', error);
  }
}

async function handleSubscriptionDisable(event: PaystackWebhookEvent) {
  const { data } = event;
  
  try {
    // Find subscription by customer code
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('paystack_customer_code', data.customer.customer_code)
      .eq('status', 'active')
      .single();

    if (subscriptionError || !subscription) {
      console.error('Active subscription not found for customer:', data.customer.customer_code);
      return;
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return;
    }

    console.log(`Subscription cancelled for user ${subscription.user_id}`);
  } catch (error) {
    console.error('Error handling subscription disable:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyPaystackSignature(body, signature)) {
      throw new ApiErrorResponse('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    const event: PaystackWebhookEvent = JSON.parse(body);
    
    console.log(`Received Paystack webhook: ${event.event}`);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event);
        break;
        
      case 'charge.failed':
        await handleChargeFailed(event);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisable(event);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }

    const response = NextResponse.json({ message: 'Webhook processed successfully' });
    logRequest(request, response);
    return response;

  } catch (error) {
    return withErrorHandler(() => { throw error; })();
  }
}

// Handle GET requests (for webhook verification)
export const GET = withErrorHandler(async (request: NextRequest) => {
  logRequest(request);
  
  const response = NextResponse.json({ message: 'Paystack webhook endpoint' });
  logRequest(request, response);
  return response;
});