import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

const PLACEHOLDERS = [
  'Battle of Somme',
  'German strategy WW2',
  'Allied victory speeches',
];

export default function SearchBar({ query, setQuery, onSearch, isLoading }) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderVisible, setPlaceholderVisible] = useState(true);

  useEffect(() => {
    if (query) return;

    const interval = setInterval(() => {
      setPlaceholderVisible(false);
      setTimeout(() => {
        setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length);
        setPlaceholderVisible(true);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, [query]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="relative group"
      >
        <div
          className="
            relative flex items-center w-full
            rounded-2xl border border-slate-600/60
            bg-slate-800/80 backdrop-blur-md
            animate-soft-glow
            transition-all duration-300 ease-out
            focus-within:border-indigo-400/60
            focus-within:shadow-[0_0_0_1px_rgba(129,140,248,0.4),0_0_40px_rgba(99,102,241,0.3),0_0_80px_rgba(99,102,241,0.12)]
          "
        >
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-400 transition-colors duration-300" />
          </div>

          <input
            type="text"
            name="search"
            id="search"
            autoComplete="off"
            className="
              block w-full bg-transparent
              rounded-2xl border-0
              py-5 pl-16 pr-36
              text-lg text-slate-100
              placeholder-transparent
              focus:ring-0 focus:outline-none
            "
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {!query && (
            <div
              className="absolute inset-y-0 left-16 flex items-center pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <span
                className={`
                  text-lg text-slate-500 transition-all duration-300 ease-out
                  ${placeholderVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                `}
              >
                {PLACEHOLDERS[placeholderIndex]}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              inline-flex items-center justify-center
              px-6 py-2.5 rounded-xl
              text-sm font-semibold text-white
              bg-indigo-600 hover:bg-indigo-500
              focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {isLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
}
