import React from 'react';
import ResultCard from './ResultCard';

const HEADER_STYLES = {
  Allied: {
    gradient: 'bg-gradient-to-r from-blue-950 via-blue-800 to-blue-900',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/25 text-blue-100 border-blue-400/30',
  },
  Axis: {
    gradient: 'bg-gradient-to-r from-red-950 via-red-800 to-red-900',
    border: 'border-red-500/30',
    badge: 'bg-red-500/25 text-red-100 border-red-400/30',
  },
  Neutral: {
    gradient: 'bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800',
    border: 'border-slate-500/30',
    badge: 'bg-slate-500/25 text-slate-100 border-slate-400/30',
  },
};

export default function PerspectiveGroup({ label, results }) {
  if (!results || results.length === 0) return null;

  const style = HEADER_STYLES[label] || HEADER_STYLES.Neutral;

  return (
    <section className="mb-16">
      <div
        className={`
          w-full px-6 py-4 mb-8 rounded-2xl border shadow-lg
          flex items-center justify-between gap-4
          ${style.gradient} ${style.border}
        `}
      >
        <h2 className="font-heading text-xl sm:text-2xl font-bold text-white tracking-tight">
          {label} Perspective
        </h2>
        <span
          className={`
            flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border
            ${style.badge}
          `}
        >
          {results.length} document{results.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-8">
        {results.map((res) => (
          <ResultCard key={res.doc_id} result={res} />
        ))}
      </div>
    </section>
  );
}
