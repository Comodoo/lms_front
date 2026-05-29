'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  PieChart,
} from 'lucide-react';

export default function AccountantReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and download financial reports</p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="april-2024">
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="april-2024">April 2024</SelectItem>
              <SelectItem value="march-2024">March 2024</SelectItem>
              <SelectItem value="q1-2024">Q1 2024</SelectItem>
              <SelectItem value="2024">Year 2024</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">TSH 4.2M</p>
                <div className="flex items-center text-xs mt-1 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% from last month
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tuition Fees</p>
                <p className="text-2xl font-bold">TSH 3.1M</p>
                <div className="flex items-center text-xs mt-1 text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8% from last month
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Other Fees</p>
                <p className="text-2xl font-bold">TSH 1.1M</p>
                <div className="flex items-center text-xs mt-1 text-red-600">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -3% from last month
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <PieChart className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold">TSH 890K</p>
                <div className="flex items-center text-xs mt-1 text-yellow-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% from last month
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Payment Summary Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive overview of all payments received, categorized by fee type and payment method.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">Excel</Badge>
              <Badge variant="outline">CSV</Badge>
            </div>
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Outstanding Fees Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              List of students with outstanding fee balances, including contact details and amounts due.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">Excel</Badge>
            </div>
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Breakdown of revenue generated from each academic program and department.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">Excel</Badge>
              <Badge variant="outline">Charts</Badge>
            </div>
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Trend Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Historical payment trends and projections for financial planning.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">PDF</Badge>
              <Badge variant="outline">Charts</Badge>
            </div>
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fee Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Fee Type - April 2024</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { type: 'Tuition Fee', amount: 3100000, percentage: 74, color: 'bg-blue-500' },
              { type: 'Hostel Fee', amount: 450000, percentage: 11, color: 'bg-green-500' },
              { type: 'Library Fee', amount: 180000, percentage: 4, color: 'bg-yellow-500' },
              { type: 'Laboratory Fee', amount: 270000, percentage: 6, color: 'bg-orange-500' },
              { type: 'Examination Fee', amount: 125000, percentage: 3, color: 'bg-purple-500' },
              { type: 'Other Fees', amount: 75000, percentage: 2, color: 'bg-gray-500' },
            ].map((item) => (
              <div key={item.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.type}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">TSH {item.amount.toLocaleString()}</span>
                    <span className="font-medium w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

