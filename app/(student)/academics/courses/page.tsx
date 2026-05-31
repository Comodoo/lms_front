'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { coursesApi } from '@/lib/api';
import { apiClient } from '@/lib/api-client';
import { useRegistration } from '@/lib/registration-context';

export default function CoursesPage() {
  const [openSections, setOpenSections] = useState<number[]>([1]);
  const [openSemesters, setOpenSemesters] = useState<string[]>([]);
  const [courseGroups, setCourseGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { registrations } = useRegistration();
  const currentRegistration = registrations?.[0];

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        if (!currentRegistration?.id) {
          setLoading(false);
          return;
        }

        // Fetch payments, results, and courses simultaneously
        const [paymentsData, resultsData, coursesRes] = await Promise.all([
          apiClient.getPaymentsByRegistration(currentRegistration.id).catch(() => []),
          apiClient.getStudentResults().catch(() => ({ data: [] })),
          coursesApi.getAll().catch(() => ({ data: [] }))
        ]);

        const payments = paymentsData || [];
        const examResults = Array.isArray(resultsData) ? resultsData : ((resultsData as any)?.data || []);

        // Compute registered semester logic mirroring the dashboard
        let registeredSemester = 1;
        const hasSemester1Payment = payments.some((p: any) => p.status === 'completed' && (p.description?.toLowerCase().includes('semester 1') || p.feeType?.toLowerCase().includes('semester_1') || p.feeType === 'tuition' || p.feeType === 'tuition_fee'));
        const hasSemester2Payment = payments.some((p: any) => p.status === 'completed' && (p.description?.toLowerCase().includes('semester 2') || p.feeType?.toLowerCase().includes('semester_2')));

        if (examResults && examResults.length > 0) {
          if (examResults[0].semester) {
            const sem = String(examResults[0].semester).toLowerCase();
            registeredSemester = sem === 'second' || sem === '2' ? 2 : (sem === 'summer' || sem === '3' ? 3 : 1);
          }
        } else {
          registeredSemester = hasSemester2Payment ? 2 : (hasSemester1Payment ? 1 : 1);
        }

        if (coursesRes.data && Array.isArray(coursesRes.data)) {
          let allCourses = coursesRes.data;
          
          if (currentRegistration?.programId) {
            allCourses = allCourses.filter((c: any) => 
              String(c.program_id) === String(currentRegistration.programId)
            );
          }

          const formattedCourses = allCourses.map((c: any, index: number) => {
            const creditValue = c.credit_value || c.credit?.value || (typeof c.credit === 'number' || typeof c.credit === 'string' ? c.credit : 0);
            
            return {
              id: c.id || index + 1,
              code: c.code || 'N/A',
              name: c.name || 'Unnamed Course',
              credit: creditValue,
              type: 'Core',
              status: c.status === 'active' ? 'Registered' : 'Inactive',
            };
          });

          // Split real courses evenly into Semester One and Semester Two
          const half = Math.ceil(formattedCourses.length / 2);
          const semesterOneCourses = formattedCourses.slice(0, half);
          const semesterTwoCourses = formattedCourses.slice(half);
          
          const semesterObj = registeredSemester === 2 ? {
            name: 'Semester Two',
            academicYear: 'Current Academic Year',
            courses: semesterTwoCourses,
          } : {
            name: 'Semester One',
            academicYear: 'Current Academic Year',
            courses: semesterOneCourses,
          };
          
          setOpenSemesters([`1-${semesterObj.name}`]);

          // Group all courses under a nested structure similar to Results page
          setCourseGroups([
            {
              id: 1,
              year: currentRegistration?.programName || 'My Program Courses',
              academicYear: 'Current Academic Year',
              semesters: [semesterObj]
            }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentRegistration?.programId, currentRegistration?.programName, currentRegistration?.id]);

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

  const getTotalCredits = (courses: { credit: number }[]) => {
    return courses.reduce((sum, c) => sum + (Number(c.credit) || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasNoCourses = courseGroups.length === 0 || courseGroups.every(group => 
    group.semesters.every((sem: any) => !sem.courses || sem.courses.length === 0)
  );

  if (hasNoCourses) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground space-y-4">
        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
        <p>No courses found for your registered program.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded mb-6">
        <p className="text-sm text-blue-800">
          <span className="font-medium">Click on a Listed Academic Year and Semester to view your courses.</span>
        </p>
      </div>

      {courseGroups.map((year) => {
        const isOpen = openSections.includes(year.id) || (year.id === 1 && openSections.length === 0);

        return (
          <div key={year.id} className="border rounded-lg bg-white overflow-hidden shadow-sm">
            {/* Year Header */}
            <button
              onClick={() => toggleSection(year.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
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
                {/* Semesters */}
                <div className="space-y-3">
                  {year.semesters.map((semester: any) => {
                    const semesterKey = `${year.id}-${semester.name}`;
                    const isSemesterOpen = openSemesters.includes(semesterKey) || (year.id === 1 && openSemesters.length === 0);
                    const hasCourses = semester.courses.length > 0;
                    const totalCredits = getTotalCredits(semester.courses);

                    return (
                      <div key={semesterKey} className="border rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => toggleSemester(semesterKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors"
                        >
                          <div className="text-left">
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
                              <thead className="bg-gray-100 border-b border-t">
                                <tr>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Code</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Name</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Credit</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Course Type</th>
                                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {semester.courses.map((course: any, idx: number) => (
                                  <tr key={course.id} className={cn('border-b last:border-0 hover:bg-gray-50', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                                    <td className="py-3 px-4 text-sm text-gray-900">{idx + 1}</td>
                                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{course.code}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{course.name}</td>
                                    <td className="py-3 px-4 text-sm text-gray-900">{course.credit}</td>
                                    <td className="py-3 px-4 text-sm">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        {course.type}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                      <span className={cn(
                                        "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                                        course.status === 'Registered' ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                      )}>
                                        {course.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                                <tr className="bg-gray-50 font-medium border-t">
                                  <td colSpan={3} className="py-3 px-4 text-sm text-gray-900 text-right">
                                    Total Credits:
                                  </td>
                                  <td className="py-3 px-4 text-sm font-bold text-gray-900">{totalCredits.toFixed(1)}</td>
                                  <td colSpan={2}></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}

                        {isSemesterOpen && !hasCourses && (
                          <div className="p-4 bg-white border-t">
                            <div className="text-center text-sm text-gray-500 py-4">
                              No courses available for this semester.
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
