import React, { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

const SEGMENTS = [
  { key: 'Allied', label: 'Allied', bar: 'bg-blue-500', border: 'border-blue-400/50' },
  { key: 'Axis', label: 'Axis', bar: 'bg-red-500', border: 'border-red-400/50' },
  { key: 'Neutral', label: 'Neutral', bar: 'bg-slate-500', border: 'border-slate-400/50' },
];

const SKEW_THRESHOLD = 75;

function computeBalance(results) {
  const counts = {
    Allied: results.Allied?.length ?? 0,
    Axis: results.Axis?.length ?? 0,
    Neutral: results.Neutral?.length ?? 0,
  };
  const total = counts.Allied + counts.Axis + counts.Neutral;

  const percentages = SEGMENTS.map(({ key }) => ({
    key,
    count: counts[key],
    percent: total > 0 ? Math.round((counts[key] / total) * 100) : 0,
  }));

  const skewed = percentages.find((p) => p.percent > SKEW_THRESHOLD);

  return { total, percentages, skewedPerspective: skewed?.key ?? null };
}

export default function PerspectiveBalanceMeter({ results }) {
  const { total, percentages, skewedPerspective } = useMemo(
    () => computeBalance(results),
    [results],
  );

  if (total === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-14 px-2">
      <p className="text-center text-xs font-heading font-semibold uppercase tracking-widest text-slate-500 mb-5">
        Perspective balance
      </p>

      <div className="flex h-11 sm:h-12 w-full overflow-hidden rounded-2xl border border-slate-700/80 shadow-lg bg-slate-900/50">
        {percentages.map(({ key, percent, count }) => {
          if (count === 0) return null;

          const segment = SEGMENTS.find((s) => s.key === key);

          return (
            <div
              key={key}
              style={{ width: `${percent}%` }}
              className={`
                relative flex items-center justify-center min-w-0
                ${segment.bar} ${segment.border}
                border-r border-r-slate-900/20 last:border-r-0
                transition-all duration-700 ease-out
              `}
              title={`${segment.label}: ${count} result${count !== 1 ? 's' : ''} (${percent}%)`}
            >
              <span
                className={`
                  font-semibold text-white drop-shadow-sm truncate px-1
                  ${percent >= 18 ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'}
                `}
              >
                {percent >= 18 ? `${segment.label} ${percent}%` : `${percent}%`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-400">
        {percentages.map(({ key, percent, count }) => {
          const segment = SEGMENTS.find((s) => s.key === key);
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${segment.bar}`} />
              {segment.label}: {count} ({percent}%)
            </span>
          );
        })}
      </div>

      {skewedPerspective && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-500/40 bg-orange-950/40 px-4 py-3 text-orange-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-orange-400 mt-0.5" />
          <p className="text-sm">
            Warning: Results are heavily skewed toward{' '}
            <span className="font-semibold text-orange-200">{skewedPerspective}</span>{' '}
            perspective.
          </p>
        </div>
      )}
    </div>
  );
}
