import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { corsHeaders, withErrorHandler } from '@/lib/api-middleware';
import { analyzeContractQuestion } from '@/lib/anthropic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get chat history for a contract
export async function GET(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;

    // Verify user owns the contract
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, title')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get or create chat session
    let { data: chat, error: chatError } = await supabase
      .from('contract_chats')
      .select('*')
      .eq('contract_id', contractId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (chatError && chatError.code === 'PGRST116') {
      // No chat exists, create one
      const { data: newChat, error: createError } = await supabase
        .from('contract_chats')
        .insert({
          contract_id: contractId,
          user_id: user.id,
          title: `Discussion: ${contract.title}`
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
      }
      chat = newChat;
    } else if (chatError) {
      return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
    }

    // Get chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      chat,
      messages: messages || []
    }, {
      headers: corsHeaders()
    });
  });
}

// Send a new message
export async function POST(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Verify user owns the contract and get contract data
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('id, title, content_preview, file_url')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Get or create chat session
    let { data: chat, error: chatError } = await supabase
      .from('contract_chats')
      .select('*')
      .eq('contract_id', contractId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (chatError && chatError.code === 'PGRST116') {
      // No chat exists, create one
      const { data: newChat, error: createError } = await supabase
        .from('contract_chats')
        .insert({
          contract_id: contractId,
          user_id: user.id,
          title: `Discussion: ${contract.title}`
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
      }
      chat = newChat;
    } else if (chatError) {
      return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
    }

    // Save user message
    const { data: userMessage, error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chat.id,
        role: 'user',
        content: message.trim()
      })
      .select()
      .single();

    if (userMessageError) {
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    // Get contract analysis for context
    const { data: analysis } = await supabase
      .from('analyses')
      .select(`
        *,
        risk_clauses(*),
        missing_clauses(*)
      `)
      .eq('contract_id', contractId)
      .single();

    // Generate AI response
    try {
      const aiResponse = await analyzeContractQuestion(
        message.trim(),
        contract.content_preview || '',
        analysis
      );

      // Save AI response
      const { data: assistantMessage, error: assistantMessageError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chat.id,
          role: 'assistant',
          content: aiResponse.answer,
          referenced_clauses: aiResponse.referencedClauses || null,
          metadata: {
            confidence: aiResponse.confidence || 0.8,
            sources: aiResponse.sources || []
          }
        })
        .select()
        .single();

      if (assistantMessageError) {
        return NextResponse.json({ error: 'Failed to save AI response' }, { status: 500 });
      }

      return NextResponse.json({
        userMessage,
        assistantMessage
      }, {
        headers: corsHeaders()
      });
    } catch (error) {
      console.error('AI response error:', error);
      
      // Save fallback response
      const { data: assistantMessage } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chat.id,
          role: 'assistant',
          content: 'I apologize, but I\'m having trouble analyzing your question right now. Please try again or rephrase your question.'
        })
        .select()
        .single();

      return NextResponse.json({
        userMessage,
        assistantMessage
      }, {
        headers: corsHeaders()
      });
    }
  });
}

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
};