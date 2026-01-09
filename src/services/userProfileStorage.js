const PROFILE_KEY = 'runtrack.userProfile.v1';

const DEFAULT_PROFILE = {
  username: '',
  avatarDataUrl: '', // for now store base64 data URL; later store avatar_url from API
  theme: 'system',   // 'light' | 'dark' | 'system'
};

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v && typeof v === 'object' ? v : fallback;
  } catch {
    return fallback;
  }
}

export function getUserProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? { ...DEFAULT_PROFILE, ...safeParse(raw, {}) } : { ...DEFAULT_PROFILE };
}

export function setUserProfile(patch) {
  const current = getUserProfile();
  const next = { ...current, ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function clearUserProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export function getTheme() {
  return getUserProfile().theme || 'system';
}

export function setTheme(theme) {
  const t = theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';
  setUserProfile({ theme: t });
  applyTheme(t);
  return t;
}

export function applyTheme(theme = getTheme()) {
  const root = document.documentElement;

  // Determine effective theme
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
  const effective = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Store both
  root.dataset.theme = theme; // user choice
  root.dataset.effectiveTheme = effective; // resolved result

  // Minimal theme effect without needing Tailwind dark: variants everywhere
    const body = document.body;
  if (!body) return;

  if (effective === 'dark') {
    body.style.backgroundColor = '#0b1220';
    body.style.color = '#f2f5f9';
  } else {
    body.style.backgroundColor = '#f7f9fc';
    body.style.color = '#1a1a1a';
  }
}

// Keep theme updated if user chose "system" and OS theme changes
export function watchSystemThemeChanges() {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mq) return;

  const handler = () => {
    if (getTheme() === 'system') applyTheme('system');
  };

  if (mq.addEventListener) mq.addEventListener('change', handler);
  else mq.addListener?.(handler);
}
