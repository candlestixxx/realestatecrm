'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * LeadQualifyWidget — AI lead qualification panel.
 *
 * Calls POST /api/leads/[id]/qualify to run qualification, GET to fetch
 * the latest result. Shows score, grade, reasoning, and factor breakdown.
 * Placed in the lead detail "searches" tab alongside LeadScoreWidget.
 */
interface Qualification {
  score: number;
  grade: string;
  reasoning: string;
  factors: string[];
}

export default function LeadQualifyWidget({ leadId }: { leadId: string }) {
  const [qual, setQual] = useState<Qualification | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await fetch('/api/leads/' + leadId + '/qualify');
      if (res.ok) {
        const data = await res.json();
        if (data.qualification) {
          setQual({
            score: data.qualification.score,
            grade: data.qualification.grade,
            reasoning: data.qualification.reasoning || '',
            factors: data.qualification.factors || [],
          });
        }
      }
    } catch {
      // silent — optional widget
    } finally {
      setInitialLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  async function runQualification() {
    setLoading(true);
    try {
      const res = await fetch('/api/leads/' + leadId + '/qualify', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setQual({
          score: data.score,
          grade: data.grade,
          reasoning: data.reasoning || '',
          factors: data.factors || [],
        });
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const gradeColor: Record<string, string> = {
    A: 'text-green-700 bg-green-50 border-green-200',
    B: 'text-blue-700 bg-blue-50 border-blue-200',
    C: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    D: 'text-orange-700 bg-orange-50 border-orange-200',
    F: 'text-red-700 bg-red-50 border-red-200',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          AI Qualification
          <span
            title="Run AI-powered lead qualification to score and grade this lead based on engagement, fit, and behavior signals."
            aria-label="AI qualification scores leads A-F based on engagement, fit, and behavior"
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle"
          >
            ?
          </span>
        </h3>
        <button
          onClick={runQualification}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Qualifying...' : qual ? 'Re-qualify' : 'Qualify Lead'}
        </button>
      </div>

      {initialLoading ? (
        <div className="mt-3 text-xs text-gray-400">Loading qualification...</div>
      ) : qual ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className={'text-lg font-bold px-2 py-0.5 rounded border ' + (gradeColor[qual.grade] || 'text-gray-700 bg-gray-50 border-gray-200')}>
              Grade {qual.grade}
            </span>
            <span className="text-sm text-gray-600">Score: {qual.score}/100</span>
          </div>
          {qual.reasoning && (
            <p className="text-xs text-gray-600">{qual.reasoning}</p>
          )}
          {qual.factors.length > 0 && (
            <ul className="text-xs text-gray-500 list-disc list-inside">
              {qual.factors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-3 text-xs text-gray-400">
          No qualification yet. Click &quot;Qualify Lead&quot; to run AI qualification.
        </div>
      )}
    </div>
  );
}
