'use client';

import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { GraduationCap, BookOpen, Download, Trophy, Loader2, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function StudentResultsPage() {
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const response = await apiClient.getStudentResults();
        const { results, summary } = response as any;
        const grouped = groupResults(results);
        setResultsData(grouped);
        setSummary(summary);
      } catch (error) {
        console.error('Failed to load results:', error);
      } finally {
        setLoading(false);
      }
    }
    loadResults();
  }, []);

  const groupResults = (flatResults: any[]) => {
    const years: any = {};
    
    flatResults.forEach(res => {
      const year = res.course_offering.academic_year;
      const sem = res.course_offering.semester === 'first' ? 'Semester One' : 'Semester Two';
      const semKey = res.course_offering.semester;
      
      if (!years[year]) {
        years[year] = { 
          year, 
          academicYear: `${year} Academic Year`,
          semesters: {} 
        };
      }
      
      if (!years[year].semesters[semKey]) {
        years[year].semesters[semKey] = {
          name: sem,
          academicYear: `${year} Academic Year`,
          courses: []
        };
      }
      
      years[year].semesters[semKey].courses.push({
        code: res.course_offering.course.code,
        name: res.course_offering.course.name,
        type: res.course_offering.course.type || 'Core',
        credit: parseFloat(res.course_offering.course.credits || 0),
        grade: res.grade,
        remarks: res.total_score >= 35 ? 'Pass' : 'Failed'
      });
    });

    return Object.values(years).sort((a: any, b: any) => b.year.localeCompare(a.year)).map((y: any) => ({
      ...y,
      semesters: Object.values(y.semesters)
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Fetching your academic records from UDOM server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header section matching original design */}
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-6">
          <span>Home</span>
          <span className="text-gray-400">&gt;</span>
          <span className="text-gray-500">My Courses Assessments</span>
        </div>

        <div className="flex flex-col items-center mb-8">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-3 tracking-widest">Remarks Color Definition</p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-6 py-2 bg-green-100/50 border border-green-200 rounded text-sm font-medium text-green-700">
              <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
              Pass
            </div>
            <div className="flex items-center gap-2 px-6 py-2 bg-red-100/50 border border-red-200 rounded text-sm font-medium text-red-700">
              <div className="w-3 h-3 bg-red-200 rounded-sm"></div>
              Failed
            </div>
            <div className="flex items-center gap-2 px-6 py-2 bg-sky-100/50 border border-sky-200 rounded text-sm font-medium text-sky-700">
              <div className="w-3 h-3 bg-sky-200 rounded-sm"></div>
              Incomplete
            </div>
          </div>
        </div>

        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-center gap-3 mb-8 text-sky-700">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">Click on an Listed Academic Year and Semester to view your course results.</p>
        </div>

        {/* Global GPA Summary card like original */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <Card className="border-l-4 border-l-blue-600 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall GPA</p>
                  <p className="text-2xl font-black text-slate-900">{parseFloat(summary?.gpa || 0).toFixed(2)}</p>
                </div>
                <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-600 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credits Earned</p>
                  <p className="text-2xl font-black text-slate-900">{parseFloat(summary?.total_credits || 0).toFixed(1)}</p>
                </div>
                <div className="h-10 w-10 bg-green-50 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Button className="h-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm">
              <Download className="w-5 h-5 mr-3" />
              Download Academic Transcript
            </Button>
        </div>

        {/* Years Accordion */}
        <Accordion type="multiple" defaultValue={resultsData.length > 0 ? [resultsData[0].year] : []} className="space-y-4">
          {resultsData.map((yearData) => (
            <AccordionItem 
              key={yearData.year} 
              value={yearData.year} 
              className="bg-white border rounded-lg overflow-hidden shadow-sm"
            >
              <AccordionTrigger className="px-6 py-5 hover:no-underline">
                <div className="flex flex-col items-start gap-1">
                  <h3 className="text-lg font-bold text-slate-800">{yearData.year} OF STUDY</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">{yearData.academicYear}</p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0 border-t">
                {/* Semesters Collapsible/Accordion */}
                <div className="divide-y">
                  {yearData.semesters.map((semester: any, sIdx: number) => (
                    <div key={semester.name} className="bg-slate-50/30">
                       <details className="group" open={sIdx === 0}>
                          <summary className="px-8 py-4 cursor-pointer list-none flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-700">{semester.name}</span>
                              <span className="text-[10px] text-slate-400">{semester.academicYear}</span>
                            </div>
                            <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="px-8 pb-8 pt-2">
                             <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                                <Table>
                                  <TableHeader className="bg-slate-50">
                                    <TableRow className="hover:bg-transparent">
                                      <TableHead className="w-12 text-center text-[11px] font-bold uppercase text-slate-500">#</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Code</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Name</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500">Course Type</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Credit</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Grade</TableHead>
                                      <TableHead className="text-[11px] font-bold uppercase text-slate-500 text-center">Remarks</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {semester.courses.map((course: any, idx: number) => (
                                      <TableRow key={course.code} className="hover:bg-slate-50/50">
                                        <TableCell className="text-center text-slate-400 text-xs font-medium">{idx + 1}</TableCell>
                                        <TableCell className="font-bold text-slate-700 text-xs">{course.code}</TableCell>
                                        <TableCell className="text-slate-600 text-xs uppercase">{course.name}</TableCell>
                                        <TableCell className="text-slate-500 text-xs">{course.type}</TableCell>
                                        <TableCell className="text-center font-semibold text-slate-600 text-xs">{course.credit.toFixed(1)}</TableCell>
                                        <TableCell className="text-center font-black text-slate-800 text-xs">{course.grade}</TableCell>
                                        <TableCell className="text-center p-1">
                                           <div className={`py-1.5 rounded text-[10px] font-bold uppercase ${
                                             course.remarks === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                           }`}>
                                             {course.remarks}
                                           </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                             </div>
                          </div>
                       </details>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
          
          {resultsData.length === 0 && (
            <div className="text-center py-20 bg-white border-2 border-dashed rounded-lg">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-slate-800 font-bold text-lg">No Results Available</h3>
              <p className="text-slate-500 text-sm">You don't have any published exam results yet.</p>
            </div>
          )}
        </Accordion>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-slate-400 text-[11px] font-medium">
           Copyright © 2026 <span className="text-blue-600 font-bold">The College Management System</span> All rights reserved [Version 2.0]
        </div>
      </div>
    </div>
  );
}
