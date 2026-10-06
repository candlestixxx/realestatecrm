'use client';

import React, { useState, useEffect } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface LeaderboardEntry {
  userId: string;
  name: string;
  email: string;
  points: number;
  rank: number;
  badges: string[];
  breakdown: Record<string, number>;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/gamification?workspaceId=' + getClientWorkspaceSlug() + '&period=' + period)
      .then(r => r.json())
      .then(data => setEntries(data.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Agent Leaderboard</h1>
        <div className="flex gap-2">
          {['all', 'month', 'week'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={'px-3 py-1.5 rounded-full text-sm ' + (period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
              {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No activity data yet.</div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div key={entry.userId}
              className={'bg-white rounded-lg border p-4 flex items-center gap-4 ' + (i < 3 ? 'ring-2 ring-blue-100' : '')}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: i === 0 ? '#FEF3C7' : i === 1 ? '#F3F4F6' : i === 2 ? '#FED7AA' : '#F3F4F6' }}>
                {i < 3 ? MEDALS[i] : entry.rank}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{entry.name}</div>
                <div className="text-sm text-gray-500">{entry.email}</div>
                {entry.badges.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5">
                    {entry.badges.map(b => (
                      <span key={b} className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">{b}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{entry.points}</div>
                <div className="text-xs text-gray-500">points</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
