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
  contactPhone: '',
  reportDefaultRange: '7_DAYS'
};

async function loadSettings() {
  const s = await dbGet('settings', 'appSettings');
  if (s) appSettings = { ...appSettings, ...s.value };
  document.getElementById('settingTracking').checked = appSettings.geolocationWatchEnabled;
  document.getElementById('settingEntryRadius').value = appSettings.defaultEntryRadiusMeters;
  document.getElementById('settingExitRadius').value = appSettings.defaultExitRadiusMeters;
  document.getElementById('settingMinAccuracy').value = appSettings.minAccuracyMeters;
  document.getElementById('settingPhone').value = appSettings.contactPhone || '';
}

async function saveSettings() {
  appSettings.geolocationWatchEnabled = document.getElementById('settingTracking').checked;
  appSettings.defaultEntryRadiusMeters = parseInt(document.getElementById('settingEntryRadius').value);
  appSettings.defaultExitRadiusMeters = parseInt(document.getElementById('settingExitRadius').value);
  appSettings.minAccuracyMeters = parseInt(document.getElementById('settingMinAccuracy').value);
  appSettings.contactPhone = document.getElementById('settingPhone').value;
  await dbPut('settings', { key: 'appSettings', value: appSettings });
  showToast('Configuracion guardada', 'success');
}
