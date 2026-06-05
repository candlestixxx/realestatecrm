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
  const [isEditing, setIsEditing] = useState(false);
  const [tags, setTags] = useState(initialTags || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateLeadTagsAction(leadId, tags);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Tags updated!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to save tags.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hashtags</span>
        <button
          onClick={() => {
            if (isEditing) handleSave();
            else setIsEditing(true);
          }}
          disabled={isSaving}
          className="text-xs text-primary hover:underline font-semibold"
        >
          {isSaving ? 'Saving...' : isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g. #buyer, #investor"
            className="flex-1 text-xs bg-muted/30 border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            autoFocus
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 min-h-[24px]">
          {tags.trim() ? (
            tags.split(',').map((tag) => {
              const cleanTag = tag.trim();
              if (!cleanTag) return null;
              return (
                <span
                  key={cleanTag}
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-tighter"
                >
                  {cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`}
                </span>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground italic">No hashtags added yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
