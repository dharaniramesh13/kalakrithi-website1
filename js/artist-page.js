/* Public artist profile: bio, follow, email, and their works. */
(async function () {
  const { $, esc } = U;
  await Market.init();
  if (!Nav.init()) return;
  const id = new URLSearchParams(location.search).get('id'), root = $('#profile');
  let ar = Market.artist(id);
  if (!ar) { root.innerHTML = '<p>We could not find that artist. <a href="index.html#artists">See all artists</a>.</p>'; return; }
  const s = Market.session();

  function render() {
    ar = Market.artist(id);
    document.title = ar.name + ' | ' + CONFIG.fullName;
    const works = Market.artworks().filter(a => a.artistId === id), n = Market.followers(id).length, following = Market.isFollowing(id);
    let follow = '';
    if (s.role === 'visitor') follow = `<button class="btn ${following ? '' : 'primary'}" id="followBtn" type="button" aria-pressed="${following}">${following ? 'Following' : 'Follow'}</button>`;
    else follow = `<span class="muted small">Only visitors can follow artists.</span>`;
    root.innerHTML = `<header class="profile-head"><img src="${Market.photoOf(ar)}" alt="Portrait of ${esc(ar.name)}" width="200" height="200">
      <div><h1>${esc(ar.name)}</h1><p class="muted">${esc(ar.city || 'India')} &middot; ${works.length} work${works.length === 1 ? '' : 's'} &middot; <span id="fCount">${n} follower${n === 1 ? '' : 's'}</span></p>
      <p class="bio">${esc(ar.bio || 'This artist has not written a bio yet.')}</p>
      <div class="profile-actions">${follow}<a class="btn" href="mailto:${esc(ar.email)}?subject=${encodeURIComponent('Enquiry from ' + CONFIG.name)}">Email ${esc(ar.name.split(' ')[0])}</a></div></div></header>
      <div class="section-head"><h2>Works by ${esc(ar.name)}</h2></div>
      <ul class="grid">${works.map(a => MarketUI.cardHtml(a, { asLink: true })).join('') || '<li class="muted">No works uploaded yet.</li>'}</ul>`;
    const fb = $('#followBtn');
    if (fb) fb.addEventListener('click', async () => {
      try { const on = await Market.toggleFollow(id); render(); U.toast(on ? 'You now follow ' + ar.name + '.' : 'You unfollowed ' + ar.name + '.'); $('#followBtn').focus(); }
      catch (e) { U.toast(e.message); }
    });
  }
  render();
})();
