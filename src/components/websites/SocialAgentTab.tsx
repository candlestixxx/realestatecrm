'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { 
  Globe, CheckCircle, Plus, Eye, MessageSquare, UserCheck, Trash2, Megaphone, Calendar, Rss, List, PlusCircle
} from 'lucide-react';

type SocialPost = {
  id: string;
  date: string;
  platforms: string[];
  image: string;
  text: string;
  status: 'Published' | 'Scheduled' | 'Draft';
  time: string;
  views: number;
  comments: number;
  leads: number;
};

const INITIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    date: 'Sunday, Jul 12',
    platforms: ['facebook', 'instagram', 'linkedin', 'gmb'],
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=350&q=80',
    text: '🚨 Just Listed in St. Clair Shores! 🚨 Welcome to 22513 Avon St – a charming brick ranch in Macomb County with all the right updates. ✨ Updated kitchen perfect for cooking + entertaining. Full basement guest suite for visitors or office space!',
    status: 'Published',
    time: '04:13 PM',
    views: 142,
    comments: 18,
    leads: 6,
  },
  {
    id: 'post-2',
    date: 'Monday, Jul 6',
    platforms: ['facebook', 'instagram', 'linkedin', 'gmb'],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=350&q=80',
    text: 'Big dreams need big yards! 🌲 Welcome to 22513 Avon St – a stunning 3-bedroom home with room for everyone. Host friends in your modern kitchen, treat guests to their own suite downstairs, and unwind or play in your enormous yard!',
    status: 'Published',
    time: '02:58 PM',
    views: 189,
    comments: 24,
    leads: 9,
  },
  {
    id: 'post-3',
    date: 'Friday, Jun 26',
    platforms: ['facebook', 'instagram', 'linkedin', 'gmb'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=350&q=80',
    text: '🏡 New on the Market! 🏡 Discover the charm of this move-in-ready 3-bedroom bungalow at 3547 Alvina Ave, Warren MI! Spacious yard, fresh updates, and the perfect spot to start your next chapter. Ready to make it yours? Schedule a private walkthrough today.',
    status: 'Published',
    time: '10:27 AM',
    views: 95,
    comments: 12,
    leads: 3,
  }
];

const ENGAGEMENTS = [
  { name: 'Lauren Lee', action: 'clicked post link', time: 'Jun 26 at 9:45 PM', avatar: 'L' },
  { name: 'Testing Jossman', action: 'clicked post link', time: 'May 22 at 12:49 AM', avatar: 'T' },
  { name: 'Paul', action: 'registered via post', time: 'Apr 22 at 9:10 AM', avatar: 'P' },
  { name: 'Hannah', action: 'registered via post', time: 'Apr 19 at 10:14 AM', avatar: 'H' },
  { name: 'Frank', action: 'registered via post', time: 'Apr 1 at 3:25 PM', avatar: 'F' },
  { name: 'Katie', action: 'registered via post', time: 'Mar 25 at 2:00 AM', avatar: 'K' },
  { name: 'Alisha Moulton', action: 'registered via post', time: 'Mar 20 at 11:10 AM', avatar: 'A' },
];

export default function SocialAgentTab({ workspaceId }: { workspaceId: string }) {
  const [subTab, setSubTab] = useState<'posts' | 'planner' | 'listing-feed'>('posts');
  const [posts, setPosts] = useState<SocialPost[]>(INITIAL_POSTS);
  const [showWalkthrough, setShowWalkthrough] = useState(true);
  
  // Composer Modal State
  const [showComposer, setShowComposer] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }

    const newPost: SocialPost = {
      id: String(Date.now()),
      date: 'Today, ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      platforms: selectedPlatforms,
      image: uploadedImageUrl || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=350&q=80',
      text: postText,
      status: 'Published',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      views: 0,
      comments: 0,
      leads: 0,
    };

    setPosts([newPost, ...posts]);
    setShowComposer(false);
    setPostText('');
    setUploadedImageUrl('');
    toast.success('Social post published successfully to all connected channels!');
  };

  const handleDeletePost = (id: string) => {
    if (!confirm('Are you sure you want to delete this social post?')) return;
    setPosts(posts.filter(p => p.id !== id));
    toast.success('Post removed from social scheduler.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-foreground animate-fadeIn">
      
      {/* Header and top tab selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            📱 Social Agent <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm">Studio</span>
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-1">
            Publish property updates, smart code riders, and lead valuation pages to all networks with real-time analytics.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-muted/60 border border-border/60 rounded-xl p-1 gap-1 text-[10px] font-black uppercase tracking-wider">
            <button
              onClick={() => setSubTab('planner')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                subTab === 'planner' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Planner
            </button>
            <button
              onClick={() => setSubTab('posts')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                subTab === 'posts' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Posts
            </button>
            <button
              onClick={() => setSubTab('listing-feed')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                subTab === 'listing-feed' ? 'bg-background text-indigo-500 shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Rss className="w-3.5 h-3.5" /> Listing Feed
            </button>
          </div>

          <button
            onClick={() => setShowComposer(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] px-4.5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Create a Post
          </button>
        </div>
      </div>

      {/* Walkthrough Instructions */}
      {showWalkthrough && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-5 relative animate-fadeIn flex flex-col md:flex-row gap-5 shadow-xs">
          <button 
            onClick={() => setShowWalkthrough(false)}
            className="absolute top-3.5 right-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Dismiss walkthrough"
          >
            <span className="text-xs font-black uppercase tracking-wider flex items-center gap-0.5">Dismiss ×</span>
          </button>
          
          <div className="flex-1 space-y-3.5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <span>💡 Quickstart: Social Agent Studio</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs font-semibold text-muted-foreground leading-relaxed">
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Step 1: Check the Planner</span>
                <p>Click the <strong>Planner</strong> tab to review AI-generated posts suggested for your properties. Approve them to schedule, or edit captions and images directly.</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Step 2: Auto-Post Listings</span>
                <p>Navigate to <strong>Listing Feed</strong>. Enable Auto-Posting to automatically publish new MLS listing notifications to GMB, Facebook, Instagram, and LinkedIn.</p>
              </div>
              <div className="space-y-1.5 p-3.5 bg-background/50 border border-border/40 rounded-xl">
                <span className="text-[10px] text-indigo-500 uppercase font-black tracking-wider block">Step 3: Track Engagements</span>
                <p>Open the <strong>Posts</strong> tab. The center panel details who is clicking links or registering on your website direct from social postings.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'posts' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Columns - Social Profiles and Engagements */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Social Profiles Linked List */}
            <div className="bg-card border border-border/60 rounded-2xl p-4.5 shadow-sm space-y-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block border-b border-border/40 pb-1.5">Social Profiles</span>
              
              <div className="space-y-2.5 text-xs font-extrabold text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-black">H</div>
                  <span className="truncate">Hank Mendez</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black">H</div>
                  <span className="truncate">Harry Kourlos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">D</div>
                  <span className="truncate">Don Sobieski</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground/60 hover:text-indigo-500 transition-colors cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span className="text-[10px] uppercase font-black tracking-wider">Add Channel</span>
                </div>
              </div>
            </div>

            {/* Engagements Log panel */}
            <div className="bg-card border border-border/60 rounded-2xl p-4.5 shadow-sm space-y-3.5">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider block border-b border-border/40 pb-1.5">Engagements</span>
              
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {ENGAGEMENTS.map((eng, idx) => (
                  <div key={idx} className="flex gap-2 text-xs">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center font-black text-muted-foreground text-[10px] shrink-0">
                      {eng.avatar}
                    </div>
                    <div className="space-y-0.5 truncate flex-1">
                      <div className="font-extrabold text-foreground leading-tight">{eng.name}</div>
                      <div className="text-[10px] text-muted-foreground font-semibold leading-none">{eng.action}</div>
                      <div className="text-[9px] text-muted-foreground/50 font-medium">{eng.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Center Column - Posts Timeline */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Your Posts Timeline</h3>
            
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:border-border transition-colors">
                  
                  {/* Post top channels list and time */}
                  <div className="px-5 py-3.5 bg-muted/20 border-b border-border/40 flex justify-between items-center">
                    <div className="flex gap-2">
                      {post.platforms.map(plat => (
                        <span key={plat} className="px-2 py-1 bg-background border border-border/40 rounded-lg text-[8px] font-black uppercase tracking-wider text-muted-foreground select-none">
                          {plat === 'facebook' && <span className="text-blue-500">FB</span>}
                          {plat === 'instagram' && <span className="text-pink-500">IG</span>}
                          {plat === 'linkedin' && <span className="text-indigo-600">LN</span>}
                          {plat === 'gmb' && <span className="text-emerald-500">GMB</span>}
                        </span>
                      ))}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                      {post.date} @ {post.time}
                    </div>
                  </div>

                  {/* Post visual contents card */}
                  <div className="p-5 flex gap-4">
                    <img 
                      src={post.image} 
                      alt="Post attachment preview" 
                      className="w-24 h-24 object-cover rounded-xl border border-border/60 shrink-0" 
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-semibold leading-relaxed text-foreground select-text">{post.text}</p>
                      
                      <div className="flex gap-4.5 pt-1.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center gap-1.5" title="Views">
                          <Eye className="w-4 h-4 text-muted-foreground/60" />
                          <span>{post.views} Views</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Comments">
                          <MessageSquare className="w-4 h-4 text-muted-foreground/60" />
                          <span>{post.comments} Comments</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Leads captured">
                          <UserCheck className="w-4 h-4 text-indigo-500" />
                          <span className="text-indigo-500">{post.leads} Leads</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions card footer */}
                  <div className="px-5 py-3 border-t border-border/40 bg-muted/10 flex justify-between items-center">
                    <button
                      className="bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600/20 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Megaphone className="w-3 h-3" /> Boost Post
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 cursor-pointer"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {subTab === 'planner' && (
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center text-muted-foreground italic font-semibold text-xs shadow-sm">
          📅 Post Planner Calendar view maps scheduling pipelines. Select date block to compose automated queue posts.
        </div>
      )}

      {subTab === 'listing-feed' && (
        <div className="bg-card border border-border/60 rounded-2xl p-8 text-center text-muted-foreground italic font-semibold text-xs shadow-sm">
          🏠 Listing feed maps MLS Realcomp sync streams. Select hot properties to generate sign riders or automated posts instantly.
        </div>
      )}

      {/* Composer Modal Dialog */}
      {showComposer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-border/40 pb-3">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wider">
                Create Social Post Composer
              </h3>
              <button 
                onClick={() => setShowComposer(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4 text-xs font-semibold text-muted-foreground">
              <div>
                <label className="block mb-1 text-[10px] font-black uppercase">Post Message Content</label>
                <textarea
                  required
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="What is happening on your listing? Add details, sign rider codes, or pricing updates..."
                  rows={4}
                  className="w-full bg-background border border-border/60 rounded-xl p-3 text-foreground focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block mb-1 text-[10px] font-black uppercase">Attach Photo Image URL</label>
                <input
                  type="text"
                  value={uploadedImageUrl}
                  onChange={(e) => setUploadedImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo..."
                  className="w-full bg-background border border-border/60 rounded-xl px-3 py-2 text-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] font-black uppercase">Select Publishing Channels</label>
                <div className="flex gap-2">
                  {['facebook', 'instagram', 'linkedin', 'gmb'].map(plat => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlatform(plat)}
                      className={`px-3 py-2 border rounded-xl font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer ${
                        selectedPlatforms.includes(plat)
                          ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          : 'bg-background border-border hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-border/40">
                <button
                  type="button"
                  onClick={() => setShowComposer(false)}
                  className="px-4 py-2 hover:bg-muted rounded-xl text-foreground font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 cursor-pointer"
                >
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
