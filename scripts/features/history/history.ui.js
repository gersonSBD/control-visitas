// =============================================
// HISTORY
// =============================================
let historyDays = 7;

async function filterHistory(days) {
  historyDays = parseInt(days);
  renderHistory();
}

async function renderHistory() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - historyDays);
  const sessions = await dbGetAll('sessions');
  const filtered = sessions.filter(s => new Date(s.startTime) >= cutoff)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  const el = document.getElementById('historyList');
  if (!filtered.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">📋</div>Sin visitas en este periodo</div>';
    return;
  }

  const grouped = {};
  for (const s of filtered) {
    const dk = s.dateKey;
    if (!grouped[dk]) grouped[dk] = [];
    grouped[dk].push(s);
  }

  el.innerHTML = Object.keys(grouped).sort().reverse().map(dk => `
    <div style="margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-bottom:6px;">${formatDate(dk)}</div>
      ${grouped[dk].map(s => `
        <div class="session-item" style="margin-bottom:6px;">
          <div class="session-header">
            <div class="session-name">${s.branchNameSnapshot}</div>
            <span class="badge badge-${s.status === 'OPEN' ? 'open' : 'closed'}">${s.status}</span>
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="session-time">${formatTime(s.startTime)} ${s.endTime ? '→ ' + formatTime(s.endTime) : '(abierta)'}</div>
              <div style="font-size:10px;color:var(--text3);font-family:var(--mono);margin-top:2px;">${s.sourceSummary}</div>
            </div>
            <div style="text-align:right;">
              <div class="session-duration">${s.durationMinutes != null ? formatDuration(s.durationMinutes) : '--'}</div>
              <div class="session-dur-lbl">duracion</div>
            </div>
          </div>
          ${s.observations?.length ? `<div style="font-size:11px;color:var(--text3);margin-top:6px;font-style:italic;">${s.observations.join(', ')}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}
