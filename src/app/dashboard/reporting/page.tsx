'use client';

/**
 * Consolidated reporting surface.
 *
 * Why: reporting and analytics were separate routes showing the same data
 * with different visualizations. This page tabs both views — Overview
 * (detailed bar charts) and Quick Stats (compact summary cards) — onto
 * one surface. The /dashboard/reporting/analytics route redirects here.
 */

import React, { useState, useEffect } from 'react';
import { getClientWorkspaceSlug } from '@/lib/workspace-client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ReportData {
  leads: { total: number; byStatus: { status: string; _count: number }[] };
  deals: { total: number; byStage: { stage: string; _count: number; _sum: { value: number | null } }[]; totalValue: number };
  contacts: { total: number };
  listings: { total: number; byStatus: { status: string; _count: number; _sum: { listPrice: number | null } }[] };
  partners: { total: number; referralsByStatus: { status: string; _count: number }[] };
  recentActivity: { id: string; type: string; content: string; createdAt: string; user: { name: string | null } | null }[];
}

const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

function InfoBadge({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] font-bold text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          i
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-xs leading-relaxed">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function BarList({ title, items, tooltip, valueFormat }: {
  title: string;
  items: { key: string; count: number; value?: number | null }[];
  tooltip: string;
  valueFormat?: (v: number | null | undefined) => string;
}) {
  const max = Math.max(...items.map(x => x.count), 1);
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <InfoBadge text={tooltip} />
      </div>
      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-600">{s.key.replace('_', ' ')}</div>
            <div className="flex-1 bg-gray-100 rounded-full h-6">
              <div
                className="rounded-full h-6 flex items-center px-2 text-xs text-white"
                style={{ width: Math.max((s.count / max) * 100, 8) + '%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              >
                {s.count}
              </div>
            </div>
            {valueFormat && (
              <div className="w-20 text-sm text-gray-500 text-right">{valueFormat(s.value)}</div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">No data yet.</p>}
      </div>
    </div>
  );
}

export default function ReportingPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'stats'>('overview');

  useEffect(() => {
    fetch('/api/reporting?workspaceId=' + getClientWorkspaceSlug())
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading reports...</div>;
  if (!data) return <div className="p-6 text-center text-gray-500">Failed to load reports.</div>;

  const money = (v: number | null | undefined) => v ? '$' + (v / 1000).toFixed(0) + 'k' : '--';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              All business metrics in one place. Hover the{' '}
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] font-bold align-middle">
                i
              </span>{' '}
              badges for guidance.
            </p>
          </div>
          <div className="flex gap-2">
            {([
              { id: 'overview' as const, label: 'Overview' },
              { id: 'stats' as const, label: 'Quick Stats' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-colors ' +
                  (tab === t.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border text-gray-600 hover:bg-gray-50')
                }
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/export', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      type: 'reporting',
                      format: 'csv',
                      data: data.summary ? [data.summary] : [],
                      filename: 'reporting-export',
                    }),
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'reporting-export.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }
                } catch { /* export failed */ }
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {tab === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Leads', value: data.leads.total, color: 'bg-blue-500', tip: 'All leads across all statuses.' },
                { label: 'Total Deals', value: data.deals.total, color: 'bg-green-500', tip: 'Active and closed deals.' },
                { label: 'Deal Value', value: '$' + data.deals.totalValue.toLocaleString(), color: 'bg-purple-500', tip: 'Combined value across all deal stages.' },
                { label: 'Listings', value: data.listings.total, color: 'bg-yellow-500', tip: 'MLS listings tracked.' },
                { label: 'Partners', value: data.partners.total, color: 'bg-red-500', tip: 'Mortgage/title/insurance partners.' },
              ].map(card => (
                <div key={card.label} className="bg-white rounded-lg border p-4">
                  <div className={'w-10 h-10 rounded-lg flex items-center justify-center text-white mb-2 ' + card.color}>
                    <span className="text-lg font-bold">{card.label[0]}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm text-gray-500">{card.label}</div>
                    <InfoBadge text={card.tip} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <BarList
                title="Leads by Status"
                items={data.leads.byStatus.map(s => ({ key: s.status, count: s._count }))}
                tooltip="Distribution of leads across pipeline statuses. A large pile in one status suggests a bottleneck."
              />
              <BarList
                title="Deals by Stage"
                items={data.deals.byStage.map(s => ({ key: s.stage, count: s._count, value: s._sum.value }))}
                tooltip="Deal count and total value per pipeline stage. Value bars show the money in play at each step."
                valueFormat={money}
              />
              <BarList
                title="Listings by Status"
                items={data.listings.byStatus.map(s => ({ key: s.status, count: s._count, value: s._sum.listPrice }))}
                tooltip="Listings grouped by status (active, pending, sold). Total list price shown per status."
                valueFormat={money}
              />
              <BarList
                title="Referrals by Status"
                items={data.partners.referralsByStatus.map(s => ({ key: s.status, count: s._count }))}
                tooltip="Partner referral pipeline. Tracks referrals from mortgage/title/insurance partners."
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">Recent Activity</h2>
                <InfoBadge text="Latest mutations across all entities. Audit trail provides the full immutable log." />
              </div>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity.</p>
              ) : (
                <div className="space-y-3">
                  {data.recentActivity.map(a => (
                    <div key={a.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{a.type}</div>
                        <div className="text-sm text-gray-500">{a.content}</div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {a.user?.name || 'System'} &middot; {new Date(a.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'stats' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              {[
                { label: 'Total Leads', value: data.leads.total, color: 'bg-blue-500' },
                { label: 'Total Deals', value: data.deals.total, color: 'bg-green-500' },
                { label: 'Deal Value', value: '$' + data.deals.totalValue.toLocaleString(), color: 'bg-purple-500' },
                { label: 'Contacts', value: data.contacts.total, color: 'bg-yellow-500' },
                { label: 'Listings', value: data.listings.total, color: 'bg-indigo-500' },
                { label: 'Partners', value: data.partners.total, color: 'bg-pink-500' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-lg shadow border p-4">
                  <div className={'w-8 h-1 rounded ' + c.color + ' mb-2'} />
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-xl font-bold text-gray-900">{c.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Leads by Status</h3>
                {data.leads.byStatus.map(s => (
                  <div key={s.status} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm text-gray-600">{s.status}</span>
                    <span className="text-sm font-medium">{s._count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg shadow border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Deals by Stage</h3>
                {data.deals.byStage.map(s => (
                  <div key={s.stage} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm text-gray-600">{s.stage}</span>
                    <span className="text-sm font-medium">
                      {s._count} &middot; ${s._sum.value?.toLocaleString() || 0}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-lg shadow border p-4 lg:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
                {data.recentActivity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 shrink-0">{a.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{a.content}</p>
                      <p className="text-xs text-gray-400">
                        {a.user?.name || 'System'} &middot; {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {data.recentActivity.length === 0 && (
                  <p className="text-sm text-gray-400">No recent activity.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
