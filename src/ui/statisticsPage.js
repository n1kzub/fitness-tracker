import { getRuns, getUnit } from '../services/runDataStorage.js';
import { formatSecondsToMmSs, formatPaceMmSs } from '../utils/timeFormat.js';
import { distanceInUnit } from './addRunPage.js';

const PERIODS = ['week', 'month', 'all'];
const EFFORT_OPTIONS = ['All', 'Easy', 'Moderate', 'Hard'];
const WORKOUT_STYLE_OPTIONS = ['All', 'Recovery', 'Easy', 'Steady', 'Tempo', 'Interval', 'Race'];
const SURFACE_OPTIONS = ['All', 'Road', 'Trail', 'Treadmill', 'Track', 'Mixed'];

function startOfWeekISO(d) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function inPeriod(run, period, now) {
  const runDate = new Date(run.date);
  if (period === 'week') return runDate >= startOfWeekISO(now);
  if (period === 'month') return runDate >= startOfMonth(now);
  return true; // all
}

function applyFilters(runs, filters) {
  return runs.filter(r => {
    if (filters.effort !== 'All' && r.effort !== filters.effort) return false;
    if (filters.workoutStyle !== 'All' && r.workoutStyle !== filters.workoutStyle) return false;
    if (filters.surface !== 'All' && r.surface !== filters.surface) return false;
    return true;
  });
}

function computeKPIs(runs, unit) {
  const count = runs.length;

  const totalDistance = runs.reduce((sum, r) => sum + distanceInUnit(r.distance, unit), 0);
  const totalTimeSec = runs.reduce((sum, r) => sum + (r.durationSec || 0), 0);

  const avgPaceSec = totalDistance > 0 ? Math.round(totalTimeSec / totalDistance) : 0;

  let longest = null;
  let longestDist = -1;

  let fastest = null;
  let fastestPace = Infinity;

  for (const r of runs) {
    const dist = distanceInUnit(r.distance, unit);
    if (dist > longestDist) {
      longestDist = dist;
      longest = r;
    }

    const pace = dist > 0 ? (r.durationSec / dist) : Infinity;
    if (pace < fastestPace) {
      fastestPace = pace;
      fastest = r;
    }
  }

  return {
    count,
    totalDistance,
    totalTimeSec,
    avgPaceSec,
    longest,
    longestDist,
    fastest,
    fastestPaceSec: Number.isFinite(fastestPace) ? Math.round(fastestPace) : 0,
  };
}

function fmtRunSummary(run, unit) {
  if (!run) return '—';
  const dist = distanceInUnit(run.distance, unit);
  const paceSec = dist > 0 ? Math.round(run.durationSec / dist) : 0;
  return `${dist.toFixed(2)} ${unit} • ${formatSecondsToMmSs(run.durationSec)} • ${formatPaceMmSs(paceSec)} min/${unit} • ${run.date}`;
}

function updateUI(root, state) {
  const unit = getUnit();
  const now = new Date();

  const allRuns = getRuns().filter(r => inPeriod(r, state.period, now));
  const filtered = applyFilters(allRuns, state.filters);

  const k = computeKPIs(filtered, unit);

  // Top helpers
  root.querySelector('#statsUnitInfo').textContent = `Units: ${unit} • Pace: min/${unit}`;

  // KPIs
  root.querySelector('#kpiTotalDistance').innerHTML = `${k.totalDistance.toFixed(2)} <span class="text-lg">${unit}</span>`;
  root.querySelector('#kpiTotalTime').textContent = formatSecondsToMmSs(k.totalTimeSec);
  root.querySelector('#kpiRuns').textContent = String(k.count);
  root.querySelector('#kpiAvgPace').textContent = k.count && k.avgPaceSec ? `${formatPaceMmSs(k.avgPaceSec)} min/${unit}` : `—`;

  // Bests
  root.querySelector('#bestLongest').textContent = k.longest ? `${k.longestDist.toFixed(2)} ${unit} • ${k.longest.date}` : '—';
  root.querySelector('#bestFastest').textContent = k.fastest ? `${formatPaceMmSs(k.fastestPaceSec)} min/${unit} • ${k.fastest.date}` : '—';

  // Chart placeholder label
  const periodLabel = state.period === 'week' ? 'This Week' : state.period === 'month' ? 'This Month' : 'All Time';
  root.querySelector('#chartSubtitle').textContent = `${periodLabel} • ${k.count} runs (filtered)`;

  // “AI insights” placeholder can optionally show a data-aware message
  root.querySelector('#aiSubtitle').textContent = k.count
    ? 'AI insights will appear here once enabled.'
    : 'Add runs to unlock insights.';
}

export function renderStatisticsPage() {
  const root = document.createElement('section');
  root.className = 'space-y-8';

  const state = {
    period: 'week',
    filters: {
      effort: 'All',
      workoutStyle: 'All',
      surface: 'All',
    }
  };

  root.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h2 class="text-3xl font-semibold">Statistics</h2>
        <p id="statsUnitInfo" class="text-sm text-gray-500 mt-1">Units: —</p>
      </div>

      <!-- Period + Filters -->
      <div class="bg-white rounded-xl p-4 shadow-sm w-full md:w-auto">
        <div class="flex flex-col md:flex-row gap-3 md:items-center">
          <div class="flex gap-2">
            ${PERIODS.map(p => {
              const label = p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All';
              const active = p === 'week' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500';
              return `<button type="button" data-period="${p}" class="border ${active} rounded-full px-5 py-1.5 font-medium shadow-sm hover:shadow-md transition-all">${label}</button>`;
            }).join('')}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select id="filterEffort" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${EFFORT_OPTIONS.map(o => `<option value="${o}">${o === 'All' ? 'Effort: All' : `Effort: ${o}`}</option>`).join('')}
            </select>

            <select id="filterWorkoutStyle" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${WORKOUT_STYLE_OPTIONS.map(o => `<option value="${o}">${o === 'All' ? 'Style: All' : `Style: ${o}`}</option>`).join('')}
            </select>

            <select id="filterSurface" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${SURFACE_OPTIONS.map(o => `<option value="${o}">${o === 'All' ? 'Surface: All' : `Surface: ${o}`}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
        <p class="text-gray-500 text-sm">Total Distance</p>
        <h3 id="kpiTotalDistance" class="text-4xl font-semibold text-blue-500 my-2">—</h3>
        <p class="text-gray-600 text-sm">Selected Period</p>
      </div>

      <div class="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
        <p class="text-gray-500 text-sm">Total Time</p>
        <h3 id="kpiTotalTime" class="text-4xl font-semibold text-blue-500 my-2">—</h3>
        <p class="text-gray-600 text-sm">Selected Period</p>
      </div>

      <div class="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
        <p class="text-gray-500 text-sm">Runs</p>
        <h3 id="kpiRuns" class="text-4xl font-semibold text-blue-500 my-2">—</h3>
        <p class="text-gray-600 text-sm">Selected Period</p>
      </div>

      <div class="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
        <p class="text-gray-500 text-sm">Avg Pace</p>
        <h3 id="kpiAvgPace" class="text-2xl font-semibold text-blue-500 my-3">—</h3>
        <p class="text-gray-600 text-sm">Selected Period</p>
      </div>
    </section>

    <!-- Bests -->
    <section class="bg-white rounded-xl p-7 shadow-sm">
      <h3 class="text-2xl font-semibold mb-4">Personal Bests</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Longest Run</p>
          <p id="bestLongest" class="text-gray-800 font-semibold mt-1">—</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-sm">Fastest Avg Pace Run</p>
          <p id="bestFastest" class="text-gray-800 font-semibold mt-1">—</p>
        </div>
      </div>
      <p class="text-sm text-gray-500 mt-4">History view will link these runs later.</p>
    </section>

    <!-- Chart placeholder -->
    <section class="bg-white rounded-xl p-7 shadow-sm">
      <div class="flex items-end justify-between gap-3 mb-4">
        <div>
          <h3 class="text-2xl font-semibold">Trends</h3>
          <p id="chartSubtitle" class="text-sm text-gray-500 mt-1">—</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="border border-blue-500 bg-blue-500 text-white rounded-full px-5 py-1.5 font-medium shadow-sm hover:shadow-md transition-all">Distance</button>
          <button type="button" class="border border-gray-300 text-gray-700 rounded-full px-5 py-1.5 font-medium hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-md transition-all">Time</button>
          <button type="button" class="border border-gray-300 text-gray-700 rounded-full px-5 py-1.5 font-medium hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-md transition-all">Pace</button>
        </div>
      </div>

      <div class="h-[260px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-600">
        <p>📊 Chart Placeholder</p>
        <p class="text-sm text-gray-500 mt-2">Charts will be added later (e.g., Chart.js).</p>
      </div>
    </section>

    <!-- AI Insights placeholder -->
    <section class="bg-white rounded-xl p-7 shadow-sm">
      <h3 class="text-2xl font-semibold">AI Insights (coming soon)</h3>
      <p id="aiSubtitle" class="text-sm text-gray-500 mt-2">AI insights will appear here once enabled.</p>
      <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">Training load</div>
        <div class="h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">Recovery suggestion</div>
        <div class="h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">Next workout idea</div>
        <div class="h-[90px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">Risk flags</div>
      </div>
    </section>
  `;

  // Period buttons
  root.querySelectorAll('button[data-period]').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      state.period = PERIODS.includes(period) ? period : 'week';

      // Update button styles
      root.querySelectorAll('button[data-period]').forEach(b => {
        const active = b.dataset.period === state.period;
        b.classList.toggle('bg-blue-500', active);
        b.classList.toggle('text-white', active);
        b.classList.toggle('border-blue-500', active);

        if (!active) {
          b.classList.add('border-gray-300', 'text-gray-700');
          b.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
        }
      });

      updateUI(root, state);
    });
  });

  // Filters
  const effortSel = root.querySelector('#filterEffort');
  const styleSel = root.querySelector('#filterWorkoutStyle');
  const surfaceSel = root.querySelector('#filterSurface');

  effortSel.addEventListener('change', () => {
    state.filters.effort = effortSel.value;
    updateUI(root, state);
  });

  styleSel.addEventListener('change', () => {
    state.filters.workoutStyle = styleSel.value;
    updateUI(root, state);
  });

  surfaceSel.addEventListener('change', () => {
    state.filters.surface = surfaceSel.value;
    updateUI(root, state);
  });

  // Initial render
  updateUI(root, state);

  return root;
}
