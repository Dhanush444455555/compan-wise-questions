import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Download, Inbox, ChevronLeft, ChevronRight, Star, ExternalLink } from 'lucide-react';
import { fetchCompany, fetchCompanyQuestions } from '../lib/api';
import { DiffBadge, FreqBar, Spinner, SectionEmpty } from './ui';
import { toggleSolved, toggleFav } from '../lib/tracker';

const TIMEFRAMES = [
  { key: 'all',                 label: 'All Time',       emoji: '⏳' },
  { key: 'thirty_days',        label: 'Past 30 Days',    emoji: '⚡' },
  { key: 'three_months',       label: 'Past 3 Months',   emoji: '📅' },
  { key: 'six_months',         label: 'Past 6 Months',   emoji: '🗓️' },
  { key: 'more_than_six_months', label: '> 6 Months',    emoji: '📦' },
];

export default function CompanyDetailView({ slug, onBack, tracker, setTracker }) {
  const [company, setCompany]       = useState(null);
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [qLoading, setQLoading]     = useState(false);
  const [timeframe, setTimeframe]   = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [topic, setTopic]           = useState('');
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('frequency_desc');
  const [page, setPage]             = useState(1);
  const [showSolvedOnly, setShowSolvedOnly] = useState(false);
  const [showFavOnly, setShowFavOnly]       = useState(false);

  const { solved, favs } = tracker;

  useEffect(() => {
    setLoading(true);
    fetchCompany(slug).then(c => {
      setCompany(c);
      setLoading(false);
    });
  }, [slug]);

  const loadQuestions = useCallback(() => {
    if (!slug) return;
    setQLoading(true);
    fetchCompanyQuestions(slug, { timeframe, difficulty, topic, search, sort, page }).then(d => {
      setData(d);
      setQLoading(false);
    });
  }, [slug, timeframe, difficulty, topic, search, sort, page]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  // Reset to page 1 when filters change (but not page itself)
  const reset = () => setPage(1);

  const exportCSV = () => {
    if (!data?.questions?.length) return;
    const headers = ['Difficulty','Title','Frequency','Acceptance','Link','Topics'];
    const rows = data.questions.map(q => [
      q.difficulty, `"${q.title}"`, q.frequency, q.acceptance_rate, q.link, `"${q.topics||''}"`
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `${slug}_${timeframe}.csv`;
    a.click();
  };

  if (loading) return (
    <div className="py-24 text-center space-y-3">
      <Spinner className="w-10 h-10 mx-auto" />
      <p className="text-slate-400">Loading company data…</p>
    </div>
  );

  const c = company;
  const total = c.total_questions || 1;
  const ep = Math.round((c.easy_count / total) * 100);
  const mp = Math.round((c.medium_count / total) * 100);
  const hp = Math.round((c.hard_count / total) * 100);

  const questions = data?.questions || [];
  const visibleQ = questions.filter(q => {
    if (showSolvedOnly && !solved[q.title]) return false;
    if (showFavOnly && !favs[q.title]) return false;
    return true;
  });

  return (
    <div className="space-y-6 fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition">
          <ArrowLeft className="w-4 h-4" />
          Back to All Companies
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition">
          <Download className="w-4 h-4 text-amber-400" />
          Export CSV
        </button>
      </div>

      {/* Hero card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800/90 border border-slate-700/80 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-2xl shadow-inner">
              {c.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{c.name}</h2>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-700 text-slate-200 border border-slate-600">
                  {c.total_questions.toLocaleString()} Questions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Frequently asked LeetCode interview problems</span>
                <span>•</span>
                <span className="text-emerald-400">{Object.keys(solved).length} Globally Solved</span>
              </p>
            </div>
          </div>

          {/* Difficulty stats */}
          <div className="w-full md:w-80 space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-emerald-400 font-semibold">Easy: {c.easy_count}</span>
              <span className="text-amber-400 font-semibold">Med: {c.medium_count}</span>
              <span className="text-rose-400 font-semibold">Hard: {c.hard_count}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${ep}%` }} />
              <div className="bg-amber-500 h-full transition-all"  style={{ width: `${mp}%` }} />
              <div className="bg-rose-500 h-full transition-all"   style={{ width: `${hp}%` }} />
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(c.top_topics || []).map(t => (
                <span
                  key={t}
                  onClick={() => { setTopic(t); reset(); }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer transition"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeframe tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 flex flex-wrap gap-1.5 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map(tf => {
            const count = tf.key === 'all' ? c.all_time_count : c[`${tf.key}_count`] || (c.timeframes || []).find(x => x.key === tf.key)?.count || 0;
            const active = timeframe === tf.key;
            return (
              <button
                key={tf.key}
                onClick={() => { setTimeframe(tf.key); reset(); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  active ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {tf.emoji} {tf.label} <span className="opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-400 px-3 py-1">
          Timeframe: <span className="font-bold text-amber-400">{TIMEFRAMES.find(t => t.key === timeframe)?.label}</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              placeholder="Search questions in this company..."
              value={search}
              onChange={e => { setSearch(e.target.value); reset(); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-3 py-1.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Difficulty */}
          <div className="md:col-span-3 flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
            {['', 'EASY', 'MEDIUM', 'HARD'].map(d => (
              <button
                key={d}
                onClick={() => { setDifficulty(d); reset(); }}
                className={`flex-1 py-1 text-xs font-medium rounded text-center transition
                  ${difficulty === d ? 'bg-slate-700 text-white font-bold' : ''}
                  ${d === '' ? 'text-slate-300' : d === 'EASY' ? 'text-emerald-400' : d === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'}`}
              >
                {d || 'All'}
              </button>
            ))}
          </div>

          {/* Topic */}
          <div className="md:col-span-3">
            <select
              value={topic}
              onChange={e => { setTopic(e.target.value); reset(); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Topics</option>
              {(data?.available_topics || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); reset(); }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="frequency_desc">Freq: High→Low</option>
              <option value="frequency_asc">Freq: Low→High</option>
              <option value="acceptance_desc">Acc: High→Low</option>
              <option value="acceptance_asc">Acc: Low→High</option>
              <option value="difficulty">Difficulty: Easy→Hard</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input type="checkbox" checked={showSolvedOnly} onChange={e => setShowSolvedOnly(e.target.checked)} className="rounded border-slate-700 bg-slate-800" />
              <span>Solved only</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-slate-200">
              <input type="checkbox" checked={showFavOnly} onChange={e => setShowFavOnly(e.target.checked)} className="rounded border-slate-700 bg-slate-800" />
              <span>Bookmarked only</span>
            </label>
          </div>
          <div>Total: <span className="font-bold text-white">{(data?.total || 0).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {qLoading ? (
          <div className="py-16 text-center space-y-3">
            <Spinner className="w-8 h-8 mx-auto" />
            <p className="text-slate-400">Loading questions…</p>
          </div>
        ) : visibleQ.length === 0 ? (
          <SectionEmpty icon={Inbox} title="No questions found" sub="Try switching timeframe, clearing topic filters, or searching a different keyword." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/80 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center">Done</th>
                  <th className="py-3 px-2 w-8 text-center">★</th>
                  <th className="py-3 px-4">Problem Title</th>
                  <th className="py-3 px-4 w-28 text-center">Difficulty</th>
                  <th className="py-3 px-4 w-40">Frequency</th>
                  <th className="py-3 px-4 w-28 text-center">Acceptance</th>
                  <th className="py-3 px-4">Topics</th>
                  <th className="py-3 px-4 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleQ.map(q => {
                  const isSolved = !!solved[q.title];
                  const isFav    = !!favs[q.title];
                  const topicList = (q.topics || '').split(',').map(t => t.trim()).filter(Boolean);
                  return (
                    <tr key={q.id} className={`hover:bg-slate-800/40 transition group ${isSolved ? 'bg-emerald-950/10' : ''}`}>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSolved}
                          onChange={() => setTracker(tr => { const n = toggleSolved(tr, q); return n; })}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button
                          onClick={() => setTracker(tr => toggleFav(tr, q))}
                          className={`transition ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="text-slate-100 hover:text-amber-400 transition flex items-center gap-1.5 font-semibold group-hover:underline">
                          {q.title}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center"><DiffBadge difficulty={q.difficulty} /></td>
                      <td className="py-3 px-4"><FreqBar value={q.frequency} /></td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                        {q.acceptance_rate > 0 ? `${q.acceptance_rate}%` : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {topicList.length === 0
                            ? <span className="text-xs text-slate-600">None</span>
                            : topicList.slice(0, 3).map(t => (
                                <span key={t} onClick={() => { setTopic(t); reset(); }}
                                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer border border-slate-700/60 transition">
                                  {t}
                                </span>
                              ))
                          }
                          {topicList.length > 3 && <span className="text-[10px] text-slate-500">+{topicList.length - 3}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm">
                          Solve ↗
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="bg-slate-950/80 px-4 py-3 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Page <span className="font-bold text-white">{data.page}</span> of <span className="font-bold text-white">{data.total_pages}</span></span>
              <span className="text-slate-600">•</span>
              <span>Showing {(data.page - 1) * 50 + 1}–{Math.min(data.page * 50, data.total)} of {data.total}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 transition"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
