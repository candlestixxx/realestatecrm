'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  email: string | null;
  phone: string | null;
  type: string;
  licenseNumber: string | null;
  isActive: boolean;
  referrals: { id: string; type: string; status: string }[];
  permissions: { canViewLeads: boolean; canViewDeals: boolean; canViewContacts: boolean; canCreateReferral: boolean; canEditReferral: boolean }[];
}

const TYPE_COLORS: Record<string, string> = {
  MORTGAGE: 'bg-blue-100 text-blue-800',
  TITLE: 'bg-purple-100 text-purple-800',
  INSURANCE: 'bg-green-100 text-green-800',
  INSPECTION: 'bg-yellow-100 text-yellow-800',
  LEGAL: 'bg-red-100 text-red-800',
};

const REFERRAL_STATUS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showReferralForm, setShowReferralForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const [partnerForm, setPartnerForm] = useState({
    companyName: '', contactName: '', email: '', phone: '',
    type: 'MORTGAGE', licenseNumber: '', website: '', notes: '',
  });

  const [referralForm, setReferralForm] = useState({
    type: 'SENT', partnerId: '', leadId: '', dealId: '', commissionRate: '', notes: '',
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params = withWorkspace({  });
      if (filterType) params.set('type', filterType);
      const res = await fetch('/api/partners?' + params);
      setPartners(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filterType]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const submitPartner = async () => {
    try {
      await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...partnerForm, workspaceId: getClientWorkspaceSlug() }),
      });
      setShowAddForm(false);
      setPartnerForm({ companyName: '', contactName: '', email: '', phone: '', type: 'MORTGAGE', licenseNumber: '', website: '', notes: '' });
      fetchPartners();
    } catch (e) { console.error(e); }
  };

  const submitReferral = async () => {
    try {
      await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...referralForm,
          commissionRate: referralForm.commissionRate ? parseFloat(referralForm.commissionRate) : null,
          workspaceId: getClientWorkspaceSlug(),
        }),
      });
      setShowReferralForm(false);
      fetchPartners();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Partner Network</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowReferralForm(true)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">+ Referral</button>
          <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Partner</button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 mb-6">
        {['', 'MORTGAGE', 'TITLE', 'INSURANCE', 'INSPECTION', 'LEGAL'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={'px-3 py-1.5 rounded-full text-sm ' + (filterType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {/* Partner Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading partners...</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No partners found. Add your first partner to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(p => (
            <div key={p.id} onClick={() => setSelectedPartner(p)} className="bg-white rounded-lg border p-5 hover:shadow-md cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (TYPE_COLORS[p.type] || 'bg-gray-100')}>{p.type}</span>
                <span className="text-xs text-gray-400">{p.referrals.length} referrals</span>
              </div>
              <h3 className="font-semibold text-gray-900">{p.companyName}</h3>
              <p className="text-sm text-gray-600">{p.contactName}</p>
              {p.email && <p className="text-sm text-gray-500">{p.email}</p>}
              {p.phone && <p className="text-sm text-gray-500">{p.phone}</p>}
              {p.licenseNumber && <p className="text-xs text-gray-400 mt-1">License: {p.licenseNumber}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Partner Detail Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPartner(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selectedPartner.companyName}</h2>
              <button onClick={() => setSelectedPartner(null)} className="text-gray-400 hover:text-gray-600">X</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><span className="text-sm text-gray-500">Contact</span><div>{selectedPartner.contactName}</div></div>
              <div><span className="text-sm text-gray-500">Type</span><div><span className={'px-2 py-1 rounded-full text-xs ' + (TYPE_COLORS[selectedPartner.type] || '')}>{selectedPartner.type}</span></div></div>
              <div><span className="text-sm text-gray-500">Email</span><div>{selectedPartner.email || '—'}</div></div>
              <div><span className="text-sm text-gray-500">Phone</span><div>{selectedPartner.phone || '—'}</div></div>
            </div>

            {/* Permissions */}
            {selectedPartner.permissions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Partner Permissions</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedPartner.permissions[0]).filter(([k]) => k.startsWith('can')).map(([k, v]) => (
                    <span key={k} className={'px-2 py-1 rounded text-xs ' + (v ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500')}>
                      {k.replace('can', '').replace(/([A-Z])/g, ' $1').trim()} {v ? 'Yes' : 'No'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Referrals */}
            <div>
              <h3 className="font-semibold mb-2">Referrals ({selectedPartner.referrals.length})</h3>
              {selectedPartner.referrals.length === 0 ? (
                <p className="text-sm text-gray-500">No referrals yet.</p>
              ) : (
                selectedPartner.referrals.map(r => (
                  <div key={r.id} className="flex items-center justify-between border rounded p-2 mb-1">
                    <span className="text-sm">{r.type}</span>
                    <span className={'px-2 py-1 rounded text-xs ' + (REFERRAL_STATUS[r.status] || 'bg-gray-100')}>{r.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Add Partner</h2>
            <div className="space-y-3">
              <input placeholder="Company Name" value={partnerForm.companyName} onChange={e => setPartnerForm(p => ({ ...p, companyName: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Contact Name" value={partnerForm.contactName} onChange={e => setPartnerForm(p => ({ ...p, contactName: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Email" type="email" value={partnerForm.email} onChange={e => setPartnerForm(p => ({ ...p, email: e.target.value }))} className="border rounded px-3 py-2" />
                <input placeholder="Phone" value={partnerForm.phone} onChange={e => setPartnerForm(p => ({ ...p, phone: e.target.value }))} className="border rounded px-3 py-2" />
              </div>
              <select value={partnerForm.type} onChange={e => setPartnerForm(p => ({ ...p, type: e.target.value }))} className="w-full border rounded px-3 py-2">
                {['MORTGAGE', 'TITLE', 'INSURANCE', 'INSPECTION', 'LEGAL'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input placeholder="License Number" value={partnerForm.licenseNumber} onChange={e => setPartnerForm(p => ({ ...p, licenseNumber: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Website" value={partnerForm.website} onChange={e => setPartnerForm(p => ({ ...p, website: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <textarea placeholder="Notes" value={partnerForm.notes} onChange={e => setPartnerForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
              <button onClick={submitPartner} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Partner</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Referral Modal */}
      {showReferralForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReferralForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create Referral</h2>
            <div className="space-y-3">
              <select value={referralForm.type} onChange={e => setReferralForm(p => ({ ...p, type: e.target.value }))} className="w-full border rounded px-3 py-2">
                <option value="SENT">Send to Partner</option>
                <option value="RECEIVED">Received from Partner</option>
              </select>
              <select value={referralForm.partnerId} onChange={e => setReferralForm(p => ({ ...p, partnerId: e.target.value }))} className="w-full border rounded px-3 py-2">
                <option value="">Select Partner</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.companyName}</option>)}
              </select>
              <input placeholder="Lead ID (optional)" value={referralForm.leadId} onChange={e => setReferralForm(p => ({ ...p, leadId: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <input placeholder="Commission Rate %" type="number" value={referralForm.commissionRate} onChange={e => setReferralForm(p => ({ ...p, commissionRate: e.target.value }))} className="w-full border rounded px-3 py-2" />
              <textarea placeholder="Notes" value={referralForm.notes} onChange={e => setReferralForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowReferralForm(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
              <button onClick={submitReferral} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create Referral</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
