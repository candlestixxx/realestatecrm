'use client';
// Lead scoring widget — shows predictive conversion score from /api/scoring.
// Displays score breakdown and recommendation.

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface ScoreResult {
  score: number;
  factors: { name: string; impact: number; detail: string }[];
  recommendation: string;
}

export default function LeadScoreWidget({ leadId }: { leadId: string }) {
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      });
      if (!res.ok) throw new Error('Failed to calculate score');
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Failed to calculate score');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return 'Hot';
    if (score >= 40) return 'Warm';
    return 'Cold';
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-700">Predictive Lead Score</h3>
        <button
          onClick={fetchScore}
          disabled={loading}
          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <RefreshCw className={loading ? 'w-3 h-3 animate-spin' : 'w-3 h-3'} />
          Recalculate
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-500 mb-2">{error}</div>
      )}

      {loading && !result && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Calculating...
        </div>
      )}

      {result && (
        <>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-3xl font-bold" style={{ color: getScoreColor(result.score) }}>
              {result.score}
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: getScoreColor(result.score) }}>
                {getScoreLabel(result.score)}
              </div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
            <TrendingUp className="w-5 h-5 ml-auto text-gray-400" />
          </div>

          {/* Score bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: result.score + '%',
                backgroundColor: result.score >= 70 ? '#16a34a' : result.score >= 40 ? '#ca8a04' : '#dc2626',
              }}
            />
          </div>

          {result.factors && result.factors.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <div className="text-xs font-medium text-gray-500 uppercase">Score Factors</div>
              {result.factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{f.name}</span>
                  <span className={f.impact >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {f.impact >= 0 ? '+' : ''}{f.impact}
                  </span>
                </div>
              ))}
            </div>
          )}

          {result.recommendation && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
              <span className="font-medium">Recommendation:</span> {result.recommendation}
            </div>
          )}
        </>
      )}
    </div>
  );
}
