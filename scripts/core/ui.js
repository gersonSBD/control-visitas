// =============================================
// UI HELPERS
// =============================================
function showView(name, btn) {
  if (name !== 'settings' && typeof isProfileConfigured === 'function' && !isProfileConfigured()) {
    showToast('Configura nombre y placa primero', 'error');
    const settingsBtn = document.querySelector('.nav-item[data-view="settings"]');
    if (settingsBtn) {
      showView('settings', settingsBtn);
    }
    return;
  }
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'history') renderHistory();
  if (name === 'branches') renderBranches();
}

function showModal(id, options = {}) {
  const { skipReset = false } = options;
  if (id === 'manualEventModal') populateManualModal();
  if (id === 'branchModal' && !skipReset) resetBranchModal();
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function resetBranchModal() {
  document.getElementById('branchModalTitle').textContent = 'Nueva Sucursal';
  document.getElementById('branchId').value = '';
  document.getElementById('branchName').value = '';
  document.getElementById('branchLat').value = '';
  document.getElementById('branchLng').value = '';
  document.getElementById('branchEntryRadius').value = appSettings.defaultEntryRadiusMeters;
  document.getElementById('branchExitRadius').value = appSettings.defaultExitRadiusMeters;
  document.getElementById('branchPriority').value = '1';
}

async function populateManualModal() {
  const branches = await dbGetAll('branches');
  const sel = document.getElementById('manualBranchId');
  sel.innerHTML = branches.length
    ? branches.map(b => `<option value="${b.id}">${b.name}</option>`).join('')
    : '<option value="">Sin sucursales</option>';
  const now = new Date();
  const local = new Date(now - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('manualTimestamp').value = local;
  selectEventType('ENTRY');
}

function selectEventType(type) {
  document.getElementById('manualEventType').value = type;
  const btnEntry = document.getElementById('btnEntry');
  const btnExit = document.getElementById('btnExit');
  if (type === 'ENTRY') {
    btnEntry.className = 'btn btn-success btn-sm';
    btnExit.className = 'btn btn-ghost btn-sm';
  } else {
    btnEntry.className = 'btn btn-ghost btn-sm';
    btnExit.className = 'btn btn-danger btn-sm';
  }
}

function showConfirm(title, text, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmText').textContent = text;
  const btn = document.getElementById('confirmBtn');
  btn.onclick = () => { closeModal('confirmModal'); onConfirm(); };
  showModal('confirmModal');
}

function confirmClearData() {
  showConfirm('¿Borrar todos los datos?', 'Se eliminaran todas las sucursales, eventos y sesiones.', async () => {
    await dbClear('branches');
    await dbClear('events');
    await dbClear('sessions');
    insideBranch = null;
    showToast('Datos eliminados', 'success');
    renderDashboard();
    renderBranches();
  });
}

let toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (type ? ' ' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
