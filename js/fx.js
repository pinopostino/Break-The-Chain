/* Effetti a particelle: quadratini che schizzano da un punto dello schermo, e coriandoli dall'alto.
   Disegnati su un canvas a tutto schermo che non intercetta i clic. */
(function (G) {
  const cv = document.getElementById('fx'), cx = cv.getContext('2d');
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let parts = [], raf = 0, last = 0;

  function size() { cv.width = window.innerWidth; cv.height = window.innerHeight; }
  size(); window.addEventListener('resize', size);

  function loop(ms) {
    const dt = Math.min(.05, (ms - last) / 1000); last = ms;
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 20);
    for (const p of parts) {
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      cx.globalAlpha = Math.min(1, p.life * 3);
      cx.fillStyle = p.col;
      cx.fillRect(Math.round(p.x / 2) * 2, Math.round(p.y / 2) * 2, p.s, p.s);
    }
    cx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  // target = un elemento (si usa il suo centro) oppure [x, y]. Opzioni: colors, n, speed, gravity, up.
  function burst(target, o) {
    if (calm) return;
    o = o || {};
    let x, y;
    if (target instanceof Element) { const r = target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    else [x, y] = target;
    const cols = o.colors || ['#ffb000'], n = o.n || 12;
    for (let i = 0; i < n; i++) {
      const a = o.up ? -Math.PI / 2 + (Math.random() - .5) * 1.7 : Math.random() * Math.PI * 2;
      const v = (o.speed || 230) * (.4 + Math.random() * .8);
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.gravity == null ? 520 : o.gravity, life: .45 + Math.random() * .5, col: cols[i % cols.length], s: Math.random() < .5 ? 4 : 6 });
    }
    start();
  }
  function confetti() {
    if (calm) return;
    const cols = ['#ffb000', '#2473d6', '#e4ebec', '#ee4f3a'];
    for (let i = 0; i < 90; i++) {
      parts.push({ x: Math.random() * cv.width, y: -10 - Math.random() * 120, vx: (Math.random() - .5) * 120, vy: 120 + Math.random() * 260, g: 220, life: 1.8 + Math.random() * 1.2, col: cols[i % cols.length], s: Math.random() < .5 ? 4 : 6 });
    }
    start();
  }

  G.fx = { burst, confetti };
})(window.SLC);
