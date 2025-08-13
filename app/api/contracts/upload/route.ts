import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from '@/lib/supabase';
import { checkSubscriptionLimits, ApiErrorResponse, logRequest, corsHeaders, withErrorHandler } from '@/lib/api-middleware';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  contract_type: z.enum(['employment', 'service', 'nda', 'partnership', 'lease', 'other']),
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const contractType = formData.get('contractType') as string;

  // Validate required fields
  if (!file || !title || !contractType) {
    throw new ApiErrorResponse('Missing required fields: file, title, contractType', 400, 'MISSING_FIELDS');
  }

  // Validate file type
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new ApiErrorResponse(
      'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.',
      400,
      'INVALID_FILE_TYPE'
    );
  }

  // Check subscription limits
  const subscriptionCheck = await checkSubscriptionLimits(user.id, 'contract', file.size);
  if (!subscriptionCheck.allowed) {
    throw new ApiErrorResponse(
      subscriptionCheck.reason || 'Subscription limit exceeded',
      403,
      'SUBSCRIPTION_LIMIT_EXCEEDED',
      {
        limit: subscriptionCheck.limit,
        current: subscriptionCheck.current
      }
    );
  }

    // Validate form data
    const validationResult = uploadSchema.safeParse({
      title,
      description,
      contract_type: contractType,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

  // Upload file to Vercel Blob
  const blob = await put(file.name, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN!,
  });

  // Save contract metadata to database
  const { data: contract, error: dbError } = await supabase
    .from('contracts')
    .insert({
      user_id: user.id,
      title,
      description,
      contract_type: contractType,
      file_url: blob.url,
      file_name: file.name,
      file_size: file.size,
      status: 'uploaded'
    })
    .select()
    .single();

  if (dbError) {
    console.error('Database error:', dbError);
    throw new ApiErrorResponse('Failed to save contract metadata', 500, 'DATABASE_ERROR');
  }

  const response = NextResponse.json({
    message: 'Contract uploaded successfully',
    contract,
    usage: {
      current: subscriptionCheck.current! + 1,
      limit: subscriptionCheck.limit
    }
  });

  logRequest(request, response);
  return response;

  } catch (error) {
    return withErrorHandler(() => { throw error; })();
  }
}

// Handle OPTIONS for CORS
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
};