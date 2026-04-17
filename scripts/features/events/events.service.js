// =============================================
// EVENTS
// =============================================
async function logEvent(branch, type, source, lat, lng, accuracy) {
  const now = new Date().toISOString();
  const event = {
    id: genId(), branchId: branch.id, branchNameSnapshot: branch.name,
    type, timestamp: now, source,
    latitude: lat, longitude: lng, accuracy,
    createdAt: now, updatedAt: now
  };
  await dbPut('events', event);
  await updateSession(event, branch);
  renderRecentEvents();
  showToast(`${type === 'ENTRY' ? '▶ Entrada' : '■ Salida'}: ${branch.name}`, type === 'ENTRY' ? 'success' : '');
}

async function updateSession(event, branch) {
  const dateKey = event.timestamp.split('T')[0];
  const sessions = await dbGetAll('sessions');
  const openSession = sessions.find(s => s.branchId === branch.id && s.status === 'OPEN');

  if (event.type === 'ENTRY') {
    if (!openSession) {
      const session = {
        id: genId(), branchId: branch.id, branchNameSnapshot: branch.name,
        entryEventId: event.id, startTime: event.timestamp,
        status: 'OPEN', sourceSummary: event.source,
        observations: [], dateKey, createdAt: event.timestamp, updatedAt: event.timestamp
      };
      await dbPut('sessions', session);
    }
  } else if (event.type === 'EXIT' && openSession) {
    const start = new Date(openSession.startTime);
    const end = new Date(event.timestamp);
    const dur = Math.round((end - start) / 60000);
    openSession.exitEventId = event.id;
    openSession.endTime = event.timestamp;
    openSession.durationMinutes = dur;
    openSession.status = 'CLOSED';
    openSession.updatedAt = event.timestamp;
    if (event.source !== openSession.sourceSummary) openSession.sourceSummary = 'MIXED';
    await dbPut('sessions', openSession);
  }
}

async function saveManualEvent() {
  const branchId = document.getElementById('manualBranchId').value;
  const type = document.getElementById('manualEventType').value;
  const tsVal = document.getElementById('manualTimestamp').value;
  if (!branchId || !tsVal) { showToast('Completa todos los campos', 'error'); return; }

  const branch = await dbGet('branches', branchId);
  const obs = document.getElementById('manualObservation').value.trim();
  const now = new Date().toISOString();
  const event = {
    id: genId(), branchId: branch.id, branchNameSnapshot: branch.name,
    type, timestamp: new Date(tsVal).toISOString(), source: 'MANUAL',
    observation: obs || undefined, createdAt: now, updatedAt: now
  };
  await dbPut('events', event);
  await updateSession(event, branch);
  closeModal('manualEventModal');
  showToast('Evento manual registrado', 'success');
  renderDashboard();
}

async function renderRecentEvents() {
  const events = await dbGetAll('events');
  events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const recent = events.slice(0, 10);
  const el = document.getElementById('recentEvents');
  if (!recent.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🗓</div>Sin eventos registrados</div>';
    return;
  }
  el.innerHTML = recent.map(e => `
    <div class="event-item" style="margin-bottom:6px;">
      <div class="event-icon ${e.type === 'ENTRY' ? 'entry' : 'exit'}">${e.type === 'ENTRY' ? '▶' : '■'}</div>
      <div class="event-body">
        <div class="event-title">${e.branchNameSnapshot}</div>
        <div class="event-time">${formatDateTime(e.timestamp)}</div>
        ${e.observation ? `<div class="event-obs">${e.observation}</div>` : ''}
        <div class="event-badges">
          <span class="badge badge-${e.type === 'ENTRY' ? 'entry' : 'exit'}">${e.type === 'ENTRY' ? 'Entrada' : 'Salida'}</span>
          <span class="badge badge-${e.source === 'AUTO' ? 'auto' : 'manual'}">${e.source}</span>
        </div>
      </div>
    </div>
  `).join('');
}
