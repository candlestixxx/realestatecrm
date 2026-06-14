'use client';

import { useState, useEffect } from 'react';
import { ImageVariant } from '@/lib/media-pipeline-state';
import { Check, X, Image as ImageIcon, Wand2, MonitorPlay } from 'lucide-react';

interface ImageWorkflowProps {
  listingId?: string;
}

export function ImageWorkflow({ listingId }: ImageWorkflowProps) {
  const [variants, setVariants] = useState<ImageVariant[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sourcePath, setSourcePath] = useState('\\\\excelserver\\WeichertShare\\1 LISTINGS\\2026 Listings\\123_Main_St');
  const [address, setAddress] = useState('123 Main St');

  useEffect(() => {
    if (!listingId) return;

    const loadWorkflow = async () => {
      try {
        const response = await fetch(`/api/workflows/marketing-media:${listingId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.snapshot?.draft) {
            const draft = data.snapshot.draft;
            if (draft.sourceFolderPath) {
              setSourcePath(draft.sourceFolderPath);
            }
            if (draft.propertyAddress) {
              setAddress(draft.propertyAddress);
            }
            // If we have synced socialCaption or assets, we can pre-populate mock variants
            if (draft.socialCaption) {
              setVariants([
                {
                  id: '1',
                  sourceUrl: '/mock-source.jpg',
                  generatedUrl: '/mock-day.jpg',
                  stage: 'JUST_LISTED',
                  ratio: '16:9',
                  style: 'DAY',
                  status: 'REVIEW',
                  prompt: `Bright, luxury front exterior of ${draft.propertyAddress}, sunny day, blue sky.`,
                  caption: draft.socialCaption,
                },
                {
                  id: '2',
                  sourceUrl: '/mock-source.jpg',
                  generatedUrl: '/mock-night.jpg',
                  stage: 'JUST_LISTED',
                  ratio: '16:9',
                  style: 'NIGHT',
                  status: 'REVIEW',
                  prompt: `Luxury front exterior of ${draft.propertyAddress}, twilight, warm glowing interior lights.`,
                  caption: `${draft.socialCaption} - Evening edition.`,
                }
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load media pipeline workflow:', err);
      }
    };

    loadWorkflow();
  }, [listingId]);

  const handleGenerate = () => {
    setIsGenerating(true);
    // Mock generation delay
    setTimeout(() => {
      setVariants([
        {
          id: '1',
          sourceUrl: '/mock-source.jpg',
          generatedUrl: '/mock-day.jpg',
          stage: 'JUST_LISTED',
          ratio: '16:9',
          style: 'DAY',
          status: 'REVIEW',
          prompt: `Bright, luxury front exterior of ${address}, sunny day, blue sky.`,
          caption: `Just Listed! Beautiful new property at ${address} ready for you.`,
        },
        {
          id: '2',
          sourceUrl: '/mock-source.jpg',
          generatedUrl: '/mock-night.jpg',
          stage: 'JUST_LISTED',
          ratio: '16:9',
          style: 'NIGHT',
          status: 'REVIEW',
          prompt: `Luxury front exterior of ${address}, twilight, warm glowing interior lights.`,
          caption: `Evening elegance at ${address}. Welcome home.`,
        }
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const updateStatus = (id: string, status: 'APPROVED' | 'REJECTED') => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Image Generation
          </h3>
          <p className="text-sm text-muted-foreground">Select a source photo and generate branded Day/Night variants via Magnific AI.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50"
        >
          {isGenerating ? <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> : <Wand2 className="w-4 h-4" />}
          Generate Variants
        </button>
      </div>

      <div className="bg-muted/10 border border-border rounded-xl p-6">
        <div className="mb-4">
          <label className="text-sm font-medium">Source Directory</label>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground bg-background border border-border px-3 py-2 rounded-md">
            <MonitorPlay className="w-4 h-4" />
            <span>{sourcePath}</span>
          </div>
        </div>

        {variants.length === 0 && !isGenerating && (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <p className="text-muted-foreground">No variants generated yet.</p>
          </div>
        )}

        {variants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {variants.map(variant => (
              <div key={variant.id} className="border border-border bg-background rounded-xl overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-video bg-muted relative flex items-center justify-center">
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">
                    {variant.style} - {variant.ratio}
                  </div>
                  <div className="text-muted-foreground text-xs">[ Mock Generated Image Preview ]</div>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Prompt</div>
                    <p className="text-sm border border-border rounded-md p-2 bg-muted/20 line-clamp-2">{variant.prompt}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                      variant.status === 'APPROVED' ? 'bg-green-500/20 text-green-500' :
                      variant.status === 'REJECTED' ? 'bg-red-500/20 text-red-500' :
                      'bg-secondary/20 text-secondary'
                    }`}>
                      {variant.status}
                    </span>

                    {variant.status === 'REVIEW' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(variant.id, 'REJECTED')} className="p-2 border border-border rounded-md hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(variant.id, 'APPROVED')} className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
