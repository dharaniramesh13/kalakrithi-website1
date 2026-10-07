/* Generates abstract placeholder artwork and initials avatars as SVG data URLs. */
window.Placeholder = (function () {
  const palettes = [
    ['#e8e1d0', '#2c3a8f', '#c4572f', '#e0b04a'], ['#16213e', '#e94560', '#f5c542', '#8fc1d4'],
    ['#efe9dd', '#2f6f5e', '#d98a3d', '#1f2a44'], ['#f2d7c9', '#7a2e4a', '#2b4c7e', '#f3b562'],
    ['#dfe7e4', '#1d3b53', '#c8553d', '#a7c4a0'], ['#101820', '#f2aa4c', '#e8e2d0', '#5a7d9a']
  ];
  const rng = seed => { let s = (seed >>> 0) || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
  const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  function art(seed, w, h) {
    w = w || 800; h = h || 1000; seed = Number(seed) || 1;
    const r = rng(seed * 7919 + 13), p = palettes[seed % palettes.length];
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${p[0]}"/>`;
    for (let i = 0; i < 7; i++) {
      const c = p[1 + Math.floor(r() * 3)], o = (0.35 + r() * 0.55).toFixed(2), t = r();
      const x = r() * w, y = r() * h, z = 80 + r() * 300;
      if (t < 0.4) s += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(z / 1.6).toFixed(0)}" fill="${c}" opacity="${o}"/>`;
      else if (t < 0.75) s += `<rect x="${(x - z / 2).toFixed(0)}" y="${(y - z / 2).toFixed(0)}" width="${z.toFixed(0)}" height="${(z * (0.5 + r())).toFixed(0)}" fill="${c}" opacity="${o}" transform="rotate(${(r() * 50 - 25).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
      else s += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${(r() * 300 - 150).toFixed(0)} ${(r() * 300 - 150).toFixed(0)} ${(r() * 400 - 200).toFixed(0)} ${(r() * 400 - 200).toFixed(0)}" stroke="${c}" stroke-width="${(8 + r() * 26).toFixed(0)}" fill="none" stroke-linecap="round" opacity="${o}"/>`;
    }
    return uri(s + '</svg>');
  }
  function avatar(name) {
    const ini = String(name || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
    const p = palettes[(ini.charCodeAt(0) || 0) % palettes.length];
    return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${p[1]}"/><circle cx="150" cy="40" r="70" fill="${p[2]}" opacity=".55"/><text x="100" y="124" text-anchor="middle" font-family="Georgia,serif" font-size="78" fill="#fff">${ini}</text></svg>`);
  }
  return { art, avatar };
})();
