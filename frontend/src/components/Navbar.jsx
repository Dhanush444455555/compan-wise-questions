import { Code2, CheckCircle2, Star, Sun, Moon, Building2, Search, GitCompare, BookmarkCheck } from 'lucide-react';

export default function Navbar({ view, onNav, tracker, dark, onToggleTheme }) {
  const { solved, favs } = tracker;
  const solvedCount = Object.keys(solved).length;
  const favCount    = Object.keys(favs).length;

  const tabs = [
    { key: 'companies',      label: 'Companies',       Icon: Building2 },
    { key: 'search',         label: 'Problem Finder',  Icon: Search },
    { key: 'compare',        label: 'Company Comparer',Icon: GitCompare },
    { key: 'tracker',        label: 'My Prep List',    Icon: BookmarkCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNav('companies')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-400 bg-clip-text text-transparent">
                LeetCode Company Wise
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                470+ Companies
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Explore 36,300+ interview questions by company &amp; timeframe
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNav('tracker')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-300 transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Solved:</span>
            <span className="font-bold text-emerald-400">{solvedCount}</span>
            <span className="text-slate-500">|</span>
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-amber-400">{favCount}</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
            title="Toggle theme"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Nav tabs */}
      <div className="bg-slate-900/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-4 overflow-x-auto py-2 text-sm font-medium">
          {tabs.map(({ key, label, Icon }) => {
            const active = view === key || (view === 'company-detail' && key === 'companies');
            return (
              <button
                key={key}
                onClick={() => onNav(key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition whitespace-nowrap
                  ${active
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
