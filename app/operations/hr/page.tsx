'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { hrApi } from '@/lib/api';
import { Search, Plus, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

const EMPLOYMENT_TYPES = ['permanent', 'contract', 'part_time', 'visiting', 'intern', 'other'];
const EMPLOYMENT_STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated', 'retired'];

export default function HrPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ department_id: '', employment_type: '', employment_status: '' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    user_id: '', employee_number: '', department_id: '', position_title: '',
    employment_type: 'permanent', date_of_employment: '', contract_start_date: '',
    contract_end_date: '', employment_status: 'active', qualification_summary: '',
    emergency_contact_name: '', emergency_contact_phone: '', notes: '',
  });

  const fetchDeps = useCallback(async () => {
    const res: any = await (await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/departments`)).json();
    setDepartments(Array.isArray(res) ? res : res?.data || []);
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 15 };
      if (search) params.search = search;
      if (filters.department_id) params.department_id = filters.department_id;
      if (filters.employment_type) params.employment_type = filters.employment_type;
      if (filters.employment_status) params.employment_status = filters.employment_status;
      const res: any = await hrApi.getProfiles(params);
      setProfiles(res.data?.data || []);
      setMeta(res.data?.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchDeps(); }, [fetchDeps]);
  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const openCreate = () => {
    setEditing(null);
    setForm({ user_id: '', employee_number: '', department_id: '', position_title: '', employment_type: 'permanent', date_of_employment: '', contract_start_date: '', contract_end_date: '', employment_status: 'active', qualification_summary: '', emergency_contact_name: '', emergency_contact_phone: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      user_id: p.user_id, employee_number: p.employee_number, department_id: p.department_id,
      position_title: p.position_title, employment_type: p.employment_type,
      date_of_employment: p.date_of_employment?.slice?.(0, 10) || p.date_of_employment,
      contract_start_date: p.contract_start_date?.slice?.(0, 10) || '',
      contract_end_date: p.contract_end_date?.slice?.(0, 10) || '',
      employment_status: p.employment_status, qualification_summary: p.qualification_summary || '',
      emergency_contact_name: p.emergency_contact_name || '', emergency_contact_phone: p.emergency_contact_phone || '',
      notes: p.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await hrApi.updateProfile(editing.id, form);
    } else {
      await hrApi.createProfile(form);
    }
    setDialogOpen(false);
    fetchProfiles();
  };

  const totalPages = meta?.last_page || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR Profiles</h1>
          <p className="text-muted-foreground">Manage staff HR records.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Profile</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search by name, employee number, department, position..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filters.department_id || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, department_id: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.employment_type || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, employment_type: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.employment_status || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, employment_status: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {EMPLOYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                <TableHead>Employee #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : profiles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No profiles</TableCell></TableRow>
              ) : profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.employee_number}</TableCell>
                  <TableCell className="font-medium">{p.user?.name || p.user_id}</TableCell>
                  <TableCell>{p.department?.name || '-'}</TableCell>
                  <TableCell>{p.position_title}</TableCell>
                  <TableCell><Badge variant="outline">{p.employment_type}</Badge></TableCell>
                  <TableCell><Badge variant={p.employment_status === 'active' ? 'default' : 'secondary'}>{p.employment_status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/operations/hr/${p.id}`}><Eye className="w-4 h-4" /></Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {meta && (
            <div className="py-4 flex items-center justify-between px-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {profiles.length ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit HR Profile' : 'Add HR Profile'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>User ID</Label><Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} disabled={!!editing} /></div>
            <div className="space-y-2"><Label>Employee Number</Label><Input value={form.employee_number} onChange={(e) => setForm({ ...form, employee_number: e.target.value })} /></div>
            <div className="space-y-2"><Label>Department</Label>
              <Select value={String(form.department_id)} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Position Title</Label><Input value={form.position_title} onChange={(e) => setForm({ ...form, position_title: e.target.value })} /></div>
            <div className="space-y-2"><Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date of Employment</Label><Input type="date" value={form.date_of_employment} onChange={(e) => setForm({ ...form, date_of_employment: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contract Start</Label><Input type="date" value={form.contract_start_date} onChange={(e) => setForm({ ...form, contract_start_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Contract End</Label><Input type="date" value={form.contract_end_date} onChange={(e) => setForm({ ...form, contract_end_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Status</Label>
              <Select value={form.employment_status} onValueChange={(v) => setForm({ ...form, employment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Qualification Summary</Label><Textarea value={form.qualification_summary} onChange={(e) => setForm({ ...form, qualification_summary: e.target.value })} /></div>
            <div className="col-span-2 space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}