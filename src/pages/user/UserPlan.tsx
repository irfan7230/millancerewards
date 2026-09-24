// =============================================================================
// User Plan — Details of the member's current active plan
// =============================================================================
import { useEffect, useState } from 'react';
import { FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { SkeletonDashboard } from '@/components/ui/Skeleton';
import { ErrorState, EmptyState } from '@/components/ui/States';
import { Badge } from '@/components/ui/Badge';
import { planService } from '@/services/plan.service';
import { useAuthStore } from '@/stores/authStore';
import type { Plan } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function UserPlan() {
  const { user } = useAuthStore();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.planId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true); setError(null);
      try { setPlan(await planService.getPlan(user!.planId!)); }
      catch (e) { setError(e instanceof Error ? e.message : 'Failed to load plan'); }
      finally { setLoading(false); }
    })();
  }, [user?.planId]);

  if (loading) return <SkeletonDashboard />;
  if (error) return <ErrorState description={error} />;
  if (!plan) return <EmptyState title="No Active Plan" icon={<FileText className="h-6 w-6" />} description="You are not currently subscribed to any plan." />;

  const pct = Math.round((plan.currentMonth / plan.durationMonths) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">Your Plan</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Details of your active subscription</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard title="Monthly Contribution" value={formatCurrency(plan.monthlyAmount)} icon={<span>💸</span>} />
        <StatCard title="Duration" value={`${plan.durationMonths} months`} icon={<span>📅</span>} />
        <StatCard title="Total Value (if completed)" value={formatCurrency(plan.monthlyAmount * plan.durationMonths)} icon={<span>💎</span>} />
      </div>

      <Card>
        <CardHeader><CardTitle>Plan Progress</CardTitle></CardHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-medium text-neutral-800">Month {plan.currentMonth} of {plan.durationMonths}</p>
              <p className="text-xs text-neutral-500">Started on {formatDate(plan.startDate)}</p>
            </div>
            <Badge variant="success" dot>Active</Badge>
          </div>
          
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div><span className="text-xs font-semibold inline-block text-brand-600">{pct}% Complete</span></div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-brand-100">
              <div style={{ width: `${pct}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-brand-500 transition-all duration-500"></div>
            </div>
          </div>

          <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 text-sm">
            <h4 className="font-semibold text-neutral-800 flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-success-500" /> Plan Benefits
            </h4>
            <ul className="space-y-2 text-neutral-600 list-disc list-inside">
              <li>Eligible for {plan.durationMonths} monthly lucky draws.</li>
              <li>100% of non-winning contributions are returned as Vault Balance.</li>
              <li>Vault balance is redeemable in store via a digital QR voucher.</li>
              <li>Zero hidden fees or deductions.</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
