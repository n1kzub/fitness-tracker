import { getRuns, getUnit } from '../services/runDataStorage.js';
import { formatSecondsToMmSs, formatPaceMmSs } from '../utils/timeFormat.js';
import { distanceInUnit } from './addRunPage.js';

function startOfWeekISO(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Mon=0..Sun=6
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function refreshDashboardStats() {
  const totalDistanceEl = document.querySelector('#statTotalDistance');
  const avgTimeEl = document.querySelector('#statAvgTime');
  const totalRunsEl = document.querySelector('#statTotalRuns');
  const latestPrimaryEl = document.querySelector('#statLatestRunPrimary');
  const latestSecondaryEl = document.querySelector('#statLatestRunSecondary');
  const highlightLabelEl = document.querySelector('#highlightLabel');
  const highlightValueEl = document.querySelector('#highlightValue');

  if (!totalDistanceEl || !avgTimeEl || !totalRunsEl) return;

  const unit = getUnit(); // 'km' | 'mi'
  const runs = getRuns();

  const now = new Date();
  const weekStart = startOfWeekISO(now);
  const monthStart = startOfMonth(now);

  const weekRuns = runs.filter(r => new Date(r.date) >= weekStart);
  const monthRuns = runs.filter(r => new Date(r.date) >= monthStart);

  // Total distance this week (converted to global unit)
  const weekDistance = weekRuns.reduce((sum, r) => {
    const d = distanceInUnit(r.distance, unit);
    return sum + (Number.isFinite(d) ? d : 0);
  }, 0);

  // Avg session time this week
  const weekAvgSec = weekRuns.length
    ? Math.round(weekRuns.reduce((sum, r) => sum + (r.durationSec || 0), 0) / weekRuns.length)
    : 0;

  totalDistanceEl.innerHTML = `${weekDistance.toFixed(1)} <span class="text-lg">${unit}</span>`;
  avgTimeEl.textContent = weekRuns.length ? formatSecondsToMmSs(weekAvgSec) : '0:00';
  totalRunsEl.textContent = String(monthRuns.length);

  // Latest run card
  if (latestPrimaryEl && latestSecondaryEl) {
    const latest = runs[0];
    if (!latest) {
      latestPrimaryEl.textContent = '—';
      latestSecondaryEl.textContent = 'Add a run to see details';
    } else {
      const dist = distanceInUnit(latest.distance, unit);
      const paceSecPerUnit = dist > 0 ? Math.round(latest.durationSec / dist) : 0;

      latestPrimaryEl.textContent = `${dist.toFixed(2)} ${unit} • ${formatSecondsToMmSs(latest.durationSec)}`;
      latestSecondaryEl.textContent = `${formatPaceMmSs(paceSecPerUnit)} min/${unit} • ${latest.date}`;
    }
  }

  // Highlights: best by distance (for now), this month
  if (highlightLabelEl && highlightValueEl) {
    highlightLabelEl.textContent = 'Best Run This Month';

    if (!monthRuns.length) {
      highlightValueEl.textContent = '—';
    } else {
      let best = monthRuns[0];
      let bestDist = distanceInUnit(best.distance, unit);

      for (const r of monthRuns) {
        const d = distanceInUnit(r.distance, unit);
        if (d > bestDist) {
          best = r;
          bestDist = d;
        }
      }

      highlightValueEl.textContent = `${bestDist.toFixed(2)} ${unit} • ${formatSecondsToMmSs(best.durationSec)} • ${best.date}`;
    }
  }
}
