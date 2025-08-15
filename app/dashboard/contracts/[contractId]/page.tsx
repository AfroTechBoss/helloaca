'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, Download, MessageCircle } from 'lucide-react'
import ContractChat from '@/components/ContractChat'
import { toast } from 'sonner'

interface Contract {
  id: string
  title: string
  file_name: string
  file_url: string
  file_size: number
  content_preview: string
  status: 'pending' | 'analyzing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

interface Analysis {
  id: string
  overall_risk_score: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  recommendations: string[]
  key_findings: string[]
  created_at: string
}

interface RiskClause {
  id: string
  clause_text: string
  risk_type: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  explanation: string
  suggested_revision: string
  page_number?: number
  line_number?: number
}

interface MissingClause {
  id: string
  clause_type: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggested_clause: string
  legal_implications: string
}

export default function ContractDetailsPage() {
  useRequireAuth()
  const params = useParams()
  const router = useRouter()
  const contractId = params.contractId as string
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [riskClauses, setRiskClauses] = useState<RiskClause[]>([])
  const [missingClauses, setMissingClauses] = useState<MissingClause[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (contractId) {
      loadContractDetails()
    }
  }, [contractId])

  const loadContractDetails = async () => {
    try {
      setIsLoading(true)
      
      // Load contract details
      const contractResponse = await fetch(`/api/contracts/${contractId}`)
      if (!contractResponse.ok) {
        throw new Error('Failed to load contract')
      }
      const contractData = await contractResponse.json()
      setContract(contractData)

      // Load analysis if available
      if (contractData.status === 'completed') {
        const analysisResponse = await fetch(`/api/contracts/${contractId}/analysis`)
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          setAnalysis(analysisData.analysis)
          setRiskClauses(analysisData.riskClauses || [])
          setMissingClauses(analysisData.missingClauses || [])
        }
      }
    } catch (error) {
      console.error('Error loading contract details:', error)
      toast.error('Failed to load contract details')
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">Contract not found</h3>
            <p className="text-muted-foreground">The contract you're looking for doesn't exist or you don't have access to it.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{contract.title}</h1>
            <p className="text-muted-foreground">{contract.file_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getRiskBadgeColor(analysis?.risk_level || 'low')}>
            {analysis?.risk_level || 'Pending'}
          </Badge>
          <Button variant="outline" size="sm" asChild>
            <a href={contract.file_url} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        </div>
      </div>

      {/* Contract Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={contract.status === 'completed' ? 'default' : 'secondary'}>
                {contract.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">File Size</p>
              <p className="text-sm">{formatFileSize(contract.file_size)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uploaded</p>
              <p className="text-sm">{formatDate(contract.created_at)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
              <p className="text-sm">{formatDate(contract.updated_at)}</p>
            </div>
          </div>
          
          {contract.content_preview && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Content Preview</p>
              <div className="bg-muted p-4 rounded-lg text-sm max-h-32 overflow-y-auto">
                {contract.content_preview}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risks">Risk Analysis</TabsTrigger>
          <TabsTrigger value="missing">Missing Clauses</TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {analysis ? (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Summary</CardTitle>
                <CardDescription>
                  Overall risk score: {analysis.overall_risk_score}/100
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>
                
                {analysis.key_findings && analysis.key_findings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Key Findings</h4>
                    <ul className="space-y-1">
                      {analysis.key_findings.map((finding, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-yellow-500 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">Analysis not available yet. Please wait for the contract to be processed.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          {riskClauses.length > 0 ? (
            riskClauses.map((clause) => (
              <Card key={clause.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{clause.risk_type}</CardTitle>
                    <Badge className={getRiskBadgeColor(clause.risk_level)}>
                      {clause.risk_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Clause Text</h4>
                    <div className="bg-muted p-3 rounded text-sm">
                      {clause.clause_text}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Risk Explanation</h4>
                    <p className="text-sm text-muted-foreground">{clause.explanation}</p>
                  </div>
                  
                  {clause.suggested_revision && (
                    <div>
                      <h4 className="font-medium mb-2">Suggested Revision</h4>
                      <div className="bg-green-50 border border-green-200 p-3 rounded text-sm">
                        {clause.suggested_revision}
                      </div>
                    </div>
                  )}
                  
                  {(clause.page_number || clause.line_number) && (
                    <div className="text-xs text-muted-foreground">
                      {clause.page_number && `Page ${clause.page_number}`}
                      {clause.page_number && clause.line_number && ', '}
                      {clause.line_number && `Line ${clause.line_number}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium text-lg mb-2">No High-Risk Clauses Found</h3>
                <p className="text-muted-foreground">This contract appears to have low risk based on our analysis.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="missing" className="space-y-4">
          {missingClauses.length > 0 ? (
            missingClauses.map((clause) => (
              <Card key={clause.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{clause.clause_type}</CardTitle>
                    <Badge className={getRiskBadgeColor(clause.importance)}>
                      {clause.importance}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{clause.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Suggested Clause</h4>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                      {clause.suggested_clause}
                    </div>
                  </div>
                  
                  {clause.legal_implications && (
                    <div>
                      <h4 className="font-medium mb-2">Legal Implications</h4>
                      <p className="text-sm text-muted-foreground">{clause.legal_implications}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="font-medium text-lg mb-2">All Essential Clauses Present</h3>
                <p className="text-muted-foreground">This contract appears to have all the necessary protective clauses.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chat">
          <ContractChat 
            contractId={contractId} 
            contractTitle={contract.title}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}