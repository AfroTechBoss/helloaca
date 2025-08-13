import axios from 'axios';
import { Plan } from '@/types';

// Interface for Axios error responses
interface AxiosError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

if (!process.env.PAYSTACK_SECRET_KEY) {
  throw new Error('Missing PAYSTACK_SECRET_KEY environment variable');
}

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Paystack API client
const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Plan configurations
export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out our service',
    price: 0,
    currency: 'NGN',
    interval: 'month',
    features: [
      '3 contract analyses per month',
      'Basic risk assessment',
      'Standard support',
      'PDF export',
    ],
    limits: {
      contracts_per_month: 3,
      file_size_mb: 10,
      storage_gb: 1,
    },
    paystack_plan_code: undefined,
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Great for small businesses and freelancers',
    price: 15000, // ₦150 in kobo
    currency: 'NGN',
    interval: 'month',
    features: [
      '25 contract analyses per month',
      'Advanced risk assessment',
      'Priority support',
      'PDF & Word export',
      'Contract templates',
      'Email notifications',
    ],
    limits: {
      contracts_per_month: 25,
      file_size_mb: 25,
      storage_gb: 5,
    },
    paystack_plan_code: 'PLN_starter_monthly',
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Perfect for growing businesses',
    price: 35000, // ₦350 in kobo
    currency: 'NGN',
    interval: 'month',
    features: [
      '100 contract analyses per month',
      'Advanced risk assessment',
      'Priority support',
      'All export formats',
      'Custom contract templates',
      'API access',
      'Team collaboration',
      'Advanced analytics',
    ],
    limits: {
      contracts_per_month: 100,
      file_size_mb: 50,
      storage_gb: 20,
    },
    paystack_plan_code: 'PLN_professional_monthly',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 75000, // ₦750 in kobo
    currency: 'NGN',
    interval: 'month',
    features: [
      'Unlimited contract analyses',
      'Advanced risk assessment',
      'Dedicated support',
      'All export formats',
      'Custom integrations',
      'White-label options',
      'Advanced team management',
      'Custom analytics',
      'SLA guarantee',
    ],
    limits: {
      contracts_per_month: -1, // Unlimited
      file_size_mb: 100,
      storage_gb: 100,
    },
    paystack_plan_code: 'PLN_enterprise_monthly',
  },
};

// Initialize a payment transaction
export async function initializePayment({
  email,
  amount,
  planId,
  userId,
  metadata = {},
}: {
  email: string;
  amount: number;
  planId: string;
  userId: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const response = await paystackApi.post('/transaction/initialize', {
      email,
      amount,
      currency: 'NGN',
      plan: PLANS[planId]?.paystack_plan_code,
      metadata: {
        user_id: userId,
        plan_id: planId,
        ...metadata,
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing/success`,
      cancel_action: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    });

    if (response.data.status) {
      return {
        success: true,
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference,
        },
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to initialize payment',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack initialization error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Payment initialization failed',
    };
  }
}

// Verify a payment transaction
export async function verifyPayment(reference: string) {
  try {
    const response = await paystackApi.get(`/transaction/verify/${reference}`);

    if (response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        data: {
          reference: response.data.data.reference,
          amount: response.data.data.amount,
          currency: response.data.data.currency,
          customer: response.data.data.customer,
          metadata: response.data.data.metadata,
          paid_at: response.data.data.paid_at,
          authorization: response.data.data.authorization,
        },
      };
    } else {
      return {
        success: false,
        error: 'Payment verification failed',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack verification error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Payment verification failed',
    };
  }
}

// Create a subscription plan on Paystack
export async function createPlan(plan: Plan) {
  try {
    const response = await paystackApi.post('/plan', {
      name: plan.name,
      interval: plan.interval,
      amount: plan.price,
      currency: plan.currency,
      description: plan.description,
    });

    if (response.data.status) {
      return {
        success: true,
        data: {
          plan_code: response.data.data.plan_code,
          id: response.data.data.id,
        },
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to create plan',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack plan creation error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Plan creation failed',
    };
  }
}

// Create a subscription
export async function createSubscription({
  customer,
  plan,
  authorization,
}: {
  customer: string;
  plan: string;
  authorization: string;
}) {
  try {
    const response = await paystackApi.post('/subscription', {
      customer,
      plan,
      authorization,
    });

    if (response.data.status) {
      return {
        success: true,
        data: {
          subscription_code: response.data.data.subscription_code,
          email_token: response.data.data.email_token,
          status: response.data.data.status,
        },
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to create subscription',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack subscription creation error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Subscription creation failed',
    };
  }
}

// Cancel a subscription
export async function cancelSubscription(subscriptionCode: string) {
  try {
    const response = await paystackApi.post('/subscription/disable', {
      code: subscriptionCode,
      token: process.env.PAYSTACK_EMAIL_TOKEN,
    });

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to cancel subscription',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack subscription cancellation error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Subscription cancellation failed',
    };
  }
}

// Get customer details
export async function getCustomer(customerCode: string) {
  try {
    const response = await paystackApi.get(`/customer/${customerCode}`);

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to get customer',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack customer fetch error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Customer fetch failed',
    };
  }
}

// Get subscription details
export async function getSubscription(subscriptionCode: string) {
  try {
    const response = await paystackApi.get(`/subscription/${subscriptionCode}`);

    if (response.data.status) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to get subscription',
      };
    }
  } catch (error: unknown) {
    console.error('Paystack subscription fetch error:', error);
    return {
      success: false,
      error: (error as AxiosError).response?.data?.message || 'Subscription fetch failed',
    };
  }
}

// Validate webhook signature
export async function validateWebhookSignature(payload: string, signature: string): Promise<boolean> {
  const crypto = await import('crypto');
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// Process webhook events
export async function processWebhookEvent(event: Record<string, unknown>) {
  try {
    switch (event.event) {
      case 'charge.success':
        // Handle successful payment
        return await handleSuccessfulPayment(event.data as Record<string, unknown>);
      
      case 'subscription.create':
        // Handle subscription creation
        return await handleSubscriptionCreated(event.data as Record<string, unknown>);
      
      case 'subscription.disable':
        // Handle subscription cancellation
        return await handleSubscriptionCancelled(event.data as Record<string, unknown>);
      
      case 'invoice.create':
        // Handle invoice creation
        return await handleInvoiceCreated(event.data as Record<string, unknown>);
      
      case 'invoice.payment_failed':
        // Handle failed payment
        return await handlePaymentFailed(event.data as Record<string, unknown>);
      
      default:
        console.log(`Unhandled webhook event: ${event.event}`);
        return { success: true, message: 'Event ignored' };
    }
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    return { success: false, error: 'Webhook processing failed' };
  }
}

// Helper functions for webhook processing
async function handleSuccessfulPayment(data: Record<string, unknown>) {
  // Implementation will be added when we create the database functions
  console.log('Payment successful:', data.reference);
  return { success: true };
}

async function handleSubscriptionCreated(data: Record<string, unknown>) {
  // Implementation will be added when we create the database functions
  console.log('Subscription created:', data.subscription_code);
  return { success: true };
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  // Implementation will be added when we create the database functions
  console.log('Subscription cancelled:', data.subscription_code);
  return { success: true };
}

async function handleInvoiceCreated(data: Record<string, unknown>) {
  // Implementation will be added when we create the database functions
  console.log('Invoice created:', data.id);
  return { success: true };
}

async function handlePaymentFailed(data: Record<string, unknown>) {
  // Implementation will be added when we create the database functions
  console.log('Payment failed:', data.reference);
  return { success: true };
}

// Get public key for frontend
export function getPublicKey() {
  return PAYSTACK_PUBLIC_KEY;
}

// Format amount for display
export function formatAmount(amount: number, currency = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  });
  
  return formatter.format(amount / 100); // Convert from kobo to naira
}

// Convert amount to kobo
export function toKobo(amount: number): number {
  return Math.round(amount * 100);
}

// Convert amount from kobo
export function fromKobo(amount: number): number {
  return amount / 100;
}