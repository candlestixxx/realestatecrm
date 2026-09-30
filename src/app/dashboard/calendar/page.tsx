'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ScheduledPost {
  id: string;
  content: string;
  status: string;
  scheduledAt: string;
  platform?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PublishingCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const loadPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?status=SCHEDULED');
      const data = await res.json();
      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch {
      // Use empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const getDaysInMonth = () => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = () => new Date(year, month, 1).getDay();

  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const navigateMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const daysInMonth = getDaysInMonth();
  const firstDay = getFirstDayOfMonth();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Publishing Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Schedule and manage your content across all platforms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            ←
          </button>
          <span className="text-lg font-bold text-foreground min-w-[180px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-background border border-border rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS.map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] border-b border-r border-border bg-muted/10" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = getPostsForDay(day);
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

            return (
              <div
                key={day}
                className={`min-h-[120px] border-b border-r border-border p-2 transition-colors hover:bg-muted/20 ${
                  isToday ? 'bg-secondary/5' : ''
                }`}
              >
                <div className={`text-xs font-bold mb-1 ${isToday ? 'text-secondary' : 'text-muted-foreground'}`}>
                  {day}
                  {isToday && <span className="ml-1 text-[8px] px-1 py-0.5 bg-secondary text-secondary-foreground rounded-full">TODAY</span>}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className="text-[10px] px-1.5 py-1 rounded bg-secondary/15 text-secondary font-medium truncate cursor-pointer hover:bg-secondary/25"
                      title={post.content}
                    >
                      {post.platform && <span className="mr-1">{post.platform === 'facebook' ? '📘' : post.platform === 'instagram' ? '📸' : post.platform === 'linkedin' ? '💼' : '📱'}</span>}
                      {post.content?.slice(0, 30) || 'Scheduled post'}
                    </div>
                  ))}
                  {dayPosts.length > 3 && (
                    <div className="text-[9px] text-muted-foreground font-medium">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-bold">Legend:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/15 border border-secondary/30" /> Scheduled posts</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/5 border border-secondary" /> Today</span>
      </div>
    </div>
  );
}
