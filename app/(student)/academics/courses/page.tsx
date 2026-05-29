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
      { id: 1, code: 'CP 111', name: 'Principles Of Programming Languages', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 2, code: 'DS 102', name: 'Development Perspectives', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 3, code: 'IA 112', name: 'Mathematical Foundations Of Information Security', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 4, code: 'IT 111', name: 'Introduction To Information Technology', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 5, code: 'LG 102', name: 'Communication Skills', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 6, code: 'MT 1111', name: 'Discrete Mathematics For Ict', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 7, code: 'MT 1112', name: 'Calculus', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 8, code: 'MT 1117', name: 'Linear Algebra For Ict', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
  {
    id: 2,
    year: '1st Year - Semester Two',
    academicYear: '2021/2022 Academic Year',
    isOpen: false,
    courses: [
      { id: 9, code: 'CP 112', name: 'Data Structures And Algorithms', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 10, code: 'IA 122', name: 'Introduction To Information Security', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 11, code: 'IT 121', name: 'Computer Organization And Architecture', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 12, code: 'MT 1221', name: 'Probability And Statistics', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 13, code: 'SE 131', name: 'Software Engineering Principles', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
  {
    id: 3,
    year: '2nd Year - Semester One',
    academicYear: '2022/2023 Academic Year',
    isOpen: false,
    courses: [
      { id: 14, code: 'CP 211', name: 'Object Oriented Programming', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 15, code: 'CP 212', name: 'Database Systems', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 16, code: 'IA 211', name: 'Network Security', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 17, code: 'IT 211', name: 'Web Development', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
  {
    id: 4,
    year: '2nd Year - Semester Two',
    academicYear: '2022/2023 Academic Year',
    isOpen: false,
    courses: [
      { id: 18, code: 'CP 221', name: 'Operating Systems', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 19, code: 'CP 222', name: 'Computer Networks', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 20, code: 'SE 231', name: 'Software Project Management', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
  {
    id: 5,
    year: '3rd Year - Semester One',
    academicYear: '2023/2024 Academic Year',
    isOpen: false,
    courses: [
      { id: 21, code: 'CP 311', name: 'Artificial Intelligence', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 22, code: 'CP 312', name: 'Cloud Computing', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
  {
    id: 6,
    year: '3rd Year - Semester Two',
    academicYear: '2023/2024 Academic Year',
    isOpen: false,
    courses: [
      { id: 23, code: 'CP 321', name: 'Mobile Application Development', credit: 9.0, type: 'Core', carryOver: 'No', status: 'Inprogress' },
      { id: 24, code: 'SE 331', name: 'Software Quality Assurance', credit: 7.5, type: 'Core', carryOver: 'No', status: 'Inprogress' },
    ],
  },
];

export default function CoursesPage() {
  const [openSections, setOpenSections] = useState<number[]>([1]);

  const toggleSection = (id: number) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getTotalCredits = (courses: { credit: number }[]) => {
    return courses.reduce((sum, c) => sum + c.credit, 0);
  };

  return (
    <div className="space-y-4">
      {academicYears.map((year) => {
        const isOpen = openSections.includes(year.id);
        const totalCredits = getTotalCredits(year.courses);

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
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Credit</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Type</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Carry Over</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {year.courses.map((course, idx) => (
                      <tr key={course.id} className={cn('border-b', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.id}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.code}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.credit}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {course.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900">{course.carryOver}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {course.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-medium">
                      <td colSpan={3} className="py-3 px-4 text-sm text-gray-900 text-right">
                        Total Credits:
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{totalCredits.toFixed(1)}</td>
                      <td colSpan={4}></td>
                    </tr>
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
