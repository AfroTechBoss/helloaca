'use client'

import { useAuth, useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Download,
  Eye,
  Zap
} from 'lucide-react'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'uploaded' | 'analyzing' | 'completed' | 'error'
  progress: number
  analysisId?: string
}

const contractTypes = [
  'Service Agreement',
  'Employment Contract',
  'Vendor Agreement',
  'Lease Agreement',
  'Partnership Agreement',
  'Non-Disclosure Agreement',
  'Software License',
  'Consulting Agreement',
  'Other'
]

export default function AnalyzePage() {
  useRequireAuth()
  const router = useRouter()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [contractType, setContractType] = useState('')
  const [description, setDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])

    // Simulate file upload
    newFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true
  })

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'uploaded', progress: 100 }
            : f
        ))
      } else {
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress }
            : f
        ))
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const analyzeContracts = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one contract')
      return
    }

    if (!contractType) {
      toast.error('Please select a contract type')
      return
    }

    setIsAnalyzing(true)

    try {
      // Update files to analyzing status
      setFiles(prev => prev.map(f => ({ ...f, status: 'analyzing' as const })))

      // Simulate analysis for each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
        
        const analysisId = Math.random().toString(36).substr(2, 9)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', analysisId }
            : f
        ))
        
        toast.success(`Analysis completed for ${file.name}`)
      }

      toast.success('All contracts analyzed successfully!')
      
      // Redirect to results after a short delay
      setTimeout(() => {
        router.push('/dashboard/contracts')
      }, 1500)
      
    } catch {
      toast.error('Failed to analyze contracts')
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'uploaded':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'analyzing':
        return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Badge variant="secondary">Uploading</Badge>
      case 'uploaded':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Ready</Badge>
      case 'analyzing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Analyzing</Badge>
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analyze Contracts</h1>
        <p className="text-muted-foreground">
          Upload your contracts for AI-powered risk analysis and insights
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Contracts</span>
          </CardTitle>
          <CardDescription>
            Drag and drop your contract files or click to browse. Supported formats: PDF, DOC, DOCX, TXT (Max 10MB each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">
                Drop the files here...
              </p>
            ) : (
              <div>
                <p className="text-gray-600 font-medium mb-2">
                  Drag & drop contract files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, TXT files up to 10MB each
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({files.length})</CardTitle>
            <CardDescription>
              Review your uploaded files before analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(file.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{file.name}</p>
                      {getStatusBadge(file.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{file.type}</span>
                    </div>
                    
                    {(file.status === 'uploading' || file.status === 'analyzing') && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {file.status === 'completed' && file.analysisId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/analyze/${file.analysisId}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {file.status !== 'analyzing' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Configuration</CardTitle>
          <CardDescription>
            Provide additional context to improve analysis accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contractType">Contract Type</Label>
            <Select value={contractType} onValueChange={setContractType}>
              <SelectTrigger>
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                {contractTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context about these contracts..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Ready to Analyze</h3>
              <p className="text-sm text-muted-foreground">
                {files.length} file{files.length !== 1 ? 's' : ''} ready for AI analysis
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFiles([])
                  setContractType('')
                  setDescription('')
                }}
                disabled={isAnalyzing}
              >
                Clear All
              </Button>
              
              <Button
                onClick={analyzeContracts}
                disabled={files.length === 0 || !contractType || isAnalyzing}
                className="min-w-[120px]"
              >
                {isAnalyzing ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Analysis Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-700">
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Ensure contracts are clearly scanned or typed for best results</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Select the correct contract type to get more accurate risk assessments</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Analysis typically takes 1-3 minutes per contract depending on length</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>You'll receive detailed risk scores, clause analysis, and recommendations</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}