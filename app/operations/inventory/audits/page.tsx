'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { inventoryApi } from '@/lib/api';
import { Plus } from 'lucide-react';

const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];

export default function InventoryAuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    audit_date: new Date().toISOString().slice(0, 10),
    location_id: '',
    inventory_item_id: '',
    expected_quantity: 0,
    counted_quantity: 0,
    condition: '',
    remarks: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, iRes, lRes]: any = await Promise.all([
        inventoryApi.getAudits({ per_page: 100 }),
        inventoryApi.getItems({ per_page: 500 }),
        inventoryApi.getLocations({ per_page: 500 }),
      ]);
      setAudits(aRes.data?.data || []);
      setItems(iRes.data?.data || []);
      setLocations(lRes.data?.data || lRes.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await inventoryApi.createAudit(form);
    setOpen(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Audits</h1>
          <p className="text-muted-foreground">Record and review inventory audits.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />New Audit</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Counted</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : audits.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">No audits</TableCell></TableRow>
              ) : audits.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{a.audit_date}</TableCell>
                  <TableCell>{a.item?.name || a.inventory_item_id}</TableCell>
                  <TableCell>{a.location?.name || '-'}</TableCell>
                  <TableCell>{a.expected_quantity}</TableCell>
                  <TableCell>{a.counted_quantity}</TableCell>
                  <TableCell>{a.variance}</TableCell>
                  <TableCell>{a.condition || '-'}</TableCell>
                  <TableCell className="text-xs">{a.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Audit</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Audit Date</Label><Input type="date" value={form.audit_date} onChange={(e) => setForm({ ...form, audit_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Location</Label>
              <Select value={form.location_id} onValueChange={(v) => setForm({ ...form, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Item</Label>
              <Select value={form.inventory_item_id} onValueChange={(v) => setForm({ ...form, inventory_item_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{items.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.asset_tag} - {i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Expected Qty</Label><Input type="number" value={form.expected_quantity} onChange={(e) => setForm({ ...form, expected_quantity: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label>Counted Qty</Label><Input type="number" value={form.counted_quantity} onChange={(e) => setForm({ ...form, counted_quantity: Number(e.target.value) })} /></div>
            <div className="col-span-2 space-y-2"><Label>Remarks</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
