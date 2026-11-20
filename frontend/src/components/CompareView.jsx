import { useState, useEffect } from 'react';
import { GitCompare, Zap, ExternalLink } from 'lucide-react';
import { fetchCompanies, fetchCompanyQuestions } from '../lib/api';
import { DiffBadge, Spinner } from './ui';

export default function CompareView() {
  const [companies, setCompanies] = useState([]);
  const [slug1, setSlug1] = useState('');
  const [slug2, setSlug2] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompanies({ limit: 500 }).then(d => {
      const sorted = [...(d.companies || [])].sort((a, b) => b.total_questions - a.total_questions);
      setCompanies(sorted);
      if (sorted.length >= 2) {
        setSlug1(sorted[0].slug);
        setSlug2(sorted[1].slug);
      }
    });
  }, []);

  const run = async () => {
    if (!slug1 || !slug2 || slug1 === slug2) return alert('Please select two different companies.');
    setLoading(true);
    const [d1, d2] = await Promise.all([
      fetchCompanyQuestions(slug1, { timeframe: 'all', page_size: 500 }),
      fetchCompanyQuestions(slug2, { timeframe: 'all', page_size: 500 }),
    ]);

    const map1 = new Map((d1.questions || []).map(q => [q.title, q]));
    const map2 = new Map((d2.questions || []).map(q => [q.title, q]));

    const common = [];
    map1.forEach((q1, title) => {
      if (map2.has(title)) {
        const q2 = map2.get(title);
        common.push({ ...q1, freq1: q1.frequency, freq2: q2.frequency, avgFreq: (q1.frequency + q2.frequency) / 2 });
      }
    });
    common.sort((a, b) => b.avgFreq - a.avgFreq);

    setResult({
      comp1: d1.company, comp2: d2.company,
      common,
      only1: map1.size - common.length,
      only2: map2.size - common.length,
    });
    setLoading(false);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Selector card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
          <GitCompare className="w-6 h-6 text-amber-400" />
          Compare Two Companies
        </h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto">
          Discover high-yield questions asked by <b>both</b> companies.
        </p>

        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          {[{ val: slug1, set: setSlug1, label: 'First Company' }, { val: slug2, set: setSlug2, label: 'Second Company' }].map(({ val, set, label }) => (
            <div key={label} className="text-left space-y-1">
              <label className="text-xs font-semibold text-slate-400">{label}</label>
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {companies.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name} ({c.total_questions})</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="pt-3">
          <button
            onClick={run}
            disabled={loading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-60"
          >
            {loading ? 'Comparing…' : 'Compare Companies'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="py-12 text-center space-y-3">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-slate-400">Fetching and comparing…</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6 fade-in">
          {/* Venn summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Unique to <span className="text-white">{result.comp1.name}</span></span>
              <div className="text-3xl font-extrabold text-blue-400 mt-2">{result.only1}</div>
            </div>
            <div className="bg-slate-900 border-2 border-amber-500/50 rounded-xl p-4 text-center bg-amber-500/5">
              <span className="text-xs text-amber-300 uppercase font-bold tracking-wider">🔥 Overlap (Both Companies)</span>
              <div className="text-3xl font-extrabold text-amber-400 mt-2">{result.common.length}</div>
              <p className="text-[11px] text-slate-400 mt-1">Highest yield for combined prep</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
              <span className="text-xs text-slate-400 uppercase font-semibold">Unique to <span className="text-white">{result.comp2.name}</span></span>
              <div className="text-3xl font-extrabold text-purple-400 mt-2">{result.only2}</div>
            </div>
          </div>

          {/* Common questions table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Common Questions (Asked by Both)
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {result.common.length} Problems
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3 w-28 text-center">Difficulty</th>
                    <th className="py-2.5 px-3 w-28 text-center">{result.comp1.name} Freq</th>
                    <th className="py-2.5 px-3 w-28 text-center">{result.comp2.name} Freq</th>
                    <th className="py-2.5 px-3 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {result.common.slice(0, 100).map(q => (
                    <tr key={q.title} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-medium">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="text-slate-100 hover:text-amber-400 font-semibold flex items-center gap-1.5">
                          {q.title}
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>
                      </td>
                      <td className="py-2.5 px-3 text-center"><DiffBadge difficulty={q.difficulty} /></td>
                      <td className="py-2.5 px-3 text-center font-mono text-amber-400 font-bold">{q.freq1}%</td>
                      <td className="py-2.5 px-3 text-center font-mono text-purple-400 font-bold">{q.freq2}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <a href={q.link || 'https://leetcode.com'} target="_blank" rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition">
                          Solve ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
