// API Request/Response types

// Authentication API types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// Contract API types
export interface UploadContractRequest {
  file: File;
  title?: string;
}

export interface UploadContractResponse {
  contract_id: string;
  file_url: string;
  upload_url?: string;
}

export interface AnalyzeContractRequest {
  contract_id: string;
  options?: {
    priority?: 'low' | 'normal' | 'high';
    include_suggestions?: boolean;
    analysis_depth?: 'basic' | 'detailed' | 'comprehensive';
  };
}

export interface AnalyzeContractResponse {
  analysis_id: string;
  status: 'pending' | 'in_progress';
  estimated_completion_time?: number;
}

export interface GetAnalysisRequest {
  analysis_id: string;
}

export interface GetAnalysisResponse {
  id: string;
  contract_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress?: number;
  risk_score?: number;
  overall_assessment?: string;
  high_risk_clauses?: Array<{
    id: string;
    clause_text: string;
    risk_level: 'high' | 'medium' | 'low';
    risk_category: string;
    explanation: string;
    suggested_revision: string;
    line_number?: number;
    section?: string;
  }>;
  missing_protections?: Array<{
    id: string;
    protection_type: string;
    importance: 'critical' | 'important' | 'recommended';
    description: string;
    suggested_clause: string;
    legal_impact: string;
  }>;
  recommendations?: string[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Export API types
export interface ExportReportRequest {
  analysis_id: string;
  format: 'pdf' | 'docx' | 'json';
  options: {
    include_recommendations: boolean;
    include_risk_analysis: boolean;
    include_missing_protections: boolean;
    custom_branding?: boolean;
  };
}

export interface ExportReportResponse {
  download_url: string;
  filename: string;
  size: number;
  expires_at: string;
}

// Subscription API types
export interface CreateSubscriptionRequest {
  plan_id: string;
  payment_method: 'stripe' | 'paystack';
  billing_interval: 'month' | 'year';
  payment_method_id?: string;
}

export interface CreateSubscriptionResponse {
  subscription_id: string;
  client_secret?: string; // For Stripe
  authorization_url?: string; // For Paystack
  status: 'pending' | 'active' | 'requires_action';
}

export interface UpdateSubscriptionRequest {
  plan_id?: string;
  cancel_at_period_end?: boolean;
}

export interface GetSubscriptionResponse {
  id: string;
  plan: {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: 'month' | 'year';
    credits_included: number;
    features: string[];
  };
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  credits_remaining: number;
}

// Usage API types
export interface GetUsageRequest {
  start_date?: string;
  end_date?: string;
  action_type?: 'contract_upload' | 'analysis_request' | 'export_report';
}

export interface GetUsageResponse {
  total_credits_used: number;
  usage_by_action: Array<{
    action_type: string;
    count: number;
    credits_used: number;
  }>;
  usage_by_date: Array<{
    date: string;
    credits_used: number;
    actions_count: number;
  }>;
  current_period: {
    start_date: string;
    end_date: string;
    credits_used: number;
    credits_remaining: number;
  };
}

// User API types
export interface UpdateProfileRequest {
  full_name?: string;
  avatar_url?: string;
}

export interface UpdateProfileResponse {
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    subscription_tier: string;
    credits_remaining: number;
  };
}

// Dashboard API types
export interface GetDashboardStatsResponse {
  total_contracts: number;
  total_analyses: number;
  credits_used_this_month: number;
  credits_remaining: number;
  recent_contracts: Array<{
    id: string;
    title: string;
    status: string;
    risk_score?: number;
    created_at: string;
  }>;
  risk_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  monthly_usage: Array<{
    month: string;
    contracts: number;
    analyses: number;
  }>;
}

// Contact API types
export interface ContactFormRequest {
  name: string;
  email: string;
  company?: string;
  message: string;
  subject?: string;
}

export interface ContactFormResponse {
  message: string;
  ticket_id?: string;
}

// Webhook types
export interface PaystackWebhookEvent {
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
    metadata: Record<string, any>;
    log: {
      start_time: number;
      time_spent: number;
      attempts: number;
      errors: number;
      success: boolean;
      mobile: boolean;
      input: any[];
      history: Array<{
        type: string;
        message: string;
        time: number;
      }>;
    };
    fees: number;
    fees_split: any;
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
      account_name: string;
    };
    customer: {
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      customer_code: string;
      phone: string;
      metadata: Record<string, any>;
      risk_action: string;
      international_format_phone: string;
    };
    plan: any;
    split: Record<string, any>;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

// Error response types
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

// Generic API response wrapper
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedApiResponse<T> extends ApiSuccessResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}