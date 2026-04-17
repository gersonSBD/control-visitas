// =============================================
// INIT
// =============================================
async function init() {
  await initDB();
  await loadSettings();
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
