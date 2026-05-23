import React from 'react';
import { Check } from 'lucide-react';

const STEPS = [
  'BM25 Search',
  'FAISS Search',
  'RRF Fusion',
  'DistilBERT Classify',
];

const STEP_MS = 500;

export { STEP_MS, STEPS };

export async function runPipelineAnimation(setActiveStep) {
  for (let i = 0; i < STEPS.length; i++) {
    setActiveStep(i);
    await new Promise((resolve) => setTimeout(resolve, STEP_MS));
  }
  setActiveStep(STEPS.length);
}

export default function PipelineVisualizer({ activeStep }) {
  const allComplete = activeStep >= STEPS.length;

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-2">
      <p className="text-center text-xs font-heading font-semibold uppercase tracking-widest text-slate-500 mb-6">
        Retrieval pipeline
      </p>

      <div className="flex items-start justify-between gap-1 sm:gap-2">
        {STEPS.map((label, index) => {
          const isComplete = allComplete || index < activeStep;
          const isActive = !allComplete && index === activeStep;
          const isPending = !isComplete && !isActive;
          const connectorComplete = index < activeStep || allComplete;

          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                <div
                  className={`
                    relative flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2
                    transition-all duration-300
                    ${isComplete ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_20px_rgba(52,211,153,0.35)]' : ''}
                    ${isActive ? 'border-indigo-400 bg-indigo-500/20 animate-pipeline-pulse shadow-[0_0_24px_rgba(129,140,248,0.45)]' : ''}
                    ${isPending ? 'border-slate-600 bg-slate-800/60' : ''}
                  `}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" strokeWidth={2.5} />
                  ) : isActive ? (
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-slate-600" />
                  )}
                </div>

                <p
                  className={`
                    mt-3 text-center text-[10px] sm:text-xs font-medium leading-tight px-0.5
                    transition-colors duration-300
                    ${isComplete ? 'text-emerald-300' : ''}
                    ${isActive ? 'text-indigo-300' : ''}
                    ${isPending ? 'text-slate-500' : ''}
                  `}
                >
                  {label}
                </p>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-shrink-0 w-4 sm:w-8 md:w-12 mt-5 sm:mt-6 h-0.5 self-start overflow-hidden rounded-full bg-slate-700/80">
                  <div
                    className={`
                      h-full rounded-full bg-gradient-to-r from-emerald-400 to-indigo-400
                      transition-all duration-500 ease-out
                      ${connectorComplete ? 'w-full' : 'w-0'}
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
