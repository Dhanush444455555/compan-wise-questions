import { useState } from 'react';
import { Search, FileQuestion, Star, ExternalLink } from 'lucide-react';
import { globalSearch } from '../lib/api';
import { DiffBadge, Spinner, SectionEmpty } from './ui';
import { toggleFav } from '../lib/tracker';

const POPULAR = ['LRU Cache', 'Trapping Rain Water', 'Two Sum', 'Merge Intervals', 'Course Schedule'];

export default function SearchView({ onSelectCompany, tracker, setTracker }) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  const { favs } = tracker;

  const run = async (q) => {
    const term = (q || query).trim();
    if (term.length < 2) return;
    setLoading(true);
    setSearched(true);
    const data = await globalSearch(term, 150);
    setResults(data.problems || []);
    setLoading(false);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Hero search box */}
      <div className="bg-gradient-to-r from-blue-900/30 via-slate-900 to-amber-900/20 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
        <h2 className="text-2xl font-bold text-white">Universal LeetCode Problem Finder</h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Type any LeetCode problem name to see <b>which companies ask it</b>, in what timeframe, and at what frequency.
        </p>

        <div className="max-w-2xl mx-auto relative pt-2">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 mt-1" />
          <input
            type="text"
            placeholder="Search problem (e.g., Two Sum, LRU Cache, Trapping Rain Water)…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && run()}
            className="w-full bg-slate-800 border-2 border-slate-700 focus:border-amber-500 rounded-xl pl-12 pr-28 py-3 text-base text-white placeholder-slate-400 focus:outline-none shadow-xl transition"
          />
          <button
            onClick={() => run()}
            className="absolute right-2 top-1/2 -translate-y-1/2 mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm transition"
          >
            Search
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
          <span>Try:</span>
          {POPULAR.map(t => (
            <button
              key={t}
              onClick={() => { setQuery(t); run(t); }}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="py-12 text-center space-y-3">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-slate-400">Searching 36,347 questions across 470 companies…</p>
        </div>
      )}

      {!loading && searched && results?.length === 0 && (
        <SectionEmpty icon={FileQuestion} title="No matching problems found" sub="Check spelling or try a broader keyword." />
      )}

      {!loading && results?.length > 0 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">{results.length} problems matched</p>
          {results.map(p => {
            const isFav = !!favs[p.title];
            return (
              <div key={p.title} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => setTracker(tr => toggleFav(tr, { title: p.title, difficulty: p.difficulty, link: p.link, topics: p.topics }))}
                      className={`mt-1 transition ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                    >
                      <Star className={`w-5 h-5 ${isFav ? 'fill-amber-400' : ''}`} />
                    </button>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <a href={p.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="text-lg font-bold text-white hover:text-amber-400 transition flex items-center gap-1.5">
                          {p.title}
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </a>
                        <DiffBadge difficulty={p.difficulty} />
                        <span className="text-xs text-slate-400 font-mono">Acc: {p.acceptance_rate}%</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Topics: {p.topics || 'General'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                      Asked by <b>{p.companies.length}</b> {p.companies.length === 1 ? 'Company' : 'Companies'}
                    </span>
                    <a href={p.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition">
                      Solve ↗
                    </a>
                  </div>
                </div>

                {/* Companies grid */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Companies Asking This:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {p.companies.map(co => (
                      <div
                        key={co.company_slug}
                        onClick={() => onSelectCompany(co.company_slug)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 cursor-pointer transition group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                            {co.company_name.charAt(0)}
                          </span>
                          <span className="font-semibold text-slate-200 group-hover:text-amber-400 text-xs">{co.company_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500 text-[11px]">{co.timeframe}</span>
                          <span className="font-mono text-amber-400 font-bold">{co.frequency}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
