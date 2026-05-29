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
    BookOpen,
    ChevronDown,
    ChevronRight,
    Circle,
    ClipboardList,
    CreditCard,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    User
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
};

const navigation: NavItem[] = [
  { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Academics',
    href: '/academics',
    icon: BookOpen,
    children: [
      { name: 'My Courses Detail', href: '/academics/courses' },
      { name: 'My Assessments', href: '/academics/assessments' },
      { name: 'My Courses Result', href: '/academics/results' },
    ],
  },
  { name: 'Online Registration', href: '/registration', icon: ClipboardList },
  { name: 'Finance', href: '/finance', icon: CreditCard },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Academics']);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActivePath = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!mounted) return null;

  const toggleExpand = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isChildActive = (parentHref: string) => {
    return pathname.startsWith(parentHref + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0D7377] border-r border-[#0a5f61]">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">SRMS</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2">
        {navigation.map((item) => {
          const active = isActivePath(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);
          const childActive = hasChildren && isChildActive(item.href);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <>
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={cn(
                      'w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active || childActive
                        ? 'bg-white text-[#0D7377] shadow-md shadow-black/10'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn('h-5 w-5', active || childActive ? 'text-[#0D7377]' : 'text-white/70 group-hover:text-white')} />
                      {item.name}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isExpanded ? 'rotate-180' : '',
                        active || childActive ? 'text-[#0D7377]' : 'text-white/70'
                      )}
                    />
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const childIsActive = pathname === child.href;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                              childIsActive
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <Circle className={cn('h-2 w-2', childIsActive ? 'fill-white text-white' : 'fill-white/40 text-white/40')} />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
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
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-white/20">
        <div className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
           <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
              {user?.name?.charAt(0) || 'S'}
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.name || 'Student'}</p>
              <p className="text-[10px] text-white/70 truncate">{user?.email || 'student@college.ac.tz'}</p>
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
               <span className="text-sm font-medium text-muted-foreground">Log in as:</span>
               <span className="text-sm font-semibold">T21-03-12812</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full ring-2 ring-primary/5">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {user?.name?.charAt(0) || 'S'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
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
            &copy; 2026 Student Result Management System (SRMS)
          </p>
        </footer>
      </div>
    </div>
  );
}
