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
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
    ChevronRight,
    DollarSign,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    User,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/accountant/payments', icon: DollarSign },
  { name: 'Student Fees', href: '/accountant/student-fees', icon: Users },
  { name: 'Reports', href: '/accountant/reports', icon: FileText },
  { name: 'Settings', href: '/accountant/settings', icon: Settings },
];

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
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

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-[#0D7377] border-r border-[#0a5f61]">
          <div className="flex flex-col h-full bg-[#0D7377]">
            <div className="p-6 border-b border-white/20">
              <Link href="/accountant/dashboard" className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-1.5 flex items-center justify-center">
                  <img src="/LOGO.png" alt="ZMC Logo" className="h-6 w-auto object-contain" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-tight text-white">ZANZIBAR METROPOLITAN COLLEGE</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Finance Portal</span>
                </div>
              </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white text-[#0D7377] shadow-md shadow-black/10'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5', isActive ? 'text-[#0D7377]' : 'text-white/70')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-white/20">
              <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-xl">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                  <p className="text-xs text-white/70 truncate">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/20">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 bg-[#0D7377] border-r border-[#0a5f61]">
          <div className="p-6 border-b border-white/20">
            <Link href="/accountant/dashboard" className="flex items-center gap-3">
              <div className="bg-white/20 rounded-lg p-1.5 flex items-center justify-center">
                <img src="/LOGO.png" alt="ZMC Logo" className="h-6 w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight text-white">ZANZIBAR METROPOLITAN COLLEGE</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Finance Portal</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white text-[#0D7377] shadow-md shadow-black/10'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-[#0D7377]' : 'text-white/70')} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/20">
            <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-xl">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name}</p>
                <p className="text-xs text-white/70 truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white/70 hover:text-white hover:bg-white/20">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
                <span>Accountant Portal</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/accountant/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>

        <footer className="p-6 border-t bg-white text-center">
          <p className="text-xs text-muted-foreground italic">
            &copy; 2026 College Student Management System (Finance Portal)
          </p>
        </footer>
      </div>
    </div>
  );
}
