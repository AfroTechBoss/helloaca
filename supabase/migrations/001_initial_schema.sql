-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');
CREATE TYPE plan_type AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE contract_status AS ENUM ('pending', 'analyzing', 'completed', 'failed');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    company_name TEXT,
    phone TEXT,
    credits INTEGER DEFAULT 10,
    subscription_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Contracts table
CREATE TABLE public.contracts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_preview TEXT,
    status contract_status DEFAULT 'pending',
    analysis_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contracts table
CREATE POLICY "Users can view own contracts" ON public.contracts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts" ON public.contracts
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Analyses table
CREATE TABLE public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    overall_risk_score INTEGER CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
    risk_level risk_level,
    summary TEXT,
    recommendations TEXT[],
    key_findings TEXT[],
    compliance_issues TEXT[],
    financial_implications JSONB,
    analysis_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on analyses table
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- RLS policies for analyses table
CREATE POLICY "Users can view own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON public.analyses
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Risk_clauses table
CREATE TABLE public.risk_clauses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    clause_text TEXT NOT NULL,
    risk_type TEXT NOT NULL,
    risk_level risk_level NOT NULL,
    explanation TEXT NOT NULL,
    suggested_revision TEXT,
    page_number INTEGER,
    line_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on risk_clauses table
ALTER TABLE public.risk_clauses ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_clauses table
CREATE POLICY "Users can view risk clauses for own analyses" ON public.risk_clauses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = risk_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert risk clauses for own analyses" ON public.risk_clauses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = risk_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update risk clauses for own analyses" ON public.risk_clauses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = risk_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete risk clauses for own analyses" ON public.risk_clauses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = risk_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

-- 5. Missing_clauses table
CREATE TABLE public.missing_clauses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    clause_type TEXT NOT NULL,
    importance risk_level NOT NULL,
    description TEXT NOT NULL,
    suggested_clause TEXT NOT NULL,
    legal_implications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on missing_clauses table
ALTER TABLE public.missing_clauses ENABLE ROW LEVEL SECURITY;

-- RLS policies for missing_clauses table
CREATE POLICY "Users can view missing clauses for own analyses" ON public.missing_clauses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = missing_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert missing clauses for own analyses" ON public.missing_clauses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = missing_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update missing clauses for own analyses" ON public.missing_clauses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = missing_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete missing clauses for own analyses" ON public.missing_clauses
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.analyses 
            WHERE analyses.id = missing_clauses.analysis_id 
            AND analyses.user_id = auth.uid()
        )
    );

-- 6. Subscriptions table
CREATE TABLE public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    plan_type plan_type NOT NULL DEFAULT 'free',
    status subscription_status NOT NULL DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    paystack_subscription_id TEXT,
    paystack_customer_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions table
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Payment_history table
CREATE TABLE public.payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'NGN',
    status payment_status NOT NULL DEFAULT 'pending',
    paystack_reference TEXT UNIQUE,
    paystack_transaction_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payment_history table
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_history table
CREATE POLICY "Users can view own payment history" ON public.payment_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment history" ON public.payment_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add foreign key constraint for users.subscription_id
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_subscription 
FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id) ON DELETE SET NULL;

-- Add foreign key constraint for contracts.analysis_id
ALTER TABLE public.contracts 
ADD CONSTRAINT fk_contracts_analysis 
FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_analyses_contract_id ON public.analyses(contract_id);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_risk_clauses_analysis_id ON public.risk_clauses(analysis_id);
CREATE INDEX idx_missing_clauses_analysis_id ON public.missing_clauses(analysis_id);
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_subscription_id ON public.payment_history(subscription_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON public.payment_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON public.users TO anon;
GRANT ALL PRIVILEGES ON public.users TO authenticated;

GRANT SELECT ON public.contracts TO anon;
GRANT ALL PRIVILEGES ON public.contracts TO authenticated;

GRANT SELECT ON public.analyses TO anon;
GRANT ALL PRIVILEGES ON public.analyses TO authenticated;

GRANT SELECT ON public.risk_clauses TO anon;
GRANT ALL PRIVILEGES ON public.risk_clauses TO authenticated;

GRANT SELECT ON public.missing_clauses TO anon;
GRANT ALL PRIVILEGES ON public.missing_clauses TO authenticated;

GRANT SELECT ON public.subscriptions TO anon;
GRANT ALL PRIVILEGES ON public.subscriptions TO authenticated;

GRANT SELECT ON public.payment_history TO anon;
GRANT ALL PRIVILEGES ON public.payment_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;