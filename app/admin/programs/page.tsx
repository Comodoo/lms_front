'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { Program } from '@/lib/college-types';
import {
    Edit,
    Loader2,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

// Ensure SweetAlert2 is always on top of Radix Dialogs
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .swal2-container {
      z-index: 99999 !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);
}

export default function AdminProgramsPage() {
    const { isAuthenticated } = useAuth();
    
    // Data state
    const [programs, setPrograms] = useState<Program[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search state
    const [programSearchTerm, setProgramSearchTerm] = useState('');

    // Pagination state
    const [programPage, setProgramPage] = useState(1);
    const itemsPerPage = 10;

    // Program Form State
    const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [programForm, setProgramForm] = useState({
        code: '',
        name: '',
        department_id: '',
        duration: 3,
        description: '',
        tuition_fee: 0,
        currency: 'TZS',
        is_active: true,
    });

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [programsRes, deptsRes] = await Promise.all([
                apiClient.getPrograms(),
                apiClient.getDepartments(),
            ]);
            setPrograms(programsRes || []);
            setDepartments(deptsRes || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        }
        setLoading(false);
    };

    // ================= PROGRAMS LOGIC =================
    const handleSaveProgram = async () => {
        try {
            if (selectedProgram) {
                await apiClient.updateProgram(selectedProgram.id, programForm);
                Swal.fire('Updated!', 'Program has been updated.', 'success');
            } else {
                await apiClient.createProgram(programForm);
                Swal.fire('Created!', 'Program has been created.', 'success');
            }
            setIsProgramDialogOpen(false);
            fetchData();
        } catch (err: any) {
            Swal.fire('Error', err.message || 'Failed to save program', 'error');
        }
    };

    const handleDeleteProgram = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the program. You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await apiClient.deleteProgram(id);
                Swal.fire('Deleted!', 'Program has been deleted.', 'success');
                fetchData();
            } catch (err: any) {
                Swal.fire('Error', err.message || 'Failed to delete program', 'error');
            }
        }
    };

    const openProgramDialog = (program?: Program) => {
        if (program) {
            setSelectedProgram(program);
            setProgramForm({
                code: program.code,
                name: program.name,
                department_id: (program as any).department_id?.toString() || '',
                duration: (program as any).duration || 3,
                description: program.description || '',
                tuition_fee: program.tuitionFee || (program as any).tuition_fee || 0,
                currency: program.currency || 'TZS',
                is_active: program.isActive ?? (program as any).is_active ?? true,
            });
        } else {
            setSelectedProgram(null);
            setProgramForm({
                code: '',
                name: '',
                department_id: '',
                duration: 3,
                description: '',
                tuition_fee: 0,
                currency: 'TZS',
                is_active: true,
            });
        }
        setIsProgramDialogOpen(true);
    };

    const filteredPrograms = programs.filter(
        (p) =>
            p.name.toLowerCase().includes(programSearchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(programSearchTerm.toLowerCase())
    );

    const totalProgramPages = Math.ceil(filteredPrograms.length / itemsPerPage);
    const paginatedPrograms = filteredPrograms.slice(
        (programPage - 1) * itemsPerPage,
        programPage * itemsPerPage
    );

    // Reset to first page when search changes
    useEffect(() => {
        setProgramPage(1);
    }, [programSearchTerm]);

    if (!isAuthenticated) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={fetchData} variant="outline">Retry</Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Programs Management</h1>
                    <p className="text-muted-foreground">Manage academic programs</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search programs..."
                        value={programSearchTerm}
                        onChange={(e) => setProgramSearchTerm(e.target.value)}
                        className="pl-10 h-9"
                    />
                </div>
                <Button onClick={() => openProgramDialog()} className="gap-2 h-9">
                    <Plus className="h-4 w-4" /> Create Program
                </Button>
            </div>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm font-semibold">All Programs ({filteredPrograms.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Code</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Program Name</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Department</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Duration</th>
                                    <th className="text-left py-2 px-4 font-medium text-muted-foreground text-[10px] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {paginatedPrograms.length === 0 ? (
                                    <tr className="border-b"><td colSpan={5} className="py-8 text-center text-muted-foreground">No programs found</td></tr>
                                ) : (
                                    paginatedPrograms.map((program) => (
                                    <tr key={program.id} className="border-b last:border-0 hover:bg-muted/30">
                                        <td className="py-2 px-4 font-medium">{program.code}</td>
                                        <td className="py-2 px-4">
                                            <p className="font-medium">{program.name}</p>
                                        </td>
                                        <td className="py-2 px-4 text-xs">{typeof (program as any).department === 'object' ? (program as any).department?.name : (program as any).department}</td>
                                        <td className="py-2 px-4">{((program as any).duration || 3)} yrs</td>
                                        <td className="py-2 px-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openProgramDialog(program)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteProgram(program.id)} className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="py-4 border-t flex items-center justify-between px-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {paginatedPrograms.length > 0 ? (programPage - 1) * itemsPerPage + 1 : 0} to {Math.min(programPage * itemsPerPage, filteredPrograms.length)} of {filteredPrograms.length} entries
                        </div>
                        <Pagination className="justify-end mx-0 w-auto">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => setProgramPage(p => Math.max(1, p - 1))}
                                        className={programPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                                {Array.from({ length: Math.max(1, totalProgramPages) }).map((_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink 
                                            onClick={() => setProgramPage(i + 1)}
                                            isActive={programPage === i + 1}
                                            className="cursor-pointer"
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => setProgramPage(p => Math.min(Math.max(1, totalProgramPages), p + 1))}
                                        className={programPage >= Math.max(1, totalProgramPages) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </CardContent>
            </Card>

            {/* ================= PROGRAM DIALOG ================= */}
            <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedProgram ? 'Edit Program' : 'Create Program'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Code</Label>
                            <Input value={programForm.code} onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })} placeholder="e.g. CS101" />
                        </div>
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} placeholder="e.g. BSc Computer Science" />
                        </div>
                        <div className="space-y-2">
                            <Label>Department</Label>
                            <Select value={programForm.department_id} onValueChange={(v) => setProgramForm({ ...programForm, department_id: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Dept" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map((d: any) => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Duration (Years)</Label>
                            <Input type="number" value={programForm.duration} onChange={(e) => setProgramForm({ ...programForm, duration: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Description</Label>
                            <Textarea value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveProgram}>Save Program</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
