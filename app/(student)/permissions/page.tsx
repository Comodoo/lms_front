'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock } from 'lucide-react';

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Permissions</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permission Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="font-medium text-amber-900">Coming Soon</p>
              <p className="text-sm text-amber-700">Permission request features will be available here.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
