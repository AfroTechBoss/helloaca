import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  try {
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json(
        { error: 'Failed to sign out' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json(
      { message: 'Successfully signed out' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected sign out error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Handle GET requests by redirecting to sign in
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  return NextResponse.redirect(new URL('/auth/signin', requestUrl.origin))
}