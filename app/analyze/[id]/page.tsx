'use client'

import { useAuth, useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrialRestrictionBanner } from '@/components/TrialRestrictionBanner'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Share,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye,
  Clock,
  User,
  Calendar,
  Loader2
} from 'lucide-react'
import { useState, useEffect, use } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalysisData {
  id: string
  contract_id: string
  overall_risk_score: number
  summary: string
  key_findings: string[]
  recommendations: string[]
  created_at: string
  contract: {
    id: string
    name: string
    type: string
    created_at: string
  }
  risk_clauses: Array<{
    id: string
    clause_text: string
    risk_level: string
    risk_score: number
    explanation: string
    recommendation: string
    clause_reference: string
  }>
  missing_clauses: Array<{
    id: string
    clause_type: string
    importance: string
    description: string
    recommendation: string
  }>
  is_restricted?: boolean
  restriction_message?: string
  subscription?: {
    subscription_type: string
    trial_analyses_used: number
    trial_analyses_limit: number
    subscription_status: string
  }
}

export default function AnalysisResultPage({ params }: { params: Promise<{ id: string }> }) {
  useRequireAuth()
  const router = useRouter()
  const resolvedParams = use(params)
  const [activeTab, setActiveTab] = useState('overview')
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/analysis/${resolvedParams.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch analysis')
        }
        
        const data = await response.json()
        setAnalysisData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        toast.error('Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [resolvedParams.id])

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const handleExportReport = () => {
    toast.success('Exporting detailed analysis report...')
  }

  const handleShareAnalysis = () => {
    toast.success('Analysis link copied to clipboard')
  }

  const getRiskLevel = (score: number) => {
    if (score >= 70) return 'High'
    if (score >= 40) return 'Medium'
    return 'Low'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Analysis not found'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const riskLevel = getRiskLevel(analysisData.overall_risk_score)

  return (
    <div className="space-y-6">
      {/* Trial Restriction Banner */}
      {analysisData.is_restricted && (
        <TrialRestrictionBanner
          isRestricted={true}
          restrictionMessage={analysisData.restriction_message || 'Some content is hidden in the free trial'}
          subscription={analysisData.subscription}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contract Analysis</h1>
            <p className="text-muted-foreground">{analysisData.contract.name}</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleShareAnalysis}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analysis Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-3xl font-bold">{analysisData.overall_risk_score}%</div>
              <Badge className={getRiskColor(riskLevel)}>
                {riskLevel} Risk
              </Badge>
            </div>
            <Progress value={analysisData.overall_risk_score} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.risk_clauses.length}</div>
            <p className="text-sm text-muted-foreground">Issues identified</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing Clauses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.missing_clauses.length}</div>
            <p className="text-sm text-muted-foreground">Recommended additions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Analysis Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{new Date(analysisData.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="missing">Missing Clauses</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
              <CardDescription>
                AI-generated analysis summary and key findings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{analysisData.summary}</p>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Key Findings</h4>
                <ul className="space-y-2">
                  {analysisData.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
          
          {/* Contract Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contract Name:</span>
                    <span className="text-sm font-medium">{analysisData.contract.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contract Type:</span>
                    <span className="text-sm font-medium">{analysisData.contract.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Upload Date:</span>
                    <span className="text-sm font-medium">{new Date(analysisData.contract.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Analysis ID:</span>
                    <span className="text-sm font-medium font-mono">{analysisData.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Analysis Date:</span>
                    <span className="text-sm font-medium">{new Date(analysisData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factor Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of identified risks and their impact
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {analysisData.risk_clauses.map((clause, index) => (
                  <div key={clause.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">Risk Clause {index + 1}</h4>
                        <Badge className={getRiskColor(clause.risk_level)}>
                          {clause.risk_level} Risk
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{clause.risk_score}%</div>
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Clause Text</h5>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded italic">
                          "{clause.clause_text}"
                        </p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Risk Explanation</h5>
                        <p className="text-sm text-muted-foreground">{clause.explanation}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{clause.recommendation}</p>
                      </div>
                      
                      {clause.clause_reference && (
                        <div>
                          <h5 className="text-sm font-medium mb-1">Reference</h5>
                          <Badge variant="outline" className="text-xs">
                            {clause.clause_reference}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {analysisData.risk_clauses.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No significant risk clauses identified</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="missing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Missing Clauses</CardTitle>
              <CardDescription>
                Important clauses that should be added to strengthen the contract
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.missing_clauses.map((clause, index) => (
                  <div key={clause.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{clause.clause_type}</h4>
                      <Badge variant={getPriorityColor(clause.importance)}>
                        {clause.importance} Priority
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Purpose</h5>
                        <p className="text-sm text-muted-foreground">{clause.description}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{clause.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {analysisData.missing_clauses.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">All important clauses are present</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Action Recommendations</CardTitle>
              <CardDescription>
                Prioritized recommendations to improve contract terms and reduce risks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Recommendation {index + 1}</h4>
                      <Badge variant="default">
                        Priority
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Action Required</h5>
                        <p className="text-sm text-muted-foreground">{recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {analysisData.recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">No additional recommendations at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}