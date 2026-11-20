import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Building2, Zap, SearchX } from 'lucide-react';
import { fetchCompanies, fetchStats } from '../lib/api';
import { Spinner, SectionEmpty } from './ui';

const QUICK_FILTERS = [
  { label: 'All', min: 0 },
  { label: '50+',          min: 50 },
  { label: '100+',         min: 100 },
  { label: '500+',         min: 500 },
  { label: '1000+ (Tier 1)', min: 1000 },
];

function StatCard({ label, value, sub, icon: Icon, iconColor }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-slate-400 mb-2">
        <span className="text-xs uppercase font-semibold tracking-wider">{label}</span>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function CompanyCard({ company, onClick }) {
  const { name, total_questions, easy_count, medium_count, hard_count, thirty_days_count, top_topics = [], all_time_count } = company;
  const total = total_questions || 1;
  const ep = Math.round((easy_count / total) * 100);
  const mp = Math.round((medium_count / total) * 100);
  const hp = Math.round((hard_count / total) * 100);

  return (
    <div
      onClick={onClick}
      className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 cursor-pointer flex flex-col justify-between group shadow-sm transition fade-in"
    >
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 group-hover:text-amber-400 border border-slate-700 group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm text-slate-200 transition">
              {name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition leading-tight">{name}</h3>
              <div className="text-[11px] text-slate-500 mt-0.5">{all_time_count} Records</div>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {total_questions} Qs
          </span>
        </div>

        {/* Difficulty bar */}
        <div className="space-y-1 mb-3">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${ep}%` }} title={`Easy: ${easy_count}`} />
            <div className="bg-amber-500 h-full"   style={{ width: `${mp}%` }} title={`Med: ${medium_count}`} />
            <div className="bg-rose-500 h-full"    style={{ width: `${hp}%` }} title={`Hard: ${hard_count}`} />
          </div>
          <div className="flex items-center justify-between text-[10px] font-medium">
            <span className="text-emerald-400 font-semibold">{easy_count} Easy</span>
            <span className="text-amber-400 font-semibold">{medium_count} Med</span>
            <span className="text-rose-400 font-semibold">{hard_count} Hard</span>
          </div>
        </div>

        {/* Topics */}
        <div className="flex flex-wrap gap-1 mb-3">
          {top_topics.slice(0, 3).map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[90px]">{t}</span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 text-[11px]">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>30D: <b className="text-slate-200">{thirty_days_count}</b></span>
        </span>
        <span className="flex items-center gap-1 text-amber-400 font-medium group-hover:translate-x-1 transition-transform">
          Explore →
        </span>
      </div>
    </div>
  );
}

export default function CompaniesView({ onSelectCompany }) {
  const [companies, setCompanies]   = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState('popular');
  const [minQ, setMinQ]             = useState(0);

  useEffect(() => {
    Promise.all([fetchStats(), fetchCompanies({ limit: 500 })]).then(([s, c]) => {
      setStats(s);
      setCompanies(c.companies || []);
      setLoading(false);
    });
  }, []);

  const topCompanies = stats?.top_companies || [];

  const filtered = useMemo(() => {
    let list = companies.filter(c =>
      c.total_questions >= minQ &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === 'popular') list.sort((a, b) => b.total_questions - a.total_questions);
    else if (sort === 'name')   list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'easy')   list.sort((a, b) => b.easy_count - a.easy_count);
    else if (sort === 'medium') list.sort((a, b) => b.medium_count - a.medium_count);
    else if (sort === 'hard')   list.sort((a, b) => b.hard_count - a.hard_count);
    return list;
  }, [companies, search, sort, minQ]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Companies"  value={(stats?.total_companies || 470).toLocaleString()}          sub="Tech giants, startups & finance"       icon={Building2} iconColor="text-amber-400"  />
        <StatCard label="Unique Problems"  value={(stats?.unique_problems || 3396).toLocaleString()}         sub="Distinct LeetCode questions"            icon={Search}    iconColor="text-blue-400"   />
        <StatCard label="Company Records"  value={(stats?.total_question_records || 36347).toLocaleString()} sub="Tagged by 5 timeframes"                 icon={Zap}       iconColor="text-emerald-400"/>
        <StatCard label="Time Windows"     value="5 Windows"                                                 sub="30D · 3M · 6M · >6M · All Time"        icon={Zap}       iconColor="text-purple-400" />
      </div>

      {/* Top Companies pills */}
      {topCompanies.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Popular Companies</span>
            <span className="text-xs text-slate-500">Click to instantly explore</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {topCompanies.map(c => (
              <button
                key={c.slug}
                onClick={() => onSelectCompany(c.slug)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition group shadow-sm"
              >
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
                  {c.name.charAt(0)}
                </span>
                <span className="font-medium group-hover:text-amber-400">{c.name}</span>
                <span className="text-[11px] text-slate-500 font-mono">({c.total_questions})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company name (e.g. Google, Amazon, Uber)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="popular">Most Questions</option>
              <option value="name">Alphabetical (A-Z)</option>
              <option value="easy">Most Easy</option>
              <option value="medium">Most Medium</option>
              <option value="hard">Most Hard</option>
            </select>
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 overflow-x-auto text-xs text-slate-400">
          <span>Filter by volume:</span>
          {QUICK_FILTERS.map(f => (
            <button
              key={f.min}
              onClick={() => setMinQ(f.min)}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap transition ${
                minQ === f.min
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-12 text-center space-y-3">
          <Spinner className="w-8 h-8 mx-auto" />
          <p className="text-slate-400">Loading companies catalog…</p>
        </div>
      ) : filtered.length === 0 ? (
        <SectionEmpty
          icon={SearchX}
          title="No companies found"
          sub="Try searching for a different company name or clearing the filters."
          action={
            <button
              onClick={() => { setSearch(''); setMinQ(0); }}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm transition"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <CompanyCard key={c.slug} company={c} onClick={() => onSelectCompany(c.slug)} />
          ))}
        </div>
      )}
    </div>
  );
}
