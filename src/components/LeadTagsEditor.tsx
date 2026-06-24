'use client';

import { useState } from 'react';
import { updateLeadTagsAction } from '@/lib/actions/lead';
import toast from 'react-hot-toast';

export default function LeadTagsEditor({
  leadId,
  initialTags,
}: {
  leadId: string;
  initialTags: string | null;
}) {
  const [tagsList, setTagsList] = useState<string[]>(() => {
    if (!initialTags) return [];
    return initialTags.split(',').map(t => t.trim()).filter(Boolean);
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const saveTags = async (updatedList: string[]) => {
    setIsSaving(true);
    const tagsString = updatedList.join(', ');
    try {
      const res = await updateLeadTagsAction(leadId, tagsString);
      if (res && res.error) {
        toast.error(res.error);
        return false;
      } else {
        setTagsList(updatedList);
        return true;
      }
    } catch (err) {
      toast.error('Failed to update hashtags.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = async () => {
    const cleanTag = newTagInput.trim();
    if (!cleanTag) {
      setIsAdding(false);
      return;
    }

    if (tagsList.includes(cleanTag)) {
      toast.error('Tag already exists.');
      setNewTagInput('');
      setIsAdding(false);
      return;
    }

    const nextList = [...tagsList, cleanTag];
    const ok = await saveTags(nextList);
    if (ok) {
      toast.success(`Added tag: ${cleanTag}`);
      setNewTagInput('');
      setIsAdding(false);
    }
  };

  const handleDeleteTag = async (tagToDelete: string) => {
    const nextList = tagsList.filter(t => t !== tagToDelete);
    const ok = await saveTags(nextList);
    if (ok) {
      toast.success(`Removed tag: ${tagToDelete}`);
    }
  };

  return (
    <div className="space-y-2 select-none">
      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tag / Hashtags</span>
      
      <div className="flex flex-wrap gap-1.5 items-center min-h-[30px]">
        {/* Render existing hashtag chips */}
        {tagsList.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 pl-2 pr-1.5 py-0.5 text-[10px] font-bold rounded-lg bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter"
          >
            <span>{tag}</span>
            <button
              onClick={() => handleDeleteTag(tag)}
              disabled={isSaving}
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-primary/20 transition-colors text-[8px] font-black"
              title="Delete hashtag"
            >
              ✕
            </button>
          </span>
        ))}

        {/* Inline Input Creator */}
        {isAdding ? (
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddTag();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewTagInput('');
              }
            }}
            onBlur={handleAddTag}
            placeholder="New hashtag..."
            className="w-24 text-[10px] font-bold bg-muted/40 border border-border rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary h-[22px]"
            autoFocus
            disabled={isSaving}
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            disabled={isSaving}
            className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer h-[22px]"
            title="Add new tag"
          >
            + Add
          </button>
        )}

        {isSaving && (
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping ml-1"></span>
        )}
      </div>
    </div>
  );
}
