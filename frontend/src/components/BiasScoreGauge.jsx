import React, { useMemo } from 'react';

const WIDTH = 120;
const HEIGHT = 78;
const CX = WIDTH / 2;
const CY = 58;
const RADIUS = 44;
const NEEDLE_LEN = 36;

function polarToCartesian(angleRad) {
  return {
    x: CX + NEEDLE_LEN * Math.cos(angleRad),
    y: CY - NEEDLE_LEN * Math.sin(angleRad),
  };
}

function describeArc(startAngleRad, endAngleRad) {
  const start = {
    x: CX + RADIUS * Math.cos(startAngleRad),
    y: CY - RADIUS * Math.sin(startAngleRad),
  };
  const end = {
    x: CX + RADIUS * Math.cos(endAngleRad),
    y: CY - RADIUS * Math.sin(endAngleRad),
  };
  const largeArc = endAngleRad - startAngleRad > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function getConfidence(result) {
  if (result.confidence) return result.confidence;
  const label = result.perspective_label || 'Neutral';
  return { Allied: 0, Axis: 0, Neutral: 0, [label]: 1 };
}

export function computeBiasScore(result) {
  const conf = getConfidence(result);
  const allied = conf.Allied ?? 0;
  const axis = conf.Axis ?? 0;
  const score = axis - allied;
  return Math.max(-1, Math.min(1, score));
}

function formatBiasLabel(score) {
  if (Math.abs(score) < 0.05) {
    return `${score.toFixed(2)} Neutral`;
  }
  if (score < 0) {
    return `${score.toFixed(2)} Allied-leaning`;
  }
  return `+${score.toFixed(2)} Axis-leaning`;
}

/** Map bias [-1, 1] to needle angle: π (left) → π/2 (center) → 0 (right). */
function biasToAngleRad(bias) {
  return Math.PI * (0.5 - bias / 2);
}

export default function BiasScoreGauge({ result }) {
  const biasScore = useMemo(() => computeBiasScore(result), [result]);
  const label = useMemo(() => formatBiasLabel(biasScore), [biasScore]);
  const needleAngle = biasToAngleRad(biasScore);
  const needleTip = polarToCartesian(needleAngle);

  const alliedArc = describeArc(Math.PI, (2 * Math.PI) / 3);
  const neutralArc = describeArc((2 * Math.PI) / 3, Math.PI / 3);
  const axisArc = describeArc(Math.PI / 3, 0);

  return (
    <div className="flex flex-col items-center w-[120px] flex-shrink-0">
      <div className="rounded-lg bg-slate-800 border border-slate-700/80 px-1 pt-1 pb-0.5 shadow-inner">
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          aria-label={`Bias gauge: ${label}`}
        >
          <path d={alliedArc} fill="none" stroke="#3b82f6" strokeWidth="7" strokeLinecap="round" />
          <path d={neutralArc} fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
          <path d={axisArc} fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" />

          <text x="8" y={CY + 4} className="fill-blue-400 text-[8px] font-semibold">
            Allied
          </text>
          <text x={CX - 14} y="12" className="fill-slate-400 text-[8px] font-semibold">
            Neutral
          </text>
          <text x={WIDTH - 26} y={CY + 4} className="fill-red-400 text-[8px] font-semibold">
            Axis
          </text>

          <circle cx={CX} cy={CY} r="3.5" fill="#e2e8f0" />
          <line
            x1={CX}
            y1={CY}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke="#f8fafc"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r="2" fill="#1e293b" />
        </svg>
      </div>
      <p className="mt-1 text-[10px] font-mono font-medium text-slate-400 text-center leading-tight">
        {label}
      </p>
    </div>
  );
}
