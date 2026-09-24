// =============================================================================
// User Draws — Draw history and win tracking
// =============================================================================
import { useEffect, useState } from 'react';
import { Trophy, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { drawService } from '@/services/draw.service';
import { prizeService } from '@/services/prize.service';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import type { Draw, Prize, FranchiseUser } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function UserDraws() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const franchiseId = user?.franchiseId ?? '';

  const [draws, setDraws] = useState<Draw[]>([]);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [members, setMembers] = useState<FranchiseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const [d, p, u] = await Promise.all([
          drawService.getFranchiseDraws(franchiseId),
          prizeService.getFranchisePrizes(franchiseId),
          userService.getFranchiseUsers(franchiseId),
        ]);
        // Only show completed draws to users
        setDraws(d.filter(draw => draw.status === 'completed'));
        setPrizes(p);
        setMembers(u);
      } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
      finally { setLoading(false); }
    })();
  }, [userId, franchiseId]);

  // Compute + paginate before early returns to keep hook order stable.
  const sorted = [...draws].sort((a, b) => b.executedAt!.localeCompare(a.executedAt!));
  const { page, setPage, pageItems, pageCount, total, range } = usePagination(sorted, 10);

  if (loading) return <SkeletonTable />;
  if (error) return <ErrorState description={error} />;

  const prizeMap = new Map(prizes.map(p => [p.id, p]));
  const memberMap = new Map(members.map(m => [m.id, m]));
  const myWins = draws.flatMap(d => d.winners.filter(w => w.userId === userId).map(w => ({ draw: d, win: w })));

  // Latest completed draw → this month's 10 winners for the trust marquee.
  const latestDraw = sorted[0];
  const latestWinners = latestDraw
    ? [...latestDraw.winners]
        .sort((a, b) => a.rank - b.rank)
        .map(w => ({
          rank: w.rank,
          name: memberMap.get(w.userId)?.name ?? 'Member',
          prize: prizeMap.get(w.prizeId),
          isMe: w.userId === userId,
        }))
    : [];

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">Lucky Draws</h1><p className="text-sm text-neutral-500 mt-0.5">View draw results and your prizes</p></div>

      {myWins.length > 0 && (
        <Card className="border-accent-200 bg-accent-50/30">
          <CardHeader><CardTitle className="flex items-center gap-2 text-accent-900"><Trophy className="h-5 w-5 text-accent-600" /> Your Prizes</CardTitle></CardHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
            {myWins.map(({ draw, win }) => {
              const prize = prizeMap.get(win.prizeId);
              return (
                <div key={draw.id} className="p-4 bg-white rounded-xl border border-accent-100 shadow-sm flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-700 text-lg shrink-0">🎁</div>
                  <div>
                    <p className="font-bold text-neutral-900">{prize?.name ?? 'Prize'}</p>
                    <p className="text-sm text-neutral-500">{draw.periodLabel} Draw</p>
                    {prize && <p className="text-xs font-mono text-brand-600 mt-1">{formatCurrency(prize.value)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card padding="none">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-neutral-100"><CardTitle>Draw History</CardTitle></CardHeader>
        {sorted.length === 0 ? (
          <EmptyState title="No draws yet" description="Draw results will appear here." className="py-12" />
        ) : (
          <>
            {/* Mobile: stacked cards (no horizontal scroll) */}
            <ul className="sm:hidden divide-y divide-neutral-100">
              {pageItems.map(d => {
                const myWin = d.winners.find(w => w.userId === userId);
                return (
                  <li key={d.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-800">{d.periodLabel}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {d.executedAt ? formatDate(d.executedAt) : '—'} · {d.winners.length} winners
                      </p>
                    </div>
                    {myWin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-700 shrink-0">
                        <Trophy className="h-3 w-3" /> Winner
                      </span>
                    ) : (
                      <span className="text-xs text-neutral-400 shrink-0">Not this time</span>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Desktop: full table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>{['Period', 'Date Executed', 'Total Winners', 'Your Status'].map(h => <th key={h} className="text-left text-xs font-semibold text-neutral-500 px-4 py-3">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {pageItems.map(d => {
                    const myWin = d.winners.find(w => w.userId === userId);
                    return (
                      <tr key={d.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4 font-medium text-neutral-800">{d.periodLabel}</td>
                        <td className="px-4 py-4 text-neutral-500">{d.executedAt ? formatDate(d.executedAt) : '—'}</td>
                        <td className="px-4 py-4 text-neutral-700">{d.winners.length} winners</td>
                        <td className="px-4 py-4">
                          {myWin ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-700">
                              <Trophy className="h-3 w-3" /> Winner
                            </span>
                          ) : (
                            <span className="text-neutral-400">Better luck next time</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination page={page} pageCount={pageCount} onPageChange={setPage} range={range} total={total} itemLabel="draws" />
          </>
        )}
      </Card>

      {/* ── This month's winners — auto-scrolling trust strip ─────────────── */}
      {latestWinners.length > 0 && (
        <WinnersMarquee
          periodLabel={latestDraw.periodLabel}
          winners={latestWinners}
        />
      )}
    </div>
  );
}

// Avatar background palette (deterministic per name).
const AVATAR_COLORS = [
  'from-brand-500 to-indigo-500',
  'from-accent-500 to-fuchsia-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-sky-500',
  'from-purple-500 to-brand-500',
];

interface MarqueeWinner {
  rank: number;
  name: string;
  prize?: Prize;
  isMe: boolean;
}

function WinnersMarquee({ periodLabel, winners }: { periodLabel: string; winners: MarqueeWinner[] }) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...winners, ...winners];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white p-5 sm:p-7">
      {/* soft glows */}
      <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-52 h-52 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-bold !text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-300" /> {periodLabel} Winners
            </h2>
            <p className="text-xs sm:text-sm text-white/70 mt-1">10 members won real prizes this month — stay active to be next.</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/70 shrink-0">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Verified draw
          </div>
        </div>

        {/* Auto-scrolling track (pauses on hover) */}
        <div className="marquee-group relative overflow-hidden">
          {/* edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-16 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

          <div className="flex gap-3 sm:gap-4 marquee-track">
            {loop.map((w, i) => (
              <WinnerCard key={i} winner={w} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WinnerCard({ winner, index }: { winner: MarqueeWinner; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const masked = maskName(winner.name);

  return (
    <div
      className={cn(
        'shrink-0 w-60 sm:w-64 rounded-2xl border p-4 transition-transform hover:-translate-y-1',
        winner.isMe
          ? 'bg-accent-600 border-accent-400/50 ring-1 ring-accent-400/40'
          : 'bg-slate-800 border-slate-700',
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('relative h-11 w-11 rounded-full bg-gradient-to-tr flex items-center justify-center font-bold text-white shrink-0', color)}>
          {initials(winner.name)}
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center ring-2 ring-slate-800">
            {winner.rank}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-white truncate flex items-center gap-1.5">
            {masked}
            {winner.isMe && <span className="text-[9px] font-bold uppercase bg-white text-accent-700 rounded px-1 py-0.5">You</span>}
          </p>
          <p className="text-[11px] !text-white/60">Rank #{winner.rank} winner</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-white/15 flex items-center gap-2">
        <span className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-amber-300" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold !text-white truncate">{winner.prize?.name ?? 'Prize'}</p>
          {winner.prize && <p className="text-[11px] font-mono text-emerald-300">{formatCurrency(winner.prize.value)}</p>}
        </div>
      </div>
    </div>
  );
}

// Privacy-friendly display: "Aditya Kumar" → "Aditya K."
function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
