'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { hrApi, salaryApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const DOC_TYPES = ['contract', 'id', 'certificate', 'cv', 'appointment_letter', 'other'];
const LEAVE_TYPES = ['annual', 'sick', 'maternity', 'paternity', 'study', 'unpaid', 'other'];
const STATUSES = ['active', 'on_leave', 'suspended', 'resigned', 'terminated', 'retired'];

export default function HrDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { can } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [leave, setLeave] = useState<any[]>([]);
  const [placements, setPlacements] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [placementForm, setPlacementForm] = useState<any>({ salary_grade_id: '', salary_step_id: '', basic_salary: 0, effective_from: '', effective_to: '', remarks: '' });
  const [loading, setLoading] = useState(true);

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusForm, setStatusForm] = useState({ employment_status: 'active', notes: '' });

  const [docOpen, setDocOpen] = useState(false);
  const [docForm, setDocForm] = useState({ document_type: 'other', title: '' });
  const [docFile, setDocFile] = useState<File | null>(null);

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'annual', start_date: '', end_date: '', days: 1, reason: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, dRes, lRes, plRes, gRes]: any = await Promise.all([
        hrApi.getProfile(id),
        hrApi.getDocuments(id),
        hrApi.getLeave(id),
        salaryApi.getPlacements({ hr_profile_id: id }),
        salaryApi.getGrades({ per_page: 500 }),
      ]);
      setProfile(pRes.data?.data || pRes.data);
      setDocuments(dRes.data?.data || dRes.data || []);
      setLeave(lRes.data?.data || lRes.data || []);
      setPlacements(plRes.data?.data || []);
      setGrades(gRes.data?.data || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async () => {
    await hrApi.updateStatus(id, statusForm);
    setStatusOpen(false);
    load();
  };

  const uploadDoc = async () => {
    if (!docFile) return;
    const fd = new FormData();
    fd.append('document_type', docForm.document_type);
    fd.append('title', docForm.title);
    fd.append('file', docFile);
    await hrApi.uploadDocument(id, fd);
    setDocOpen(false);
    setDocFile(null);
    load();
  };

  const downloadDoc = async (doc: any) => {
    const token = localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res: any = await fetch(`${base}/hr-profiles/${id}/documents/${doc.id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.original_file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createLeave = async () => {
    await hrApi.createLeave(id, leaveForm);
    setLeaveOpen(false);
    load();
  };

  const createPlacement = async () => {
    await salaryApi.createPlacement({ ...placementForm, hr_profile_id: id, salary_grade_id: Number(placementForm.salary_grade_id), salary_step_id: Number(placementForm.salary_step_id), basic_salary: Number(placementForm.basic_salary) });
    setPlacementOpen(false);
    load();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!profile) return <div className="p-8">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/operations/hr"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold">{profile.user?.name || profile.user_id}</h1>
          <p className="text-muted-foreground">{profile.employee_number} · {profile.position_title}</p>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="salary">Salary Placement</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Employment Details</CardTitle>
              {can('hr', 'status.manage') && (
                <Button size="sm" onClick={() => { setStatusForm({ employment_status: profile.employment_status, notes: profile.notes || '' }); setStatusOpen(true); }}>Change Status</Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Department:</span> {profile.department?.name || '-'}</div>
              <div><span className="text-muted-foreground">Employment Type:</span> {profile.employment_type}</div>
              <div><span className="text-muted-foreground">Date of Employment:</span> {profile.date_of_employment}</div>
              <div><span className="text-muted-foreground">Contract Start:</span> {profile.contract_start_date || '-'}</div>
              <div><span className="text-muted-foreground">Contract End:</span> {profile.contract_end_date || '-'}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge>{profile.employment_status}</Badge></div>
              <div className="col-span-2"><span className="text-muted-foreground">Qualification:</span> {profile.qualification_summary || '-'}</div>
              <div><span className="text-muted-foreground">Emergency Contact:</span> {profile.emergency_contact_name || '-'}</div>
              <div><span className="text-muted-foreground">Emergency Phone:</span> {profile.emergency_contact_phone || '-'}</div>
              <div className="col-span-2"><span className="text-muted-foreground">Notes:</span> {profile.notes || '-'}</div>
              <div className="col-span-2 text-muted-foreground text-xs">Salary placement: Coming in next phase.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              {can('hr', 'documents.manage') && (
                <Button size="sm" onClick={() => { setDocForm({ document_type: 'other', title: '' }); setDocFile(null); setDocOpen(true); }}><Upload className="w-4 h-4 mr-2" />Upload</Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Title</TableHead><TableHead>File</TableHead><TableHead>Size</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6">No documents</TableCell></TableRow>
                  ) : documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.document_type}</TableCell>
                      <TableCell>{d.title}</TableCell>
                      <TableCell className="text-xs">{d.original_file_name}</TableCell>
                      <TableCell className="text-xs">{d.file_size}</TableCell>
                      <TableCell>
                        {can('hr', 'documents.manage') && (
                          <Button size="sm" variant="outline" onClick={() => downloadDoc(d)}><Download className="w-4 h-4" /></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Leave Records</CardTitle>
              {can('hr', 'leave.manage') && (
                <Button size="sm" onClick={() => { setLeaveForm({ leave_type: 'annual', start_date: '', end_date: '', days: 1, reason: '' }); setLeaveOpen(true); }}><Upload className="w-4 h-4 mr-2" />Request Leave</Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Reason</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {leave.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-6">No leave records</TableCell></TableRow>
                  ) : leave.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.leave_type}</TableCell>
                      <TableCell className="text-xs">{l.start_date}</TableCell>
                      <TableCell className="text-xs">{l.end_date}</TableCell>
                      <TableCell>{l.days}</TableCell>
                      <TableCell><Badge>{l.status}</Badge></TableCell>
                      <TableCell className="text-xs">{l.reason || '-'}</TableCell>
                      <TableCell className="space-x-1">
                        {can('hr', 'leave.manage') && l.status === 'pending' && (
                          <>
                            <Button size="sm" variant="outline" onClick={async () => { await hrApi.approveLeave(l.id); load(); }}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={async () => { await hrApi.rejectLeave(l.id); load(); }}>Reject</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="salary">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Salary Placement</CardTitle>
              <Button size="sm" onClick={() => { setPlacementForm({ salary_grade_id: '', salary_step_id: '', basic_salary: 0, effective_from: new Date().toISOString().slice(0,10), effective_to: '', remarks: '' }); setPlacementOpen(true); }}>New Placement</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Grade</TableHead><TableHead>Step</TableHead><TableHead>Basic Salary</TableHead><TableHead>Effective From</TableHead><TableHead>Effective To</TableHead><TableHead>Remarks</TableHead></TableRow></TableHeader>
                <TableBody>
                  {placements.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6">No placements</TableCell></TableRow>
                  ) : placements.map((pl: any) => (
                    <TableRow key={pl.id}>
                      <TableCell>{pl.grade?.name}</TableCell>
                      <TableCell>{pl.step?.step_number}</TableCell>
                      <TableCell>{pl.basic_salary}</TableCell>
                      <TableCell className="text-xs">{pl.effective_from}</TableCell>
                      <TableCell className="text-xs">{pl.effective_to || 'Active'}</TableCell>
                      <TableCell className="text-xs">{pl.remarks || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Dialog */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change Employment Status</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Status</Label>
              <Select value={statusForm.employment_status} onValueChange={(v) => setStatusForm({ ...statusForm, employment_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Notes</Label><Textarea value={statusForm.notes} onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button onClick={changeStatus}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={docOpen} onOpenChange={setDocOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Type</Label>
              <Select value={docForm.document_type} onValueChange={(v) => setDocForm({ ...docForm, document_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Title</Label><Input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>File</Label><Input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocOpen(false)}>Cancel</Button>
            <Button onClick={uploadDoc}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Dialog */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Type</Label>
              <Select value={leaveForm.leave_type} onValueChange={(v) => setLeaveForm({ ...leaveForm, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>End Date</Label><Input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Days</Label><Input type="number" value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Reason</Label><Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
            <Button onClick={createLeave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Salary Placement Dialog */}
      <Dialog open={placementOpen} onOpenChange={setPlacementOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Salary Placement</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Grade</Label>
              <Select value={placementForm.salary_grade_id} onValueChange={(v) => setPlacementForm({ ...placementForm, salary_grade_id: v, salary_step_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>{grades.map((g: any) => <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Step</Label>
              <Select value={placementForm.salary_step_id} onValueChange={(v) => { const g = grades.find((x:any)=>String(x.id)===placementForm.salary_grade_id); const s = g?.steps?.find((x:any)=>String(x.id)===v); setPlacementForm({ ...placementForm, salary_step_id: v, basic_salary: s?.basic_salary ?? placementForm.basic_salary }); }}>
                <SelectTrigger><SelectValue placeholder="Select step" /></SelectTrigger>
                <SelectContent>{(grades.find((g:any)=>String(g.id)===placementForm.salary_grade_id)?.steps || []).map((s:any) => <SelectItem key={s.id} value={String(s.id)}>Step {s.step_number} - {s.basic_salary}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Basic Salary</Label><Input type="number" value={placementForm.basic_salary} onChange={(e) => setPlacementForm({ ...placementForm, basic_salary: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Effective From</Label><Input type="date" value={placementForm.effective_from} onChange={(e) => setPlacementForm({ ...placementForm, effective_from: e.target.value })} /></div>
            <div className="space-y-1"><Label>Effective To</Label><Input type="date" value={placementForm.effective_to} onChange={(e) => setPlacementForm({ ...placementForm, effective_to: e.target.value })} /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={placementForm.remarks} onChange={(e) => setPlacementForm({ ...placementForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlacementOpen(false)}>Cancel</Button>
            <Button onClick={createPlacement}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}