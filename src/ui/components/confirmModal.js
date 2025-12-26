function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function buildConfirmModal({ title, bodyHtml, confirmText = 'Confirm', onConfirm, onCancel }) {
  const overlay = document.createElement('div');
  overlay.className = 'fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50';

  overlay.innerHTML = `
    <div class="w-full max-w-lg bg-white rounded-xl shadow-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800">${escapeHtml(title)}</h3>
      </div>
      <div class="px-6 py-5 text-gray-700">
        ${bodyHtml}
      </div>
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button type="button" data-action="cancel"
          class="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
          Cancel
        </button>
        <button type="button" data-action="confirm"
          class="px-5 py-2 rounded-lg bg-blue-500 text-white border border-blue-500 hover:shadow-md transition">
          ${escapeHtml(confirmText)}
        </button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) onCancel?.();
  });

  overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => onCancel?.());
  overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => onConfirm?.());

  return overlay;
}
