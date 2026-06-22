'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import Swal from 'sweetalert2';

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      Swal.fire('Error', 'New passwords do not match', 'error');
      return;
    }
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Swal.fire('Success', 'Password updated successfully', 'success');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and security</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={user?.name || ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user?.email || ''} disabled />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: To update your personal information or contact details, please contact the admissions office.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                  required 
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
