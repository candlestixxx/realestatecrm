'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, CheckCircle2, Circle, DollarSign, Calculator, Briefcase, Plus,
  Trash2, FileText, Send, User, ShieldAlert, Sparkles, Building, Key, MapPin, Check
} from 'lucide-react';

import { 
  updateDealStageAction, 
  addDealExpenseAction, 
  deleteDealExpenseAction,
  addDealDocumentRequestAction,
  updateDealDocumentStatusAction,
  addDealMessageAction 
} from '@/lib/actions/deal-actions';

type ContactData = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
};

type ActivityData = {
  id: string;
  type: string;
  content: string;
  metadata: string | null;
  createdAt: Date | string;
};

type DealData = {
  id: string;
  title: string;
  value: number | null;
  stage: string;
  workspaceId: string;
  contactId: string;
  contact: ContactData;
  tasks: TaskData[];
  Activity: ActivityData[];
};

export default function DealDetailLayoutClient({
  deal,
  userRole,
  addActivityAction,
}: {
  deal: DealData;
  userRole: string;
  addActivityAction: (formData: FormData) => Promise<any>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'roadmap' | 'vault' | 'messages' | 'tasks'>('roadmap');

  // Interactive stages list
  const stages = [
    { id: 'QUALIFICATION', label: 'Qualification' },
    { id: 'PROPOSAL', label: 'Proposal/Showing' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'UNDER_CONTRACT', label: 'Under Contract' },
    { id: 'CLOSED_WON', label: 'Closed Won' },
  ];

  // Financial Ledger State
  const [purchasePrice, setPurchasePrice] = useState(deal.value || 0);
  const [commissionRate, setCommissionRate] = useState(3.0); // 3% standard
  const [expenseLabel, setExpenseLabel] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  // Document Request State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isRequestingDoc, setIsRequestingDoc] = useState(false);

  // Communication message state
  const [messageText, setMessageText] = useState('');
  const [senderRole, setSenderRole] = useState('AGENT');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // General Log State
  const [noteContent, setNoteContent] = useState('');
  const [isPostingNote, setIsPostingNote] = useState(false);

  // Parse expenses from activities
  const expensesList: { id: string; label: string; amount: number }[] = (() => {
    return deal.Activity.filter(a => a.type === 'EXPENSE').map(act => {
      let amount = 0;
      try {
        const meta = act.metadata ? JSON.parse(act.metadata) : {};
        amount = Number(meta.amount) || 0;
      } catch {}
      return {
        id: act.id,
        label: act.content,
        amount,
      };
    });
  })();

  // Parse custom requested documents from activities
  const requestedDocs: { id: string; title: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'; signed: boolean }[] = (() => {
    // Add default documents if none present to make it look premium
    const custom = deal.Activity.filter(a => a.type === 'DOCUMENT_REQUEST').map(act => {
      let status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
      let signed = false;
      try {
        const meta = act.metadata ? JSON.parse(act.metadata) : {};
        status = meta.status || 'PENDING';
        signed = !!meta.signed;
      } catch {}
      return {
        id: act.id,
        title: act.content,
        status,
        signed,
      };
    });

    const defaultDocs = [
      { id: 'def-1', title: 'Exclusive Buyer Broker Agreement', status: 'COMPLETED' as const, signed: true },
      { id: 'def-2', title: 'Purchase Agreement & Addenda', status: 'IN_PROGRESS' as const, signed: false },
      { id: 'def-3', title: 'Earnest Money Deposit Receipt', status: 'PENDING' as const, signed: false },
      { id: 'def-4', title: 'Pre-Approval / Proof of Funds Letter', status: 'COMPLETED' as const, signed: false },
    ];

    return [...custom, ...defaultDocs];
  })();

  // Parse collaboration messages
  const messageLogs: { id: string; text: string; senderName: string; senderRole: string; createdAt: Date | string }[] = (() => {
    const customMsgs = deal.Activity.filter(a => a.type === 'MESSAGE').map(act => {
      let senderName = 'Agent';
      let senderRole = 'AGENT';
      try {
        const meta = act.metadata ? JSON.parse(act.metadata) : {};
        senderName = meta.senderName || 'Agent';
        senderRole = meta.senderRole || 'AGENT';
      } catch {}
      return {
        id: act.id,
        text: act.content,
        senderName,
        senderRole,
        createdAt: act.createdAt,
      };
    });

    const defaultMsgs = [
      { id: 'msg-1', text: 'Hi Darrell! I just set up the shared portal. You can upload the inspection report directly to the vault here once received.', senderName: 'Excel Legacy Realty Group', senderRole: 'AGENT', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'msg-2', text: 'Got it! The inspector is scheduled for tomorrow at 2 PM. I will upload it as soon as I get it.', senderName: deal.contact.firstName, senderRole: 'CLIENT', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'msg-3', text: 'Pre-approval verified. Appraisal order has been placed on our end.', senderName: 'Sarah Jenkins (Lender)', senderRole: 'LENDER', createdAt: new Date(Date.now() - 1800000).toISOString() },
    ];

    return [...customMsgs, ...defaultMsgs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  })();

  // Calculations
  const grossCommission = purchasePrice * (commissionRate / 100);
  const totalExpenses = expensesList.reduce((sum, exp) => sum + exp.amount, 0);
  const netCommission = grossCommission - totalExpenses;

  // Change Deal Stage
  const handleStageChange = async (newStage: string) => {
    try {
      const res = await updateDealStageAction(deal.id, newStage);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Transaction moved to ${newStage.replace('_', ' ')}!`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to change stage.');
    }
  };

  // Add Expense Write-off
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseLabel.trim() || !expenseAmount) return;
    setIsAddingExpense(true);

    try {
      const res = await addDealExpenseAction(deal.id, expenseLabel, Number(expenseAmount));
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Logged tax write-off: ${expenseLabel}`);
        setExpenseLabel('');
        setExpenseAmount('');
        router.refresh();
      }
    } catch {
      toast.error('Failed to add expense.');
    } finally {
      setIsAddingExpense(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await deleteDealExpenseAction(deal.id, id);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Expense removed.');
        router.refresh();
      }
    } catch {
      toast.error('Failed to remove expense.');
    }
  };

  // Add Doc Request
  const handleRequestDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setIsRequestingDoc(true);

    try {
      const res = await addDealDocumentRequestAction(deal.id, newDocTitle);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Requested document: ${newDocTitle}`);
        setNewDocTitle('');
        router.refresh();
      }
    } catch {
      toast.error('Failed to request document.');
    } finally {
      setIsRequestingDoc(false);
    }
  };

  // Toggle Doc status
  const handleToggleDocStatus = async (id: string, currentStatus: string, signed: boolean) => {
    let nextStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' = 'PENDING';
    if (currentStatus === 'PENDING') nextStatus = 'IN_PROGRESS';
    else if (currentStatus === 'IN_PROGRESS') nextStatus = 'COMPLETED';

    try {
      const res = await updateDealDocumentStatusAction(deal.id, id, nextStatus, signed);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success(`Doc status updated to ${nextStatus}!`);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update document.');
    }
  };

  // Sign Doc
  const handleSignDoc = async (id: string, title: string, status: string) => {
    try {
      const res = await updateDealDocumentStatusAction(deal.id, id, 'COMPLETED', true);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success(`"${title}" signed successfully!`);
        router.refresh();
      }
    } catch {
      toast.error('Signing failed.');
    }
  };

  // Send Portal Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsSendingMessage(true);

    try {
      const res = await addDealMessageAction(deal.id, senderRole, messageText);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        setMessageText('');
        router.refresh();
      }
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handlePostGeneralNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setIsPostingNote(true);

    const formData = new FormData();
    formData.append('content', noteContent);
    formData.append('type', 'NOTE');
    formData.append('workspaceId', deal.workspaceId);
    formData.append('dealId', deal.id);

    try {
      const res = await addActivityAction(formData);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Internal note logged!');
        setNoteContent('');
        router.refresh();
      }
    } catch {
      toast.error('Failed to post note.');
    } finally {
      setIsPostingNote(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      
      {/* Top Header: back to pipeline link */}
      <div className="flex items-center justify-between gap-4 py-2 px-4 bg-card/60 border border-border/60 rounded-xl">
        <Link
          href="/dashboard/deals"
          className="text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Deals Pipeline
        </Link>
        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded border border-indigo-500/20 uppercase tracking-widest">
          Active Transaction Helper
        </span>
      </div>

      {/* Transaction Roadmap Header Banner (Green light process) */}
      <div className="bg-card border border-border/60 p-5 rounded-2xl shadow-sm space-y-4">
        <div>
          <h2 className="font-extrabold text-lg text-foreground flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> {deal.title} Detailed Portal
          </h2>
          <p className="text-xs text-muted-foreground">Connected client: <strong>{deal.contact.firstName} {deal.contact.lastName || ''}</strong> &bull; Lead profile link: <Link href={`/dashboard/leads/${deal.contactId}`} className="text-primary hover:underline font-bold">View profile</Link></p>
        </div>

        {/* Stages Guides flow */}
        <div className="pt-2 border-t border-border/40">
          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block mb-2.5">Transaction Stage Tracker</label>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border border-border/50 bg-muted/20 p-2 rounded-xl">
            {stages.map((stg, idx) => {
              const isActive = deal.stage === stg.id;
              const isPassed = stages.findIndex(s => s.id === deal.stage) >= idx;

              return (
                <button
                  key={stg.id}
                  onClick={() => handleStageChange(stg.id)}
                  className={`w-full text-center py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow' 
                      : isPassed 
                        ? 'bg-primary/10 text-primary border border-primary/20' 
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                  <span>{stg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: left side ledger, right side detail tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left column: Ledger & Tax write-off financial tracker */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border/40 pb-2">
              <Calculator className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm text-foreground">Financial Tax Ledger</h3>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase">Contract Price ($)</label>
                <div className="relative mt-1">
                  <span className="absolute left-2.5 top-2 text-muted-foreground font-bold">$</span>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full bg-muted/40 border border-border/80 rounded-lg pl-6 pr-3 py-1.5 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="mt-1 w-full bg-muted/40 border border-border/80 rounded-lg px-3 py-1.5 font-bold focus:outline-none"
                />
              </div>

              {/* Calculator output indicators */}
              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-2.5 font-bold">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross Payout:</span>
                  <span className="text-foreground">${grossCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Expenses:</span>
                  <span className="text-red-400">-${totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-base border-t border-border/40 pt-2 text-foreground font-black">
                  <span>Net Commission:</span>
                  <span className="text-primary">${netCommission.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Expense logger */}
              <div className="pt-2 border-t border-border/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Log Expense / Write-off</span>
                </div>
                
                <form onSubmit={handleAddExpense} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Expense name (e.g. Comps)"
                    value={expenseLabel}
                    onChange={(e) => setExpenseLabel(e.target.value)}
                    className="w-full bg-muted/40 border border-border/80 rounded px-2 py-1 text-xs focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      placeholder="Amount ($)"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      className="w-full bg-muted/40 border border-border/80 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isAddingExpense}
                      className="px-3 bg-primary text-primary-foreground text-xs font-bold rounded hover:opacity-90 shrink-0 cursor-pointer"
                    >
                      Log
                    </button>
                  </div>
                </form>

                {/* Expenses list */}
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {expensesList.map(exp => (
                    <div key={exp.id} className="flex justify-between items-center p-2 bg-muted/20 border border-border/40 rounded text-[11px] font-semibold text-foreground">
                      <span className="truncate pr-1">{exp.label}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-red-400">-${exp.amount}</span>
                        <button 
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {expensesList.length === 0 && (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">No expenses logged yet.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Right column: workspace tabs */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tab Selection */}
          <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1 bg-card/40 p-1 border border-border/60 rounded-xl shadow-xs">
            {[
              { id: 'roadmap', label: 'Roadmap Checklist' },
              { id: 'vault', label: 'Documents Vault' },
              { id: 'messages', label: 'Co-Op Communication' },
              { id: 'tasks', label: 'Task List' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[450px]">
            
            {/* ROADMAP CHECKLIST TAB */}
            {activeTab === 'roadmap' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-foreground flex items-center gap-1">
                    🟢 Guided Roadmap Checklist
                  </h3>
                  <p className="text-xs text-muted-foreground">Essential green-light validation tasks tracking your transaction through closing.</p>
                </div>

                {/* Grid categories: Title, Lender, Inspector, Appraiser, Client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Title & Escrow */}
                  <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/15">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 uppercase tracking-wider border-b border-border/40 pb-1.5">
                      🏛️ Title & Escrow
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'Open Title Order & Escrow file',
                        'Request and audit Title Commitment report',
                        'Verify clear title and schedule deed signoff'
                      ].map((task, i) => (
                        <label key={i} className="flex items-start gap-2 text-muted-foreground font-semibold hover:text-foreground cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" defaultChecked={i === 0} />
                          <span>{task}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Lender Checklists */}
                  <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/15">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 uppercase tracking-wider border-b border-border/40 pb-1.5">
                      💵 Mortgage Lender
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'Confirm mortgage application submitted',
                        'Validate appraisal order status',
                        'Confirm Underwriter clear to close received'
                      ].map((task, i) => (
                        <label key={i} className="flex items-start gap-2 text-muted-foreground font-semibold hover:text-foreground cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" defaultChecked={i === 0} />
                          <span>{task}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Inspection milestones */}
                  <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/15">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 uppercase tracking-wider border-b border-border/40 pb-1.5">
                      🔍 Home Inspector
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'Schedule home property inspection',
                        'Review inspection disclosures & notes',
                        'Draft Repair Negotiation / Credit requests'
                      ].map((task, i) => (
                        <label key={i} className="flex items-start gap-2 text-muted-foreground font-semibold hover:text-foreground cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" />
                          <span>{task}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Client Signatures */}
                  <div className="border border-border/60 rounded-xl p-4 space-y-3 bg-muted/15">
                    <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5 uppercase tracking-wider border-b border-border/40 pb-1.5">
                      👤 Lead Client Checklists
                    </h4>
                    <div className="space-y-2 text-xs">
                      {[
                        'Receive fully executed listing disclosure package',
                        'Confirm earnest money deposit delivered to escrow',
                        'Conduct final buyer property walk-through'
                      ].map((task, i) => (
                        <label key={i} className="flex items-start gap-2 text-muted-foreground font-semibold hover:text-foreground cursor-pointer">
                          <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" defaultChecked={i === 1} />
                          <span>{task}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* DOCUMENTS VAULT TAB */}
            {activeTab === 'vault' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">Documents Vault & Requests</h3>
                    <p className="text-xs text-muted-foreground">Request, status, and electronically sign disclosures in a secure, unified portal.</p>
                  </div>
                  
                  <form onSubmit={handleRequestDoc} className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inspection Report"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="bg-muted/40 border border-border/80 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                    <button 
                      type="submit"
                      disabled={isRequestingDoc}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded transition-colors cursor-pointer"
                    >
                      Request Doc
                    </button>
                  </form>
                </div>

                {/* Vault elements list */}
                <div className="space-y-3.5">
                  {requestedDocs.map(doc => (
                    <div 
                      key={doc.id} 
                      className="p-4 border border-border/60 rounded-xl bg-muted/10 hover:border-border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-foreground">{doc.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                            <span>Status:</span>
                            <button 
                              onClick={() => handleToggleDocStatus(doc.id, doc.status, doc.signed)}
                              className={`px-1.5 py-0.5 rounded font-black uppercase text-[8px] border transition-all ${
                                doc.status === 'COMPLETED' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : doc.status === 'IN_PROGRESS' 
                                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}
                            >
                              {doc.status}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {doc.signed ? (
                          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> Signed
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleSignDoc(doc.id, doc.title, doc.status)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow cursor-pointer"
                          >
                            Sign Document
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            toast.success(`Mock Upload: Document "${doc.title}" uploaded!`);
                            handleToggleDocStatus(doc.id, 'IN_PROGRESS', doc.signed);
                          }}
                          className="px-3 py-1.5 bg-muted border border-border rounded-lg text-xs font-bold hover:text-foreground cursor-pointer"
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CO-OP COMMUNICATIONS TAB */}
            {activeTab === 'messages' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Co-Op Portal Conversations</h3>
                  <p className="text-xs text-muted-foreground">Collaborative chat thread linking the agent, client, lender, and title escrow agent.</p>
                </div>

                {/* Messages feed list */}
                <div className="border border-border/60 rounded-2xl p-4 bg-muted/10 h-[280px] overflow-y-auto space-y-4 pr-2.5">
                  {messageLogs.map(msg => {
                    const isAgent = msg.senderRole === 'AGENT';
                    return (
                      <div key={msg.id} className={`flex flex-col max-w-[85%] ${isAgent ? 'ml-auto items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase text-muted-foreground">
                          <span>{msg.senderName}</span>
                          <span className={`px-1 text-[8px] rounded border ${
                            msg.senderRole === 'CLIENT' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : msg.senderRole === 'LENDER' 
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                : msg.senderRole === 'TITLE' 
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                  : 'bg-primary/10 text-primary border-primary/20'
                          }`}>
                            {msg.senderRole}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                          isAgent 
                            ? 'bg-primary text-primary-foreground border-primary shadow' 
                            : 'bg-background border-border text-foreground'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Send message form */}
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <select
                    value={senderRole}
                    onChange={(e) => setSenderRole(e.target.value)}
                    className="bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground font-semibold focus:outline-none"
                  >
                    <option value="AGENT">👤 Send as Agent</option>
                    <option value="CLIENT">👤 Send as Client</option>
                    <option value="LENDER">👤 Send as Lender</option>
                    <option value="TITLE">🏛️ Send as Title</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Write a message to the deal members..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 bg-muted/40 border border-border/80 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <button 
                    type="submit"
                    disabled={isSendingMessage}
                    className="p-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors shadow shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TASK LIST TAB */}
            {activeTab === 'tasks' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-extrabold text-base text-foreground">General Deal Task List</h3>
                  <p className="text-xs text-muted-foreground">General follow-up duties assigned to deal workspace members.</p>
                </div>

                <div className="space-y-3">
                  {deal.tasks.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-6">No general tasks found. Use the roadmap tab to follow guide milestones.</p>
                  ) : (
                    deal.tasks.map(task => (
                      <div key={task.id} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-start gap-2.5">
                        <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-border" defaultChecked={task.status === 'DONE'} />
                        <div>
                          <p className="font-bold text-xs text-foreground">{task.title}</p>
                          {task.description && <p className="text-[10px] text-muted-foreground mt-0.5">{task.description}</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
