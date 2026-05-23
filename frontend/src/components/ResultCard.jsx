import React from 'react';

const BADGE_STYLES = {
  Allied: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  Axis: 'bg-red-500/20 text-red-300 border-red-500/40',
  Neutral: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
};

export default function ResultCard({ result }) {
  const hasUrl = result.url != null && String(result.url).trim() !== '';
  const label = result.perspective_label || 'Neutral';
  const badgeClass = BADGE_STYLES[label] || BADGE_STYLES.Neutral;

  const metaParts = [
    result.source && result.source !== 'Unknown' ? result.source : null,
    result.year != null ? String(result.year) : null,
  ].filter(Boolean);

  return (
    <article
      className="
        group overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900
        transition-all duration-300 ease-out
        hover:border-indigo-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]
      "
    >
      <div className="px-8 py-9 sm:px-10 sm:py-10">
        {/* Top section */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-xl sm:text-2xl font-semibold text-slate-100 leading-snug">
              {result.title}
            </h3>
            {metaParts.length > 0 && (
              <p className="mt-2 text-sm text-slate-500">
                {metaParts.join(' · ')}
              </p>
            )}
          </div>
          <span
            className={`
              flex-shrink-0 inline-flex items-center px-3.5 py-1.5 rounded-full
              text-xs font-semibold border uppercase tracking-wide
              ${badgeClass}
            `}
          >
            {label}
          </span>
        </div>

        {/* Snippet */}
        <p className="text-base text-slate-400 leading-relaxed">
          {result.snippet}
        </p>

        {/* Source link */}
        {hasUrl && (
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Read Original Source →
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
