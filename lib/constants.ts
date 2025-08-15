// Application constants
export const APP_CONFIG = {
  name: 'helloaca - Hello AI Contract Analyzer',
  description: 'Professional AI-powered contract analysis platform',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  supportEmail: process.env.SUPPORT_EMAIL || 'support@helloaca.xyz',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@aca.helloaca.xyz',
};

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile',
    resetPassword: '/api/auth/reset-password',
  },
  contracts: {
    upload: '/api/contracts/upload',
    list: '/api/contracts',
    detail: '/api/contracts/[id]',
    analyze: '/api/contracts/[id]/analyze',
    delete: '/api/contracts/[id]',
  },
  analysis: {
    create: '/api/analysis',
    detail: '/api/analysis/[id]',
    export: '/api/analysis/[id]/export',
  },
  billing: {
    plans: '/api/billing/plans',
    subscribe: '/api/billing/subscribe',
    cancel: '/api/billing/cancel',
    webhook: '/api/billing/webhook',
    usage: '/api/billing/usage',
  },
  dashboard: {
    stats: '/api/dashboard/stats',
    recent: '/api/dashboard/recent',
  },
  contact: '/api/contact',
};

// File upload configuration
export const FILE_CONFIG = {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.txt'],
};

// Contract analysis configuration
export const ANALYSIS_CONFIG = {
  riskScoreRange: { min: 0, max: 10 },
  processingTimeout: 300000, // 5 minutes
  maxRetries: 3,
  batchSize: 5,
};

// Subscription plans
export const PLAN_LIMITS = {
  free: {
    contractsPerMonth: 3,
    fileSizeMB: 10,
    storageGB: 1,
    apiCalls: 0,
    support: 'standard',
  },
  starter: {
    contractsPerMonth: 25,
    fileSizeMB: 25,
    storageGB: 5,
    apiCalls: 100,
    support: 'priority',
  },
  professional: {
    contractsPerMonth: 100,
    fileSizeMB: 50,
    storageGB: 20,
    apiCalls: 1000,
    support: 'priority',
  },
  enterprise: {
    contractsPerMonth: -1, // unlimited
    fileSizeMB: 100,
    storageGB: 100,
    apiCalls: -1, // unlimited
    support: 'dedicated',
  },
};

// Rate limiting
export const RATE_LIMITS = {
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // uploads per minute
  },
  analysis: {
    windowMs: 60 * 1000, // 1 minute
    max: 3, // analyses per minute
  },
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts per window
  },
};

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  user: 300, // 5 minutes
  contracts: 600, // 10 minutes
  analysis: 1800, // 30 minutes
  dashboard: 300, // 5 minutes
  plans: 3600, // 1 hour
  usage: 300, // 5 minutes
};

// Navigation items
export const NAVIGATION = {
  main: [
    { name: 'Features', href: '/#features' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ],
  dashboard: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Contracts', href: '/dashboard/contracts', icon: 'FileText' },
    { name: 'Analysis', href: '/dashboard/analysis', icon: 'BarChart3' },
    { name: 'Templates', href: '/dashboard/templates', icon: 'FileTemplate' },
    { name: 'Billing', href: '/dashboard/billing', icon: 'CreditCard' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
  ],
  footer: {
    product: [
      { name: 'Features', href: '/#features' },
      { name: 'Pricing', href: '/#pricing' },
      { name: 'API', href: '/api-docs' },
      { name: 'Templates', href: '/templates' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Careers', href: '/careers' },
      { name: 'Contact', href: '/contact' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Documentation', href: '/docs' },
      { name: 'Status', href: '/status' },
      { name: 'Community', href: '/community' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Security', href: '/security' },
      { name: 'Compliance', href: '/compliance' },
    ],
  },
};

// Risk assessment categories
export const RISK_CATEGORIES = {
  financial: {
    name: 'Financial Risk',
    description: 'Payment terms, penalties, and financial obligations',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  legal: {
    name: 'Legal Risk',
    description: 'Liability, indemnification, and legal compliance',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  operational: {
    name: 'Operational Risk',
    description: 'Performance obligations and operational constraints',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  compliance: {
    name: 'Compliance Risk',
    description: 'Regulatory and compliance requirements',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  termination: {
    name: 'Termination Risk',
    description: 'Contract termination and exit clauses',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
};

// Contract types
export const CONTRACT_TYPES = [
  'Service Agreement',
  'Employment Contract',
  'Non-Disclosure Agreement',
  'Software License',
  'Consulting Agreement',
  'Partnership Agreement',
  'Vendor Agreement',
  'Lease Agreement',
  'Purchase Agreement',
  'Distribution Agreement',
  'Franchise Agreement',
  'Joint Venture Agreement',
  'Other',
];

// Export formats
export const EXPORT_FORMATS = {
  pdf: {
    name: 'PDF Report',
    description: 'Professional PDF report with analysis results',
    extension: '.pdf',
    mimeType: 'application/pdf',
  },
  docx: {
    name: 'Word Document',
    description: 'Editable Word document with analysis results',
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  json: {
    name: 'JSON Data',
    description: 'Raw analysis data in JSON format',
    extension: '.json',
    mimeType: 'application/json',
  },
  csv: {
    name: 'CSV Export',
    description: 'Spreadsheet-compatible CSV format',
    extension: '.csv',
    mimeType: 'text/csv',
  },
};

// Status indicators
export const STATUS_CONFIG = {
  contract: {
    pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    analyzing: { label: 'Analyzing', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' },
    failed: { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' },
  },
  subscription: {
    active: { label: 'Active', color: 'text-green-600', bgColor: 'bg-green-100' },
    inactive: { label: 'Inactive', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100' },
    past_due: { label: 'Past Due', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  },
};

// Feature flags
export const FEATURES = {
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableChat: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
  enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  enableBetaFeatures: process.env.NEXT_PUBLIC_ENABLE_BETA_FEATURES === 'true',
  enableApiAccess: process.env.NEXT_PUBLIC_ENABLE_API_ACCESS === 'true',
  enableTeamFeatures: process.env.NEXT_PUBLIC_ENABLE_TEAM_FEATURES === 'true',
};

// Social media links
export const SOCIAL_LINKS = {
  twitter: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://twitter.com/aca',
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || 'https://linkedin.com/company/aca',
  github: process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/aca',
  facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com/aca',
};

// Error messages
export const ERROR_MESSAGES = {
  auth: {
    invalidCredentials: 'Invalid email or password',
    userNotFound: 'User not found',
    emailAlreadyExists: 'Email already exists',
    weakPassword: 'Password must be at least 8 characters long',
    invalidEmail: 'Please enter a valid email address',
  },
  file: {
    invalidType: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.',
    tooLarge: 'File size too large. Maximum size is 50MB.',
    tooSmall: 'File size too small. Minimum size is 1KB.',
    uploadFailed: 'File upload failed. Please try again.',
  },
  analysis: {
    failed: 'Contract analysis failed. Please try again.',
    timeout: 'Analysis timed out. Please try again with a smaller file.',
    quotaExceeded: 'Monthly analysis quota exceeded. Please upgrade your plan.',
  },
  payment: {
    failed: 'Payment failed. Please try again.',
    cancelled: 'Payment was cancelled.',
    invalidCard: 'Invalid card details.',
  },
  general: {
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: 'The requested resource was not found.',
  },
};

// Success messages
export const SUCCESS_MESSAGES = {
  auth: {
    loginSuccess: 'Successfully logged in',
    registerSuccess: 'Account created successfully',
    logoutSuccess: 'Successfully logged out',
    passwordReset: 'Password reset email sent',
  },
  contract: {
    uploadSuccess: 'Contract uploaded successfully',
    analysisComplete: 'Contract analysis completed',
    deleteSuccess: 'Contract deleted successfully',
  },
  billing: {
    subscriptionSuccess: 'Subscription activated successfully',
    cancellationSuccess: 'Subscription cancelled successfully',
    paymentSuccess: 'Payment processed successfully',
  },
  general: {
    saveSuccess: 'Changes saved successfully',
    copySuccess: 'Copied to clipboard',
    exportSuccess: 'Report exported successfully',
  },
};

// Loading messages
export const LOADING_MESSAGES = {
  auth: {
    login: 'Signing in...',
    register: 'Creating account...',
    logout: 'Signing out...',
  },
  contract: {
    upload: 'Uploading contract...',
    analyze: 'Analyzing contract...',
    delete: 'Deleting contract...',
  },
  billing: {
    subscribe: 'Processing subscription...',
    cancel: 'Cancelling subscription...',
    payment: 'Processing payment...',
  },
  general: {
    save: 'Saving...',
    load: 'Loading...',
    export: 'Exporting...',
  },
};

// Regex patterns
export const REGEX_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[1-9]?[0-9]{7,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};

// Date formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  api: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  filename: 'yyyyMMdd_HHmmss',
};

// Animation durations (in milliseconds)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Breakpoints (matching Tailwind CSS)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};