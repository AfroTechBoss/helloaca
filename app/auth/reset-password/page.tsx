'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

type Step = 'request' | 'reset' | 'success'

const passwordRequirements = [
  { label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
  { label: 'Contains uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { label: 'Contains lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
  { label: 'Contains number', test: (pwd: string) => /\d/.test(pwd) },
  { label: 'Contains special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
]

// Force dynamic rendering to prevent build issues with searchParams
export const dynamic = 'force-dynamic'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword, updatePassword } = useAuth()
  const [step, setStep] = useState<Step>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const token = searchParams.get('token')
  const emailFromUrl = searchParams.get('email')

  useEffect(() => {
    // If there's a token in the URL, go directly to reset step
    if (token) {
      setStep('reset')
      if (emailFromUrl) {
        setEmail(emailFromUrl)
      }
    }
  }, [token, emailFromUrl])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error)
        return
      }

      toast.success('Password reset email sent! Please check your inbox.')
      setStep('success')
    } catch {
        setError('Failed to send reset email. Please try again.')
      } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('Password is required')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!passwordRequirements.every(req => req.test(password))) {
      setError('Password does not meet all requirements')
      return
    }

    if (!token) {
      setError('Invalid reset token')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await updatePassword(password, token)
      
      if (error) {
        setError(error)
        return
      }

      toast.success('Password updated successfully!')
      router.push('/auth/signin?message=Password updated successfully')
    } catch {
        setError('Failed to reset password. Please try again.')
      } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const metRequirements = passwordRequirements.filter(req => req.test(password)).length
    if (metRequirements === 0) return { strength: 0, label: '', color: '' }
    if (metRequirements <= 2) return { strength: 25, label: 'Weak', color: 'bg-red-500' }
    if (metRequirements <= 3) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' }
    if (metRequirements <= 4) return { strength: 75, label: 'Good', color: 'bg-blue-500' }
    return { strength: 100, label: 'Strong', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength()

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

        {/* Reset Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              {step !== 'request' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('request')}
                  className="p-0 h-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <CardTitle>
                  {step === 'request' && 'Reset your password'}
                  {step === 'reset' && 'Create new password'}
                  {step === 'success' && 'Check your email'}
                </CardTitle>
                <CardDescription>
                  {step === 'request' && 'Enter your email address and we&apos;ll send you a link to reset your password'}
                  {step === 'reset' && 'Enter your new password below'}
                  {step === 'success' && `We&apos;ve sent a password reset link to ${email}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Request Reset Step */}
            {step === 'request' && (
              <form onSubmit={handleRequestReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Enter your email address"
                      className="pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </Button>
              </form>
            )}

            {/* Reset Password Step */}
            {step === 'reset' && (
              <form onSubmit={handlePasswordReset} className="space-y-6">
                {email && (
                  <div className="text-sm text-gray-600 mb-4">
                    Resetting password for: <strong>{email}</strong>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Create a strong password"
                      className="pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Password Strength */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Password strength:</span>
                        <span className={`font-medium ${
                          passwordStrength.strength <= 25 ? 'text-red-600' :
                          passwordStrength.strength <= 50 ? 'text-yellow-600' :
                          passwordStrength.strength <= 75 ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                      <div className="space-y-1">
                        {passwordRequirements.map((req, index) => {
                          const isMet = req.test(password)
                          return (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              {isMet ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border border-gray-300" />
                              )}
                              <span className={isMet ? 'text-green-600' : 'text-gray-500'}>
                                {req.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (error) setError('')
                      }}
                      placeholder="Confirm your new password"
                      className="pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !password || password !== confirmPassword}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    'Update password'
                  )}
                </Button>
              </form>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    We&apos;ve sent a password reset link to your email address.
                    Click the link in the email to reset your password.
                  </p>
                  <p className="text-xs text-gray-500">
                    If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setStep('request')}
                    variant="outline"
                    className="w-full"
                  >
                    Send another email
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to sign in
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back to Sign In */}
        {step === 'request' && (
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
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>Please wait while we load the reset password form.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}