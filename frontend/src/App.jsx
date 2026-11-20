import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CompaniesView from './components/CompaniesView';
import CompanyDetailView from './components/CompanyDetailView';
import SearchView from './components/SearchView';
import CompareView from './components/CompareView';
import TrackerView from './components/TrackerView';
import { loadTracker, saveTracker } from './lib/tracker';
import './index.css';

export default function App() {
  const [view, setView]          = useState('companies');
  const [companySlug, setSlug]   = useState(null);
  const [tracker, setTrackerRaw] = useState(() => loadTracker());
  const [dark, setDark]          = useState(() => (localStorage.getItem('lc_theme') || 'dark') === 'dark');

  // Apply dark class + persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('lc_theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Persist tracker to localStorage on every change
  const setTracker = (updater) => {
    setTrackerRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveTracker(next);
      return next;
    });
  };

  const handleNav = (v) => {
    setView(v);
    if (v !== 'company-detail') setSlug(null);
  };

  const handleSelectCompany = (slug) => {
    setSlug(slug);
    setView('company-detail');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        view={view}
        onNav={handleNav}
        tracker={tracker}
        dark={dark}
        onToggleTheme={() => setDark(d => !d)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {view === 'companies' && (
          <CompaniesView onSelectCompany={handleSelectCompany} />
        )}
        {view === 'company-detail' && companySlug && (
          <CompanyDetailView
            slug={companySlug}
            onBack={() => handleNav('companies')}
            tracker={tracker}
            setTracker={setTracker}
          />
        )}
        {view === 'search' && (
          <SearchView
            onSelectCompany={handleSelectCompany}
            tracker={tracker}
            setTracker={setTracker}
          />
        )}
        {view === 'compare' && <CompareView />}
        {view === 'tracker' && (
          <TrackerView tracker={tracker} setTracker={setTracker} />
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-800/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>⚡ LeetCode Company Wise Navigator • 470 Companies • 36,347 Records</span>
          <span>
            Direct links to{' '}
            <a href="https://leetcode.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">
              LeetCode.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
