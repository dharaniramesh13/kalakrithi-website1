(function () {
  const U = {
    $: (s, r = document) => r.querySelector(s),
    $$: (s, r = document) => Array.from(r.querySelectorAll(s)),
    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    money(n) { return CONFIG.currency + Number(n).toLocaleString(CONFIG.locale); },
    date(t) { return new Date(t).toLocaleDateString(CONFIG.locale, { day: 'numeric', month: 'short', year: 'numeric' }); },
    uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e).trim()); },
    shortName(n) {
      const p = String(n).trim().split(/\s+/);
      return p.length > 1 ? p[0] + ' ' + p[p.length - 1][0] + '.' : p[0];
    },
    announce(msg) {
      const a = document.getElementById('announcer');
      if (a) { a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 30); }
    },
    toast(msg) {
      let t = document.getElementById('toast');
      if (!t) {
        t = document.createElement('div');
        t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status');
        document.body.appendChild(t);
      }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(U._tt);
      U._tt = setTimeout(() => t.classList.remove('show'), 3800);
    },
    async hash(str) {
      const data = new TextEncoder().encode('kalakriti:' + str);
      if (window.crypto && crypto.subtle) {
        const b = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
      }
      let h = 5381; for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
      return 'x' + h;
    },
    /* Shrinks an uploaded photo so it stays light in browser storage. */
    resize(file, max) {
      max = max || 1600;
      return new Promise((res, rej) => {
        if (!file || !/^image\//.test(file.type)) return rej(new Error('Please choose an image file (JPG, PNG or WebP).'));
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          res(c.toDataURL('image/jpeg', 0.86));
        };
        img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('That image could not be read. Try a different file.')); };
        img.src = url;
      });
    }
  };
  window.U = U;
})();
