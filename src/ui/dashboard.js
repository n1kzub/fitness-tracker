import { getRuns, getUnit } from '../services/runDataStorage.js';
import { formatSecondsToMmSs, formatPaceMmSs } from '../utils/timeFormat.js';
import { inPeriod } from '../utils/datePeriod.js';
import { distanceInUnit, paceSecPerUnit, sortRunsNewestFirst } from '../utils/runMath.js';

function $(sel) {
  return document.querySelector(sel);
}

export function refreshDashboardStats() {
  const unit = getUnit();
  const now = new Date();

  const totalDistanceEl = $('#statTotalDistance');
  const avgTimeEl = $('#statAvgTime');
  const totalRunsEl = $('#statTotalRuns');
  const latestPrimaryEl = $('#statLatestRunPrimary');
  const latestSecondaryEl = $('#statLatestRunSecondary');
  const highlightLabelEl = $('#highlightLabel');
  const highlightValueEl = $('#highlightValue');

  // If dashboard isn't currently mounted (e.g., user is on another route), exit quietly
  if (!totalDistanceEl || !avgTimeEl || !totalRunsEl || !latestPrimaryEl || !latestSecondaryEl || !highlightLabelEl || !highlightValueEl) {
    return;
  }

  const runs = sortRunsNewestFirst(getRuns());

  // Week + Month sets (based on run.date)
  const weekRuns = runs.filter(r => inPeriod(r.date, 'week', now));
  const monthRuns = runs.filter(r => inPeriod(r.date, 'month', now));

  // 1) Total Distance (This Week)
  const weekDistance = weekRuns.reduce((sum, r) => sum + distanceInUnit(r.distance, unit), 0);
  totalDistanceEl.innerHTML = `${weekDistance.toFixed(1)} <span class="text-lg">${unit}</span>`;

  // 2) Avg. Session Time (This Week) — average duration
  if (weekRuns.length) {
    const totalWeekSec = weekRuns.reduce((sum, r) => sum + (r.durationSec || 0), 0);
    const avgWeekSec = Math.round(totalWeekSec / weekRuns.length);
    avgTimeEl.textContent = formatSecondsToMmSs(avgWeekSec);
  } else {
    avgTimeEl.textContent = '0:00';
  }

  // 3) Total Runs (This Month)
  totalRunsEl.textContent = String(monthRuns.length);

  // 4) Latest Run card (based on newest-first ordering)
  if (runs.length) {
    const latest = runs[0];
    const dist = distanceInUnit(latest.distance, unit);
    const paceSec = paceSecPerUnit(latest.durationSec || 0, dist);

    latestPrimaryEl.textContent = `${dist.toFixed(2)} ${unit} • ${formatSecondsToMmSs(latest.durationSec || 0)}`;
    latestSecondaryEl.textContent = `${formatPaceMmSs(paceSec)} min/${unit} • ${latest.date}`;
  } else {
    latestPrimaryEl.textContent = '—';
    latestSecondaryEl.textContent = 'Add a run to see details';
  }

  // Highlights: best session this month (currently "best" = max distance)
  highlightLabelEl.textContent = 'Best Run This Month';

  if (monthRuns.length) {
    let best = monthRuns[0];
    let bestDist = distanceInUnit(best.distance, unit);

    for (const r of monthRuns) {
      const d = distanceInUnit(r.distance, unit);
      if (d > bestDist) {
        best = r;
        bestDist = d;
      }
    }

    highlightValueEl.textContent = `${bestDist.toFixed(2)} ${unit}`;
  } else {
    highlightValueEl.textContent = '—';
  }
}
