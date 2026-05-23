import React, { useMemo, useState } from 'react';

const YEAR_MIN = 1914;
const YEAR_MAX = 1945;
const YEAR_SPAN = YEAR_MAX - YEAR_MIN;

const PERSPECTIVE_STYLES = {
  Allied: {
    dot: 'bg-blue-500 ring-blue-400/80 shadow-[0_0_16px_rgba(59,130,246,0.65)]',
    dotHover: 'shadow-[0_0_24px_rgba(59,130,246,0.85)]',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  Axis: {
    dot: 'bg-red-500 ring-red-400/80 shadow-[0_0_16px_rgba(239,68,68,0.65)]',
    dotHover: 'shadow-[0_0_24px_rgba(239,68,68,0.85)]',
    badge: 'bg-red-500/20 text-red-300 border-red-500/40',
  },
  Neutral: {
    dot: 'bg-slate-400 ring-slate-300/80 shadow-[0_0_16px_rgba(148,163,184,0.55)]',
    dotHover: 'shadow-[0_0_24px_rgba(148,163,184,0.75)]',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
};

const AXIS_TICKS = [1914, 1920, 1925, 1930, 1935, 1940, 1945];

function flattenResults(results) {
  return ['Allied', 'Axis', 'Neutral'].flatMap((label) =>
    (results[label] || []).map((doc) => ({
      ...doc,
      perspective_label: doc.perspective_label || label,
    })),
  );
}

function yearToPercent(year) {
  const clamped = Math.min(YEAR_MAX, Math.max(YEAR_MIN, year));
  return ((clamped - YEAR_MIN) / YEAR_SPAN) * 100;
}

function layoutDocuments(documents) {
  const withYear = documents.filter((d) => d.year != null && !Number.isNaN(Number(d.year)));
  const byYear = {};

  withYear.forEach((doc) => {
    const y = Number(doc.year);
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(doc);
  });

  return withYear.map((doc) => {
    const year = Number(doc.year);
    const group = byYear[year];
    const indexInYear = group.indexOf(doc);
    const count = group.length;
    const x = yearToPercent(year);
    const yOffset = count > 1 ? (indexInYear - (count - 1) / 2) * 14 : 0;

    return { ...doc, year, x, yOffset };
  });
}

function TimelineTooltip({ doc }) {
  const style = PERSPECTIVE_STYLES[doc.perspective_label] || PERSPECTIVE_STYLES.Neutral;

  return (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-30 w-56 sm:w-64 pointer-events-none">
      <div className="rounded-lg border border-slate-600 bg-slate-900/95 backdrop-blur-sm shadow-xl p-3 text-left">
        <p className="text-sm font-semibold text-slate-100 leading-snug mb-2">{doc.title}</p>
        <div className="space-y-1 text-xs text-slate-400">
          <p>
            <span className="text-slate-500">Year:</span> {doc.year}
          </p>
          <p>
            <span className="text-slate-500">Source:</span> {doc.source || 'Unknown'}
          </p>
          <p>
            <span className="text-slate-500">Perspective:</span>{' '}
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${style.badge}`}
            >
              {doc.perspective_label}
            </span>
          </p>
        </div>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45 bg-slate-900 border-r border-b border-slate-600" />
    </div>
  );
}

export default function DocumentTimeline({ results }) {
  const [hoveredId, setHoveredId] = useState(null);

  const positioned = useMemo(() => layoutDocuments(flattenResults(results)), [results]);

  const missingYearCount = useMemo(() => {
    const all = flattenResults(results);
    return all.length - positioned.length;
  }, [results, positioned.length]);

  return (
    <div className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 p-8 sm:p-10">
      <p className="text-center text-xs font-heading font-semibold uppercase tracking-widest text-slate-500 mb-10">
        Document timeline ({YEAR_MIN}–{YEAR_MAX})
      </p>

      <div className="relative mx-2 sm:mx-6 pt-4 pb-2">
        {/* Axis line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-slate-600 -translate-y-1/2" />

        {/* Year ticks */}
        {AXIS_TICKS.map((year) => (
          <div
            key={year}
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${yearToPercent(year)}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-px h-3 bg-slate-500 mb-8" />
            <span className="absolute top-full mt-10 text-[10px] sm:text-xs text-slate-500 font-mono whitespace-nowrap">
              {year}
            </span>
          </div>
        ))}

        {/* Document dots */}
        <div className="relative h-28 sm:h-32">
          {positioned.map((doc) => {
            const style = PERSPECTIVE_STYLES[doc.perspective_label] || PERSPECTIVE_STYLES.Neutral;
            const isHovered = hoveredId === doc.doc_id;

            return (
              <div
                key={doc.doc_id}
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                  left: `${doc.x}%`,
                  transform: `translate(-50%, calc(-50% + ${doc.yOffset}px))`,
                }}
              >
                <button
                  type="button"
                  className={`
                    relative rounded-full ring-2 transition-all duration-300
                    h-4 w-4
                    ${style.dot}
                    ${isHovered ? `scale-125 z-20 ${style.dotHover}` : 'hover:scale-110 z-10'}
                  `}
                  onMouseEnter={() => setHoveredId(doc.doc_id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(doc.doc_id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={`${doc.title}, ${doc.year}, ${doc.perspective_label}`}
                />
                {isHovered && <TimelineTooltip doc={doc} />}
              </div>
            );
          })}
        </div>
      </div>

      {missingYearCount > 0 && (
        <p className="text-center text-xs text-slate-500 mt-10 mb-2">
          {missingYearCount} document{missingYearCount !== 1 ? 's' : ''} without a year omitted from timeline
        </p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-700/60">
        {Object.entries(PERSPECTIVE_STYLES).map(([label, style]) => (
          <div key={label} className="flex items-center gap-2 text-sm text-slate-400">
            <span className={`h-4 w-4 rounded-full ring-2 ${style.dot}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
