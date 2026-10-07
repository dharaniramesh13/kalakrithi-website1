/* Persistent database. Uses IndexedDB (large, survives closing the browser and logging in again),
   with localStorage as a fallback. Every write is read-modify-write so two open tabs never overwrite each other. */
window.Storage = (function () {
  const DB = 'kalakriti-db', STORE = 'kv';
  const KEYS = { artists: [], artworks: [], bids: [], orders: [], visitors: [], follows: [], inquiries: [], meta: {} };
  const cache = {}; let db = null;

  const open = () => new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no idb'));
    const rq = indexedDB.open(DB, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(STORE);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
  const loadAll = () => new Promise((res, rej) => {
    const out = {}, tx = db.transaction(STORE, 'readonly'), rq = tx.objectStore(STORE).openCursor();
    rq.onsuccess = () => { const c = rq.result; if (c) { out[c.key] = c.value; c.continue(); } };
    tx.oncomplete = () => res(out); tx.onerror = () => rej(tx.error);
  });

  const ready = (async () => {
    try { db = await open(); Object.assign(cache, await loadAll()); }
    catch (e) {
      db = null;
      Object.keys(KEYS).forEach(k => { try { const v = localStorage.getItem('kk_' + k); if (v) cache[k] = JSON.parse(v); } catch (_) {} });
    }
    Object.keys(KEYS).forEach(k => { if (cache[k] === undefined) cache[k] = JSON.parse(JSON.stringify(KEYS[k])); });
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  })();

  const get = k => cache[k];

  /* update('artworks', list => { list.push(x); return list; }) */
  function update(k, fn) {
    if (!db) {
      try {
        let cur = JSON.parse(localStorage.getItem('kk_' + k) || 'null'); if (cur == null) cur = cache[k];
        const nv = fn(cur); cache[k] = nv === undefined ? cur : nv;
        localStorage.setItem('kk_' + k, JSON.stringify(cache[k]));
        return Promise.resolve(cache[k]);
      } catch (e) { return Promise.reject(new Error('Browser storage is full. Try a smaller image.')); }
    }
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite'), st = tx.objectStore(STORE), rq = st.get(k);
      rq.onsuccess = () => {
        let cur = rq.result; if (cur === undefined) cur = cache[k];
        const nv = fn(cur), out = nv === undefined ? cur : nv;
        st.put(out, k); cache[k] = out;
      };
      tx.oncomplete = () => res(cache[k]);
      tx.onerror = tx.onabort = () => rej(new Error('Could not save to browser storage. Try a smaller image.'));
    });
  }
  return { ready, get, update };
})();
