'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRegistration } from '@/lib/registration-context';
import { apiClient } from '@/lib/api-client';
import { RegistrationPayment } from '@/lib/college-types';
import { CheckCircle2, Clock, Loader2, ArrowRight, FileText, Download } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegistrationPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { getRegistrationById, registrations, loading: contextLoading } = useRegistration();
  
  const [registration, setRegistration] = useState<any>(null);
  const [payments, setPayments] = useState<RegistrationPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contextLoading) {
      loadData();
    }
  }, [params.id, contextLoading, registrations]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Find from context first to avoid 401 on admin-only GET /registrations/{id} route
      let regData: any = registrations.find(r => String(r.id) === String(params.id));
      
      // If not found in context (e.g. direct link), try the API anyway but catch silently
      if (!regData) {
        try {
           regData = await getRegistrationById(params.id as string);
        } catch (e) {
           // Ignore
        }
      }

      const paymentsData = await apiClient.getPaymentsByRegistration(params.id as string).catch(() => []);
      
      setRegistration(regData || registrations[0]); // Fallback to first registration if 401
      setPayments(paymentsData || []);
    } catch (error) {
      console.error("Failed to load registration data", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !registration) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const totalBilled = payments.reduce((acc, p) => acc + Number(p.amount), 0);

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Registration Submitted Successfully!</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Your application for <span className="font-medium text-slate-900">{registration.programName}</span> has been received and is pending administrative approval.
        </p>
      </div>

      <Card className="border-0 shadow-md overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generated Fee Bills
          </CardTitle>
          <CardDescription>
            The following bills have been generated for your registration. Please make payments using the provided Control Numbers. Your status will update once the accountant verifies your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">Fee Description</th>
                  <th className="px-6 py-4 font-medium">Control Number</th>
                  <th className="px-6 py-4 font-medium text-right">Amount (TSH)</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No bills have been generated yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="bg-white hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{payment.description || payment.feeType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono bg-slate-100 px-3 py-1.5 rounded text-slate-700 text-sm font-semibold inline-block border border-slate-200">
                          {payment.controlNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-700">
                        {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge 
                          className={`font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200' 
                              : 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
                          }`}
                        >
                          {payment.status === 'completed' ? 'PAID' : 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {payments.length > 0 && (
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right font-medium text-slate-700">Total Billed:</td>
                    <td className="px-6 py-4 text-right font-bold text-lg text-slate-900">{totalBilled.toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button 
          size="lg" 
          className="w-full max-w-sm font-semibold h-12"
          onClick={() => router.push('/dashboard')}
        >
          Finish & Go to Dashboard
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
