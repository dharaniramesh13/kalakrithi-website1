/* Accounts, roles, artworks, bids, orders and follows. All data goes through Storage. */
window.Market = (function () {
  const SKEY = 'kk_session';
  const get = k => Storage.get(k);
  const session = () => { try { return JSON.parse(sessionStorage.getItem(SKEY)); } catch (e) { return null; } };
  const setSession = s => sessionStorage.setItem(SKEY, JSON.stringify(s));
  const logout = () => sessionStorage.removeItem(SKEY);
  const rnd = () => Math.floor(Math.random() * 90) + 10;
  const fail = m => { throw new Error(m); };

  async function init() {
    await Storage.ready;
    let first = false;
    await Storage.update('meta', m => { if (!m.seeded) { m.seeded = Date.now(); first = true; } return m; });
    if (!first) return;
    const ph = await U.hash('artist123');
    await Storage.update('artists', a => { SEED.artists.forEach(x => a.push(Object.assign({}, x, { passHash: ph, photo: null, joined: Date.now() }))); return a; });
    await Storage.update('artworks', a => { SEED.artworks.forEach(x => a.push(Object.assign({}, x, { img: null, status: 'available', created: Date.now() - x.ageDays * 864e5 }))); return a; });
  }

  /* ---------- queries ---------- */
  const artists = () => get('artists');
  const artworks = () => get('artworks');
  const bids = () => get('bids');
  const orders = () => get('orders');
  const artist = id => artists().find(a => a.id === id);
  const artwork = id => artworks().find(a => a.id === id);
  const bidsFor = id => bids().filter(b => b.artworkId === id).sort((a, b) => b.amount - a.amount || a.at - b.at);
  const topBid = id => bidsFor(id)[0] || null;
  const minBid = art => { const t = topBid(art.id); return t ? t.amount + CONFIG.bidIncrement : art.bidding.start; };
  const imgOf = a => a.img || Placeholder.art(a.seed || 1);
  const photoOf = a => a.photo || Placeholder.avatar(a.name);
  const canEdit = (s, art) => !!s && (s.role === 'admin' || (s.role === 'artist' && art.artistId === s.id));

  /* ---------- sign in ---------- */
  async function loginVisitor(name, email) {
    name = name.trim(); email = email.trim().toLowerCase(); let rec;
    await Storage.update('visitors', l => {
      rec = l.find(v => v.email === email);
      if (rec) rec.name = name; else { rec = { id: U.uid('v_'), name, email, joined: Date.now() }; l.push(rec); }
      return l;
    });
    setSession({ role: 'visitor', id: rec.id, name: rec.name, email });
  }
  async function registerArtist(f) {
    const email = f.email.trim().toLowerCase(), ph = await U.hash(f.password); let rec, err = null;
    await Storage.update('artists', l => {
      if (l.some(a => a.email === email)) { err = 'An artist with this email already exists. Please log in instead.'; return l; }
      rec = { id: U.uid('a_'), name: f.name.trim(), email, passHash: ph, city: f.city.trim(), bio: '', photo: null, seed: rnd(), joined: Date.now() };
      l.push(rec); return l;
    });
    if (err) fail(err);
    setSession({ role: 'artist', id: rec.id, name: rec.name, email });
  }
  async function loginArtist(email, password) {
    email = email.trim().toLowerCase();
    const a = artists().find(x => x.email === email), ph = await U.hash(password);
    if (!a || a.passHash !== ph) fail('Email or password is incorrect.');
    setSession({ role: 'artist', id: a.id, name: a.name, email: a.email });
  }
  function loginAdmin(user, password) {
    if (user.trim().toLowerCase() !== CONFIG.admin.user.toLowerCase() || password !== CONFIG.admin.password) fail('Username or password is incorrect.');
    setSession({ role: 'admin', id: 'admin', name: 'Admin', email: CONFIG.email });
  }

  /* ---------- artists ---------- */
  async function updateArtist(id, f) {
    const s = session(); if (!s || (s.role !== 'admin' && s.id !== id)) fail('Not allowed.');
    await Storage.update('artists', l => {
      const a = l.find(x => x.id === id); if (!a) return l;
      ['name', 'city', 'bio', 'photo'].forEach(k => { if (f[k] !== undefined) a[k] = f[k]; });
      return l;
    });
    if (s.id === id) { const a = artist(id); setSession(Object.assign({}, s, { name: a.name })); }
  }
  async function deleteArtist(id) {
    const s = session(); if (!s || s.role !== 'admin') fail('Only the admin can remove artists.');
    const ids = artworks().filter(a => a.artistId === id).map(a => a.id);
    await Storage.update('artworks', l => l.filter(a => a.artistId !== id));
    await Storage.update('bids', l => l.filter(b => !ids.includes(b.artworkId)));
    await Storage.update('follows', l => l.filter(f => f.artistId !== id));
    await Storage.update('artists', l => l.filter(a => a.id !== id));
  }

  /* ---------- artworks ---------- */
  async function saveArtwork(d) {
    const s = session(); if (!s || s.role === 'visitor') fail('Not allowed.');
    const fields = { title: d.title, category: d.category, medium: d.medium, year: d.year, size: d.size, price: d.price, description: d.description, bidding: d.bidding };
    if (d.img) fields.img = d.img;
    if (s.role === 'admin' && d.status) fields.status = d.status;
    let err = null, out;
    await Storage.update('artworks', l => {
      if (d.id) {
        const a = l.find(x => x.id === d.id);
        if (!a) { err = 'Artwork not found.'; return l; }
        if (s.role === 'artist' && a.artistId !== s.id) { err = 'You can only edit your own artworks.'; return l; }
        Object.assign(a, fields); out = a;
      } else {
        const artistId = s.role === 'artist' ? s.id : d.artistId;
        if (!artistId || !artist(artistId)) { err = 'Please choose an artist.'; return l; }
        out = Object.assign({ id: U.uid('w_'), artistId, status: 'available', created: Date.now(), seed: rnd(), img: null }, fields);
        l.push(out);
      }
      return l;
    });
    if (err) fail(err);
    return out;
  }
  async function deleteArtwork(id) {
    const s = session(); if (!s || s.role !== 'admin') fail('Only the admin can remove artworks.');
    await Storage.update('artworks', l => l.filter(a => a.id !== id));
    await Storage.update('bids', l => l.filter(b => b.artworkId !== id));
  }

  /* ---------- bids and orders ---------- */
  async function placeBid(artId, amount) {
    const s = session(); if (!s || s.role !== 'visitor') fail('Only visitors can place bids.');
    amount = Math.round(Number(amount)); if (!amount || amount < 1) fail('Enter your bid amount.');
    const art = artwork(artId); if (!art || art.status !== 'available' || !art.bidding || !art.bidding.enabled) fail('Bidding is closed for this work.');
    let err = null;
    await Storage.update('bids', l => {
      const cur = l.filter(b => b.artworkId === artId).reduce((m, b) => Math.max(m, b.amount), 0);
      const min = cur ? cur + CONFIG.bidIncrement : art.bidding.start;
      if (amount < min) { err = 'Your bid must be at least ' + U.money(min) + '.'; return l; }
      l.push({ id: U.uid('b_'), artworkId: artId, visitorId: s.id, name: s.name, email: s.email, amount, at: Date.now() });
      return l;
    });
    if (err) fail(err);
  }
  async function placeOrder(artId, f) {
    const s = session(); if (!s || s.role !== 'visitor') fail('Only visitors can place orders.');
    let err = null, order;
    await Storage.update('artworks', l => {
      const a = l.find(x => x.id === artId);
      if (!a || a.status !== 'available') { err = 'Sorry, this work is no longer available.'; return l; }
      a.status = 'sold';
      order = { id: U.uid('o_'), artworkId: a.id, artistId: a.artistId, title: a.title, buyerId: s.id, buyerName: s.name, buyerEmail: s.email, phone: f.phone, address: f.address, amount: a.price, type: 'Order', status: 'Placed', at: Date.now() };
      return l;
    });
    if (err) fail(err);
    await Storage.update('orders', l => { l.push(order); return l; });
    return order;
  }
  async function acceptTopBid(artId) {
    const art = artwork(artId), s = session();
    if (!canEdit(s, art)) fail('Not allowed.');
    const t = topBid(artId); if (!t) fail('There are no bids yet.');
    if (art.status !== 'available') fail('This work is already sold.');
    await Storage.update('artworks', l => { const a = l.find(x => x.id === artId); if (a) a.status = 'sold'; return l; });
    await Storage.update('orders', l => {
      l.push({ id: U.uid('o_'), artworkId: art.id, artistId: art.artistId, title: art.title, buyerId: t.visitorId, buyerName: t.name, buyerEmail: t.email, phone: '', address: 'To be confirmed with the buyer', amount: t.amount, type: 'Accepted bid', status: 'Placed', at: Date.now() });
      return l;
    });
  }
  async function setOrderStatus(id, status) {
    const s = session(), o = orders().find(x => x.id === id);
    if (!o || !s || !(s.role === 'admin' || (s.role === 'artist' && o.artistId === s.id))) fail('Not allowed.');
    await Storage.update('orders', l => { const x = l.find(y => y.id === id); if (x) x.status = status; return l; });
    if (status === 'Cancelled') await Storage.update('artworks', l => { const a = l.find(x => x.id === o.artworkId); if (a) a.status = 'available'; return l; });
  }

  /* ---------- follows and inquiries ---------- */
  const followers = id => get('follows').filter(f => f.artistId === id);
  const isFollowing = id => { const s = session(); return !!s && s.role === 'visitor' && get('follows').some(f => f.visitorId === s.id && f.artistId === id); };
  async function toggleFollow(id) {
    const s = session(); if (!s || s.role !== 'visitor') fail('Only visitors can follow artists.');
    await Storage.update('follows', l => {
      const i = l.findIndex(f => f.visitorId === s.id && f.artistId === id);
      if (i >= 0) l.splice(i, 1); else l.push({ visitorId: s.id, name: s.name, email: s.email, artistId: id, at: Date.now() });
      return l;
    });
    return isFollowing(id);
  }
  const addInquiry = f => Storage.update('inquiries', l => { l.push(Object.assign({ id: U.uid('q_'), at: Date.now() }, f)); return l; });

  return { init, session, setSession, logout, artists, artworks, bids, orders, artist, artwork, bidsFor, topBid, minBid, imgOf, photoOf, canEdit,
    loginVisitor, registerArtist, loginArtist, loginAdmin, updateArtist, deleteArtist, saveArtwork, deleteArtwork,
    placeBid, placeOrder, acceptTopBid, setOrderStatus, followers, isFollowing, toggleFollow, addInquiry };
})();
