import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/contracts',
  '/analysis',
  '/settings',
  '/billing',
  '/profile'
]

// Define auth routes that should redirect to dashboard if user is authenticated
const authRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/reset-password'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/privacy',
  '/terms',
  '/auth/verify-email',
  '/auth/callback'
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl

  try {
    // Get the current session
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('Middleware auth error:', error)
    }

    const isAuthenticated = !!session?.user
    const isProtectedRoute = protectedRoutes.some(route => 
      pathname.startsWith(route)
    )
    const isAuthRoute = authRoutes.some(route => 
      pathname.startsWith(route)
    )
    const isPublicRoute = publicRoutes.some(route => 
      pathname === route || pathname.startsWith(route)
    )

    // Handle protected routes
    if (isProtectedRoute && !isAuthenticated) {
      const redirectUrl = new URL('/auth/signin', req.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes - redirect to dashboard if already authenticated
    if (isAuthRoute && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Handle API routes
    if (pathname.startsWith('/api/')) {
      // Allow public API routes
      if (pathname.startsWith('/api/auth/') || 
          pathname.startsWith('/api/webhook/') ||
          pathname === '/api/health') {
        return res
      }

      // Protect other API routes
      if (!isAuthenticated) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Allow access to public routes
    if (isPublicRoute) {
      return res
    }

    // Default behavior - allow the request to continue
    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue to avoid breaking the app
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}