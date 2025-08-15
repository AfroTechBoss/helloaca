import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { corsHeaders, withErrorHandler } from '@/lib/api-middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get contract details
export async function GET(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;

    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract, {
      headers: corsHeaders()
    });
  });
}

// Update contract
export async function PATCH(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;
    const updates = await request.json();

    // Verify user owns the contract
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Update contract
    const { data: contract, error: updateError } = await supabase
      .from('contracts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
    }

    return NextResponse.json(contract, {
      headers: corsHeaders()
    });
  });
}

// Delete contract
export async function DELETE(request: NextRequest, { params }: { params: { contractId: string } }) {
  return withErrorHandler(async () => {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contractId } = params;

    // Verify user owns the contract
    const { data: existingContract, error: checkError } = await supabase
      .from('contracts')
      .select('id')
      .eq('id', contractId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingContract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Delete contract (this will cascade delete related records)
    const { error: deleteError } = await supabase
      .from('contracts')
      .delete()
      .eq('id', contractId)
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contract deleted successfully' }, {
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