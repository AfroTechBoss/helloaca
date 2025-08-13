'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, metadata?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    subscribe_newsletter?: boolean;
  }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  updatePassword: (password: string, token?: string) => Promise<{ error?: string }>
  resendVerification: (email: string) => Promise<{ error?: string }>
  updateProfile: (data: { full_name?: string; avatar_url?: string }) => Promise<{ error?: string }>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Handle different auth events
        switch (event) {
          case 'SIGNED_OUT':
            toast.success('Successfully signed out!')
            break
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed')
            break
          case 'USER_UPDATED':
            toast.success('Profile updated successfully!')
            break
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      toast.success('Successfully signed in!')
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    subscribe_newsletter?: boolean;
  }) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: metadata?.first_name,
            last_name: metadata?.last_name,
            company: metadata?.company,
            subscribe_newsletter: metadata?.subscribe_newsletter,
            full_name: metadata?.first_name && metadata?.last_name 
              ? `${metadata.first_name} ${metadata.last_name}` 
              : undefined,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      toast.success('Check your email for the confirmation link!')
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      toast.success('Check your email for the password reset link!')
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }

  const updateProfile = async (data: { full_name?: string; avatar_url?: string }) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        data,
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      toast.success('Verification email sent! Please check your inbox.')
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }

  const updatePassword = async (password: string, token?: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        toast.error(error.message)
        return { error: error.message }
      }

      toast.success('Password updated successfully!')
      return {}
    } catch (error) {
      const errorMessage = 'An unexpected error occurred'
      toast.error(errorMessage)
      return { error: errorMessage }
    }
  }

  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
      }
    } catch (error) {
      console.error('Error in refreshSession:', error)
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper hooks for common auth checks
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])
  
  return { user, loading }
}

export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])
  
  return { user, loading }
}