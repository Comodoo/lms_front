'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import { coursesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, Shield, Edit2, Calendar, MapPin, Building, GraduationCap, Clock, Award, BookOpen, Users, FileText, Activity } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function InstructorProfilePage() {
  const { user, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dashboard stats state
  const [coursesCount, setCoursesCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);

  const nameParts = user?.name?.split(' ') || ['Instructor', ''];
  const [formData, setFormData] = useState({
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' ') || '',
    phone: '+255 123 456 789',
    dateOfBirth: '1980-05-15',
    gender: 'male',
  });

  useEffect(() => {
    // Quick load for stats
    const loadStats = async () => {
      try {
        const coursesRes = await coursesApi.getMyCourses().catch(() => ({ data: [] }));
        const fetchedCourses = coursesRes.data || [];
        setCoursesCount(fetchedCourses.length);
        
        // Mock student count based on courses
        setStudentsCount(fetchedCourses.length * 45);
      } catch (e) {
         // ignore
      }
    };
    loadStats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender as 'male' | 'female' | 'other',
      });

      updateProfile({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Profile</h1>
          <p className="text-muted-foreground">Comprehensive view of your professional, academic, and system details.</p>
        </div>
      </div>

      {/* Top Quick Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-blue-500 p-3 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              <h3 className="text-2xl font-bold">{coursesCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-green-500 p-3 rounded-lg text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">{studentsCount}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-amber-500 p-3 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assignments Created</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50/50 border-purple-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="bg-purple-500 p-3 rounded-lg text-white">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
              <h3 className="text-2xl font-bold">94%</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Profile Identity */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            
            <CardContent className="pt-8 relative px-6 pb-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="h-24 w-24 rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
                  {user.name.charAt(0)}
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-primary font-medium text-sm mb-4 flex items-center justify-center gap-1.5">
                <Shield className="w-4 h-4" /> 
                Senior Lecturer
              </p>
              
              <div className="flex flex-col gap-3 text-sm mt-6 text-left">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                  <span className="text-muted-foreground flex items-center gap-2"><Award className="w-4 h-4"/> Employee ID</span>
                  <span className="font-semibold">EMP-2023-089</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                  <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4"/> Last Login</span>
                  <span className="font-semibold">Today, 08:30 AM</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border">
                  <span className="text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4"/> Account Status</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-600"></span> Active
                  </span>
                </div>
              </div>

              <Separator className="my-6" />

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Profile Information</DialogTitle>
                    <DialogDescription>
                      Update your contact and personal details below.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input 
                          id="dob" 
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select value={formData.gender} onValueChange={(val) => setFormData({...formData, gender: val})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save changes'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="professional">Professional & Academic</TabsTrigger>
              <TabsTrigger value="teaching">Teaching</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            
            {/* 1. Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Personal details and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gender</p>
                    <p className="font-medium capitalize">{formData.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                    <p className="font-medium">{new Date(formData.dateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nationality</p>
                    <p className="font-medium">Tanzanian</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone Number</p>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Physical Address</p>
                    <p className="font-medium">Block A, Room 302, Main Campus</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 2. Professional & Academic Tab */}
            <TabsContent value="professional" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Department</p>
                    <p className="font-medium">Software Engineering</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Faculty/School</p>
                    <p className="font-medium">School of Computing & IT</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Position</p>
                    <p className="font-medium">Senior Lecturer</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employment Status</p>
                    <p className="font-medium text-green-600">Full-Time Permanent</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Employment</p>
                    <p className="font-medium">12th August, 2018</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Specialization/Research Area</p>
                    <p className="font-medium">Artificial Intelligence & Systems Design</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Highest Qualification</p>
                      <p className="font-medium">PhD in Computer Science</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">University</p>
                      <p className="font-medium">University of Dar es Salaam</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Certifications</p>
                      <div className="flex gap-2 mt-2">
                        <span className="px-3 py-1 bg-slate-100 rounded-md text-sm font-medium">AWS Certified Solutions Architect</span>
                        <span className="px-3 py-1 bg-slate-100 rounded-md text-sm font-medium">Cisco CCNA</span>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4"/> Recent Research Publications</p>
                    <ul className="space-y-3">
                      <li className="text-sm border-l-2 border-primary pl-3">
                        <p className="font-medium">Machine Learning in Educational Systems</p>
                        <p className="text-muted-foreground">Journal of Educational Technology, 2024</p>
                      </li>
                      <li className="text-sm border-l-2 border-primary pl-3">
                        <p className="font-medium">Security Protocols in Cloud Learning Management</p>
                        <p className="text-muted-foreground">International Conference on IT Security, 2023</p>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 3. Teaching Information Tab */}
            <TabsContent value="teaching" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>Teaching Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Semester Courses</p>
                      <p className="font-medium">{coursesCount} Active Courses</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Assigned Students</p>
                      <p className="font-medium">{studentsCount} Students</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div>
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4"/> Class Schedule & Office Hours</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-medium mb-2 text-sm">Class Schedule</h4>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                          <li><span className="font-medium text-foreground">BIT 7225:</span> Mon 08:00 - 10:00 (Room 101)</li>
                          <li><span className="font-medium text-foreground">CIS 4100:</span> Wed 14:00 - 16:00 (Lab 2)</li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg border">
                        <h4 className="font-medium mb-2 text-sm">Office Hours</h4>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                          <li><span className="font-medium text-foreground">Tuesdays:</span> 10:00 AM - 12:00 PM</li>
                          <li><span className="font-medium text-foreground">Thursdays:</span> 02:00 PM - 04:00 PM</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 4. System Information Tab */}
            <TabsContent value="system" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Username</p>
                    <p className="font-medium">instructor.doe</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Role & Permissions</p>
                    <p className="font-medium capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-md inline-block">{user.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date Joined</p>
                    <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Account Security</p>
                    <p className="font-medium text-green-600 flex items-center gap-1"><Shield className="w-4 h-4"/> 2FA Enabled</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </div>
      </div>
    </div>
  );
}
