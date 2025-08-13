'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Force dynamic rendering to prevent build issues with searchParams
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Mail, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, resendVerification } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)

  const email = searchParams.get('email') || user?.email || ''
  const token = searchParams.get('token')

  const verifyToken = async (verificationToken: string) => {
    // Skip verification during build time
    if (typeof window === 'undefined') {
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      // Simulate email verification API call
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }

      setSuccess('Email verified successfully!')
      toast.success('Email verified! Redirecting to dashboard...')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Skip during build time
    if (typeof window === 'undefined') {
      return
    }
    
    // If user is already verified, redirect to dashboard
    if (user?.email_confirmed_at) {
      router.push('/dashboard')
      return
    }

    // If there's a token in the URL, verify it automatically
    if (token) {
      verifyToken(token)
    }
  }, [user, token, router])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address is required')
      return
    }

    setIsResending(true)
    setError('')
    
    try {
      const result = await resendVerification(email)
      
      if (result?.error) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to resend verification email')
        return
      }

      toast.success('Verification email sent! Please check your inbox.')
      setCountdown(60) // 60 second cooldown
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  const handleChangeEmail = () => {
    router.push('/auth/signup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">helloaca</span>
          </Link>
        </div>

        {/* Verification Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {success ? (
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-600" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {success ? 'Email Verified!' : 'Verify your email'}
            </CardTitle>
            <CardDescription>
              {success ? (
                'Your email has been successfully verified. You will be redirected to the dashboard shortly.'
              ) : (
                <>We&apos;ve sent a verification link to <strong>{email}</strong></>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Verifying your email...</span>
              </div>
            )}

            {!success && !isLoading && (
              <>
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    Click the verification link in your email to activate your account.
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={handleResendVerification}
                      disabled={isResending || countdown > 0}
                      variant="outline"
                      className="w-full"
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : countdown > 0 ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend in {countdown}s
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Resend verification email
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={handleChangeEmail}
                      variant="ghost"
                      className="w-full"
                    >
                      Use a different email address
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="text-center space-y-4">
                    <h3 className="font-medium text-gray-900">Having trouble?</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>&bull; Check your spam or junk folder</p>
                      <p>&bull; Make sure {email} is correct</p>
                      <p>&bull; Wait a few minutes for the email to arrive</p>
                      <p>&bull; Try resending the verification email</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Still need help?{' '}
                      <Link href="/contact" className="text-blue-600 hover:text-blue-500">
                        Contact support
                      </Link>
                    </p>
                  </div>
                </div>
              </>
            )}

            {success && (
              <div className="text-center">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Sign In */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}