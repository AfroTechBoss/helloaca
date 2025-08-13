'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Force dynamic rendering to prevent build issues with searchParams
export const dynamic = 'force-dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type CallbackStatus = 'processing' | 'success' | 'error'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [error, setError] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        // Handle error from auth provider
        if (error) {
          setError(errorDescription || error)
          setStatus('error')
          toast.error('Authentication failed')
          return
        }
        
        // Handle successful auth code
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            setError(exchangeError.message)
            setStatus('error')
            toast.error('Failed to complete authentication')
            return
          }
          
          if (data.session) {
            setStatus('success')
            toast.success('Successfully authenticated!')
            
            // Redirect to dashboard or intended page
            const redirectTo = searchParams.get('redirectTo') || '/dashboard'
            setTimeout(() => {
              router.push(redirectTo)
            }, 1500)
            return
          }
        }
        
        // Handle other auth callbacks (like email confirmation)
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const type = searchParams.get('type')
        
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            setError(sessionError.message)
            setStatus('error')
            toast.error('Failed to set session')
            return
          }
          
          setStatus('success')
          
          // Handle different callback types
          switch (type) {
            case 'signup':
              toast.success('Email verified successfully!')
              setTimeout(() => {
                router.push('/dashboard')
              }, 1500)
              break
            case 'recovery':
              toast.success('Password reset link verified!')
              setTimeout(() => {
                router.push('/auth/reset-password')
              }, 1500)
              break
            default:
              toast.success('Authentication successful!')
              setTimeout(() => {
                router.push('/dashboard')
              }, 1500)
              break
          }
          return
        }
        
        // If no valid parameters found, redirect to sign in
        setError('Invalid authentication callback')
        setStatus('error')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
        
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('An unexpected error occurred')
        setStatus('error')
        toast.error('Authentication failed')
        
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    }
    
    handleAuthCallback()
  }, [searchParams, router])
  
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-500 mx-auto" />
      default:
        return <Loader2 className="h-16 w-16 text-blue-500 mx-auto animate-spin" />
    }
  }
  
  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing authentication...'
      case 'success':
        return 'Authentication successful!'
      case 'error':
        return 'Authentication failed'
      default:
        return 'Processing authentication...'
    }
  }
  
  const getStatusDescription = () => {
    switch (status) {
      case 'processing':
        return 'Please wait while we complete your authentication.'
      case 'success':
        return 'You have been successfully authenticated. Redirecting you now...'
      case 'error':
        return 'There was an issue with your authentication. You will be redirected to sign in.'
      default:
        return 'Please wait while we complete your authentication.'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {getStatusIcon()}
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">
              {getStatusTitle()}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            {getStatusDescription()}
          </p>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Redirecting...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}