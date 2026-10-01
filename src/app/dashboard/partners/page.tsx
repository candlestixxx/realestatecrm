'use client';

import React, { useState, useEffect } from 'react';

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  type: string;
  licenseNumber: string | null;
  isActive: boolean;
  referrals: any[];
  permissions: any[];
}

const TYPE_COLORS: Record<string, string> = {
  MORTGAGE: 'bg-blue-100 text-blue-800',
  TITLE: 'bg-purple-100 text-purple-800',
  INSURANCE: 'bg-green-100 text-green-800',
  INSPECTION: 'bg-yellow-100 text-yellow-800',
  LEGAL: 'bg-red-100 text-red-800',
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', type: 'MORTGAGE', licenseNumber: '', workspaceId: 'excel-legacy-team' });

  useEffect(() => {
    fetch('/api/partners?workspaceId=excel-legacy-team')
      .then(r => r.json())
      .then(setPartners)
      .catch(console.error);
  }, []);

  const handleAdd = async () => {
    const res = await fetch('/api/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const partner = await res.json();
      setPartners(prev => [...prev, { ...partner, referrals: [], permissions: [] }]);
      setShowAdd(false);
      setForm({ companyName: '', contactName: '', email: '', phone: '', type: 'MORTGAGE', licenseNumber: '', workspaceId: 'excel-legacy-team' });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Network</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
          + Add Partner
        </button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <h3 className="font-semibold mb-3">New Partner</h3>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Company Name" value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Contact Name" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="border rounded px-3 py-2 text-sm" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="border rounded px-3 py-2 text-sm">
              <option value="MORTGAGE">Mortgage</option>
              <option value="TITLE">Title</option>
              <option value="INSURANCE">Insurance</option>
              <option value="INSPECTION">Inspection</option>
              <option value="LEGAL">Legal</option>
            </select>
            <input placeholder="License #" value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})} className="border rounded px-3 py-2 text-sm" />
          </div>
          <button onClick={handleAdd} className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">Save Partner</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map(p => (
          <div key={p.id} className="bg-white rounded-lg shadow border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.type] || 'bg-gray-100'}`}>{p.type}</span>
              <span className="text-xs text-gray-400">{p.referrals?.length || 0} referrals</span>
            </div>
            <h3 className="font-semibold text-gray-900">{p.companyName}</h3>
            <p className="text-sm text-gray-600">{p.contactName}</p>
            {p.email && <p className="text-xs text-gray-500 mt-1">{p.email}</p>}
            {p.phone && <p className="text-xs text-gray-500">{p.phone}</p>}
            {p.licenseNumber && <p className="text-xs text-gray-400 mt-1">License: {p.licenseNumber}</p>}
          </div>
        ))}
        {partners.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400">
            <p>No partners yet. Add your first mortgage, title, or insurance partner.</p>
          </div>
        )}
      </div>
    </div>
  );
}
