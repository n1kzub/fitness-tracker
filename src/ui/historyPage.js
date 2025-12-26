import { getRuns, getUnit, deleteRun } from '../services/runDataStorage.js';
import { formatSecondsToMmSs, formatPaceMmSs } from '../utils/timeFormat.js';
import { PERIODS, inPeriod } from '../utils/datePeriod.js';
import {
  EFFORT_FILTER_OPTIONS,
  WORKOUT_STYLE_FILTER_OPTIONS,
  SURFACE_FILTER_OPTIONS,
  applyRunFilters,
} from '../utils/runMeta.js';
import { distanceInUnit, paceSecPerUnit, sortRunsNewestFirst } from '../utils/runMath.js';
import { buildConfirmModal } from './components/confirmModal.js';

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function formatRunBasic(run, unit) {
  const dist = distanceInUnit(run.distance, unit);
  const paceSec = paceSecPerUnit(run.durationSec || 0, dist);

  return {
    primary: `${dist.toFixed(2)} ${unit} • ${formatSecondsToMmSs(run.durationSec || 0)}`,
    secondary: `${formatPaceMmSs(paceSec)} min/${unit} • ${run.date}`,
  };
}

function renderRunCard(run, unit, { onDelete }) {
  const card = document.createElement('article');
  card.className = 'bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100';

  const basic = formatRunBasic(run, unit);

  const notes = run.notes ? escapeHtml(run.notes) : '';
  const createdAt = run.createdAt ? escapeHtml(run.createdAt) : '—';
  const storedDistanceValue = Number(run.distance?.value ?? 0);
  const storedDistanceUnit = escapeHtml(run.distance?.unit || '—');

  card.innerHTML = `
    <button type="button" data-action="toggle" class="w-full text-left flex items-start justify-between gap-4">
      <div>
        <p class="text-blue-500 font-semibold text-lg">${escapeHtml(basic.primary)}</p>
        <p class="text-gray-600 text-sm mt-1">${escapeHtml(basic.secondary)}</p>
        <div class="mt-3 flex flex-wrap gap-2 text-xs">
          <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Effort: ${escapeHtml(run.effort || '—')}</span>
          <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Style: ${escapeHtml(run.workoutStyle || '—')}</span>
          <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Surface: ${escapeHtml(run.surface || '—')}</span>
        </div>
      </div>
      <span class="text-gray-400 text-xl select-none" data-ui="chevron">▾</span>
    </button>

    <div data-section="details" class="hidden mt-5 border-t border-gray-200 pt-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-xs">Stored Distance</p>
          <p class="font-semibold text-gray-800 mt-1">${storedDistanceValue.toFixed(2)} ${storedDistanceUnit}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-xs">Created At</p>
          <p class="font-semibold text-gray-800 mt-1">${createdAt}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-xs">Effort</p>
          <p class="font-semibold text-gray-800 mt-1">${escapeHtml(run.effort || '—')}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4">
          <p class="text-gray-500 text-xs">Workout Style</p>
          <p class="font-semibold text-gray-800 mt-1">${escapeHtml(run.workoutStyle || '—')}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <p class="text-gray-500 text-xs">Surface</p>
          <p class="font-semibold text-gray-800 mt-1">${escapeHtml(run.surface || '—')}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <p class="text-gray-500 text-xs">Notes</p>
          <p class="text-gray-800 mt-1">${notes || '<span class="text-gray-400">—</span>'}</p>
        </div>

        <div class="border border-gray-200 rounded-lg p-4 md:col-span-2">
          <p class="text-gray-500 text-xs">map_data</p>
          <pre class="text-xs text-gray-700 mt-2 whitespace-pre-wrap">${escapeHtml(
            JSON.stringify(run.map_data ?? {}, null, 2)
          )}</pre>
        </div>
      </div>

      <div class="mt-4 flex justify-end">
        <button type="button" data-action="delete"
          class="px-5 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 transition">
          Delete Run
        </button>
      </div>
    </div>
  `;

  const toggleBtn = card.querySelector('[data-action="toggle"]');
  const details = card.querySelector('[data-section="details"]');
  const chevron = card.querySelector('[data-ui="chevron"]');

  toggleBtn.addEventListener('click', (e) => {
  const cardEl = e.currentTarget.closest('article');
  if (!cardEl) return;

  const detailsEl = cardEl.querySelector('[data-section="details"]');
  const chevronEl = cardEl.querySelector('[data-ui="chevron"]');
  if (!detailsEl || !chevronEl) return;

  const isOpen = !detailsEl.classList.contains('hidden');
  detailsEl.classList.toggle('hidden', isOpen);
  chevronEl.textContent = isOpen ? '▾' : '▴';
});

  card.querySelector('[data-action="delete"]').addEventListener('click', () => {
    const bodyHtml = `
      <div class="space-y-3">
        <p class="text-sm text-gray-700">Delete this run? This cannot be undone.</p>
        <div class="text-sm border border-gray-200 rounded-lg p-3">
          <div class="font-semibold text-gray-800">${escapeHtml(basic.primary)}</div>
          <div class="text-gray-600 mt-1">${escapeHtml(basic.secondary)}</div>
        </div>
      </div>
    `;

    const modal = buildConfirmModal({
      title: 'Confirm deletion',
      bodyHtml,
      confirmText: 'Delete',
      onCancel: () => modal.remove(),
      onConfirm: () => {
        modal.remove();
        onDelete?.(run.id);
      },
    });

    document.body.appendChild(modal);
  });

  return card;
}

function setPeriodButtonStyles(root, activePeriod) {
  root.querySelectorAll('button[data-period]').forEach((b) => {
    const active = b.dataset.period === activePeriod;

    b.classList.toggle('bg-blue-500', active);
    b.classList.toggle('text-white', active);
    b.classList.toggle('border-blue-500', active);

    if (!active) {
      b.classList.add('border-gray-300', 'text-gray-700');
      b.classList.remove('bg-blue-500', 'text-white', 'border-blue-500');
    } else {
      b.classList.remove('border-gray-300', 'text-gray-700');
    }
  });
}

function updateUI(root, state) {
  const unit = getUnit();
  const now = new Date();

  const runs = sortRunsNewestFirst(getRuns());
  const periodRuns = runs.filter((r) => inPeriod(r.date, state.period, now));
  const filtered = applyRunFilters(periodRuns, state.filters);

  root.querySelector('#historyUnitInfo').textContent = `Units: ${unit} • Pace: min/${unit}`;
  root.querySelector('#historyCount').textContent = `${filtered.length} runs`;

  const list = root.querySelector('#historyList');
  list.innerHTML = '';

  if (!filtered.length) {
    list.innerHTML = `
      <div class="bg-white rounded-xl p-6 shadow-sm text-gray-600">
        No runs found for the selected filters.
      </div>
    `;
    return;
  }

  for (const run of filtered) {
    list.appendChild(
      renderRunCard(run, unit, {
        onDelete: (id) => {
          deleteRun(id);
          updateUI(root, state);
        },
      })
    );
  }
}

export function renderHistoryPage() {
  const root = document.createElement('section');
  root.className = 'space-y-6';

  const state = {
    period: 'week',
    filters: {
      effort: 'All',
      workoutStyle: 'All',
      surface: 'All',
    },
  };

  root.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
      <div>
        <h2 class="text-3xl font-semibold">History</h2>
        <p id="historyUnitInfo" class="text-sm text-gray-500 mt-1">Units: —</p>
        <p id="historyCount" class="text-sm text-gray-500 mt-1">0 runs</p>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm w-full md:w-auto">
        <div class="flex flex-col md:flex-row gap-3 md:items-center">
          <div class="flex gap-2">
            ${PERIODS.map((p) => {
              const label = p === 'week' ? 'Week' : p === 'month' ? 'Month' : 'All';
              const active = p === state.period
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-700 hover:bg-blue-500 hover:text-white hover:border-blue-500';
              return `<button type="button" data-period="${p}" class="border ${active} rounded-full px-5 py-1.5 font-medium shadow-sm hover:shadow-md transition-all">${label}</button>`;
            }).join('')}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <select id="filterEffort" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${EFFORT_FILTER_OPTIONS.map((o) => `<option value="${o}">${o === 'All' ? 'Effort: All' : `Effort: ${o}`}</option>`).join('')}
            </select>

            <select id="filterWorkoutStyle" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${WORKOUT_STYLE_FILTER_OPTIONS.map((o) => `<option value="${o}">${o === 'All' ? 'Style: All' : `Style: ${o}`}</option>`).join('')}
            </select>

            <select id="filterSurface" class="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200">
              ${SURFACE_FILTER_OPTIONS.map((o) => `<option value="${o}">${o === 'All' ? 'Surface: All' : `Surface: ${o}`}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </div>

    <section id="historyList" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"></section>
  `;

  // Period buttons
  root.querySelectorAll('button[data-period]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.period;
      state.period = PERIODS.includes(p) ? p : 'week';
      setPeriodButtonStyles(root, state.period);
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

  updateUI(root, state);
  return root;
}
