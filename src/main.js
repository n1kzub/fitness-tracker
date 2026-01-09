import './style.css';
import { initNav } from './ui/nav.js';
import { renderAddRunPage } from './ui/addRunPage.js';
import { refreshDashboardStats } from './ui/dashboard.js';
import { renderStatisticsPage } from './ui/statisticsPage.js';
import { renderHistoryPage } from './ui/historyPage.js';
import { renderProfilePage } from './ui/profilePage.js';
import { applyTheme, watchSystemThemeChanges } from './services/userProfileStorage.js';

const main = document.querySelector('#appMain');
if (!main) console.warn('Missing #appMain. Add id="appMain" to your <main>.');

const homeHTML = main ? main.innerHTML : '';

// Apply saved theme on startup and keep in sync if "system"
applyTheme();
watchSystemThemeChanges();

function navigate(route) {
  if (!main) return;

  if (route === 'add-run') {
    main.innerHTML = '';
    main.appendChild(renderAddRunPage({
      onSaved: () => {
        navigate('home');
        refreshDashboardStats();
      },
    }));
    return;
  }

  if (route === 'statistics') {
    main.innerHTML = '';
    main.appendChild(renderStatisticsPage());
    return;
  }

  if (route === 'history') {
    main.innerHTML = '';
    main.appendChild(renderHistoryPage());
    return;
  }

  if (route === 'profile') {
    main.innerHTML = '';
    main.appendChild(renderProfilePage());
    return;
  }

  // home (default)
  main.innerHTML = homeHTML;
  refreshDashboardStats();
}

initNav({ onRoute: navigate });
navigate('home');
