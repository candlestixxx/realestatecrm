'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function AgentProfileModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'billing'>('profile');
  const [profile, setProfile] = useState({
    name: 'Excel Legacy Realty Team',
    email: 'hankrealtyexec@gmail.com',
    phone: '586-555-0210',
    title: 'Principal Broker / Owner',
    license: 'MI-650201099',
  });
  const [company, setCompany] = useState({
    companyName: 'Excel Legacy Realty',
    address: '123 Cyberdyne Way, Sterling Heights, MI 48310',
    website: 'https://excellegacyrealty.com',
    taxId: 'XX-XXXXXXX',
  });
  const [billing, setBilling] = useState({
    plan: 'Premium Growth Seat',
    price: '$299/mo',
    cardNumber: '•••• •••• •••• 4242',
    expiry: '12/28',
    status: 'Active',
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem('agent_profile');
    const savedCompany = localStorage.getItem('agent_company');
    const savedBilling = localStorage.getItem('agent_billing');

    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedCompany) setCompany(JSON.parse(savedCompany));
    if (savedBilling) setBilling(JSON.parse(savedBilling));
  }, []);

  const handleSave = () => {
    localStorage.setItem('agent_profile', JSON.stringify(profile));
    localStorage.setItem('agent_company', JSON.stringify(company));
    localStorage.setItem('agent_billing', JSON.stringify(billing));
    toast.success('Agent setup saved successfully!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h3 className="text-lg font-bold text-foreground">Lofty Agent & Company Setup</h3>
            <p className="text-xs text-muted-foreground">Manage your credentials, branding, and billing center info.</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border bg-muted/10 px-4">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            👤 Agent Profile
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'company'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🏢 Company Profile
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'billing'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            💳 Billing Center
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Title / Role</label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">License Number</label>
                <input
                  type="text"
                  value={profile.license}
                  onChange={(e) => setProfile({ ...profile, license: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Brokerage Name</label>
                  <input
                    type="text"
                    value={company.companyName}
                    onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Brokerage Website</label>
                  <input
                    type="text"
                    value={company.website}
                    onChange={(e) => setCompany({ ...company, website: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Office Address</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company Tax ID (EIN)</label>
                <input
                  type="text"
                  value={company.taxId}
                  onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                  className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-border flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase block">Subscription Plan</span>
                  <span className="font-semibold text-foreground text-sm">{billing.plan}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-muted-foreground uppercase block">Monthly Pricing</span>
                  <span className="font-bold text-primary text-sm">{billing.price}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Payment Method</label>
                  <input
                    type="text"
                    value={billing.cardNumber}
                    onChange={(e) => setBilling({ ...billing, cardNumber: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={billing.expiry}
                    onChange={(e) => setBilling({ ...billing, expiry: e.target.value })}
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Simulated Billing Settings</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBilling({ ...billing, plan: 'Enterprise Package Upgrade', price: '$899/mo' })}
                    className="px-3 py-1.5 border border-primary/30 hover:border-primary text-[10px] font-bold uppercase rounded-lg text-primary transition-all"
                  >
                    Upgrade to Enterprise
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling({ ...billing, plan: 'Premium Growth Seat', price: '$299/mo' })}
                    className="px-3 py-1.5 border border-border hover:border-foreground text-[10px] font-bold uppercase rounded-lg text-muted-foreground hover:text-foreground transition-all"
                  >
                    Reset to Premium Plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-muted text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold rounded-lg transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
