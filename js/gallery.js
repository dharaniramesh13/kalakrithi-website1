/* Home page: hero, collection grid with filters, artwork viewer, artists, exhibitions, contact. */
(async function () {
  const { $, $$, esc, money } = U;
  await Market.init();
  if (!Nav.init()) return;
  const session = Market.session();

  const state = { cat: 'All', medium: 'All', year: 'All', sort: 'newest', savedOnly: false };
  let saved = []; try { saved = JSON.parse(localStorage.getItem('kk_saved') || '[]'); } catch (e) {}
  const persistSaved = () => { try { localStorage.setItem('kk_saved', JSON.stringify(saved)); } catch (e) {} $('#savedCount').textContent = saved.length; };
  let order = [], idx = -1;

  /* ---------- static bits ---------- */
  document.title = CONFIG.fullName + ' | Contemporary Art from India';
  $('#heroTitle').textContent = CONFIG.name; $('#tagline').textContent = CONFIG.tagline;
  $('#footerName').textContent = CONFIG.name; $('#copyName').textContent = CONFIG.fullName;
  $('#year').textContent = new Date().getFullYear();
  $('#emailLink').textContent = CONFIG.email; $('#emailLink').href = 'mailto:' + CONFIG.email;
  $('#portraitImg').src = Placeholder.art(14, 800, 1000);
  $('#exhibitionList').innerHTML = CONFIG.exhibitions.map(x => `<article class="ex"><h3>${esc(x.title)}</h3><p class="ex-when">${esc(x.dates)}<br>${esc(x.place)}</p><p>${esc(x.text)}</p></article>`).join('');

  /* ---------- filtering ---------- */
  function filtered() {
    let l = Market.artworks().filter(a =>
      (state.cat === 'All' || a.category === state.cat) && (state.medium === 'All' || a.medium === state.medium) &&
      (state.year === 'All' || String(a.year) === state.year) && (!state.savedOnly || saved.includes(a.id)));
    const by = { newest: (a, b) => b.year - a.year || b.created - a.created, oldest: (a, b) => a.year - b.year || a.created - b.created,
      priceLow: (a, b) => a.price - b.price, priceHigh: (a, b) => b.price - a.price, title: (a, b) => a.title.localeCompare(b.title) };
    return l.sort(by[state.sort]);
  }
  function renderFilters() {
    const all = Market.artworks();
    const cats = ['All'].concat(CONFIG.categories, [...new Set(all.map(a => a.category))].filter(c => !CONFIG.categories.includes(c)));
    $('#categoryPills').innerHTML = cats.map(c => `<button class="pill" type="button" data-cat="${esc(c)}" aria-pressed="${state.cat === c}">${esc(c)}</button>`).join('');
    const opts = (label, vals, cur) => `<option value="All">${label}</option>` + vals.map(v => `<option value="${esc(v)}"${String(v) === cur ? ' selected' : ''}>${esc(v)}</option>`).join('');
    $('#mediumSelect').innerHTML = opts('All media', [...new Set(all.map(a => a.medium))].sort(), state.medium);
    $('#yearSelect').innerHTML = opts('All years', [...new Set(all.map(a => String(a.year)))].sort().reverse(), state.year);
  }
  function renderGrid() {
    const l = filtered();
    $('#grid').innerHTML = l.map(a => MarketUI.cardHtml(a, { saved: saved.includes(a.id) })).join('');
    $('#empty').hidden = l.length > 0;
    $('#resultCount').textContent = l.length + (l.length === 1 ? ' work' : ' works');
    $$('#categoryPills .pill').forEach(p => p.setAttribute('aria-pressed', p.dataset.cat === state.cat));
    $('#savedOnly').setAttribute('aria-pressed', state.savedOnly);
  }
  function renderHero() {
    const list = Market.artworks().filter(a => a.status === 'available').sort((a, b) => b.created - a.created);
    const a = list[0] || Market.artworks()[0];
    $('#heroWork').innerHTML = a ? `<img src="${Market.imgOf(a)}" alt="${esc(a.title + ' by ' + Market.artist(a.artistId).name)}" width="800" height="1000"><figcaption><button class="link-btn" type="button" data-id="${a.id}">${esc(a.title)}</button>, ${esc(Market.artist(a.artistId).name)}</figcaption>` : '';
  }
  function renderArtists() {
    const l = Market.artists();
    $('#artistGrid').innerHTML = l.length ? l.map(a => {
      const n = Market.artworks().filter(w => w.artistId === a.id).length;
      return `<li class="artist-card"><a href="artist.html?id=${a.id}"><img src="${Market.photoOf(a)}" alt="" width="96" height="96"><span><strong>${esc(a.name)}</strong><span class="muted">${esc(a.city || 'India')} &middot; ${n} work${n === 1 ? '' : 's'} &middot; ${Market.followers(a.id).length} follower${Market.followers(a.id).length === 1 ? '' : 's'}</span></span></a></li>`;
    }).join('') : '<li class="muted">No artists have joined yet.</li>';
  }
  function fillContactSelect(sel) {
    $('#cWork').innerHTML = '<option value="">General inquiry</option>' + Market.artworks().map(a => `<option value="${a.id}">${esc(a.title)}, ${esc(Market.artist(a.artistId).name)}</option>`).join('');
    if (sel) $('#cWork').value = sel;
  }
  function refreshAll() { renderFilters(); renderGrid(); renderHero(); renderArtists(); fillContactSelect($('#cWork').value); }

  /* ---------- events: filters ---------- */
  $('#categoryPills').addEventListener('click', e => { const b = e.target.closest('[data-cat]'); if (b) { state.cat = b.dataset.cat; renderGrid(); } });
  $('#mediumSelect').addEventListener('change', e => { state.medium = e.target.value; renderGrid(); });
  $('#yearSelect').addEventListener('change', e => { state.year = e.target.value; renderGrid(); });
  $('#sortSelect').addEventListener('change', e => { state.sort = e.target.value; renderGrid(); });
  $('#savedOnly').addEventListener('click', () => { state.savedOnly = !state.savedOnly; renderGrid(); });
  $('#savedBtn').addEventListener('click', () => { state.savedOnly = true; renderGrid(); location.hash = '#gallery'; U.announce('Showing saved works'); });
  $('#resetFilters').addEventListener('click', () => { Object.assign(state, { cat: 'All', medium: 'All', year: 'All', savedOnly: false }); renderFilters(); renderGrid(); });

  function toggleSave(id) {
    const i = saved.indexOf(id); if (i >= 0) saved.splice(i, 1); else saved.push(id);
    persistSaved(); U.announce(i >= 0 ? 'Removed from saved works' : 'Saved');
    $$(`[data-heart="${id}"]`).forEach(h => h.setAttribute('aria-pressed', saved.includes(id)));
    if (state.savedOnly) renderGrid();
    updateViewerHeart();
  }
  $('#grid').addEventListener('click', e => {
    const h = e.target.closest('[data-heart]'); if (h) return toggleSave(h.dataset.heart);
    const c = e.target.closest('.card-open'); if (c) openViewer(c.dataset.id);
  });
  $('#heroWork').addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) openViewer(b.dataset.id); });

  /* ---------- viewer ---------- */
  const v = $('#viewer'), zoomWrap = $('#zoomWrap');
  function openViewer(id) {
    order = filtered().map(a => a.id);
    if (!order.includes(id)) order = Market.artworks().map(a => a.id);
    idx = order.indexOf(id); show(); if (!v.open) v.showModal();
  }
  function show() {
    const a = Market.artwork(order[idx]); if (!a) return;
    const ar = Market.artist(a.artistId) || { name: 'Unknown artist', id: '' };
    $('#vImg').src = Market.imgOf(a); $('#vImg').alt = `${a.title}, ${a.medium}, by ${ar.name}`;
    setZoom(false);
    $('#vTitle').textContent = a.title;
    $('#vArtist').innerHTML = `by <a href="artist.html?id=${ar.id}">${esc(ar.name)}</a>` + (ar.email ? ` &middot; <a href="mailto:${esc(ar.email)}?subject=${encodeURIComponent('Enquiry about ' + a.title)}">Email the artist</a>` : '');
    $('#vFacts').innerHTML = [['Category', a.category], ['Medium', a.medium], ['Year', a.year], ['Size', a.size || 'On request'], ['Status', a.status === 'sold' ? 'Sold' : 'Available']]
      .map(f => `<div><dt>${f[0]}</dt><dd>${esc(f[1])}</dd></div>`).join('');
    $('#vDesc').textContent = a.description || '';
    const t = Market.topBid(a.id);
    $('#vPrice').innerHTML = a.status === 'sold' ? 'Sold' : `<span class="price">${money(a.price)}</span>` + (t ? ` <span class="bid-tag">Highest bid ${money(t.amount)}</span>` : '');
    MarketUI.render(a, { market: $('#vMarket'), bids: $('#vBids') }, () => { renderGrid(); renderHero(); show(); });
    const edit = $('#vEdit'); edit.hidden = !Market.canEdit(session, a); edit.href = 'dashboard.html#edit=' + a.id;
    $('#vInquire').hidden = session.role !== 'visitor';
    $('#vCount').textContent = `${idx + 1} of ${order.length}`;
    $('#vPrev').hidden = $('#vNext').hidden = order.length < 2;
    $('#vHeart').hidden = session.role !== 'visitor';
    updateViewerHeart();
    history.replaceState(null, '', '#work=' + a.id);
  }
  function updateViewerHeart() {
    const id = order[idx], on = saved.includes(id);
    $('#vHeart').setAttribute('aria-pressed', on); $('#vHeartText').textContent = on ? 'Saved' : 'Save';
  }
  const step = d => { idx = (idx + d + order.length) % order.length; show(); };
  function setZoom(on) { zoomWrap.classList.toggle('zoomed', on); $('#zoomBtn').textContent = on ? 'Zoom out' : 'Zoom in'; $('#zoomBtn').setAttribute('aria-pressed', on); }
  $('#zoomBtn').addEventListener('click', () => setZoom(!zoomWrap.classList.contains('zoomed')));
  zoomWrap.addEventListener('click', () => setZoom(!zoomWrap.classList.contains('zoomed')));
  zoomWrap.addEventListener('mousemove', e => { if (!zoomWrap.classList.contains('zoomed')) return; const r = zoomWrap.getBoundingClientRect(); $('#vImg').style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%'; });
  $('#vPrev').addEventListener('click', () => step(-1));
  $('#vNext').addEventListener('click', () => step(1));
  $('#vClose').addEventListener('click', () => v.close());
  $('#vHeart').addEventListener('click', () => toggleSave(order[idx]));
  $('#vInquire').addEventListener('click', () => { const id = order[idx]; v.close(); fillContactSelect(id); location.hash = '#contact'; setTimeout(() => $('#cMessage').focus(), 300); });
  v.addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
  v.addEventListener('click', e => { if (e.target === v) v.close(); });
  document.addEventListener('keydown', e => {
    if (!v.open || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1);
  });

  /* ---------- contact + newsletter ---------- */
  if (session.role !== 'admin') { $('#cName').value = session.role === 'visitor' ? session.name : ''; $('#cEmail').value = session.role === 'visitor' ? session.email : ''; }
  const setErr = (id, m) => { $('#' + id).textContent = m; return !m; };
  $('#contactForm').addEventListener('submit', async e => {
    e.preventDefault();
    const n = $('#cName').value.trim(), em = $('#cEmail').value.trim(), m = $('#cMessage').value.trim();
    const ok = [setErr('cNameErr', n ? '' : 'Please enter your name.'), setErr('cEmailErr', U.validEmail(em) ? '' : 'Please enter a valid email address.'), setErr('cMessageErr', m ? '' : 'Please write a short message.')].every(Boolean);
    if (!ok) return;
    try {
      await Market.addInquiry({ type: 'Inquiry', name: n, email: em, workId: $('#cWork').value, message: m });
      const note = $('#formNote'); note.hidden = false; note.textContent = 'Thank you, ' + n + '. We will reply within two working days.';
      $('#cMessage').value = ''; U.announce('Inquiry sent');
    } catch (x) { setErr('cMessageErr', x.message); }
  });
  $('#newsForm').addEventListener('submit', async e => {
    e.preventDefault(); const em = $('#newsEmail').value.trim(), msg = $('#newsMsg');
    if (!U.validEmail(em)) { msg.textContent = 'Please enter a valid email address.'; return; }
    await Market.addInquiry({ type: 'Newsletter', name: '', email: em, message: 'Subscribed to the monthly newsletter' });
    msg.textContent = 'Subscribed. Thank you.'; $('#newsEmail').value = '';
  });

  /* ---------- go ---------- */
  persistSaved(); refreshAll();
  const m = location.hash.match(/^#work=(.+)$/);
  if (m && Market.artwork(m[1])) openViewer(m[1]);
})();
