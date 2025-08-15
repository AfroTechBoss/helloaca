import { supabaseAdmin } from '@/lib/supabase'
import { Database } from '@/types/database'

if (!supabaseAdmin) {
  throw new Error('Supabase admin client not configured')
}

type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row']
type UserSubscriptionInsert = Database['public']['Tables']['user_subscriptions']['Insert']
type UserSubscriptionUpdate = Database['public']['Tables']['user_subscriptions']['Update']

export class SubscriptionService {
  private supabase = supabaseAdmin

  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    if (!userId || !this.supabase) {
      return null
    }

    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching user subscription:', error)
      return null
    }

    return data
  }

  async createUserSubscription(userId: string): Promise<UserSubscription | null> {
    if (!userId || !this.supabase) {
      return null
    }

    const { data, error } = await this.supabase
      .from('user_subscriptions')
      .insert({ user_id: userId })
      .select()
      .single()

    if (error) {
      console.error('Error creating user subscription:', error)
      return null
    }

    return data
  }

  async canUserAnalyze(userId: string): Promise<{ canAnalyze: boolean; reason?: string; subscription?: UserSubscription }> {
    let subscription = await this.getUserSubscription(userId)
    
    // Create subscription if it doesn't exist
    if (!subscription) {
      subscription = await this.createUserSubscription(userId)
      if (!subscription) {
        return { canAnalyze: false, reason: 'Failed to create subscription record' }
      }
    }

    // Check if user has a paid subscription
    if (subscription.subscription_type !== 'trial') {
      return { canAnalyze: true, subscription }
    }

    // Check trial limits
    if (subscription.trial_analyses_used >= subscription.trial_analyses_limit) {
      return { 
        canAnalyze: false, 
        reason: `You've used all ${subscription.trial_analyses_limit} free analyses. Please upgrade to continue.`,
        subscription 
      }
    }

    return { canAnalyze: true, subscription }
  }

  async incrementTrialUsage(userId: string): Promise<boolean> {
    if (!userId || !this.supabase) {
      return false
    }

    // Get current subscription
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) {
      return false
    }

    // Increment trial usage
    const { error } = await this.supabase
      .from('user_subscriptions')
      .update({ trial_analyses_used: subscription.trial_analyses_used + 1 })
      .eq('user_id', userId)

    if (error) {
      console.error('Error incrementing trial usage:', error)
      return false
    }

    return true
  }

  async updateSubscription(userId: string, updates: UserSubscriptionUpdate): Promise<boolean> {
    if (!userId || !updates || !this.supabase) {
      return false
    }

    const { error } = await this.supabase
      .from('user_subscriptions')
      .update(updates)
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating subscription:', error)
      return false
    }

    return true
  }

  async upgradeSubscription(userId: string, subscriptionType: 'basic' | 'premium', paystackData: {
    customer_code: string
    subscription_code: string
    current_period_start: string
    current_period_end: string
  }): Promise<boolean> {
    if (!userId || !subscriptionType || !paystackData || !this.supabase) {
      return false
    }

    const { error } = await this.supabase
      .from('user_subscriptions')
      .update({
        subscription_type: subscriptionType,
        subscription_status: 'active',
        paystack_customer_code: paystackData.customer_code,
        paystack_subscription_code: paystackData.subscription_code,
        current_period_start: paystackData.current_period_start,
        current_period_end: paystackData.current_period_end
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error upgrading subscription:', error)
      return false
    }

    return true
  }

  isTrialUser(subscription: UserSubscription): boolean {
    return subscription.subscription_type === 'trial'
  }

  getRemainingTrials(subscription: UserSubscription): number {
    if (subscription.subscription_type !== 'trial') return Infinity
    return Math.max(0, subscription.trial_analyses_limit - subscription.trial_analyses_used)
  }

  // Apply trial restrictions to analysis results
  applyTrialRestrictions<T extends { risks?: any[]; clauses?: any[]; recommendations?: any[] }>(data: T, subscription: UserSubscription): T {
    if (!this.isTrialUser(subscription)) {
      return data // No restrictions for paid users
    }

    const restrictedData = { ...data }

    // Limit risks shown to first 2-3 items
    if (restrictedData.risks && restrictedData.risks.length > 3) {
      restrictedData.risks = restrictedData.risks.slice(0, 3)
    }

    // Limit clauses shown to first 3 items
    if (restrictedData.clauses && restrictedData.clauses.length > 3) {
      restrictedData.clauses = restrictedData.clauses.slice(0, 3)
    }

    // Limit recommendations to first 2 items
    if (restrictedData.recommendations && restrictedData.recommendations.length > 2) {
      restrictedData.recommendations = restrictedData.recommendations.slice(0, 2)
    }

    return restrictedData
  }
}

export const subscriptionService = new SubscriptionService()