'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { inventoryApi, hrApi, salaryApi, budgetApi, proposalApi } from '@/lib/api';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function OperationsDashboardPage() {
  const [stats, setStats] = useState({
    total: 0, available: 0, assigned: 0, under_repair: 0, lost: 0, disposed: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [hrStats, setHrStats] = useState<any>(null);
  const [salaryStats, setSalaryStats] = useState<any>(null);
  const [budgetStats, setBudgetStats] = useState<any>(null);
  const [proposalStats, setProposalStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await inventoryApi.getItems({ per_page: 500 });
        const items = res.data?.data || [];
        const counts: any = { total: items.length, available: 0, assigned: 0, under_repair: 0, lost: 0, disposed: 0 };
        items.forEach((i: any) => { if (counts[i.status] !== undefined) counts[i.status]++; });
        setStats(counts);

        const tRes: any = await inventoryApi.getTransactions({ per_page: 10 });
        setRecent(tRes.data?.data || []);

        const hRes: any = await hrApi.getStats();
        setHrStats(hRes.data);

        const sRes: any = await salaryApi.getProjection({});
        setSalaryStats(sRes.data);

        const bRes: any = await budgetApi.getDepartmentSummary({});
        const bSummary = bRes.data || [];
        const totals = bSummary.reduce((acc: any, r: any) => {
          acc.requested += Number(r.requested || 0);
          acc.approved += Number(r.approved || 0);
          acc.spent += Number(r.spent || 0);
          return acc;
        }, { requested: 0, approved: 0, spent: 0 });
        const budgetsRes: any = await budgetApi.getBudgets({ per_page: 500 });
        const pending = (budgetsRes.data?.data || []).filter((b: any) => b.status === 'submitted' || b.status === 'under_review').length;
        setBudgetStats({ ...totals, pending, remaining: totals.approved - totals.spent, utilization: totals.approved > 0 ? ((totals.spent / totals.approved) * 100) : 0 });

        const propRes: any = await proposalApi.getProposals({ per_page: 500 });
        const props = propRes.data?.data || [];
        const delayedActivities = props.reduce((acc: number, p: any) => acc + (p.activities || []).filter((a: any) => a.status === 'delayed').length, 0);
        const avgProgress = props.length ? props.reduce((acc: number, p: any) => acc + (p.implementation_progress || 0), 0) / props.length : 0;
        setProposalStats({
          total: props.length,
          draft: props.filter((p: any) => p.status === 'draft').length,
          submitted: props.filter((p: any) => p.status === 'submitted').length,
          approved: props.filter((p: any) => p.status === 'approved').length,
          published: props.filter((p: any) => p.status === 'published').length,
          pending_approval: props.filter((p: any) => p.status === 'submitted' || p.status === 'under_review').length,
          delayed_activities: delayedActivities,
          avg_progress: avgProgress,
        });
      } catch {
        // ignore
      }
    })();
  }, []);

  const cards = [
    { title: 'Total Items', value: stats.total },
    { title: 'Available', value: stats.available },
    { title: 'Assigned', value: stats.assigned },
    { title: 'Under Repair', value: stats.under_repair },
    { title: 'Lost', value: stats.lost },
    { title: 'Disposed', value: stats.disposed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Operations & Planning Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of operations and planning activities.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Inventory</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>Inventory status</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Inventory by Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[
              { name: 'Available', value: stats.available },
              { name: 'Assigned', value: stats.assigned },
              { name: 'Under Repair', value: stats.under_repair },
              { name: 'Lost', value: stats.lost },
              { name: 'Disposed', value: stats.disposed },
            ]}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#0D7377" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {hrStats && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Human Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Total Active Staff</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{hrStats.total_active}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>On Leave</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{hrStats.on_leave}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Pending Leave</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{hrStats.pending_leave}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Contracts Expiring (30d)</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{hrStats.contracts_expiring?.['30']}</p></CardContent></Card>
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>Staff by Employment Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={Object.entries(hrStats.by_employment_type || {}).map(([k, v]) => ({ name: k, value: v }))}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0D7377" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Recent HR Updates</CardTitle></CardHeader>
            <CardContent>
              {hrStats.recent_updates?.length ? (
                <ul className="space-y-2 text-sm">
                  {hrStats.recent_updates.map((p: any) => (
                    <li key={p.id} className="flex justify-between border-b pb-1">
                      <span>{p.user?.name || p.user_id} — {p.employment_status}</span>
                      <span className="text-muted-foreground">{new Date(p.updated_at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">No recent updates.</p>}
            </CardContent>
          </Card>
        </div>
      )}

      {salaryStats && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Salary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Total Monthly Cost</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{salaryStats.summary?.monthly_cost ?? 0}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Total Annual Cost</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{salaryStats.summary?.annual_cost ?? 0}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Staff Count</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{salaryStats.summary?.staff_count ?? 0}</p></CardContent></Card>
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle>Salary Cost by Department</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2">Department</th><th className="text-right p-2">Staff</th><th className="text-right p-2">Monthly</th><th className="text-right p-2">Annual</th></tr></thead>
                <tbody>
                  {(salaryStats.by_department || []).map((r: any) => (
                    <tr key={r.department} className="border-b"><td className="p-2">{r.department}</td><td className="text-right p-2">{r.staff_count}</td><td className="text-right p-2">{r.monthly_cost}</td><td className="text-right p-2">{r.annual_cost}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Staff Count by Salary Grade</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b"><th className="text-left p-2">Grade</th><th className="text-right p-2">Staff</th><th className="text-right p-2">Monthly</th><th className="text-right p-2">Annual</th></tr></thead>
                <tbody>
                  {(salaryStats.by_grade || []).map((r: any) => (
                    <tr key={r.grade} className="border-b"><td className="p-2">{r.grade}</td><td className="text-right p-2">{r.staff_count}</td><td className="text-right p-2">{r.monthly_cost}</td><td className="text-right p-2">{r.annual_cost}</td></tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {budgetStats && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Budget</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Total Requested</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{budgetStats.requested}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Total Approved</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{budgetStats.approved}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Total Spent</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{budgetStats.spent}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Remaining</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{budgetStats.remaining}</p><p className="text-xs text-muted-foreground">Utilization: {budgetStats.utilization.toFixed(1)}%</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Pending Approval</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{budgetStats.pending}</p></CardContent></Card>
          </div>
        </div>
      )}

      {proposalStats && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Proposals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader><CardTitle>Total Proposals</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.total}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Draft</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.draft}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Submitted</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.submitted}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Approved</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.approved}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Published</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.published}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Pending Approval</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.pending_approval}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Delayed Activities</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.delayed_activities}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Avg Progress</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{proposalStats.avg_progress.toFixed(1)}%</p></CardContent></Card>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Reports</CardTitle></CardHeader>
        <CardContent>
          <Link href="/operations/reports" className="text-primary hover:underline">Open Operations & Financial Reports</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Inventory Movements</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">No recent movements.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recent.map((t) => (
                <li key={t.id} className="flex justify-between border-b pb-1">
                  <span>{t.item?.name || t.inventory_item_id} — {t.transaction_type}</span>
                  <span className="text-muted-foreground">{new Date(t.transaction_date).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}