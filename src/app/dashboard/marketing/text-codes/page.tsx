'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Plus, Search, Trash2, Edit3, Globe, Copy, Check, Info, Settings, ToggleLeft, ToggleRight
} from 'lucide-react';

type TextCode = {
  id: string;
  keyword: string;
  phoneNumber: string;
  listingAddress: string;
  responseMessage: string;
  status: 'ACTIVE' | 'PAUSED';
  leadsCaptured: number;
  createdAt: string;
};

const INITIAL_CODES: TextCode[] = [
  {
    id: '1',
    keyword: '8485SHERMAN',
    phoneNumber: '(586) 555-0190',
    listingAddress: '8485 Sherman Ave, Warren, MI 48089',
    responseMessage: 'Thanks for inquiring about 8485 Sherman Ave! View full photos, video walk-throughs & price history here: http://localhost:3000/portal/site/8485-sherman-ave',
    status: 'ACTIVE',
    leadsCaptured: 14,
    createdAt: '2026-07-08',
  },
  {
    id: '2',
    keyword: '615WILLARD',
    phoneNumber: '(586) 555-0190',
    listingAddress: '615 Willard Ave, Warren, MI 48089',
    responseMessage: 'Welcome to 615 Willard! This beautiful property is back on the market. View listing: http://localhost:3000/portal/site/615-willard-ave-copy-122',
    status: 'ACTIVE',
    leadsCaptured: 8,
    createdAt: '2026-07-08',
  },
  {
    id: '3',
    keyword: 'VIPBUYER',
    phoneNumber: '(586) 555-0122',
    listingAddress: 'General Buyer Capture Pool',
    responseMessage: 'Want access to hot pocket listings in Macomb and Wayne county? Get our daily MLS sheet: http://localhost:3000/portal/site/vip-buyer-list',
    status: 'PAUSED',
    leadsCaptured: 29,
    createdAt: '2026-07-05',
  }
];

export default function TextCodesPage() {
  const [codes, setCodes] = useState<TextCode[]>(INITIAL_CODES);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Code Form State
  const [keyword, setKeyword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('(586) 555-0190');
  const [listingAddress, setListingAddress] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Text instructions copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !responseMessage.trim()) {
      toast.error('Keyword and Response Message are required.');
      return;
    }

    const newCode: TextCode = {
      id: String(Date.now()),
      keyword: keyword.toUpperCase().replace(/\s+/g, ''),
      phoneNumber,
      listingAddress: listingAddress || 'General Lead Pool',
      responseMessage,
      status: 'ACTIVE',
      leadsCaptured: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCodes([newCode, ...codes]);
    setShowCreateModal(false);
    // Reset Form
    setKeyword('');
    setListingAddress('');
    setResponseMessage('');
    toast.success('SMS Text Code rider created successfully!');
  };

  const toggleStatus = (id: string) => {
    setCodes(codes.map(c => c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : c));
    toast.success('Text code status updated.');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this SMS text code?')) return;
    setCodes(codes.filter(c => c.id !== id));
    toast.success('Text code deleted.');
  };

  const filteredCodes = codes.filter(c => 
    c.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.listingAddress.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            💬 SMS Text Codes
          </h1>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            Create high-converting sign rider keyword codes to capture mobile leads directly from physical listing signs.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4.5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer w-fit"
        >
          <Plus className="w-4 h-4" /> Create Text Code
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-2xl p-5 flex gap-4 items-start">
        <div className="w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-extrabold text-sm text-foreground">How Sign Rider SMS Codes Work:</h3>
          <p className="text-xs text-muted-foreground leading-relaxed font-medium">
            Place instructions on your yard signs (e.g. <strong className="text-foreground">Text &quot;8485SHERMAN&quot; to (586) 555-0190</strong>). When a prospect texts your number, the CRM immediately replies with your custom listing link and registers their mobile number as a hot inbound lead under your round-robin team assignment.
          </p>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/40 flex items-center justify-between gap-4 bg-muted/10">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword or listing address..."
              className="w-full bg-background border border-border/60 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40 bg-muted/20 text-[10px] uppercase font-black text-muted-foreground tracking-wider">
                <th className="px-5 py-3.5">Rider Keyword</th>
                <th className="px-5 py-3.5">Text To Number</th>
                <th className="px-5 py-3.5">Assigned Property/List</th>
                <th className="px-5 py-3.5">Auto-Response Snippet</th>
                <th className="px-5 py-3.5 text-center">Leads</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-xs">
              {filteredCodes.map(code => (
                <tr key={code.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-4.5 font-black text-indigo-500 tracking-wide uppercase">
                    {code.keyword}
                  </td>
                  <td className="px-5 py-4.5 font-bold text-foreground">
                    {code.phoneNumber}
                  </td>
                  <td className="px-5 py-4.5 text-muted-foreground font-semibold">
                    {code.listingAddress}
                  </td>
                  <td className="px-5 py-4.5 text-muted-foreground max-w-xs truncate font-medium" title={code.responseMessage}>
                    {code.responseMessage}
                  </td>
                  <td className="px-5 py-4.5 text-center font-black text-foreground">
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-black">
                      {code.leadsCaptured}
                    </span>
                  </td>
                  <td className="px-5 py-4.5 text-center">
                    <button
                      onClick={() => toggleStatus(code.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border cursor-pointer transition-colors ${
                        code.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {code.status === 'ACTIVE' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      {code.status}
                    </button>
                  </td>
                  <td className="px-5 py-4.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopyLink(`Text "${code.keyword}" to ${code.phoneNumber}`, code.id)}
                        className="p-1.5 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-indigo-500 transition-colors cursor-pointer"
                        title="Copy Rider Instructions"
                      >
                        {copiedId === code.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(code.id)}
                        className="p-1.5 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                        title="Delete Code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground italic font-medium">
                    No SMS text codes matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <h3 className="text-base font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                💬 Create Sign Rider SMS Code
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCode} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Rider Keyword (CAPS)</label>
                  <input
                    type="text"
                    required
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                    placeholder="e.g. 8485SHERMAN"
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Rider Phone Number</label>
                  <select
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="(586) 555-0190">(586) 555-0190 (Broker Office)</option>
                    <option value="(586) 555-0122">(586) 555-0122 (Direct Line)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Assigned Listing / Property Address</label>
                <input
                  type="text"
                  value={listingAddress}
                  onChange={(e) => setListingAddress(e.target.value)}
                  placeholder="e.g. 8485 Sherman Ave, Warren, MI 48089"
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-black uppercase text-muted-foreground">Auto-Response Message Body</label>
                <textarea
                  required
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Thanks for inquiring! View list price & photos instantly: http://localhost:3000/portal/site/8485-sherman"
                  rows={4}
                  className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 hover:bg-muted rounded-xl text-foreground font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 cursor-pointer"
                >
                  Create Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
