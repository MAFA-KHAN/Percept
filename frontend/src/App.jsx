import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import PerspectiveChips from './components/PerspectiveChips';
import PerspectiveGroup from './components/PerspectiveGroup';
import PipelineVisualizer, { runPipelineAnimation } from './components/PipelineVisualizer';
import PerspectiveBalanceMeter from './components/PerspectiveBalanceMeter';
import StatsPanel from './components/StatsPanel';
import DocumentTimeline from './components/DocumentTimeline';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [resultsView, setResultsView] = useState('list');

  const hasSearched = results || isLoading || error || showPipeline;
  const showHero = !hasSearched;
  const showResults = results && !showPipeline && !isLoading;

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setResultsView('list');
    setShowPipeline(true);
    setPipelineStep(0);

    const fetchPromise = fetch('http://127.0.0.1:8000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: 15 }),
    }).then(async (res) => {
      if (!res.ok) {
        throw new Error('Search request failed. Make sure the backend is running and data is loaded.');
      }
      return res.json();
    });

    try {
      await runPipelineAnimation(setPipelineStep);
      const data = await fetchPromise;
      setResults(data.results);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setShowPipeline(false);
      setIsLoading(false);
      setPipelineStep(-1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header
        className={`
          relative border-b border-slate-800/80
          ${showHero ? 'min-h-screen flex flex-col justify-center pb-20 pt-16' : 'pb-12 pt-10'}
        `}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(15,23,42,0.8),transparent_70%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className={`text-center ${showHero ? 'mb-10' : 'mb-8'}`}>
            <h1
              className={`
                font-heading font-bold tracking-tight
                bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300
                bg-clip-text text-transparent
                ${showHero ? 'text-6xl sm:text-7xl md:text-8xl' : 'text-4xl sm:text-5xl'}
              `}
            >
              PERCEPT
            </h1>
            <p
              className={`
                mt-4 mx-auto max-w-xl text-slate-400
                ${showHero ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'}
              `}
            >
              Uncover the perspective behind every document.
            </p>
          </div>

          {showHero && <PerspectiveChips />}

          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20">
        {showPipeline && (
          <PipelineVisualizer activeStep={pipelineStep} />
        )}

        {error && !showPipeline && (
          <div className="mb-8 p-4 bg-red-950/50 border border-red-800/50 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}

        {showResults && (
          <div className="space-y-12 animate-results-in">
            <PerspectiveBalanceMeter results={results} />

            <StatsPanel results={results} />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 pt-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-slate-100">
                Search Results for &ldquo;{query}&rdquo;
              </h2>

              <div className="inline-flex rounded-lg border border-slate-700 bg-slate-800/80 p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setResultsView('list')}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${resultsView === 'list'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  List View
                </button>
                <button
                  type="button"
                  onClick={() => setResultsView('timeline')}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-md transition-colors
                    ${resultsView === 'timeline'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  Timeline View
                </button>
              </div>
            </div>

            {resultsView === 'timeline' ? (
              <DocumentTimeline results={results} />
            ) : (
              <>
                <PerspectiveGroup label="Allied" results={results.Allied} />
                <PerspectiveGroup label="Axis" results={results.Axis} />
                <PerspectiveGroup label="Neutral" results={results.Neutral} />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
