'use client';

import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type CourseResult = {
  id: number;
  code: string;
  name: string;
  type: 'Core' | 'Elective';
  credit: number;
  grade: string;
  remarks: 'Pass' | 'Failed' | 'Incomplete';
};

type SemesterData = {
  name: string;
  academicYear: string;
  courses: CourseResult[];
};

type YearData = {
  id: number;
  year: string;
  academicYear: string;
  semesters: SemesterData[];
  summary: {
    totalCredits: number | null;
    totalGradePoints: number | null;
    gpa: number | null;
    remarks: string | null;
  };
};

// Sample data matching the screenshot
const academicYears: YearData[] = [
  {
    id: 1,
    year: '1st Year of Study',
    academicYear: '2021/2022 Academic Year',
    semesters: [
      { name: 'Semester One', academicYear: '2021/2022 Academic Year', courses: [] },
      { name: 'Semester Two', academicYear: '2021/2022 Academic Year', courses: [] },
    ],
    summary: { totalCredits: null, totalGradePoints: null, gpa: null, remarks: null },
  },
  {
    id: 2,
    year: '2nd Year of Study',
    academicYear: '2022/2023 Academic Year',
    semesters: [
      { name: 'Semester One', academicYear: '2022/2023 Academic Year', courses: [] },
      { name: 'Semester Two', academicYear: '2022/2023 Academic Year', courses: [] },
    ],
    summary: { totalCredits: null, totalGradePoints: null, gpa: null, remarks: null },
  },
  {
    id: 3,
    year: '3rd Year of Study',
    academicYear: '2023/2024 Academic Year',
    semesters: [
      { name: 'Semester One', academicYear: '2023/2024 Academic Year', courses: [] },
      { name: 'Semester Two', academicYear: '2023/2024 Academic Year', courses: [] },
    ],
    summary: { totalCredits: null, totalGradePoints: null, gpa: null, remarks: null },
  },
  {
    id: 4,
    year: '4th Year of Study',
    academicYear: '2024/2025 Academic Year',
    semesters: [
      {
        name: 'Semester One',
        academicYear: '2024/2025 Academic Year',
        courses: [
          { id: 1, code: 'CP 412', name: 'C# Programming', type: 'Core', credit: 9.0, grade: 'B+', remarks: 'Pass' },
          { id: 2, code: 'CT 312', name: 'Computer Maintenance', type: 'Core', credit: 9.0, grade: 'B+', remarks: 'Pass' },
          { id: 3, code: 'IM 411', name: 'Human Computer Interaction', type: 'Core', credit: 7.5, grade: 'C', remarks: 'Pass' },
          { id: 4, code: 'BT 413', name: 'Ict Project Management', type: 'Core', credit: 6.0, grade: 'B', remarks: 'Pass' },
          { id: 5, code: 'CS 332', name: 'Industrial Practical Training III', type: 'Core', credit: 9.6, grade: 'A', remarks: 'Pass' },
          { id: 6, code: 'SI 311', name: 'Professional Ethics And Conduct', type: 'Core', credit: 7.5, grade: 'C', remarks: 'Pass' },
          { id: 7, code: 'CS 431', name: 'Software Engineering Project I', type: 'Core', credit: 7.0, grade: 'A', remarks: 'Pass' },
          { id: 8, code: 'CS 411', name: 'Software Reverse Engineering', type: 'Core', credit: 9.0, grade: 'A', remarks: 'Pass' },
          { id: 9, code: 'CP 314', name: 'Distributed Computing', type: 'Elective', credit: 7.5, grade: 'C', remarks: 'Pass' },
        ],
      },
      { name: 'Semester Two', academicYear: '2024/2025 Academic Year', courses: [] },
    ],
    summary: { totalCredits: null, totalGradePoints: null, gpa: null, remarks: null },
  },
];

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

export default function ResultsPage() {
  const [openSections, setOpenSections] = useState<number[]>([4]); // 4th year open by default
  const [openSemesters, setOpenSemesters] = useState<string[]>(['4-Semester One']);

  const toggleSection = (id: number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSemester = (key: string) => {
    setOpenSemesters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-4">
      {/* Remarks Color Definition */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <span className="text-xs text-muted-foreground uppercase font-medium">Remarks Color Definition</span>
        <div className="flex gap-2">
          <span className="px-4 py-1.5 bg-green-100 text-green-800 text-xs font-medium rounded">Pass</span>
          <span className="px-4 py-1.5 bg-red-100 text-red-800 text-xs font-medium rounded">Failed</span>
          <span className="px-4 py-1.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">Incomplete</span>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded mb-6">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Click on a Listed Academic Year and Semester to view your course results.</span>
        </p>
      </div>

      {academicYears.map((year) => {
        const isOpen = openSections.includes(year.id);

        return (
          <div key={year.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
            {/* Year Header */}
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

            {/* Year Content */}
            {isOpen && (
              <div className="p-4 space-y-4">
                {/* Year Result Summary */}
                <div className="text-center">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Year Result Summary</h4>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Total Credits:</span>
                      <span className="px-3 py-1 border rounded text-sm font-medium text-gray-700 bg-white min-w-[60px]">
                        {year.summary.totalCredits ?? '--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Total Grade Points:</span>
                      <span className="px-3 py-1 border rounded text-sm font-medium text-gray-700 bg-white min-w-[60px]">
                        {year.summary.totalGradePoints ?? '--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">GPA:</span>
                      <span className="px-3 py-1 border rounded text-sm font-medium text-gray-700 bg-white min-w-[60px]">
                        {year.summary.gpa ?? '--'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Remarks:</span>
                      <span className="px-3 py-1 border rounded text-sm font-medium text-gray-700 bg-white min-w-[60px]">
                        {year.summary.remarks ?? '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Semesters */}
                <div className="space-y-3 mt-4">
                  {year.semesters.map((semester) => {
                    const semesterKey = `${year.id}-${semester.name}`;
                    const isSemesterOpen = openSemesters.includes(semesterKey);
                    const hasCourses = semester.courses.length > 0;

                    return (
                      <div key={semesterKey} className="border rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => toggleSemester(semesterKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div>
                            <h5 className="font-medium text-gray-900">{semester.name}</h5>
                            <p className="text-xs text-gray-500">{semester.academicYear}</p>
                          </div>
                          {isSemesterOpen ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </button>

                        {isSemesterOpen && hasCourses && (
                          <div className="overflow-x-auto bg-white">
                            <table className="w-full">
                              <thead className="bg-gray-100 border-b">
                                <tr>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Code</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Name</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Type</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Credit</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Grade</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                </tr>
                              </thead>
                              <tbody>
                                {semester.courses.map((course, idx) => (
                                  <tr key={course.id} className={cn('border-b', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                                    <td className="py-3 px-4 text-sm text-gray-900">{course.id}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{course.code}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{course.name}</td>
                                    <td className="py-3 px-4 text-sm">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {course.type}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{course.credit}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">{course.grade}</td>
                                    <td className="py-3 px-4 text-sm">
                                      <span className={cn('inline-flex items-center px-3 py-1 rounded text-xs font-medium', getRemarksColor(course.remarks))}>
                                        {course.remarks}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {isSemesterOpen && !hasCourses && (
                          <div className="p-4 bg-white">
                            <div className="text-center text-sm text-gray-500 py-4">
                              No results available for this semester.
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
