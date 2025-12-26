const RUNS_KEY = 'runtrack:runs:v1';
const SETTINGS_KEY = 'runtrack:settings:v1';

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function getRuns() {
  return safeParse(localStorage.getItem(RUNS_KEY), []);
}

export function addRun(run) {
  const runs = getRuns();
  runs.unshift(run);
  localStorage.setItem(RUNS_KEY, JSON.stringify(runs));
  return run;
}

export function getSettings() {
  return safeParse(localStorage.getItem(SETTINGS_KEY), {
    unit: 'km', // default
  });
}

export function getUnit() {
  return getSettings().unit === 'mi' ? 'mi' : 'km';
}

export function setUnit(unit) {
  const settings = getSettings();
  settings.unit = unit === 'mi' ? 'mi' : 'km';
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function deleteRun(runId) {
  const runs = getRuns();
  const next = runs.filter(r => r.id !== runId);
  localStorage.setItem(RUNS_KEY, JSON.stringify(next));
  return next.length !== runs.length; // true if something was deleted
}
