'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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

export default function InventoryDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [disposeOpen, setDisposeOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const [receiveForm, setReceiveForm] = useState({ quantity: 1, location_id: '', condition: '', remarks: '' });
  const [assignForm, setAssignForm] = useState({ to_user_id: '', quantity: 1, remarks: '' });
  const [transferForm, setTransferForm] = useState({ to_location_id: '', quantity: 1, remarks: '' });
  const [returnForm, setReturnForm] = useState({ quantity: 1, location_id: '', condition: '', remarks: '' });
  const [disposeForm, setDisposeForm] = useState({ quantity: 1, remarks: '' });
  const [auditForm, setAuditForm] = useState({ audit_date: new Date().toISOString().slice(0, 10), location_id: '', expected_quantity: 0, counted_quantity: 0, condition: '', remarks: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, histRes, auditRes, locRes]: any = await Promise.all([
        inventoryApi.getItem(id),
        inventoryApi.getHistory(id, { per_page: 100 }),
        inventoryApi.getAudits({ inventory_item_id: id, per_page: 100 }),
        inventoryApi.getLocations({ per_page: 500 }),
      ]);
      setItem(itemRes.data?.data || itemRes.data);
      setHistory(histRes.data?.data || []);
      setAudits(auditRes.data?.data || []);
      setLocations(locRes.data?.data || locRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const runAction = async (fn: () => Promise<any>) => {
    await fn();
    await load();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!item) return <div className="p-8">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/operations/inventory"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold">{item.name}</h1>
          <p className="text-muted-foreground font-mono text-sm">{item.asset_tag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Category:</span> {item.category?.name || '-'}</div>
            <div><span className="text-muted-foreground">Location:</span> {item.location?.name || '-'}</div>
            <div><span className="text-muted-foreground">Quantity:</span> {item.quantity} {item.unit}</div>
            <div><span className="text-muted-foreground">Condition:</span> <Badge variant="outline">{item.condition}</Badge></div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusVariant(item.status) as any}>{item.status}</Badge></div>
            <div><span className="text-muted-foreground">Custodian:</span> {item.custodian?.name || 'Unassigned'}</div>
            <div><span className="text-muted-foreground">Serial:</span> {item.serial_number || '-'}</div>
            <div><span className="text-muted-foreground">Purchase Cost:</span> {item.purchase_cost ?? '-'}</div>
            <div><span className="text-muted-foreground">Notes:</span> {item.notes || '-'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setReceiveForm({ quantity: 1, location_id: String(item.location_id), condition: item.condition, remarks: '' }); setReceiveOpen(true); }}>Receive</Button>
            <Button size="sm" variant="secondary" onClick={() => { setAssignForm({ to_user_id: '', quantity: item.quantity, remarks: '' }); setAssignOpen(true); }}>Assign</Button>
            <Button size="sm" variant="outline" onClick={() => { setTransferForm({ to_location_id: '', quantity: item.quantity, remarks: '' }); setTransferOpen(true); }}>Transfer</Button>
            <Button size="sm" variant="outline" onClick={() => { setReturnForm({ quantity: item.quantity, location_id: String(item.location_id), condition: item.condition, remarks: '' }); setReturnOpen(true); }}>Return</Button>
            <Button size="sm" variant="outline" onClick={() => runAction(() => inventoryApi.repair(item.id, { remarks: 'Sent for repair' }))}>Repair</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirm('Mark as lost?')) runAction(() => inventoryApi.markLost(item.id, { quantity: item.quantity, remarks: 'Marked lost' })); }}>Mark Lost</Button>
            <Button size="sm" variant="destructive" onClick={() => { setDisposeForm({ quantity: item.quantity, remarks: '' }); setDisposeOpen(true); }}>Dispose</Button>
            <Button size="sm" variant="outline" onClick={() => { setAuditForm({ audit_date: new Date().toISOString().slice(0, 10), location_id: String(item.location_id), expected_quantity: item.quantity, counted_quantity: item.quantity, condition: item.condition, remarks: '' }); setAuditOpen(true); }}>Audit</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Movement History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6">No history</TableCell></TableRow>
              ) : history.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs">{new Date(h.transaction_date).toLocaleString()}</TableCell>
                  <TableCell>{h.transaction_type}</TableCell>
                  <TableCell>{h.from_location?.name || h.from_user?.name || '-'}</TableCell>
                  <TableCell>{h.to_location?.name || h.to_user?.name || '-'}</TableCell>
                  <TableCell>{h.quantity}</TableCell>
                  <TableCell>{h.condition || '-'}</TableCell>
                  <TableCell className="text-xs">{h.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Audit History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Counted</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6">No audits</TableCell></TableRow>
              ) : audits.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{a.audit_date}</TableCell>
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

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Receive Stock</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Location</Label>
              <Select value={receiveForm.location_id} onValueChange={(v) => setReceiveForm({ ...receiveForm, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Condition</Label>
              <Select value={receiveForm.condition} onValueChange={(v) => setReceiveForm({ ...receiveForm, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={receiveForm.remarks} onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(() => inventoryApi.receive(item.id, receiveForm)).then(() => setReceiveOpen(false))}>Receive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>To User ID</Label><Input value={assignForm.to_user_id} onChange={(e) => setAssignForm({ ...assignForm, to_user_id: e.target.value })} /></div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={assignForm.quantity} onChange={(e) => setAssignForm({ ...assignForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={assignForm.remarks} onChange={(e) => setAssignForm({ ...assignForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(() => inventoryApi.assign(item.id, assignForm)).then(() => setAssignOpen(false))}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Transfer Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>To Location</Label>
              <Select value={transferForm.to_location_id} onValueChange={(v) => setTransferForm({ ...transferForm, to_location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={transferForm.quantity} onChange={(e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={transferForm.remarks} onChange={(e) => setTransferForm({ ...transferForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(() => inventoryApi.transfer(item.id, transferForm)).then(() => setTransferOpen(false))}>Transfer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Return Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={returnForm.quantity} onChange={(e) => setReturnForm({ ...returnForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Location</Label>
              <Select value={returnForm.location_id} onValueChange={(v) => setReturnForm({ ...returnForm, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Condition</Label>
              <Select value={returnForm.condition} onValueChange={(v) => setReturnForm({ ...returnForm, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={returnForm.remarks} onChange={(e) => setReturnForm({ ...returnForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReturnOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(() => inventoryApi.returnItem(item.id, returnForm)).then(() => setReturnOpen(false))}>Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose Dialog */}
      <Dialog open={disposeOpen} onOpenChange={setDisposeOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Dispose Item</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={disposeForm.quantity} onChange={(e) => setDisposeForm({ ...disposeForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={disposeForm.remarks} onChange={(e) => setDisposeForm({ ...disposeForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => runAction(() => inventoryApi.dispose(item.id, disposeForm)).then(() => setDisposeOpen(false))}>Dispose</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Dialog */}
      <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Audit Record</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Audit Date</Label><Input type="date" value={auditForm.audit_date} onChange={(e) => setAuditForm({ ...auditForm, audit_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Location</Label>
              <Select value={auditForm.location_id} onValueChange={(v) => setAuditForm({ ...auditForm, location_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Expected Qty</Label><Input type="number" value={auditForm.expected_quantity} onChange={(e) => setAuditForm({ ...auditForm, expected_quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Counted Qty</Label><Input type="number" value={auditForm.counted_quantity} onChange={(e) => setAuditForm({ ...auditForm, counted_quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Condition</Label>
              <Select value={auditForm.condition} onValueChange={(v) => setAuditForm({ ...auditForm, condition: v })}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>{CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={auditForm.remarks} onChange={(e) => setAuditForm({ ...auditForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditOpen(false)}>Cancel</Button>
            <Button onClick={() => runAction(() => inventoryApi.createAudit({ ...auditForm, inventory_item_id: item.id })).then(() => setAuditOpen(false))}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}