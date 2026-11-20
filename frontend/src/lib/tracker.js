const SOLVED_KEY = 'lc_solved_problems';
const FAVS_KEY   = 'lc_favorite_problems';

export function loadTracker() {
  try {
    const solved = JSON.parse(localStorage.getItem(SOLVED_KEY) || '{}');
    const favs   = JSON.parse(localStorage.getItem(FAVS_KEY)   || '{}');
    return { solved, favs };
  } catch { return { solved: {}, favs: {} }; }
}

export function saveTracker({ solved, favs }) {
  localStorage.setItem(SOLVED_KEY, JSON.stringify(solved));
  localStorage.setItem(FAVS_KEY,   JSON.stringify(favs));
}

export function toggleSolved(tracker, { title, difficulty, link, topics }) {
  const solved = { ...tracker.solved };
  if (solved[title]) delete solved[title];
  else solved[title] = { title, difficulty, link, topics, solvedAt: new Date().toISOString() };
  return { ...tracker, solved };
}

export function toggleFav(tracker, { title, difficulty, link, topics }) {
  const favs = { ...tracker.favs };
  if (favs[title]) delete favs[title];
  else favs[title] = { title, difficulty, link, topics, savedAt: new Date().toISOString() };
  return { ...tracker, favs };
}
