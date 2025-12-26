export const PERIODS = ['week', 'month', 'all'];

export function startOfWeekISO(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function inPeriod(runDateString, period, now = new Date()) {
  const runDate = new Date(runDateString);
  if (period === 'week') return runDate >= startOfWeekISO(now);
  if (period === 'month') return runDate >= startOfMonth(now);
  return true; // all
}
