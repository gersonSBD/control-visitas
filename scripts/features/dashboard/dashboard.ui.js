// =============================================
// DASHBOARD
// =============================================
async function renderDashboard() {
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const sessions = await dbGetAll('sessions');
  const todaySessions = sessions.filter(s => s.dateKey === todayKey);
  const weekSessions = sessions.filter(s => new Date(s.startTime) >= weekAgo);
  const totalMins = weekSessions.filter(s => s.status === 'CLOSED').reduce((sum, s) => sum + (s.durationMinutes || 0), 0);

  document.getElementById('stat-today').textContent = todaySessions.length;
  document.getElementById('stat-week').textContent = weekSessions.length;
  document.getElementById('stat-hours').textContent = totalMins >= 60 ? Math.floor(totalMins / 60) + 'h' : totalMins + 'm';

  const openSession = sessions.find(s => s.status === 'OPEN');
  const card = document.getElementById('activeSessionCard');
  const content = document.getElementById('activeSessionContent');
  if (openSession) {
    card.style.display = 'block';
    const elapsed = Math.round((Date.now() - new Date(openSession.startTime)) / 60000);
    content.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <div style="font-size:16px;font-weight:700;">${openSession.branchNameSnapshot}</div>
          <div style="font-size:11px;color:var(--text2);font-family:var(--mono);">desde ${formatTime(openSession.startTime)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:28px;font-weight:800;color:var(--accent3);font-family:var(--mono);">${formatDuration(elapsed)}</div>
          <button class="btn btn-danger btn-sm" onclick="manualExit('${openSession.branchId}','${openSession.branchNameSnapshot}')">Registrar Salida</button>
        </div>
      </div>
    `;
  } else {
    card.style.display = 'none';
  }

  renderRecentEvents();
}

async function manualExit(branchId, branchName) {
  const branch = { id: branchId, name: branchName };
  await logEvent(branch, 'EXIT', 'MANUAL');
  insideBranch = null;
  renderDashboard();
}
