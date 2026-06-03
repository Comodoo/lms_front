'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, GraduationCap, MapPin, Phone, Mail, Edit } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [params.id]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      // The id in the URL is actually the registration ID (which maps to student profile)
      const data = await apiClient.getRegistration(params.id as string);
      setStudent(data);
    } catch (error) {
      console.error('Failed to load student profile', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-[50vh]">
        <div className="text-muted-foreground animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          Loading student profile...
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Student Not Found</h2>
        <Button onClick={() => router.push('/admin/users/students')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.push('/admin/users/students')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Students
        </Button>
        <Button onClick={() => router.push(`/admin/users/edit/${params.id}`)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Student
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {student.firstName} {student.lastName}
              </h2>
              <p className="text-muted-foreground mb-4">{student.registrationNumber}</p>
              <Badge variant={student.status === 'registered' || student.status === 'active' ? 'default' : 'secondary'} className="mb-6 capitalize">
                {student.status.replace('_', ' ')}
              </Badge>

              <div className="w-full space-y-3 text-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="text-foreground">{student.email}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span className="text-foreground">{student.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-foreground text-left">
                    {student.address}, {student.city}, {student.country}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic Information */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-muted-foreground">Program</p>
                  <p className="font-medium">{student.programName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Intake</p>
                  <p className="font-medium">{student.intake || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Study Mode</p>
                  <p className="font-medium capitalize">{student.studyMode?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{student.department || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{student.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">National ID ({student.nationalIdType || 'ID'})</p>
                  <p className="font-medium">{student.nationalId || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle>Guardian Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{student.guardianName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Relationship</p>
                  <p className="font-medium">{student.guardianRelationship || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.guardianPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.guardianEmail || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
