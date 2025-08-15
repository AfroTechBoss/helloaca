'use client'

import { useAuth, useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

// Mock data - will be replaced with real data from API
const mockStats = {
  totalContracts: 24,
  pendingAnalysis: 3,
  highRiskContracts: 5,
  completedAnalyses: 21
}

const mockRecentContracts = [
  {
    id: '1',
    name: 'Service Agreement - TechCorp',
    status: 'completed',
    riskLevel: 'medium',
    uploadedAt: '2024-01-15T10:30:00Z',
    analysisScore: 78
  },
  {
    id: '2',
    name: 'Employment Contract - Jane Doe',
    status: 'analyzing',
    riskLevel: null,
    uploadedAt: '2024-01-15T09:15:00Z',
    analysisScore: null
  },
  {
    id: '3',
    name: 'Vendor Agreement - SupplyCo',
    status: 'completed',
    riskLevel: 'high',
    uploadedAt: '2024-01-14T16:45:00Z',
    analysisScore: 45
  },
  {
    id: '4',
    name: 'Lease Agreement - Office Space',
    status: 'completed',
    riskLevel: 'low',
    uploadedAt: '2024-01-14T14:20:00Z',
    analysisScore: 92
  }
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
    case 'analyzing':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Analyzing</Badge>
    case 'failed':
      return <Badge variant="destructive">Failed</Badge>
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

function getRiskBadge(riskLevel: string | null) {
  if (!riskLevel) return null
  
  switch (riskLevel) {
    case 'high':
      return <Badge variant="destructive">High Risk</Badge>
    case 'medium':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
    case 'low':
      return <Badge variant="default" className="bg-green-100 text-green-800">Low Risk</Badge>
    default:
      return null
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

interface UserSubscription {
  subscription_type: 'trial' | 'basic' | 'premium'
  trial_analyses_used: number
  trial_analyses_limit: number
  subscription_status: 'active' | 'cancelled' | 'expired'
}

export default function DashboardPage() {
  useRequireAuth()
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  const userName = (user?.user_metadata?.full_name && typeof user.user_metadata.full_name === 'string') 
    ? user.user_metadata.full_name.split(' ')[0] 
    : 'User'

  useEffect(() => {
    async function fetchSubscription() {
      if (!user) return
      
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data.subscription)
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user])

  const remainingTrials = subscription 
    ? Math.max(0, subscription.trial_analyses_limit - subscription.trial_analyses_used)
    : 0
  
  const isTrialUser = subscription?.subscription_type === 'trial'

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your contract analysis activity.
        </p>
      </div>

      {/* Trial Status Banner */}
      {isTrialUser && (
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
              <Button asChild size="sm">
                <Link href="/dashboard/billing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
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
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700">Limited risk findings</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700">Partial recommendations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-gray-700">Basic clause analysis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Analysis</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingAnalysis}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Contracts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.highRiskContracts}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.completedAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              +5 from last week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with your contract analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/analyze">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Contract
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/contracts">
                <FileText className="mr-2 h-4 w-4" />
                View All Contracts
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/analytics">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Analytics
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest contract analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentContracts.slice(0, 3).map((contract) => (
                <div key={contract.id} className="flex items-center justify-between space-x-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contract.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(contract.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(contract.status)}
                    {getRiskBadge(contract.riskLevel)}
                  </div>
                </div>
              ))}
              <Button variant="ghost" asChild className="w-full mt-4">
                <Link href="/dashboard/contracts">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
          <CardDescription>
            Your most recently uploaded contracts and their analysis status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentContracts.map((contract) => (
              <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">{contract.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {formatDate(contract.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {contract.analysisScore && (
                    <div className="text-right">
                      <p className="text-sm font-medium">Score: {contract.analysisScore}%</p>
                      <p className="text-xs text-muted-foreground">Analysis Score</p>
                    </div>
                  )}
                  <div className="flex flex-col space-y-2">
                    {getStatusBadge(contract.status)}
                    {getRiskBadge(contract.riskLevel)}
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/analyze/${contract.id}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/contracts">
                View All Contracts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}