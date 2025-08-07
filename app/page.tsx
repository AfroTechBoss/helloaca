"use client"

import type React from "react"

import { useState } from "react"
import {
  Upload,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  Copy,
  Wand2,
  Users,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ContractAnalysis {
  riskScore: number
  highRiskClauses: Array<{
    id: string
    title: string
    text: string
    risk: string
    suggestion: string
    severity: "high" | "medium" | "low"
  }>
  missingClauses: Array<{
    id: string
    title: string
    importance: string
    suggestion: string
  }>
  explanationSummary: string
}

const mockAnalysis: ContractAnalysis = {
  riskScore: 7,
  explanationSummary:
    "This contract contains several high-risk clauses that could expose you to significant liability. The unlimited liability clause and lack of termination protections are particularly concerning for a business of your size.",
  highRiskClauses: [
    {
      id: "1",
      title: "Unlimited Liability Clause",
      text: "The Contractor shall be liable for any and all damages, losses, or expenses arising from or related to the performance of this Agreement, without limitation.",
      risk: "This clause makes you responsible for unlimited damages, which could bankrupt your business if something goes wrong.",
      suggestion: "Limit liability to the total contract value or a specific dollar amount (e.g., $50,000).",
      severity: "high",
    },
    {
      id: "2",
      title: "Automatic Renewal",
      text: "This Agreement shall automatically renew for successive one-year terms unless either party provides 90 days written notice.",
      risk: "You could be locked into unfavorable terms with very little flexibility to exit.",
      suggestion: "Reduce notice period to 30 days and add right to terminate for convenience.",
      severity: "medium",
    },
    {
      id: "3",
      title: "Broad Indemnification",
      text: "Contractor agrees to indemnify and hold harmless Client from any claims, damages, or losses.",
      risk: "You're protecting the other party from their own mistakes and negligence.",
      suggestion: "Limit indemnification to claims arising from your gross negligence or willful misconduct.",
      severity: "high",
    },
  ],
  missingClauses: [
    {
      id: "1",
      title: "Force Majeure Protection",
      importance: "Protects you when unforeseeable events (like pandemics) prevent contract performance.",
      suggestion:
        'Add: "Neither party shall be liable for delays caused by circumstances beyond their reasonable control."',
    },
    {
      id: "2",
      title: "Intellectual Property Rights",
      importance: "Clarifies who owns work product and prevents future disputes.",
      suggestion:
        'Add: "All work product created by Contractor shall remain the property of Contractor unless explicitly transferred."',
    },
    {
      id: "3",
      title: "Payment Terms",
      importance: "Establishes clear expectations for when and how you'll be paid.",
      suggestion: 'Add: "Payment due within 30 days of invoice. Late payments subject to 1.5% monthly interest."',
    },
  ],
}

const contractTemplates = [
  {
    id: "real-estate",
    name: "Real Estate Deal",
    icon: Building,
    description: "Purchase agreements, leases, property management",
  },
  { id: "saas", name: "SaaS Vendor Agreement", icon: Shield, description: "Software licensing, service agreements" },
  { id: "employment", name: "Employment Contract", icon: Users, description: "Hiring agreements, contractor terms" },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    icon: FileText,
    description: "Confidentiality and privacy protection",
  },
]

export default function ContractAnalyzer() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    // Simulate AI analysis progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsAnalyzing(false)
          setAnalysis(mockAnalysis)
          setActiveTab("overview")
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const getRiskColor = (score: number) => {
    if (score <= 3) return "text-green-600"
    if (score <= 6) return "text-yellow-600"
    return "text-red-600"
  }

  const getRiskBadgeColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!uploadedFile && !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">ContractGuard AI</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Turn complex contracts into plain-language insights in under 30 seconds
            </p>
          </div>

          {/* Upload Area */}
          <Card className="max-w-2xl mx-auto mb-12 border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-12">
              <div
                className="text-center cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">Drop your contract here</h3>
                <p className="text-gray-600 mb-4">or click to browse files</p>
                <p className="text-sm text-gray-500">Supports PDF, DOCX, and TXT files up to 10MB</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Or start with a template</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contractTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="text-center pb-2">
                    <template.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center text-sm">{template.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Wand2 className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <CardTitle>Analyzing Your Contract</CardTitle>
            <CardDescription>Our AI is reviewing {uploadedFile?.name} for risks and opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={analysisProgress} className="mb-4" />
            <div className="text-center text-sm text-gray-600">
              {analysisProgress < 30 && "Reading contract structure..."}
              {analysisProgress >= 30 && analysisProgress < 60 && "Identifying risk clauses..."}
              {analysisProgress >= 60 && analysisProgress < 90 && "Checking for missing protections..."}
              {analysisProgress >= 90 && "Generating recommendations..."}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contract Analysis</h1>
              <p className="text-gray-600">{uploadedFile?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setUploadedFile(null)
                setAnalysis(null)
                setAnalysisProgress(0)
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              New Analysis
            </Button>
            <Button>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Risk Score Card */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Overall Risk Assessment</h2>
                <p className="text-gray-600 max-w-2xl">{analysis?.explanationSummary}</p>
              </div>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getRiskColor(analysis?.riskScore || 0)} mb-2`}>
                  {analysis?.riskScore}
                </div>
                <div className="text-sm text-gray-500">Risk Score</div>
                <div className="text-xs text-gray-400 mt-1">1 = Low Risk, 10 = High Risk</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="high-risk" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              High-Risk Clauses ({analysis?.highRiskClauses.length})
            </TabsTrigger>
            <TabsTrigger value="missing" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Missing Protections ({analysis?.missingClauses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    High-Risk Issues Found
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis?.highRiskClauses.slice(0, 3).map((clause) => (
                      <div key={clause.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-red-900">{clause.title}</div>
                          <div className="text-sm text-red-700">{clause.risk}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <CheckCircle className="h-5 w-5" />
                    Missing Protections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis?.missingClauses.slice(0, 3).map((clause) => (
                      <div key={clause.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-yellow-900">{clause.title}</div>
                          <div className="text-sm text-yellow-700">{clause.importance}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="high-risk">
            <div className="space-y-6">
              {analysis?.highRiskClauses.map((clause) => (
                <Card key={clause.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          {clause.title}
                        </CardTitle>
                        <Badge className={getRiskBadgeColor(clause.severity)}>
                          {clause.severity.toUpperCase()} RISK
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Original Clause:</h4>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic">"{clause.text}"</div>
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Why this is risky:</strong> {clause.risk}
                        </AlertDescription>
                      </Alert>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Suggested Fix:</h4>
                        <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">{clause.suggestion}</div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(clause.suggestion)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Suggestion
                          </Button>
                          <Button size="sm">
                            <Wand2 className="h-4 w-4 mr-1" />
                            Apply Fix
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="missing">
            <div className="space-y-6">
              {analysis?.missingClauses.map((clause) => (
                <Card key={clause.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-yellow-500" />
                      {clause.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Why you need this:</strong> {clause.importance}
                        </AlertDescription>
                      </Alert>

                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Suggested Clause:</h4>
                        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">{clause.suggestion}</div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(clause.suggestion)}>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Clause
                          </Button>
                          <Button size="sm">
                            <Wand2 className="h-4 w-4 mr-1" />
                            Add to Contract
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
