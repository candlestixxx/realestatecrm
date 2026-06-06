'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addLeadToSegmentAction } from '@/lib/actions/segment';
import { updateLeadTagsAction } from '@/lib/actions/lead';
import { addTaskAction } from '@/lib/actions/task';
import AddTaskModal from './AddTaskModal';
import toast from 'react-hot-toast';

type SegmentOption = {
  id: string;
  name: string;
};

export default function LeadQuickActions({
  leadId,
  leadName,
  segments,
  workspaces,
  users,
  onNavigate,
}: {
  leadId: string;
  leadName: string;
  segments: SegmentOption[];
  workspaces: { id: string; name: string }[];
  users: { id: string; name: string | null }[];
  onNavigate?: (tab: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Document upload simulation
  const [uploadFile, setUploadFile] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Appointment mock state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTitle, setAppointmentTitle] = useState('');

  // Transaction mock state
  const [dealTitle, setDealTitle] = useState(`${leadName} Home Purchase`);
  const [dealValue, setDealValue] = useState('450000');

  const handleAddToSegment = async () => {
    if (!selectedSegmentId) return;
    setIsSubmitting(true);
    try {
      const res = await addLeadToSegmentAction(leadId, selectedSegmentId);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Lead added to segment successfully!');
        setActiveModal(null);
        router.refresh();
      }
    } catch (e) {
      toast.error('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeHashtags = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateLeadTagsAction(leadId, newTags);
      if (res && res.error) toast.error(res.error);
      else {
        toast.success('Hashtags updated!');
        setActiveModal(null);
        router.refresh();
      }
    } catch (e) {
      toast.error('Network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadDoc = () => {
    if (!uploadFile) return;
    setIsSubmitting(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        toast.success(`Document "${uploadFile}" uploaded successfully!`);
        setIsSubmitting(false);
        setActiveModal(null);
        setUploadFile('');
        setUploadProgress(0);
      }
    }, 200);
  };

  const handleScheduleAppointment = () => {
    if (!appointmentDate || !appointmentTitle) return;
    toast.success(`Appointment "${appointmentTitle}" scheduled for ${new Date(appointmentDate).toLocaleString()}`);
    setActiveModal(null);
    setAppointmentDate('');
    setAppointmentTitle('');
  };

  const handleCreateDeal = () => {
    toast.success(`Transaction deal "${dealTitle}" created at $${Number(dealValue).toLocaleString()}!`);
    setActiveModal(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/90 transition-colors shadow-sm text-sm flex items-center gap-1 cursor-pointer"
      >
        ⚙️ Actions
        <span className="text-[10px]">&nbsp;▼</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-25" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background shadow-xl z-30 py-2 divide-y divide-border/50 animate-in fade-in slide-in-from-top-2 duration-100">
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('segment');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                📁 Add to Segment
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('tags');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                🏷️ Edit Hashtags
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) onNavigate('workflows');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                🤖 Enroll in Drip Campaign
              </button>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('task');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                📝 Add Follow-up Task
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('deal');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                🏡 Convert to Deal
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigate) onNavigate('deals');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                🔔 Configure Search Alert
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('upload');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                📤 Upload Document / PDF
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('appointment');
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
              >
                📅 Schedule Appointment
              </button>
            </div>
          </div>
        </>
      )}

      {/* Segment Modal */}
      {activeModal === 'segment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Enroll Lead in Segment</h3>
            <p className="text-xs text-muted-foreground mb-4">Select which segment list this lead should belong to.</p>
            <div className="space-y-4">
              <select
                value={selectedSegmentId}
                onChange={(e) => setSelectedSegmentId(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select a Segment --</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-muted rounded text-xs">Cancel</button>
                <button
                  onClick={handleAddToSegment}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded text-xs hover:bg-primary/90"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hashtags Modal */}
      {activeModal === 'tags' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Modify Hashtags</h3>
            <p className="text-xs text-muted-foreground mb-4">Enter comma-separated hashtags for lead tracking.</p>
            <div className="space-y-4">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g. #buyer, #FSBO, #preforeclosure"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-muted rounded text-xs">Cancel</button>
                <button
                  onClick={handleChangeHashtags}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded text-xs hover:bg-primary/90"
                >
                  Save Tags
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {activeModal === 'upload' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Upload Disclosures & Files</h3>
            <p className="text-xs text-muted-foreground mb-4">Attach documents to track details for the deal coordinator.</p>
            <div className="space-y-4">
              <input
                type="text"
                value={uploadFile}
                onChange={(e) => setUploadFile(e.target.value)}
                placeholder="File name (e.g. LeadDisclosures.pdf)"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {isSubmitting && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-muted rounded text-xs">Cancel</button>
                <button
                  onClick={handleUploadDoc}
                  disabled={isSubmitting || !uploadFile}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  Upload File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {activeModal === 'appointment' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Schedule Showing/Appointment</h3>
            <p className="text-xs text-muted-foreground mb-4">Set up a scheduled showing or meeting with the client.</p>
            <div className="space-y-4">
              <input
                type="text"
                value={appointmentTitle}
                onChange={(e) => setAppointmentTitle(e.target.value)}
                placeholder="Appointment Title (e.g., Showing at 123 Elm St)"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-muted rounded text-xs">Cancel</button>
                <button
                  onClick={handleScheduleAppointment}
                  disabled={!appointmentDate || !appointmentTitle}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded text-xs hover:bg-primary/90 disabled:opacity-50"
                >
                  Book Showing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Deal Modal */}
      {activeModal === 'deal' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg mb-2">Convert to Deal / Transaction</h3>
            <p className="text-xs text-muted-foreground mb-4">Establish a transaction folder tracking values and stages.</p>
            <div className="space-y-4">
              <input
                type="text"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="Deal Title"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <input
                type="number"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="Expected Value ($)"
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setActiveModal(null)} className="px-3 py-1.5 hover:bg-muted rounded text-xs">Cancel</button>
                <button
                  onClick={handleCreateDeal}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold rounded text-xs hover:bg-primary/90"
                >
                  Create Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal trigger */}
      {activeModal === 'task' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Create Quick Follow-up Task</h3>
              <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">X</button>
            </div>
            <AddTaskModal
              addTaskAction={addTaskAction}
              workspaces={workspaces}
              users={users}
              leadId={leadId}
              triggerText="Launch Creator"
              triggerClassName="w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:bg-primary/90"
            />
          </div>
        </div>
      )}
    </div>
  );
}
