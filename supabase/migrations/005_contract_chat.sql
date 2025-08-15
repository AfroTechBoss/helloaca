-- Contract Chat Feature Migration
-- Add tables for storing chat conversations and messages about contracts

-- Create message types
CREATE TYPE message_role AS ENUM ('user', 'assistant');
CREATE TYPE chat_status AS ENUM ('active', 'archived');

-- 1. Contract Chat Sessions table
CREATE TABLE public.contract_chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'Contract Discussion',
    status chat_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on contract_chats table
ALTER TABLE public.contract_chats ENABLE ROW LEVEL SECURITY;

-- RLS policies for contract_chats table
CREATE POLICY "Users can view own contract chats" ON public.contract_chats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contract chats" ON public.contract_chats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contract chats" ON public.contract_chats
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contract chats" ON public.contract_chats
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Chat Messages table
CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES public.contract_chats(id) ON DELETE CASCADE NOT NULL,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    referenced_clauses JSONB, -- Store references to specific contract sections
    metadata JSONB, -- Store additional context like confidence scores, sources
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on chat_messages table
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_messages table
CREATE POLICY "Users can view messages for own chats" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contract_chats 
            WHERE contract_chats.id = chat_messages.chat_id 
            AND contract_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for own chats" ON public.chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.contract_chats 
            WHERE contract_chats.id = chat_messages.chat_id 
            AND contract_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages for own chats" ON public.chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contract_chats 
            WHERE contract_chats.id = chat_messages.chat_id 
            AND contract_chats.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages for own chats" ON public.chat_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.contract_chats 
            WHERE contract_chats.id = chat_messages.chat_id 
            AND contract_chats.user_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_contract_chats_contract_id ON public.contract_chats(contract_id);
CREATE INDEX idx_contract_chats_user_id ON public.contract_chats(user_id);
CREATE INDEX idx_chat_messages_chat_id ON public.chat_messages(chat_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_chats_updated_at
    BEFORE UPDATE ON public.contract_chats
    FOR EACH ROW EXECUTE FUNCTION update_contract_chat_updated_at();

-- Grant permissions
GRANT ALL PRIVILEGES ON public.contract_chats TO authenticated;
GRANT ALL PRIVILEGES ON public.chat_messages TO authenticated;
GRANT SELECT ON public.contract_chats TO anon;
GRANT SELECT ON public.chat_messages TO anon;