'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useResults } from '@/lib/results-context';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, XCircle, Download, FileText, ChevronDown, ChevronRight, Edit, Save, X } from 'lucide-react';

export default function AdminStudentResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { studentProfiles, loading, getStudentProfiles, getSemesterResults, getExamResults, getExamResultById, updateExamResult } = useResults();
  
  const [student, setStudent] = useState<any>(null);
  const [semesterResults, setSemesterResults] = useState<any[]>([]);
  const [examResults, setExamResults] = useState<any[]>([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [expandedSemesters, setExpandedSemesters] = useState<Record<string, boolean>>({});
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editScores, setEditScores] = useState({ cat1Score: 0, cat2Score: 0, assignmentScore: 0, finalExamScore: 0 });

  const handleEditCourse = (course: any) => {
    setEditingCourseId(course.id);
    setEditScores({
      cat1Score: course.cat1Score || 0,
      cat2Score: course.cat2Score || 0,
      assignmentScore: course.assignmentScore || 0,
      finalExamScore: course.finalExamScore || 0,
    });
  };

  const handleSaveCourse = async (courseId: string) => {
    await updateExamResult(courseId, editScores);
    setEditingCourseId(null);
    loadStudentData();
  };

  const getDegreeClassification = (cgpa: number) => {
    if (cgpa >= 4.4) return 'First Class Honours';
    if (cgpa >= 3.5) return 'Upper Second Class Honours';
    if (cgpa >= 2.7) return 'Lower Second Class Honours';
    if (cgpa >= 2.0) return 'Pass';
    return 'Fail';
  };

  const handleDownloadTranscript = async () => {
    if (!student) return;

    // Helper to load image
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    };

    try {
      const [jsPDFModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      const jsPDF = jsPDFModule.default;
      const autoTable = autoTableModule.default;
      
      const doc = new jsPDF();
      
      // Load placeholder logo if available
      let logoImg: HTMLImageElement | null = null;
      try {
        // Try to load the custom logo first
        logoImg = await loadImage('/logo.png');
      } catch (e) {
        try {
          logoImg = await loadImage('/placeholder-logo.png');
        } catch (e2) {
          console.warn('Logo not found');
        }
      }

      // 1. Official Header
      // Top banner
      doc.setFillColor(15, 118, 110); // Teal banner to match the ZMC logo
      doc.rect(0, 0, 210, 42, 'F');
      
      // Logo (left)
      if (logoImg) {
        doc.addImage(logoImg, 'PNG', 14, 5, 26, 26); // Adjusted size and position
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(14, 6, 26, 26, 'F');
        doc.setTextColor(41, 128, 185);
        doc.setFontSize(8);
        doc.text('LOGO', 27, 20, { align: 'center' });
      }

      // College details (center)
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('ZANZIBAR METROPOLITAN COLLEGE', 105, 18, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Off Fumba Road, Mawasiliano', 105, 25, { align: 'center' });
      doc.text('Kisauni, Zanzibar', 105, 30, { align: 'center' });
      
      // Passport space (right)
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 200, 200);
      doc.rect(170, 6, 26, 30, 'FD'); // Width 26, Height 30
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.text('Passport', 183, 21, { align: 'center' });
      doc.text('Photo', 183, 25, { align: 'center' });
      
      // Document Title
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ACADEMIC TRANSCRIPT', 105, 52, { align: 'center' });
      
      // Separator line
      doc.setDrawColor(15, 118, 110); // Matching teal
      doc.setLineWidth(0.5);
      doc.line(14, 55, 196, 55);

      // 2. Student & Programme Details
      const name = student.studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
      const rawGender = student.gender || '';
      const displayGender = typeof rawGender === 'string' && rawGender.length > 0 
        ? rawGender.charAt(0).toUpperCase() + rawGender.slice(1) 
        : 'N/A';
        
      const startYDetails = 64;
      
      // Light grey box for student details
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 58, 182, 25, 2, 2, 'FD');
      
      // Left Column
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 18, startYDetails);
      doc.setFont('helvetica', 'normal');
      doc.text(name, 45, startYDetails);

      doc.setFont('helvetica', 'bold');
      doc.text('Sex:', 18, startYDetails + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(displayGender, 45, startYDetails + 7);

      doc.setFont('helvetica', 'bold');
      doc.text('Reg No:', 18, startYDetails + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(student.registrationNumber || 'N/A', 45, startYDetails + 14);
      
      // Right Column
      doc.setFont('helvetica', 'bold');
      doc.text('Programme:', 105, startYDetails);
      doc.setFont('helvetica', 'normal');
      doc.text(student.programName || 'N/A', 135, startYDetails);

      doc.setFont('helvetica', 'bold');
      doc.text('Department:', 105, startYDetails + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(student.department || 'N/A', 135, startYDetails + 7);

      doc.setFont('helvetica', 'bold');
      doc.text('Admission Year:', 105, startYDetails + 14);
      doc.setFont('helvetica', 'normal');
      doc.text(student.createdAt ? new Date(student.createdAt).getFullYear().toString() : 'N/A', 135, startYDetails + 14);

      let currentY = startYDetails + 30; // 94

      // 3. Chronological Academic Performance
      const sortedSemesters = [...semesterResults].sort((a, b) => {
        if (a.academicYear === b.academicYear) {
          return a.semester.localeCompare(b.semester);
        }
        return a.academicYear.localeCompare(b.academicYear);
      });

      if (sortedSemesters.length === 0) {
        doc.setFont('helvetica', 'italic');
        doc.text('No results available for this student.', 14, currentY);
        currentY += 10;
      }

      sortedSemesters.forEach((sem: any) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`ACADEMIC YEAR: ${sem.academicYear} - SEMESTER: ${sem.semester.toUpperCase()}`, 14, currentY);
        currentY += 4;

        const semCourses = examResults.filter(
          (r: any) => String(r.academicYear).trim() === String(sem.academicYear).trim() && String(r.semester).trim().toLowerCase() === String(sem.semester).trim().toLowerCase()
        );

        autoTable(doc, {
          startY: currentY,
          head: [['Course Code', 'Course Title', 'Credits', 'Grade', 'Points']],
          body: semCourses.map((r: any) => [
            r.courseCode,
            r.courseName,
            r.credits.toString(),
            r.grade,
            r.gradePoints.toFixed(1)
          ]),
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold' }, // Matching teal
          theme: 'grid',
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;

        // Semester Footer
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Semester GPA: ${sem.semesterGPA.toFixed(2)}`, 14, currentY);
        doc.text(`Cumulative GPA: ${sem.newCGPA.toFixed(2)}`, 80, currentY);
        
        currentY += 12;
      });

      // 4. Final Classification & Signatures
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.line(14, currentY, 196, currentY);
      currentY += 6;
      
      doc.setFontSize(11);
      doc.text(`OVERALL CGPA: ${student.cgpa?.toFixed(2) || '0.00'}`, 14, currentY);
      
      const classification = getDegreeClassification(student.cgpa || 0);
      doc.text(`DEGREE CLASSIFICATION: ${classification.toUpperCase()}`, 80, currentY);

      currentY += 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('......................................................', 14, currentY);
      doc.text('......................................................', 130, currentY);
      currentY += 5;
      doc.text('Deputy Vice Chancellor (Academic)', 14, currentY);
      doc.text('Date', 150, currentY);

      doc.save(`${student.registrationNumber || 'Student'}_ZMC_Transcript.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    }
  };

  const toggleSemester = (id: string) => {
    setExpandedSemesters(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleCourse = (id: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (!loading && studentProfiles.length > 0) {
      loadStudentData();
    }
  }, [params.id, loading, studentProfiles]);

  useEffect(() => {
    if (selectedAcademicYear === 'all') {
      loadAllExamResults();
    } else {
      loadExamResultsByYear(selectedAcademicYear);
    }
  }, [selectedAcademicYear]);

  const loadStudentData = async () => {
    const foundStudent = studentProfiles.find(s => String(s.id) === String(params.id));
    if (foundStudent) {
      const results = await getExamResults({ studentProfileId: foundStudent.id });
      setExamResults(results);

      let totalCredits = 0;
      let totalPoints = 0;

      const semMap: Record<string, any> = {};

      results.forEach(r => {
        const credit = Number(r.credits) || 0;
        const gpaPoints = Number(r.gradePoints) || 0;
        totalCredits += credit;
        totalPoints += (gpaPoints * credit);

        const key = `${r.academicYear}-${r.semester}`;
        if (!semMap[key]) {
          semMap[key] = {
            id: key,
            academicYear: r.academicYear,
            semester: r.semester,
            totalCredits: 0,
            totalPoints: 0,
          };
        }
        semMap[key].totalCredits += credit;
        semMap[key].totalPoints += (gpaPoints * credit);
      });

      const cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;

      const semResultsList = Object.values(semMap).map((s: any) => ({
        ...s,
        semesterGPA: s.totalCredits > 0 ? (s.totalPoints / s.totalCredits) : 0,
        newCGPA: cgpa,
        status: 'published'
      }));

      // Find latest semester GPA
      const sortedKeys = Object.keys(semMap).sort();
      const latestGPA = sortedKeys.length > 0 ? 
        (semMap[sortedKeys[sortedKeys.length - 1]].totalCredits > 0 ? 
          semMap[sortedKeys[sortedKeys.length - 1]].totalPoints / semMap[sortedKeys[sortedKeys.length - 1]].totalCredits : 0) 
        : 0;

      setStudent({
        ...foundStudent,
        cgpa,
        gpa: latestGPA,
        totalCreditsEarned: totalCredits
      });
      setSemesterResults(semResultsList);
    }
  };

  const loadAllExamResults = async () => {
    if (student) {
      const results = await getExamResults({ studentProfileId: student.id });
      setExamResults(results);
    }
  };

  const loadExamResultsByYear = async (year: string) => {
    if (student) {
      const results = await getExamResults({ studentProfileId: student.id, academicYear: year });
      setExamResults(results);
    }
  };

  const getContinuationStatus = (cgpa: number, status: string, remark?: string) => {
    if (remark?.toUpperCase() === 'PASS') {
      return { label: 'Good Standing', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (remark?.toUpperCase() === 'FAIL') {
      return { label: 'Discontinued', color: 'bg-red-100 text-red-800', icon: XCircle };
    }

    if (status === 'graduated') {
      return { label: 'Graduated', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    }
    if (status === 'withdrawn' || status === 'suspended' || cgpa < 2.0) {
      return { label: 'Discontinued', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    return { label: 'Good Standing', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const getYearlyGPA = (studentId: string) => {
    const results = semesterResults.filter(r => r.studentProfileId === studentId);
    const yearlyGPA: Record<string, { gpa: number; semesters: string[] }> = {};
    
    results.forEach(r => {
      const year = r.academicYear.split('/')[0];
      if (!yearlyGPA[year]) {
        yearlyGPA[year] = { gpa: 0, semesters: [] };
      }
      yearlyGPA[year].gpa += r.semesterGPA;
      yearlyGPA[year].semesters.push(r.semester);
    });

    return Object.entries(yearlyGPA).map(([year, data]) => ({
      year,
      averageGPA: data.gpa / data.semesters.length,
      semesterCount: data.semesters.length,
    }));
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-green-100 text-green-800',
      'A-': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'B-': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'C-': 'bg-yellow-100 text-yellow-800',
      'D+': 'bg-orange-100 text-orange-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    return colors[grade] || 'bg-gray-100 text-gray-800';
  };

  if (!student) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Student Not Found</h2>
          <Button onClick={() => router.push('/admin/results')}>
            Back to Results
          </Button>
        </div>
      </div>
    );
  }

  const continuationStatus = getContinuationStatus(student.cgpa || 0, student.status, student.remark);
  const StatusIcon = continuationStatus.icon;
  const yearlyGPA = getYearlyGPA(student.id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/admin/users/students/${student.id}`)}>
            <FileText className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" onClick={handleDownloadTranscript}>
            <Download className="w-4 h-4 mr-2" />
            Download Transcript
          </Button>
        </div>
      </div>

      {/* Student Info Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">{student.registrationNumber}</h2>
              <p className="text-muted-foreground">{student.programName}</p>
              <div className="flex items-center gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{student.department}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intake</p>
                  <p className="font-medium">{student.intake}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Study Mode</p>
                  <p className="font-medium capitalize">{student.studyMode.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
            <Badge className={continuationStatus.color} className="text-sm px-4 py-2">
              <StatusIcon className="w-4 h-4 mr-2" />
              {continuationStatus.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${student.cgpa >= 2.0 ? 'text-green-600' : 'text-red-600'}`}>
              {student.cgpa?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current GPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {student.gpa?.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{student.totalCreditsEarned}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Year {student.currentYear}</div>
            <p className="text-sm text-muted-foreground capitalize">{student.currentSemester} Semester</p>
          </CardContent>
        </Card>
      </div>

      {/* Yearly GPA Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Yearly GPA Trend</CardTitle>
          <CardDescription>Academic performance by academic year</CardDescription>
        </CardHeader>
        <CardContent>
          {yearlyGPA.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No academic data available</p>
          ) : (
            <div className="space-y-3">
              {yearlyGPA.map((gpa, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{gpa.year}</span>
                      <span className="text-sm text-muted-foreground">{gpa.semesterCount} semester(s)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${gpa.averageGPA >= 3.0 ? 'bg-green-500' : gpa.averageGPA >= 2.0 ? 'bg-blue-500' : gpa.averageGPA >= 1.5 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${(gpa.averageGPA / 4.0) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-2xl font-bold">{gpa.averageGPA.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Semester Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Semester Results</CardTitle>
          <CardDescription>Detailed performance by semester</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Semester GPA</TableHead>
                <TableHead>CGPA</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesterResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No semester results available
                  </TableCell>
                </TableRow>
              ) : (
                semesterResults.map((result) => {
                  const isExpanded = expandedSemesters[result.id];
                  const semesterCourses = examResults.filter(
                    r => r.academicYear === result.academicYear && r.semester === result.semester
                  );

                  return (
                    <React.Fragment key={result.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleSemester(result.id)}>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{result.academicYear}</TableCell>
                        <TableCell className="capitalize">{result.semester}</TableCell>
                        <TableCell>{result.totalCredits}</TableCell>
                        <TableCell className="font-semibold">{result.semesterGPA.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">{result.newCGPA.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={result.status === 'published' ? 'default' : 'secondary'}>
                            {result.status === 'published' ? 'Published' : 'Unpublished'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={7} className="p-0 border-b">
                            <div className="p-4 pl-12">
                              <h4 className="text-sm font-semibold mb-3">Courses Details</h4>
                              {semesterCourses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No course results recorded for this semester.</p>
                              ) : (
                                <Table size="sm" className="bg-background border rounded-md overflow-hidden">
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="h-8">Course Code</TableHead>
                                      <TableHead className="h-8">Course Name</TableHead>
                                      <TableHead className="h-8">Credits</TableHead>
                                      <TableHead className="h-8">Score</TableHead>
                                      <TableHead className="h-8">Grade</TableHead>
                                      <TableHead className="h-8">Points</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {semesterCourses.map(course => (
                                      <TableRow key={course.id}>
                                        <TableCell className="py-2 text-sm font-medium">{course.courseCode}</TableCell>
                                        <TableCell className="py-2 text-sm">{course.courseName}</TableCell>
                                        <TableCell className="py-2 text-sm">{course.credits}</TableCell>
                                        <TableCell className="py-2 text-sm font-semibold">{course.totalScore}</TableCell>
                                        <TableCell className="py-2 text-sm">
                                          <Badge variant="outline" className={`font-semibold ${getGradeColor(course.grade)}`}>
                                            {course.grade}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="py-2 text-sm">{course.gradePoints.toFixed(1)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Course Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Results</CardTitle>
              <CardDescription>Detailed performance in each course</CardDescription>
            </div>
            <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No course results available
                  </TableCell>
                </TableRow>
              ) : (
                examResults.map((result) => {
                  const isExpanded = expandedCourses[result.id];

                  return (
                    <React.Fragment key={result.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleCourse(result.id)}>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                        <TableCell className="font-medium">{result.courseCode}</TableCell>
                        <TableCell>{result.courseName}</TableCell>
                        <TableCell>{result.academicYear}</TableCell>
                        <TableCell className="capitalize">{result.semester}</TableCell>
                        <TableCell>{result.credits}</TableCell>
                        <TableCell className="font-semibold">{result.totalScore}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>
                            {result.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.gradePoints.toFixed(1)}</TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={9} className="p-0 border-b">
                            <div className="p-4 pl-12">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold">Score Breakdown</h4>
                                {editingCourseId === result.id ? (
                                  <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => handleSaveCourse(result.id)} className="h-7 text-xs">
                                      <Save className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setEditingCourseId(null)} className="h-7 text-xs">
                                      <X className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => handleEditCourse(result)} className="h-7 text-xs">
                                    <Edit className="w-3 h-3 mr-1" /> Edit Scores
                                  </Button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl">
                                <div className="bg-background p-3 rounded-md border text-center">
                                  <p className="text-xs text-muted-foreground mb-1">CAT 1</p>
                                  {editingCourseId === result.id ? (
                                    <Input 
                                      type="number" 
                                      className="h-8 text-center" 
                                      value={editScores.cat1Score} 
                                      onChange={e => setEditScores({...editScores, cat1Score: Number(e.target.value)})} 
                                    />
                                  ) : (
                                    <p className="font-semibold text-lg">{result.cat1Score || 0}</p>
                                  )}
                                </div>
                                <div className="bg-background p-3 rounded-md border text-center">
                                  <p className="text-xs text-muted-foreground mb-1">CAT 2</p>
                                  {editingCourseId === result.id ? (
                                    <Input 
                                      type="number" 
                                      className="h-8 text-center" 
                                      value={editScores.cat2Score} 
                                      onChange={e => setEditScores({...editScores, cat2Score: Number(e.target.value)})} 
                                    />
                                  ) : (
                                    <p className="font-semibold text-lg">{result.cat2Score || 0}</p>
                                  )}
                                </div>
                                <div className="bg-background p-3 rounded-md border text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Assignment</p>
                                  {editingCourseId === result.id ? (
                                    <Input 
                                      type="number" 
                                      className="h-8 text-center" 
                                      value={editScores.assignmentScore} 
                                      onChange={e => setEditScores({...editScores, assignmentScore: Number(e.target.value)})} 
                                    />
                                  ) : (
                                    <p className="font-semibold text-lg">{result.assignmentScore || 0}</p>
                                  )}
                                </div>
                                <div className="bg-background p-3 rounded-md border text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Final Exam</p>
                                  {editingCourseId === result.id ? (
                                    <Input 
                                      type="number" 
                                      className="h-8 text-center font-semibold text-blue-600" 
                                      value={editScores.finalExamScore} 
                                      onChange={e => setEditScores({...editScores, finalExamScore: Number(e.target.value)})} 
                                    />
                                  ) : (
                                    <p className="font-semibold text-lg text-blue-600">{result.finalExamScore || 0}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
