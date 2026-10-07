/* Role-based workspace: Admin module, Artist studio, Visitor account. */
(async function () {
  const { $, $$, esc, money } = U;
  await Market.init();
  if (!Nav.init()) return;
  const s = Market.session();
  const TABS = {
    admin: [['artworks', 'All artworks'], ['artists', 'Artists'], ['orders', 'Orders'], ['inquiries', 'Inquiries']],
    artist: [['artworks', 'My artworks'], ['orders', 'Orders'], ['profile', 'My profile']],
    visitor: [['orders', 'My orders'], ['bids', 'My bids'], ['following', 'Following']]
  };
  const HEAD = { admin: 'Admin module', artist: 'Artist studio', visitor: 'My account' };
  const STATUSES = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
  let tab = TABS[s.role][0][0];
  $('#dTitle').textContent = HEAD[s.role];
  $('#dSub').textContent = { admin: 'You can modify every artwork, artist and order on the site.', artist: 'Upload and edit your work. It stays in the gallery every time you log in.', visitor: 'Orders you have placed, bids you have made, and artists you follow.' }[s.role];

  const table = (head, rows, empty) => rows.length ? `<div class="table-wrap"><table><thead><tr>${head.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>` : `<p class="empty-note">${empty}</p>`;
  const chip = t => `<span class="chip chip-${String(t).toLowerCase().replace(/\s/g, '')}">${esc(t)}</span>`;

  /* ---------- panels ---------- */
  const PANELS = {
    artworks() {
      const list = (s.role === 'admin' ? Market.artworks() : Market.artworks().filter(a => a.artistId === s.id)).slice().sort((a, b) => b.created - a.created);
      const head = ['Work'].concat(s.role === 'admin' ? ['Artist'] : [], ['Price', 'Status', 'Bids', 'Actions']);
      const rows = list.map(a => {
        const ar = Market.artist(a.artistId), bl = Market.bidsFor(a.id);
        return `<tr><td><div class="work-cell"><img src="${Market.imgOf(a)}" alt="" width="48" height="60"><span><strong>${esc(a.title)}</strong><br><span class="muted small">${esc(a.category)}, ${esc(a.year)}</span></span></div></td>
          ${s.role === 'admin' ? `<td>${esc(ar ? ar.name : 'Unknown')}</td>` : ''}<td>${money(a.price)}</td><td>${chip(a.status === 'sold' ? 'Sold' : 'Available')}</td>
          <td>${bl.length ? `${bl.length} (top ${money(bl[0].amount)})` : (a.bidding && a.bidding.enabled ? 'None yet' : 'Off')}</td>
          <td class="actions"><button class="btn small" data-act="edit" data-id="${a.id}">Edit</button>
          ${bl.length && a.status === 'available' ? `<button class="btn small" data-act="accept" data-id="${a.id}">Accept top bid</button>` : ''}
          ${s.role === 'admin' ? `<button class="btn small danger" data-act="delete" data-id="${a.id}">Delete</button>` : ''}</td></tr>`;
      });
      return `<div class="panel-head"><p class="muted">${list.length} artwork${list.length === 1 ? '' : 's'}${s.role === 'artist' ? '. Only the admin can remove a work from the gallery.' : ''}</p><button class="btn primary" data-act="new">Add artwork</button></div>` +
        table(head, rows, 'No artworks yet. Add your first one.');
    },
    artists() {
      const rows = Market.artists().map(a => `<tr><td><div class="work-cell"><img src="${Market.photoOf(a)}" alt="" width="48" height="48"><strong>${esc(a.name)}</strong></div></td><td><a href="mailto:${esc(a.email)}">${esc(a.email)}</a></td><td>${esc(a.city || '')}</td><td>${Market.artworks().filter(w => w.artistId === a.id).length}</td><td>${Market.followers(a.id).length}</td>
        <td class="actions"><a class="btn small" href="artist.html?id=${a.id}">View</a><button class="btn small danger" data-act="delArtist" data-id="${a.id}">Remove</button></td></tr>`);
      return table(['Artist', 'Email', 'City', 'Works', 'Followers', 'Actions'], rows, 'No artists have joined yet.');
    },
    orders() {
      const all = Market.orders().slice().sort((a, b) => b.at - a.at);
      const list = s.role === 'admin' ? all : s.role === 'artist' ? all.filter(o => o.artistId === s.id) : all.filter(o => o.buyerId === s.id);
      const vis = s.role === 'visitor';
      const rows = list.map(o => `<tr><td>${U.date(o.at)}</td><td><strong>${esc(o.title)}</strong>${vis ? '' : `<br><span class="muted small">${esc(Market.artist(o.artistId) ? Market.artist(o.artistId).name : '')}</span>`}</td>
        ${vis ? '' : `<td>${esc(o.buyerName)}<br><a href="mailto:${esc(o.buyerEmail)}">${esc(o.buyerEmail)}</a><br>${esc(o.phone)}</td><td class="addr">${esc(o.address)}</td>`}
        <td>${money(o.amount)}<br><span class="muted small">${esc(o.type)}</span></td>
        <td>${vis ? chip(o.status) : `<label class="sr-only" for="st_${o.id}">Status for ${esc(o.title)}</label><select id="st_${o.id}" data-act="status" data-id="${o.id}">${STATUSES.map(x => `<option${x === o.status ? ' selected' : ''}>${x}</option>`).join('')}</select>`}</td></tr>`);
      return table(['Date', 'Work'].concat(vis ? [] : ['Buyer', 'Delivery address'], ['Amount', 'Status']), rows,
        vis ? 'You have not placed any orders yet. <a href="index.html#gallery">Browse the collection</a>.' : 'No orders yet.');
    },
    inquiries() {
      const rows = Storage.get('inquiries').slice().sort((a, b) => b.at - a.at).map(q => {
        const w = q.workId ? Market.artwork(q.workId) : null;
        return `<tr><td>${U.date(q.at)}</td><td>${esc(q.type)}</td><td>${esc(q.name)}<br><a href="mailto:${esc(q.email)}">${esc(q.email)}</a></td><td>${w ? esc(w.title) : ''}</td><td class="addr">${esc(q.message)}</td></tr>`;
      });
      return table(['Date', 'Type', 'From', 'Work', 'Message'], rows, 'No inquiries yet.');
    },
    bids() {
      const mine = Market.bids().filter(b => b.visitorId === s.id), ids = [...new Set(mine.map(b => b.artworkId))];
      const rows = ids.map(id => {
        const a = Market.artwork(id); if (!a) return '';
        const my = Math.max(...mine.filter(b => b.artworkId === id).map(b => b.amount)), top = Market.topBid(id);
        const state = a.status === 'sold' ? (top && top.visitorId === s.id && top.amount === my ? 'Sold to you' : 'Sold') : (top.amount === my ? 'Leading' : 'Outbid');
        return `<tr><td><strong>${esc(a.title)}</strong></td><td>${money(my)}</td><td>${money(top.amount)}</td><td>${chip(state)}</td><td class="actions"><a class="btn small" href="index.html#work=${a.id}">View</a></td></tr>`;
      }).filter(Boolean);
      return table(['Work', 'Your highest bid', 'Highest bid now', 'Status', ''], rows, 'You have not placed any bids yet. <a href="index.html#gallery">Browse the collection</a>.');
    },
    following() {
      const ids = Storage.get('follows').filter(f => f.visitorId === s.id).map(f => f.artistId);
      const rows = ids.map(id => Market.artist(id)).filter(Boolean).map(a => `<tr><td><div class="work-cell"><img src="${Market.photoOf(a)}" alt="" width="48" height="48"><strong>${esc(a.name)}</strong></div></td><td>${esc(a.city || '')}</td><td class="actions"><a class="btn small" href="artist.html?id=${a.id}">View profile</a><button class="btn small" data-act="unfollow" data-id="${a.id}">Unfollow</button></td></tr>`);
      return table(['Artist', 'City', ''], rows, 'You are not following anyone yet. <a href="index.html#artists">Meet the artists</a>.');
    },
    profile() {
      const a = Market.artist(s.id), f = Market.followers(s.id);
      return `<form class="stack" id="profileForm" novalidate><div class="profile-edit"><img id="pPrev" src="${Market.photoOf(a)}" alt="Your profile photo" width="120" height="120">
        <div class="field"><label for="pPhoto">Profile photo</label><input id="pPhoto" type="file" accept="image/*"></div></div>
        <div class="field"><label for="pName">Name</label><input id="pName" value="${esc(a.name)}" required></div>
        <div class="field"><label for="pEmail">Email (visitors use this to contact you)</label><input id="pEmail" value="${esc(a.email)}" disabled></div>
        <div class="field"><label for="pCity">City</label><input id="pCity" value="${esc(a.city || '')}"></div>
        <div class="field"><label for="pBio">About you</label><textarea id="pBio" rows="5">${esc(a.bio || '')}</textarea></div>
        <p class="error" id="pErr" role="alert"></p><div><button class="btn primary" type="submit">Save profile</button> <a class="btn" href="artist.html?id=${a.id}">View public profile</a></div></form>
        <h3 class="sub">Followers (${f.length})</h3><p class="muted">${f.length ? f.map(x => esc(x.name)).join(', ') : 'No followers yet. Share your profile link with visitors.'}</p>`;
    }
  };
  

  function render() {
    $('#tabs').innerHTML = TABS[s.role].map(t => `<button role="tab" type="button" class="tab" data-tab="${t[0]}" aria-selected="${t[0] === tab}">${t[1]}</button>`).join('');
    const p = $('#panel'); p.innerHTML = PANELS[tab](); p.setAttribute('aria-labelledby', 'tabs');
    wirePanel();
  }
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; render(); } });

  /* ---------- panel actions ---------- */
  const run = async (fn, ok) => { try { await fn(); if (ok) U.toast(ok); render(); } catch (e) { U.toast(e.message); } };
  $('#panel').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'SELECT') return;
    const id = b.dataset.id, act = b.dataset.act;
    if (act === 'new') openEditor(); if (act === 'edit') openEditor(id);
    if (act === 'delete' && confirm('Delete "' + Market.artwork(id).title + '" and its bids from the gallery? This cannot be undone.')) run(() => Market.deleteArtwork(id), 'Artwork deleted.');
    if (act === 'accept') { const a = Market.artwork(id), t = Market.topBid(id); if (confirm('Accept the highest bid of ' + money(t.amount) + ' from ' + t.name + '? The work will be marked sold.')) run(() => Market.acceptTopBid(id), 'Bid accepted. An order was created.'); }
    if (act === 'delArtist' && confirm('Remove this artist and all of their artworks? This cannot be undone.')) run(() => Market.deleteArtist(id), 'Artist removed.');
    if (act === 'unfollow') run(() => Market.toggleFollow(id), 'Unfollowed.');
  });
  $('#panel').addEventListener('change', e => { const t = e.target; if (t.dataset && t.dataset.act === 'status') run(() => Market.setOrderStatus(t.dataset.id, t.value), 'Order status updated.'); });
  function wirePanel() {
    const f = $('#profileForm'); if (!f) return;
    let photo;
    $('#pPhoto').addEventListener('change', async e => { try { photo = await U.resize(e.target.files[0], 600); $('#pPrev').src = photo; } catch (x) { $('#pErr').textContent = x.message; } });
    f.addEventListener('submit', async e => {
      e.preventDefault(); $('#pErr').textContent = '';
      if (!$('#pName').value.trim()) { $('#pErr').textContent = 'Please enter your name.'; return; }
      const d = { name: $('#pName').value.trim(), city: $('#pCity').value.trim(), bio: $('#pBio').value.trim() }; if (photo) d.photo = photo;
      try { await Market.updateArtist(s.id, d); U.toast('Profile saved.'); render(); } catch (x) { $('#pErr').textContent = x.message; }
    });
  }

  /* ---------- artwork editor (artists edit their own; admin edits all) ---------- */
  const dlg = $('#editor');
  function openEditor(id) {
    const a = id ? Market.artwork(id) : null;
    if (a && !Market.canEdit(s, a)) return U.toast('You can only edit your own artworks.');
    const cats = CONFIG.categories, v = a || { title: '', category: cats[0], medium: '', year: new Date().getFullYear(), size: '', price: '', description: '', bidding: { enabled: false, start: '' }, status: 'available' };
    let img = null;
    dlg.innerHTML = `<form id="eForm" novalidate><h2>${a ? 'Edit artwork' : 'Add artwork'}</h2>
      ${!a && s.role === 'admin' ? `<div class="field"><label for="eArtist">Artist</label><select id="eArtist">${Market.artists().map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></div>` : ''}
      <div class="field"><label for="eTitle">Title</label><input id="eTitle" value="${esc(v.title)}" required></div>
      <div class="row2"><div class="field"><label for="eCat">Category</label><select id="eCat">${cats.map(c => `<option${c === v.category ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
      <div class="field"><label for="eYear">Year</label><input id="eYear" type="number" min="1900" max="2100" value="${esc(v.year)}" required></div></div>
      <div class="field"><label for="eMedium">Medium</label><input id="eMedium" value="${esc(v.medium)}" placeholder="Oil on canvas" required></div>
      <div class="row2"><div class="field"><label for="eSize">Size</label><input id="eSize" value="${esc(v.size)}" placeholder="60 x 80 cm"></div>
      <div class="field"><label for="ePrice">Price (${CONFIG.currency})</label><input id="ePrice" type="number" min="1" value="${esc(v.price)}" required></div></div>
      <div class="field"><label for="eDesc">Description</label><textarea id="eDesc" rows="4">${esc(v.description)}</textarea></div>
      <div class="field"><label for="eImg">${a ? 'Replace image (optional)' : 'Image'}</label><input id="eImg" type="file" accept="image/*"><img id="ePrev" class="e-prev" ${a ? `src="${Market.imgOf(a)}"` : 'hidden'} alt="Image preview" width="120" height="150"></div>
      <div class="field check"><input id="eBid" type="checkbox"${v.bidding && v.bidding.enabled ? ' checked' : ''}><label for="eBid">Allow visitors to bid on this work</label></div>
      <div class="field" id="eStartWrap"><label for="eStart">Starting bid (${CONFIG.currency})</label><input id="eStart" type="number" min="1" value="${esc(v.bidding && v.bidding.start || '')}"></div>
      ${a && s.role === 'admin' ? `<div class="field"><label for="eStatus">Status</label><select id="eStatus"><option value="available"${v.status === 'available' ? ' selected' : ''}>Available</option><option value="sold"${v.status === 'sold' ? ' selected' : ''}>Sold</option></select></div>` : ''}
      <p class="error" id="eErr" role="alert"></p>
      <div class="gate-actions"><button class="btn primary" type="submit">${a ? 'Save changes' : 'Upload artwork'}</button><button class="link-btn" type="button" id="eCancel">Cancel</button></div></form>`;
    const sync = () => { $('#eStartWrap').hidden = !$('#eBid').checked; }; sync();
    $('#eBid').addEventListener('change', sync);
    $('#eCancel').addEventListener('click', () => dlg.close());
    $('#eImg').addEventListener('change', async e => {
      try { img = await U.resize(e.target.files[0], 1600); $('#ePrev').src = img; $('#ePrev').hidden = false; $('#eErr').textContent = ''; }
      catch (x) { img = null; $('#eErr').textContent = x.message; }
    });
    $('#eForm').addEventListener('submit', async e => {
      e.preventDefault(); const er = $('#eErr'); er.textContent = '';
      const d = { id: a ? a.id : null, artistId: $('#eArtist') ? $('#eArtist').value : null, title: $('#eTitle').value.trim(), category: $('#eCat').value, medium: $('#eMedium').value.trim(),
        year: Number($('#eYear').value), size: $('#eSize').value.trim(), price: Number($('#ePrice').value), description: $('#eDesc').value.trim(), img,
        status: $('#eStatus') ? $('#eStatus').value : null, bidding: { enabled: $('#eBid').checked, start: Number($('#eStart').value) || 0 } };
      if (!d.title) return er.textContent = 'Please enter a title.';
      if (!d.medium) return er.textContent = 'Please enter the medium.';
      if (!d.year) return er.textContent = 'Please enter the year.';
      if (!(d.price > 0)) return er.textContent = 'Please enter a price greater than zero.';
      if (d.bidding.enabled && !(d.bidding.start > 0)) return er.textContent = 'Please enter a starting bid.';
      if (!a && !img) return er.textContent = 'Please choose an image of the artwork.';
      const btn = e.submitter; if (btn) btn.disabled = true;
      try { await Market.saveArtwork(d); dlg.close(); U.toast(a ? 'Changes saved.' : 'Artwork uploaded. It is now in the gallery.'); render(); }
      catch (x) { er.textContent = x.message; if (btn) btn.disabled = false; }
    });
    dlg.showModal();
  }

  render();
  const m = location.hash.match(/^#edit=(.+)$/);
  if (m && Market.artwork(m[1]) && s.role !== 'visitor') { tab = 'artworks'; render(); openEditor(m[1]); }
})();
