'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes: Record<string, { from: any; to: any }> | null;
  ip: string;
  timestamp: string;
  user: { name: string | null; email: string } | null;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const fetchAudit = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId: 'excel-legacy-team', pageSize: '100' });
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entityType', filterEntity);
      const res = await fetch('/api/audit?' + params);
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterAction, filterEntity]);

  useEffect(() => { fetchAudit(); }, [fetchAudit]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Audit Trail</h1>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Entities</option>
          <option value="lead">Leads</option>
          <option value="contact">Contacts</option>
          <option value="deal">Deals</option>
          <option value="listing">Listings</option>
          <option value="offer">Offers</option>
        </select>
      </div>

      {/* Audit Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading audit trail...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No audit entries found.</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Changes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(e.timestamp).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (ACTION_COLORS[e.action] || 'bg-gray-100')}>{e.action}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{e.entityType}</div>
                    <div className="text-gray-500 text-xs">{e.entityId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {e.changes ? (
                      <div className="space-y-1">
                        {Object.entries(e.changes).map(([field, change]) => (
                          <div key={field} className="text-xs">
                            <span className="font-medium">{field}</span>: {String(change.from)} {'->'} {String(change.to)}
                          </div>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{e.user?.name || e.user?.email || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
