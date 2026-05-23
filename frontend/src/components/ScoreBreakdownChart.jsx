import React, { useMemo } from 'react';

const RRF_K = 60;
const MAX_BAR_PX = 44;

function getContributions(result) {
  const bm25Rank = result.bm25_rank ?? null;
  const faissRank = result.faiss_rank ?? null;

  const bm25Contribution =
    result.bm25_contribution ??
    (bm25Rank != null ? 1 / (RRF_K + bm25Rank + 1) : 0);

  const faissContribution =
    result.faiss_contribution ??
    (faissRank != null ? 1 / (RRF_K + faissRank + 1) : 0);

  const rrfScore = result.rrf_score ?? bm25Contribution + faissContribution;

  return { bm25Contribution, faissContribution, rrfScore };
}

function formatScore(value) {
  return value.toFixed(4);
}

export default function ScoreBreakdownChart({ result }) {
  const { bm25Contribution, faissContribution, rrfScore } = useMemo(
    () => getContributions(result),
    [result],
  );

  const scale = rrfScore > 0 ? MAX_BAR_PX / rrfScore : 0;
  const bm25Height = Math.max(bm25Contribution * scale, bm25Contribution > 0 ? 4 : 0);
  const faissHeight = Math.max(faissContribution * scale, faissContribution > 0 ? 4 : 0);

  return (
    <div className="flex flex-col items-end flex-shrink-0">
      <span className="text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
        RRF {formatScore(rrfScore)}
      </span>

      <div className="flex items-end gap-2 h-12">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-mono font-medium text-blue-400 leading-none">
            {formatScore(bm25Contribution)}
          </span>
          <div
            className="w-5 rounded-t-sm bg-blue-500 transition-all duration-500 ease-out"
            style={{ height: `${bm25Height}px` }}
            title={`BM25 rank: ${result.bm25_rank ?? 'N/A'}`}
          />
          <span className="text-[9px] font-medium text-slate-500">BM25</span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] font-mono font-medium text-violet-400 leading-none">
            {formatScore(faissContribution)}
          </span>
          <div
            className="w-5 rounded-t-sm bg-violet-500 transition-all duration-500 ease-out"
            style={{ height: `${faissHeight}px` }}
            title={`FAISS rank: ${result.faiss_rank ?? 'N/A'}`}
          />
          <span className="text-[9px] font-medium text-slate-500">FAISS</span>
        </div>
      </div>
    </div>
  );
}
