import { getUnit, setUnit } from '../services/runDataStorage.js';
import { getUserProfile, setUserProfile, setTheme, getTheme } from '../services/userProfileStorage.js';

function escapeHtml(s) {
  return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function isValidUsername(name) {
  return /^[a-zA-Z0-9._]{3,20}$/.test(name);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function unitLabel(unit) {
  return unit === 'mi' ? 'Miles (mi) • Pace min/mi' : 'Kilometers (km) • Pace min/km';
}

function themeLabel(theme) {
  if (theme === 'dark') return 'Dark';
  if (theme === 'light') return 'Light';
  return 'System';
}

export function renderProfilePage() {
  const root = document.createElement('section');
  root.className = 'space-y-6';

  // Single source of truth for current mode + data used in UI
  let isEditing = false;

  function getSnapshot() {
    return {
      profile: getUserProfile(),
      unit: getUnit(),
      theme: getTheme(),
    };
  }

  function render() {
    const { profile, unit, theme } = getSnapshot();

    root.innerHTML = `
      <div class="flex items-end justify-between">
        <div>
          <h2 class="text-3xl font-semibold">Profile</h2>
          <p class="text-sm text-gray-500 mt-1">Update your identity and preferences.</p>
        </div>

        <div class="flex gap-2">
          ${
            isEditing
              ? `
                <button id="profileCancelBtn" type="button"
                  class="border border-gray-300 bg-white text-gray-700 rounded-lg px-4 py-2 font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button id="profileSaveBtn" type="button"
                  class="border border-blue-500 bg-blue-500 text-white rounded-lg px-5 py-2 font-medium shadow-sm hover:shadow-md transition-all">
                  Save changes
                </button>
              `
              : `
                <button id="profileEditBtn" type="button"
                  class="border border-blue-500 bg-blue-500 text-white rounded-lg px-5 py-2 font-medium shadow-sm hover:shadow-md transition-all">
                  Edit profile
                </button>
              `
          }
        </div>
      </div>

      <section class="bg-white rounded-xl p-7 shadow-sm space-y-6">
        ${
          isEditing
            ? renderEditSection({ profile, unit, theme })
            : renderViewSection({ profile, unit, theme })
        }
      </section>
    `;

    if (isEditing) wireEditHandlers();
    else wireViewHandlers();
  }

  function renderViewSection({ profile, unit, theme }) {
    return `
      <div class="flex flex-col sm:flex-row gap-6 sm:items-center">
        <div class="shrink-0">
          <div class="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            ${
              profile.avatarDataUrl
                ? `<img src="${escapeHtml(profile.avatarDataUrl)}" alt="Avatar" class="w-full h-full object-cover" />`
                : `<span class="text-gray-400 text-sm">No photo</span>`
            }
          </div>
        </div>

        <div class="flex-1 space-y-2">
          <div>
            <p class="text-xs text-gray-500">Username</p>
            <p class="text-lg font-medium text-gray-900">${escapeHtml(profile.username || '—')}</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <p class="text-xs text-gray-500">Theme</p>
              <p class="text-gray-900">${escapeHtml(themeLabel(theme))}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">Measurement unit</p>
              <p class="text-gray-900">${escapeHtml(unitLabel(unit))}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEditSection({ profile, unit, theme }) {
    return `
      <div class="flex flex-col sm:flex-row gap-6 sm:items-center">
        <div class="shrink-0">
          <div class="w-24 h-24 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
            ${
              profile.avatarDataUrl
                ? `<img src="${escapeHtml(profile.avatarDataUrl)}" alt="Avatar" class="w-full h-full object-cover" />`
                : `<span class="text-gray-400 text-sm">No photo</span>`
            }
          </div>
        </div>

        <div class="flex-1 space-y-3">
          <div>
            <label class="block text-sm text-gray-600 font-medium mb-1">Username</label>
            <input id="profileUsername" type="text" value="${escapeHtml(profile.username || '')}"
              placeholder="e.g. nikitos"
              class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200 text-gray-900" />
            <p class="text-xs text-gray-500 mt-1">3–20 chars. Letters, numbers, dot, underscore.</p>
          </div>

          <div>
            <label class="block text-sm text-gray-600 font-medium mb-1">Profile picture</label>
            <input id="profileAvatar" type="file" accept="image/*"
              class="block w-full text-sm text-gray-700
                     file:mr-4 file:py-2 file:px-4 file:rounded-lg
                     file:border file:border-gray-300 file:bg-white
                     file:text-gray-700 hover:file:bg-gray-50" />
            <p class="text-xs text-gray-500 mt-1">Stored locally for now. Later it will upload to the server.</p>
          </div>
        </div>
      </div>

      <hr class="border-gray-200" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm text-gray-600 font-medium mb-1">Theme</label>
          <select id="profileTheme"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
            <option value="system" ${theme === 'system' ? 'selected' : ''}>System</option>
            <option value="light" ${theme === 'light' ? 'selected' : ''}>Light</option>
            <option value="dark" ${theme === 'dark' ? 'selected' : ''}>Dark</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">System follows your OS preference.</p>
        </div>

        <div>
          <label class="block text-sm text-gray-600 font-medium mb-1">Measurement unit</label>
          <select id="profileUnit"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-200 text-gray-900">
            <option value="km" ${unit === 'km' ? 'selected' : ''}>Kilometers (km) • Pace min/km</option>
            <option value="mi" ${unit === 'mi' ? 'selected' : ''}>Miles (mi) • Pace min/mi</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Used across Dashboard, Statistics, History.</p>
        </div>
      </div>

      <div class="flex items-center justify-between gap-4">
        <p id="profileError" class="text-sm text-red-600 hidden"></p>
        <p id="profileSaved" class="text-sm text-green-600 hidden">Saved.</p>
      </div>
    `;
  }

  function wireViewHandlers() {
    const editBtn = root.querySelector('#profileEditBtn');
    editBtn?.addEventListener('click', () => {
      isEditing = true;
      render();
    });
  }

  function wireEditHandlers() {
    const usernameEl = root.querySelector('#profileUsername');
    const avatarEl = root.querySelector('#profileAvatar');
    const themeEl = root.querySelector('#profileTheme');
    const unitEl = root.querySelector('#profileUnit');
    const errEl = root.querySelector('#profileError');
    const savedEl = root.querySelector('#profileSaved');

    const saveBtn = root.querySelector('#profileSaveBtn');
    const cancelBtn = root.querySelector('#profileCancelBtn');

    function showError(msg) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
      savedEl.classList.add('hidden');
    }

    function showSaved() {
      errEl.classList.add('hidden');
      savedEl.classList.remove('hidden');
      window.setTimeout(() => savedEl.classList.add('hidden'), 900);
    }

    cancelBtn?.addEventListener('click', () => {
      isEditing = false;
      render();
    });

    saveBtn?.addEventListener('click', async () => {
      const username = String(usernameEl?.value || '').trim();
      const theme = String(themeEl?.value || 'system');
      const unit = String(unitEl?.value || 'km') === 'mi' ? 'mi' : 'km';

      if (username && !isValidUsername(username)) {
        return showError('Username must be 3–20 characters (letters, numbers, dot, underscore).');
      }

      // Apply unit + theme immediately
      setUnit(unit);
      setTheme(theme);

      // Handle avatar if user picked a file
      let avatarDataUrl = null;
      const file = avatarEl?.files?.[0];
      if (file) {
        if (!file.type.startsWith('image/')) return showError('Please choose an image file.');
        if (file.size > 2 * 1024 * 1024) return showError('Image is too large (max 2MB).');

        try {
          avatarDataUrl = await readFileAsDataUrl(file);
        } catch {
          return showError('Failed to read the selected image.');
        }
      }

      setUserProfile({
        username,
        ...(avatarDataUrl != null ? { avatarDataUrl } : {}),
        theme,
      });

      showSaved();

      // Switch back to view mode (and re-read from storage)
      isEditing = false;
      render();
    });
  }

  render();
  return root;
}
