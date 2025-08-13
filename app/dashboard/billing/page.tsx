'use client'

import { useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  CreditCard,
  Download,
  CheckCircle,
  TrendingUp,
  Crown,
  Star
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// Mock subscription data
const currentPlan = {
  name: 'Professional',
  price: 49,
  billing: 'monthly',
  status: 'active',
  nextBilling: '2024-02-15',
  features: [
    'Up to 100 contracts per month',
    'Advanced AI analysis',
    'Risk scoring and recommendations',
    'Export reports',
    'Email support',
    'API access'
  ]
}

const usage = {
  contracts: { used: 23, limit: 100 },
  analyses: { used: 18, limit: 100 },
  storage: { used: 2.3, limit: 10 } // GB
}

const plans = [
  {
    name: 'Starter',
    price: 19,
    billing: 'monthly',
    description: 'Perfect for small businesses',
    features: [
      'Up to 25 contracts per month',
      'Basic AI analysis',
      'Risk identification',
      'PDF reports',
      'Email support'
    ],
    popular: false
  },
  {
    name: 'Professional',
    price: 49,
    billing: 'monthly',
    description: 'Most popular for growing teams',
    features: [
      'Up to 100 contracts per month',
      'Advanced AI analysis',
      'Risk scoring and recommendations',
      'Export reports',
      'Priority email support',
      'API access'
    ],
    popular: true
  },
  {
    name: 'Enterprise',
    price: 149,
    billing: 'monthly',
    description: 'For large organizations',
    features: [
      'Unlimited contracts',
      'Premium AI analysis',
      'Custom risk models',
      'White-label reports',
      'Dedicated support',
      'Advanced API access',
      'SSO integration'
    ],
    popular: false
  }
]

const paymentHistory = [
  {
    id: 'inv_001',
    date: '2024-01-15',
    amount: 49,
    status: 'paid',
    description: 'Professional Plan - Monthly'
  },
  {
    id: 'inv_002',
    date: '2023-12-15',
    amount: 49,
    status: 'paid',
    description: 'Professional Plan - Monthly'
  },
  {
    id: 'inv_003',
    date: '2023-11-15',
    amount: 49,
    status: 'paid',
    description: 'Professional Plan - Monthly'
  },
  {
    id: 'inv_004',
    date: '2023-10-15',
    amount: 19,
    status: 'paid',
    description: 'Starter Plan - Monthly'
  }
]

export default function BillingPage() {
  useRequireAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(currentPlan.name)

  const handlePlanChange = async (planName: string) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      setSelectedPlan(planName)
      toast.success(`Successfully upgraded to ${planName} plan`)
    } catch {
      toast.error('Failed to change plan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Subscription cancelled. You can continue using the service until the end of your billing period.')
    } catch {
      toast.error('Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    // Simulate invoice download
    toast.success(`Downloading invoice ${invoiceId}...`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, usage, and billing information
        </p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {currentPlan.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Your current subscription details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                <p className="text-muted-foreground">
                  ${currentPlan.price}/{currentPlan.billing}
                </p>
              </div>
              <Crown className="h-8 w-8 text-yellow-500" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Next billing date</span>
                <span className="font-medium">{currentPlan.nextBilling}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Billing cycle</span>
                <span className="font-medium capitalize">{currentPlan.billing}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium">Plan Features</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
            <CardDescription>
              Track your current usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Contracts Analyzed</span>
                <span className="font-medium">
                  {usage.contracts.used} / {usage.contracts.limit}
                </span>
              </div>
              <Progress 
                value={(usage.contracts.used / usage.contracts.limit) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>AI Analyses</span>
                <span className="font-medium">
                  {usage.analyses.used} / {usage.analyses.limit}
                </span>
              </div>
              <Progress 
                value={(usage.analyses.used / usage.analyses.limit) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Storage Used</span>
                <span className="font-medium">
                  {usage.storage.used} GB / {usage.storage.limit} GB
                </span>
              </div>
              <Progress 
                value={(usage.storage.used / usage.storage.limit) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Detailed Usage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose the plan that best fits your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 border rounded-lg ${
                  plan.popular ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                } ${
                  selectedPlan === plan.name ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  
                  <div>
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.billing}</span>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className="w-full"
                    variant={selectedPlan === plan.name ? 'secondary' : 'default'}
                    disabled={selectedPlan === plan.name || isLoading}
                    onClick={() => handlePlanChange(plan.name)}
                  >
                    {selectedPlan === plan.name ? 'Current Plan' : 
                     isLoading ? 'Processing...' : 'Upgrade'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Method</span>
          </CardTitle>
          <CardDescription>
            Manage your payment information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium">•••• •••• •••• 4242</p>
                <p className="text-sm text-muted-foreground">Expires 12/25</p>
              </div>
            </div>
            <Button variant="outline">
              Update Card
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and download your past invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentHistory.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.date} • Invoice #{payment.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">${payment.amount}</p>
                    <Badge 
                      variant={payment.status === 'paid' ? 'secondary' : 'destructive'}
                      className={payment.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {payment.status}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDownloadInvoice(payment.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <h4 className="font-medium text-red-600">Cancel Subscription</h4>
              <p className="text-sm text-muted-foreground">
                Cancel your subscription. You can continue using the service until the end of your billing period.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  Cancel Subscription
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your subscription? You will lose access to all premium features at the end of your current billing period.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                  <AlertDialogAction onClick={handleCancelSubscription}>
                    Cancel Subscription
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}