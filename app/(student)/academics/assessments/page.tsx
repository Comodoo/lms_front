'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const academicYears = [
  {
    id: 1,
    year: '1st Year - Semester One',
    academicYear: '2021/2022 Academic Year',
    isOpen: false,
    courses: [
      { id: 1, code: 'CP 111', name: 'Principles Of Programming Languages', type: 'Core', credit: 9.0, ca: 31.5, remarks: 'Incomplete' },
      { id: 2, code: 'DS 102', name: 'Development Perspectives', type: 'Core', credit: 7.5, ca: 26.0, remarks: 'Incomplete' },
      { id: 3, code: 'IA 112', name: 'Mathematical Foundations Of Information Security', type: 'Core', credit: 7.5, ca: 16.0, remarks: 'Incomplete' },
      { id: 4, code: 'IT 111', name: 'Introduction To Information Technology', type: 'Core', credit: 7.5, ca: 29.0, remarks: 'Incomplete' },
      { id: 5, code: 'LG 102', name: 'Communication Skills', type: 'Core', credit: 7.5, ca: 18.0, remarks: 'Incomplete' },
      { id: 6, code: 'MT 1111', name: 'Discrete Mathematics For Ict', type: 'Core', credit: 7.5, ca: 21.0, remarks: 'Incomplete' },
      { id: 7, code: 'MT 1112', name: 'Calculus', type: 'Core', credit: 7.5, ca: 35.5, remarks: 'Incomplete' },
      { id: 8, code: 'MT 1117', name: 'Linear Algebra For Ict', type: 'Core', credit: 7.5, ca: 18.4, remarks: 'Incomplete' },
    ],
  },
  {
    id: 2,
    year: '1st Year - Semester Two',
    academicYear: '2021/2022 Academic Year',
    isOpen: false,
    courses: [
      { id: 9, code: 'CP 112', name: 'Data Structures And Algorithms', type: 'Core', credit: 9.0, ca: 28.5, remarks: 'Incomplete' },
      { id: 10, code: 'IA 122', name: 'Introduction To Information Security', type: 'Core', credit: 7.5, ca: 22.0, remarks: 'Incomplete' },
      { id: 11, code: 'IT 121', name: 'Computer Organization And Architecture', type: 'Core', credit: 7.5, ca: 25.0, remarks: 'Incomplete' },
    ],
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

export default function AssessmentsPage() {
  const [openSections, setOpenSections] = useState<number[]>([1]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
                        <td className="py-3 px-4 text-sm text-gray-900">{course.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.name}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {course.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.credit}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.ca.toFixed(1)}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs font-medium', getRemarksColor(course.remarks))}>
                            {course.remarks}
                          </span>
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
