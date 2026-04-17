// =============================================
// FORMATTERS + UTILS
// =============================================
function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dk) {
  const [y, m, d] = dk.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatDuration(mins) {
  if (mins < 60) return mins + 'm';
  return Math.floor(mins / 60) + 'h' + (mins % 60 ? (mins % 60) + 'm' : '');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
