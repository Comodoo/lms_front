'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Phone, MapPin, Building, Calendar, FileText, Loader2, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiClient.getRegistrations();
        if (response && response.length > 0) {
          setRegistration(response[0]);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center flex flex-col items-center">
            <User className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
            <p className="text-muted-foreground">It seems you have not completed registration.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">View your registered student information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <Card className="md:col-span-1 shadow-sm border-t-4 border-t-primary">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-4xl font-bold text-primary">
                {(registration.firstName || registration.first_name)?.charAt(0)}{(registration.lastName || registration.last_name)?.charAt(0)}
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {registration.firstName || registration.first_name} {registration.lastName || registration.last_name}
            </h2>
            <Badge variant="outline" className="mb-4">
              {registration.registrationNumber || registration.registration_number || 'Registration Number Pending'}
            </Badge>
            
            <div className="w-full space-y-3 mt-4 text-left">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{registration.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{registration.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{registration.address}, {registration.city}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Program</p>
                <p className="font-medium">{registration.programName || registration.program_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Department</p>
                <p className="font-medium">{registration.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Study Mode</p>
                <p className="font-medium capitalize">{(registration.studyMode || registration.study_mode)?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Registration Status</p>
                <Badge variant={registration.status === 'approved' ? 'default' : 'secondary'} className={registration.status === 'approved' ? 'bg-green-100 text-green-800' : ''}>
                  {registration.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Gender</p>
                <p className="font-medium capitalize">{registration.gender}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Date of Birth</p>
                <p className="font-medium">{registration.dateOfBirth || registration.date_of_birth ? new Date(registration.dateOfBirth || registration.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">National ID</p>
                <p className="font-medium">{registration.nationalId || registration.national_id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Country</p>
                <p className="font-medium">{registration.country}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Name</p>
                <p className="font-medium">{registration.guardianName || registration.guardian_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Relationship</p>
                <p className="font-medium capitalize">{registration.guardianRelationship || registration.guardian_relationship}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Phone</p>
                <p className="font-medium">{registration.guardianPhone || registration.guardian_phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-semibold">Address</p>
                <p className="font-medium">{registration.guardianAddress || registration.guardian_address}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
