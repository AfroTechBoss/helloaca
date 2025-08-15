import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { corsHeaders, withErrorHandler } from '@/lib/api-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get contract analysis
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

    // Get analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('contract_id', contractId)
      .eq('user_id', user.id)
      .single();

    if (analysisError && analysisError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
    }

    if (!analysis) {
      return NextResponse.json({ 
        analysis: null,
        riskClauses: [],
        missingClauses: []
      }, {
        headers: corsHeaders()
      });
    }

    // Get risk clauses
    const { data: riskClauses, error: riskError } = await supabase
      .from('risk_clauses')
      .select('*')
      .eq('analysis_id', analysis.id)
      .order('risk_level', { ascending: false });

    if (riskError) {
      console.error('Error fetching risk clauses:', riskError);
    }

    // Get missing clauses
    const { data: missingClauses, error: missingError } = await supabase
      .from('missing_clauses')
      .select('*')
      .eq('analysis_id', analysis.id)
      .order('importance', { ascending: false });

    if (missingError) {
      console.error('Error fetching missing clauses:', missingError);
    }

    return NextResponse.json({
      analysis,
      riskClauses: riskClauses || [],
      missingClauses: missingClauses || []
    }, {
      headers: corsHeaders()
    });
  });
}

// Create or update analysis
export async function POST(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;
    const analysisData = await request.json();

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

    // Create or update analysis
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .upsert({
        contract_id: contractId,
        user_id: user.id,
        ...analysisData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error creating/updating analysis:', analysisError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // Update contract status
    await supabase
      .from('contracts')
      .update({ 
        status: 'completed',
        analysis_id: analysis.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .eq('user_id', user.id);

    return NextResponse.json({ analysis }, {
      headers: corsHeaders()
    });
  });
}

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
};