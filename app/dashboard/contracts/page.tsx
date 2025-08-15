'use client'

import { useState } from 'react'
import { useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FileText,
  Upload,
  Search,
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

// Mock data - will be replaced with real data from API
const mockContracts = [
  {
    id: '1',
    title: 'Service Agreement - TechCorp',
    fileName: 'service-agreement-techcorp.pdf',
    fileSize: '2.4 MB',
    status: 'completed',
    riskLevel: 'medium',
    riskScore: 78,
    uploadedAt: '2024-01-15T10:30:00Z',
    analyzedAt: '2024-01-15T10:35:00Z'
  },
  {
    id: '2',
    title: 'Employment Contract - Jane Doe',
    fileName: 'employment-contract-jane.docx',
    fileSize: '1.8 MB',
    status: 'analyzing',
    riskLevel: null,
    riskScore: null,
    uploadedAt: '2024-01-15T09:15:00Z',
    analyzedAt: null
  },
  {
    id: '3',
    title: 'Vendor Agreement - SupplyCo',
    fileName: 'vendor-agreement-supplyco.pdf',
    fileSize: '3.1 MB',
    status: 'completed',
    riskLevel: 'high',
    riskScore: 45,
    uploadedAt: '2024-01-14T16:45:00Z',
    analyzedAt: '2024-01-14T16:52:00Z'
  },
  {
    id: '4',
    title: 'Lease Agreement - Office Space',
    fileName: 'lease-agreement-office.pdf',
    fileSize: '2.7 MB',
    status: 'completed',
    riskLevel: 'low',
    riskScore: 92,
    uploadedAt: '2024-01-14T14:20:00Z',
    analyzedAt: '2024-01-14T14:25:00Z'
  },
  {
    id: '5',
    title: 'Partnership Agreement - StartupXYZ',
    fileName: 'partnership-agreement.pdf',
    fileSize: '4.2 MB',
    status: 'error',
    riskLevel: null,
    riskScore: null,
    uploadedAt: '2024-01-13T11:30:00Z',
    analyzedAt: null
  }
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      )
    case 'analyzing':
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Clock className="mr-1 h-3 w-3" />
          Analyzing
        </Badge>
      )
    case 'error':
      return (
        <Badge variant="destructive">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Error
        </Badge>
      )
    default:
      return <Badge variant="secondary">Unknown</Badge>
  }
}

function getRiskBadge(riskLevel: string | null, riskScore: number | null) {
  if (!riskLevel || riskScore === null) return null
  
  switch (riskLevel) {
    case 'high':
      return <Badge variant="destructive">High Risk ({riskScore}%)</Badge>
    case 'medium':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Medium Risk ({riskScore}%)</Badge>
    case 'low':
      return <Badge variant="default" className="bg-green-100 text-green-800">Low Risk ({riskScore}%)</Badge>
    default:
      return null
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ContractsPage() {
  useRequireAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [riskFilter, setRiskFilter] = useState('all')

  const filteredContracts = mockContracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.fileName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
    const matchesRisk = riskFilter === 'all' || contract.riskLevel === riskFilter
    
    return matchesSearch && matchesStatus && matchesRisk
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage and analyze your uploaded contracts
          </p>
        </div>
        <Button asChild>
          <Link href="/analyze">
            <Upload className="mr-2 h-4 w-4" />
            Upload Contract
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter your contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search contracts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Contracts ({filteredContracts.length})</CardTitle>
          <CardDescription>
            All your uploaded contracts and their analysis status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Risk Assessment</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{contract.title}</div>
                          <div className="text-sm text-muted-foreground">{contract.fileName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(contract.riskLevel, contract.riskScore)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contract.uploadedAt)}
                      </div>
                      {contract.analyzedAt && (
                        <div className="text-xs text-muted-foreground">
                          Analyzed: {formatDate(contract.analyzedAt)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{contract.fileSize}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/contracts/${contract.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Contract
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredContracts.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No contracts found</h3>
              <p className="mt-2 text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || riskFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first contract to get started'}
              </p>
              {!searchTerm && statusFilter === 'all' && riskFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/analyze">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Contract
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}