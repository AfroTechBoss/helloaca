import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase'
import { subscriptionService } from '@/lib/subscription'
import {
  withErrorHandler,
  ApiErrorResponse,
  corsHeaders,
  logRequest
} from '@/lib/api-middleware'

export const GET = withErrorHandler(async (request: NextRequest) => {
  logRequest(request)

  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new ApiErrorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  // Get user subscription
  const subscription = await subscriptionService.getUserSubscription(user.id)
  
  if (!subscription) {
    // Create subscription if it doesn't exist
    const newSubscription = await subscriptionService.createUserSubscription(user.id)
    if (!newSubscription) {
      throw new ApiErrorResponse('Failed to create subscription', 500, 'SUBSCRIPTION_CREATE_FAILED')
    }
    
    const response = NextResponse.json({
      subscription: newSubscription,
      remainingTrials: subscriptionService.getRemainingTrials(newSubscription),
      isTrialUser: subscriptionService.isTrialUser(newSubscription)
    })
    
    logRequest(request, response)
    return response
  }

  const response = NextResponse.json({
    subscription,
    remainingTrials: subscriptionService.getRemainingTrials(subscription),
    isTrialUser: subscriptionService.isTrialUser(subscription)
  })

  logRequest(request, response)
  return response
})

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  logRequest(request)

  // Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new ApiErrorResponse('Unauthorized', 401, 'UNAUTHORIZED')
  }

  const body = await request.json()
  const { subscription_type, paystack_data } = body

  if (!subscription_type || !['basic', 'premium'].includes(subscription_type)) {
    throw new ApiErrorResponse('Invalid subscription type', 400, 'INVALID_SUBSCRIPTION_TYPE')
  }

  if (!paystack_data) {
    throw new ApiErrorResponse('Paystack data required', 400, 'PAYSTACK_DATA_REQUIRED')
  }

  // Upgrade subscription
  const success = await subscriptionService.upgradeSubscription(
    user.id,
    subscription_type,
    paystack_data
  )

  if (!success) {
    throw new ApiErrorResponse('Failed to upgrade subscription', 500, 'SUBSCRIPTION_UPGRADE_FAILED')
  }

  // Get updated subscription
  const updatedSubscription = await subscriptionService.getUserSubscription(user.id)

  const response = NextResponse.json({
    message: 'Subscription upgraded successfully',
    subscription: updatedSubscription,
    remainingTrials: updatedSubscription ? subscriptionService.getRemainingTrials(updatedSubscription) : 0,
    isTrialUser: updatedSubscription ? subscriptionService.isTrialUser(updatedSubscription) : false
  })

  logRequest(request, response)
  return response
})

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders()
  })
}