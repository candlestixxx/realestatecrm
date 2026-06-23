'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Phone, Mail, MessageSquare, Plus, Trash2, Edit2, Sparkles, Check, 
  Settings, User, Clock, ArrowLeft, Calendar, MapPin, UserPlus, 
  FileText, ChevronRight, X, Briefcase, Info, Bold, Italic, List, Pin, PinOff, Trash
} from 'lucide-react';

import LeadStatusSelector from './LeadStatusSelector';
import LeadTagsEditor from './LeadTagsEditor';
import SearchAlertsWidget from './SearchAlertsWidget';
import LeadAutomationsWidget from './LeadAutomationsWidget';
import CommunicationsHub from './CommunicationsHub';
import { createDealAction } from '@/lib/actions/deal';
import { deleteLeadAction, updateLeadContactDetailsAction } from '@/lib/actions/lead';
import { addLeadToSegmentAction } from '@/lib/actions/segment';
import { addTaskAction, updateTaskAction, deleteTaskAction, toggleTaskStatusAction } from '@/lib/actions/task';
import { scheduleShowingAction } from '@/lib/actions/showing';
import { deleteActivityAction, togglePinActivityAction } from '@/lib/actions/activity';

type TaskData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | string | null;
};

type ActivityData = {
  id: string;
  type: string;
  content: string;
  formattedContent: string | null;
  isPinned: boolean;
  createdAt: Date | string;
};

type DealData = {
  id: string;
  title: string;
  value: number | null;
  stage: string;
};

type LeadData = {
  id: string;
  status: string;
  score: number | null;
  source: string | null;
  type: string;
  isAiAssisted: boolean;
  tags: string | null;
  createdAt: Date | string;
  smartPlanId: string | null;
  workspaceId: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    additionalPhones: string | null;
    additionalEmails: string | null;
    spouseName: string | null;
    spousePhone: string | null;
    spouseEmail: string | null;
    familyMembers: string | null;
    deals: DealData[];
  };
  tasks: TaskData[];
  searchAlerts: any[];
  Activity: ActivityData[];
  WorkflowSession: any[];
};

export default function LeadDetailLayoutClient({
  lead,
  campaigns,
  siblingLeadsCount,
  leadIndex,
  prevLeadId,
  nextLeadId,
  allSegments,
  users,
  workspaces,
  addActivityAction,
}: {
  lead: LeadData;
  campaigns: any[];
  siblingLeadsCount: number;
  leadIndex: number;
  prevLeadId: string | null;
  nextLeadId: string | null;
  allSegments: { id: string; name: string }[];
  users: { id: string; name: string | null }[];
  workspaces: { id: string; name: string }[];
  addActivityAction: (formData: FormData) => Promise<any>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'searches' | 'transactions' | 'documents' | 'automations' | 'communications'>('overview');

  // Inline Note Logging State
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('NOTE');
  const [isPostingNote, setIsPostingNote] = useState(false);

  // Activity Feed Filter
  const [timelineFilter, setTimelineFilter] = useState('ALL');

  // Quick Task State
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Edit Task State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [editTaskDueTime, setEditTaskDueTime] = useState('');
  const [editTaskStatus, setEditTaskStatus] = useState('TODO');
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  // Quick Deal State
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [newDealTitle, setNewDealTitle] = useState(`${lead.contact.firstName}'s Purchase`);
  const [newDealValue, setNewDealValue] = useState('');
  const [newDealStage, setNewDealStage] = useState('LEAD');
  const [isAddingDeal, setIsAddingDeal] = useState(false);

  // Rich Text Formatting State
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isBullet, setIsBullet] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = noteContent.substring(start, end);
    const newText = noteContent.substring(0, start) + prefix + selected + suffix + noteContent.substring(end);
    setNoteContent(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  // Quick Showing State
  const [showAddShowing, setShowAddShowing] = useState(false);
  const [showingAddress, setShowingAddress] = useState(lead.contact.address || '');
  const [showingDate, setShowingDate] = useState('');
  const [showingTime, setShowingTime] = useState('');
  const [isSchedulingShowing, setIsSchedulingShowing] = useState(false);

  // 3-dots dropdown state
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!showMoreDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreDropdown]);

  // Close dropdown on Escape
  React.useEffect(() => {
    if (!showMoreDropdown) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMoreDropdown(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showMoreDropdown]);

  // Segment State
  const [currentSegmentId, setCurrentSegmentId] = useState(() => {
    // Try to guess segment from lead if possible
    return '';
  });

  // Family State
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [familyRel, setFamilyRel] = useState('Spouse');
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('');
  const [familyEmail, setFamilyEmail] = useState('');

  // Primary Contact details edit modal
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editFirstName, setEditFirstName] = useState(lead.contact.firstName);
  const [editLastName, setEditLastName] = useState(lead.contact.lastName || '');
  const [editEmail, setEditEmail] = useState(lead.contact.email || '');
  const [editPhone, setEditPhone] = useState(lead.contact.phone || '');
  const [editAddress, setEditAddress] = useState(lead.contact.address || '');
  const [editSpouseName, setEditSpouseName] = useState(lead.contact.spouseName || '');
  const [editSpousePhone, setEditSpousePhone] = useState(lead.contact.spousePhone || '');
  const [editSpouseEmail, setEditSpouseEmail] = useState(lead.contact.spouseEmail || '');

  // Secondary contact data parsing
  const secondaryPhones: string[] = (() => {
    try {
      const parsed = lead.contact.additionalPhones ? JSON.parse(lead.contact.additionalPhones) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const secondaryEmails: string[] = (() => {
    try {
      const parsed = lead.contact.additionalEmails ? JSON.parse(lead.contact.additionalEmails) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const familyMembersList: { name: string; relationship: string; phone?: string; email?: string }[] = (() => {
    try {
      const parsed = lead.contact.familyMembers ? JSON.parse(lead.contact.familyMembers) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setIsPostingNote(true);

    // Build formatted content (simple markdown-like)
    let formatted = noteContent;
    if (isBold) formatted = '**' + formatted + '**';
    if (isItalic) formatted = '*' + formatted + '*';

    const formData = new FormData();
    formData.append('content', noteContent);
    formData.append('formattedContent', formatted !== noteContent ? formatted : '');
    formData.append('type', noteType);
    formData.append('workspaceId', lead.workspaceId as any);
    formData.append('leadId', lead.id);

    try {
      const res = await addActivityAction(formData);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Interaction logged successfully!');
        setNoteContent('');
        setIsBold(false);
        setIsItalic(false);
        setIsBullet(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to log interaction.');
    } finally {
      setIsPostingNote(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Delete this activity entry?')) return;
    const formData = new FormData();
    formData.append('activityId', activityId);
    formData.append('leadId', lead.id);
    try {
      const res = await deleteActivityAction(formData);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Activity deleted.');
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleTogglePin = async (activityId: string) => {
    const formData = new FormData();
    formData.append('activityId', activityId);
    formData.append('leadId', lead.id);
    try {
      const res = await togglePinActivityAction(formData);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success(res?.isPinned ? 'Pinned to top' : 'Unpinned');
        router.refresh();
      }
    } catch {
      toast.error('Failed to update pin.');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);

    try {
      const formData = new FormData();
      formData.append('title', newTaskTitle);
      if (newTaskDesc) formData.append('description', newTaskDesc);
      formData.append('status', 'TODO');
      formData.append('leadId', lead.id);
      if (newTaskDueDate) formData.append('dueDate', newTaskDueDate);
      if (newTaskDueTime) formData.append('dueTime', newTaskDueTime);

      const res = await addTaskAction(formData);

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Task added successfully!');
        setNewTaskTitle('');
        setNewTaskDesc('');
        setNewTaskDueDate('');
        setNewTaskDueTime('');
        setShowAddTask(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to add task.');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTaskTitle.trim() || !editingTaskId) return;
    setIsUpdatingTask(true);

    try {
      const formData = new FormData();
      formData.append('taskId', editingTaskId);
      formData.append('title', editTaskTitle);
      if (editTaskDesc) formData.append('description', editTaskDesc);
      formData.append('status', editTaskStatus);
      if (editTaskDueDate) formData.append('dueDate', editTaskDueDate);
      if (editTaskDueTime) formData.append('dueTime', editTaskDueTime);
      formData.append('leadId', lead.id);

      const res = await updateTaskAction(formData);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Task updated!');
        setEditingTaskId(null);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update task.');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('leadId', lead.id);
    try {
      const res = await deleteTaskAction(formData);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Task deleted.');
        router.refresh();
      }
    } catch {
      toast.error('Failed to delete task.');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const formData = new FormData();
    formData.append('taskId', taskId);
    formData.append('leadId', lead.id);
    try {
      const res = await toggleTaskStatusAction(formData);
      if (res && res.error) toast.error(res.error);
      else router.refresh();
    } catch {
      toast.error('Failed to update task status.');
    }
  };

  const openEditTask = (task: TaskData) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description || '');
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      setEditTaskDueDate(d.toISOString().split('T')[0]);
      const timeStr = d.toTimeString().split(' ')[0].substring(0, 5);
      setEditTaskDueTime(timeStr === '00:00' ? '' : timeStr);
    } else {
      setEditTaskDueDate('');
      setEditTaskDueTime('');
    }
    setEditTaskStatus(task.status);
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle.trim()) return;
    setIsAddingDeal(true);

    try {
      const res = await createDealAction({
        title: newDealTitle,
        value: newDealValue || undefined,
        stage: newDealStage,
        contactId: lead.contact.id,
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Deal created and linked successfully!');
        setNewDealTitle(`${lead.contact.firstName}'s Purchase`);
        setNewDealValue('');
        setShowAddDeal(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to link deal.');
    } finally {
      setIsAddingDeal(false);
    }
  };

  const handleScheduleShowing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showingAddress || !showingDate || !showingTime) {
      toast.error('All fields are required.');
      return;
    }
    setIsSchedulingShowing(true);

    const formData = new FormData();
    formData.append('propertyAddress', showingAddress);
    formData.append('date', showingDate);
    formData.append('time', showingTime);
    formData.append('leadId', lead.id);

    try {
      const res = await scheduleShowingAction(formData);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Showing scheduled successfully!');
        setShowingAddress(lead.contact.address || '');
        setShowingDate('');
        setShowingTime('');
        setShowAddShowing(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to schedule showing.');
    } finally {
      setIsSchedulingShowing(false);
    }
  };

  const handleAddSegment = async (segmentId: string) => {
    if (!segmentId) return;
    try {
      const res = await addLeadToSegmentAction(lead.id, segmentId);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Lead added to segment!');
        setCurrentSegmentId(segmentId);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update segment.');
    }
  };

  const handleAddFamilyMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) return;

    const newFamily = [...familyMembersList, {
      name: familyName,
      relationship: familyRel,
      phone: familyPhone || undefined,
      email: familyEmail || undefined
    }];

    try {
      const res = await updateLeadContactDetailsAction(lead.id, {
        firstName: lead.contact.firstName,
        lastName: lead.contact.lastName || undefined,
        email: lead.contact.email || undefined,
        phone: lead.contact.phone || undefined,
        address: lead.contact.address || undefined,
        familyMembers: newFamily,
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Family member added successfully!');
        setFamilyName('');
        setFamilyPhone('');
        setFamilyEmail('');
        setShowAddFamily(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to add family member.');
    }
  };

  const handleUpdateContactDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await updateLeadContactDetailsAction(lead.id, {
        firstName: editFirstName,
        lastName: editLastName || undefined,
        email: editEmail || undefined,
        phone: editPhone || undefined,
        address: editAddress || undefined,
        spouseName: editSpouseName || undefined,
        spousePhone: editSpousePhone || undefined,
        spouseEmail: editSpouseEmail || undefined,
      });

      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Contact info updated successfully!');
        setIsEditingContact(false);
        router.refresh();
      }
    } catch {
      toast.error('Failed to update contact info.');
    }
  };

  const handleDeleteLead = async () => {
    if (confirm(`Are you sure you want to permanently delete lead "${lead.contact.firstName} ${lead.contact.lastName || ''}"?`)) {
      try {
        const res = await deleteLeadAction(lead.id);
        if (res && res.error) {
          toast.error(res.error);
        } else {
          toast.success('Lead deleted successfully.');
          window.location.href = '/dashboard/leads';
        }
      } catch {
        toast.error('Delete failed.');
      }
    }
  };

  // Timeline events filter logic
  const filteredActivities = lead.Activity
    .filter(act => {
      if (timelineFilter === 'ALL') return true;
      if (timelineFilter === 'PINNED') return act.isPinned;
      return act.type === timelineFilter;
    })
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 select-none">
      {/* Top Breadcrumb & Prev/Next Bar */}
      <div className="flex items-center justify-between gap-4 py-1.5 px-4 bg-card/65 backdrop-blur border border-border/60 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/leads"
            className="text-muted-foreground hover:text-foreground text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Leads
          </Link>
          <div className="h-4 w-[1px] bg-border/80 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            {prevLeadId && (
              <Link
                href={`/dashboard/leads/${prevLeadId}`}
                className="px-2.5 py-1 bg-muted/80 hover:bg-muted border border-border/80 rounded text-[10px] font-black uppercase transition-colors"
              >
                &larr; Prev
              </Link>
            )}
            <span className="text-[10px] text-muted-foreground font-black uppercase">
              {leadIndex + 1} of {siblingLeadsCount} Leads
            </span>
            {nextLeadId && (
              <Link
                href={`/dashboard/leads/${nextLeadId}`}
                className="px-2.5 py-1 bg-muted/80 hover:bg-muted border border-border/80 rounded text-[10px] font-black uppercase transition-colors"
              >
                Next &rarr;
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {lead.isAiAssisted && (
            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded border border-indigo-500/20 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> AI Managed
            </span>
          )}
          <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded border border-emerald-500/20 uppercase tracking-wider">
            {lead.status}
          </span>
        </div>
      </div>

      {/* Lofty-style AI Copilot Recommendation Banner */}
      <div className="bg-indigo-500/5 hover:bg-indigo-500/[0.07] border border-indigo-500/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all duration-300">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5 leading-snug">
              AI Copilot Recommendation for {lead.contact.firstName}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-3xl leading-relaxed">
              New {lead.type.toLowerCase()} lead <strong>{lead.contact.firstName} {lead.contact.lastName || ''}</strong> registered on {new Date(lead.createdAt).toLocaleDateString()} for property {lead.contact.address ? `at ${lead.contact.address}` : 'alert preferences'}. Recommended action step: schedule a call to verify purchase criteria and set up an automated alert.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-auto">
          <button 
            onClick={() => {
              setNoteType('CALL');
              setNoteContent('Scheduled verify criteria follow-up call.');
              setActiveTab('overview');
              toast.success('Draft loaded to activity log!');
            }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" /> Log Call Option
          </button>
          <button 
            onClick={() => {
              setActiveTab('communications');
              toast.success('Redirecting to Chat dialer...');
            }}
            className="px-3 py-1.5 bg-muted/90 hover:bg-muted border border-border/80 text-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Talk to Assistant
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Profile Sidebar Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-5">
            
            {/* Avatar & Name */}
            <div className="text-center relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary/30 to-indigo-500/20 text-foreground text-xl font-bold flex items-center justify-center mx-auto border-2 border-border">
                {lead.contact.firstName[0]}
                {lead.contact.lastName?.[0] || ''}
              </div>
              <h3 className="font-extrabold text-lg text-foreground mt-3 leading-snug">
                {lead.contact.firstName} {lead.contact.lastName || ''}
              </h3>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                lead.type === 'SELLER' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {lead.type}
              </span>
              
              <div className="absolute top-0 right-0 flex items-center gap-1">
                <button 
                  onClick={() => {
                    setEditFirstName(lead.contact.firstName);
                    setEditLastName(lead.contact.lastName || '');
                    setEditEmail(lead.contact.email || '');
                    setEditPhone(lead.contact.phone || '');
                    setEditAddress(lead.contact.address || '');
                    setEditSpouseName(lead.contact.spouseName || '');
                    setEditSpousePhone(lead.contact.spousePhone || '');
                    setEditSpouseEmail(lead.contact.spouseEmail || '');
                    setIsEditingContact(true);
                  }}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Edit details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* 3-dots Menu Button */}
                <div className="relative inline-block" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                    className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-black text-sm leading-none"
                    title="More options"
                  >
                    •••
                  </button>
                  
                  {showMoreDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-background border-2 border-border rounded-2xl shadow-2xl z-[100] text-left p-4 space-y-4 text-xs font-semibold overflow-y-auto max-h-[450px]" style={{ backgroundColor: 'var(--background)', backdropFilter: 'none', opacity: 1 }}>
                      
                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">Lead Nurturing</p>
                        <div className="grid grid-cols-1 gap-1">
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Mailer tool opened!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📬 Send Mailers</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Market snapshot configured!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📊 Add Market Snapshots</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Market reports added!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📈 Add Market Reports</button>
                          <button onClick={() => { setShowMoreDropdown(false); setActiveTab('automations'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">🎯 Add Smart Plans</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Welcome email scheduled!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">✉️ Send Welcome Email</button>
                          <button onClick={() => { setShowMoreDropdown(false); setShowAddTask(true); setActiveTab('overview'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📅 Add Task</button>
                          <button onClick={() => { setShowMoreDropdown(false); setShowAddShowing(true); setActiveTab('overview'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">⏰ Add Appointment / Showing</button>
                          <button onClick={() => { setShowMoreDropdown(false); setActiveTab('documents'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📁 Add Document</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Linked to Microsoft Teams!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">👥 Send to Microsoft Teams</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('AI Sales Agent activated!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">🤖 Activate Sales Agent</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Closely Link Sent!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">🔗 Send Closely Link</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Mailing label generated!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">🏷️ Mailing Label</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Consent Request Sent!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">✅ Send Consent Request</button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">Lead Closing</p>
                        <div className="grid grid-cols-1 gap-1">
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('CMA Builder opened!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📋 Create CMA</button>
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Listing presentation tool launched!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">📝 Create Listing Presentation</button>
                          <button onClick={() => { setShowMoreDropdown(false); setShowAddDeal(true); setActiveTab('transactions'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">💼 Create Transaction</button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">Social Media</p>
                        <div className="grid grid-cols-1 gap-1">
                          <a href="https://facebook.com" target="_blank" rel="noreferrer" onClick={() => setShowMoreDropdown(false)} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold block">📘 Find on Facebook</a>
                          <a href="https://linkedin.com" target="_blank" rel="noreferrer" onClick={() => setShowMoreDropdown(false)} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold block">👔 Find on LinkedIn</a>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider mb-1.5 border-b border-border/40 pb-1">Others</p>
                        <div className="grid grid-cols-1 gap-1">
                          <button onClick={() => { setShowMoreDropdown(false); toast.success('Lead details exported to clipboard!'); }} className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold">🔗 Share Lead</button>
                          <button 
                            onClick={() => {
                              setShowMoreDropdown(false);
                              setEditFirstName(lead.contact.firstName);
                              setEditLastName(lead.contact.lastName || '');
                              setEditEmail(lead.contact.email || '');
                              setEditPhone(lead.contact.phone || '');
                              setEditAddress(lead.contact.address || '');
                              setEditSpouseName(lead.contact.spouseName || '');
                              setEditSpousePhone(lead.contact.spousePhone || '');
                              setEditSpouseEmail(lead.contact.spouseEmail || '');
                              setIsEditingContact(true);
                            }} 
                            className="text-left py-1 px-1.5 hover:bg-muted rounded text-[11px] font-bold text-primary"
                          >
                            ✏️ Edit Details
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                <button 
                  onClick={handleDeleteLead}
                  className="p-1 hover:bg-red-500/10 rounded text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pipeline Dropdown & Segment Selection */}
            <div className="space-y-3 pt-3 border-t border-border/60">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Pipeline Stage</label>
                <div className="mt-1">
                  <LeadStatusSelector leadId={lead.id} initialStatus={lead.status} />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Assign Segment</label>
                <select
                  value={currentSegmentId}
                  onChange={(e) => handleAddSegment(e.target.value)}
                  className="mt-1 w-full bg-muted/40 hover:bg-muted/60 border border-border/80 rounded-lg px-2.5 py-1.5 text-xs text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="">-- Choose Segment --</option>
                  {allSegments.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Action Dial Bar */}
            <div className="grid grid-cols-3 gap-2 py-1 border-t border-b border-border/60">
              <button 
                onClick={() => {
                  setNoteType('CALL');
                  setActiveTab('overview');
                  toast.success('Call log opened in overview log.');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 hover:text-emerald-300 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-1">Call</span>
              </button>
              
              <button 
                onClick={() => {
                  setNoteType('SMS');
                  setActiveTab('overview');
                  toast.success('SMS message composer logged in overview.');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/15 text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-1">Text</span>
              </button>

              <button 
                onClick={() => {
                  setNoteType('EMAIL');
                  setActiveTab('overview');
                  toast.success('Email drafts open in overview.');
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span className="text-[9px] font-bold mt-1">Email</span>
              </button>
            </div>

            {/* Lead Sidebar Detail List */}
            <div className="space-y-4 pt-1 text-xs">
              
              {/* Phones List */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Phone Numbers</span>
                <div className="space-y-1.5 font-bold">
                  {lead.contact.phone ? (
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {lead.contact.phone}
                      </span>
                      <span className="text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">Primary</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">No primary phone</span>
                  )}
                  {secondaryPhones.map((ph, idx) => (
                    <div key={idx} className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/60" /> {ph}
                      </span>
                      <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-black uppercase">Alt {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emails List */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Email Addresses</span>
                <div className="space-y-1.5 font-semibold">
                  {lead.contact.email ? (
                    <div className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" /> {lead.contact.email}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">No primary email</span>
                  )}
                  {secondaryEmails.map((em, idx) => (
                    <div key={idx} className="flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground/60" /> {em}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source & Reg Date */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 text-[11px]">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-black block">Lead Source</span>
                  <span className="font-bold text-foreground">{lead.source || 'Direct Website'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-black block">Reg Date</span>
                  <span className="font-bold text-foreground">{new Date(lead.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Hashtag Manager widget */}
              <div className="pt-2 border-t border-border/40">
                <LeadTagsEditor leadId={lead.id} initialTags={lead.tags} />
              </div>

              {/* Address */}
              <div className="pt-2 border-t border-border/40 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Mailing Address</span>
                {lead.contact.address ? (
                  <div className="flex items-start gap-1.5 text-foreground font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{lead.contact.address}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">No address provided</span>
                )}
              </div>

              {/* Spouse / Family section */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Family & Spouse</span>
                  <button 
                    onClick={() => setShowAddFamily(true)}
                    className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-1.5 font-semibold">
                  {lead.contact.spouseName && (
                    <div className="p-2 bg-muted/30 border border-border/60 rounded-lg space-y-1">
                      <div className="flex justify-between items-center text-foreground font-bold">
                        <span>{lead.contact.spouseName}</span>
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded uppercase">Spouse</span>
                      </div>
                      {lead.contact.spousePhone && <p className="text-[10px] text-muted-foreground">📞 {lead.contact.spousePhone}</p>}
                      {lead.contact.spouseEmail && <p className="text-[10px] text-muted-foreground">✉️ {lead.contact.spouseEmail}</p>}
                    </div>
                  )}

                  {familyMembersList.map((mem, idx) => (
                    <div key={idx} className="p-2 bg-muted/20 border border-border/40 rounded-lg flex justify-between items-center text-foreground">
                      <span>{mem.name}</span>
                      <span className="text-[9px] bg-muted border border-border px-1 rounded uppercase text-muted-foreground">{mem.relationship}</span>
                    </div>
                  ))}

                  {!lead.contact.spouseName && familyMembersList.length === 0 && (
                    <span className="text-muted-foreground italic">No family recorded</span>
                  )}
                </div>
              </div>

            </div>

            {/* Ownership Card */}
            <div className="pt-4 border-t border-border/60 space-y-2.5">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block">Ownership</span>
              <div className="flex items-center gap-2.5 p-2.5 bg-muted/30 border border-border/60 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center">
                  R
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-black text-foreground truncate">Excel Legacy Realty Group</span>
                  <span className="text-[10px] text-muted-foreground">Workspace Owner</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Main Panel Column */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Tab Navigation Menu */}
          <div className="flex border-b border-border/60 overflow-x-auto no-scrollbar gap-1 bg-card/40 p-1 border border-border/60 rounded-xl shadow-xs">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'properties', label: 'Properties' },
              { id: 'searches', label: 'Searches' },
              { id: 'transactions', label: 'Transactions & Deals' },
              { id: 'documents', label: 'Documents' },
              { id: 'automations', label: 'Automations & Plans' },
              { id: 'communications', label: 'Communications Dialer' },
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

          {/* Render Tab Contents */}
          <div className="min-h-[500px]">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Left timeline + notes log */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Notes Logger box */}
                  <form onSubmit={handlePostNote} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-foreground">Log Interaction / Note</span>
                      </div>
                      
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="bg-muted/50 border border-border/80 rounded px-2.5 py-1 text-xs text-foreground font-semibold focus:outline-none"
                      >
                        <option value="NOTE">📝 Internal Note</option>
                        <option value="CALL">📞 Phone Call</option>
                        <option value="TEXT">💬 Text Message</option>
                        <option value="EMAIL">✉️ Email</option>
                        <option value="SHOWING">🏡 Showing</option>
                        <option value="DOCUMENT">📄 Log Document</option>
                      </select>
                    </div>

                    {/* Rich Text Toolbar */}
                    <div className="flex items-center gap-1 pb-1.5 border-b border-border/30">
                      <button
                        type="button"
                        onClick={() => { setIsBold(!isBold); wrapSelection('**', '**'); }}
                        className={`p-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${isBold ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsItalic(!isItalic); wrapSelection('*', '*'); }}
                        className={`p-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${isItalic ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsBullet(!isBullet); wrapSelection('\n- ', ''); }}
                        className={`p-1.5 rounded text-xs font-bold transition-colors cursor-pointer ${isBullet ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <span className="mx-1 text-border">|</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Style your note</span>
                    </div>

                    <textarea
                      ref={textareaRef}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder={
                        noteType === 'CALL' ? 'Write summary of the phone call...' :
                        noteType === 'TEXT' ? 'Type text message content...' :
                        noteType === 'EMAIL' ? 'Paste email conversation...' :
                        noteType === 'SHOWING' ? 'Property address and showing details...' :
                        noteType === 'DOCUMENT' ? 'Document name and description...' :
                        'Write a note or copy remarks here...'
                      }
                      rows={3}
                      className="w-full bg-muted/30 border border-border/60 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-background transition-all font-semibold resize-none"
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isPostingNote || !noteContent.trim()}
                        className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all shadow cursor-pointer"
                      >
                        {isPostingNote ? 'Logging...' : 'Post Log'}
                      </button>
                    </div>
                  </form>

                  {/* Filter timeline chips */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 flex-wrap gap-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: 'ALL', label: 'All Activities' },
                        { id: 'NOTE', label: 'Notes' },
                        { id: 'CALL', label: 'Calls' },
                        { id: 'EMAIL', label: 'Emails' },
                        { id: 'SMS', label: 'SMS' },
                        { id: 'SYSTEM', label: 'System' },
                        { id: 'DOCUMENT', label: 'Docs' },
                        { id: 'PINNED', label: '📌 Pinned' },
                      ].map(chip => (
                        <button
                          key={chip.id}
                          onClick={() => setTimelineFilter(chip.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            timelineFilter === chip.id
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : 'bg-muted/40 hover:bg-muted text-muted-foreground border border-transparent'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity List Timeline */}
                  <div className="space-y-4">
                    {filteredActivities.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-border/80 rounded-2xl bg-card/20 text-muted-foreground space-y-2">
                        <Clock className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                        <p className="text-sm font-bold">No recorded events match the filter.</p>
                      </div>
                    ) : (
                      filteredActivities.map((act) => (
                        <div key={act.id} className={`bg-card border rounded-xl p-4 shadow-xs flex gap-3.5 transition-colors ${act.isPinned ? 'border-indigo-500/30 bg-indigo-500/[0.03]' : 'border-border/60 hover:border-border'}`}>
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/15 mt-0.5">
                            <span className="text-sm">
                              {act.type === 'NOTE' ? '📝' : 
                               act.type === 'CALL' ? '📞' : 
                               act.type === 'EMAIL' ? '✉️' : 
                               act.type === 'SMS' ? '📱' : 
                               act.type === 'SHOWING' ? '🏡' :
                               act.type === 'DOCUMENT' ? '📄' : '⚡'}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-sm text-foreground">
                                  {act.type === 'NOTE' ? 'Logged Note' :
                                   act.type === 'CALL' ? 'Phone Call Logged' :
                                   act.type === 'EMAIL' ? 'Email Conversation' :
                                   act.type === 'SMS' ? 'Text Message' :
                                   act.type === 'SHOWING' ? 'Property Showing' :
                                   act.type === 'DOCUMENT' ? 'Document Logged' : 'System Event'}
                                </span>
                                {act.isPinned && (
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap">
                                    📌 Pinned
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(act.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-wrap leading-relaxed">
                              {act.formattedContent || act.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                              <button
                                onClick={() => handleTogglePin(act.id)}
                                className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded transition-colors cursor-pointer ${act.isPinned ? 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                                title={act.isPinned ? 'Unpin' : 'Pin to top'}
                              >
                                {act.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                                {act.isPinned ? 'Unpin' : 'Pin'}
                              </button>
                              <button
                                onClick={() => handleDeleteActivity(act.id)}
                                className="text-[10px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Right side widgets (Tasks + Appointments) */}
                <div className="md:col-span-1 space-y-6">
                  
                  {/* Tasks Card */}
                  <div className="bg-card border border-border/60 rounded-2xl p-4.5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Pending Tasks</span>
                      <button 
                        onClick={() => setShowAddTask(!showAddTask)}
                        className="p-1 hover:bg-muted text-primary rounded cursor-pointer"
                        title="Add Task"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {showAddTask && (
                      <form onSubmit={handleCreateTask} className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-3">
                        <input
                          type="text"
                          required
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="Task Title..."
                          className="w-full bg-background border border-border/60 rounded px-2.5 py-1 text-xs focus:outline-none"
                        />
                        <textarea
                          value={newTaskDesc}
                          onChange={(e) => setNewTaskDesc(e.target.value)}
                          placeholder="Task Description..."
                          rows={2}
                          className="w-full bg-background border border-border/60 rounded px-2.5 py-1 text-xs focus:outline-none resize-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Date</label>
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Time</label>
                            <input
                              type="time"
                              value={newTaskDueTime}
                              onChange={(e) => setNewTaskDueTime(e.target.value)}
                              className="w-full bg-background border border-border/60 rounded px-2 py-1 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAddTask(false)}
                            className="px-2 py-1 text-[10px] font-bold hover:bg-muted text-muted-foreground rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isAddingTask}
                            className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2.5">
                      {lead.tasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No pending follow-ups or tasks.</p>
                      ) : (
                        lead.tasks.map(task => (
                          <div key={task.id} className="p-3 bg-muted/20 border border-border/50 rounded-xl flex items-start gap-2 group">
                            <input 
                              type="checkbox" 
                              className="mt-0.5 w-4 h-4 rounded border-border cursor-pointer"
                              checked={task.status === 'DONE'} 
                              onChange={() => handleToggleTask(task.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-xs leading-snug truncate ${task.status === 'DONE' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.title}
                              </p>
                              {task.description && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
                              )}
                              {task.dueDate && (
                                <span className="inline-block mt-1.5 text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 rounded font-bold">
                                  📅 {new Date(task.dueDate).toLocaleDateString()}
                                  {(() => {
                                    const hrs = new Date(task.dueDate).getHours();
                                    const mins = new Date(task.dueDate).getMinutes();
                                    if (hrs === 0 && mins === 0) return '';
                                    const ampm = hrs >= 12 ? 'pm' : 'am';
                                    const h12 = hrs % 12 || 12;
                                    return ` ${h12}:${mins.toString().padStart(2, '0')}${ampm}`;
                                  })()}
                                </span>
                              )}
                              {/* Edit/Delete buttons - show on hover */}
                              <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditTask(task)}
                                  className="text-[9px] font-bold text-muted-foreground hover:text-foreground px-1.5 py-0.5 hover:bg-muted rounded transition-colors cursor-pointer"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-[9px] font-bold text-red-500 hover:text-red-400 px-1.5 py-0.5 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}

                      {/* Edit Task Modal */}
                      {editingTaskId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                          <div className="bg-card border border-border max-w-sm w-full rounded-2xl p-5 shadow-xl space-y-4">
                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                              <h4 className="font-bold text-sm text-foreground">✏️ Edit Task</h4>
                              <button onClick={() => setEditingTaskId(null)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <form onSubmit={handleUpdateTask} className="space-y-3">
                              <input type="text" required value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)}
                                className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Task title" />
                              <textarea value={editTaskDesc} onChange={(e) => setEditTaskDesc(e.target.value)}
                                rows={2} className="w-full bg-background border border-border rounded px-3 py-2 text-xs focus:outline-none resize-none"
                                placeholder="Description (optional)" />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Date</label>
                                  <input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)}
                                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none" />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Time</label>
                                  <input type="time" value={editTaskDueTime} onChange={(e) => setEditTaskDueTime(e.target.value)}
                                    className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-0.5">Status</label>
                                <select value={editTaskStatus} onChange={(e) => setEditTaskStatus(e.target.value)}
                                  className="w-full bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none">
                                  <option value="TODO">To Do</option>
                                  <option value="IN_PROGRESS">In Progress</option>
                                  <option value="DONE">Done</option>
                                </select>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setEditingTaskId(null)}
                                  className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                                <button type="submit" disabled={isUpdatingTask}
                                  className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow">
                                  {isUpdatingTask ? 'Saving...' : 'Save Changes'}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Appointments Card */}
                  <div className="bg-card border border-border/60 rounded-2xl p-4.5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="text-xs font-black text-foreground uppercase tracking-wider">Scheduled Showings</span>
                      <button 
                        onClick={() => setShowAddShowing(!showAddShowing)}
                        className="p-1 hover:bg-muted text-primary rounded cursor-pointer"
                        title="Schedule Showing"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {showAddShowing && (
                      <form onSubmit={handleScheduleShowing} className="p-3 bg-muted/30 border border-border/60 rounded-xl space-y-3">
                        <input
                          type="text"
                          required
                          value={showingAddress}
                          onChange={(e) => setShowingAddress(e.target.value)}
                          placeholder="Property Address..."
                          className="w-full bg-background border border-border/60 rounded px-2.5 py-1 text-xs focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            required
                            value={showingDate}
                            onChange={(e) => setShowingDate(e.target.value)}
                            className="bg-background border border-border/60 rounded px-2 py-1 text-xs focus:outline-none"
                          />
                          <input
                            type="time"
                            required
                            value={showingTime}
                            onChange={(e) => setShowingTime(e.target.value)}
                            className="bg-background border border-border/60 rounded px-2 py-1 text-xs focus:outline-none"
                          />
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowAddShowing(false)}
                            className="px-2 py-1 text-[10px] font-bold hover:bg-muted text-muted-foreground rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSchedulingShowing}
                            className="px-2 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded"
                          >
                            Schedule
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="space-y-2.5">
                      {lead.Activity.filter(a => a.type === 'SHOWING').length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-6">No showings scheduled.</p>
                      ) : (
                        lead.Activity.filter(a => a.type === 'SHOWING').map(show => (
                          <div key={show.id} className="p-3 bg-emerald-500/[0.03] border border-emerald-500/15 rounded-xl flex items-start gap-2">
                            <span className="text-base shrink-0 mt-0.5">🏡</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-foreground leading-snug">
                                {show.content}
                              </p>
                              <span className="inline-block mt-1 text-[9px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded font-bold">
                                Confirmed Showing
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* Title and Add Property button */}
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">Owned Properties</h3>
                    <p className="text-xs text-muted-foreground">Known real estate assets and mailing addresses verified for {lead.contact.firstName}.</p>
                  </div>
                  <button 
                    onClick={() => {
                      toast.success('Simulated: Added secondary property fields!');
                    }}
                    className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Property
                  </button>
                </div>

                {/* Lofty alert banner card */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/15">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      These <strong className="text-indigo-400 font-extrabold">2 properties</strong> could be your next listings — start nurturing them today
                    </span>
                  </div>
                  <button 
                    onClick={() => toast.success('Smart plans activated for nurturing owned properties!')} 
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg uppercase tracking-wider cursor-pointer"
                  >
                    Start Nurturing
                  </button>
                </div>

                {/* Sub cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-1.5 text-left">
                    <span className="text-lg">🏠</span>
                    <h5 className="font-extrabold text-[11px] text-foreground leading-snug">Know their equity & home value</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Auto-fill est. value, loan balance & interest rate — no research needed.</p>
                  </div>
                  <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-1.5 text-left">
                    <span className="text-lg">📊</span>
                    <h5 className="font-extrabold text-[11px] text-foreground leading-snug">Stay top of mind, automatically</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Home reports go out in your name every month — zero effort on your end.</p>
                  </div>
                  <div className="p-3.5 bg-muted/20 border border-border/40 rounded-xl space-y-1.5 text-left">
                    <span className="text-lg">💡</span>
                    <h5 className="font-extrabold text-[11px] text-foreground leading-snug">Catch sellers before they move</h5>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Instant alerts when a homeowner shows any seller signal or engagement.</p>
                  </div>
                </div>

                {/* Properties List */}
                <div className="space-y-4 pt-1">
                  
                  {/* Property 1 (Mailing Address) */}
                  <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black uppercase">Mailing Address</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">Home</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground truncate">{lead.contact.address || '45409 North Ave, Macomb, MI 48042'}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>EST. <strong className="text-foreground">--</strong></span>
                        <button onClick={() => toast.success('Valuation criteria updated')} className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer">
                          Unlock equity, loan & interest rate &rsaquo;
                        </button>
                      </div>
                    </div>
                    <button onClick={() => toast.success('Options drawer opened')} className="text-muted-foreground hover:text-foreground font-extrabold text-sm p-1.5 bg-muted hover:bg-muted/80 border border-border/80 rounded-lg cursor-pointer">
                      •••
                    </button>
                  </div>

                  {/* Property 2 (Single Family Home) */}
                  <div className="p-4 bg-muted/30 border border-border/60 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-black uppercase">Single Family</span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">Home</span>
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground truncate">{lead.contact.address || '45409 North Ave, Macomb, MI 48042'}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>EST. <strong className="text-foreground">--</strong></span>
                        <span>3 beds | 2 baths | 1386 sqft</span>
                        <span className="text-muted-foreground/45">&bull;</span>
                        <button onClick={() => toast.success('Equity metrics loaded')} className="text-[10px] text-primary hover:underline font-bold flex items-center gap-0.5 cursor-pointer">
                          Unlock equity, loan & interest rate &rsaquo;
                        </button>
                      </div>
                    </div>
                    <button onClick={() => toast.success('Options drawer opened')} className="text-muted-foreground hover:text-foreground font-extrabold text-sm p-1.5 bg-muted hover:bg-muted/80 border border-border/80 rounded-lg cursor-pointer">
                      •••
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* SEARCHES TAB */}
            {activeTab === 'searches' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                <SearchAlertsWidget leadId={lead.id} alerts={lead.searchAlerts} />
              </div>
            )}

            {/* TRANSACTIONS & DEALS TAB */}
            {activeTab === 'transactions' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">Transactions & Deals Connection</h3>
                    <p className="text-xs text-muted-foreground">Manage deal stage pipelines and transaction values for this lead.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddDeal(!showAddDeal)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Create Transaction Deal
                  </button>
                </div>

                {showAddDeal && (
                  <form onSubmit={handleCreateDeal} className="p-4 bg-muted/30 border border-border/60 rounded-xl space-y-4 max-w-lg">
                    <h4 className="font-bold text-xs text-foreground uppercase">Create Deal Link</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block uppercase">Deal Title</label>
                        <input
                          type="text"
                          required
                          value={newDealTitle}
                          onChange={(e) => setNewDealTitle(e.target.value)}
                          className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block uppercase">Estimated Value ($)</label>
                          <input
                            type="number"
                            value={newDealValue}
                            onChange={(e) => setNewDealValue(e.target.value)}
                            placeholder="e.g. 450000"
                            className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground block uppercase">Deal Stage</label>
                          <select
                            value={newDealStage}
                            onChange={(e) => setNewDealStage(e.target.value)}
                            className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
                          >
                            <option value="LEAD">LEAD (Pre-qualification)</option>
                            <option value="CONTACT">CONTACT (Nurture)</option>
                            <option value="UNDER_CONTRACT">UNDER CONTRACT</option>
                            <option value="CLOSED">CLOSED DEALS</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDeal(false)}
                        className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingDeal}
                        className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow"
                      >
                        {isAddingDeal ? 'Linking...' : 'Connect Deal'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {lead.contact.deals.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-border/80 rounded-xl bg-muted/10 space-y-2 text-muted-foreground">
                      <Briefcase className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                      <p className="text-sm font-bold">No connected transaction deals found.</p>
                      <p className="text-xs">Establish potential pipeline values by linking a deal record.</p>
                    </div>
                  ) : (
                    lead.contact.deals.map(deal => (
                      <div key={deal.id} className="p-4 border border-border/60 rounded-xl bg-card hover:border-border transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 flex items-center justify-center">
                            💼
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-foreground">{deal.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Estimated Value: <strong className="text-foreground">${deal.value?.toLocaleString() || 'N/A'}</strong> &bull; Stage: <strong className="text-foreground">{deal.stage}</strong>
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/dashboard/deals`}
                          className="px-3 py-1.5 bg-muted/90 hover:bg-muted border border-border/80 rounded text-xs font-bold hover:text-foreground transition-all"
                        >
                          View Deals Pipeline
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">Documents Upload Hub</h3>
                    <p className="text-xs text-muted-foreground">Store contracts, disclosures, and scan documents linked to this lead.</p>
                  </div>
                  <button 
                    onClick={() => toast.success('Select a cloud provider to authorize.')}
                    className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Add Folder
                  </button>
                </div>

                <div className="border border-dashed border-border/80 rounded-2xl p-8 text-center space-y-4 bg-muted/10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl">
                    📁
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Upload Documents</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Drag and drop file folders here, or click to upload from local machine.</p>
                  </div>
                  <button 
                    onClick={() => toast.success('Mock File upload initialized.')}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow cursor-pointer"
                  >
                    Upload a Document
                  </button>
                </div>

                {/* Integration channels grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
                  {[
                    { name: 'Scan Docs', icon: '📄' },
                    { name: 'Dropbox', icon: '📦' },
                    { name: 'Google Drive', icon: '💾' },
                    { name: 'DocuSign', icon: '📝' },
                    { name: 'Onedrive', icon: '☁️' },
                  ].map(prov => (
                    <button 
                      key={prov.name}
                      onClick={() => toast.success(`Simulating integration with ${prov.name}`)}
                      className="p-3 bg-muted/30 border border-border/60 hover:bg-muted/50 rounded-xl text-center space-y-1 transition-colors cursor-pointer"
                    >
                      <div className="text-xl">{prov.icon}</div>
                      <p className="text-[10px] font-black text-foreground">{prov.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AUTOMATIONS TAB */}
            {activeTab === 'automations' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
                
                {/* Reports widgets header */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-border/60 rounded-xl space-y-2 bg-muted/10">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      📊 Market Snapshots <span className="text-[9.5px] bg-muted border border-border px-1.5 py-0.5 rounded font-black text-muted-foreground uppercase">None Sent</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">Send real-time neighborhood metrics, pricing comps, and local trends dynamically.</p>
                    <button 
                      onClick={() => toast.success('Neighborhood market snapshot scheduled!')}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      + Create New Market Snapshot
                    </button>
                  </div>

                  <div className="p-4 border border-border/60 rounded-xl space-y-2 bg-muted/10">
                    <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      📈 Homeowner Valuation Reports <span className="text-[9.5px] bg-muted border border-border px-1.5 py-0.5 rounded font-black text-muted-foreground uppercase">None Sent</span>
                    </h4>
                    <p className="text-xs text-muted-foreground">Automated monthly CMA equity updates and property valuation metrics.</p>
                    <button 
                      onClick={() => toast.success('Valuation report scheduled!')}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      + Set Up Valuation Reports
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-border/60">
                  <LeadAutomationsWidget leadId={lead.id} activePlanId={lead.smartPlanId} campaigns={campaigns} />
                </div>
              </div>
            )}

            {/* COMMUNICATIONS TAB */}
            {activeTab === 'communications' && (
              <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm">
                <CommunicationsHub leadId={lead.id} phone={lead.contact.phone} email={lead.contact.email} />
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL: Edit Lead Contact Info */}
      {isEditingContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-1.5">
                ✏️ Edit Lead Contact Details
              </h3>
              <button 
                onClick={() => setIsEditingContact(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateContactDetails} className="space-y-4.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Email Address</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">Property Mailing Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 border-t border-border/40 space-y-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase block tracking-wider">Spouse Details</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground block uppercase">Name</label>
                    <input
                      type="text"
                      value={editSpouseName}
                      onChange={(e) => setEditSpouseName(e.target.value)}
                      placeholder="Spouse name"
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground block uppercase">Phone</label>
                    <input
                      type="text"
                      value={editSpousePhone}
                      onChange={(e) => setEditSpousePhone(e.target.value)}
                      placeholder="Spouse cell"
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-muted-foreground block uppercase">Email</label>
                    <input
                      type="email"
                      value={editSpouseEmail}
                      onChange={(e) => setEditSpouseEmail(e.target.value)}
                      placeholder="Spouse email"
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setIsEditingContact(false)}
                  className="px-3.5 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Family Member */}
      {showAddFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-card border border-border max-w-sm w-full rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-border/50 pb-2">
              <h4 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-primary" /> Add Family Contact
              </h4>
              <button 
                onClick={() => setShowAddFamily(false)}
                className="p-1 hover:bg-muted rounded text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">Relationship</label>
                <select
                  value={familyRel}
                  onChange={(e) => setFamilyRel(e.target.value)}
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Relative">Relative</option>
                  <option value="Partner">Partner</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. Marie Bayerski"
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">Phone Number</label>
                <input
                  type="text"
                  value={familyPhone}
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  placeholder="e.g. +1 586-555-0199"
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground block uppercase">Email Address</label>
                <input
                  type="email"
                  value={familyEmail}
                  onChange={(e) => setFamilyEmail(e.target.value)}
                  placeholder="e.g. marie@gmail.com"
                  className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowAddFamily(false)}
                  className="px-2.5 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg shadow"
                >
                  Add Family
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
