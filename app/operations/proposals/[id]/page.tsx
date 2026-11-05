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
import { proposalApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ArrowLeft, Plus, Download, Upload } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const ACTIVITY_STATUSES = ['planned', 'in_progress', 'completed', 'delayed', 'cancelled'];

export default function ProposalDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { can } = useAuth();

  const [proposal, setProposal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [activityDialog, setActivityDialog] = useState(false);
  const [kpiDialog, setKpiDialog] = useState(false);
  const [attachmentDialog, setAttachmentDialog] = useState(false);

  const [activityForm, setActivityForm] = useState({ title: '', description: '', responsible_person_id: '', start_date: '', end_date: '', budget_amount: 0, status: 'planned', progress_percentage: 0 });
  const [kpiForm, setKpiForm] = useState({ name: '', target_value: '', actual_value: '', unit: '', measurement_frequency: '', status: '', remarks: '' });
  const [attachmentForm, setAttachmentForm] = useState({ title: '' });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await proposalApi.getProposal(id);
      setProposal(res.data?.data || res.data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addActivity = async () => {
    await proposalApi.addActivity(id, activityForm);
    setActivityDialog(false);
    load();
  };

  const updateActivityProgress = async (act: any, progress: number) => {
    await proposalApi.updateActivity(act.id, { progress_percentage: progress });
    load();
  };

  const addKpi = async () => {
    await proposalApi.addKpi(id, kpiForm);
    setKpiDialog(false);
    load();
  };

  const updateKpiActual = async (kpi: any, actual: string) => {
    await proposalApi.updateKpi(kpi.id, { actual_value: actual });
    load();
  };

  const uploadAttachment = async () => {
    if (!attachmentFile) return;
    const fd = new FormData();
    fd.append('title', attachmentForm.title);
    fd.append('file', attachmentFile);
    await proposalApi.uploadAttachment(id, fd);
    setAttachmentDialog(false);
    setAttachmentFile(null);
    load();
  };

  const downloadAttachment = async (att: any) => {
    const token = localStorage.getItem('auth_token');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res: any = await fetch(`${base}/proposals/${id}/attachments/${att.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.original_file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doAction = async (action: string) => {
    if (action === 'submit') await proposalApi.submit(id);
    if (action === 'review') await proposalApi.review(id);
    if (action === 'approve') await proposalApi.approve(id);
    if (action === 'reject') {
      const reason = prompt('Rejection reason?') || '';
      await proposalApi.reject(id, reason);
    }
    if (action === 'publish') await proposalApi.publish(id);
    if (action === 'close') await proposalApi.close(id);
    load();
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!proposal) return <div className="p-8">Not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/operations/proposals"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div>
          <h1 className="text-3xl font-bold">{proposal.title}</h1>
          <p className="text-muted-foreground">{proposal.reference_number} · {proposal.type} · {proposal.status}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {can('proposals', 'submit') && proposal.status === 'draft' && (proposal.activities?.length || 0) > 0 && <Button size="sm" onClick={() => doAction('submit')}>Submit</Button>}
        {can('proposals', 'review') && proposal.status === 'submitted' && <Button size="sm" variant="outline" onClick={() => doAction('review')}>Review</Button>}
        {can('proposals', 'approve') && proposal.status === 'under_review' && <Button size="sm" onClick={() => doAction('approve')}>Approve</Button>}
        {can('proposals', 'reject') && (proposal.status === 'submitted' || proposal.status === 'under_review') && <Button size="sm" variant="destructive" onClick={() => doAction('reject')}>Reject</Button>}
        {can('proposals', 'publish') && proposal.status === 'approved' && <Button size="sm" onClick={() => doAction('publish')}>Publish</Button>}
        {can('proposals', 'update') && proposal.status === 'published' && <Button size="sm" variant="outline" onClick={() => doAction('close')}>Close</Button>}
      </div>

      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-muted-foreground">Department:</span> {proposal.department?.name || '-'}</div>
          <div><span className="text-muted-foreground">Owner:</span> {proposal.owner?.name || '-'}</div>
          <div><span className="text-muted-foreground">Budget:</span> {proposal.total_budget_amount}</div>
          <div><span className="text-muted-foreground">Funding Source:</span> {proposal.funding_source || '-'}</div>
          <div><span className="text-muted-foreground">Period:</span> {proposal.implementation_period_start} to {proposal.implementation_period_end}</div>
          <div><span className="text-muted-foreground">Progress:</span> {proposal.implementation_progress}%</div>
          <div className="col-span-2"><span className="text-muted-foreground">Summary:</span> {proposal.summary || '-'}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Background:</span> {proposal.background || '-'}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Objectives:</span> {proposal.objectives || '-'}</div>
          <div className="col-span-2"><span className="text-muted-foreground">Expected Outcomes:</span> {proposal.expected_outcomes || '-'}</div>
          {proposal.rejection_reason && <div className="col-span-2 text-red-600"><span className="text-muted-foreground">Rejection Reason:</span> {proposal.rejection_reason}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activities</CardTitle>
          {can('proposals', 'update') && proposal.status !== 'published' && proposal.status !== 'closed' && (
            <Button size="sm" onClick={() => { setActivityForm({ title: '', description: '', responsible_person_id: '', start_date: '', end_date: '', budget_amount: 0, status: 'planned', progress_percentage: 0 }); setActivityDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add Activity</Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Responsible</TableHead><TableHead>Period</TableHead><TableHead>Budget</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead></TableRow></TableHeader>
            <TableBody>
              {(proposal.activities || []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6">No activities</TableCell></TableRow>
              ) : (proposal.activities || []).map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.title}</TableCell>
                  <TableCell>{a.responsible_person?.name || '-'}</TableCell>
                  <TableCell className="text-xs">{a.start_date} to {a.end_date}</TableCell>
                  <TableCell>{a.budget_amount}</TableCell>
                  <TableCell><Badge>{a.status}</Badge></TableCell>
                  <TableCell>
                    <Input type="number" className="w-20 h-8" defaultValue={a.progress_percentage} onBlur={(e) => updateActivityProgress(a, Number(e.target.value))} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>KPIs</CardTitle>
          {can('proposals', 'update') && (
            <Button size="sm" onClick={() => { setKpiForm({ name: '', target_value: '', actual_value: '', unit: '', measurement_frequency: '', status: '', remarks: '' }); setKpiDialog(true); }}><Plus className="w-4 h-4 mr-2" />Add KPI</Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Target</TableHead><TableHead>Actual</TableHead><TableHead>Unit</TableHead><TableHead>Frequency</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {(proposal.kpis || []).length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6">No KPIs</TableCell></TableRow>
              ) : (proposal.kpis || []).map((k: any) => (
                <TableRow key={k.id}>
                  <TableCell>{k.name}</TableCell>
                  <TableCell>{k.target_value}</TableCell>
                  <TableCell>
                    <Input className="w-24 h-8" defaultValue={k.actual_value || ''} onBlur={(e) => updateKpiActual(k, e.target.value)} />
                  </TableCell>
                  <TableCell>{k.unit}</TableCell>
                  <TableCell>{k.measurement_frequency}</TableCell>
                  <TableCell>{k.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Attachments</CardTitle>
          {can('proposals', 'update') && (
            <Button size="sm" onClick={() => { setAttachmentForm({ title: '' }); setAttachmentFile(null); setAttachmentDialog(true); }}><Upload className="w-4 h-4 mr-2" />Upload</Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>File</TableHead><TableHead>Size</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {(proposal.attachments || []).length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6">No attachments</TableCell></TableRow>
              ) : (proposal.attachments || []).map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell>{a.title}</TableCell>
                  <TableCell className="text-xs">{a.original_file_name}</TableCell>
                  <TableCell className="text-xs">{a.file_size}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => downloadAttachment(a)}><Download className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Approval History</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>Submitted by: {proposal.submitted_by || '-'} at {proposal.submitted_at || '-'}</div>
          <div>Reviewed by: {proposal.reviewed_by || '-'} at {proposal.reviewed_at || '-'}</div>
          <div>Approved by: {proposal.approved_by || '-'} at {proposal.approved_at || '-'}</div>
          <div>Published at: {proposal.published_at || '-'}</div>
        </CardContent>
      </Card>

      {/* Activity Dialog */}
      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Activity</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={activityForm.title} onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Responsible User ID</Label><Input value={activityForm.responsible_person_id} onChange={(e) => setActivityForm({ ...activityForm, responsible_person_id: e.target.value })} /></div>
            <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={activityForm.start_date} onChange={(e) => setActivityForm({ ...activityForm, start_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>End Date</Label><Input type="date" value={activityForm.end_date} onChange={(e) => setActivityForm({ ...activityForm, end_date: e.target.value })} /></div>
            <div className="space-y-1"><Label>Budget Amount</Label><Input type="number" value={activityForm.budget_amount} onChange={(e) => setActivityForm({ ...activityForm, budget_amount: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={activityForm.status} onValueChange={(v) => setActivityForm({ ...activityForm, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Progress %</Label><Input type="number" value={activityForm.progress_percentage} onChange={(e) => setActivityForm({ ...activityForm, progress_percentage: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialog(false)}>Cancel</Button>
            <Button onClick={addActivity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KPI Dialog */}
      <Dialog open={kpiDialog} onOpenChange={setKpiDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add KPI</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Name</Label><Input value={kpiForm.name} onChange={(e) => setKpiForm({ ...kpiForm, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Target Value</Label><Input value={kpiForm.target_value} onChange={(e) => setKpiForm({ ...kpiForm, target_value: e.target.value })} /></div>
            <div className="space-y-1"><Label>Actual Value</Label><Input value={kpiForm.actual_value} onChange={(e) => setKpiForm({ ...kpiForm, actual_value: e.target.value })} /></div>
            <div className="space-y-1"><Label>Unit</Label><Input value={kpiForm.unit} onChange={(e) => setKpiForm({ ...kpiForm, unit: e.target.value })} /></div>
            <div className="space-y-1"><Label>Frequency</Label><Input value={kpiForm.measurement_frequency} onChange={(e) => setKpiForm({ ...kpiForm, measurement_frequency: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label><Input value={kpiForm.status} onChange={(e) => setKpiForm({ ...kpiForm, status: e.target.value })} /></div>
            <div className="space-y-1"><Label>Remarks</Label><Textarea value={kpiForm.remarks} onChange={(e) => setKpiForm({ ...kpiForm, remarks: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKpiDialog(false)}>Cancel</Button>
            <Button onClick={addKpi}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attachment Dialog */}
      <Dialog open={attachmentDialog} onOpenChange={setAttachmentDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Attachment</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1"><Label>Title</Label><Input value={attachmentForm.title} onChange={(e) => setAttachmentForm({ ...attachmentForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>File</Label><Input type="file" onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAttachmentDialog(false)}>Cancel</Button>
            <Button onClick={uploadAttachment}>Upload</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}