import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function SortableBlock({ id, block, index, handleRemoveBlock, handleBlockChange }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border border-border rounded-xl bg-muted/10 space-y-4 group ${
        isDragging ? 'opacity-50 ring-2 ring-primary shadow-2xl' : ''
      }`}
    >
      <div className="flex justify-between items-center pb-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            {block.type}
          </span>
        </div>
        <button
          onClick={() => handleRemoveBlock(index)}
          className="text-xs text-red-500 hover:text-red-600 font-bold opacity-30 group-hover:opacity-100 transition-opacity"
        >
          Remove Block
        </button>
      </div>

      {/* Block Content Editor Form Inputs */}
      {block.type === 'HEADER' && (
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => handleBlockChange(index, 'title', e.target.value)}
            placeholder="Header Title"
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            value={block.subtitle || ''}
            onChange={(e) => handleBlockChange(index, 'subtitle', e.target.value)}
            placeholder="Header Subtitle / Tagline"
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {block.type === 'VIDEO' && (
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => handleBlockChange(index, 'title', e.target.value)}
            placeholder="Video Section Title"
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            value={block.videoUrl || ''}
            onChange={(e) => handleBlockChange(index, 'videoUrl', e.target.value)}
            placeholder="YouTube Embed URL (e.g. https://www.youtube.com/embed/...)"
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {block.type === 'PROPERTY' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={block.address || ''}
              onChange={(e) => handleBlockChange(index, 'address', e.target.value)}
              placeholder="MLS Listing Address"
              className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              value={block.price || ''}
              onChange={(e) => handleBlockChange(index, 'price', Number(e.target.value))}
              placeholder="Price ($)"
              className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={block.beds || ''}
              onChange={(e) => handleBlockChange(index, 'beds', Number(e.target.value))}
              placeholder="Beds Count"
              className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
            <input
              type="number"
              value={block.baths || ''}
              onChange={(e) => handleBlockChange(index, 'baths', Number(e.target.value))}
              placeholder="Baths Count"
              className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>
          <textarea
            value={block.remarks || ''}
            onChange={(e) => handleBlockChange(index, 'remarks', e.target.value)}
            placeholder="MLS Property Remarks / Highlights..."
            rows={2}
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs resize-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}

      {block.type === 'LEAD_CAPTURE' && (
        <div>
          <input
            type="text"
            value={block.ctaText || ''}
            onChange={(e) => handleBlockChange(index, 'ctaText', e.target.value)}
            placeholder="CTA Text for Lead Capture Form Button"
            className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
}
