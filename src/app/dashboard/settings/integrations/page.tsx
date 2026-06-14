'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function IntegrationsSettingsPage() {
  // MyPlusLeads States
  const [myplusApiKey, setMyplusApiKey] = useState('');
  const [myplusAutoPoll, setMyplusAutoPoll] = useState(false);

  // Profile Links States
  const [zillowProfile, setZillowProfile] = useState('');
  const [realtorProfile, setRealtorProfile] = useState('');
  const [homesProfile, setHomesProfile] = useState('');

  // Webhook Urls
  const [webhookBase, setWebhookBase] = useState('http://localhost:3000');

  useEffect(() => {
    // Determine host on client side
    if (typeof window !== 'undefined') {
      setWebhookBase(window.location.origin);
      
      // Load saved mock settings
      setMyplusApiKey(localStorage.getItem('myplus_api_key') || '');
      setMyplusAutoPoll(localStorage.getItem('myplus_auto_poll') === 'true');
      setZillowProfile(localStorage.getItem('zillow_profile_url') || 'https://www.zillow.com/profile/agent-john-smith');
      setRealtorProfile(localStorage.getItem('realtor_profile_url') || 'https://www.realtor.com/realestateagents/john-smith');
      setHomesProfile(localStorage.getItem('homes_profile_url') || 'https://www.homes.com/agent/john-smith');
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('myplus_api_key', myplusApiKey);
    localStorage.setItem('myplus_auto_poll', String(myplusAutoPoll));
    localStorage.setItem('zillow_profile_url', zillowProfile);
    localStorage.setItem('realtor_profile_url', realtorProfile);
    localStorage.setItem('homes_profile_url', homesProfile);
    
    toast.success('Integration settings and agent profiles saved successfully!');
  };

  const handleTestIngest = async (provider: string) => {
    const loadingToast = toast.loading(`Sending test lead from ${provider.toUpperCase()}...`);

    let payload = {};
    if (provider === 'zillow') {
      payload = {
        contact: {
          name: 'Sarah Connor',
          email: 'sarah.connor@cyberdyne.com',
          phone: '(555) 0199-231',
        },
        property: {
          address: '742 Evergreen Terrace, Macomb MI',
        },
        message: 'Looking to schedule a showing for tomorrow afternoon.',
      };
    } else if (provider === 'realtor') {
      payload = {
        lead: {
          contact: {
            fullName: 'Marcus Wright',
            email: 'marcus.wright@skynet.net',
            phone: '313-555-0182',
          },
          inquiryDetails: 'Interested in selling my property. Need an inspection evaluation CMA.',
        },
      };
    } else if (provider === 'homes') {
      payload = {
        contact: {
          name: 'John Connor',
          email: 'john.connor@resistance.net',
          phone: '(248) 555-0150',
        },
        message: 'Moving to Detroit in 30 days. Need a buyer agent for historic homes.',
      };
    } else if (provider === 'myplus') {
      payload = {
        firstName: 'Kyle',
        lastName: 'Reese',
        email: 'kyle.reese@resistance.org',
        phone: '586-555-0144',
        address: '1800 Skynet Blvd, Shelby Twp MI',
        notes: 'Pre-foreclosure filing found in Legal News records.',
      };
    }

    try {
      const res = await fetch(`/api/leads/webhooks/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      toast.dismiss(loadingToast);

      if (res.ok && data.leadId) {
        toast.success(`Test lead successfully ingested! Lead ID: ${data.leadId}`);
      } else {
        toast.error('Test ingestion failed.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error during test ingestion.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Integrations & Lead Sources</h1>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">
            Automations
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Connect MyPlusLeads and link your real estate portal profiles to automatically intake leads.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Profile Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Agent Profiles Section */}
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base border-b border-border/60 pb-2 flex items-center gap-2">
              👤 Agent Portal Profiles
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Zillow Agent Profile URL</label>
                <input
                  type="text"
                  value={zillowProfile}
                  onChange={(e) => setZillowProfile(e.target.value)}
                  placeholder="https://www.zillow.com/profile/agent-name"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Realtor.com Agent Profile URL</label>
                <input
                  type="text"
                  value={realtorProfile}
                  onChange={(e) => setRealtorProfile(e.target.value)}
                  placeholder="https://www.realtor.com/realestateagents/agent-name"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">Homes.com Agent Profile URL</label>
                <input
                  type="text"
                  value={homesProfile}
                  onChange={(e) => setHomesProfile(e.target.value)}
                  placeholder="https://www.homes.com/agent/agent-name"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* MyPlusLeads Settings */}
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base border-b border-border/60 pb-2 flex items-center gap-2">
              ⚡ MyPlusLeads.com Direct API
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase text-[10px]">MyPlusLeads API Token</label>
                <input
                  type="password"
                  value={myplusApiKey}
                  onChange={(e) => setMyplusApiKey(e.target.value)}
                  placeholder="Paste your MyPlusLeads API key here"
                  className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <label className="flex items-start gap-2 text-xs cursor-pointer select-none pt-2">
                <input
                  type="checkbox"
                  checked={myplusAutoPoll}
                  onChange={(e) => setMyplusAutoPoll(e.target.checked)}
                  className="mt-1 rounded"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">Enable Automatic Background Polling</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    Automatically checks MyPlusLeads every 15 minutes for new foreclosure postings.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
            >
              Save Integration Profiles
            </button>
          </div>
        </div>

        {/* Right Side: Generated Webhooks list */}
        <div className="space-y-6">
          <div className="bg-background border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base border-b border-border/60 pb-2">
              🔗 Webhook Ingestion URLs
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Copy these webhook URLs and paste them into your provider account settings (Tech Connect / Webhook / Integrations) to send leads to this CRM automatically.
            </p>

            <div className="space-y-4 text-xs">
              {[
                ['zillow', 'Zillow Tech Connect'],
                ['realtor', 'Realtor.com Webhook'],
                ['homes', 'Homes.com API Webhook'],
                ['myplus', 'MyPlusLeads Webhook'],
              ].map(([provider, title]) => {
                const url = `${webhookBase}/api/leads/webhooks/${provider}`;
                return (
                  <div key={provider} className="space-y-1.5 border-t border-border/40 pt-3 first:border-0 first:pt-0">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-foreground">{title}</span>
                      <button
                        onClick={() => handleTestIngest(provider)}
                        className="text-[9px] font-black uppercase text-primary hover:underline"
                      >
                        Send Test
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        readOnly
                        value={url}
                        className="w-full bg-muted/20 border border-border rounded px-2 py-1 text-[10px] font-mono pr-8 select-all"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(url);
                          toast.success(`${title} Webhook copied!`);
                        }}
                        className="absolute right-2 top-1.5 text-muted-foreground hover:text-foreground text-[10px]"
                        title="Copy to clipboard"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
