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
import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, Lock, Mail, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { login, verifyTwoFactor, isLoading, error, user } = useAuth();
  
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
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
            <GraduationCap className="h-8 w-8" />
            <span className="text-2xl font-bold">LearnHub</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Welcome back to your learning journey
          </h1>
          <p className="text-lg opacity-90">
            Access thousands of courses, track your progress, and achieve your career goals with Africa's leading learning platform.
          </p>
          
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">50K+</div>
              <div className="text-sm opacity-80">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-80">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">98%</div>
              <div className="text-sm opacity-80">Satisfaction</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm opacity-80">
          Trusted by leading organizations across Africa
        </div>
      </div>
      
      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">LearnHub</span>
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
              
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
              
              {/* Demo credentials */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Demo Credentials</p>
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setEmail('student@example.com');
                      setPassword('password123');
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Student Account</span>
                      <span className="text-xs text-muted-foreground">student@example.com</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setEmail('instructor@example.com');
                      setPassword('password123');
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Instructor Account</span>
                      <span className="text-xs text-muted-foreground">instructor@example.com</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setEmail('admin@example.com');
                      setPassword('admin123');
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Admin Account</span>
                      <span className="text-xs text-muted-foreground">admin@example.com</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setEmail('accountant@example.com');
                      setPassword('password123');
                    }}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Accountant Account</span>
                      <span className="text-xs text-muted-foreground">accountant@example.com</span>
                    </div>
                  </Button>
                </div>
              </div>
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
