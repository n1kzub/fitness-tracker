import { addRun, getUnit, setUnit } from '../services/runDataStorage.js';
import { parseMmSsToSeconds, formatSecondsToMmSs, formatPaceMmSs } from '../utils/timeFormat.js';
import { buildConfirmModal } from './components/confirmModal.js';
import {
  EFFORT_OPTIONS,
  WORKOUT_STYLE_OPTIONS,
  SURFACE_OPTIONS,
} from '../utils/runMeta.js';
import { paceSecPerUnit as paceSecPerUnitFn } from '../utils/runMath.js';

export function renderAddRunPage({ onSaved } = {}) {
  const wrapper = document.createElement('section');
  wrapper.className = 'bg-white rounded-xl p-7 shadow-sm';

  const today = new Date().toISOString().slice(0, 10);
  const currentUnit = getUnit(); // 'km' | 'mi'

  wrapper.innerHTML = `
    <h2 class="text-3xl font-semibold mb-6 text-gray-900">Add Run</h2>

    <form id="addRunForm" class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Date</label>
        <input name="date" type="date" value="${today}"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Unit</label>
        <select name="unit"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200">
          <option value="km" ${currentUnit === 'km' ? 'selected' : ''}>Kilometers (km)</option>
          <option value="mi" ${currentUnit === 'mi' ? 'selected' : ''}>Miles (mi)</option>
        </select>
        <p class="text-xs text-gray-500">Global display unit (Profile later).</p>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Distance</label>
        <input name="distance" type="number" step="0.01" min="0"
          placeholder="e.g. 5.00"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Duration (mm:ss)</label>
        <input name="duration" type="text" placeholder="e.g. 35:24"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Effort</label>
        <select name="effort"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">Select effort…</option>
          ${EFFORT_OPTIONS.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm text-gray-600 font-medium">Workout Style</label>
        <select name="workoutStyle"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">Select style…</option>
          ${WORKOUT_STYLE_OPTIONS.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>

      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="text-sm text-gray-600 font-medium">Surface</label>
        <select name="surface"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200">
          <option value="">Select surface…</option>
          ${SURFACE_OPTIONS.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>

      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="text-sm text-gray-600 font-medium">Notes (optional)</label>
        <input name="notes" type="text" placeholder="How did it feel?"
          class="border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200" />
      </div>

      <div class="md:col-span-2 flex items-center justify-between gap-4">
        <p id="formError" class="text-sm text-red-600 hidden"></p>
        <button type="submit"
          class="border border-blue-500 bg-blue-500 text-white rounded-lg px-6 py-2 font-medium shadow-sm hover:shadow-md transition-all">
          Save Run
        </button>
      </div>
    </form>
  `;

  const form = wrapper.querySelector('#addRunForm');
  const errorEl = wrapper.querySelector('#formError');

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function hideError() {
    errorEl.textContent = '';
    errorEl.classList.add('hidden');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideError();

    const fd = new FormData(form);

    const date = String(fd.get('date') || '').trim();
    const unit = String(fd.get('unit') || 'km') === 'mi' ? 'mi' : 'km';
    const distance = Number(fd.get('distance'));
    const durationRaw = String(fd.get('duration') || '').trim();
    const notes = String(fd.get('notes') || '').trim();

    const effort = String(fd.get('effort') || '').trim();
    const workoutStyle = String(fd.get('workoutStyle') || '').trim();
    const surface = String(fd.get('surface') || '').trim();

    if (!date) return showError('Please choose a date.');
    if (!Number.isFinite(distance) || distance <= 0) return showError('Distance must be greater than 0.');
    const durationSec = parseMmSsToSeconds(durationRaw);
    if (durationSec == null || durationSec <= 0) return showError('Duration format must be mm:ss (e.g., 35:24).');

    if (!EFFORT_OPTIONS.includes(effort)) return showError('Please select an effort.');
    if (!WORKOUT_STYLE_OPTIONS.includes(workoutStyle)) return showError('Please select a workout style.');
    if (!SURFACE_OPTIONS.includes(surface)) return showError('Please select a surface.');

    // Save global unit (Profile later)
    setUnit(unit);

    const paceSecPerUnitValue = paceSecPerUnitFn(durationSec, distance);

    const safeNotes = notes
      ? notes.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      : '';

    const summaryHtml = `
      <div class="space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Date</span>
          <span class="font-medium text-gray-800">${date}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Distance</span>
          <span class="font-medium text-gray-800">${distance.toFixed(2)} ${unit}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Duration</span>
          <span class="font-medium text-gray-800">${formatSecondsToMmSs(durationSec)}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Avg Pace</span>
          <span class="font-medium text-gray-800">${formatPaceMmSs(paceSecPerUnitValue)} min/${unit}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Effort</span>
          <span class="font-medium text-gray-800">${effort}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Workout Style</span>
          <span class="font-medium text-gray-800">${workoutStyle}</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-500">Surface</span>
          <span class="font-medium text-gray-800">${surface}</span>
        </div>

        ${safeNotes ? `
          <div class="text-sm">
            <div class="text-gray-500 mb-1">Notes</div>
            <div class="text-gray-800">${safeNotes}</div>
          </div>
        ` : ''}

        <p class="text-xs text-gray-500 pt-2">You won’t be able to edit this run later.</p>
      </div>
    `;

    const modal = buildConfirmModal({
      title: 'Confirm your run',
      bodyHtml: summaryHtml,
      confirmText: 'Confirm & Save',
      onCancel: () => modal.remove(),
      onConfirm: () => {
        modal.remove();

        const run = {
          id: crypto.randomUUID(),
          date,
          distance: { value: Number(distance.toFixed(2)), unit },
          durationSec,
          notes,
          map_data: {},

          effort,
          workoutStyle,
          surface,

          createdAt: new Date().toISOString(),
        };

        addRun(run);
        onSaved?.(run);
      },
    });

    document.body.appendChild(modal);
  });

  return wrapper;
}
