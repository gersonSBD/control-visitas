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

  const formatMilitaryTime = (iso) => new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const formatShortDate = (iso) => new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const lines = ['📍 *Reporte de Visitas*'];
  if (appSettings.userName) lines.push(`👤 Conductor: ${appSettings.userName}`);
  if (appSettings.vehiclePlate) lines.push(`🚗 Placa: ${appSettings.vehiclePlate}`);
  lines.push(`📅 Rango: ${formatShortDate(cutoff.toISOString())} - ${formatShortDate(new Date().toISOString())}`);
  lines.push('');

  const totalByBranch = {};
  const orderedDateKeys = Object.keys(grouped).sort();

  for (const dk of orderedDateKeys) {
    lines.push(`📆 *${formatDate(dk)}*`);

    const sessionsByBranch = {};
    for (const s of grouped[dk]) {
      const branchName = s.branchNameSnapshot || 'Sucursal sin nombre';
      if (!sessionsByBranch[branchName]) sessionsByBranch[branchName] = [];
      sessionsByBranch[branchName].push(s);
    }

    for (const branchName of Object.keys(sessionsByBranch)) {
      const branchSessions = sessionsByBranch[branchName];
      let branchTotal = 0;
      const observations = [];

      lines.push(branchName);
      for (const s of branchSessions) {
        const start = formatMilitaryTime(s.startTime);
        const end = s.endTime ? formatMilitaryTime(s.endTime) : '--:--';
        lines.push(`${start} - ${end}`);
        branchTotal += s.durationMinutes || 0;
        if (s.observations?.length) observations.push(...s.observations);
      }

      totalByBranch[branchName] = (totalByBranch[branchName] || 0) + branchTotal;
      lines.push(`⏱ Total: ${formatDuration(branchTotal)}`);
      if (observations.length) {
        lines.push(`📝 Observacion: ${observations.join(', ')}`);
      }
      lines.push('');
    }

    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━');
  lines.push('🧮 *Resumen General*');

  const orderedTotals = Object.entries(totalByBranch).sort((a, b) => b[1] - a[1]);
  for (const [branchName, mins] of orderedTotals) {
    lines.push(`${branchName}: ${formatDuration(mins)}`);
  }

  const total = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  lines.push('');
  lines.push(`⏱ *Total General: ${formatDuration(total)}*`);

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

async function exportPDF() {
  const days = parseInt(document.getElementById('reportRange').value);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const reportStart = new Date(cutoff);
  const reportEnd = new Date();
  const allSessions = await dbGetAll('sessions');
  const sessions = allSessions
    .filter(s => new Date(s.startTime) >= cutoff && s.status === 'CLOSED')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  if (!sessions.length) {
    showToast('No hay datos para exportar en ese periodo', 'error');
    return;
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const formatShortDate = (dateVal) => new Date(dateVal).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formatMilitaryTime = (iso) => new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const byBranch = {};
  const byDate = {};
  for (const s of sessions) {
    const branchName = s.branchNameSnapshot || 'Sucursal sin nombre';
    byBranch[branchName] = (byBranch[branchName] || 0) + (s.durationMinutes || 0);
    if (!byDate[s.dateKey]) byDate[s.dateKey] = [];
    byDate[s.dateKey].push(s);
  }
  const orderedBranchTotals = Object.entries(byBranch).sort((a, b) => b[1] - a[1]);
  const orderedDateKeys = Object.keys(byDate).sort();
  const workedDaysCount = orderedDateKeys.length;
  const todayIso = new Date().toISOString().split('T')[0];
  const branchLabels = orderedBranchTotals.map(([name]) => name);
  const branchMinutes = orderedBranchTotals.map(([, mins]) => mins);
  const dayLabels = orderedDateKeys.map((dateKey) => formatDate(dateKey));
  const dayMinutes = orderedDateKeys.map((dateKey) => byDate[dateKey].reduce((sum, s) => sum + (s.durationMinutes || 0), 0));

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const branchRows = orderedBranchTotals.length
    ? orderedBranchTotals.map(([branchName, mins]) => (
      `<div class="simple-row"><span>${escapeHtml(branchName)}</span><strong>${escapeHtml(formatDuration(mins))}</strong></div>`
    )).join('')
    : '<div class="muted">Sin datos</div>';

  const daySummaryRows = orderedDateKeys.map((dateKey) => {
    const dayTotal = byDate[dateKey].reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return `<div class="simple-row"><span>${escapeHtml(formatDate(dateKey))}</span><strong>${escapeHtml(formatDuration(dayTotal))}</strong></div>`;
  }).join('');

  const dailySections = orderedDateKeys.map((dateKey) => {
    const daySessions = byDate[dateKey];
    const dayTotal = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    const rows = daySessions.map((s) => {
      const observationText = s.observations?.length ? s.observations.join('<br>') : '—';
      const schedule = `${formatMilitaryTime(s.startTime)} - ${s.endTime ? formatMilitaryTime(s.endTime) : '--:--'}`;
      return `
        <tr>
          <td>${escapeHtml(s.branchNameSnapshot || '-')}</td>
          <td>${escapeHtml(schedule)}</td>
          <td>${escapeHtml(s.durationMinutes != null ? formatDuration(s.durationMinutes) : '-')}</td>
          <td>${escapeHtml(observationText).replace(/&lt;br&gt;/g, '<br>')}</td>
        </tr>
      `;
    }).join('');
    return `
      <section class="day-section">
        <h3>${escapeHtml(formatDate(dateKey))} · Total del día: ${escapeHtml(formatDuration(dayTotal))}</h3>
        <table>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th>Horario</th>
              <th>Duración</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </section>
    `;
  }).join('');

  const printHtml = `
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Reporte de visitas</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111; margin: 0; font-size: 12px; line-height: 1.35; background: #fff; }
    .page-break { page-break-before: always; }
    h1 { margin: 0 0 14px; font-size: 24px; }
    h2 { margin: 18px 0 8px; font-size: 16px; }
    h3 { margin: 16px 0 8px; font-size: 14px; }
    p { margin: 0 0 6px; }
    .cards-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 4px 0 14px; }
    .info-card { border: 1px solid #bfc5cf; border-radius: 12px; background: #f1f3f6; padding: 12px 14px 10px; min-height: 74px; }
    .info-card .label { color: #4b5563; font-size: 14px; margin-bottom: 4px; }
    .info-card .value { color: #0f172a; font-size: 35px; line-height: 1; font-family: Georgia, "Times New Roman", serif; }
    .info-card .value.sm { font-size: 24px; }
    .info-card .value.md { font-size: 32px; }
    .charts-grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 8px; }
    .chart-card { border: 1px solid #d6dbe3; border-radius: 10px; padding: 10px; break-inside: avoid; }
    .chart-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; color: #1f2937; }
    .chart-wrap { position: relative; height: 220px; }
    .simple-block { margin-top: 4px; border: 1px solid #d6d8de; border-radius: 8px; overflow: hidden; }
    .simple-row { display: flex; justify-content: space-between; gap: 12px; padding: 8px 10px; border-bottom: 1px solid #eceef3; }
    .simple-row:last-child { border-bottom: none; }
    .muted { color: #666; padding: 8px 10px; }
    .day-section { break-inside: avoid; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; table-layout: fixed; }
    th, td { border: 1px solid #d8dbe2; padding: 7px 8px; text-align: left; vertical-align: top; word-wrap: break-word; }
    th { background: #f2f4f8; font-weight: 700; }
    th:nth-child(1), td:nth-child(1) { width: 22%; }
    th:nth-child(2), td:nth-child(2) { width: 22%; }
    th:nth-child(3), td:nth-child(3) { width: 14%; }
    th:nth-child(4), td:nth-child(4) { width: 42%; }
    .footer-note { margin-top: 14px; color: #6b7280; font-size: 11px; }
    @media print {
      .cards-grid { grid-template-columns: repeat(3, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <section>
    <h1>Reporte de visitas</h1>
    <div class="cards-grid">
      <div class="info-card">
        <div class="label">Vehículo</div>
        <div class="value sm">${escapeHtml(appSettings.vehiclePlate || '-')}</div>
      </div>
      <div class="info-card">
        <div class="label">Conductor</div>
        <div class="value sm">${escapeHtml(appSettings.userName || '-')}</div>
      </div>
      <div class="info-card">
        <div class="label">Período</div>
        <div class="value md">${escapeHtml(formatShortDate(reportStart))} - ${escapeHtml(formatShortDate(reportEnd))}</div>
      </div>
      <div class="info-card">
        <div class="label">Total trabajado</div>
        <div class="value sm">${escapeHtml(formatDuration(totalMinutes))}</div>
      </div>
      <div class="info-card">
        <div class="label">Días con actividad</div>
        <div class="value">${escapeHtml(workedDaysCount)}</div>
      </div>
      <div class="info-card">
        <div class="label">Visitas registradas</div>
        <div class="value">${escapeHtml(sessions.length)}</div>
      </div>
    </div>

    <h2>Gráficas incluidas</h2>
    <p>Tiempo por sucursal y tiempo trabajado por día.</p>
    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-title">Tiempo por sucursal</div>
        <div class="chart-wrap"><canvas id="chartByBranchPdf"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Tiempo trabajado por día</div>
        <div class="chart-wrap"><canvas id="chartByDayPdf"></canvas></div>
      </div>
    </div>

    <h3>Resumen tabular</h3>
    <div class="simple-block">${branchRows}</div>
    <div class="simple-block" style="margin-top:10px;">${daySummaryRows}</div>
  </section>

  <section style="margin-top: 18px;">
    <h2>Detalle de visitas</h2>
    <p>Las visitas se agrupan por fecha y se muestran en tabla para facilitar la lectura y la validación operativa.</p>
    ${dailySections}
    <p class="footer-note">Generado por VisitControl · ${escapeHtml(todayIso)}</p>
  </section>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast('El navegador bloqueó la ventana de impresión. Habilita popups para esta app.', 'error');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = async () => {
    const chartLibReady = typeof printWindow.Chart !== 'undefined';
    if (chartLibReady) {
      const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#334155', font: { size: 10 } }, grid: { display: false } },
          y: { ticks: { color: '#334155', font: { size: 10 } }, beginAtZero: true, grid: { color: '#e2e8f0' } }
        }
      };

      const branchCtx = printWindow.document.getElementById('chartByBranchPdf');
      const dayCtx = printWindow.document.getElementById('chartByDayPdf');

      if (branchCtx) {
        new printWindow.Chart(branchCtx, {
          type: 'bar',
          data: {
            labels: branchLabels,
            datasets: [{
              data: branchMinutes,
              backgroundColor: '#3b82f6',
              borderRadius: 6,
              maxBarThickness: 28
            }]
          },
          options: chartOptions
        });
      }

      if (dayCtx) {
        new printWindow.Chart(dayCtx, {
          type: 'line',
          data: {
            labels: dayLabels,
            datasets: [{
              data: dayMinutes,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.20)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#1d4ed8'
            }]
          },
          options: chartOptions
        });
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 350));
    printWindow.print();
  };
  showToast('Vista lista para guardar como PDF', 'success');
}
