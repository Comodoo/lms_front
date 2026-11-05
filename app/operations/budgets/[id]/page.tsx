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
import { budgetApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BudgetDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { can } = useAuth();

  const [budget, setBudget] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lineDialog, setLineDialog] = useState(false);
  const [expDialog, setExpDialog] = useState(false);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [lineForm, setLineForm] = useState({ budget_category_id: '', name: '', description: '', quantity: 1, unit_cost: 0, requested_amount: 0, approved_amount: 0 });
  const [expForm, setExpForm] = useState({ expenditure_date: new Date().toISOString().slice(0, 10), description: '', amount: 0, reference_number: '', payment_method: '' });
  const [expenditures, setExpenditures] = useState<Record<string, any[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, cRes]: any = await Promise.all([
        budgetApi.getBudget(id),
        budgetApi.getCategories({ per_page: 500 }),
      ]);
      setBudget(bRes.data?.data || bRes.data);
      setCategories(cRes.data?.data || []);
      // load expenditures for each line
      const b = bRes.data?.data || bRes.data;
      const exps: Record<string, any[]> = {};
      await Promise.all((b?.lines || []).map(async (line: any) => {
        const eRes: any = await budgetApi.getExpenditures(line.id, { per_page: 100 });
        exps[line.id] = eRes.data?.data || [];
      }));
      setExpenditures(exps);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addLine = async () => {
    await budgetApi.addLine(id, lineForm);
    setLineDialog(false);
    load();
  };

  const addExpenditure = async () => {
    if (!selectedLine) return;
    await budgetApi.createExpenditure(selectedLine.id, expForm);
    setExpDialog(false);
    load();
  };

  const verifyExp = async (expId: any) => {
    await budgetApi.verifyExpenditure(expId);
    load();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!budget) return <div className="p-8">Not found</div>;

  const totalRequested = budget.total_requested_amount;
  const totalApproved = budget.total_approved_amount;
  const totalSpent = (budget.lines || []).reduce((s: number, l: any) => s + Number(l.spent_amount || 0), 0);
  const remaining = Number(totalApproved) - totalSpent;
  const utilization = Number(totalApproved) > 0 ? (totalSpent / Number(totalApproved)) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/operations/budgets"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold">{budget.title}</h1>
          <p className="text-muted-foreground">{budget.fiscal_year?.name} · {budget.department?.name} · {budget.status}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Requested</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalRequested}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Approved</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalApproved}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Spent</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalSpent}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Remaining</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{remaining}</p><p className="text-xs text-muted-foreground">Utilization: {utilization.toFixed(1)}%</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Lines</CardTitle>
          {can('budgets', 'update') && budget.status === 'draft' && (
            <Button size="sm" onClick={() => { setLineForm({ budget_category_id: '', name: '', description: '', quantity: 1, unit_cost: 0, requested_amount: 0, approved_amount: 0 }); setLineDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Line</Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Name</TableHead><TableHead>Qty</TableHead><TableHead>Unit Cost</TableHead><TableHead>Requested</TableHead><TableHead>Approved</TableHead><TableHead>Spent</TableHead><TableHead>Variance</TableHead><TableHead>Util %</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {(budget.lines || []).length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-6">No lines</TableCell></TableRow>
              ) : (budget.lines || []).map((l: any) => (
                <TableRow key={l.id}>
                  <TableCell>{l.category?.name}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.quantity}</TableCell>
                  <TableCell>{l.unit_cost}</TableCell>
                  <TableCell>{l.requested_amount}</TableCell>
                  <TableCell>{l.approved_amount}</TableCell>
                  <TableCell>{l.spent_amount}</TableCell>
                  <TableCell>{(Number(l.approved_amount) - Number(l.spent_amount)).toFixed(2)}</TableCell>
                  <TableCell>{Number(l.approved_amount) > 0 ? ((Number(l.spent_amount) / Number(l.approved_amount)) * 100).toFixed(1) : 0}%</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => { setSelectedLine(l); setExpForm({ expenditure_date: new Date().toISOString().slice(0, 10), description: '', amount: 0, reference_number: '', payment_method: '' }); setExpDialog(true); }}>Add Expense</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(budget.lines || []).map((l: any) => (
        <Card key={`exp-${l.id}`}>
          <CardHeader><CardTitle>Expenditures — {l.name}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Reference</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {(expenditures[l.id] || []).length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-6">No expenditures</TableCell></TableRow>
                ) : (expenditures[l.id] || []).map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs">{e.expenditure_date}</TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell>{e.amount}</TableCell>
                    <TableCell className="text-xs">{e.reference_number || '-'}</TableCell>
                    <TableCell>{e.payment_method || '-'}</TableCell>
                    <TableCell><Badge>{e.status}</Badge></TableCell>
                    <TableCell>
                      {can('budgets', 'approve') && e.status === 'recorded' && (
                        <Button size="sm" variant="outline" onClick={() => verifyExp(e.id)}>Verify</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {/* Add Line Dialog */}
      <Dialog open={lineDialog} onOpenChange={setLineDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Budget Line</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Category</Label>
              <Select value={lineForm.budget_category_id} onValueChange={(v) => setLineForm({ ...lineForm, budget_category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Name</Label><Input value={lineForm.name} onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={lineForm.description} onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Quantity</Label><Input type="number" value={lineForm.quantity} onChange={(e) => setLineForm({ ...lineForm, quantity: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Unit Cost</Label><Input type="number" value={lineForm.unit_cost} onChange={(e) => setLineForm({ ...lineForm, unit_cost: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Requested Amount</Label><Input type="number" value={lineForm.requested_amount} onChange={(e) => setLineForm({ ...lineForm, requested_amount: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Approved Amount</Label><Input type="number" value={lineForm.approved_amount} onChange={(e) => setLineForm({ ...lineForm, approved_amount: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLineDialog(false)}>Cancel</Button>
            <Button onClick={addLine}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expenditure Dialog */}
      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Expenditure</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={expForm.expenditure_date} onChange={(e) => setExpForm({ ...expForm, expenditure_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Amount</Label><Input type="number" value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Reference Number</Label><Input value={expForm.reference_number} onChange={(e) => setExpForm({ ...expForm, reference_number: e.target.value })} /></div>
            <div className="space-y-1"><Label>Payment Method</Label><Input value={expForm.payment_method} onChange={(e) => setExpForm({ ...expForm, payment_method: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button onClick={addExpenditure}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}