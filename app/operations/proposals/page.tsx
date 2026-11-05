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
import { proposalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Eye } from 'lucide-react';
import Link from 'next/link';

const TYPES = ['business_plan', 'strategic_plan', 'project_proposal', 'departmental_plan', 'other'];
const STATUSES = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'published', 'closed'];

export default function ProposalsPage() {
  const { can } = useAuth();
  const [proposals, setProposals] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', department_id: '', status: '', date_from: '', date_to: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', department_id: '', summary: '', background: '', objectives: '', expected_outcomes: '', implementation_period_start: '', implementation_period_end: '', total_budget_amount: 0, funding_source: '' });

  const fetchDeps = useCallback(async () => {
    const res: any = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments`).then((r) => r.json());
    setDepartments(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 15 };
      if (filters.type) params.type = filters.type;
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.status) params.status = filters.status;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      const res: any = await proposalApi.getProposals(params);
      setProposals(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchDeps(); }, [fetchDeps]);
  useEffect(() => { fetchProposals(); }, [fetchProposals]);

  const createProposal = async () => {
    await proposalApi.createProposal(form);
    setDialogOpen(false);
    fetchProposals();
  };

  const doAction = async (action: string, id: any) => {
    if (action === 'submit') await proposalApi.submit(id);
    if (action === 'review') await proposalApi.review(id);
    if (action === 'approve') await proposalApi.approve(id);
    if (action === 'reject') {
      const reason = prompt('Rejection reason?') || '';
      await proposalApi.reject(id, reason);
    }
    if (action === 'publish') await proposalApi.publish(id);
    if (action === 'close') await proposalApi.close(id);
    fetchProposals();
  };

  const totalPages = meta?.last_page || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposals & Plans</h1>
          <p className="text-muted-foreground">Manage proposals and strategic plans.</p>
        </div>
        {can('proposals', 'create') && (
          <Button onClick={() => { setForm({ title: '', type: 'other', department_id: '', summary: '', background: '', objectives: '', expected_outcomes: '', implementation_period_start: '', implementation_period_end: '', total_budget_amount: 0, funding_source: '' }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Proposal</Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={filters.type || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, type: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filters.date_from} onChange={(e) => { setFilters((f) => ({ ...f, date_from: e.target.value })); setPage(1); }} className="w-[150px]" />
            <Input type="date" value={filters.date_to} onChange={(e) => { setFilters((f) => ({ ...f, date_to: e.target.value })); setPage(1); }} className="w-[150px]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : proposals.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No proposals</TableCell></TableRow>
              ) : proposals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.reference_number}</TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.type}</TableCell>
                  <TableCell>{p.department?.name}</TableCell>
                  <TableCell>{p.total_budget_amount}</TableCell>
                  <TableCell><Badge>{p.status}</Badge></TableCell>
                  <TableCell>{p.implementation_progress}%</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" asChild><Link href={`/operations/proposals/${p.id}`}><Eye className="w-4 h-4" /></Link></Button>
                    {can('proposals', 'submit') && p.status === 'draft' && <Button size="sm" variant="outline" onClick={() => doAction('submit', p.id)}>Submit</Button>}
                    {can('proposals', 'review') && p.status === 'submitted' && <Button size="sm" variant="outline" onClick={() => doAction('review', p.id)}>Review</Button>}
                    {can('proposals', 'approve') && p.status === 'under_review' && <Button size="sm" onClick={() => doAction('approve', p.id)}>Approve</Button>}
                    {can('proposals', 'reject') && (p.status === 'submitted' || p.status === 'under_review') && <Button size="sm" variant="destructive" onClick={() => doAction('reject', p.id)}>Reject</Button>}
                    {can('proposals', 'publish') && p.status === 'approved' && <Button size="sm" onClick={() => doAction('publish', p.id)}>Publish</Button>}
                    {can('proposals', 'update') && p.status === 'published' && <Button size="sm" variant="outline" onClick={() => doAction('close', p.id)}>Close</Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && (
            <div className="py-4 flex items-center justify-between px-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {proposals.length ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
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
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Department</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Total Budget</Label><Input type="number" value={form.total_budget_amount} onChange={(e) => setForm({ ...form, total_budget_amount: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Funding Source</Label><Input value={form.funding_source} onChange={(e) => setForm({ ...form, funding_source: e.target.value })} /></div>
            <div className="space-y-2"><Label>Period Start</Label><Input type="date" value={form.implementation_period_start} onChange={(e) => setForm({ ...form, implementation_period_start: e.target.value })} /></div>
            <div className="space-y-2"><Label>Period End</Label><Input type="date" value={form.implementation_period_end} onChange={(e) => setForm({ ...form, implementation_period_end: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Summary</Label><Textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Background</Label><Textarea value={form.background} onChange={(e) => setForm({ ...form, background: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Objectives</Label><Textarea value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Expected Outcomes</Label><Textarea value={form.expected_outcomes} onChange={(e) => setForm({ ...form, expected_outcomes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createProposal}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}