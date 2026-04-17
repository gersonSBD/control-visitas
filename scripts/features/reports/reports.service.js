// =============================================
// REPORTS
// =============================================
let currentReport = '';

async function buildReports() {
  const days = parseInt(document.getElementById('reportRange').value);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const sessions = await dbGetAll('sessions');
  const filtered = sessions.filter(s => new Date(s.startTime) >= cutoff && s.status === 'CLOSED');

  const byBranch = {};
  for (const s of filtered) {
    if (!byBranch[s.branchNameSnapshot]) byBranch[s.branchNameSnapshot] = 0;
    byBranch[s.branchNameSnapshot] += s.durationMinutes || 0;
  }
  const sorted = Object.entries(byBranch).sort((a, b) => b[1] - a[1]);
  const maxVal = sorted[0]?.[1] || 1;
  const chartEl = document.getElementById('chartByBranch');
  if (!sorted.length) {
    chartEl.innerHTML = '<div class="empty" style="padding:16px 0">Sin datos cerrados</div>';
  } else {
    chartEl.innerHTML = sorted.map(([name, mins]) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${name}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${(mins / maxVal * 100).toFixed(1)}%"></div></div>
        <div class="chart-bar-val">${formatDuration(mins)}</div>
      </div>
    `).join('');
  }

  generateWhatsApp(filtered);
}

async function generateWhatsApp(preFiltered) {
  const days = parseInt(document.getElementById('reportRange').value);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  let sessions = preFiltered;
  if (!sessions) {
    const all = await dbGetAll('sessions');
    sessions = all.filter(s => new Date(s.startTime) >= cutoff && s.status === 'CLOSED');
  }
  sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const grouped = {};
  for (const s of sessions) {
    if (!grouped[s.dateKey]) grouped[s.dateKey] = [];
    grouped[s.dateKey].push(s);
  }

  const lines = ['📊 *Reporte de Visitas*'];
  if (appSettings.userName) lines.push(`👤 Usuario: ${appSettings.userName}`);
  if (appSettings.vehiclePlate) lines.push(`🚗 Placa: ${appSettings.vehiclePlate}`);
  lines.push(`📅 Periodo: ultimos ${days} dias`);
  lines.push(`🕐 Generado: ${formatDateTime(new Date().toISOString())}`);
  lines.push('');

  for (const dk of Object.keys(grouped).sort()) {
    lines.push(`*${formatDate(dk)}*`);
    for (const s of grouped[dk]) {
      const start = formatTime(s.startTime);
      const end = s.endTime ? formatTime(s.endTime) : '--:--';
      const dur = s.durationMinutes != null ? ` (${formatDuration(s.durationMinutes)})` : '';
      lines.push(`• ${s.branchNameSnapshot} | ${start} - ${end}${dur}`);
      if (s.observations?.length) lines.push(`  _${s.observations.join(', ')}_`);
    }
    lines.push('');
  }

  const total = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  lines.push(`⏱ *Tiempo total: ${formatDuration(total)}*`);

  currentReport = lines.join('\n');
  document.getElementById('whatsappPreview').textContent = currentReport;
}

function copyReport() {
  if (!currentReport) { showToast('Genera el reporte primero', 'error'); return; }
  navigator.clipboard.writeText(currentReport).then(() => showToast('Copiado al portapapeles', 'success'));
}

function sendWhatsApp() {
  if (!currentReport) { showToast('Genera el reporte primero', 'error'); return; }
  const phone = appSettings.contactPhone?.replace(/\D/g, '') || '';
  const text = encodeURIComponent(currentReport);
  const url = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url, '_blank');
}

async function exportJSON() {
  const branches = await dbGetAll('branches');
  const events = await dbGetAll('events');
  const sessions = await dbGetAll('sessions');
  const data = { exportedAt: new Date().toISOString(), branches, events, sessions };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visitcontrol-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('JSON exportado', 'success');
}
