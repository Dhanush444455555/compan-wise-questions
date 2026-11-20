// LeetCode Company Wise Navigator - Frontend Application

const STATE = {
  currentView: 'companies',
  companies: [],
  filteredCompanies: [],
  topCompanies: [],
  minQuestions: 0,
  companySort: 'popular',
  companySearch: '',
  
  // Selected Company State
  selectedCompany: null,
  activeTimeframe: 'all',
  activeDifficulty: '',
  activeTopic: '',
  activeSearch: '',
  activeSort: 'frequency_desc',
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,
  currentQuestions: [],

  // Global Search State
  globalSearchQuery: '',

  // Tracker State (persisted to localStorage)
  solvedQuestions: {},
  favoriteQuestions: {},
  trackerSubTab: 'solved',

  // Comparison State
  comp1Data: null,
  comp2Data: null
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadLocalStorage();
  initTheme();
  loadGlobalStats();
  loadCompanies();
  handleUrlParams();
  setupKeyboardShortcuts();
});

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+K or / to focus search
    if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement.tagName !== 'INPUT')) {
      e.preventDefault();
      const searchInput = document.getElementById('headerSearchInput');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
    // Escape to close or go back
    if (e.key === 'Escape') {
      if (STATE.currentView === 'company-detail') {
        switchView('companies');
      }
    }
  });
}

// LocalStorage persistence for Solved & Favorites
function loadLocalStorage() {
  try {
    const solved = localStorage.getItem('lc_solved_problems');
    if (solved) STATE.solvedQuestions = JSON.parse(solved);

    const favs = localStorage.getItem('lc_favorite_problems');
    if (favs) STATE.favoriteQuestions = JSON.parse(favs);
  } catch (e) {
    console.error('Error reading localStorage:', e);
  }
  updateHeaderTrackerCounts();
}

function saveLocalStorage() {
  try {
    localStorage.setItem('lc_solved_problems', JSON.stringify(STATE.solvedQuestions));
    localStorage.setItem('lc_favorite_problems', JSON.stringify(STATE.favoriteQuestions));
  } catch (e) {
    console.error('Error saving localStorage:', e);
  }
  updateHeaderTrackerCounts();
}

function updateHeaderTrackerCounts() {
  const solvedCount = Object.keys(STATE.solvedQuestions).length;
  const favCount = Object.keys(STATE.favoriteQuestions).length;

  const headerSolved = document.getElementById('headerSolvedCount');
  const headerFav = document.getElementById('headerFavCount');
  if (headerSolved) headerSolved.textContent = solvedCount;
  if (headerFav) headerFav.textContent = favCount;

  // Update Tracker tab counters if visible
  const tSolved = document.getElementById('trackerSolvedTotal');
  const tFavs = document.getElementById('trackerFavsTotal');
  const tTabSolved = document.getElementById('trackerTabSolvedCount');
  const tTabFavs = document.getElementById('trackerTabFavsCount');

  if (tSolved) tSolved.textContent = solvedCount;
  if (tFavs) tFavs.textContent = favCount;
  if (tTabSolved) tTabSolved.textContent = solvedCount;
  if (tTabFavs) tTabFavs.textContent = favCount;
}

// Theme handling
function initTheme() {
  const savedTheme = localStorage.getItem('lc_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('lc_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  if (theme === 'light') {
    icon.setAttribute('data-lucide', 'moon');
  } else {
    icon.setAttribute('data-lucide', 'sun');
  }
  if (window.lucide) lucide.createIcons();
}

// URL param parsing (deep linking support: e.g. ?company=google&timeframe=thirty_days)
function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const companySlug = params.get('company');
  const tf = params.get('timeframe');
  const view = params.get('view');

  if (view && ['companies', 'search', 'compare', 'tracker'].includes(view)) {
    switchView(view);
  }

  if (companySlug) {
    if (tf) STATE.activeTimeframe = tf;
    openCompany(companySlug);
  }
}

function syncUrlParams() {
  const params = new URLSearchParams();
  if (STATE.currentView === 'company-detail' && STATE.selectedCompany) {
    params.set('company', STATE.selectedCompany.slug);
    if (STATE.activeTimeframe !== 'all') {
      params.set('timeframe', STATE.activeTimeframe);
    }
  } else if (STATE.currentView !== 'companies') {
    params.set('view', STATE.currentView);
  }
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  window.history.replaceState({}, '', newUrl);
}

// ==========================================
// VIEW SWITCHING
// ==========================================
function switchView(viewName) {
  STATE.currentView = viewName;
  syncUrlParams();

  // Hide all panels
  document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));

  // Deactivate all nav tabs
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.remove('text-amber-400', 'bg-amber-500/10', 'border', 'border-amber-500/20');
    t.classList.add('text-slate-400');
  });

  const activeNavTab = document.getElementById(`navTab-${viewName}`);
  if (activeNavTab) {
    activeNavTab.classList.remove('text-slate-400');
    activeNavTab.classList.add('text-amber-400', 'bg-amber-500/10', 'border', 'border-amber-500/20');
  }

  // Show active view
  const targetView = document.getElementById(`view-${viewName}`);
  if (targetView) targetView.classList.remove('hidden');

  if (viewName === 'compare') {
    populateCompareDropdowns();
  } else if (viewName === 'tracker') {
    renderTrackerTable();
  }

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// GLOBAL STATS & COMPANIES DATA
// ==========================================
async function loadGlobalStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();

    document.getElementById('statTotalCompanies').textContent = (data.total_companies || 470).toLocaleString();
    document.getElementById('statUniqueProblems').textContent = (data.unique_problems || 3396).toLocaleString();
    document.getElementById('statTotalRecords').textContent = (data.total_question_records || 36347).toLocaleString();

    STATE.topCompanies = data.top_companies || [];
    renderTopCompaniesPills();
  } catch (e) {
    console.error('Failed to load global stats:', e);
  }
}

function renderTopCompaniesPills() {
  const container = document.getElementById('topCompaniesPills');
  if (!container) return;

  container.innerHTML = STATE.topCompanies.map(c => `
    <button onclick="openCompany('${c.slug}')" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition group shadow-sm">
      <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px]">
        ${c.name.charAt(0)}
      </span>
      <span class="font-medium group-hover:text-amber-400">${c.name}</span>
      <span class="text-[11px] text-slate-500 font-mono">(${c.total_questions})</span>
    </button>
  `).join('');
}

async function loadCompanies() {
  const loading = document.getElementById('companiesLoading');
  if (loading) loading.classList.remove('hidden');

  try {
    const res = await fetch('/api/companies?limit=500');
    const data = await res.json();
    STATE.companies = data.companies || [];
    filterCompanies();
  } catch (e) {
    console.error('Failed to load companies:', e);
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

let filterDebounceTimeout = null;
function debouncedFilterCompanies() {
  clearTimeout(filterDebounceTimeout);
  filterDebounceTimeout = setTimeout(filterCompanies, 200);
}

function setMinQuestions(min) {
  STATE.minQuestions = min;
  document.querySelectorAll('.min-q-btn').forEach(btn => {
    const btnMin = parseInt(btn.getAttribute('data-min'), 10);
    if (btnMin === min) {
      btn.className = 'min-q-btn px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-semibold';
    } else {
      btn.className = 'min-q-btn px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300';
    }
  });
  filterCompanies();
}

function resetCompanyFilters() {
  const searchInput = document.getElementById('companySearchInput');
  const sortSelect = document.getElementById('companySortSelect');
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'popular';
  STATE.companySearch = '';
  STATE.companySort = 'popular';
  setMinQuestions(0);
}

function filterCompanies() {
  const searchInput = document.getElementById('companySearchInput');
  const sortSelect = document.getElementById('companySortSelect');

  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const sort = sortSelect ? sortSelect.value : 'popular';

  let list = STATE.companies.filter(c => {
    if (c.total_questions < STATE.minQuestions) return false;
    if (query && !c.name.toLowerCase().includes(query) && !c.slug.includes(query)) return false;
    return true;
  });

  // Sort
  if (sort === 'popular') {
    list.sort((a, b) => b.total_questions - a.total_questions || a.name.localeCompare(b.name));
  } else if (sort === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'easy') {
    list.sort((a, b) => b.easy_count - a.easy_count);
  } else if (sort === 'medium') {
    list.sort((a, b) => b.medium_count - a.medium_count);
  } else if (sort === 'hard') {
    list.sort((a, b) => b.hard_count - a.hard_count);
  }

  STATE.filteredCompanies = list;
  renderCompaniesGrid();
}

function renderCompaniesGrid() {
  const grid = document.getElementById('companiesGrid');
  const empty = document.getElementById('companiesEmpty');
  if (!grid) return;

  if (STATE.filteredCompanies.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  grid.innerHTML = STATE.filteredCompanies.map(c => {
    const total = c.total_questions || 1;
    const easyPct = Math.round((c.easy_count / total) * 100);
    const medPct = Math.round((c.medium_count / total) * 100);
    const hardPct = Math.round((c.hard_count / total) * 100);

    const initial = c.name.charAt(0).toUpperCase();

    // Topics chips (up to 3)
    const topicsHtml = (c.top_topics || []).slice(0, 3).map(t => `
      <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 truncate max-w-[90px]">
        ${t}
      </span>
    `).join('');

    return `
      <div 
        onclick="openCompany('${c.slug}')" 
        class="company-card bg-slate-900 border border-slate-800 hover:border-amber-500/60 rounded-xl p-4 cursor-pointer flex flex-col justify-between group shadow-sm transition"
      >
        <div>
          <!-- Header: Initial badge + Name + Total count -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-amber-500/20 group-hover:text-amber-400 border border-slate-700 group-hover:border-amber-500/30 flex items-center justify-center font-bold text-sm text-slate-200 transition">
                ${initial}
              </div>
              <div>
                <h3 class="font-bold text-sm text-white group-hover:text-amber-400 transition leading-tight">
                  ${c.name}
                </h3>
                <div class="text-[11px] text-slate-500 mt-0.5">
                  ${c.all_time_count} Total Records
                </div>
              </div>
            </div>

            <span class="px-2 py-0.5 text-xs font-mono font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
              ${c.total_questions} Qs
            </span>
          </div>

          <!-- Difficulty Breakdown Bar -->
          <div class="space-y-1 mb-3">
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
              <div class="bg-emerald-500 h-full" style="width: ${easyPct}%" title="Easy: ${c.easy_count}"></div>
              <div class="bg-amber-500 h-full" style="width: ${medPct}%" title="Medium: ${c.medium_count}"></div>
              <div class="bg-rose-500 h-full" style="width: ${hardPct}%" title="Hard: ${c.hard_count}"></div>
            </div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 font-medium">
              <span class="text-emerald-400 font-semibold">${c.easy_count} Easy</span>
              <span class="text-amber-400 font-semibold">${c.medium_count} Med</span>
              <span class="text-rose-400 font-semibold">${c.hard_count} Hard</span>
            </div>
          </div>

          <!-- Top topics chips -->
          <div class="flex flex-wrap gap-1 mb-3">
            ${topicsHtml}
          </div>
        </div>

        <!-- Footer: Recent 30-day count & Explore arrow -->
        <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span class="flex items-center gap-1 text-[11px]">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i>
            <span>30D: <b class="text-slate-200">${c.thirty_days_count}</b></span>
          </span>
          <span class="flex items-center gap-1 text-amber-400 font-medium group-hover:translate-x-1 transition-transform">
            <span>Explore</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// VIEW 2: COMPANY DETAIL VIEW
// ==========================================
async function openCompany(slug) {
  try {
    const res = await fetch(`/api/companies/${slug}`);
    if (!res.status === 200) {
      alert('Company not found');
      return;
    }
    const company = await res.json();
    STATE.selectedCompany = company;

    // Populate Hero Card
    document.getElementById('companyHeroName').textContent = company.name;
    document.getElementById('companyHeroTotalPill').textContent = `${company.total_questions.toLocaleString()} Questions`;
    document.getElementById('companyHeroAvatar').textContent = company.name.charAt(0).toUpperCase();

    // Difficulties count & bar
    const total = company.total_questions || 1;
    const easyPct = Math.round((company.easy_count / total) * 100);
    const medPct = Math.round((company.medium_count / total) * 100);
    const hardPct = Math.round((company.hard_count / total) * 100);

    document.getElementById('heroEasyCount').textContent = `Easy: ${company.easy_count}`;
    document.getElementById('heroMediumCount').textContent = `Medium: ${company.medium_count}`;
    document.getElementById('heroHardCount').textContent = `Hard: ${company.hard_count}`;

    document.getElementById('heroEasyBar').style.width = `${easyPct}%`;
    document.getElementById('heroMediumBar').style.width = `${medPct}%`;
    document.getElementById('heroHardBar').style.width = `${hardPct}%`;

    // Solved in company status
    updateCompanySolvedStatus();

    // Top Topics
    const topicsContainer = document.getElementById('heroTopics');
    if (topicsContainer) {
      topicsContainer.innerHTML = (company.top_topics || []).map(t => `
        <span onclick="setTopicFilter('${t}')" class="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 cursor-pointer transition">
          ${t}
        </span>
      `).join('');
    }

    // Timeframe Badges
    (company.timeframes || []).forEach(tf => {
      const badge = document.getElementById(`tfBadge-${tf.key}`);
      if (badge) badge.textContent = `(${tf.count})`;
    });

    // Reset filters
    STATE.activeDifficulty = '';
    STATE.activeTopic = '';
    STATE.activeSearch = '';
    STATE.activeSort = 'frequency_desc';
    STATE.currentPage = 1;

    const searchInput = document.getElementById('questionSearchInput');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('questionSortSelect');
    if (sortSelect) sortSelect.value = 'frequency_desc';

    // Difficulty buttons styling
    updateDifficultyButtons();

    // Switch view
    document.querySelectorAll('.view-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById('view-company-detail').classList.remove('hidden');
    STATE.currentView = 'company-detail';
    syncUrlParams();

    // Fetch questions
    await fetchCompanyQuestions(1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error('Failed to open company:', e);
  }
}

function updateCompanySolvedStatus() {
  if (!STATE.selectedCompany) return;
  const statusEl = document.getElementById('companyHeroSolvedStatus');
  if (!statusEl) return;

  const solvedKeys = Object.keys(STATE.solvedQuestions);
  // We can count solved in current list
  statusEl.textContent = `${solvedKeys.length} Globally Solved`;
}

function setTimeframe(tfKey) {
  STATE.activeTimeframe = tfKey;
  STATE.currentPage = 1;

  // Update tabs styling
  const labels = {
    'all': 'All Time',
    'thirty_days': 'Past 30 Days',
    'three_months': 'Past 3 Months',
    'six_months': 'Past 6 Months',
    'more_than_six_months': '> 6 Months'
  };

  const labelEl = document.getElementById('activeTimeframeLabel');
  if (labelEl) labelEl.textContent = labels[tfKey] || tfKey;

  document.querySelectorAll('.tf-btn').forEach(btn => {
    if (btn.getAttribute('data-tf') === tfKey) {
      btn.className = 'tf-btn px-4 py-2 rounded-lg text-xs font-semibold transition bg-amber-500 text-slate-950 shadow-sm';
    } else {
      btn.className = 'tf-btn px-4 py-2 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-slate-800';
    }
  });

  syncUrlParams();
  fetchCompanyQuestions(1);
}

function setDifficultyFilter(diff) {
  STATE.activeDifficulty = diff;
  STATE.currentPage = 1;
  updateDifficultyButtons();
  fetchCompanyQuestions(1);
}

function updateDifficultyButtons() {
  document.querySelectorAll('.diff-btn').forEach(btn => {
    const d = btn.getAttribute('data-diff');
    if (d === STATE.activeDifficulty) {
      btn.classList.add('bg-slate-700', 'text-white', 'font-bold');
    } else {
      btn.classList.remove('bg-slate-700', 'text-white', 'font-bold');
    }
  });
}

function setTopicFilter(topic) {
  const select = document.getElementById('topicFilterSelect');
  if (select) {
    select.value = topic;
    STATE.activeTopic = topic;
    fetchCompanyQuestions(1);
  }
}

let questionSearchDebounce = null;
function debouncedFetchCompanyQuestions() {
  clearTimeout(questionSearchDebounce);
  questionSearchDebounce = setTimeout(() => {
    fetchCompanyQuestions(1);
  }, 250);
}

async function fetchCompanyQuestions(page = 1) {
  if (!STATE.selectedCompany) return;

  STATE.currentPage = page;
  const loading = document.getElementById('questionsTableLoading');
  const tableBody = document.getElementById('questionsTableBody');
  const empty = document.getElementById('questionsEmpty');

  if (loading) loading.classList.remove('hidden');

  const searchInput = document.getElementById('questionSearchInput');
  const topicSelect = document.getElementById('topicFilterSelect');
  const sortSelect = document.getElementById('questionSortSelect');

  const searchQuery = searchInput ? searchInput.value.trim() : '';
  const topicQuery = topicSelect ? topicSelect.value : '';
  const sortQuery = sortSelect ? sortSelect.value : 'frequency_desc';

  const params = new URLSearchParams({
    timeframe: STATE.activeTimeframe,
    page: page.toString(),
    page_size: STATE.pageSize.toString(),
    sort: sortQuery
  });

  if (STATE.activeDifficulty) params.append('difficulty', STATE.activeDifficulty);
  if (topicQuery) params.append('topic', topicQuery);
  if (searchQuery) params.append('search', searchQuery);

  try {
    const res = await fetch(`/api/companies/${STATE.selectedCompany.slug}/questions?${params.toString()}`);
    const data = await res.json();

    STATE.currentQuestions = data.questions || [];
    STATE.totalPages = data.total_pages || 1;

    // Populate topics dropdown if empty or on timeframe switch
    if (topicSelect && topicSelect.options.length <= 1 && data.available_topics) {
      topicSelect.innerHTML = '<option value="">All Topics (Any)</option>' +
        data.available_topics.map(t => `<option value="${t}" ${t === topicQuery ? 'selected' : ''}>${t}</option>`).join('');
    }

    document.getElementById('questionsCountBadge').textContent = (data.total || 0).toLocaleString();
    document.getElementById('currentPageNum').textContent = data.page || 1;
    document.getElementById('totalPageNum').textContent = data.total_pages || 1;

    const startItem = (data.page - 1) * STATE.pageSize + 1;
    const endItem = Math.min(data.page * STATE.pageSize, data.total);
    document.getElementById('pageItemsRange').textContent = data.total > 0 ? `Showing ${startItem}-${endItem} of ${data.total}` : '0 questions';

    document.getElementById('prevPageBtn').disabled = data.page <= 1;
    document.getElementById('nextPageBtn').disabled = data.page >= data.total_pages;

    renderQuestionsTable();
  } catch (e) {
    console.error('Failed to load company questions:', e);
  } finally {
    if (loading) loading.classList.add('hidden');
  }
}

function changeQuestionPage(delta) {
  const newPage = STATE.currentPage + delta;
  if (newPage >= 1 && newPage <= STATE.totalPages) {
    fetchCompanyQuestions(newPage);
  }
}

function applyLocalClientFilters() {
  renderQuestionsTable();
}

function renderQuestionsTable() {
  const tbody = document.getElementById('questionsTableBody');
  const empty = document.getElementById('questionsEmpty');
  if (!tbody) return;

  const solvedOnly = document.getElementById('filterSolvedOnly')?.checked || false;
  const bookmarkedOnly = document.getElementById('filterBookmarkedOnly')?.checked || false;

  let questions = STATE.currentQuestions.filter(q => {
    const isSolved = !!STATE.solvedQuestions[q.title];
    const isFav = !!STATE.favoriteQuestions[q.title];

    if (solvedOnly && !isSolved) return false;
    if (bookmarkedOnly && !isFav) return false;
    return true;
  });

  if (questions.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = questions.map((q, idx) => {
    const isSolved = !!STATE.solvedQuestions[q.title];
    const isFav = !!STATE.favoriteQuestions[q.title];

    let diffBadgeClass = 'badge-medium';
    if (q.difficulty === 'EASY') diffBadgeClass = 'badge-easy';
    if (q.difficulty === 'HARD') diffBadgeClass = 'badge-hard';

    // Topics chips (up to 3)
    const topicList = q.topics ? q.topics.split(',').map(t => t.trim()).filter(Boolean) : [];
    const topicsHtml = topicList.slice(0, 3).map(t => `
      <span onclick="setTopicFilter('${t}')" class="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-700 cursor-pointer border border-slate-700/60 transition">
        ${t}
      </span>
    `).join('') + (topicList.length > 3 ? `<span class="text-[10px] text-slate-500">+${topicList.length - 3}</span>` : '');

    const freqVal = q.frequency || 0;
    const accRateVal = q.acceptance_rate || 0;

    return `
      <tr class="hover:bg-slate-800/40 transition group ${isSolved ? 'bg-emerald-950/10' : ''}">
        
        <!-- Solved Checkbox -->
        <td class="py-3 px-3 text-center">
          <input 
            type="checkbox" 
            ${isSolved ? 'checked' : ''} 
            onchange="toggleSolvedProblem('${escapeQuotes(q.title)}', '${q.difficulty}', '${escapeQuotes(q.link)}', '${escapeQuotes(q.topics)}')"
            class="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
            title="Mark Solved"
          >
        </td>

        <!-- Favorite Star -->
        <td class="py-3 px-2 text-center">
          <button 
            onclick="toggleFavoriteProblem('${escapeQuotes(q.title)}', '${q.difficulty}', '${escapeQuotes(q.link)}', '${escapeQuotes(q.topics)}')"
            class="text-slate-600 hover:text-amber-400 transition"
            title="Bookmark for Revision"
          >
            <i data-lucide="star" class="w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}"></i>
          </button>
        </td>

        <!-- Problem Title + Link -->
        <td class="py-3 px-4 font-medium">
          <div class="flex items-center gap-2">
            <a 
              href="${q.link || 'https://leetcode.com'}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="text-slate-100 hover:text-amber-400 transition flex items-center gap-1.5 font-semibold group-hover:underline"
            >
              <span>${q.title}</span>
              <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-60 group-hover:opacity-100 transition"></i>
            </a>
          </div>
        </td>

        <!-- Difficulty Badge -->
        <td class="py-3 px-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${diffBadgeClass}">
            ${q.difficulty}
          </span>
        </td>

        <!-- Frequency Bar -->
        <td class="py-3 px-4">
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-slate-400">Score</span>
              <span class="font-bold text-slate-200">${freqVal}%</span>
            </div>
            <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div class="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full" style="width: ${Math.min(freqVal, 100)}%"></div>
            </div>
          </div>
        </td>

        <!-- Acceptance Rate -->
        <td class="py-3 px-4 text-center font-mono text-xs text-slate-300">
          ${accRateVal > 0 ? `${accRateVal}%` : 'N/A'}
        </td>

        <!-- Topics -->
        <td class="py-3 px-4">
          <div class="flex flex-wrap items-center gap-1">
            ${topicsHtml || '<span class="text-xs text-slate-600">None</span>'}
          </div>
        </td>

        <!-- Action: Solve Button -->
        <td class="py-3 px-4 text-center">
          <a 
            href="${q.link || 'https://leetcode.com'}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <span>Solve</span>
            <i data-lucide="arrow-up-right" class="w-3 h-3"></i>
          </a>
        </td>

      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function escapeQuotes(str) {
  if (!str) return '';
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// Solved & Favorite Toggle handlers
function toggleSolvedProblem(title, difficulty, link, topics) {
  if (STATE.solvedQuestions[title]) {
    delete STATE.solvedQuestions[title];
  } else {
    STATE.solvedQuestions[title] = {
      title,
      difficulty,
      link,
      topics,
      solvedAt: new Date().toISOString()
    };
  }
  saveLocalStorage();
  updateCompanySolvedStatus();
  renderQuestionsTable();
}

function toggleFavoriteProblem(title, difficulty, link, topics) {
  if (STATE.favoriteQuestions[title]) {
    delete STATE.favoriteQuestions[title];
  } else {
    STATE.favoriteQuestions[title] = {
      title,
      difficulty,
      link,
      topics,
      savedAt: new Date().toISOString()
    };
  }
  saveLocalStorage();
  renderQuestionsTable();
}

// Export Company Questions to CSV
function exportCurrentQuestionsToCSV() {
  if (!STATE.selectedCompany || STATE.currentQuestions.length === 0) {
    alert('No questions to export');
    return;
  }

  const headers = ['Difficulty', 'Title', 'Frequency', 'Acceptance Rate (%)', 'LeetCode Link', 'Topics'];
  const rows = STATE.currentQuestions.map(q => [
    q.difficulty,
    `"${q.title.replace(/"/g, '""')}"`,
    q.frequency,
    q.acceptance_rate,
    q.link,
    `"${(q.topics || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${STATE.selectedCompany.slug}_${STATE.activeTimeframe}_questions.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ==========================================
// VIEW 3: GLOBAL PROBLEM FINDER
// ==========================================
function handleHeaderSearch() {
  const input = document.getElementById('headerSearchInput');
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;

  switchView('search');
  const mainInput = document.getElementById('globalSearchMainInput');
  if (mainInput) mainInput.value = q;
  executeGlobalSearch();
}

function setGlobalSearchTerm(term) {
  const mainInput = document.getElementById('globalSearchMainInput');
  if (mainInput) mainInput.value = term;
  executeGlobalSearch();
}

async function executeGlobalSearch() {
  const mainInput = document.getElementById('globalSearchMainInput');
  const query = (mainInput ? mainInput.value : '').trim();
  if (query.length < 2) {
    alert('Please enter at least 2 characters to search');
    return;
  }

  const container = document.getElementById('globalSearchResults');
  const empty = document.getElementById('globalSearchEmpty');
  if (!container) return;

  container.innerHTML = `
    <div class="py-12 text-center text-slate-400 space-y-3">
      <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
      <p>Searching 36,347 questions across 470 companies...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=150`);
    const data = await res.json();
    const problems = data.problems || [];

    if (problems.length === 0) {
      container.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }

    if (empty) empty.classList.add('hidden');

    container.innerHTML = problems.map(p => {
      let diffBadge = 'badge-medium';
      if (p.difficulty === 'EASY') diffBadge = 'badge-easy';
      if (p.difficulty === 'HARD') diffBadge = 'badge-hard';

      const isSolved = !!STATE.solvedQuestions[p.title];
      const isFav = !!STATE.favoriteQuestions[p.title];

      const companiesListHtml = p.companies.map(c => `
        <div 
          onclick="openCompany('${c.company_slug}')" 
          class="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 cursor-pointer transition group"
        >
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
              ${c.company_name.charAt(0)}
            </span>
            <span class="font-semibold text-slate-200 group-hover:text-amber-400 text-xs">${c.company_name}</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="text-slate-500 text-[11px]">${c.timeframe}</span>
            <span class="font-mono text-amber-400 font-bold">${c.frequency}%</span>
          </div>
        </div>
      `).join('');

      return `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3">
              <button 
                onclick="toggleFavoriteProblem('${escapeQuotes(p.title)}', '${p.difficulty}', '${escapeQuotes(p.link)}', '${escapeQuotes(p.topics)}')"
                class="mt-1 text-slate-600 hover:text-amber-400 transition"
              >
                <i data-lucide="star" class="w-5 h-5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}"></i>
              </button>
              <div>
                <div class="flex items-center gap-2.5 flex-wrap">
                  <a 
                    href="${p.link || 'https://leetcode.com'}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="text-lg font-bold text-white hover:text-amber-400 transition flex items-center gap-1.5"
                  >
                    <span>${p.title}</span>
                    <i data-lucide="external-link" class="w-4 h-4 text-slate-500"></i>
                  </a>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffBadge}">
                    ${p.difficulty}
                  </span>
                  <span class="text-xs text-slate-400 font-mono">
                    Acc: ${p.acceptance_rate}%
                  </span>
                </div>
                <div class="text-xs text-slate-500 mt-1">
                  Topics: ${p.topics || 'General'}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-medium">
                Asked by <b>${p.companies.length}</b> Companies
              </span>
              <a 
                href="${p.link || 'https://leetcode.com'}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition"
              >
                Solve on LeetCode ↗
              </a>
            </div>
          </div>

          <!-- Companies Grid for this problem -->
          <div class="pt-2 border-t border-slate-800/80">
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Companies Asking This Problem:</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              ${companiesListHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error('Global search error:', e);
  }
}

// ==========================================
// VIEW 4: COMPANY COMPARISON TOOL
// ==========================================
function populateCompareDropdowns() {
  const sel1 = document.getElementById('compareComp1Select');
  const sel2 = document.getElementById('compareComp2Select');
  if (!sel1 || !sel2) return;

  if (sel1.options.length > 0) return; // already populated

  const sorted = [...STATE.companies].sort((a, b) => b.total_questions - a.total_questions);

  const optionsHtml = sorted.map(c => `
    <option value="${c.slug}">${c.name} (${c.total_questions} questions)</option>
  `).join('');

  sel1.innerHTML = optionsHtml;
  sel2.innerHTML = optionsHtml;

  // Defaults: Google and Meta/Amazon
  if (sel1.options.length > 1) sel1.selectedIndex = 0; // Google
  if (sel2.options.length > 2) sel2.selectedIndex = 1; // Amazon
}

async function runCompanyComparison() {
  const sel1 = document.getElementById('compareComp1Select');
  const sel2 = document.getElementById('compareComp2Select');
  const slug1 = sel1 ? sel1.value : 'google';
  const slug2 = sel2 ? sel2.value : 'amazon';

  if (slug1 === slug2) {
    alert('Please select two different companies to compare');
    return;
  }

  const container = document.getElementById('compareResultsContainer');
  if (container) container.classList.remove('hidden');

  try {
    const [res1, res2] = await Promise.all([
      fetch(`/api/companies/${slug1}/questions?timeframe=all&page_size=500`),
      fetch(`/api/companies/${slug2}/questions?timeframe=all&page_size=500`)
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    const comp1Name = data1.company.name;
    const comp2Name = data2.company.name;

    document.getElementById('comp1OnlyName').textContent = comp1Name;
    document.getElementById('comp2OnlyName').textContent = comp2Name;
    document.getElementById('comp1ThLabel').textContent = `${comp1Name} Freq`;
    document.getElementById('comp2ThLabel').textContent = `${comp2Name} Freq`;

    const map1 = new Map();
    (data1.questions || []).forEach(q => map1.set(q.title, q));

    const map2 = new Map();
    (data2.questions || []).forEach(q => map2.set(q.title, q));

    // Intersection
    const common = [];
    map1.forEach((q1, title) => {
      if (map2.has(title)) {
        const q2 = map2.get(title);
        common.push({
          title,
          difficulty: q1.difficulty,
          link: q1.link,
          freq1: q1.frequency,
          freq2: q2.frequency,
          avgFreq: (q1.frequency + q2.frequency) / 2
        });
      }
    });

    common.sort((a, b) => b.avgFreq - a.avgFreq);

    document.getElementById('comp1OnlyCount').textContent = Math.max(0, map1.size - common.length);
    document.getElementById('comp2OnlyCount').textContent = Math.max(0, map2.size - common.length);
    document.getElementById('compareOverlapCount').textContent = common.length;
    document.getElementById('compareOverlapBadge').textContent = `${common.length} Common Problems`;

    const tbody = document.getElementById('compareOverlapTableBody');
    if (tbody) {
      tbody.innerHTML = common.slice(0, 100).map(q => {
        let diffBadge = 'badge-medium';
        if (q.difficulty === 'EASY') diffBadge = 'badge-easy';
        if (q.difficulty === 'HARD') diffBadge = 'badge-hard';

        return `
          <tr class="hover:bg-slate-800/40 transition">
            <td class="py-2.5 px-3 font-medium">
              <a href="${q.link || 'https://leetcode.com'}" target="_blank" class="text-slate-100 hover:text-amber-400 font-semibold flex items-center gap-1.5">
                <span>${q.title}</span>
                <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-500"></i>
              </a>
            </td>
            <td class="py-2.5 px-3 text-center">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffBadge}">
                ${q.difficulty}
              </span>
            </td>
            <td class="py-2.5 px-3 text-center font-mono text-amber-400 font-bold">
              ${q.freq1}%
            </td>
            <td class="py-2.5 px-3 text-center font-mono text-purple-400 font-bold">
              ${q.freq2}%
            </td>
            <td class="py-2.5 px-3 text-center">
              <a href="${q.link || 'https://leetcode.com'}" target="_blank" class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition">
                Solve ↗
              </a>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (window.lucide) lucide.createIcons();
  } catch (e) {
    console.error('Comparison error:', e);
  }
}

// ==========================================
// VIEW 5: PREP TRACKER
// ==========================================
function switchTrackerSubTab(subTab) {
  STATE.trackerSubTab = subTab;

  const btnSolved = document.getElementById('trackerTab-solved');
  const btnFavs = document.getElementById('trackerTab-favs');

  if (subTab === 'solved') {
    btnSolved.className = 'px-4 py-2 rounded-lg text-xs font-bold transition bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    btnFavs.className = 'px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-slate-200';
  } else {
    btnSolved.className = 'px-4 py-2 rounded-lg text-xs font-bold transition text-slate-400 hover:text-slate-200';
    btnFavs.className = 'px-4 py-2 rounded-lg text-xs font-bold transition bg-amber-500/20 text-amber-300 border border-amber-500/30';
  }

  renderTrackerTable();
}

function renderTrackerTable() {
  const tbody = document.getElementById('trackerTableBody');
  const empty = document.getElementById('trackerEmptyState');
  if (!tbody) return;

  const dataMap = STATE.trackerSubTab === 'solved' ? STATE.solvedQuestions : STATE.favoriteQuestions;
  const items = Object.values(dataMap);

  if (items.length === 0) {
    tbody.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  tbody.innerHTML = items.map(q => {
    const isSolved = !!STATE.solvedQuestions[q.title];
    const isFav = !!STATE.favoriteQuestions[q.title];

    let diffBadge = 'badge-medium';
    if (q.difficulty === 'EASY') diffBadge = 'badge-easy';
    if (q.difficulty === 'HARD') diffBadge = 'badge-hard';

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <td class="py-3 px-3 text-center">
          <input 
            type="checkbox" 
            ${isSolved ? 'checked' : ''} 
            onchange="toggleSolvedProblem('${escapeQuotes(q.title)}', '${q.difficulty}', '${escapeQuotes(q.link)}', '${escapeQuotes(q.topics)}'); renderTrackerTable();"
            class="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 cursor-pointer"
          >
        </td>
        <td class="py-3 px-2 text-center">
          <button 
            onclick="toggleFavoriteProblem('${escapeQuotes(q.title)}', '${q.difficulty}', '${escapeQuotes(q.link)}', '${escapeQuotes(q.topics)}'); renderTrackerTable();"
            class="text-slate-600 hover:text-amber-400 transition"
          >
            <i data-lucide="star" class="w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}"></i>
          </button>
        </td>
        <td class="py-3 px-4 font-semibold text-slate-100">
          <a href="${q.link || 'https://leetcode.com'}" target="_blank" class="hover:text-amber-400 flex items-center gap-1.5 transition">
            <span>${q.title}</span>
            <i data-lucide="external-link" class="w-3.5 h-3.5 text-slate-500"></i>
          </a>
        </td>
        <td class="py-3 px-4 text-center">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${diffBadge}">
            ${q.difficulty}
          </span>
        </td>
        <td class="py-3 px-4 text-xs text-slate-400">
          ${q.topics || 'General'}
        </td>
        <td class="py-3 px-4 text-center">
          <a href="${q.link || 'https://leetcode.com'}" target="_blank" class="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition">
            Solve ↗
          </a>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function confirmClearTracker() {
  if (confirm('Are you sure you want to clear your solved and bookmarked problems? This cannot be undone.')) {
    STATE.solvedQuestions = {};
    STATE.favoriteQuestions = {};
    saveLocalStorage();
    renderTrackerTable();
  }
}

function exportTrackerData() {
  const data = {
    exportDate: new Date().toISOString(),
    solvedQuestions: STATE.solvedQuestions,
    favoriteQuestions: STATE.favoriteQuestions
  };

  const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonStr);
  link.setAttribute('download', 'leetcode_prep_tracker_backup.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
