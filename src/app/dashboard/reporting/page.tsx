'use client';

import React, { useState, useEffect } from 'react';

interface ReportData {
  leads: { total: number; byStatus: { status: string; _count: number }[] };
  deals: { total: number; byStage: { stage: string; _count: number; _sum: { value: number | null } }[]; totalValue: number };
  contacts: { total: number };
  listings: { total: number; byStatus: { status: string; _count: number; _sum: { listPrice: number | null } }[] };
  partners: { total: number; referralsByStatus: { status: string; _count: number }[] };
  recentActivity: { id: string; type: string; content: string; createdAt: string; user: { name: string | null } | null }[];
}

const BAR_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ReportingPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reporting?workspaceId=excel-legacy-team')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading reports...</div>;
  if (!data) return <div className="p-6 text-center text-gray-500">Failed to load reports.</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports & Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: data.leads.total, color: 'bg-blue-500' },
          { label: 'Total Deals', value: data.deals.total, color: 'bg-green-500' },
          { label: 'Deal Value', value: '$' + data.deals.totalValue.toLocaleString(), color: 'bg-purple-500' },
          { label: 'Listings', value: data.listings.total, color: 'bg-yellow-500' },
          { label: 'Partners', value: data.partners.total, color: 'bg-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-lg border p-4">
            <div className={'w-10 h-10 rounded-lg flex items-center justify-center text-white mb-2 ' + card.color}>
              <span className="text-lg font-bold">{card.label[0]}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Leads by Status */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Leads by Status</h2>
          <div className="space-y-3">
            {data.leads.byStatus.map((s, i) => {
              const max = Math.max(...data.leads.byStatus.map(x => x._count));
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{s.status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div className="rounded-full h-6 flex items-center px-2 text-xs text-white" style={{ width: Math.max((s._count / max) * 100, 8) + '%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                      {s._count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deals by Stage */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Deals by Stage</h2>
          <div className="space-y-3">
            {data.deals.byStage.map((s, i) => {
              const max = Math.max(...data.deals.byStage.map(x => x._count));
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{s.stage.replace('_', ' ')}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div className="rounded-full h-6 flex items-center px-2 text-xs text-white" style={{ width: Math.max((s._count / max) * 100, 8) + '%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                      {s._count}
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-500 text-right">
                    {s._sum.value ? '$' + (s._sum.value / 1000).toFixed(0) + 'k' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Listings by Status */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Listings by Status</h2>
          <div className="space-y-3">
            {data.listings.byStatus.map((s, i) => {
              const max = Math.max(...data.listings.byStatus.map(x => x._count));
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{s.status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div className="rounded-full h-6 flex items-center px-2 text-xs text-white" style={{ width: Math.max((s._count / max) * 100, 8) + '%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                      {s._count}
                    </div>
                  </div>
                  <div className="w-20 text-sm text-gray-500 text-right">
                    {s._sum.listPrice ? '$' + (s._sum.listPrice / 1000).toFixed(0) + 'k' : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referrals by Status */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Referrals by Status</h2>
          <div className="space-y-3">
            {data.partners.referralsByStatus.map((s, i) => {
              const max = Math.max(...data.partners.referralsByStatus.map(x => x._count));
              return (
                <div key={s.status} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-gray-600">{s.status}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div className="rounded-full h-6 flex items-center px-2 text-xs text-white" style={{ width: Math.max((s._count / max) * 100, 8) + '%', backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}>
                      {s._count}
                    </div>
                  </div>
                </div>
              );
            })}
            {data.partners.referralsByStatus.length === 0 && <p className="text-sm text-gray-500">No referrals yet.</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
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
                <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
