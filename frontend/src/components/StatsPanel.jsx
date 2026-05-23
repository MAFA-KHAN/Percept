import React, { useMemo } from 'react';

function flattenResults(results) {
  return ['Allied', 'Axis', 'Neutral'].flatMap((label) => results[label] || []);
}

function computeStats(results) {
  const docs = flattenResults(results);
  if (docs.length === 0) {
    return { avgRrf: 0, topBm25: 0, topFaiss: 0 };
  }

  const rrfScores = docs.map((d) => d.rrf_score ?? 0);
  const bm25Scores = docs.map((d) => d.bm25_contribution ?? 0);
  const faissScores = docs.map((d) => d.faiss_contribution ?? 0);

  const avgRrf = rrfScores.reduce((a, b) => a + b, 0) / rrfScores.length;
  const topBm25 = Math.max(...bm25Scores);
  const topFaiss = Math.max(...faissScores);

  return { avgRrf, topBm25, topFaiss };
}

const METRICS = [
  { key: 'avgRrf', label: 'Avg RRF Score' },
  { key: 'topBm25', label: 'Top BM25 Match' },
  { key: 'topFaiss', label: 'Top FAISS Match' },
];

export default function StatsPanel({ results }) {
  const stats = useMemo(() => computeStats(results), [results]);

  const values = {
    avgRrf: stats.avgRrf.toFixed(4),
    topBm25: stats.topBm25.toFixed(4),
    topFaiss: stats.topFaiss.toFixed(4),
  };

  return (
    <div className="w-full mb-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {METRICS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-700/60 bg-slate-900/80 px-6 py-5 text-center"
          >
            <p className="text-xs font-medium uppercase tracking-widest text-slate-500 mb-2">
              {label}
            </p>
            <p className="font-mono text-2xl font-semibold text-slate-100">
              {values[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
