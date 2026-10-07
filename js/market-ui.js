/* Shared UI: artwork cards, and the order / bid panel and bid list inside the artwork viewer. */
window.MarketUI = (function () {
  const { esc, money } = U;
  const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-8-4.8-9.7-10C1.200 7.500 3.400 4.500 6.600 4.500c2 0 3.800 1.100 5.400 3 1.600-1.900 3.400-3 5.400-3 3.200 0 5.400 3 4.300 6.500C20 16.200 12 21 12 21z"/></svg>';

  function priceLine(a) {
    if (a.status === 'sold') return 'Sold';
    const t = Market.topBid(a.id);
    return money(a.price) + (t ? ` <span class="bid-tag">Top bid ${money(t.amount)}</span>` : (a.bidding && a.bidding.enabled ? ' <span class="bid-tag">Open for bids</span>' : ''));
  }
  /* asLink: render as <a href="index.html#work=ID"> (used on the artist page). */
  function cardHtml(a, o) {
    o = o || {};
    const ar = Market.artist(a.artistId) || { name: 'Unknown artist' };
    const inner = `<span class="card-img"><img src="${Market.imgOf(a)}" alt="${esc(a.title + ', ' + a.medium + ', by ' + ar.name)}" width="800" height="1000" loading="lazy">${a.status === 'sold' ? '<span class="badge">Sold</span>' : ''}</span>
      <span class="card-meta"><span class="card-title">${esc(a.title)}</span><span class="card-artist">${esc(ar.name)}, ${esc(a.year)}</span><span class="card-price">${priceLine(a)}</span></span>`;
    const open = o.asLink ? `<a class="card-open" href="index.html#work=${a.id}">${inner}</a>` : `<button class="card-open" type="button" data-id="${a.id}" aria-label="View ${esc(a.title)} by ${esc(ar.name)}">${inner}</button>`;
    const heart = o.asLink ? '' : `<button class="heart card-heart" type="button" data-heart="${a.id}" aria-pressed="${o.saved ? 'true' : 'false'}" aria-label="Save ${esc(a.title)}">${HEART}</button>`;
    return `<li class="card">${open}${heart}</li>`;
  }

  function bidsHtml(a, s) {
    const list = Market.bidsFor(a.id);
    if (!(a.bidding && a.bidding.enabled) && !list.length) return '';
    let h = '<h3>Bids</h3>';
    if (!list.length) return h + `<p class="muted">No bids yet. The opening bid is ${money(a.bidding.start)}.</p>`;
    h += `<p class="top-bid">Highest bid <strong>${money(list[0].amount)}</strong> <span class="muted">from ${list.length} bid${list.length > 1 ? 's' : ''}</span></p><ol class="bid-list">`;
    h += list.map((b, i) => `<li${i === 0 ? ' class="lead"' : ''}><span class="amt">${money(b.amount)}</span><span>${s && s.role === 'admin' ? esc(b.name) + ' (' + esc(b.email) + ')' : esc(U.shortName(b.name))}</span><time datetime="${new Date(b.at).toISOString()}">${U.date(b.at)}</time></li>`).join('');
    return h + '</ol>';
  }

  function marketHtml(a, s) {
    if (a.status === 'sold') return '<p class="notice">This work has been sold.</p>';
    if (!s) return '';
    if (s.role !== 'visitor') return `<p class="notice">You are signed in as ${s.role === 'admin' ? 'the admin' : 'an artist'}. Ordering and bidding are for visitors.</p>`;
    let h = `<div class="buy-box"><button type="button" class="btn primary" data-act="toggleOrder" aria-expanded="false" aria-controls="orderForm">Order this work for ${money(a.price)}</button>
      <form class="mini-form" id="orderForm" hidden novalidate>
        <p class="muted">Ordering as ${esc(s.name)} (${esc(s.email)}). The artist and gallery will confirm payment and delivery with you.</p>
        <div class="field"><label for="oPhone">Phone number</label><input id="oPhone" type="tel" autocomplete="tel" required></div>
        <div class="field"><label for="oAddr">Delivery address</label><textarea id="oAddr" autocomplete="street-address" required></textarea></div>
        <p class="error" id="oErr" role="alert"></p><button class="btn primary" type="submit">Confirm order</button></form></div>`;
    if (a.bidding && a.bidding.enabled) {
      const min = Market.minBid(a);
      h += `<form class="mini-form bid-form" id="bidForm" novalidate><div class="field"><label for="bAmt">Your bid, minimum ${money(min)}</label>
        <div class="inline"><input id="bAmt" type="number" inputmode="numeric" min="${min}" step="1" value="${min}" required><button class="btn" type="submit">Place bid</button></div></div>
        <p class="error" id="bErr" role="alert"></p></form>`;
    }
    return h;
  }

  function render(a, els, onChange) {
    const s = Market.session();
    els.market.innerHTML = marketHtml(a, s);
    els.bids.innerHTML = bidsHtml(a, s);
    const mk = els.market, $ = id => mk.querySelector(id);
    const tog = mk.querySelector('[data-act="toggleOrder"]');
    if (tog) tog.addEventListener('click', () => { const f = $('#orderForm'); f.hidden = !f.hidden; tog.setAttribute('aria-expanded', !f.hidden); if (!f.hidden) $('#oPhone').focus(); });
    const of = $('#orderForm');
    if (of) of.addEventListener('submit', async e => {
      e.preventDefault(); const er = $('#oErr'); er.textContent = '';
      const phone = $('#oPhone').value.trim(), address = $('#oAddr').value.trim();
      if (!/^[0-9+\-\s()]{7,}$/.test(phone)) { er.textContent = 'Please enter a valid phone number.'; return; }
      if (address.length < 10) { er.textContent = 'Please enter your full delivery address.'; return; }
      try { await Market.placeOrder(a.id, { phone, address }); U.toast('Order placed. Track it under "My orders".'); onChange(); }
      catch (x) { er.textContent = x.message; }
    });
    const bf = $('#bidForm');
    if (bf) bf.addEventListener('submit', async e => {
      e.preventDefault(); const er = $('#bErr'); er.textContent = '';
      try { await Market.placeBid(a.id, $('#bAmt').value); U.toast('Your bid has been placed.'); onChange(); }
      catch (x) { er.textContent = x.message; }
    });
  }
  return { cardHtml, render, priceLine, HEART };
})();
