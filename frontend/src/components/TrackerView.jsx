import { useState } from 'react';
import { BookmarkCheck, CheckCircle, Star, Trash2, Download, Award, ExternalLink } from 'lucide-react';
import { DiffBadge, SectionEmpty } from './ui';
import { toggleSolved, toggleFav } from '../lib/tracker';

export default function TrackerView({ tracker, setTracker }) {
  const [tab, setTab] = useState('solved');
  const { solved, favs } = tracker;

  const solvedList = Object.values(solved);
  const favsList   = Object.values(favs);
  const items = tab === 'solved' ? solvedList : favsList;

  const exportData = () => {
    const json = JSON.stringify({ exportDate: new Date().toISOString(), solved, favs }, null, 2);
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
    a.download = 'leetcode_tracker.json';
    a.click();
  };

  const clearAll = () => {
    if (confirm('Clear all solved & bookmarked problems? This cannot be undone.')) {
      setTracker({ solved: {}, favs: {} });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookmarkCheck className="w-6 h-6 text-emerald-400" />
            My Interview Prep Tracker
          </h2>
          <p className="text-sm text-slate-400 mt-1">Keep track of every problem you've solved or saved for revision.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition">
            <Download className="w-4 h-4 text-emerald-400" />
            Export Progress
          </button>
          <button onClick={clearAll} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 border border-rose-500/30 transition">
            <Trash2 className="w-4 h-4" />
            Reset Tracker
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Problems Solved</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">{solvedList.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bookmarked</span>
            <div className="text-3xl font-extrabold text-amber-400 mt-1">{favsList.length}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setTab('solved')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${tab === 'solved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Solved ({solvedList.length})
        </button>
        <button
          onClick={() => setTab('favs')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition ${tab === 'favs' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Bookmarked ({favsList.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {items.length === 0 ? (
          <SectionEmpty icon={Award} title="No items tracked yet" sub="Go to any company problem list and check the box or click the star to start tracking." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center">Done</th>
                  <th className="py-3 px-2 w-8 text-center">★</th>
                  <th className="py-3 px-4">Problem Title</th>
                  <th className="py-3 px-4 w-28 text-center">Difficulty</th>
                  <th className="py-3 px-4">Topics</th>
                  <th className="py-3 px-4 w-24 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {items.map(q => {
                  const isSolved = !!solved[q.title];
                  const isFav    = !!favs[q.title];
                  return (
                    <tr key={q.title} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSolved}
                          onChange={() => setTracker(tr => toggleSolved(tr, q))}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => setTracker(tr => toggleFav(tr, q))} className={`transition ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}`}>
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="hover:text-amber-400 flex items-center gap-1.5 transition">
                          {q.title}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>
                      </td>
                      <td className="py-3 px-4 text-center"><DiffBadge difficulty={q.difficulty} /></td>
                      <td className="py-3 px-4 text-xs text-slate-400">{q.topics || 'General'}</td>
                      <td className="py-3 px-4 text-center">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition">
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
      </div>
    </div>
  );
}
