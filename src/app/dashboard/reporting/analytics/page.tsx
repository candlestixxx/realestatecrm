'use client';

import React, { useState, useEffect } from 'react';

interface ReportData {
  leads: { total: number; byStatus: { status: string; _count: number }[] };
  deals: { total: number; totalValue: number; byStage: { stage: string; _count: number; _sum: { value: number | null } }[] };
  contacts: { total: number };
  listings: { total: number; byStatus: { status: string; _count: number }[] };
  partners: { total: number; referralsByStatus: { status: string; _count: number }[] };
  recentActivity: { id: string; type: string; content: string; createdAt: string; user: { name: string | null } | null }[];
}

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

  if (loading) return <div className="p-6 text-gray-400">Loading reports...</div>;
  if (!data) return <div className="p-6 text-red-500">Failed to load reports</div>;

  const cards = [
    { label: 'Total Leads', value: data.leads.total, color: 'bg-blue-500' },
    { label: 'Total Deals', value: data.deals.total, color: 'bg-green-500' },
    { label: 'Deal Value', value: `$${data.deals.totalValue.toLocaleString()}`, color: 'bg-purple-500' },
    { label: 'Contacts', value: data.contacts.total, color: 'bg-yellow-500' },
    { label: 'Listings', value: data.listings.total, color: 'bg-indigo-500' },
    { label: 'Partners', value: data.partners.total, color: 'bg-pink-500' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports &amp; Analytics</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-lg shadow border p-4">
            <div className={`w-8 h-1 rounded ${c.color} mb-2`} />
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by Status */}
        <div className="bg-white rounded-lg shadow border p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Leads by Status</h3>
          {data.leads.byStatus.map(s => (
            <div key={s.status} className="flex items-center justify-between py-1.5 border-b last:border-0">
              <span className="text-sm text-gray-600">{s.status}</span>
              <span className="text-sm font-medium">{s._count}</span>
            </div>
          ))}
        </div>

        {/* Deals by Stage */}
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

        {/* Recent Activity */}
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
    </div>
  );
}
