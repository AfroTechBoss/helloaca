'use client'

import { useAuth, useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Calendar
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Mock analysis data
const analysisData = {
  id: 'analysis_123',
  contractName: 'Service Agreement - TechCorp.pdf',
  contractType: 'Service Agreement',
  uploadDate: '2024-01-15',
  analysisDate: '2024-01-15',
  status: 'completed',
  overallRiskScore: 72,
  riskLevel: 'Medium',
  summary: 'This service agreement contains several moderate risk factors that should be addressed. The contract lacks clear termination clauses and has vague liability limitations that could expose your organization to potential disputes.',
  keyFindings: [
    'Missing force majeure clause',
    'Unclear intellectual property ownership',
    'Insufficient liability limitations',
    'Vague termination conditions'
  ],
  riskFactors: [
    {
      category: 'Termination',
      risk: 'High',
      score: 85,
      description: 'Contract lacks clear termination procedures and notice requirements',
      recommendation: 'Add specific termination clauses with 30-day notice requirement',
      clauses: ['Section 8.1', 'Section 8.3']
    },
    {
      category: 'Liability',
      risk: 'High',
      score: 80,
      description: 'Liability limitations are insufficient and one-sided',
      recommendation: 'Include mutual liability caps and exclude consequential damages',
      clauses: ['Section 12.2']
    },
    {
      category: 'Intellectual Property',
      risk: 'Medium',
      score: 65,
      description: 'IP ownership and licensing terms are ambiguous',
      recommendation: 'Clarify IP ownership and include work-for-hire provisions',
      clauses: ['Section 6.1', 'Section 6.4']
    },
    {
      category: 'Payment Terms',
      risk: 'Low',
      score: 35,
      description: 'Payment terms are clearly defined with reasonable conditions',
      recommendation: 'Consider adding late payment penalties',
      clauses: ['Section 4.1', 'Section 4.2']
    },
    {
      category: 'Confidentiality',
      risk: 'Medium',
      score: 55,
      description: 'Confidentiality provisions could be more comprehensive',
      recommendation: 'Expand confidentiality scope and extend duration',
      clauses: ['Section 9.1']
    }
  ],
  missingClauses: [
    {
      clause: 'Force Majeure',
      importance: 'High',
      description: 'Protection against unforeseeable circumstances',
      recommendation: 'Add force majeure clause to protect against events beyond control'
    },
    {
      clause: 'Dispute Resolution',
      importance: 'High',
      description: 'Mechanism for resolving conflicts',
      recommendation: 'Include mediation and arbitration procedures'
    },
    {
      clause: 'Data Protection',
      importance: 'Medium',
      description: 'Compliance with data privacy regulations',
      recommendation: 'Add GDPR/CCPA compliance requirements'
    },
    {
      clause: 'Insurance Requirements',
      importance: 'Medium',
      description: 'Professional liability coverage',
      recommendation: 'Require minimum insurance coverage amounts'
    }
  ],
  recommendations: [
    {
      priority: 'High',
      title: 'Add Comprehensive Termination Clause',
      description: 'Include specific termination procedures, notice requirements, and post-termination obligations.',
      impact: 'Reduces legal disputes and provides clear exit strategy'
    },
    {
      priority: 'High',
      title: 'Strengthen Liability Limitations',
      description: 'Add mutual liability caps and exclude consequential damages for both parties.',
      impact: 'Limits financial exposure and creates balanced risk allocation'
    },
    {
      priority: 'Medium',
      title: 'Clarify Intellectual Property Rights',
      description: 'Define ownership of work products and include work-for-hire provisions.',
      impact: 'Prevents IP disputes and ensures clear ownership'
    },
    {
      priority: 'Medium',
      title: 'Add Force Majeure Protection',
      description: 'Include force majeure clause covering pandemics, natural disasters, and government actions.',
      impact: 'Protects against performance failures due to uncontrollable events'
    }
  ]
}

export default function AnalysisResultPage({ params }: { params: { id: string } }) {
  useRequireAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contract Analysis</h1>
            <p className="text-muted-foreground">{analysisData.contractName}</p>
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
              <div className="text-3xl font-bold">{analysisData.overallRiskScore}%</div>
              <Badge className={getRiskColor(analysisData.riskLevel)}>
                {analysisData.riskLevel} Risk
              </Badge>
            </div>
            <Progress value={analysisData.overallRiskScore} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.riskFactors.length}</div>
            <p className="text-sm text-muted-foreground">Issues identified</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing Clauses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analysisData.missingClauses.length}</div>
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
              <span className="text-sm">{analysisData.analysisDate}</span>
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
                  {analysisData.keyFindings.map((finding, index) => (
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
                    <span className="text-sm font-medium">{analysisData.contractName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Contract Type:</span>
                    <span className="text-sm font-medium">{analysisData.contractType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Upload Date:</span>
                    <span className="text-sm font-medium">{analysisData.uploadDate}</span>
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
                      {analysisData.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Analysis Date:</span>
                    <span className="text-sm font-medium">{analysisData.analysisDate}</span>
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
                {analysisData.riskFactors.map((factor, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium">{factor.category}</h4>
                        <Badge className={getRiskColor(factor.risk)}>
                          {factor.risk} Risk
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{factor.score}%</div>
                        <div className="text-xs text-muted-foreground">Risk Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Description</h5>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Recommendation</h5>
                        <p className="text-sm text-muted-foreground">{factor.recommendation}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Related Clauses</h5>
                        <div className="flex flex-wrap gap-2">
                          {factor.clauses.map((clause, clauseIndex) => (
                            <Badge key={clauseIndex} variant="outline" className="text-xs">
                              {clause}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
                {analysisData.missingClauses.map((clause, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{clause.clause}</h4>
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
                {analysisData.recommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={getPriorityColor(rec.priority)}>
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Action Required</h5>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-1">Expected Impact</h5>
                        <p className="text-sm text-muted-foreground">{rec.impact}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}