'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, CreditCard, Receipt, ArrowRight } from 'lucide-react';

export default function StudentFeesPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock students data
  const students = [
    { id: 'STU-001', name: 'John Doe', email: 'john.doe@student.ac.tz', program: 'Computer Science', totalPaid: 125000, totalDue: 200000, status: 'active' },
    { id: 'STU-002', name: 'Jane Smith', email: 'jane.smith@student.ac.tz', program: 'Business Administration', totalPaid: 200000, totalDue: 200000, status: 'paid' },
    { id: 'STU-003', name: 'Mike Johnson', email: 'mike.j@student.ac.tz', program: 'Engineering', totalPaid: 75000, totalDue: 200000, status: 'pending' },
    { id: 'STU-004', name: 'Sarah Williams', email: 'sarah.w@student.ac.tz', program: 'Medicine', totalPaid: 150000, totalDue: 300000, status: 'active' },
  ];

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, paid: number, due: number) => {
    const percentage = (paid / due) * 100;
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800">Fully Paid</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-blue-100 text-blue-800">Partially Paid</Badge>;
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Payment Due</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Student Fee Lookup</h1>
          <p className="text-muted-foreground">Search and view student payment history</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, ID, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <div className="grid gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{student.id}</Badge>
                      <Badge variant="secondary">{student.program}</Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(student.status, student.totalPaid, student.totalDue)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-bold text-green-600">TSH {student.totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Due</p>
                  <p className="text-xl font-bold">TSH {student.totalDue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="text-xl font-bold text-red-600">TSH {(student.totalDue - student.totalPaid).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  View History
                </Button>
                <Button size="sm" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  Record Payment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No students found matching your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

