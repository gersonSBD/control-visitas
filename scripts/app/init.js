// =============================================
// INIT
// =============================================
async function init() {
  await initDB();
  await loadSettings();
  if (!isProfileConfigured()) {
    const settingsBtn = document.querySelector('.nav-item[data-view="settings"]');
    showView('settings', settingsBtn);
    showToast('Completa nombre y placa en Config para comenzar', 'error');
  }
  await renderDashboard();
  await renderBranches();
}

init();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Keep silent: app must keep running even if SW registration fails.
    });
  });
}
