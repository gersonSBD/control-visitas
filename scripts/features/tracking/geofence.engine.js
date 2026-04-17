// =============================================
// GEOFENCE ENGINE
// =============================================
let watchId = null;
let insideBranch = null;
let lastPositions = [];
let trackingActive = false;
const STABILITY = 2;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function toggleTracking() {
  if (trackingActive) stopTracking();
  else await startTracking();
}

async function startTracking() {
  if (!navigator.geolocation) { showToast('GPS no disponible', 'error'); return; }
  trackingActive = true;
  updateTrackingBadge();
  watchId = navigator.geolocation.watchPosition(
    pos => handlePosition(pos),
    err => { showToast('Error GPS: ' + err.message, 'error'); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
  );
  showToast('Tracking activado', 'success');
}

function stopTracking() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null; trackingActive = false; lastPositions = [];
  updateTrackingBadge();
  showToast('Tracking detenido', '');
}

function updateTrackingBadge() {
  const badge = document.getElementById('trackingBadge');
  const label = document.getElementById('trackingLabel');
  if (trackingActive) {
    badge.classList.add('active');
    label.textContent = 'ACTIVO';
  } else {
    badge.classList.remove('active');
    label.textContent = 'INACTIVO';
  }
}

async function handlePosition(pos) {
  const { latitude, longitude, accuracy } = pos.coords;
  if (accuracy > appSettings.minAccuracyMeters) return;

  lastPositions.push({ latitude, longitude });
  if (lastPositions.length > STABILITY) lastPositions.shift();
  if (lastPositions.length < STABILITY) return;

  const branches = await dbGetAll('branches');
  const activeBranches = branches.filter(b => b.active);

  let detectedBranch = null;
  let minDist = Infinity;

  for (const b of activeBranches) {
    const dist = haversine(latitude, longitude, b.latitude, b.longitude);
    if (dist < b.entryRadiusMeters && dist < minDist) {
      detectedBranch = b;
      minDist = dist;
    }
  }

  const stable = lastPositions.every(p => {
    if (!detectedBranch) return true;
    return haversine(p.latitude, p.longitude, detectedBranch.latitude, detectedBranch.longitude) < detectedBranch.entryRadiusMeters;
  });
  if (!stable) return;

  if (detectedBranch && insideBranch !== detectedBranch.id) {
    if (insideBranch) {
      const prev = activeBranches.find(b => b.id === insideBranch);
      if (prev) {
        const d = haversine(latitude, longitude, prev.latitude, prev.longitude);
        if (d > prev.exitRadiusMeters) await logEvent(prev, 'EXIT', 'AUTO', latitude, longitude, accuracy);
      }
    }
    insideBranch = detectedBranch.id;
    await logEvent(detectedBranch, 'ENTRY', 'AUTO', latitude, longitude, accuracy);
    renderDashboard();
  } else if (!detectedBranch && insideBranch) {
    const prev = activeBranches.find(b => b.id === insideBranch);
    if (prev) {
      const d = haversine(latitude, longitude, prev.latitude, prev.longitude);
      if (d > prev.exitRadiusMeters) {
        await logEvent(prev, 'EXIT', 'AUTO', latitude, longitude, accuracy);
        insideBranch = null;
        renderDashboard();
      }
    }
  }

  updateNearby(latitude, longitude, activeBranches);
}

function updateNearby(lat, lng, branches) {
  const el = document.getElementById('nearbyBranches');
  const sorted = branches.map(b => ({ ...b, dist: haversine(lat, lng, b.latitude, b.longitude) }))
    .sort((a, b) => a.dist - b.dist).slice(0, 3);

  if (!sorted.length) { el.innerHTML = '<div class="empty">Sin sucursales</div>'; return; }
  el.innerHTML = sorted.map(b => `
    <div class="branch-item ${b.id === insideBranch ? 'inside' : ''}" style="margin-bottom:6px;">
      <div class="branch-icon">${b.id === insideBranch ? '📍' : '🏢'}</div>
      <div class="branch-info">
        <div class="branch-name">${b.name}</div>
        <div class="branch-meta">${b.id === insideBranch ? 'DENTRO' : ''}</div>
      </div>
      <div class="branch-distance">${b.dist < 1000 ? Math.round(b.dist) + 'm' : (b.dist / 1000).toFixed(1) + 'km'}</div>
    </div>
  `).join('');
}
