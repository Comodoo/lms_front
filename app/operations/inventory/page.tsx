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
import { inventoryApi } from '@/lib/api';
import { Search, Plus, Download, Edit, Eye } from 'lucide-react';
import Link from 'next/link';

const STATUSES = ['available', 'assigned', 'under_repair', 'lost', 'disposed'];
const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];

function statusVariant(status: string) {
  switch (status) {
    case 'available': return 'default';
    case 'assigned': return 'secondary';
    case 'under_repair': return 'outline';
    case 'lost': return 'destructive';
    case 'disposed': return 'destructive';
    default: return 'outline';
  }
}

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category_id: '', location_id: '', status: '', condition: '' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({
    asset_tag: '', name: '', description: '', category_id: '', location_id: '',
    quantity: 1, unit: 'unit', condition: 'good', status: 'available',
    serial_number: '', notes: '',
  });

  const fetchLists = useCallback(async () => {
    const [catRes, locRes]: any = await Promise.all([
      inventoryApi.getCategories({ per_page: 500 }),
      inventoryApi.getLocations({ per_page: 500 }),
    ]);
    setCategories(catRes.data?.data || catRes.data || []);
    setLocations(locRes.data?.data || locRes.data || []);
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 15 };
      if (search) params.search = search;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.location_id) params.location_id = filters.location_id;
      if (filters.status) params.status = filters.status;
      if (filters.condition) params.condition = filters.condition;
      const res: any = await inventoryApi.getItems(params);
      const body = res.data;
      setItems(body?.data || []);
      setMeta(body?.meta || null);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchLists(); }, [fetchLists]);
  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openCreate = () => {
    setEditing(null);
    setForm({ asset_tag: '', name: '', description: '', category_id: '', location_id: '', quantity: 1, unit: 'unit', condition: 'good', status: 'available', serial_number: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      asset_tag: item.asset_tag, name: item.name, description: item.description || '',
      category_id: item.category_id, location_id: item.location_id,
      quantity: item.quantity, unit: item.unit, condition: item.condition, status: item.status,
      serial_number: item.serial_number || '', notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editing) {
      await inventoryApi.updateItem(editing.id, form);
    } else {
      await inventoryApi.createItem(form);
    }
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this item?')) return;
    await inventoryApi.deleteItem(id);
    fetchItems();
  };

  const exportCsv = async () => {
    const token = localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res: any = await fetch(base + '/inventory-items/export', { headers: { Authorization: 'Bearer ' + token } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-items.csv';
    a.click();
    URL.revokeObjectURL(url);
    return;
  };

  const totalPages = meta?.last_page || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage assets and stock items.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Search by asset tag, name, serial..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
            <Select value={filters.category_id || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, category_id: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.location_id || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, location_id: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, status: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.condition || 'all'} onValueChange={(v) => { setFilters((f) => ({ ...f, condition: v === 'all' ? '' : v })); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Condition" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <TableHead>Asset Tag</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No items found</TableCell></TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.asset_tag}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category?.name || '-'}</TableCell>
                    <TableCell>{item.location?.name || '-'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell><Badge variant="outline">{item.condition}</Badge></TableCell>
                    <TableCell><Badge variant={statusVariant(item.status) as any}>{item.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/operations/inventory/${item.id}`}><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Edit className="w-4 h-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {meta && (
            <div className="py-4 flex items-center justify-between px-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {items.length ? (meta.current_page - 1) * meta.per_page + 1 : 0} to {Math.min(meta.current_page * meta.per_page, meta.total)} of {meta.total}
              </div>
              <Pagination className="justify-end mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {Array.from({ length: meta.last_page }).map((_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink onClick={() => setPage(i + 1)} isActive={page === i + 1} className="cursor-pointer">{i + 1}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} className={page >= meta.last_page ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? 'Edit Item' : 'Add Item'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Asset Tag</Label>
              <Input value={form.asset_tag} onChange={(e) => setForm({ ...form, asset_tag: e.target.value })} disabled={!!editing} />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={String(form.category_id)} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={String(form.location_id)} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number</Label>
              <Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
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
