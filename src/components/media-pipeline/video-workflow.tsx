'use client';

import { useState } from 'react';
import { Video } from 'lucide-react';

export function VideoWorkflow() {
  const [selectedFormat, setSelectedFormat] = useState<'9:16' | '16:9'>('9:16');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video Assembly
          </h3>
          <p className="text-sm text-muted-foreground">Select clips and assemble branded property videos for social media.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-muted/10 border border-border rounded-xl p-6 flex flex-col items-center justify-center min-h-[300px] border-dashed">
          <div className="text-muted-foreground mb-4">No clips selected from source.</div>
          <button className="bg-secondary/20 text-secondary border border-secondary/50 px-4 py-2 rounded-md text-sm font-semibold hover:bg-secondary/30 transition-colors">
            Scan Source Folder for Media
          </button>
        </div>

        <div className="bg-background border border-border rounded-xl p-6 space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Format</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFormat('9:16')}
                className={`flex-1 py-2 rounded-md text-sm font-bold border transition-colors ${selectedFormat === '9:16' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'}`}
              >
                9:16 Reel
              </button>
              <button
                onClick={() => setSelectedFormat('16:9')}
                className={`flex-1 py-2 rounded-md text-sm font-bold border transition-colors ${selectedFormat === '16:9' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'}`}
              >
                16:9 Wide
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Enhancements</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
                <span className="text-sm">Include Intro/Outro Branding</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
                <span className="text-sm">Add Auto-Captions</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background" />
                <span className="text-sm">Add Luxury Background Music</span>
              </label>
            </div>
          </div>

          <button className="w-full bg-primary text-primary-foreground py-3 rounded-md font-bold hover:bg-primary/90 transition-colors mt-auto opacity-50 cursor-not-allowed">
            Render Preview
          </button>
        </div>
      </div>
    </div>
  );
}
