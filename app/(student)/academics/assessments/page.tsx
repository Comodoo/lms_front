'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

type CourseAssessment = {
  id: number;
  code: string;
  name: string;
  type: string;
  credit: number;
  ca: number;
  remarks: string;
};

type AssessmentSemester = {
  id: number;
  year: string;
  academicYear: string;
  isOpen: boolean;
  courses: CourseAssessment[];
};

const getRemarksColor = (remarks: string) => {
  switch (remarks) {
    case 'Pass':
      return 'bg-green-100 text-green-800';
    case 'Failed':
      return 'bg-red-100 text-red-800';
    case 'Incomplete':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function AssessmentsPage() {
  const [openSections, setOpenSections] = useState<number[]>([]);
  const [academicYears, setAcademicYears] = useState<AssessmentSemester[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      try {
        const response = await apiClient.getStudentResults();
        const { results } = response as any;
        if (!results) return;

        const semestersMap: { [key: string]: AssessmentSemester } = {};

        results.forEach((res: any) => {
          const academicYear = res.course_offering.academic_year;
          const semValue = res.course_offering.semester;
          const semName = semValue === 'first' ? 'Semester One' : (semValue === 'second' ? 'Semester Two' : 'Semester ' + semValue);
          const key = `${academicYear}-${semName}`;

          if (!semestersMap[key]) {
            semestersMap[key] = {
              id: Object.keys(semestersMap).length + 1,
              year: `Year - ${semName}`,
              academicYear: academicYear,
              isOpen: false,
              courses: []
            };
          }

          const credit = parseFloat(res.course_offering.course.credit_hours || res.course_offering.course.credits || 0);
          const ca = parseFloat(res.cat1_score || 0) + parseFloat(res.cat2_score || 0) + parseFloat(res.assignment_score || 0);

          semestersMap[key].courses.push({
            id: res.id,
            code: res.course_offering.course.code,
            name: res.course_offering.course.name,
            type: res.course_offering.course.type || 'Core',
            credit: credit,
            ca: ca,
            remarks: ca >= 16 ? 'Pass' : 'Incomplete' // CA pass mark is typically 16 out of 40 (40%)
          });
        });

        const sortedSemesters = Object.values(semestersMap).sort((a, b) => {
          if (b.academicYear === a.academicYear) {
             return b.year.localeCompare(a.year);
          }
          return b.academicYear.localeCompare(a.academicYear);
        });

        setAcademicYears(sortedSemesters);
        
        if (sortedSemesters.length > 0) {
          setOpenSections([sortedSemesters[0].id]);
        }
      } catch (error) {
        console.error('Failed to load assessments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAssessments();
  }, []);

  const toggleSection = (id: number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-slate-500 font-medium animate-pulse">Loading assessments...</p>
      </div>
    );
  }

  if (academicYears.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">No Assessments Available</h3>
        <p className="text-gray-500 mt-2">You don't have any published continuous assessments yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Remarks Color Definition */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <span className="text-xs text-muted-foreground uppercase font-medium">Remarks Color Definition</span>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">Pass</span>
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">Failed</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">Incomplete</span>
        </div>
      </div>

      {academicYears.map((year) => {
        const isOpen = openSections.includes(year.id);

        return (
          <div key={year.id} className="border rounded-lg bg-white overflow-hidden">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(year.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-900">{year.year}</h3>
                <p className="text-sm text-gray-500">{year.academicYear}</p>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Section Content */}
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Code</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Name</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">CA</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {year.courses.map((course, idx) => (
                      <tr key={course.id} className={cn('border-b', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                        <td className="py-3 px-4 text-sm text-gray-900">{idx + 1}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 uppercase font-medium">{course.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 capitalize">{course.name}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {course.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.credit}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 font-bold">{course.ca.toFixed(1)}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs font-medium', getRemarksColor(course.remarks))}>
                            {course.remarks}
                          </span>
                           <span className="ml-2 text-[10px] text-gray-400">/ 40</span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors">
                            Preview
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
