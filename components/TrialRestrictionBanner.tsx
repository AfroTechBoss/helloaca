'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Zap, Crown } from 'lucide-react'
import Link from 'next/link'

interface TrialRestrictionBannerProps {
  isRestricted: boolean
  restrictionMessage?: string | null
  remainingTrials?: number
  totalShown?: number
  totalAvailable?: number
  type?: 'risks' | 'recommendations' | 'clauses'
  subscription?: {
    subscription_type: string
    trial_analyses_used: number
    trial_analyses_limit: number
    subscription_status: string
  } | null
}

export function TrialRestrictionBanner({
  isRestricted,
  restrictionMessage,
  remainingTrials = 0,
  totalShown = 0,
  totalAvailable = 0,
  type = 'risks',
  subscription
}: TrialRestrictionBannerProps) {
  if (!isRestricted) return null

  const hiddenCount = totalAvailable - totalShown
  const typeLabel = type === 'risks' ? 'risk findings' : type === 'recommendations' ? 'recommendations' : 'clauses'

  return (
    <div className="space-y-4">
      {/* Restriction Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <Lock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          {restrictionMessage || `Showing ${totalShown} of ${totalAvailable} ${typeLabel}. Upgrade to see all results.`}
        </AlertDescription>
      </Alert>

      {/* Hidden Content Indicator */}
      {hiddenCount > 0 && (
        <Card className="border-dashed border-gray-300 bg-gray-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-200 rounded-full">
                <Lock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {hiddenCount} additional {typeLabel} hidden
                </p>
                <p className="text-sm text-gray-600">
                  Upgrade to unlock all analysis features
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/billing">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Trial Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Free Trial</CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {remainingTrials} analyses left
              </Badge>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/billing">
                View Plans
              </Link>
            </Button>
          </div>
          <CardDescription className="text-blue-700">
            You&apos;re using the free trial with limited features. Upgrade for unlimited analyses and full results.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Limited risk findings</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Partial recommendations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Basic clause analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TrialRestrictionBanner