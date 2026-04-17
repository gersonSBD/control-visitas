// =============================================
// SETTINGS
// =============================================
let appSettings = {
  geolocationWatchEnabled: false,
  defaultEntryRadiusMeters: 80,
  defaultExitRadiusMeters: 110,
  minAccuracyMeters: 50,
  pollingIntervalMs: 15000,
  stabilityReadsRequired: 2,
  userName: '',
  vehiclePlate: '',
  contactPhone: '',
  reportDefaultRange: '7_DAYS'
};

function isProfileConfigured() {
  return Boolean(appSettings.userName?.trim() && appSettings.vehiclePlate?.trim());
}

async function loadSettings() {
  const s = await dbGet('settings', 'appSettings');
  if (s) appSettings = { ...appSettings, ...s.value };
  document.getElementById('settingUserName').value = appSettings.userName || '';
  document.getElementById('settingVehiclePlate').value = appSettings.vehiclePlate || '';
  document.getElementById('settingTracking').checked = appSettings.geolocationWatchEnabled;
  document.getElementById('settingEntryRadius').value = appSettings.defaultEntryRadiusMeters;
  document.getElementById('settingExitRadius').value = appSettings.defaultExitRadiusMeters;
  document.getElementById('settingMinAccuracy').value = appSettings.minAccuracyMeters;
  document.getElementById('settingPhone').value = appSettings.contactPhone || '';
}

async function saveSettings() {
  appSettings.userName = document.getElementById('settingUserName').value.trim();
  appSettings.vehiclePlate = document.getElementById('settingVehiclePlate').value.trim().toUpperCase();
  document.getElementById('settingVehiclePlate').value = appSettings.vehiclePlate;
  if (!appSettings.userName || !appSettings.vehiclePlate) {
    showToast('Completa nombre y placa para continuar', 'error');
    return;
  }
  appSettings.geolocationWatchEnabled = document.getElementById('settingTracking').checked;
  appSettings.defaultEntryRadiusMeters = parseInt(document.getElementById('settingEntryRadius').value);
  appSettings.defaultExitRadiusMeters = parseInt(document.getElementById('settingExitRadius').value);
  appSettings.minAccuracyMeters = parseInt(document.getElementById('settingMinAccuracy').value);
  appSettings.contactPhone = document.getElementById('settingPhone').value;
  await dbPut('settings', { key: 'appSettings', value: appSettings });
  showToast('Configuracion guardada', 'success');
}
