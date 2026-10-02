'use client';

import React, { useState, useEffect } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface QualityMetric {
  label: string;
  score: number;
  total: number;
  issues: { field: string; count: number; severity: 'high' | 'medium' | 'low' }[];
}

export default function DataQualityPage() {
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    fetch('/api/data-quality?workspaceId=${getClientWorkspaceSlug()}')
      .then(r => r.json())
      .then(data => {
        setMetrics(data.metrics || []);
        setOverallScore(data.overallScore || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const SEVERITY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Data Quality Dashboard</h1>

      {/* Overall Score */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="16" fill="none" stroke={overallScore >= 80 ? '#10B981' : overallScore >= 60 ? '#F59E0B' : '#EF4444'} strokeWidth="3"
                strokeDasharray={overallScore + ' 100'} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold">{overallScore}%</span>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Overall Data Health</h2>
            <p className="text-gray-500">Completeness, accuracy, and consistency across all records.</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Analyzing data quality...</div>
      ) : metrics.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No data quality metrics available.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map(m => (
            <div key={m.label} className="bg-white rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{m.label}</h3>
                <span className={'px-2 py-1 rounded-full text-sm font-medium ' + (m.score >= 80 ? 'bg-green-100 text-green-800' : m.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800')}>
                  {m.score}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div className="rounded-full h-2" style={{ width: m.score + '%', backgroundColor: m.score >= 80 ? '#10B981' : m.score >= 60 ? '#F59E0B' : '#EF4444' }} />
              </div>
              {m.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Issues ({m.total} records checked)</h4>
                  {m.issues.map(issue => (
                    <div key={issue.field} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-sm text-gray-600">{issue.field}</span>
                      <div className="flex items-center gap-2">
                        <span className={'px-2 py-0.5 rounded text-xs ' + SEVERITY_COLORS[issue.severity]}>{issue.severity}</span>
                        <span className="text-sm text-gray-500">{issue.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
