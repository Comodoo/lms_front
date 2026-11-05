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
import { salaryApi } from '@/lib/api';

export default function SalaryProjectionPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [filters, setFilters] = useState({ department_id: '', salary_grade_id: '', employment_type: '', fiscal_year: String(new Date().getFullYear()) });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const depRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments`);
      const depJson = await depRes.json();
      setDepartments(Array.isArray(depJson) ? depJson : depJson?.data || []);
      const gRes: any = await salaryApi.getGrades({ per_page: 500 });
      setGrades(gRes.data?.data || []);
    })();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params: any = { fiscal_year: filters.fiscal_year };
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.salary_grade_id) params.salary_grade_id = filters.salary_grade_id;
      if (filters.employment_type) params.employment_type = filters.employment_type;
      const res: any = await salaryApi.getProjection(params);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Salary Cost Projection</h1>
        <p className="text-muted-foreground">Cost planning by department, grade, and employment type.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={filters.department_id || 'all'} onValueChange={(v) => setFilters({ ...filters, department_id: v === 'all' ? '' : v })}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Grade</Label>
              <Select value={filters.salary_grade_id || 'all'} onValueChange={(v) => setFilters({ ...filters, salary_grade_id: v === 'all' ? '' : v })}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Employment Type</Label>
              <Select value={filters.employment_type || 'all'} onValueChange={(v) => setFilters({ ...filters, employment_type: v === 'all' ? '' : v })}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {['permanent', 'contract', 'part_time', 'visiting', 'intern', 'other'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Fiscal Year</Label>
              <Input value={filters.fiscal_year} onChange={(e) => setFilters({ ...filters, fiscal_year: e.target.value })} className="w-[120px]" />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Run Projection'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Staff Count</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.staff_count ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Basic</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.total_basic ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Total Allowances</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.total_allowances ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Monthly Cost</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.monthly_cost ?? 0}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Annual Cost</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{summary.annual_cost ?? 0}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>By Department</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Staff</TableHead><TableHead>Monthly</TableHead><TableHead>Annual</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.by_department || []).map((r: any) => (
                <TableRow key={r.department}><TableCell>{r.department}</TableCell><TableCell>{r.staff_count}</TableCell><TableCell>{r.monthly_cost}</TableCell><TableCell>{r.annual_cost}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>By Grade</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Staff</TableHead><TableHead>Monthly</TableHead><TableHead>Annual</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.by_grade || []).map((r: any) => (
                <TableRow key={r.grade}><TableCell>{r.grade}</TableCell><TableCell>{r.staff_count}</TableCell><TableCell>{r.monthly_cost}</TableCell><TableCell>{r.annual_cost}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>By Employment Type</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Staff</TableHead><TableHead>Monthly</TableHead><TableHead>Annual</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.by_employment_type || []).map((r: any) => (
                <TableRow key={r.employment_type}><TableCell>{r.employment_type}</TableCell><TableCell>{r.staff_count}</TableCell><TableCell>{r.monthly_cost}</TableCell><TableCell>{r.annual_cost}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}