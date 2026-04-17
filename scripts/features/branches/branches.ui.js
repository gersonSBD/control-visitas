// =============================================
// BRANCHES
// =============================================
async function saveBranch() {
  const name = document.getElementById('branchName').value.trim();
  const lat = parseFloat(document.getElementById('branchLat').value);
  const lng = parseFloat(document.getElementById('branchLng').value);
  if (!name || isNaN(lat) || isNaN(lng)) {
    showToast('Completa nombre y coordenadas', 'error'); return;
  }
  const id = document.getElementById('branchId').value || genId();
  const now = new Date().toISOString();
  const branch = {
    id, name, latitude: lat, longitude: lng,
    entryRadiusMeters: parseInt(document.getElementById('branchEntryRadius').value) || 80,
    exitRadiusMeters: parseInt(document.getElementById('branchExitRadius').value) || 110,
    priority: parseInt(document.getElementById('branchPriority').value) || 1,
    active: true, createdAt: now, updatedAt: now
  };
  await dbPut('branches', branch);
  closeModal('branchModal');
  showToast(`Sucursal "${name}" guardada`, 'success');
  renderBranches();
}

async function renderBranches() {
  const branches = await dbGetAll('branches');
  branches.sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
  const el = document.getElementById('branchList');
  if (!branches.length) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">🏢</div>No hay sucursales. Agrega la primera.</div>';
    return;
  }
  el.innerHTML = branches.map(b => `
    <div class="branch-item ${insideBranch === b.id ? 'inside' : ''}" style="margin-bottom:8px;">
      <div class="branch-icon">${b.priority <= 3 ? '⭐' : '🏢'}</div>
      <div class="branch-info">
        <div class="branch-name">${b.name}</div>
        <div class="branch-meta">${b.latitude.toFixed(4)}, ${b.longitude.toFixed(4)} · R:${b.entryRadiusMeters}m</div>
      </div>
      <div class="branch-actions">
        <button class="btn btn-ghost btn-sm" onclick="editBranch('${b.id}')">✏</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBranch('${b.id}','${b.name}')">✕</button>
      </div>
    </div>
  `).join('');
}

async function editBranch(id) {
  const b = await dbGet('branches', id);
  document.getElementById('branchModalTitle').textContent = 'Editar Sucursal';
  document.getElementById('branchId').value = b.id;
  document.getElementById('branchName').value = b.name;
  document.getElementById('branchLat').value = b.latitude;
  document.getElementById('branchLng').value = b.longitude;
  document.getElementById('branchEntryRadius').value = b.entryRadiusMeters;
  document.getElementById('branchExitRadius').value = b.exitRadiusMeters;
  document.getElementById('branchPriority').value = b.priority;
  showModal('branchModal');
}

async function deleteBranch(id, name) {
  showConfirm(`¿Eliminar "${name}"?`, 'Esta accion no se puede deshacer.', async () => {
    await dbDelete('branches', id);
    showToast('Sucursal eliminada', 'success');
    renderBranches();
  });
}

async function useCurrentLocation() {
  if (!navigator.geolocation) { showToast('GPS no disponible', 'error'); return; }
  showToast('Obteniendo ubicacion...', '');
  navigator.geolocation.getCurrentPosition(pos => {
    document.getElementById('branchLat').value = pos.coords.latitude.toFixed(6);
    document.getElementById('branchLng').value = pos.coords.longitude.toFixed(6);
    showToast('Ubicacion obtenida ✓', 'success');
  }, () => showToast('Error GPS', 'error'), { enableHighAccuracy: true, timeout: 10000 });
}
