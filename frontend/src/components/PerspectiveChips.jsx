import React from 'react';

const PERSPECTIVES = [
  { label: 'Allied', dot: 'bg-blue-400', ring: 'ring-blue-400/30', delay: '0ms' },
  { label: 'Axis', dot: 'bg-red-400', ring: 'ring-red-400/30', delay: '150ms' },
  { label: 'Neutral', dot: 'bg-slate-400', ring: 'ring-slate-400/30', delay: '300ms' },
];

export default function PerspectiveChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-10">
      {PERSPECTIVES.map(({ label, dot, ring, delay }) => (
        <div
          key={label}
          className={`
            perspective-chip inline-flex items-center gap-2.5
            px-4 py-2 rounded-full
            border border-slate-700/80 bg-slate-800/60 backdrop-blur-sm
            text-sm font-medium text-slate-300
            opacity-0 animate-chip-in
          `}
          style={{ animationDelay: delay }}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-dot-pulse absolute inline-flex h-full w-full rounded-full ${dot} opacity-75`}
            />
            <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dot} ring-2 ${ring}`} />
          </span>
          {label}
        </div>
      ))}
    </div>
  );
}
