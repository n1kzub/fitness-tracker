import './style.css';
import { initNav } from './ui/nav.js';
import { renderAddRunPage } from './ui/addRunPage.js';
import { refreshDashboardStats } from './ui/dashboard.js';
import { renderStatisticsPage } from './ui/statisticsPage.js';

let main = null;
let homeHTML = '';

function getMain() {
  if (!main) main = document.querySelector('#appMain');
  return main;
}

function setHomeSnapshot() {
  const m = getMain();
  if (!m) return;
  if (!homeHTML) homeHTML = m.innerHTML;
}

function navigate(route) {
  const m = getMain();
  if (!m) {
    console.warn('Missing #appMain. Add id="appMain" to your <main>.');
    return;
  }

  setHomeSnapshot();

  if (route === 'add-run') {
    m.innerHTML = '';
    m.appendChild(
      renderAddRunPage({
        onSaved: () => {
          navigate('home');
          refreshDashboardStats();
        },
      })
    );
    return;
  }

  if (route === 'statistics') {
    m.innerHTML = '';
    m.appendChild(renderStatisticsPage());
    return;
  }

  // default: home
  m.innerHTML = homeHTML;
  refreshDashboardStats();
}

function boot() {
  setHomeSnapshot();
  initNav({ onRoute: navigate });
  navigate('home');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
