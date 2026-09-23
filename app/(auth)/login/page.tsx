'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail, Moon, Smartphone, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyTwoFactor, isLoading, error, user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getRedirectPath = (userRole: string) => {
    // Admin users go to admin dashboard
    if (userRole === 'admin') {
      return '/admin';
    }
    // Instructors go to instructor dashboard
    if (userRole === 'instructor') {
      return '/instructor';
    }
    // Accountants go to accountant dashboard
    if (userRole === 'accountant') {
      return '/accountant/dashboard';
    }
    // Default: students go to student dashboard
    return '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!validateForm()) return;
    
    const result = await login(email, password);
    
    if (result.requiresTwoFactor) {
      setShowTwoFactor(true);
      return;
    }
    
    if (result.success) {
      // Redirect based on user role returned from login
      const redirectPath = getRedirectPath(result.userRole || 'student');
      router.push(redirectPath);
    } else {
      setMessage(result.message);
    }
  };

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await verifyTwoFactor(twoFactorCode);
    
    if (result.success) {
      // Redirect based on user role/email
      const redirectPath = getRedirectPath(email);
      router.push(redirectPath);
    } else {
      setMessage(result.message);
    }
  };

  if (showTwoFactor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30 relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Two-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTwoFactor} className="space-y-4">
              {message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              
              <FieldGroup>
                <Field>
                  <FieldLabel>Verification Code</FieldLabel>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    autoFocus
                  />
                </Field>
              </FieldGroup>
              
              <Button type="submit" className="w-full" disabled={isLoading || twoFactorCode.length !== 6}>
                {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                Verify
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                Demo code: <code className="bg-muted px-2 py-0.5 rounded">123456</code>
              </p>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="ghost" onClick={() => setShowTwoFactor(false)}>
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between text-primary-foreground">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-lg p-1">
              <img src="/logo.png" alt="ZMC Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-2xl font-bold">ZMC</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Welcome back to Zanzibar Metropolitan College
          </h1>
          <p className="text-lg opacity-90">
            Access your student portal, manage your academic progress, and achieve your career goals with ZMC's dedicated learning platform.
          </p>
        </div>
        
        <div className="text-sm opacity-80">
          Trusted by leading organizations across Africa
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="bg-primary rounded-lg p-1">
              <img src="/logo.png" alt="ZMC Logo" className="h-8 w-8 object-contain" />
            </div>
            <span className="text-2xl font-bold">ZMC</span>
          </div>
          
          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="px-0 lg:px-6">
              <CardTitle className="text-2xl">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-0 lg:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {(error || message) && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error || message}</AlertDescription>
                  </Alert>
                )}
                
                <FieldGroup>
                  <Field>
                    <FieldLabel>Email address</FieldLabel>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && <FieldError>{errors.email}</FieldError>}
                  </Field>
                  
                  <Field>
                    <div className="flex items-center justify-between">
                      <FieldLabel>Password</FieldLabel>
                      <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <FieldError>{errors.password}</FieldError>}
                  </Field>
                </FieldGroup>
                
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                    Remember me for 30 days
                  </label>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
              

            </CardContent>
            
            <CardFooter className="px-0 lg:px-6 flex flex-col gap-4">
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up for free
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
