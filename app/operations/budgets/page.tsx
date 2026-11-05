'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { budgetApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';

export default function BudgetsPage() {
  const { can } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ fiscal_year_id: '', department_id: '', status: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ fiscal_year_id: '', department_id: '', title: '', description: '' });

  const fetchLists = useCallback(async () => {
    const [fyRes, depRes]: any = await Promise.all([
      budgetApi.getFiscalYears({ per_page: 500 }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments`).then((r) => r.json()),
    ]);
    setFiscalYears(fyRes.data?.data || []);
    setDepartments(Array.isArray(depRes) ? depRes : depRes?.data || []);
  }, []);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 15 };
      if (filters.fiscal_year_id) params.fiscal_year_id = filters.fiscal_year_id;
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.status) params.status = filters.status;
      const res: any = await budgetApi.getBudgets(params);
      setBudgets(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchLists(); }, [fetchLists]);
  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const createBudget = async () => {
    await budgetApi.createBudget(form);
    setDialogOpen(false);
    fetchBudgets();
  };

  const doAction = async (action: string, id: any) => {
    if (action === 'submit') await budgetApi.submit(id);
    if (action === 'review') await budgetApi.review(id);
    if (action === 'approve') await budgetApi.approve(id);
    if (action === 'reject') {
      const reason = prompt('Rejection reason?') || '';
      await budgetApi.reject(id, reason);
    }
    if (action === 'close') await budgetApi.close(id);
    fetchBudgets();
  };

  const totalPages = meta?.last_page || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Manage institutional budgets.</p>
        </div>
        {can('budgets', 'create') && (
          <Button onClick={() => { setForm({ fiscal_year_id: '', department_id: '', title: '', description: '' }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Budget</Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={filters.fiscal_year_id || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, fiscal_year_id: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Fiscal Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {fiscalYears.map((fy) => <SelectItem key={fy.id} value={String(fy.id)}>{fy.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.department_id || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, department_id: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, status: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {['draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Fiscal Year</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : budgets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No budgets</TableCell></TableRow>
              ) : budgets.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.title}</TableCell>
                  <TableCell>{b.fiscal_year?.name}</TableCell>
                  <TableCell>{b.department?.name}</TableCell>
                  <TableCell>{b.total_requested_amount}</TableCell>
                  <TableCell>{b.total_approved_amount}</TableCell>
                  <TableCell><Badge>{b.status}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild><Link href={`/operations/budgets/${b.id}`}><Eye className="w-4 h-4" /></Link></Button>
                    {can('budgets', 'submit') && b.status === 'draft' && <Button size="sm" variant="outline" onClick={() => doAction('submit', b.id)}>Submit</Button>}
                    {can('budgets', 'review') && b.status === 'submitted' && <Button size="sm" variant="outline" onClick={() => doAction('review', b.id)}>Review</Button>}
                    {can('budgets', 'approve') && b.status === 'under_review' && <Button size="sm" onClick={() => doAction('approve', b.id)}>Approve</Button>}
                    {can('budgets', 'reject') && (b.status === 'submitted' || b.status === 'under_review') && <Button size="sm" variant="destructive" onClick={() => doAction('reject', b.id)}>Reject</Button>}
                    {can('budgets', 'close') && b.status === 'approved' && <Button size="sm" variant="outline" onClick={() => doAction('close', b.id)}>Close</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && (
            <div className="py-4 flex items-center justify-between px-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {budgets.length ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
              </div>
              <Pagination className="justify-end mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                  {Array.from({ length: meta.last_page }).map((_, i) => (
                    <PaginationItem key={i}><PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1} className="cursor-pointer">{i + 1}</PaginationLink></PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} className={page >= meta.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Budget</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Fiscal Year</Label>
              <Select value={form.fiscal_year_id} onValueChange={(v) => setForm({ ...form, fiscal_year_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{fiscalYears.map((fy) => <SelectItem key={fy.id} value={String(fy.id)}>{fy.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Department</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createBudget}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}