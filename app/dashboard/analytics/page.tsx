'use client'

import { useRequireAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useState } from 'react'

// Mock data for analytics
const monthlyData = [
  { month: 'Jan', contracts: 12, analyses: 10, highRisk: 3 },
  { month: 'Feb', contracts: 19, analyses: 18, highRisk: 5 },
  { month: 'Mar', contracts: 15, analyses: 14, highRisk: 2 },
  { month: 'Apr', contracts: 22, analyses: 21, highRisk: 7 },
  { month: 'May', contracts: 28, analyses: 26, highRisk: 4 },
  { month: 'Jun', contracts: 24, analyses: 24, highRisk: 6 }
]

const riskTrendData = [
  { month: 'Jan', avgRiskScore: 65 },
  { month: 'Feb', avgRiskScore: 72 },
  { month: 'Mar', avgRiskScore: 58 },
  { month: 'Apr', avgRiskScore: 69 },
  { month: 'May', avgRiskScore: 61 },
  { month: 'Jun', avgRiskScore: 67 }
]

const riskDistribution = [
  { name: 'Low Risk', value: 45, color: '#10b981' },
  { name: 'Medium Risk', value: 35, color: '#f59e0b' },
  { name: 'High Risk', value: 20, color: '#ef4444' }
]

const contractTypes = [
  { type: 'Service Agreements', count: 28, percentage: 35 },
  { type: 'Employment Contracts', count: 22, percentage: 27.5 },
  { type: 'Vendor Agreements', count: 18, percentage: 22.5 },
  { type: 'Lease Agreements', count: 12, percentage: 15 }
]

const topRisks = [
  { risk: 'Unclear termination clauses', frequency: 45, severity: 'High' },
  { risk: 'Missing liability limitations', frequency: 38, severity: 'High' },
  { risk: 'Vague payment terms', frequency: 32, severity: 'Medium' },
  { risk: 'Insufficient IP protection', frequency: 28, severity: 'High' },
  { risk: 'Weak confidentiality clauses', frequency: 24, severity: 'Medium' }
]

export default function AnalyticsPage() {
  useRequireAuth()
  const [timeRange, setTimeRange] = useState('6months')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and trends from your contract analyses
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">120</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              -3% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Contracts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-red-500" />
              +2 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analysis Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3m</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              -15s from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Contract Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Contract Activity</CardTitle>
            <CardDescription>
              Contracts uploaded and analyzed over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="contracts" fill="#3b82f6" name="Contracts" />
                <Bar dataKey="analyses" fill="#10b981" name="Analyses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Score Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Average Risk Score Trend</CardTitle>
            <CardDescription>
              How your contract risk scores have changed over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgRiskScore" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="Avg Risk Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>
              Breakdown of contracts by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contract Types */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Types</CardTitle>
            <CardDescription>
              Most common types of contracts you analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{type.type}</span>
                      <span className="text-sm text-muted-foreground">{type.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${type.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Risks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Risk Factors</CardTitle>
          <CardDescription>
            The most frequently identified risks in your contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topRisks.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-red-600">#{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">{risk.risk}</h4>
                      <p className="text-sm text-muted-foreground">
                        Found in {risk.frequency}% of contracts
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge 
                    variant={risk.severity === 'High' ? 'destructive' : 'default'}
                    className={risk.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                  >
                    {risk.severity} Severity
                  </Badge>
                  <div className="text-right">
                    <div className="text-sm font-medium">{risk.frequency}%</div>
                    <div className="text-xs text-muted-foreground">Frequency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}