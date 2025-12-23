export function initNav({ onRoute } = {}) {
  const nav = document.querySelector('#topNav');
  if (!nav) return;

  nav.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-route]');
    if (!link) return;
    e.preventDefault();
    onRoute?.(link.dataset.route);
  });
}
