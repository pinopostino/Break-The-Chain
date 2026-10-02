/* Riproduce cutscene e simulazioni: una sequenza di inquadrature.
   Un'inquadratura mostra una scena animata sul canvas (scene), un cartello a tutto schermo (card)
   o una finta finestra che si riempie riga per riga (win).

   In modalità cinema (opts.cine) la sequenza scorre da sola: bande nere, dissolvenze, camera che si muove,
   righe di testo che entrano una dopo l'altra. Un clic accelera, Esc o "Salta" chiudono.
   Senza modalità cinema (le simulazioni) si avanza solo con il clic. */
(function (G) {
  const U = G.ui, A = G.audio, $ = U.$;
  const W = 192, H = 108;
  const box = $('cut'), stage = $('cutStage'), cv = $('cutCv'), cx = cv.getContext('2d');
  const card = $('cutCard'), cardBig = $('cardBig'), cardSub = $('cardSub');
  const win = $('simWin'), winTitle = $('simTitle'), winBody = $('simBody');
  const cap = $('cutCap'), place = $('cutPlace'), text = $('cutText'), hint = $('cutHint'), skip = $('cutSkip'), titleBox = $('cutTitle');
  cv.width = W; cv.height = H;
  const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
  const bx = buf.getContext('2d');

  let shots = null, idx = 0, cur = null, cine = false, done = null;
  let t0 = 0, tAll = 0, raf = 0, leaving = 0;
  let lines = [], li = 0, curSpan = null, typing = null, lineTimer = null;

  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const ease = p => p * p * (3 - 2 * p);

  /* ---------- scene sul canvas ---------- */
  function render(ms) {
    const t = (ms - t0) / 1000, c = cur.cam;
    G.scenes[cur.scene || 'black'](bx, t, cur.args || {});
    cx.imageSmoothingEnabled = false;
    if (c) {      // camera: zoom e carrellata lenti, da (x0, y0, z0) a (x1, y1, z1)
      const p = ease(Math.min(1, t / (c.dur || 10)));
      const z = lerp(c.z0 || 1, c.z1 || c.z0 || 1, p), vw = W / z, vh = H / z;
      const x0 = c.x0 == null ? W / 2 : c.x0, y0 = c.y0 == null ? H / 2 : c.y0;
      const mx = lerp(x0, c.x1 == null ? x0 : c.x1, p), my = lerp(y0, c.y1 == null ? y0 : c.y1, p);
      cx.drawImage(buf, clamp(mx - vw / 2, 0, W - vw), clamp(my - vh / 2, 0, H - vh), vw, vh, 0, 0, W, H);
    } else cx.drawImage(buf, 0, 0);

    if (cur.glitch && t > 2.5) {   // disturbo: l'attacco che si avvicina
      const g = Math.floor(t * 12);
      if (g % 28 < 2) {
        for (let i = 0; i < 4; i++) {
          const y = (g * 37 + i * 53) % H, h = 3 + ((g + i * 7) % 6);
          cx.drawImage(cv, 0, y, W, h, (g + i) % 2 ? 5 : -5, y, W, h);
        }
        cx.fillStyle = 'rgba(238,79,58,.14)'; cx.fillRect(0, 0, W, H);
      }
    }
    if (cine) {
      const bar = Math.round(Math.min(9, (ms - tAll) / 1000 * 14));
      cx.fillStyle = '#000'; cx.fillRect(0, 0, W, bar); cx.fillRect(0, H - bar, W, bar);
      let a = Math.max(0, 1 - t / .8);
      if (leaving) a = Math.max(a, Math.min(1, (ms - leaving) / 320));
      if (a > 0) { cx.fillStyle = `rgba(0,0,0,${a})`; cx.fillRect(0, 0, W, H); }
    }
  }
  function frame(ms) {
    if (!cur || cur.win) return;
    render(ms);
    raf = requestAnimationFrame(frame);
  }
  function startLoop() {
    cancelAnimationFrame(raf);
    t0 = performance.now();
    render(t0 + (U.calm ? 1000 : 0));
    if (!U.calm) raf = requestAnimationFrame(frame);
  }

  /* ---------- finestre delle simulazioni ---------- */
  let queue = [], rowTimer = null, fin = [];
  const rowsBusy = () => rowTimer !== null || queue.length > 0;
  function addRow([type, str, extra], instant) {
    const d = document.createElement('div');
    d.className = 'srow s-' + type;
    if (type === 'kv') {
      const cut = str.indexOf('|'), b = document.createElement('b');
      b.textContent = str.slice(0, cut);
      d.appendChild(b); d.appendChild(document.createTextNode(str.slice(cut + 1)));
    } else d.textContent = str;
    winBody.appendChild(d);
    winBody.scrollTop = winBody.scrollHeight;
    const swap = () => { d.textContent = extra; d.classList.add('swapped'); };
    const press = () => d.classList.add('pressed');
    if (instant) { if (type === 'swap') swap(); if (type === 'btn') press(); return 0; }

    let wait = 480;
    if (type === 'cmd') {
      let n = 0; d.textContent = '';
      const iv = setInterval(() => { n += 2; d.textContent = str.slice(0, n); if (n >= str.length) clearInterval(iv); }, 26);
      fin.push(() => { clearInterval(iv); d.textContent = str; });
      wait = str.length * 13 + 420;
    } else if (type === 'swap') {
      const to = setTimeout(() => { swap(); A.blip(150, .05, 'sawtooth', .02); }, 400);
      fin.push(() => { clearTimeout(to); swap(); });
      wait = 620;
    } else if (type === 'btn') {
      const to = setTimeout(() => { press(); A.blip(520, .05); }, 560);
      fin.push(() => { clearTimeout(to); press(); });
      wait = 1000;
    }
    if (type === 'bad') A.blip(170, .07, 'sawtooth', .025);
    else if (type === 'stop' || type === 'good') A.blip(700, .09, 'square', .03);
    else A.blip(900, .02, 'square', .012);
    return wait;
  }
  function stepRows() {
    if (!queue.length) { rowTimer = null; return; }
    rowTimer = setTimeout(stepRows, addRow(queue.shift(), false));
  }
  function finishRows() {
    clearTimeout(rowTimer); rowTimer = null;
    fin.forEach(f => f()); fin = [];
    while (queue.length) addRow(queue.shift(), true);
  }
  function playRows(w) {
    finishRows();
    winBody.textContent = '';
    win.className = `simwin k-${w.kind} side-${w.side}`;
    winTitle.textContent = w.app;
    queue = w.rows.slice();
    if (U.calm) finishRows(); else rowTimer = setTimeout(stepRows, 300);
  }

  /* ---------- testo: le righe entrano una alla volta ---------- */
  function paintLines(upTo) {
    text.textContent = '';
    lines.slice(0, upTo).forEach(s => { const p = document.createElement('span'); p.className = 'cl old'; p.textContent = s; text.appendChild(p); });
  }
  function lastLineDone() {
    hint.hidden = false;
    if (cine && !U.calm) lineTimer = setTimeout(advance, cur.hold || 2600);
  }
  function lineDone() {
    clearInterval(typing); typing = null;
    if (curSpan) curSpan.textContent = lines[li];
    if (li >= lines.length - 1) return lastLineDone();
    if (cine) lineTimer = setTimeout(() => { li++; typeLine(); }, 800 + lines[li].length * 16);
  }
  function typeLine() {
    clearInterval(typing); clearTimeout(lineTimer);
    paintLines(li);
    curSpan = document.createElement('span'); curSpan.className = 'cl';
    text.appendChild(curSpan);
    const s = lines[li];
    let n = 0;
    typing = setInterval(() => {
      n += cine ? 1 : 2;
      curSpan.textContent = s.slice(0, n);
      if (n % 4 === 0 && !cur.win) A.blip(cine ? 640 : 880, .02, 'square', .01);
      if (n >= s.length) lineDone();
    }, cine ? 32 : 30);
  }
  function startText() {
    clearInterval(typing); typing = null; clearTimeout(lineTimer);
    text.textContent = ''; hint.hidden = true; li = 0; curSpan = null;
    if (!lines.length) {              // cartello senza testo
      if (cine && !U.calm) lineTimer = setTimeout(advance, cur.hold || 3000); else hint.hidden = false;
      return;
    }
    if (U.calm) { li = lines.length - 1; paintLines(lines.length); text.lastChild.classList.remove('old'); hint.hidden = false; return; }
    typeLine();
  }

  /* ---------- sequenza ---------- */
  function show(i) {
    idx = i; cur = shots[i]; leaving = 0;
    place.textContent = cur.place || '';
    lines = cur.lines || (cur.text ? [cur.text] : []);
    cap.classList.toggle('nocap', !lines.length && !cur.place);
    hint.textContent = i < shots.length - 1 ? 'Clicca per continuare' : 'Clicca per chiudere';
    if (cur.card) {
      cardBig.textContent = cur.card.big; cardSub.textContent = cur.card.sub || '';
      card.hidden = false; U.retrigger(card, 'in');
      A.boom();
    } else card.hidden = true;
    if (cur.win) {
      cancelAnimationFrame(raf);
      stage.hidden = true; win.hidden = false;
      playRows(cur.win);
    } else {
      finishRows();
      win.hidden = true; stage.hidden = false;
      if (!cine) U.retrigger(cv, 'cutin');
      startLoop();
    }
    startText();
  }
  // Dissolvenza in nero prima di cambiare inquadratura (solo in modalità cinema).
  function leave(fn) {
    clearInterval(typing); typing = null; clearTimeout(lineTimer);
    if (!cine || U.calm || cur.win) return fn();
    leaving = performance.now();
    card.classList.remove('in'); card.classList.add('out');
    setTimeout(() => { card.classList.remove('out'); fn(); }, 340);
  }
  function advance() {
    if (!shots || leaving) return;
    if (idx < shots.length - 1) leave(() => show(idx + 1)); else leave(end);
  }
  function next() {
    if (!shots || leaving) return;
    if (cur.win && (typing || rowsBusy())) {      // simulazioni: il primo clic completa testo e finestra
      if (typing) lineDone();
      finishRows();
      return;
    }
    if (typing) return lineDone();                // completa la riga in corso
    if (li < lines.length - 1) { clearTimeout(lineTimer); li++; return typeLine(); }
    advance();
  }
  function end() {
    clearInterval(typing); typing = null; clearTimeout(lineTimer);
    cancelAnimationFrame(raf);
    queue = []; finishRows();
    win.hidden = true; stage.hidden = false; card.hidden = true;
    cur = null; shots = null; leaving = 0; box.hidden = true;
    box.classList.remove('cine');
    const d = done; done = null;
    if (d) d();
  }

  // Riproduce un elenco di inquadrature e si risolve alla fine.
  // Inquadratura: { scene, args, cam, glitch } oppure { card: { big, sub } } oppure { win }, più place e lines (o text).
  function play(list, opts) {
    return new Promise(res => {
      shots = list; done = res; cine = !!(opts && opts.cine);
      tAll = performance.now();
      box.classList.toggle('cine', cine);
      box.hidden = false; titleBox.hidden = true; cap.hidden = false; skip.hidden = false;
      show(0);
    });
  }
  function title() {
    shots = null; cine = false; leaving = 0;
    cur = { scene: 'rocca', args: { k: .7 } };
    box.classList.remove('cine');
    box.hidden = false; titleBox.hidden = false; cap.hidden = true; skip.hidden = true;
    win.hidden = true; stage.hidden = false; card.hidden = true;
    U.retrigger(cv, 'cutin');
    startLoop();
  }
  function closeTitle() { cancelAnimationFrame(raf); cur = null; box.hidden = true; }

  box.addEventListener('click', e => { if (!e.target.closest('button')) next(); });
  skip.addEventListener('click', end);
  document.addEventListener('keydown', e => {
    if (box.hidden || !shots) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
    else if (e.key === 'Escape') end();
  });

  // Per le prove: mostra l'inquadratura i ferma al secondo indicato.
  function debugShow(i, sec) { show(i); cancelAnimationFrame(raf); render(t0 + sec * 1000); }

  G.cut = { play, title, closeTitle, debugShow };
})(window.SLC);
