/* Elementi dell'interfaccia riusati da game.js: carte con la loro illustrazione, animazioni, finestra modale. */
(function (G) {
  const $ = id => document.getElementById(id);
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = ms => new Promise(r => setTimeout(r, calm ? Math.min(ms, 100) : ms));
  const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
  const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  /* ---------- illustrazioni delle carte ---------- */
  // Raddoppia un'icona 8x8 a 16x16 smussando le diagonali (algoritmo Scale2x).
  function scale2x(rows) {
    const g = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8 && rows[y][x] === '#';
    const out = Array.from({ length: 16 }, () => Array(16).fill(false));
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const P = g(x, y), A = g(x, y - 1), B = g(x + 1, y), C = g(x - 1, y), D = g(x, y + 1);
      out[2 * y][2 * x] = C === A && C !== D && A !== B ? A : P;
      out[2 * y][2 * x + 1] = A === B && A !== C && B !== D ? B : P;
      out[2 * y + 1][2 * x] = D === C && D !== B && C !== A ? C : P;
      out[2 * y + 1][2 * x + 1] = B === D && B !== A && D !== C ? D : P;
    }
    return out;
  }
  const TONES = {
    blue: { bg: ['#0e2f66', '#154a94', '#1c5fba'], line: 'rgba(160,210,255,.16)', base: '#e4ebec', hi: '#ffffff', lo: '#8fa9bd', out: '#081220' },
    red: { bg: ['#1a0807', '#2a0e0b', '#3b140f'], line: 'rgba(255,120,90,.13)', base: '#ee4f3a', hi: '#ffa184', lo: '#a82c1c', out: '#0d0302' },
  };
  // Disegna l'illustrazione di una carta: sfondo a tema, poi l'icona con ombra, contorno, luci e ombre.
  function drawArt(cv, iconKey, tone, seed) {
    const W = 32, H = 24, T = TONES[tone], c = cv.getContext('2d');
    cv.width = W; cv.height = H;
    const px = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w || 1, h || 1); };
    let s = 7;
    for (const ch of seed) s = (Math.imul(s, 31) + ch.charCodeAt(0)) >>> 0;
    const r = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);

    T.bg.forEach((col, i) => px(col, 0, i * 8, W, 8));
    if (tone === 'blue') {
      for (let x = 3; x < W; x += 6) px(T.line, x, 0, 1, H);
      for (let y = 3; y < H; y += 6) px(T.line, 0, y, W, 1);
    } else {
      for (let i = -H; i < W; i += 6) for (let y = 0; y < H; y++) px(T.line, i + y, y, 2, 1);
      for (let i = 0; i < 3; i++) px('rgba(255,120,90,.28)', r() * W | 0, r() * H | 0, 3 + (r() * 8 | 0), 1);
    }
    for (let i = 0; i < 4; i++) px('#ffb000', r() * W | 0, r() * H | 0);

    const g = scale2x(G.ICONS[iconKey]), ox = 8, oy = 4;
    const at = (x, y) => x >= 0 && y >= 0 && x < 16 && y < 16 && g[y][x];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (at(x, y)) px('rgba(0,0,0,.45)', ox + x + 2, oy + y + 2);
    for (let y = -1; y <= 16; y++) for (let x = -1; x <= 16; x++) {
      if (!at(x, y) && (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1))) px(T.out, ox + x, oy + y);
    }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (at(x, y)) px(!at(x, y - 1) || !at(x - 1, y) ? T.hi : !at(x, y + 1) || !at(x + 1, y) ? T.lo : T.base, ox + x, oy + y);
    }
  }
  // Dorso delle carte dell'attaccante: losanghe e un'eclissi al centro.
  function drawBack(cv) {
    const W = 30, H = 40, c = cv.getContext('2d');
    cv.width = W; cv.height = H;
    const px = (col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w || 1, h || 1); };
    const disc = (cx0, cy0, rad, col) => { for (let dy = -rad; dy <= rad; dy++) { const w = Math.floor(Math.sqrt(rad * rad - dy * dy)); px(col, cx0 - w, cy0 + dy, 2 * w + 1, 1); } };
    px('#a82c1c', 0, 0, W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) % 6 === 0 || (x - y + 60) % 6 === 0) px('#ee4f3a', x, y);
    px('#ffb000', 2, 2, W - 4, 1); px('#ffb000', 2, H - 3, W - 4, 1); px('#ffb000', 2, 2, 1, H - 4); px('#ffb000', W - 3, 2, 1, H - 4);
    disc(15, 20, 10, '#a82c1c'); disc(15, 20, 8, '#ffb000'); disc(15, 20, 7, '#02060b'); disc(12, 18, 1, '#3b140f');
  }

  // Una carta del mazzo è { id, d: definizione, ed: edizione o null, bonus: punti da potenziamento }.
  const costOf = c => Math.max(0, c.d.c - (c.ed === 'cert' ? 1 : 0));
  const ptsOf = c => c.d.p + c.bonus + (c.ed === 'foil' ? 20 : 0);
  function describe(c, free) {
    const ed = c.ed ? ` Edizione ${G.EDITIONS[c.ed].n}: ${G.EDITIONS[c.ed].e}.` : '';
    const stops = c.d.x.map(k => `${G.T[k].n} (fase ${G.T[k].p + 1})`).join(', ');
    return `<strong>${c.d.n}</strong> · costa ${free ? 0 : costOf(c)}, vale ${ptsOf(c)}.${ed} ${c.d.d} Ferma: ${stops}.`;
  }

  function paintBlue(s) {
    const c = s._c, cost = s._free ? 0 : costOf(c);
    s.setAttribute('aria-label', `${c.d.n}, costo ${cost}, ${ptsOf(c)} punti, fasi ${s._ph.map(p => p + 1).join(' e ')}`);
    s.innerHTML = `<span class="card${c.ed ? ' ed-' + c.ed : ''}">
      <span class="band"><span class="cost${s._free ? ' free' : ''}">${cost}</span><span class="pts${c.bonus ? ' up' : ''}">+${ptsOf(c)}</span></span>
      <span class="art"><canvas></canvas>${c.ed ? `<span class="edtag">${G.EDITIONS[c.ed].n}</span>` : ''}</span>
      <span class="name">${c.d.n}</span>
      <span class="pips">${G.PHASES.map((_, i) => `<i class="${s._ph.includes(i) ? 'on' : ''}"></i>`).join('')}</span>
      ${c.ed ? '<span class="edfx"></span>' : ''}</span>`;
    drawArt(s.querySelector('canvas'), c.d.i, 'blue', c.d.k);
  }
  function blueEl(c) {
    const s = document.createElement('button');
    s.type = 'button'; s.className = 'slot blue';
    s._c = c; s._at = null; s._free = false; s._paid = 0;
    s._ph = [...new Set(c.d.x.map(k => G.T[k].p))];
    paintBlue(s);
    s.addEventListener('pointermove', e => {
      const r = s.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      s.style.setProperty('--mx', (100 - px * 100) + '%'); s.style.setProperty('--my', (100 - py * 100) + '%');
      if (calm) return;
      s.style.setProperty('--rx', ((.5 - py) * 18) + 'deg'); s.style.setProperty('--ry', ((px - .5) * 20) + 'deg');
    });
    s.addEventListener('pointerleave', () => { s.style.removeProperty('--rx'); s.style.removeProperty('--ry'); });
    return s;
  }

  // Carta dell'attaccante, coperta: la faccia resta vuota finché paintRed non la scrive,
  // così nome e codice della tecnica non si trovano nella pagina prima del tempo.
  function redEl(p) {
    const s = document.createElement('button');
    s.type = 'button'; s.className = 'slot red down';
    s.setAttribute('aria-label', `Fase ${p + 1}: carta coperta dell'attaccante`);
    s.innerHTML = `<span class="flip">
      <span class="card back"><canvas></canvas></span>
      <span class="card front"></span></span>`;
    drawBack(s.querySelector('.back canvas'));
    return s;
  }
  function paintRed(s, t) {
    const f = s.querySelector('.front');
    f.innerHTML = `<span class="band"><span>ATT&amp;CK</span></span>
        <span class="art"><canvas></canvas></span>
        <span class="tidline">${t.id}</span>
        <span class="name">${t.n}</span>`;
    drawArt(f.querySelector('canvas'), t.i, 'red', t.k);
  }

  function jokerEl(j, owned) {
    const d = document.createElement('div');
    d.className = 'joker' + (j.debt ? ' debt' : ''); d.tabIndex = 0;
    if (owned) d.id = 'jk-' + j.k;
    d.innerHTML = `<em>${j.debt ? 'DEBITO' : 'JOKER'}</em><strong>${j.n}</strong><span>${j.e}</span>`;
    return d;
  }

  // Sposta un elemento nel DOM e lo anima dalla posizione di partenza a quella nuova.
  function fly(s, move) {
    const a = s.getBoundingClientRect();
    s.style.transition = 'none';
    move();
    const b = s.getBoundingClientRect();
    s.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    void s.offsetWidth;
    s.style.transition = calm ? 'none' : 'transform .35s cubic-bezier(.2,.9,.3,1.2)';
    s.style.transform = '';
    setTimeout(() => { s.style.transition = ''; }, 400);
  }
  function fan(hand) {
    const slots = [...hand.children], mid = (slots.length - 1) / 2;
    slots.forEach((s, i) => {
      s.style.setProperty('--r', ((i - mid) * 2.6) + 'deg');
      s.style.setProperty('--arc', ((i - mid) ** 2 * 2) + 'px');
      s.style.setProperty('--d', (-i * .45) + 's');
    });
  }
  function pop(slot, text) {
    const p = document.createElement('span'); p.className = 'pop'; p.textContent = text;
    slot.appendChild(p); setTimeout(() => p.remove(), 1100);
  }
  function countTo(el, to, ms) {
    return new Promise(res => {
      if (calm || !ms) { el.textContent = to; return res(); }
      const from = parseInt(el.textContent, 10) || 0, t0 = performance.now();
      let done = false;
      const finish = () => { if (!done) { done = true; el.textContent = to; res(); } };
      const stepFn = t => {
        if (done) return;
        const k = Math.min(1, (t - t0) / ms);
        el.textContent = Math.round(from + (to - from) * k);
        if (k < 1) requestAnimationFrame(stepFn); else finish();
      };
      requestAnimationFrame(stepFn);
      // Se la scheda è in secondo piano requestAnimationFrame si ferma: il timer chiude comunque il conteggio.
      setTimeout(finish, ms + 300);
    });
  }

  // Finestra modale. o.dismiss = true: si chiude anche con Esc. Il focus resta dentro e torna dov'era alla chiusura.
  let modalBack = null, modalDismiss = false;
  function modal(html, actions, o) {
    const sheet = $('sheet');
    if ($('modal').hidden) modalBack = document.activeElement;
    modalDismiss = !!(o && o.dismiss);
    sheet.innerHTML = html + '<div class="sheetbtns"></div>';
    const bar = sheet.querySelector('.sheetbtns');
    (actions || []).forEach(a => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn' + (a.primary ? ' primary' : ''); b.textContent = a.label;
      b.addEventListener('click', a.fn);
      bar.appendChild(b);
    });
    $('modal').hidden = false;
    sheet.scrollTop = 0;
    const first = bar.querySelector('.primary') || bar.querySelector('button');
    if (first) first.focus();
    return sheet;
  }
  function closeModal() {
    if ($('modal').hidden) return;
    $('modal').hidden = true;
    if (modalBack && document.contains(modalBack) && typeof modalBack.focus === 'function') modalBack.focus();
    modalBack = null;
  }
  document.addEventListener('keydown', e => {
    if ($('modal').hidden) return;
    if (e.key === 'Escape' && modalDismiss) { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const f = [...$('sheet').querySelectorAll('button:not(:disabled), [tabindex="0"]')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!$('sheet').contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  });

  G.ui = { $, calm, sleep, shuffle, retrigger, costOf, ptsOf, describe, paintBlue, paintRed, blueEl, redEl, jokerEl, fly, fan, pop, countTo, modal, closeModal };
})(window.SLC);
