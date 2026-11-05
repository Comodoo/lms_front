'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { salaryApi } from '@/lib/api';
import { Plus, Edit } from 'lucide-react';

export default function SalaryScalesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [allowances, setAllowances] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [gradeDialog, setGradeDialog] = useState(false);
  const [stepDialog, setStepDialog] = useState(false);
  const [allowanceDialog, setAllowanceDialog] = useState(false);
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [editingAllowance, setEditingAllowance] = useState<any>(null);

  const [gradeForm, setGradeForm] = useState({ name: '', code: '', description: '', is_active: true });
  const [stepForm, setStepForm] = useState({ step_number: 1, basic_salary: 0, is_active: true });
  const [allowanceForm, setAllowanceForm] = useState({ name: '', code: '', type: 'fixed', amount: 0, percentage: 0, applies_to: 'all', salary_grade_id: '', employment_type: '', is_active: true });

  const load = useCallback(async () => {
    const [gRes, aRes]: any = await Promise.all([
      salaryApi.getGrades({ per_page: 500 }),
      salaryApi.getAllowances({ per_page: 500 }),
    ]);
    const g = gRes.data?.data || [];
    setGrades(g);
    setAllowances(aRes.data?.data || []);
    if (!selectedGrade && g.length) setSelectedGrade(String(g[0].id));
  }, [selectedGrade]);

  useEffect(() => { load(); }, [load]);

  const selectedGradeObj = grades.find((g) => String(g.id) === selectedGrade);

  const saveGrade = async () => {
    if (editingGrade) await salaryApi.updateGrade(editingGrade.id, gradeForm);
    else await salaryApi.createGrade(gradeForm);
    setGradeDialog(false);
    load();
  };

  const saveStep = async () => {
    await salaryApi.createStep(selectedGrade, stepForm);
    setStepDialog(false);
    load();
  };

  const saveAllowance = async () => {
    if (editingAllowance) await salaryApi.updateAllowance(editingAllowance.id, allowanceForm);
    else await salaryApi.createAllowance(allowanceForm);
    setAllowanceDialog(false);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Scales</h1>
          <p className="text-muted-foreground">Manage salary grades, steps, and allowances.</p>
        </div>
        <Button onClick={() => { setEditingGrade(null); setGradeForm({ name: '', code: '', description: '', is_active: true }); setGradeDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Grade</Button>
      </div>

      <Tabs defaultValue="grades">
        <TabsList>
          <TabsTrigger value="grades">Grades & Steps</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
        </TabsList>

        <TabsContent value="grades">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle>Salary Grades</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {grades.map((g) => (
                      <TableRow key={g.id} className={String(g.id) === selectedGrade ? 'bg-muted' : ''}>
                        <TableCell className="cursor-pointer" onClick={() => setSelectedGrade(String(g.id))}>{g.name}</TableCell>
                        <TableCell>{g.code}</TableCell>
                        <TableCell>
                          <Button size="icon" variant="ghost" onClick={() => { setEditingGrade(g); setGradeForm({ name: g.name, code: g.code, description: g.description || '', is_active: g.is_active }); setGradeDialog(true); }}><Edit className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Steps — {selectedGradeObj?.name}</CardTitle>
                <Button size="sm" onClick={() => { setStepForm({ step_number: (selectedGradeObj?.steps?.length || 0) + 1, basic_salary: 0, is_active: true }); setStepDialog(true); }} disabled={!selectedGrade}><Plus className="w-4 h-4 mr-2" />Add Step</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Step</TableHead><TableHead>Basic Salary</TableHead><TableHead>Active</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {(selectedGradeObj?.steps || []).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.step_number}</TableCell>
                        <TableCell>{s.basic_salary}</TableCell>
                        <TableCell><Badge variant={s.is_active ? 'default' : 'secondary'}>{s.is_active ? 'Yes' : 'No'}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="allowances">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Allowances</CardTitle>
              <Button size="sm" onClick={() => { setEditingAllowance(null); setAllowanceForm({ name: '', code: '', type: 'fixed', amount: 0, percentage: 0, applies_to: 'all', salary_grade_id: '', employment_type: '', is_active: true }); setAllowanceDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Allowance</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Amount/Percent</TableHead><TableHead>Applies To</TableHead></TableRow></TableHeader>
                <TableBody>
                  {allowances.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.name}</TableCell>
                      <TableCell className="font-mono text-xs">{a.code}</TableCell>
                      <TableCell>{a.type}</TableCell>
                      <TableCell>{a.type === 'fixed' ? a.amount : `${a.percentage}%`}</TableCell>
                      <TableCell>{a.applies_to}{a.salary_grade_id ? ` (grade ${a.salary_grade_id})` : ''}{a.employment_type ? ` (${a.employment_type})` : ''}</TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingAllowance(a); setAllowanceForm({ name: a.name, code: a.code, type: a.type, amount: a.amount || 0, percentage: a.percentage || 0, applies_to: a.applies_to, salary_grade_id: a.salary_grade_id ? String(a.salary_grade_id) : '', employment_type: a.employment_type || '', is_active: a.is_active }); setAllowanceDialog(true); }}><Edit className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <Dialog open={gradeDialog} onOpenChange={setGradeDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGrade ? 'Edit Grade' : 'Add Grade'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Name</Label><Input value={gradeForm.name} onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Code</Label><Input value={gradeForm.code} onChange={(e) => setGradeForm({ ...gradeForm, code: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={gradeForm.description} onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(false)}>Cancel</Button>
            <Button onClick={saveGrade}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Step Dialog */}
      <Dialog open={stepDialog} onOpenChange={setStepDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Step</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Step Number</Label><Input type="number" value={stepForm.step_number} onChange={(e) => setStepForm({ ...stepForm, step_number: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Basic Salary</Label><Input type="number" value={stepForm.basic_salary} onChange={(e) => setStepForm({ ...stepForm, basic_salary: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialog(false)}>Cancel</Button>
            <Button onClick={saveStep}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Allowance Dialog */}
      <Dialog open={allowanceDialog} onOpenChange={setAllowanceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingAllowance ? 'Edit Allowance' : 'Add Allowance'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={allowanceForm.name} onChange={(e) => setAllowanceForm({ ...allowanceForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Code</Label><Input value={allowanceForm.code} onChange={(e) => setAllowanceForm({ ...allowanceForm, code: e.target.value })} /></div>
            <div className="space-y-2"><Label>Type</Label>
              <Select value={allowanceForm.type} onValueChange={(v) => setAllowanceForm({ ...allowanceForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Applies To</Label>
              <Select value={allowanceForm.applies_to} onValueChange={(v) => setAllowanceForm({ ...allowanceForm, applies_to: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="salary_grade">Salary Grade</SelectItem>
                  <SelectItem value="employment_type">Employment Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {allowanceForm.type === 'fixed' ? (
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={allowanceForm.amount} onChange={(e) => setAllowanceForm({ ...allowanceForm, amount: Number(e.target.value) })} /></div>
            ) : (
              <div className="space-y-2"><Label>Percentage</Label><Input type="number" value={allowanceForm.percentage} onChange={(e) => setAllowanceForm({ ...allowanceForm, percentage: Number(e.target.value) })} /></div>
            )}
            {allowanceForm.applies_to === 'salary_grade' && (
              <div className="space-y-2"><Label>Salary Grade</Label>
                <Select value={allowanceForm.salary_grade_id} onValueChange={(v) => setAllowanceForm({ ...allowanceForm, salary_grade_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{grades.map((g) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {allowanceForm.applies_to === 'employment_type' && (
              <div className="space-y-2"><Label>Employment Type</Label><Input value={allowanceForm.employment_type} onChange={(e) => setAllowanceForm({ ...allowanceForm, employment_type: e.target.value })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAllowanceDialog(false)}>Cancel</Button>
            <Button onClick={saveAllowance}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}