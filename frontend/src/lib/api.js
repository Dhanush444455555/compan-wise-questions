const BASE = '/api';

export async function fetchStats() {
  const r = await fetch(`${BASE}/stats`);
  return r.json();
}

export async function fetchCompanies({ q = '', sort = 'popular', min_questions = 0, limit = 500 } = {}) {
  const p = new URLSearchParams({ limit, sort, min_questions });
  if (q) p.set('q', q);
  const r = await fetch(`${BASE}/companies?${p}`);
  return r.json();
}

export async function fetchCompany(slug) {
  const r = await fetch(`${BASE}/companies/${slug}`);
  if (!r.ok) throw new Error('Company not found');
  return r.json();
}

export async function fetchCompanyQuestions(slug, { timeframe = 'all', difficulty = '', topic = '', search = '', sort = 'frequency_desc', page = 1, page_size = 50 } = {}) {
  const p = new URLSearchParams({ timeframe, sort, page, page_size });
  if (difficulty) p.set('difficulty', difficulty);
  if (topic) p.set('topic', topic);
  if (search) p.set('search', search);
  const r = await fetch(`${BASE}/companies/${slug}/questions?${p}`);
  return r.json();
}

export async function globalSearch(q, limit = 150) {
  const r = await fetch(`${BASE}/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  return r.json();
}
