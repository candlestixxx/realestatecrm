'use client';

import { Share2, Globe, Send } from 'lucide-react';

export function IntegrationWorkflow() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* Lofty Landing Page */}
      <div className="bg-background border border-border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary/10 rounded-lg">
            <Globe className="w-5 h-5 text-secondary" />
          </div>
          <h3 className="font-bold text-lg">Lofty Landing Page</h3>
        </div>
        <p className="text-sm text-muted-foreground flex-1">
          Automatically create or update the Lofty property site with the newly generated high-res images and 16:9 walkthrough video.
        </p>
        <div className="bg-muted/20 border border-border rounded-md p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex justify-between"><span>Status:</span> <span className="font-semibold text-amber-500">Pending Setup</span></div>
          <div className="flex justify-between"><span>Target:</span> <span>123-main-st.excellegacy.com</span></div>
        </div>
        <button className="w-full bg-secondary text-secondary-foreground py-2 rounded-md font-semibold hover:bg-secondary/90 transition-colors">
          Sync to Lofty
        </button>
      </div>

      {/* Social Publishing */}
      <div className="bg-background border border-border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-bold text-lg">Social Distribution</h3>
        </div>
        <p className="text-sm text-muted-foreground flex-1">
          Generate captions and distribute your 9:16 reels and branded graphics to Facebook, Instagram, and LinkedIn.
        </p>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border bg-background text-primary" />
            <span className="text-sm">Facebook Page</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border bg-background text-primary" />
            <span className="text-sm">Instagram Reels</span>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-border bg-background text-primary" />
            <span className="text-sm">LinkedIn Post</span>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors">
          <Send className="w-4 h-4" />
          Draft Social Posts
        </button>
      </div>

    </div>
  );
}
