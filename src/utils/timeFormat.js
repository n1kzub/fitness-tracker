export function parseMmSsToSeconds(input) {
  const raw = input.trim();
  const parts = raw.split(':');
  if (parts.length !== 2) return null;

  const m = Number(parts[0]);
  const s = Number(parts[1]);

  if (!Number.isFinite(m) || !Number.isFinite(s)) return null;
  if (m < 0 || s < 0 || s >= 60) return null;

  return m * 60 + s;
}

export function formatSecondsToMmSs(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function formatPaceMmSs(paceSecPerUnit) {
  return formatSecondsToMmSs(paceSecPerUnit);
}
