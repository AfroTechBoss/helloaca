// Core application types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing';
  credits_remaining: number;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  content: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  analysis_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ContractAnalysis {
  id: string;
  contract_id: string;
  user_id: string;
  risk_score: number;
  overall_assessment: string;
  high_risk_clauses: HighRiskClause[];
  missing_protections: MissingProtection[];
  recommendations: string[];
  analysis_duration_ms: number;
  model_used: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface HighRiskClause {
  id: string;
  clause_text: string;
  risk_level: 'high' | 'medium' | 'low';
  risk_category: string;
  explanation: string;
  suggested_revision: string;
  line_number?: number;
  section?: string;
}

export interface MissingProtection {
  id: string;
  protection_type: string;
  importance: 'critical' | 'important' | 'recommended';
  description: string;
  suggested_clause: string;
  legal_impact: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  credits_included?: number;
  features: string[];
  is_popular?: boolean;
  stripe_price_id?: string;
  paystack_plan_code?: string;
  limits?: {
    contracts_per_month: number;
    file_size_mb: number;
    storage_gb: number;
  };
  created_at?: string;
}

export interface Usage {
  id: string;
  user_id: string;
  action_type: 'contract_upload' | 'analysis_request' | 'export_report';
  credits_used: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
}

export interface SubscriptionFormData {
  plan_id: string;
  payment_method: 'stripe' | 'paystack';
  billing_interval: 'month' | 'year';
}

// UI Component types
export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  disabled?: boolean;
  external?: boolean;
}

export interface DashboardConfig {
  mainNav: NavItem[];
  sidebarNav: NavItem[];
}

// Analysis types
export interface AnalysisProgress {
  stage: 'uploading' | 'processing' | 'analyzing' | 'generating' | 'completed';
  progress: number;
  message: string;
}

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  template_url?: string;
  is_premium: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp?: string;
}

// File upload types
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

// Export report types
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'json';
  include_recommendations: boolean;
  include_risk_analysis: boolean;
  include_missing_protections: boolean;
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  expires_at: string;
}