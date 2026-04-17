// =============================================
// DB LAYER (IndexedDB)
// =============================================
const DB_NAME = 'VisitControlDB';
const DB_VERSION = 1;
let db;

function initDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('branches')) {
        const bs = d.createObjectStore('branches', { keyPath: 'id' });
        bs.createIndex('active', 'active');
      }
      if (!d.objectStoreNames.contains('events')) {
        const es = d.createObjectStore('events', { keyPath: 'id' });
        es.createIndex('branchId', 'branchId');
        es.createIndex('timestamp', 'timestamp');
      }
      if (!d.objectStoreNames.contains('sessions')) {
        const ss = d.createObjectStore('sessions', { keyPath: 'id' });
        ss.createIndex('branchId', 'branchId');
        ss.createIndex('dateKey', 'dateKey');
      }
      if (!d.objectStoreNames.contains('settings')) {
        d.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = e => rej(e);
  });
}

function dbGet(store, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  });
}

function dbPut(store, item) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(item);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  });
}

function dbDelete(store, key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror = e => rej(e);
  });
}

function dbGetAll(store) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e);
  });
}

function dbClear(store) {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => res();
    req.onerror = e => rej(e);
  });
}
