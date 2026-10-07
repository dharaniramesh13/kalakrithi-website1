/* Navigation and the entry gate ("Are you a visitor, an artist or the admin?"). */
window.Nav = (function () {
  const { $, esc } = U;

  function init() {
    const brand = $('#brandName'); if (brand) brand.textContent = CONFIG.name;
    const s = Market.session();
    if (!s) {
      if (document.body.dataset.page === 'home') Gate.open(); else location.replace('index.html');
      return false;
    }
    const label = { visitor: 'Visitor', artist: 'Artist', admin: 'Admin' }[s.role];
    const dash = { visitor: 'My orders', artist: 'My studio', admin: 'Admin module' }[s.role];
    $('#authLinks').innerHTML = `<span class="who">${esc(s.name)} <small>${label}</small></span>` +
      `<a href="dashboard.html">${dash}</a><button type="button" class="link-btn" id="logoutBtn">Switch role</button>`;
    $('#logoutBtn').addEventListener('click', () => { Market.logout(); location.href = 'index.html'; });
    const mb = $('#menuBtn'), nl = $('#navLinks');
    if (mb) {
      mb.addEventListener('click', () => { const o = nl.classList.toggle('open'); mb.setAttribute('aria-expanded', o); mb.setAttribute('aria-label', o ? 'Close menu' : 'Open menu'); });
      nl.addEventListener('click', e => { if (e.target.closest('a')) { nl.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); } });
    }
    return true;
  }
  return { init };
})();

window.Gate = (function () {
  const { esc } = U;
  let dlg, body;

  function open() {
    dlg = document.createElement('dialog');
    dlg.className = 'gate'; dlg.id = 'gate'; dlg.setAttribute('aria-labelledby', 'gateTitle');
    dlg.innerHTML = `<div class="gate-inner"><p class="gate-brand">${esc(CONFIG.name)}</p><h1 id="gateTitle" tabindex="-1"></h1><div id="gateBody"></div></div>`;
    document.body.appendChild(dlg);
    dlg.addEventListener('cancel', e => e.preventDefault());
    body = dlg.querySelector('#gateBody');
    choose(); dlg.showModal();
  }
  const title = t => { const h = dlg.querySelector('#gateTitle'); h.textContent = t; };
  const field = (id, label, type, extra) => `<div class="field"><label for="${id}">${label}</label><input id="${id}" type="${type || 'text'}" ${extra || ''}></div>`;
  const wrap = (html) => { body.innerHTML = html + '<p class="error" id="gErr" role="alert"></p>'; };
  const err = m => { dlg.querySelector('#gErr').textContent = m; };
  const back = '<button type="button" class="link-btn" id="gBack">Back</button>';

  function choose() {
    title('Welcome. Who is visiting today?');
    body.innerHTML = `<div class="roles">
      <button class="role-card" data-role="visitor"><strong>I am a visitor</strong><span>Browse the collection, follow artists, place bids and order artworks.</span></button>
      <button class="role-card" data-role="artist"><strong>I am an artist</strong><span>Log in or create your profile, upload your work and receive orders.</span></button>
      <button class="role-card" data-role="admin"><strong>I am the admin</strong><span>Manage every artwork, artist, order and inquiry.</span></button></div>`;
    body.querySelectorAll('.role-card').forEach(b => b.addEventListener('click', () => ({ visitor, artist, admin }[b.dataset.role])()));
    body.querySelector('.role-card').focus();
  }
  function visitor() {
    title('Welcome, visitor');
    wrap(`<form id="gForm" novalidate><p class="muted">We use your name and email so artists can reach you about orders and bids. Come back with the same email to see your orders.</p>
      ${field('gName', 'Your name', 'text', 'autocomplete="name" required')}${field('gEmail', 'Email address', 'email', 'autocomplete="email" required')}
      <div class="gate-actions"><button class="btn primary" type="submit">Enter the gallery</button>${back}</div></form>`);
    bind(async () => {
      const n = dlg.querySelector('#gName').value, e = dlg.querySelector('#gEmail').value;
      if (!n.trim()) return err('Please enter your name.');
      if (!U.validEmail(e)) return err('Please enter a valid email address.');
      await Market.loginVisitor(n, e); location.reload();
    }, 'gName');
  }
  function artist(mode) {
    mode = mode || 'login';
    title(mode === 'login' ? 'Artist log in' : 'Create your artist profile');
    wrap(`<div class="seg" role="group" aria-label="Log in or register"><button type="button" class="pill" data-m="login" aria-pressed="${mode === 'login'}">Log in</button><button type="button" class="pill" data-m="register" aria-pressed="${mode === 'register'}">New artist</button></div>
      <form id="gForm" novalidate>
      ${mode === 'register' ? field('gName', 'Your name', 'text', 'autocomplete="name" required') + field('gCity', 'City', 'text', 'autocomplete="address-level2"') : ''}
      ${field('gEmail', 'Email address', 'email', 'autocomplete="email" required')}
      ${field('gPass', 'Password', 'password', 'autocomplete="' + (mode === 'login' ? 'current-password' : 'new-password') + '" required')}
      ${mode === 'login' ? '<p class="muted small">Demo artists: meera@kalakriti.example, arjun@kalakriti.example or sana@kalakriti.example, password artist123.</p>' : '<p class="muted small">At least 6 characters. Visitors will use this email to contact you.</p>'}
      <div class="gate-actions"><button class="btn primary" type="submit">${mode === 'login' ? 'Log in' : 'Create profile'}</button>${back}</div></form>`);
    body.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => artist(b.dataset.m)));
    bind(async () => {
      const g = id => dlg.querySelector(id) ? dlg.querySelector(id).value : '';
      if (!U.validEmail(g('#gEmail'))) return err('Please enter a valid email address.');
      if (mode === 'login') { if (!g('#gPass')) return err('Please enter your password.'); await Market.loginArtist(g('#gEmail'), g('#gPass')); }
      else {
        if (!g('#gName').trim()) return err('Please enter your name.');
        if (g('#gPass').length < 6) return err('Password must be at least 6 characters.');
        await Market.registerArtist({ name: g('#gName'), city: g('#gCity'), email: g('#gEmail'), password: g('#gPass') });
      }
      location.href = 'dashboard.html';
    }, mode === 'login' ? 'gEmail' : 'gName');
  }
  function admin() {
    title('Admin log in');
    wrap(`<form id="gForm" novalidate>${field('gUser', 'Username', 'text', 'autocomplete="username" required')}${field('gPass', 'Password', 'password', 'autocomplete="current-password" required')}
      <div class="gate-actions"><button class="btn primary" type="submit">Open admin module</button>${back}</div></form>`);
    bind(async () => { Market.loginAdmin(dlg.querySelector('#gUser').value, dlg.querySelector('#gPass').value); location.href = 'dashboard.html'; }, 'gUser');
  }
  function bind(fn, focusId) {
    dlg.querySelector('#gBack').addEventListener('click', choose);
    dlg.querySelector('#gForm').addEventListener('submit', async e => {
      e.preventDefault(); err('');
      try { await fn(); } catch (x) { err(x.message || 'Something went wrong.'); }
    });
    dlg.querySelector('#' + focusId).focus();
  }
  return { open };
})();
