'use client';

import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { name: 'My Courses Detail', href: '/academics/courses', title: 'My Courses Detail', breadcrumb: 'My Courses Detail' },
  { name: 'My Assessments', href: '/academics/assessments', title: 'My Courses Assessments', breadcrumb: 'My Courses Assessments' },
  { name: 'My Courses Result', href: '/academics/results', title: 'My Courses Results', breadcrumb: 'My Courses Results' },
];

export default function AcademicsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeTab = tabs.find((t) => pathname === t.href) || tabs[0];
  const pageTitle = activeTab.title;
  const breadcrumbLabel = activeTab.breadcrumb;

  // Info banner text based on active tab
  const getBannerText = () => {
    if (pathname === '/academics/courses') {
      return 'Click on a Listed Academic Year and Semester to view your course details.';
    } else if (pathname === '/academics/assessments') {
      return 'Click on a Listed Academic Year and Semester to view your course assessments.';
    } else if (pathname === '/academics/results') {
      return 'Click on a Listed Academic Year and Semester to view your course results.';
    }
    return 'Click on a Listed Academic Year and Semester to view your course information.';
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-primary flex items-center gap-1">
          <Home className="h-4 w-4" />
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{breadcrumbLabel}</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
            Register Core Courses
          </button>
          <button className="px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded hover:bg-cyan-600 transition-colors">
            Register Elective Courses
          </button>
          <button className="px-4 py-2 bg-orange-400 text-white text-sm font-medium rounded hover:bg-orange-500 transition-colors">
            Register Carry Over Courses
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded">
        <p className="text-sm text-blue-800">
          <span className="font-medium">{getBannerText()}</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  'py-4 px-1 border-b-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                )}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
