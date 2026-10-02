/* Scene delle cutscene: pixel art disegnata via codice su un canvas 192x108, ingrandito a pixel netti.
   Ogni scena è una funzione (contesto, tempo in secondi, argomenti). */
(function (G) {
  const W = 192, H = 108;
  const C = {
    s0: '#050d16', s1: '#081724', s2: '#0c2133', s3: '#112d45', s4: '#183b59',
    far: '#0d2538', mid: '#091b2a', near: '#050f19', black: '#02060b',
    amber: '#ffb000', bone: '#e4ebec', steel: '#5d7482', steel2: '#3e5362',
    red: '#ee4f3a', blue: '#2473d6', water: '#123f85', water2: '#2473d6',
  };
  const NIGHT = [C.s0, C.s1, C.s2, C.s3, C.s4];
  const DAWN = ['#183b59', '#3d5f80', '#8c8f9c', '#d99a5b', '#ffb000'];

  // Posizione delle sei città sulla mappa, nell'ordine delle missioni.
  const CITY = [[58, 32], [98, 26], [156, 44], [126, 68], [50, 64], [96, 50]];
  const COAST = [[40, 20], [70, 11], [105, 15], [140, 9], [166, 26], [174, 52], [160, 78], [130, 93], [97, 88], [70, 97], [42, 86], [26, 60], [29, 38]];

  /* ---------- strumenti di disegno ---------- */
  function rnd(seed) { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
  function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function sky(c, cols) {
    const bh = Math.ceil(72 / cols.length);
    R(c, cols[cols.length - 1], 0, 0, W, H);
    cols.forEach((col, i) => R(c, col, 0, i * bh, W, bh));
  }
  function stars(c, seed, t, n, maxY) {
    const r = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W | 0, y = r() * maxY | 0, ph = r() * 6;
      if (Math.sin(t * 1.5 + ph) > -.6) R(c, C.bone, x, y, 1, 1);
    }
  }
  function disc(c, x, y, rad, col) {
    for (let dy = -rad; dy <= rad; dy++) {
      const w = Math.floor(Math.sqrt(rad * rad - dy * dy));
      R(c, col, x - w, y + dy, 2 * w + 1, 1);
    }
  }
  function skyline(c, seed, base, maxH, col, t, lit) {
    const r = rnd(seed);
    let x = -2;
    while (x < W) {
      const w = 7 + (r() * 10 | 0), h = 6 + (r() * maxH | 0);
      R(c, col, x, base - h, w, h);
      for (let wy = base - h + 2; wy < base - 2; wy += 4) {
        for (let wx = x + 1; wx < x + w - 1; wx += 3) {
          const on = r() < lit, ph = r() * 20, warm = r() < .8;
          if (on && Math.sin(t * .7 + ph) > -.85) R(c, warm ? C.amber : C.bone, wx, wy, 1, 2);
        }
      }
      x += w + (r() * 2 | 0);
    }
  }
  function mount(c, col, ax, ay, base, slope) {
    for (let y = ay; y < base; y++) { const hw = (y - ay) * slope; R(c, col, ax - hw, y, hw * 2 + 1, 1); }
    for (let y = ay; y < ay + 5; y++) { const hw = (y - ay) * slope; R(c, C.steel, ax - hw, y, hw * 2 + 1, 1); }
  }
  function grid(c, alpha) {
    const col = `rgba(140,200,230,${alpha})`;
    for (let x = 0; x < W; x += 12) R(c, col, x, 0, 1, H);
    for (let y = 0; y < H; y += 12) R(c, col, 0, y, W, 1);
  }

  // Sagoma di Calvera: calcolata una volta come elenco di tratti orizzontali per riga.
  const LAND = [];
  (function () {
    const inside = (x, y) => {
      let hit = false;
      for (let i = 0, j = COAST.length - 1; i < COAST.length; j = i++) {
        const [xi, yi] = COAST[i], [xj, yj] = COAST[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    for (let y = 0; y < H; y++) {
      const runs = []; let start = -1;
      for (let x = 0; x <= W; x++) {
        const on = x < W && inside(x + .5, y + .5);
        if (on && start < 0) start = x;
        if (!on && start >= 0) { runs.push([start, x - start]); start = -1; }
      }
      LAND.push(runs);
    }
  })();
  function land(c, col, dx, dy) { LAND.forEach((runs, y) => runs.forEach(([x, w]) => R(c, col, x + dx, y + dy, w, 1))); }

  /* ---------- scene ---------- */
  const S = {};

  // a.cur = indice della missione evidenziata, 'all' per tutte, -1 per nessuna.
  S.map = (c, t, a) => {
    R(c, C.s1, 0, 0, W, H);
    grid(c, .06);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => land(c, '#2b5a7a', dx, dy));
    land(c, C.s4, 0, 0);
    const step = Math.floor(t * 5);
    for (let i = 0; i < CITY.length - 1; i++) {
      const [x0, y0] = CITY[i], [x1, y1] = CITY[i + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      const done = typeof a.cur === 'number' && i < a.cur;
      for (let k = 0; k <= n; k++) {
        if ((k + (done ? step : 0)) % 3 === 0) R(c, done ? C.blue : 'rgba(228,235,236,.3)', x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 1, 1);
      }
    }
    CITY.forEach(([x, y], i) => {
      const cur = a.cur === i || a.cur === 'all', done = typeof a.cur === 'number' && i < a.cur;
      if (cur) {
        const pr = 3 + Math.floor((t * 7 + i * 2) % 6), ring = 'rgba(255,176,0,.55)';
        R(c, ring, x - pr, y - pr, pr * 2 + 1, 1); R(c, ring, x - pr, y + pr, pr * 2 + 1, 1);
        R(c, ring, x - pr, y - pr, 1, pr * 2 + 1); R(c, ring, x + pr, y - pr, 1, pr * 2 + 1);
      }
      R(c, C.s0, x - 2, y - 2, 5, 5);
      R(c, cur ? C.amber : done ? C.blue : C.steel, x - 1, y - 1, 3, 3);
    });
  };

  S.valdoria = (c, t) => {
    sky(c, NIGHT); stars(c, 11, t, 40, 48); disc(c, 162, 18, 7, C.bone);
    for (let x = 0; x < W; x++) { const y = 62 + Math.round(Math.sin(x / 23) * 5 + Math.sin(x / 9) * 2); R(c, C.far, x, y, 1, H - y); }
    // torre piezometrica
    R(c, C.steel2, 24, 40, 2, 34); R(c, C.steel2, 38, 40, 2, 34); R(c, C.steel2, 24, 54, 16, 1);
    R(c, C.steel, 20, 26, 24, 14); R(c, C.steel2, 20, 26, 24, 2); R(c, C.amber, 31, 32, 2, 2);
    // acquedotto ad archi con l'acqua che scorre in cima
    R(c, C.steel, 50, 50, W - 50, 5); R(c, C.water2, 50, 49, W - 50, 1);
    for (let x = 50; x < W; x++) if ((((x - Math.floor(t * 14)) % 7) + 7) % 7 === 0) R(c, C.bone, x, 49, 1, 1);
    for (let x = 58; x < W; x += 18) {
      R(c, C.steel, x, 55, 5, 30); R(c, C.steel2, x + 4, 55, 1, 30);
      R(c, C.steel, x + 5, 55, 3, 2); R(c, C.steel, x - 3, 55, 3, 2); R(c, C.steel, x + 5, 57, 1, 2); R(c, C.steel, x - 1, 57, 1, 2);
    }
    skyline(c, 3, H - 10, 16, C.mid, t, .4);
    R(c, C.near, 0, H - 10, W, 10);
  };

  S.sanbrivio = (c, t) => {
    sky(c, NIGHT); stars(c, 21, t, 36, 34); skyline(c, 5, 86, 24, C.far, t, .25);
    // ospedale
    R(c, C.s4, 52, 36, 88, 52); R(c, C.steel2, 52, 36, 88, 2);
    const r = rnd(77);
    for (let y = 42; y < 76; y += 6) for (let x = 56; x < 136; x += 6) {
      const on = r() < .7, ph = r() * 20;
      R(c, on && Math.sin(t * .6 + ph) > -.9 ? C.amber : C.s2, x, y, 3, 3);
    }
    R(c, C.bone, 86, 76, 20, 12); R(c, C.amber, 89, 79, 14, 9);
    // insegna sul tetto
    R(c, C.near, 85, 19, 22, 17);
    if (Math.sin(t * 2) > -.95) { R(c, C.amber, 90, 22, 3, 11); R(c, C.amber, 99, 22, 3, 11); R(c, C.amber, 90, 26, 12, 3); }
    if (Math.floor(t * 2) % 2) R(c, C.red, 136, 33, 2, 2);
    // strada e ambulanza
    R(c, C.near, 0, 88, W, 20);
    for (let x = 4; x < W; x += 14) R(c, C.steel2, x, 99, 6, 1);
    const ax = ((t * 20) % (W + 50)) - 30;
    R(c, C.bone, ax, 90, 18, 8); R(c, C.bone, ax + 18, 93, 6, 5); R(c, C.s2, ax + 19, 94, 4, 2);
    R(c, C.red, ax + 2, 94, 14, 1);
    R(c, C.black, ax + 3, 97, 4, 3); R(c, C.black, ax + 16, 97, 4, 3);
    R(c, Math.floor(t * 6) % 2 ? C.red : C.blue, ax + 8, 88, 3, 2);
  };

  S.altamare = (c, t) => {
    sky(c, NIGHT); stars(c, 31, t, 40, 50); disc(c, 36, 20, 8, C.bone);
    // mare
    R(c, C.water, 0, 70, W, 38);
    const r = rnd(9);
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = 71 + r() * 36, ph = r() * 6;
      if (Math.sin(t * 2 + ph) > .2) R(c, C.water2, (x + t * 3) % W, y, 3, 1);
    }
    for (let y = 72; y < 100; y += 3) R(c, 'rgba(228,235,236,.35)', 34 + Math.round(Math.sin(t * 2 + y) * 2), y, 5, 1);
    // banchina, serbatoi, torcia, gru
    R(c, C.near, 70, 66, W - 70, 8);
    [[96, 22], [124, 26], [156, 20]].forEach(([x, w]) => {
      R(c, C.steel, x, 44, w, 22); R(c, C.steel2, x + w - 4, 44, 4, 22); R(c, C.bone, x, 49, w, 1); R(c, C.steel, x + 2, 42, w - 4, 2);
    });
    const f = Math.floor(t * 10) % 3;
    R(c, C.steel2, 84, 30, 2, 36); R(c, C.amber, 83, 26 - f, 4, 4 + f); R(c, C.red, 84, 24 - f, 2, 2);
    R(c, C.steel2, 182, 28, 2, 38); R(c, C.steel2, 164, 28, 24, 2); R(c, C.steel2, 168, 30, 1, 10);
    // petroliera
    const sx = -50 + ((t * 5) % (W + 60));
    R(c, C.black, sx, 76, 46, 6); R(c, C.red, sx, 81, 46, 2); R(c, C.steel, sx + 34, 70, 8, 6); R(c, C.amber, sx + 36, 72, 2, 2); R(c, C.steel2, sx + 4, 74, 26, 2);
  };

  S.lumera = (c, t) => {
    sky(c, NIGHT); skyline(c, 8, 80, 44, C.far, t, .3); skyline(c, 9, 88, 26, C.mid, t, .45);
    // banca: gradinata, colonne, architrave e frontone
    const bx = 66;
    R(c, C.steel2, bx, 84, 60, 6); R(c, C.steel, bx + 2, 82, 56, 2);
    R(c, C.s2, bx + 4, 58, 52, 24);
    R(c, C.amber, bx + 26, 68, 8, 14);
    for (let i = 0; i < 6; i++) { R(c, C.bone, bx + 6 + i * 9, 58, 4, 24); R(c, C.steel, bx + 9 + i * 9, 58, 1, 24); }
    R(c, C.bone, bx + 2, 54, 56, 4);
    for (let i = 0; i < 7; i++) R(c, C.bone, bx + 2 + i * 4, 53 - i, 56 - i * 8, 1);
    R(c, C.near, 0, 90, W, 18);
    R(c, 'rgba(255,176,0,.25)', bx + 26, 91, 8, 6);
    // pioggia
    const r = rnd(4);
    for (let i = 0; i < 90; i++) R(c, 'rgba(180,210,230,.45)', (r() * W + t * 30) % W, (r() * H + t * 140) % H, 1, 3);
  };

  S.monteluce = (c, t) => {
    sky(c, NIGHT); stars(c, 51, t, 40, 40);
    mount(c, C.far, 150, 20, 86, 1.25); mount(c, C.far, 30, 30, 86, 1.1); mount(c, C.mid, 96, 38, 86, 1.4);
    // vapore
    [66, 106].forEach((x, n) => {
      for (let i = 0; i < 7; i++) {
        const ph = (t * .22 + i / 7 + n * .07) % 1, s = 4 + ph * 9;
        c.globalAlpha = (1 - ph) * .55;
        R(c, C.bone, x + Math.sin(ph * 5 + i) * 4 + ph * 12 - s / 2, 42 - ph * 36 - s / 2, s, s * .7);
      }
      c.globalAlpha = 1;
    });
    // torri di raffreddamento
    [66, 106].forEach(x => {
      for (let y = 42; y < 88; y++) { const k = (y - 54) / 34, hw = Math.round(9 + k * k * 10); R(c, C.steel, x - hw, y, hw * 2, 1); R(c, C.steel2, x + hw - 3, y, 3, 1); }
      if (Math.floor(t * 2) % 2) R(c, C.red, x - 1, 40, 2, 2);
    });
    // tralicci e cavi
    [140, 172].forEach(x => { R(c, C.steel2, x, 56, 1, 32); R(c, C.steel2, x - 4, 58, 9, 1); R(c, C.steel2, x - 3, 63, 7, 1); R(c, C.steel2, x - 2, 78, 1, 10); R(c, C.steel2, x + 2, 78, 1, 10); });
    for (let x = 116; x <= 172; x++) { const m = x < 140 ? 128 : 156, half = x < 140 ? 12 : 16; R(c, C.steel2, x, 58 + Math.round(3 * (1 - ((x - m) / half) ** 2)), 1, 1); }
    R(c, C.near, 0, 88, W, 20);
    R(c, C.amber, 84, 84, 4, 4);
  };

  // a.k = quanto della luna è coperto (0-1), a.dawn = alba, a.dark = la città si spegne.
  S.rocca = (c, t, a) => {
    sky(c, a.dawn ? DAWN : NIGHT);
    if (a.dawn) disc(c, 96, 74, 13, '#ffd27a');
    else {
      stars(c, 61, t, 50, 52);
      const k = a.k1 != null ? a.k + (a.k1 - a.k) * Math.min(1, t / 9) : a.k == null ? 1 : a.k;   // k1: l'ombra avanza durante l'inquadratura
      if (k >= .98) disc(c, 150, 24, 13, C.amber);
      disc(c, 150, 24, 11, C.bone);
      if (k > 0) disc(c, 150 + (1 - k) * 22, 24 - (1 - k) * 5, 11, C.black);
    }
    const lit = a.dark ? Math.max(0, .4 - t * .09) : a.dawn ? .1 : .4;
    skyline(c, 12, 86, 26, a.dawn ? '#27496a' : C.far, t, lit * .7);
    R(c, a.dawn ? '#27496a' : C.far, 0, 86, W, H - 86);
    for (let dy = 0; dy < 16; dy++) R(c, a.dawn ? '#16324a' : C.mid, 96 - 26 - dy * 3, 72 + dy, (26 + dy * 3) * 2, 1);
    // palazzo del governo con cupola
    R(c, C.steel, 72, 58, 48, 14);
    for (let i = 0; i < 8; i++) R(c, C.bone, 74 + i * 6, 60, 2, 12);
    R(c, C.steel2, 70, 56, 52, 2);
    for (let dy = -10; dy <= 0; dy++) { const w = Math.floor(Math.sqrt(100 - dy * dy)); R(c, C.steel, 96 - w, 56 + dy, 2 * w, 1); R(c, C.bone, 96 - w, 56 + dy, 2, 1); }
    R(c, C.bone, 96, 39, 1, 7); R(c, C.red, 97, 39 + (Math.floor(t * 3) % 2), 4, 2);
    if (lit > .02) R(c, C.amber, 94, 66, 4, 6);
    skyline(c, 13, H - 8, 14, a.dawn ? '#0d2538' : C.near, t, lit);
    R(c, a.dawn ? '#0d2538' : C.near, 0, H - 8, W, 8);
  };

  // Primo piano della luna: il cerchio nero avanza da a.from a a.k.
  S.eclipse = (c, t, a) => {
    R(c, C.s0, 0, 0, W, H); stars(c, 71, t, 70, H);
    const k = a.from + (a.k - a.from) * Math.min(1, t / 2.5);
    if (k >= .98) disc(c, 96, 52, 33, C.amber);
    disc(c, 96, 52, 30, C.bone);
    [[84, 42, 4], [104, 60, 5], [92, 66, 3], [110, 40, 3]].forEach(([x, y, r]) => disc(c, x, y, r, '#b4c4ca'));
    if (k > 0) disc(c, 96 + (1 - k) * 60, 52 - (1 - k) * 12, 30, C.black);
  };

  // Disegna un emblema 16x16. Con t l'emblema compare riga per riga e ogni tanto una riga scatta di lato.
  function emblem(c, key, ox, oy, px, t) {
    const E = G.EMBLEMS[key], live = t != null, shown = live ? Math.min(16, Math.floor(t * 12)) : 16, g = live ? Math.floor(t * 8) : 0;
    for (let y = 0; y < shown; y++) {
      const sh = live && (g * 7 + y * 13) % 31 === 0 ? ((g + y) % 2 ? px : -px) : 0;
      for (let x = 0; x < 16; x++) {
        const ch = E.rows[y][x];
        if (ch === '.') continue;
        const col = ch === '#' ? E.main : ch === 'o' ? '#0b0406' : (live && Math.sin(t * 4) > .7 ? '#ffe08a' : E.accent);
        R(c, col, ox + x * px + sh, oy + y * px, px, px);
      }
    }
  }
  G.drawEmblem = (c, key) => emblem(c, key, 0, 0, 1, null);

  S.black = c => R(c, '#000', 0, 0, W, H);

  // Scheda dell'avversario: a.emblem = chiave in EMBLEMS.
  S.dossier = (c, t, a) => {
    R(c, '#04090f', 0, 0, W, H); grid(c, .05);
    const px = 4, ox = (W - 64) / 2, oy = 14, g = Math.floor(t * 8);
    for (let i = 0; i < 48; i += 2) {            // anello di tacche che ruota
      const ang = i / 48 * Math.PI * 2 + t * .3;
      R(c, i % 12 === 0 ? C.amber : C.steel2, 96 + Math.cos(ang) * 46 - 1, 46 + Math.sin(ang) * 46 - 1, 2, 2);
    }
    emblem(c, a.emblem, ox, oy, px, t);
    if (t * 12 < 16) R(c, C.amber, ox - 6, oy + Math.floor(t * 12) * px, 76, 1);
    R(c, 'rgba(228,235,236,.1)', 0, (t * 30) % H, W, 2);
    [[ox - 10, oy - 8, 1, 1], [ox + 73, oy - 8, -1, 1], [ox - 10, oy + 71, 1, -1], [ox + 73, oy + 71, -1, -1]].forEach(([x, y, sx, sy]) => {
      R(c, C.amber, sx > 0 ? x : x - 7, y, 8, 1); R(c, C.amber, x, sy > 0 ? y : y - 7, 1, 8);
    });
    for (let i = 0; i < 24; i++) { const h = 2 + ((i * 7 + g) % 5); R(c, C.steel2, 37 + i * 5, 102 - h, 3, h); }
  };

  /* ---------- schema di rete per le simulazioni delle tecniche ---------- */
  // Caratteri 3x5 per le etichette.
  const FONT = {
    A: '.#.#.#####.##.#', B: '##.#.###.#.###.', C: '.###..#..#...##', D: '##.#.##.##.###.', E: '####..##.#..###', F: '####..##.#..#..',
    I: '###.#..#..#.###', N: '##.#.##.##.##.#', O: '####.##.##.####', R: '##.#.###.#.##.#', S: '.###...#...###.', T: '###.#..#..#..#.',
    U: '#.##.##.##.####', V: '#.##.##.##.#.#.', W: '#.##.########.#', 2: '##...#.#.#..###',
  };
  function label(c, str, cx, y, col) {
    let x = Math.round(cx - (str.length * 4 - 1) / 2);
    for (const ch of str) {
      const g = FONT[ch];
      if (g) for (let i = 0; i < 15; i++) if (g[i] === '#') R(c, col, x + i % 3, y + (i / 3 | 0), 1, 1);
      x += 4;
    }
  }
  const NODES = {
    atk: [24, 52, 'skull', 'ATTACCANTE'], c2: [24, 16, 'antenna', 'C2'], sup: [24, 88, 'crate', 'FORNITORE'],
    web: [88, 20, 'globe', 'WEB'], user: [104, 68, 'person', 'UTENTE'], srv: [152, 34, 'gear', 'SERVER'], data: [166, 82, 'disk', 'DATI'],
  };
  // a.from, a.to = percorso del pacchetto; a.hit = nodi compromessi; a.mark = nodo compromesso all'arrivo; a.block = una difesa lo ferma.
  S.net = (c, t, a) => {
    R(c, '#04090f', 0, 0, W, H); grid(c, .04);
    // la rete dell'organizzazione
    R(c, 'rgba(36,115,214,.09)', 64, 5, 124, 98);
    for (let x = 64; x < 188; x += 4) { R(c, C.steel2, x, 5, 2, 1); R(c, C.steel2, x, 102, 2, 1); }
    for (let y = 5; y < 103; y += 4) { R(c, C.steel2, 64, y, 1, 2); R(c, C.steel2, 187, y, 1, 2); }
    const cyc = t % 2.4, ph = Math.min(1, cyc / 1.5), arrived = cyc >= 1.5;
    const [x0, y0] = NODES[a.from], [x1, y1] = NODES[a.to];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let k = 0; k <= n; k += 3) R(c, 'rgba(228,235,236,.28)', x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, 1, 1);
    // nodi
    Object.entries(NODES).forEach(([key, [x, y, ico, name]]) => {
      const bad = key === 'atk' || key === 'c2';
      const hit = (a.hit || []).includes(key) || (!a.block && arrived && a.mark === key);
      const flash = hit && Math.floor(t * 4) % 2;
      R(c, hit ? C.red : bad ? C.red : C.steel, x - 8, y - 8, 17, 17);
      R(c, hit ? (flash ? '#5a1a12' : '#3a120d') : bad ? '#1c0c0b' : C.s3, x - 7, y - 7, 15, 15);
      G.ICONS[ico].forEach((row, j) => { for (let i = 0; i < 8; i++) if (row[i] === '#') R(c, hit || bad ? C.red : C.bone, x - 4 + i, y - 4 + j, 1, 1); });
      label(c, name, x, y + 11, hit ? C.red : bad ? C.red : C.steel);
    });
    // pacchetto in viaggio, ed eventuale difesa che lo ferma
    const stop = a.block ? .62 : 1, q = Math.min(ph, stop);
    const px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q;
    if (a.block) {
      const sx = Math.round(x0 + (x1 - x0) * .74), sy = Math.round(y0 + (y1 - y0) * .74);
      R(c, C.bone, sx - 6, sy - 6, 13, 13); R(c, C.blue, sx - 5, sy - 5, 11, 11);
      G.ICONS.shield.forEach((row, j) => { for (let i = 0; i < 8; i++) if (row[i] === '#') R(c, C.bone, sx - 4 + i, sy - 4 + j, 1, 1); });
    }
    if (a.block && ph >= stop) {
      const k = Math.min(1, (cyc - 1.5 * stop) / .6);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => R(c, C.red, px + dx * k * 7, py + dy * k * 7, 2, 2));
    } else if (!arrived) {
      for (let i = 1; i <= 2; i++) { const qq = Math.max(0, q - i * .07); R(c, 'rgba(238,79,58,.45)', x0 + (x1 - x0) * qq - 1, y0 + (y1 - y0) * qq - 1, 3, 3); }
      R(c, C.bone, px - 3, py - 3, 7, 7); R(c, C.red, px - 2, py - 2, 5, 5);
    }
  };

  G.scenes = S;
  G.CITY = CITY;
})(window.SLC);
