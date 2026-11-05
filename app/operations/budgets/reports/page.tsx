'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { budgetApi } from '@/lib/api';

export default function BudgetReportsPage() {
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [fy, setFy] = useState('');
  const [dept, setDept] = useState('');
  const [variance, setVariance] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const fyRes: any = await budgetApi.getFiscalYears({ per_page: 500 });
      setFiscalYears(fyRes.data?.data || []);
      const depRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments`).then((r) => r.json());
      setDepartments(Array.isArray(depRes) ? depRes : depRes?.data || []);
    })();
  }, []);

  const load = async () => {
    const params: any = {};
    if (fy) params.fiscal_year_id = fy;
    if (dept) params.department_id = dept;
    const vRes: any = await budgetApi.getVariance(params);
    setVariance(vRes.data || []);
    const sRes: any = await budgetApi.getDepartmentSummary(params);
    setSummary(sRes.data || []);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Budget Reports</h1>
        <p className="text-muted-foreground">Variance and department summaries.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label>Fiscal Year</Label>
              <Select value={fy || 'all'} onValueChange={(v) => setFy(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {fiscalYears.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={dept || 'all'} onValueChange={(v) => setDept(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={load}>Run</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Budget Variance</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Category</TableHead><TableHead>Line</TableHead><TableHead>Requested</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Variance</TableHead><TableHead>Util %</TableHead></TableRow></TableHeader>
            <TableBody>
              {variance.map((r: any, i: number) => (
                <TableRow key={i}><TableCell>{r.department}</TableCell><TableCell>{r.category}</TableCell><TableCell>{r.line}</TableCell><TableCell>{r.requested_amount}</TableCell><TableCell>{r.approved_amount}</TableCell><TableCell>{r.spent_amount}</TableCell><TableCell>{r.variance}</TableCell><TableCell>{r.utilization_percentage}%</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Department Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Budgets</TableHead><TableHead>Requested</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Variance</TableHead><TableHead>Util %</TableHead></TableRow></TableHeader>
            <TableBody>
              {summary.map((r: any, i: number) => (
                <TableRow key={i}><TableCell>{r.department}</TableCell><TableCell>{r.budgets}</TableCell><TableCell>{r.requested}</TableCell><TableCell>{r.approved}</TableCell><TableCell>{r.spent}</TableCell><TableCell>{r.variance}</TableCell><TableCell>{r.utilization_percentage}%</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}