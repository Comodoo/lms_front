'use client';

import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  ChevronRight,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
  { name: 'My Courses', href: '/instructor/courses', icon: GraduationCap },
  { name: 'Results', href: '/instructor/results', icon: FileText },
  { name: 'Settings', href: '/instructor/settings', icon: Settings },
];

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActivePath = (href: string) => {
    if (href === '/instructor') return pathname === '/instructor';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!mounted) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0D7377] border-r border-[#0a5f61]">
      <div className="p-6">
        <Link href="/instructor" className="flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-1.5">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold block leading-none text-white">College LMS</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Instructor Portal</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
        {navigation.map((item) => {
          const active = isActivePath(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-white text-[#0D7377] shadow-md shadow-black/10'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className={cn('h-5 w-5', active ? 'text-[#0D7377]' : 'text-white/70 group-hover:text-white')} />
                {item.name}
              </div>
              {active && <ChevronRight className="h-4 w-4 opacity-70" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/20">
        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
           <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0) || 'I'}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'Instructor'}</p>
              <p className="text-[10px] text-white/70 truncate">{user?.email || 'instructor@college.ac.tz'}</p>
           </div>
           <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/20">
              <LogOut className="h-4 w-4" />
           </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 shrink-0 shadow-sm z-40">
        <SidebarContent />
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header */}
        <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 bg-card/80 backdrop-blur-md border-b">
          <div className="flex items-center gap-4">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 border-none w-72">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-muted-foreground hidden lg:block">Instructor</span>
               <ChevronRight className="h-4 w-4 text-muted-foreground/30 hidden lg:block" />
               <h2 className="text-sm font-semibold capitalize">
                {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
               </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ring-2 ring-primary/5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.name?.charAt(0) || 'I'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/instructor/profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/instructor/settings">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>

        <footer className="p-6 border-t bg-card/50 text-center">
          <p className="text-xs text-muted-foreground italic">
            &copy; 2026 College Student Management System (Instructor Portal)
          </p>
        </footer>
      </div>
    </div>
  );
}
