'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { GENDERS, STUDY_MODES } from '@/lib/college-types';
import { useRegistration } from '@/lib/registration-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/lib/api-client';
import * as z from 'zod';

// Form schema for validation
const registrationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  nationalId: z.string().min(8, 'National ID must be at least 8 characters'),
  nationalIdType: z.enum(['passport', 'national_id', 'birth_certificate']).optional(),
  nationalIdExpiryDate: z.string().optional(),
  nationalIdDocument: z.any().optional(), // File upload for ID

  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),

  // Academic Information (Multiple qualifications)
  academicQualifications: z.array(z.object({
    level: z.enum(['o_level', 'a_level', 'certificate', 'diploma', 'degree', 'other']),
    institutionName: z.string().min(2, 'Institution name is required'),
    institutionAddress: z.string().min(5, 'Institution address is required'),
    country: z.string().min(2, 'Country is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    examinationBoard: z.string().optional(),
    indexNumber: z.string().optional(),
    grade: z.string().optional(),
    gpa: z.string().optional(),
    major: z.string().optional(),
    document: z.any().optional(), // File upload for qualification
  })).min(1, 'At least one academic qualification is required'),

  // Program Information
  programId: z.string().min(1, 'Program is required'),

  // Guardian Information
  guardianName: z.string().min(2, 'Guardian name is required'),
  guardianPhone: z.string().min(10, 'Guardian phone is required'),
  guardianEmail: z.string().email('Invalid guardian email').optional().or(z.literal('')),
  guardianRelationship: z.string().min(2, 'Relationship is required'),
  guardianAddress: z.string().min(5, 'Guardian address is required'),
});

type FormValues = z.infer<typeof registrationSchema>;

const steps = [
  { id: 1, title: 'Personal Information', description: 'Tell us about yourself' },
  { id: 2, title: 'Academic Background', description: 'Your educational history' },
  { id: 3, title: 'Program Selection', description: 'Choose your program' },
  { id: 4, title: 'Guardian Information', description: 'Parent/guardian details' },
  { id: 5, title: 'Review & Submit', description: 'Review your application' },
];

export default function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicableFees, setApplicableFees] = useState<any[]>([]);
  const { programs, createRegistration, uploadDocument, registrations } = useRegistration();
  const router = useRouter();

  // Redirect if already registered
  useEffect(() => {
    if (registrations && registrations.length > 0) {
      router.push(`/registration/${registrations[0].id}/payment`);
    }
  }, [registrations, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'other',
      nationalId: '',
      nationalIdType: 'national_id',
      nationalIdExpiryDate: '',
      nationalIdDocument: null,
      phone: '',
      email: '',
      address: '',
      city: '',
      country: 'Tanzania',
      academicQualifications: [
        {
          level: 'o_level',
          institutionName: '',
          institutionAddress: '',
          country: '',
          startDate: '',
          endDate: '',
          examinationBoard: '',
          indexNumber: '',
          grade: '',
          gpa: '',
          major: '',
          document: null,
        },
      ],
      programId: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      guardianRelationship: '',
      guardianAddress: '',
    },
  });

  const addAcademicQualification = () => {
    const qualifications = form.getValues('academicQualifications') || [];
    form.setValue('academicQualifications', [
      ...qualifications,
      {
        level: 'o_level',
        institutionName: '',
        institutionAddress: '',
        country: '',
        startDate: '',
        endDate: '',
        examinationBoard: '',
        indexNumber: '',
        grade: '',
        gpa: '',
        major: '',
      },
    ]);
  };

  const removeAcademicQualification = (index: number) => {
    const qualifications = form.getValues('academicQualifications') || [];
    form.setValue('academicQualifications', qualifications.filter((_, i) => i !== index));
  };

  const onNext = async () => {
    const isValid = await form.trigger(
      currentStep === 1
        ? ['firstName', 'lastName', 'dateOfBirth', 'gender', 'nationalId', 'phone', 'email', 'address', 'city', 'country']
        : currentStep === 2
        ? ['academicQualifications']
        : currentStep === 3
        ? ['programId']
        : currentStep === 4
        ? ['guardianName', 'guardianPhone', 'guardianEmail', 'guardianRelationship', 'guardianAddress']
        : []
    );

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const onPrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // 1. Create registration record (now handles documents internally via FormData)
      const registration = await createRegistration(data as any);

      // Redirect to payment
      router.push(`/registration/${registration.id}/payment`);
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const selectedProgramId = form.watch('programId');
  const selectedProgram = programs.find(p => p.id?.toString() === selectedProgramId?.toString());

  useEffect(() => {
    if (selectedProgramId) {
      apiClient.getFees(selectedProgramId).then(data => {
        setApplicableFees((data || []).filter((f: any) => f.type === 'tuition'));
      }).catch(err => {
        console.error('Failed to fetch fees:', err);
        setApplicableFees([]);
      });
    } else {
      apiClient.getFees().then(data => {
        // Just direct fees
        setApplicableFees((data || []).filter((f: any) => f.type === 'direct'));
      }).catch(() => setApplicableFees([]));
    }
  }, [selectedProgramId]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Registration</h1>
        <p className="text-muted-foreground">Complete your registration in a few simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    currentStep >= step.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <div className="text-xs mt-2 text-center font-medium hidden sm:block">
                  {step.title}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1].title}</CardTitle>
          <CardDescription>{steps[currentStep - 1].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDERS.map((gender) => (
                              <SelectItem key={gender.value} value={gender.value}>
                                {gender.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>National ID / Passport Number</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalIdType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ID type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="national_id">National ID</SelectItem>
                            <SelectItem value="passport">Passport</SelectItem>
                            <SelectItem value="birth_certificate">Birth Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalIdExpiryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Expiry Date (if applicable)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+254712345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input placeholder="Kenya" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Nairobi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2 p-4 border rounded-lg bg-muted/30">
                    <Label className="mb-2 block font-bold">National ID / NIDA Document</Label>
                    <p className="text-xs text-muted-foreground mb-3">Upload a scanned copy of your National ID or Passport</p>
                    <Input
                      type="file"
                      className="bg-background cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) form.setValue('nationalIdDocument', file);
                      }}
                    />
                    {form.watch('nationalIdDocument') && (
                      <p className="mt-2 text-xs font-medium text-primary">
                        Selected: {(form.watch('nationalIdDocument') as File).name}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Academic Background */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Academic Qualifications</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAcademicQualification}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Qualification
                    </Button>
                  </div>

                  {form.watch('academicQualifications')?.map((_, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Qualification #{index + 1}</CardTitle>
                          {form.watch('academicQualifications')?.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAcademicQualification(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.level`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select level" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="o_level">O-Level</SelectItem>
                                    <SelectItem value="a_level">A-Level</SelectItem>
                                    <SelectItem value="certificate">Certificate</SelectItem>
                                    <SelectItem value="diploma">Diploma</SelectItem>
                                    <SelectItem value="degree">Degree</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.institutionName`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Institution Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="School/University Name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.country`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input placeholder="Kenya" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.startDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Start Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>End Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.grade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Grade (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="A, B+, etc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.institutionAddress`}
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Institution Address</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Institution address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.examinationBoard`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Examination Board (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="KNEC / Cambridge" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.indexNumber`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Index Number (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="1234567890" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.major`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Major/Specialization (optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="Computer Science" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`academicQualifications.${index}.gpa`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GPA (optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="3.5"
                                    {...field}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="md:col-span-2 p-4 border border-dashed rounded-lg bg-secondary/20">
                            <Label className="mb-2 block font-bold">Support Document</Label>
                            <p className="text-xs text-muted-foreground mb-3">Upload certificate, transcript, or result slip for this level</p>
                            <div className="flex items-center gap-4">
                              <Input
                                type="file"
                                className="bg-background flex-1 cursor-pointer"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) form.setValue(`academicQualifications.${index}.document`, file);
                                }}
                              />
                            </div>
                            {form.watch(`academicQualifications.${index}.document`) && (
                              <p className="mt-2 text-sm font-medium text-primary flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                File ready: {(form.watch(`academicQualifications.${index}.document`) as File).name}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {form.watch('academicQualifications')?.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">No academic qualifications added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAcademicQualification}
                        className="mt-4"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Qualification
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Program Selection */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program of Study</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.code} - {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the program you wish to pursue
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedProgram && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-2">{selectedProgram.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {selectedProgram.description}
                        </p>
                        <div className="space-y-1 text-sm">
                          <p><strong>Department:</strong> {typeof selectedProgram.department === 'object' && selectedProgram.department !== null ? (selectedProgram.department as any).name : selectedProgram.department}</p>
                          <p><strong>Duration:</strong> {selectedProgram.duration} years</p>
                          
                          {applicableFees.length > 0 ? (
                            <div className="mt-4">
                              <p className="font-semibold text-primary mb-2">Fee Structure Breakdown:</p>
                              
                              <div className="space-y-4">
                                {['semester_1', 'semester_2'].map(sem => {
                                  // Filter fees that apply to this semester and have an amount > 0
                                  const semFees = applicableFees.filter(f => 
                                    (f.applicable_semester === 'both' || f.applicable_semester === sem) && 
                                    parseFloat(sem === 'semester_1' ? f.semester_1_amount : f.semester_2_amount) > 0
                                  );

                                  if (semFees.length === 0) return null;

                                  const semTotal = semFees.reduce((sum, f) => sum + parseFloat(sem === 'semester_1' ? f.semester_1_amount : f.semester_2_amount), 0);

                                  return (
                                    <div key={sem} className="bg-background rounded border border-border/50 overflow-hidden">
                                      <div className="bg-muted px-3 py-2 border-b">
                                        <h5 className="font-semibold">{sem === 'semester_1' ? 'Semester 1' : 'Semester 2'}</h5>
                                      </div>
                                      <div className="p-3 space-y-2">
                                        {semFees.map((fee: any) => (
                                          <div key={fee.id} className="flex justify-between items-start text-xs border-b last:border-0 pb-2 last:pb-0">
                                            <div>
                                              <span className="font-medium">{fee.name}</span>
                                              <span className="ml-2 text-[10px] text-muted-foreground uppercase px-1.5 py-0.5 rounded bg-muted">
                                                {fee.type}
                                              </span>
                                              {fee.description && <p className="text-muted-foreground mt-0.5">{fee.description}</p>}
                                            </div>
                                            <span className="font-medium whitespace-nowrap ml-4">
                                              {fee.currency} {parseFloat(sem === 'semester_1' ? fee.semester_1_amount : fee.semester_2_amount).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                        <div className="flex justify-between pt-2 mt-2 border-t font-bold text-sm text-primary">
                                          <span>Total for {sem === 'semester_1' ? 'Semester 1' : 'Semester 2'}</span>
                                          <span>{semFees[0]?.currency || 'TZS'} {semTotal.toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-4 text-muted-foreground italic">No fee structure defined for this program yet.</p>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-1">Requirements:</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside">
                            {(selectedProgram.requirements || []).map((req: string, i: number) => (
                              <li key={i}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </div>
              )}

              {/* Step 4: Guardian Information */}
              {currentStep === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guardianName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship</FormLabel>
                        <FormControl>
                          <Input placeholder="Parent / Guardian" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+254712345678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guardian Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="guardian@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guardianAddress"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Guardian Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Guardian address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p><strong>Name:</strong> {form.watch('firstName')} {form.watch('lastName')}</p>
                      <p><strong>Email:</strong> {form.watch('email')}</p>
                      <p><strong>Phone:</strong> {form.watch('phone')}</p>
                      <p><strong>National ID:</strong> {form.watch('nationalId')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Program Selection</h3>
                    <div className="text-sm">
                      <p><strong>Program:</strong> {selectedProgram?.name}</p>
                      <p><strong>Intake:</strong> {form.watch('intake')}</p>
                      <p><strong>Study Mode:</strong> {form.watch('studyMode')}</p>
                      <p><strong>Tuition Fee:</strong> {selectedProgram?.currency} {((selectedProgram as any)?.tuitionFee || (selectedProgram as any)?.tuition_fee || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Documents & Attachments</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-center gap-2">
                        {form.watch('nationalIdDocument') ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Loader2 className="w-4 h-4" />}
                        National ID / Passport Document
                      </p>
                      {form.watch('academicQualifications')?.map((qual, i) => (
                        <p key={i} className="flex items-center gap-2">
                          {qual.document ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Loader2 className="w-4 h-4" />}
                          {qual.level.replace('_', ' ').toUpperCase()} Certificate
                        </p>
                      ))}
                    </div>
                  </div>

                  <Card className="bg-primary/5 border-primary">
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-2">Registration Fee</h4>
                      <p className="text-2xl font-bold">
                        {selectedProgram?.currency} {((selectedProgram as any)?.tuitionFee || (selectedProgram as any)?.tuition_fee || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This fee is required to complete your registration
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onPrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button type="button" onClick={onNext}>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit & Proceed to Payment'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
