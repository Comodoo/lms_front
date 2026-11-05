'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { budgetApi, hrApi, inventoryApi, proposalApi, salaryApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// We'll call report endpoints via fetch with auth token
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function reportFetch(path: string, params?: Record<string, any>) {
  const token = localStorage.getItem('auth_token');
  const sp = new URLSearchParams();
  if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') sp.set(k, String(v)); });
  const qs = sp.toString();
  const url = `${API_BASE}${path}${qs ? '?' + qs : ''}`;
  const res: any = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function exportCsv(filename: string, rows: any[][]) {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function OperationsReportsPage() {
  const { can } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', department_id: '', status: '' });

  const [dashboard, setDashboard] = useState<any>(null);
  const [inv, setInv] = useState<any>(null);
  const [hr, setHr] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [proposal, setProposal] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res: any = await fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } });
      const json = await res.json();
      setDepartments(Array.isArray(json) ? json : json?.data || []);
    })();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params: any = {};
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.department_id) params.department_id = filters.department_id;
    if (filters.status) params.status = filters.status;

    try {
      setDashboard(await reportFetch('/operations-reports/dashboard', params));
    } catch { setDashboard(null); }
    try {
      setInv(await reportFetch('/operations-reports/inventory-summary', params));
    } catch { setInv(null); }
    try {
      setHr(await reportFetch('/operations-reports/hr-summary', params));
    } catch { setHr(null); }
    try {
      setBudget(await reportFetch('/operations-reports/budget-summary', params));
    } catch { setBudget(null); }
    try {
      setProposal(await reportFetch('/operations-reports/proposal-summary', params));
    } catch { setProposal(null); }
    if (can('reports', 'financial.view')) {
      try {
        setFinancial(await reportFetch('/operations-reports/financial-summary', params));
      } catch { setFinancial(null); }
    }
    setLoading(false);
  }, [filters, can]);

  useEffect(() => { load(); }, [load]);

  const canFinancial = can('reports', 'financial.view');

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Operations & Financial Reports</h1>
          <p className="text-muted-foreground">Management reports based on recorded data.</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label>Date From</Label>
              <Input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Date To</Label>
              <Input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
            </div>
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
              <Label>Status</Label>
              <Input value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} placeholder="status" className="w-[140px]" />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Run'}</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? <p>Loading...</p> : (
        <Tabs defaultValue="dashboard">
          <TabsList className="flex flex-wrap print:hidden">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="hr">HR</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="proposals">Proposals</TabsTrigger>
            {canFinancial && <TabsTrigger value="financial">Financial</TabsTrigger>}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            {dashboard && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><CardHeader><CardTitle>Inventory Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboard.inventory?.total}</p></CardContent></Card>
                  <Card><CardHeader><CardTitle>HR Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboard.hr?.total}</p></CardContent></Card>
                  <Card><CardHeader><CardTitle>Proposals Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{dashboard.proposals?.total}</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle>Budget Summary</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>Requested: {dashboard.budgets?.total_requested}</div>
                    <div>Approved: {dashboard.budgets?.total_approved}</div>
                    <div>Spent: {dashboard.budgets?.total_spent}</div>
                    <div>Remaining: {dashboard.budgets?.remaining}</div>
                    <div>Utilization: {dashboard.budgets?.utilization_percentage}%</div>
                    <div>Pending Approvals: {dashboard.budgets?.pending_approvals}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Delayed Activities</CardTitle></CardHeader>
                  <CardContent><p className="text-3xl font-bold">{dashboard.proposals?.delayed_activities}</p></CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory">
            {inv && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Inventory by Category (Chart)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={Object.entries(inv?.by_category || {}).map(([k, v]: any) => ({ name: k, value: v.count }))}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0D7377" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>By Category</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => exportCsv('inventory-by-category.csv', [['Category', 'Count', 'Quantity'], ...Object.entries(inv.by_category || {}).map(([k, v]: any) => [k, v.count, v.quantity])])}>Export</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Count</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {Object.entries(inv.by_category || {}).map(([k, v]: any) => (
                            <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v.count}</TableCell><TableCell>{v.quantity}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>By Location</CardTitle>
                      <Button size="sm" variant="outline" onClick={() => exportCsv('inventory-by-location.csv', [['Location', 'Count', 'Quantity'], ...Object.entries(inv.by_location || {}).map(([k, v]: any) => [k, v.count, v.quantity])])}>Export</Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Location</TableHead><TableHead>Count</TableHead><TableHead>Quantity</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {Object.entries(inv.by_location || {}).map(([k, v]: any) => (
                            <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v.count}</TableCell><TableCell>{v.quantity}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader><CardTitle>By Status</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(inv.by_status || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Audit Variance Summary</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>Total Audits: {inv.audit_variance?.total_audits}</div>
                    <div>Total Variance: {inv.audit_variance?.total_variance}</div>
                    <div>Positive Variance: {inv.audit_variance?.positive_variance}</div>
                    <div>Negative Variance: {inv.audit_variance?.negative_variance}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Lost and Disposed Assets</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Asset Tag</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Location</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(inv.lost_and_disposed || []).map((i: any) => (
                          <TableRow key={i.id}><TableCell className="font-mono text-xs">{i.asset_tag}</TableCell><TableCell>{i.name}</TableCell><TableCell>{i.status}</TableCell><TableCell>{i.location?.name}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* HR */}
          <TabsContent value="hr">
            {hr && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Active Staff by Department</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(hr.active_by_department || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Staff by Employment Type</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(hr.by_employment_type || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Leave Summary</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>Pending: {hr.leave_summary?.pending}</div>
                    <div>Approved: {hr.leave_summary?.approved}</div>
                    <div>Rejected: {hr.leave_summary?.rejected}</div>
                    <div>Cancelled: {hr.leave_summary?.cancelled}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Employment Status Summary</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(hr.employment_status_summary || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Contract Expiry (within 90 days)</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Employee #</TableHead><TableHead>Name</TableHead><TableHead>Contract End</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(hr.contract_expiry || []).map((p: any) => (
                          <TableRow key={p.id}><TableCell className="font-mono text-xs">{p.employee_number}</TableCell><TableCell>{p.user?.name}</TableCell><TableCell>{p.contract_end_date}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Budget */}
          <TabsContent value="budget">
            {budget && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Budget Summary</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>Requested: {budget.summary?.total_requested}</div>
                    <div>Approved: {budget.summary?.total_approved}</div>
                    <div>Spent: {budget.summary?.total_spent}</div>
                    <div>Remaining: {budget.summary?.remaining}</div>
                    <div>Utilization: {budget.summary?.utilization_percentage}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Variance by Department</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Department</TableHead><TableHead>Requested</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Variance</TableHead><TableHead>Util %</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(budget.variance_by_department || []).map((r: any, i: number) => (
                          <TableRow key={i}><TableCell>{r.department}</TableCell><TableCell>{r.requested}</TableCell><TableCell>{r.approved}</TableCell><TableCell>{r.spent}</TableCell><TableCell>{r.variance}</TableCell><TableCell>{r.utilization_percentage}%</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Variance by Category</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Requested</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Variance</TableHead><TableHead>Util %</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(budget.variance_by_category || []).map((r: any, i: number) => (
                          <TableRow key={i}><TableCell>{r.category}</TableCell><TableCell>{r.requested}</TableCell><TableCell>{r.approved}</TableCell><TableCell>{r.spent}</TableCell><TableCell>{r.variance}</TableCell><TableCell>{r.utilization_percentage}%</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Expenditure Register</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(budget.expenditure_register || []).map((e: any) => (
                          <TableRow key={e.id}><TableCell className="text-xs">{e.expenditure_date}</TableCell><TableCell>{e.description}</TableCell><TableCell>{e.amount}</TableCell><TableCell className="text-xs">{e.reference_number}</TableCell><TableCell>{e.status}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Unspent Budget</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Budget</TableHead><TableHead>Department</TableHead><TableHead>Line</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Remaining</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(budget.unspent_budget || []).map((r: any, i: number) => (
                          <TableRow key={i}><TableCell>{r.budget}</TableCell><TableCell>{r.department}</TableCell><TableCell>{r.line}</TableCell><TableCell>{r.approved}</TableCell><TableCell>{r.spent}</TableCell><TableCell>{r.remaining}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Proposals */}
          <TabsContent value="proposals">
            {proposal && (
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle>Proposals by Type</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(proposal.by_type || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Proposals by Status</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {Object.entries(proposal.by_status || {}).map(([k, v]: any) => (
                          <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Budget Totals</CardTitle></CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <div>Total Budget: {proposal.budget_totals?.total_budget}</div>
                    <div>Approved Budget: {proposal.budget_totals?.approved_budget}</div>
                    <div>Implementation Progress (avg): {proposal.implementation_progress}%</div>
                    <div>Delayed Activities: {proposal.delayed_activities}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>KPI Performance</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Proposal</TableHead><TableHead>KPI</TableHead><TableHead>Target</TableHead><TableHead>Actual</TableHead><TableHead>Unit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(proposal.kpi_summary || []).map((k: any, i: number) => (
                          <TableRow key={i}><TableCell>{k.proposal}</TableCell><TableCell>{k.kpi}</TableCell><TableCell>{k.target}</TableCell><TableCell>{k.actual}</TableCell><TableCell>{k.unit}</TableCell><TableCell>{k.status}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Financial */}
          {canFinancial && (
            <TabsContent value="financial">
              {financial && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader><CardTitle>Student Fee Income</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>Student Fee Income: {financial.student_fee_income}</div>
                      <div>Verified Payments: {financial.verified_payments}</div>
                      <div>Unverified Payments: {financial.unverified_payments}</div>
                      <div>Outstanding Fees: {financial.outstanding_fees}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Budget Expenditure</CardTitle></CardHeader>
                    <CardContent><p className="text-2xl font-bold">{financial.budget_expenditure}</p></CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Salary Cost Projection</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>Monthly Basic: {financial.salary_cost?.monthly_basic}</div>
                      <div>Monthly Allowances: {financial.salary_cost?.monthly_allowances}</div>
                      <div>Monthly Total: {financial.salary_cost?.monthly_total}</div>
                      <div>Annual Total: {financial.salary_cost?.annual_total}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Income vs Expenditure (Management View)</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div>Income: {financial.income_vs_expenditure?.income}</div>
                      <div>Expenditure: {financial.income_vs_expenditure?.expenditure}</div>
                      <div>Surplus/Deficit: {financial.income_vs_expenditure?.surplus_deficit}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Payment Status Breakdown</CardTitle></CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Count</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {Object.entries(financial.payment_status_breakdown || {}).map(([k, v]: any) => (
                            <TableRow key={k}><TableCell>{k}</TableCell><TableCell>{v}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}