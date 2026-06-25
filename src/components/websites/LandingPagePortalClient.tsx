'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { submitLandingPageLeadAction } from '@/lib/actions/website';

type LandingPageBlock = {
  id: string;
  type: 'HEADER' | 'VIDEO' | 'PROPERTY' | 'LEAD_CAPTURE' | 'LINKS' | 'SETTINGS';
  title?: string;
  subtitle?: string;
  videoUrl?: string;
  address?: string;
  price?: number;
  beds?: number;
  baths?: number;
  remarks?: string;
  ctaText?: string;
  links?: { label: string; href: string }[];
  // settings
  pageStyle?: string;
  leadSource?: string;
  leadType?: string;
  registrationTrigger?: string;
  browsingTime?: number;
  youtubeUrl?: string;
  customVideoUrl?: string;
  videoType?: 'YOUTUBE' | 'UPLOAD';
  image?: string;
};

export default function LandingPagePortalClient({
  pageTitle,
  blocksJson,
  workspaceId,
}: {
  pageTitle: string;
  blocksJson: string;
  workspaceId: string;
}) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGateOverlay, setShowGateOverlay] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'BUYER' | 'SELLER'>('BUYER');

  const blocks: LandingPageBlock[] = (() => {
    try {
      return blocksJson ? JSON.parse(blocksJson) : [];
    } catch {
      return [];
    }
  })();

  // Extract settings
  const settingsBlock = blocks.find(b => b.type === 'SETTINGS') || {
    pageStyle: 'With simple header, no footer',
    leadSource: 'Website',
    leadType: 'Buyer',
    registrationTrigger: 'Require registration based on Browsing Time',
    browsingTime: 8,
    youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    customVideoUrl: '',
    videoType: 'YOUTUBE',
  };

  // Implement registration trigger logic
  useEffect(() => {
    if (isSubmitted) return;

    if (settingsBlock.registrationTrigger === 'Require registration based on Browsing Time') {
      const delay = (settingsBlock.browsingTime || 8) * 1000;
      const timer = setTimeout(() => {
        setShowGateOverlay(true);
      }, delay);
      return () => clearTimeout(timer);
    } else if (settingsBlock.registrationTrigger === 'Require registration based on Page Views') {
      // Prompt gate on load
      const timer = setTimeout(() => {
        setShowGateOverlay(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [settingsBlock.registrationTrigger, settingsBlock.browsingTime, isSubmitted]);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !email) {
      toast.error('First Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitLandingPageLeadAction(workspaceId, pageTitle, {
        firstName,
        lastName,
        email,
        phone,
        type,
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Information submitted successfully! Thank you.');
        setIsSubmitted(true);
        setShowGateOverlay(false);
      }
    } catch {
      toast.error('Could not submit information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      
      {/* Visual Blocks Render */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {blocks.map((block) => {
          switch (block.type) {
            case 'HEADER':
              return (
                <div key={block.id} className="text-center space-y-4 py-8 border-b border-slate-900">
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    {block.title || 'Featured Property Showcase'}
                  </h1>
                  <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium">
                    {block.subtitle}
                  </p>
                </div>
              );

            case 'VIDEO':
              const isUploadVideo = settingsBlock.videoType === 'UPLOAD';
              const videoSrc = isUploadVideo ? (settingsBlock.customVideoUrl || block.videoUrl) : (settingsBlock.youtubeUrl || block.videoUrl);

              return (
                <div key={block.id} className="space-y-4">
                  {block.title && (
                    <h2 className="text-xl font-bold text-slate-200 text-center">
                      {block.title}
                    </h2>
                  )}
                  {videoSrc ? (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-900 shadow-2xl bg-black">
                      {isUploadVideo ? (
                        <video
                          src={videoSrc}
                          controls
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <iframe
                          src={videoSrc}
                          title="Virtual Tour Video"
                          className="absolute inset-0 w-full h-full"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        ></iframe>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-2xl border-2 border-dashed border-slate-800 flex items-center justify-center text-slate-500 italic text-sm">
                      No video source configured.
                    </div>
                  )}
                </div>
              );

            case 'PROPERTY':
              return (
                <div key={block.id} className="bg-slate-900/50 border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl backdrop-blur-sm">
                  {/* Property Photos Banner */}
                  {(block.image || block.image === '') && (
                    <div className="h-64 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                      <img
                        src={block.image || '/toscana_listing.png'}
                        alt="Property Main View"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                        Active MLS Sync
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-slate-100 mt-2">
                        {block.address || 'Address not configured'}
                      </h3>
                    </div>
                    {block.price && (
                      <p className="text-2xl md:text-3xl font-extrabold text-primary">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        }).format(block.price)}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                      <span className="block text-xl md:text-2xl font-bold text-slate-200">
                        {block.beds || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Beds</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                      <span className="block text-xl md:text-2xl font-bold text-slate-200">
                        {block.baths || 0}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Baths</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-900 p-3 rounded-xl">
                      <span className="block text-xl md:text-2xl font-bold text-slate-200">
                        ACTIVE
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">MLS Status</span>
                    </div>
                  </div>

                  {block.remarks && (
                    <p className="text-sm text-slate-400 leading-relaxed italic border-t border-slate-800/50 pt-4">
                      {block.remarks}
                    </p>
                  )}
                </div>
              );

            case 'LEAD_CAPTURE':
              return (
                <div key={block.id} className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-900 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg md:text-xl font-bold text-slate-200">
                      {block.ctaText || 'Connect with Our Agents'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Fill out the form below to receive exclusive marketing disclosures and guides.
                    </p>
                  </div>

                  {isSubmitted ? (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center space-y-3">
                      <span className="text-3xl block">🎉</span>
                      <p className="font-bold text-green-400">Thank You for Submitting!</p>
                      <p className="text-xs text-slate-400">An Excel Legacy seat associate will reach out shortly with property files.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitLead} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">First Name *</label>
                          <input
                            required
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Email Address *</label>
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase text-slate-400">My Main Goal</label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                        >
                          <option value="BUYER">I Want to Buy / Virtual Tour</option>
                          <option value="SELLER">I Want to List / Sell Property</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-all shadow-lg disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : 'Register to Connect'}
                      </button>
                    </form>
                  )}
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 text-center text-xs text-slate-600 bg-slate-950">
        © 2026 Excel Legacy Realty. All rights reserved. Equal Housing Opportunity.
      </footer>

      {/* Interactive Registration Gate Overlay */}
      {showGateOverlay && !isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl block">🔑</span>
              <h3 className="font-extrabold text-lg text-slate-100">Unlock Full Property Information</h3>
              <p className="text-xs text-slate-400 leading-tight">
                To continue viewing virtual tours, pricing disclosures, and remarks, please register.
              </p>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">First Name *</label>
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-slate-400">Email Address *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/95 transition-all shadow-lg"
              >
                {isSubmitting ? 'Registering...' : 'Register to Unlock Access'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowGateOverlay(false)}
                className="w-full py-2 text-[10px] text-slate-500 font-bold hover:text-slate-400"
              >
                Continue Browsing (Mock Preview Mode)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Assistant */}
      <div className="fixed bottom-6 right-6 z-40 space-y-2 max-w-[280px]">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-2xl space-y-1 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-bold">
              Personal Assistant
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
          </div>
          <p className="text-[11px] text-slate-200 leading-tight">
            Hey there! I&apos;m Lynn, your personal assistant. Reach out if you have any questions or want to schedule a walkthrough tour!
          </p>
        </div>
        <div className="flex justify-end">
          <div className="w-12 h-12 rounded-full bg-primary border-2 border-slate-800 shadow-2xl flex items-center justify-center font-bold text-xl text-primary-foreground">
            👩‍💼
          </div>
        </div>
      </div>

    </div>
  );
}
