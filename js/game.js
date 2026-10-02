/* Logica di gioco: campagna, briefing e scelta del mazzo, attacchi a tre turni, joker, negozio. */
(function (G) {
  const U = G.ui, A = G.audio, $ = U.$;
  const HAND = 5, INCOME = 4, MAX_JOKERS = 4, LIVES = 3, DISCARDS = 3, DECK_SIZE = 10;
  const SHOP_INFO = 'Passa sopra una carta o un joker per leggere cosa fa. Le carte comprate entrano nella collezione: sceglierai quali portare nel briefing.';
  const PREP_INFO = 'Clicca una tecnica del profilo per vedere l\'attacco in azione; passandoci sopra si evidenziano le carte che la fermano. Nel mazzo c\'è posto per poche carte: non puoi coprire tutto.';

  const el = {};
  ['table', 'track', 'hand', 'info', 'stamp', 'debrief', 'base', 'mult', 'total', 'goal', 'multBox', 'advanceBtn', 'discardBtn',
    'coins', 'credN', 'jokers', 'eyebrow', 'foeName', 'reserves', 'lives', 'funds', 'deckN', 'steps', 'arena', 'shop', 'prep', 'sfxBtn', 'musBtn', 'howBtn']
    .forEach(id => { el[id] = $(id); });

  let run = null, enc = null, mode = 'title', sel = null, defaultInfo = '', shopState = null, prepSel = null, prepFocus = null, uid = 0;
  const cols = [];

  const newCard = (k, ed) => ({ id: ++uid, d: G.D[k], ed: ed || null, bonus: 0 });
  const has = k => !!run && run.jokers.includes(k);
  const bossIs = k => !!enc && !!enc.foe.boss && enc.foe.boss.k === k;
  const slotCost = s => s._free ? 0 : U.costOf(s._c);
  const scoutCost = () => enc.freeScout ? 0 : (bossIs('silent') ? 2 : 1);
  const credits = n => `${n} ${n === 1 ? 'credito' : 'crediti'}`;
  const deckSize = () => Math.min(DECK_SIZE, run.coll.length);
  const techInfo = t => `<strong>${t.n}</strong> · ${t.id}. ${t.d} La fermano: ${G.countersOf(t.k).map(d => d.n).join(', ')}.`;
  const jokerInfo = j => `<strong>${j.n}</strong> · ${j.e} ${j.l}`;

  function say(html) {
    const t = mode === 'shop' ? $('shopInfo') : mode === 'prep' ? $('prepInfo') : el.info;
    if (t) t.innerHTML = html;
  }
  function deny(target, msg) { if (target) U.retrigger(target, 'shake'); A.blip(140, .12, 'sawtooth', .04); if (msg) say(msg); }
  function setNum(e, n) { e.textContent = n; U.retrigger(e.closest('.box'), 'tick'); }
  function fire(k) { const t = $('jk-' + k); if (t) U.retrigger(t, 'fire'); }
  function quake() { U.retrigger(el.table, 'quake'); }
  function hoverInfo(node, htmlFn) {
    const show = () => say(htmlFn()), hide = () => say(defaultInfo);
    node.addEventListener('pointerenter', show); node.addEventListener('focus', show);
    node.addEventListener('pointerleave', hide); node.addEventListener('blur', hide);
  }
  function mkBtn(label, fn, o) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn' + (o && o.cls ? ' ' + o.cls : ''); b.textContent = label;
    if (o && o.id) b.id = o.id;
    if (o && o.off) b.disabled = true;
    b.addEventListener('click', fn);
    return b;
  }

  /* ---------- pista: sette colonne, costruite una volta ---------- */
  G.PHASES.forEach((name, p) => {
    const c = document.createElement('div');
    c.className = 'col';
    c.innerHTML = `<div class="ph"><b>${p + 1}</b><span>${name}</span></div>
      <div class="chain" aria-hidden="true"><i></i><i></i></div>
      <div class="rslot"></div>
      <div class="bslot" role="button" tabindex="0" aria-label="Fase ${p + 1}, ${name}: schiera qui una difesa"><span class="plus">+</span></div>
      <div class="verdict"></div>`;
    el.track.appendChild(c);
    const o = { el: c, rslot: c.querySelector('.rslot'), bslot: c.querySelector('.bslot'), plus: c.querySelector('.plus'), verdict: c.querySelector('.verdict'), red: null };
    o.bslot.addEventListener('click', () => dropOn(p));
    o.bslot.addEventListener('keydown', e => { if (e.target === o.bslot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); dropOn(p); } });
    cols.push(o);
  });

  /* ---------- pannelli di stato ---------- */
  function renderStatus() {
    el.lives.innerHTML = Array.from({ length: LIVES }, (_, i) => `<i class="${i < run.lives ? '' : 'off'}"></i>`).join('');
    el.lives.setAttribute('aria-label', `${run.lives} su ${LIVES}`);
    el.funds.textContent = run.funds;
    el.deckN.textContent = run.coll.length;
  }
  function renderReserves() {
    el.reserves.innerHTML = enc.reservesMax
      ? `Riserve del red team <span class="pipsrow red" aria-label="${enc.reserves} su ${enc.reservesMax}">${Array.from({ length: enc.reservesMax }, (_, i) => `<i class="${i < enc.reserves ? '' : 'off'}"></i>`).join('')}</span>`
      : 'Red team senza riserve';
  }
  function renderSteps() {
    el.steps.innerHTML = G.TURNS.map((T, i) => `<li class="${i === enc.turn ? 'cur' : i < enc.turn ? 'past' : ''}">${i + 1} ${T.n}</li>`).join('');
  }
  function renderJokers() {
    el.jokers.textContent = '';
    if (!run || !run.jokers.length) {
      el.jokers.innerHTML = '<p class="nojoker">Nessun joker attivo. Si comprano nel negozio tra una missione e l\'altra.</p>';
      return;
    }
    run.jokers.forEach(k => {
      const j = G.J[k], t = U.jokerEl(j, true);
      hoverInfo(t, () => jokerInfo(j));
      t.addEventListener('click', () => say(jokerInfo(j)));
      el.jokers.appendChild(t);
    });
  }
  function planInfo() {
    const t = enc.turn, T = G.TURNS[t], ph = T.ph;
    let s = `<strong>Turno ${t + 1} di 3 · ${T.n}.</strong> `;
    if (run.enc === 0 && t === 0 && !enc.placed.some(a => a.length)) {
      s += 'Scegli una difesa dalla mano e schierala in una fase: i quadratini blu sulla carta indicano dove funziona. Le carte coperte si possono far analizzare dal SOC per 1 credito.';
    } else {
      s += `Avanza risolve le fasi ${ph[0] + 1}-${ph[ph.length - 1] + 1}. I crediti non spesi restano per il turno dopo, e ogni fase accetta fino a due difese.`;
    }
    return enc.turnNote ? `${s} ${enc.turnNote}` : s;
  }
  function ui() {
    const plan = mode === 'plan';
    if (enc) {
      el.credN.textContent = enc.credits;
      el.coins.innerHTML = Array.from({ length: Math.min(enc.credits, 14) }, () => '<i></i>').join('');
      const ph = enc.turn >= 0 ? G.TURNS[enc.turn].ph : [0, 2];
      el.advanceBtn.textContent = `Avanza: fasi ${ph[0] + 1}-${ph[ph.length - 1] + 1}`;
      el.discardBtn.textContent = `Scarta (${enc.discards})`;
      cols.forEach((c, p) => c.bslot.classList.toggle('target',
        plan && !!sel && sel._ph.includes(p) && enc.result[p] === null && !enc.locked[p] && enc.placed[p].length < 2));
      if (plan) defaultInfo = planInfo();
    }
    el.advanceBtn.disabled = !plan;
    el.discardBtn.disabled = !(plan && sel && enc.discards > 0);
    el.howBtn.disabled = !(plan && sel);
  }

  /* ---------- carte in gioco ---------- */
  function makeBlue(card) {
    const s = U.blueEl(card);
    hoverInfo(s, () => U.describe(card, s._free));
    s.addEventListener('click', e => { e.stopPropagation(); onCard(s); });
    return s;
  }
  function makeRed(p) {
    const t = enc.chain[p], s = U.redEl(t, p);
    hoverInfo(s, () => enc.revealed[p] ? `${techInfo(t)} Clicca per vederla in azione.` : `Carta coperta. Clicca per farla analizzare dal SOC: costa ${credits(scoutCost())}.`);
    s.addEventListener('click', () => {
      if (enc.revealed[p] && (mode === 'plan' || mode === 'debrief')) return openSim(techShots(enc.chain[p]));
      scout(p, s);
    });
    return s;
  }
  function flipUp(p) {
    enc.revealed[p] = true;
    const r = cols[p].red;
    r.classList.remove('down');
    r.setAttribute('aria-label', `Fase ${p + 1}: ${enc.chain[p].n}, ${enc.chain[p].id}`);
  }
  function scout(p, s) {
    if (mode !== 'plan' || enc.revealed[p]) return;
    const c = scoutCost();
    if (enc.credits < c) return deny(s, 'Crediti insufficienti per l\'analisi del SOC.');
    enc.credits -= c;
    if (enc.freeScout) { enc.freeScout = false; fire('soc247'); }
    flipUp(p); A.blip(700, .08); ui();
    G.fx.burst(s, { colors: ['#ffb000', '#e4ebec'], n: 10, speed: 170 });
    say(techInfo(enc.chain[p]));
  }
  function onCard(s) {
    if (mode !== 'plan') return;
    if (s._at !== null) return unplace(s);
    if (sel) sel.classList.remove('sel');
    sel = sel === s ? null : s;
    if (sel) sel.classList.add('sel');
    A.blip(sel ? 520 : 330, .05);
    ui();
  }
  function slotState(p) {
    const n = enc.placed[p].length, b = cols[p].bslot;
    b.classList.toggle('one', n === 1); b.classList.toggle('two', n === 2);
    b.tabIndex = n === 2 ? -1 : 0;
  }
  function dropOn(p) {
    if (mode !== 'plan' || enc.result[p] !== null) return;
    if (enc.locked[p]) return deny(null, 'Shadow IT: questa fase non può ricevere difese.');
    if (!sel) return say('Scegli prima una carta dalla mano.');
    if (enc.placed[p].length >= 2) return deny(sel, 'Ogni fase accetta al massimo due difese.');
    const d = sel._c.d;
    if (!sel._ph.includes(p)) return deny(sel, `<strong>${d.n}</strong> non agisce nella fase ${p + 1}. I quadratini blu sulla carta indicano le fasi in cui funziona.`);
    const cost = slotCost(sel);
    if (cost > enc.credits) return deny(sel, 'Crediti insufficienti per questa difesa.');
    const s = sel; sel = null;
    U.fly(s, () => {
      s.classList.remove('sel');
      s.style.setProperty('--r', '0deg'); s.style.setProperty('--arc', '0px');
      cols[p].bslot.appendChild(s);
      U.fan(el.hand);
    });
    s._at = p; s._paid = cost; enc.placed[p].push(s); enc.credits -= cost;
    slotState(p);
    A.blip(260, .1, 'triangle', .07);
    setTimeout(() => { U.retrigger(s, 'land'); G.fx.burst(s, { colors: ['#e4ebec', '#93aab8'], n: 8, speed: 150 }); }, 340);
    ui(); say(defaultInfo);
  }
  function unplace(s) {
    const p = s._at;
    if (enc.result[p] !== null) return;
    U.fly(s, () => { el.hand.appendChild(s); U.fan(el.hand); });
    enc.placed[p] = enc.placed[p].filter(x => x !== s);
    enc.credits += s._paid; s._at = null; s._paid = 0;
    slotState(p);
    A.blip(330, .06, 'triangle');
    ui(); say(defaultInfo);
  }
  function drawCard() {
    if (!enc.draw.length) { enc.draw = U.shuffle(enc.pile); enc.pile = []; }
    return enc.draw.pop();
  }
  function handSize() { return HAND + (has('tabletop') ? 1 : 0) - (bossIs('friday') ? 1 : 0); }
  function drawUp() {
    let n = 0;
    while (el.hand.children.length < handSize()) {
      const c = drawCard();
      if (!c) break;
      const s = makeBlue(c), k = n++;
      s.classList.add('deal'); s.style.setProperty('--dl', (k * 70) + 'ms');
      s.addEventListener('animationend', () => s.classList.remove('deal'), { once: true });
      setTimeout(() => A.blip(480 + k * 40, .04, 'triangle', .04), k * 70);
      el.hand.appendChild(s);
    }
    U.fan(el.hand);
  }
  function discardSel() {
    if (mode !== 'plan' || !sel || enc.discards <= 0) return;
    enc.pile.push(sel._c); sel.remove(); sel = null; enc.discards--;
    const c = drawCard();
    if (c) el.hand.appendChild(makeBlue(c));
    U.fan(el.hand);
    A.blip(300, .07, 'triangle');
    ui(); say(defaultInfo);
  }

  /* ---------- simulazioni: come funziona una tecnica, come la ferma una difesa ---------- */
  const lower = s => s.charAt(0).toLowerCase() + s.slice(1);
  // Una tecnica: lo schema di rete, poi i due passaggi dell'attacco, poi ogni difesa che la ferma.
  function techShots(t) {
    const place = `${t.n} · ${t.id} · fase ${t.p + 1}`, W = G.SIMWIN.tech[t.k];
    const [from, to, , mark] = t.sim[0];
    const shots = [{ scene: 'net', args: { from, to, hit: t.hit.slice(), mark }, place, text: t.d }];
    t.sim.forEach(([, , text], i) => shots.push({ win: W[i], place: `${t.n} · l'attacco, passo ${i + 1} di 2`, text }));
    G.countersOf(t.k).forEach(d => shots.push({ win: G.SIMWIN.def[d.k], place: `${t.n} · come si ferma · ${d.n}`, text: d.d }));
    return shots;
  }
  // Una difesa: la difesa al lavoro, poi ogni tecnica che ferma.
  function defShots(d) {
    const shots = [{ win: G.SIMWIN.def[d.k], place: `${d.n} · la difesa al lavoro`, text: d.d }];
    d.x.forEach(k => {
      const t = G.T[k];
      shots.push({ win: G.SIMWIN.tech[k][0], place: `${d.n} ferma · ${t.n} (fase ${t.p + 1})`, text: t.sim[0][2] });
    });
    return shots;
  }
  function openSim(shots) {
    const prev = A.currentTrack();
    A.track('cut');
    G.cut.play(shots).then(() => A.track(prev));
  }

  /* ---------- salvataggio: la campagna si salva a ogni briefing e a ogni negozio ---------- */
  const SAVE_KEY = 'spezza-la-catena-v1';
  function save(stage) {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, stage, enc: run.enc, lives: run.lives, funds: run.funds, jokers: run.jokers, flags: run.flags,
        coll: run.coll.map(c => ({ k: c.d.k, ed: c.ed, bonus: c.bonus })),
        deck: run.deck.map(c => run.coll.indexOf(c)).filter(i => i >= 0),
      }));
    } catch (e) { /* salvataggio non disponibile: si gioca lo stesso */ }
  }
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || s.v !== 1 || !G.FOES[s.enc] || !Array.isArray(s.coll) || s.coll.some(c => !G.D[c.k])) return null;
      if (s.stage === 'shop' && !G.FOES[s.enc + 1]) return null;
      return s;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* niente da cancellare */ } }
  function resume(s) {
    run = {
      enc: s.enc, lives: s.lives, funds: s.funds, jokers: (s.jokers || []).filter(k => G.J[k]), flags: s.flags || {}, deck: [],
      coll: s.coll.map(c => { const n = newCard(c.k, c.ed); n.bonus = c.bonus || 0; return n; }),
    };
    run.deck = (s.deck || []).map(i => run.coll[i]).filter(Boolean);
    seenIntro = true;
    renderStatus();
    if (s.stage === 'shop') openShop(); else openPrep();
  }

  /* ---------- briefing e scelta del mazzo ---------- */
  function openPrep() {
    const foe = G.FOES[run.enc];
    mode = 'prep'; sel = null; prepFocus = null; defaultInfo = PREP_INFO;
    A.track('prep');
    el.arena.hidden = true; el.shop.hidden = true; el.prep.hidden = false;
    el.table.classList.add('offfield');
    el.eyebrow.textContent = `Missione ${run.enc + 1} di ${G.FOES.length} · ${foe.site}`;
    el.foeName.textContent = foe.city;
    el.reserves.textContent = `${foe.n} · ${foe.tag}`;
    el.steps.innerHTML = '';
    // Riparte dal mazzo della missione precedente, se c'è.
    const last = new Set(run.deck);
    prepSel = new Set(run.coll.filter(c => last.has(c)).slice(0, deckSize()));
    renderStatus(); renderPrep();
    U.retrigger(el.prep, 'enter');
    save('prep');
    window.scrollTo(0, 0);
  }
  function renderPrep() {
    const foe = G.FOES[run.enc], notes = [];
    if (run.flags.backdoor) notes.push('Una backdoor rimasta dall\'attacco precedente dà al red team 1 riserva in più.');
    if (run.flags.noIntel) notes.push('I dati esfiltrati nell\'attacco precedente ti lasciano senza fasi note all\'inizio.');
    const route = G.FOES.map((f, i) => `<li class="${i < run.enc ? 'past' : i === run.enc ? 'cur' : ''}"><b>${i + 1}</b>${f.city}</li>`).join('');
    const prof = G.PHASES.map((name, p) => `<li><b>${p + 1}</b><span class="phn">${name}</span><span class="chips">${
      foe.hide.includes(p) ? '<span class="chip unk">Nessuna informazione</span>'
        : foe.pool[p].map(k => `<button type="button" class="chip" data-k="${k}">${G.T[k].n}</button>`).join('')}</span></li>`).join('');
    el.prep.innerHTML = `<ol class="route" aria-label="Campagna">${route}</ol>
      <div class="brief">
        <div>
          <h2>Briefing</h2><p>${foe.brief}</p>
          <dl class="facts">
            <div><dt>Soglia</dt><dd>${foe.goal}</dd></div>
            <div><dt>Riserve</dt><dd>${foe.reserves + (run.flags.backdoor ? 1 : 0)}</dd></div>
            <div><dt>Fasi note</dt><dd>${run.flags.noIntel ? 0 : foe.intel}</dd></div>
          </dl>
          ${foe.boss ? `<p class="rule"><strong>Regola del boss · ${foe.boss.n}.</strong> ${foe.boss.e}</p>` : ''}
          ${notes.map(n => `<p class="note">${n}</p>`).join('')}
        </div>
        <div>
          <div class="profhead"><canvas class="emb" id="prepEmb" width="16" height="16" aria-hidden="true"></canvas><div><h2>Profilo dell'avversario</h2><p class="foeline">${foe.n} · ${foe.tag}</p></div></div>
          <p>Per ogni fase, le tecniche che questo avversario potrebbe usare. Quella vera la scoprirai solo durante l'attacco.</p>
          <ol class="prof">${prof}</ol>
        </div>
      </div>
      <div class="deckbar"><h2>Scegli il mazzo</h2><b id="deckCount"></b><button type="button" class="btn small" id="prepHow" disabled>Come funziona</button></div>
      <p class="info" id="prepInfo">${PREP_INFO}</p>
      <div class="pick" id="coll"></div>
      <div class="shopfoot" id="prepFoot"></div>`;

    G.drawEmblem($('prepEmb').getContext('2d'), foe.k);
    const grid = $('coll');
    run.coll.slice().sort((a, b) => a.d.n.localeCompare(b.d.n)).forEach(c => {
      const s = U.blueEl(c);
      hoverInfo(s, () => U.describe(c));
      s.addEventListener('click', () => {
        prepFocus = c;
        $('prepHow').disabled = false; $('prepHow').textContent = `Come funziona: ${c.d.n}`;
        if (prepSel.has(c)) prepSel.delete(c);
        else if (prepSel.size >= deckSize()) return deny(s, `Il mazzo è pieno: togli una carta per fare posto a <strong>${c.d.n}</strong>.`);
        else prepSel.add(c);
        A.blip(prepSel.has(c) ? 520 : 330, .05);
        updatePrep();
      });
      grid.appendChild(s);
    });
    el.prep.querySelectorAll('.chip[data-k]').forEach(chip => {
      const t = G.T[chip.dataset.k];
      const show = () => { say(techInfo(t)); grid.querySelectorAll('.slot').forEach(s => s.classList.toggle('hint', s._c.d.x.includes(t.k))); };
      const hide = () => { say(defaultInfo); grid.querySelectorAll('.slot').forEach(s => s.classList.remove('hint')); };
      chip.addEventListener('pointerenter', show); chip.addEventListener('focus', show); chip.addEventListener('click', () => openSim(techShots(t)));
      chip.addEventListener('pointerleave', hide); chip.addEventListener('blur', hide);
    });
    $('prepHow').addEventListener('click', () => { if (prepFocus) openSim(defShots(prepFocus.d)); });
    $('prepFoot').appendChild(mkBtn('Inizia l\'attacco', () => {
      if (prepSel.size !== deckSize()) return;
      run.deck = run.coll.filter(c => prepSel.has(c));
      A.blip(380, .08, 'triangle', .06);
      startEncounter();
    }, { cls: 'primary', id: 'prepGo' }));
    updatePrep();
  }
  function updatePrep() {
    $('coll').querySelectorAll('.slot').forEach(s => {
      s.classList.toggle('in', prepSel.has(s._c));
      s.setAttribute('aria-pressed', String(prepSel.has(s._c)));
    });
    $('deckCount').textContent = `${prepSel.size} su ${deckSize()}`;
    $('prepGo').disabled = prepSel.size !== deckSize();
  }

  /* ---------- svolgimento di un attacco ---------- */
  function startEncounter() {
    const foe = G.FOES[run.enc], notes = [];
    enc = {
      foe, chain: foe.pool.map(list => G.T[list[Math.random() * list.length | 0]]),
      revealed: Array(7).fill(false), result: Array(7).fill(null),
      placed: Array.from({ length: 7 }, () => []), locked: Array(7).fill(false),
      reserves: foe.reserves, reservesMax: foe.reserves, turn: -1, credits: 0, chips: 0, mult: 1, blocked: 0, hits: 0,
      draw: U.shuffle(run.deck.slice()), pile: [], discards: DISCARDS, freeScout: false, log: [], notes, turnNote: '', intel: [],
    };
    if (run.flags.backdoor) { enc.reserves++; enc.reservesMax++; }
    const intelN = run.flags.noIntel ? 0 : foe.intel;
    run.flags = {};
    if (has('shadow')) {
      const p = Math.random() * 7 | 0;
      enc.mult += 3; enc.locked[p] = true;
      notes.push(`Shadow IT: parti con +3 Molt, ma la fase ${p + 1} non può ricevere difese.`);
    }
    enc.intel = U.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, intelN);
    if (has('bounty') && run.funds > 0) {
      run.funds--;
      if (!enc.intel.includes(6)) enc.intel.push(6);
      notes.push('Bug bounty: la fase 7 è già nota. Hai pagato 1 fondo.');
    }

    mode = 'intro'; sel = null; defaultInfo = '';
    A.track('attack');
    el.table.classList.remove('offfield');
    el.shop.hidden = true; el.prep.hidden = true; el.arena.hidden = false;
    el.stamp.hidden = true; el.debrief.hidden = true; el.hand.hidden = false;
    el.hand.textContent = ''; el.info.textContent = '';
    el.eyebrow.textContent = `Missione ${run.enc + 1} di ${G.FOES.length} · ${foe.city} · ${foe.tag}`;
    el.foeName.textContent = foe.n;
    el.goal.textContent = foe.goal;
    el.base.textContent = '0'; el.mult.textContent = enc.mult; el.total.textContent = '0';
    el.multBox.classList.remove('hot'); el.total.closest('.box').classList.remove('won');
    U.retrigger(el.arena, 'enter');
    cols.forEach((c, p) => {
      c.el.className = 'col'; c.verdict.textContent = '';
      c.rslot.textContent = ''; c.red = makeRed(p); c.rslot.appendChild(c.red);
      c.bslot.querySelectorAll('.slot').forEach(x => x.remove());
      c.bslot.className = 'bslot' + (enc.locked[p] ? ' locked' : '');
      c.bslot.tabIndex = enc.locked[p] ? -1 : 0;
      c.plus.textContent = enc.locked[p] ? 'Shadow IT' : '+';
    });
    renderStatus(); renderJokers(); renderReserves();
    window.scrollTo(0, 0);

    enc.intel.forEach((p, i) => {
      enc.revealed[p] = true;
      const r = cols[p].red, t = enc.chain[p];
      setTimeout(() => {
        r.classList.remove('down');
        r.setAttribute('aria-label', `Fase ${p + 1}: ${t.n}, ${t.id}`);
        A.blip(600 + i * 90, .07);
      }, 350 + i * 240);
    });
    startTurn(0);
  }
  function startTurn(t) {
    enc.turn = t; enc.turnNote = t === 0 ? enc.notes.join(' ') : '';
    enc.credits += INCOME - (has('legacy') ? 1 : 0) - (bossIs('friday') ? 1 : 0);
    enc.freeScout = has('soc247');
    [...el.hand.children].forEach(s => { if (s._free) { s._free = false; U.paintBlue(s); } });
    drawUp();
    if (has('intern')) {
      const slots = U.shuffle([...el.hand.children]);
      if (slots.length >= 2) {
        const [free, lost] = slots;
        enc.pile.push(lost._c); lost.remove();
        free._free = true; U.paintBlue(free);
        U.fan(el.hand); fire('intern');
        enc.turnNote = `${enc.turnNote} Stagista: ${free._c.d.n} costa 0, ${lost._c.d.n} è stata scartata.`.trim();
      }
    }
    cols.forEach((c, p) => c.el.classList.toggle('now', G.TURNS[t].ph.includes(p)));
    mode = 'plan';
    renderSteps(); ui(); say(defaultInfo);
  }

  async function award(s, p) {
    const pts = U.ptsOf(s._c) + (has('legacy') ? 40 : 0);
    enc.chips += pts;
    enc.mult += (p < 3 ? 2 : 1) + (s._c.ed === 'holo' ? 1 : 0) + (has('zerotrust') && p >= 3 ? 1 : 0);
    U.retrigger(s, 'bump'); U.pop(s, '+' + pts);
    G.fx.burst(s, { colors: ['#ffb000', '#2473d6', '#e4ebec'], n: 16, up: true, speed: 300 });
    setNum(el.base, enc.chips);
    A.blip(440 * 2 ** (enc.hits * 2 / 12), .1); enc.hits++;
    if (has('legacy')) fire('legacy');
    await U.sleep(200);
    setNum(el.mult, enc.mult); el.multBox.classList.toggle('hot', enc.mult >= 6);
    A.blip(660 * 2 ** (enc.hits * 2 / 12), .08, 'square', .04);
    if (has('zerotrust') && p >= 3) fire('zerotrust');
    if (p < 3) quake();
    el.total.textContent = enc.chips * enc.mult;
    el.total.closest('.box').classList.toggle('won', enc.chips * enc.mult >= enc.foe.goal);
    await U.sleep(280);
  }
  // Tecnica di ripiego: un'altra del profilo per quella fase, o in mancanza un'altra qualsiasi della fase.
  function altOf(p, cur) {
    let list = enc.foe.pool[p].filter(k => k !== cur.k).map(k => G.T[k]);
    if (!list.length) list = G.TECH[p].filter(t => t.k !== cur.k);
    return list[Math.random() * list.length | 0];
  }
  async function swapRed(p, alt) {
    const c = cols[p], old = c.red;
    old.classList.add('burn');
    A.blip(170, .2, 'sawtooth', .05);
    await U.sleep(380);
    old.remove();
    enc.chain[p] = alt; enc.revealed[p] = false;
    c.red = makeRed(p); c.rslot.appendChild(c.red);
    await U.sleep(80);
    flipUp(p); A.blip(240, .08, 'triangle', .07);
    await U.sleep(560);
  }
  function strike(p) {
    U.retrigger(cols[p].red, 'strike');
    setTimeout(() => G.fx.burst(cols[p].bslot, { colors: ['#ee4f3a', '#a82c1c'], n: 10, speed: 190 }), 140);
  }
  async function resolvePhase(p) {
    const c = cols[p], cards = enc.placed[p], tech = enc.chain[p];
    const entry = { p, techs: [tech], ok: false, by: [], wrong: [] };
    c.el.classList.add('active');
    if (!enc.revealed[p]) { flipUp(p); A.blip(200, .06, 'triangle', .07); await U.sleep(480); }
    else await U.sleep(220);

    const b1 = cards.find(s => s._c.d.x.includes(tech.k));
    if (b1) {
      await award(b1, p);
      entry.by.push(b1._c.d.n); entry.ok = true;
      if (enc.reserves > 0) {
        const alt = altOf(p, tech);
        enc.reserves--; renderReserves();
        say(`<strong>Ripiego.</strong> Il red team spende una riserva e cambia tecnica: ${alt.n}.`);
        await swapRed(p, alt);
        entry.techs.push(alt);
        const b2 = cards.find(s => s._c.d.x.includes(alt.k));
        if (b2) {
          await award(b2, p);
          entry.by.push(b2._c.d.n);
          if (has('purple')) { enc.mult += 3; fire('purple'); setNum(el.mult, enc.mult); el.total.textContent = enc.chips * enc.mult; }
          c.verdict.textContent = 'Doppio blocco';
        } else {
          entry.ok = false;
          c.verdict.textContent = 'Ripiego riuscito'; strike(p);
          A.blip(150, .16, 'sawtooth', .05);
        }
      } else {
        c.verdict.textContent = 'Bloccata';
      }
    } else if (cards.length) {
      c.verdict.textContent = 'Aggirata'; strike(p);
      entry.wrong = cards.map(s => s._c.d.n);
      if (has('honey')) {
        cards.forEach(s => { enc.chips += 15; U.pop(s, '+15'); });
        fire('honey'); setNum(el.base, enc.chips); el.total.textContent = enc.chips * enc.mult;
      }
      A.blip(180, .14, 'sawtooth', .04);
    } else {
      c.verdict.textContent = 'Passa'; strike(p);
      A.blip(120, .16, 'sawtooth', .05);
    }

    c.el.classList.add(entry.ok ? 'blocked' : 'passed');
    if (entry.ok) enc.blocked++;
    enc.result[p] = entry.ok ? 'ok' : 'ko';
    enc.log.push(entry);
    await U.sleep(520);
    c.el.classList.remove('active', 'now');
  }
  async function advance() {
    if (mode !== 'plan') return;
    mode = 'resolve';
    if (sel) { sel.classList.remove('sel'); sel = null; }
    ui(); A.tempo(true);
    for (const p of G.TURNS[enc.turn].ph) await resolvePhase(p);
    A.tempo(false);
    if (enc.turn < G.TURNS.length - 1) startTurn(enc.turn + 1);
    else await endEncounter();
  }

  function logLine(l) {
    const t0 = l.techs[0], t1 = l.techs[1];
    const stops = t => G.countersOf(t.k).map(d => d.n).join(' o ');
    let txt;
    if (l.ok && !t1) txt = `Bloccata da ${l.by[0]}.`;
    else if (l.ok) txt = `Bloccata da ${l.by[0]}. Il red team ha ripiegato su ${t1.n}, fermata da ${l.by[1]}.`;
    else if (t1) txt = `Bloccata da ${l.by[0]}, ma il ripiego su ${t1.n} è passato. Lo fermano: ${stops(t1)}.`;
    else if (l.wrong.length) txt = `${l.wrong.join(' e ')} non ${l.wrong.length > 1 ? 'la fermano' : 'la ferma'}. La fermano: ${stops(t0)}.`;
    else txt = `Nessuna difesa schierata. La fermano: ${stops(t0)}.`;
    return `<li class="${l.ok ? 'ok' : ''}"><b>${l.p + 1}</b><span><strong>${t0.n}</strong> <small>${t0.id}</small><br>${txt}${l.ok ? '' : ` <button type="button" class="btn small see" data-k="${(t1 || t0).k}">Guarda l'attacco</button>`}</span></li>`;
  }
  async function endEncounter() {
    mode = 'ending'; ui();
    if (has('depth') && enc.blocked >= 4) {
      enc.mult *= 2; fire('depth'); setNum(el.mult, enc.mult); el.multBox.classList.add('hot');
      quake(); A.blip(880, .14);
      await U.sleep(600);
    }
    const total = enc.chips * enc.mult, foe = enc.foe, win = total >= foe.goal;
    await U.countTo(el.total, total, 800);
    setNum(el.total, total);
    el.stamp.textContent = win ? 'CATENA SPEZZATA' : 'VIOLAZIONE';
    el.stamp.classList.toggle('lose', !win); el.stamp.hidden = false;
    quake();
    if (win) G.fx.confetti();
    el.total.closest('.box').classList.toggle('won', win);
    if (win) [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.blip(f, .16), i * 110));
    else [300, 220, 160].forEach((f, i) => setTimeout(() => A.blip(f, .22, 'sawtooth', .05), i * 140));

    // Conseguenze delle fasi passate
    const cons = [];
    if (enc.result[4] === 'ko') {
      run.flags.backdoor = true;
      cons.push('Fase 5 passata: l\'attaccante lascia una backdoor. Nella prossima missione il red team avrà 1 riserva in più.');
    }
    if (enc.result[6] === 'ko') {
      if (enc.chain[6].k === 'exfil') {
        run.flags.noIntel = true;
        cons.push('Fase 7 passata: i dati esfiltrati aiutano chi verrà dopo. Nella prossima missione non avrai fasi note all\'inizio.');
      } else {
        const lost = Math.min(3, run.funds); run.funds -= lost;
        cons.push(`Fase 7 passata: ${enc.chain[6].k === 'ransom' ? 'il ransomware cifra i dati' : 'i dati vengono distrutti'}. Il ripristino ti costa ${lost} fondi.`);
      }
    }
    if (!win) {
      if (has('insurance')) {
        run.jokers = run.jokers.filter(k => k !== 'insurance'); renderJokers();
        cons.push('La polizza cyber copre il danno e si esaurisce: non perdi Resilienza.');
      } else {
        run.lives--;
        cons.push('Soglia non raggiunta: perdi 1 Resilienza.');
      }
    }
    const reward = win ? 5 + Math.min(3, enc.credits) + (foe.boss ? 2 : 0) : 2;
    run.funds += reward;
    renderStatus();

    const last = run.enc === G.FOES.length - 1, dead = run.lives <= 0;
    el.debrief.innerHTML = `<h2>${win ? `Attacco respinto: ${enc.blocked} fasi bloccate su 7` : `Violazione: Difesa ${total} su ${foe.goal}`}</h2>
      <p>${win ? 'Ogni fase bloccata è un punto in cui la catena si spezza. Quelle rimaste scoperte hanno comunque un costo.' : 'L\'attaccante ha trovato troppe fasi scoperte. Qui sotto trovi cosa avrebbe fermato ogni tecnica.'}</p>
      <ol>${enc.log.map(logLine).join('')}</ol>
      ${cons.length ? `<h3>Conseguenze</h3><ul class="cons">${cons.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
      <div class="realcase"><h3>Caso reale · ${foe.real.t}</h3><p>${foe.real.d}</p><p><strong>Lezione.</strong> ${foe.real.l}</p></div>
      <p class="reward">Ricompensa: +${reward} fondi${win && enc.credits ? ` (di cui ${Math.min(3, enc.credits)} per i crediti risparmiati)` : ''}.</p>
      <button class="btn primary" id="nextBtn" type="button">${dead || last ? 'Fine della campagna' : 'Vai al negozio'}</button>`;
    el.debrief.querySelectorAll('.see').forEach(b => b.addEventListener('click', () => openSim(techShots(G.T[b.dataset.k]))));
    $('nextBtn').addEventListener('click', () => {
      A.blip(380, .08, 'triangle', .06);
      if (dead) return ending(false);
      if (last) return ending(win);
      if (!win) return openShop();
      // Dopo una vittoria: il cerchio nero copre un altro pezzo di luna.
      mode = 'cut'; A.track('cut');
      const n = G.FOES.length;
      G.cut.play([{ scene: 'eclipse', args: { from: run.enc / n, k: (run.enc + 1) / n }, cam: { z0: 1, z1: 1.18, dur: 8 }, place: `${foe.city} · cosa scopri`, lines: sentences(foe.after), hold: 3000 }], { cine: true }).then(openShop);
    });
    await U.sleep(900);
    el.hand.hidden = true; el.debrief.hidden = false;
    defaultInfo = 'Passa sopra le carte del red team per rileggere ogni tecnica e le difese che la fermano.';
    say(defaultInfo);
    mode = 'debrief';
  }
  function ending(win) {
    mode = 'cut'; A.track('cut');
    G.cut.play(win ? [
      { card: { big: 'Alba', sub: 'Rocca Ardenza · il giorno dopo il voto' }, hold: 2800 },
      { scene: 'rocca', args: { dawn: true }, cam: { z0: 1.3, z1: 1, y0: 70, y1: 54, dur: 12 }, place: 'Rocca Ardenza · alba', lines: sentences(G.STORY.win), hold: 3200 },
      { card: { big: 'La catena si è spezzata', sub: 'Campagna completata' }, hold: 3200 },
    ] : [
      { scene: 'rocca', args: { dark: true, k: 1 }, cam: { z0: 1, z1: 1.25, y0: 54, y1: 70, dur: 12 }, glitch: true, place: 'Repubblica di Calvera', lines: sentences(G.STORY.lose), hold: 3200 },
      { card: { big: 'Calvera è al buio', sub: 'Campagna terminata' }, hold: 3200 },
    ], { cine: true }).then(() => over(win));
  }
  function over(win) {
    mode = 'over'; clearSave();
    U.modal(win
      ? `<p class="kicker">Campagna completata</p><h2>La catena si è spezzata</h2>
         <p>Hai chiuso con ${run.lives} Resilienza su ${LIVES} e una collezione di ${run.coll.length} carte.</p>`
      : `<p class="kicker">Campagna terminata · missione ${run.enc + 1} di ${G.FOES.length}</p><h2>Calvera è al buio</h2><p>Puoi riprovare: le missioni cambiano a ogni campagna.</p>`,
      [{ label: 'Nuova campagna', primary: true, fn: newRun }]);
  }

  /* ---------- negozio ---------- */
  function rollShop() {
    const next = G.FOES[run.enc + 1], eds = ['foil', 'holo', 'cert'];
    const owned = new Set(run.coll.map(c => c.d.k)), cards = [];
    // Prima le carte nuove che servono alla prossima missione, poi altre carte nuove, infine un'edizione speciale.
    (next.wants || []).forEach(k => { if (!owned.has(k) && cards.length < 2) cards.push({ card: newCard(k), price: 3, sold: false }); });
    U.shuffle(G.DEFS.filter(d => !owned.has(d.k) && !cards.some(o => o.card.d.k === d.k)))
      .forEach(d => { if (cards.length < 2) cards.push({ card: newCard(d.k), price: 3, sold: false }); });
    U.shuffle(G.DEFS).forEach(d => { if (cards.length < 3) cards.push({ card: newCard(d.k, eds[Math.random() * eds.length | 0]), price: 4, sold: false }); });
    shopState = {
      cards,
      jokers: U.shuffle(G.JOKERS.filter(j => !run.jokers.includes(j.k))).slice(0, 2).map(j => ({ j, price: j.price, sold: false })),
    };
  }
  function offer(item, button) {
    const d = document.createElement('div'); d.className = 'offer';
    d.appendChild(item); d.appendChild(button);
    return d;
  }
  function spend(n) {
    if (run.funds < n) { deny(null, 'Fondi insufficienti.'); return false; }
    run.funds -= n; A.blip(620, .08);
    return true;
  }
  function picker(title, sub, fn) {
    const sheet = U.modal(`<p class="kicker">Collezione · ${run.coll.length} carte</p><h2>${title}</h2><p>${sub}</p><div class="pick"></div>`,
      [{ label: 'Annulla', fn: U.closeModal }]);
    const grid = sheet.querySelector('.pick');
    run.coll.slice().sort((a, b) => a.d.n.localeCompare(b.d.n)).forEach(c => {
      const s = U.blueEl(c);
      s.addEventListener('click', () => { U.closeModal(); fn(c); renderShop(); });
      grid.appendChild(s);
    });
  }
  function renderShop() {
    const next = G.FOES[run.enc + 1];
    renderStatus(); save('shop');
    el.shop.innerHTML = `<div class="shophead">
        <p class="teaser"><strong>Prossima missione: ${next.city}.</strong> ${next.hint}</p>
        <p class="info" id="shopInfo">${SHOP_INFO}</p></div>
      <div class="shoprow"><h3>Carte per la collezione</h3><div class="offers" id="offCards"></div></div>
      <div class="shoprow"><h3>Joker in vendita</h3><div class="offers" id="offJokers"></div></div>
      <div class="shoprow"><h3>I tuoi joker <small>${run.jokers.length} su ${MAX_JOKERS}</small></h3><div class="offers" id="myJokers"></div></div>
      <div class="shoprow"><h3>Servizi</h3><div class="offers" id="services"></div></div>
      <div class="shopfoot" id="shopFoot"></div>`;

    shopState.cards.forEach(o => {
      const s = U.blueEl(o.card);
      hoverInfo(s, () => U.describe(o.card));
      $('offCards').appendChild(offer(s, mkBtn(o.sold ? 'Comprata' : `Compra · ${o.price}`, () => {
        if (!spend(o.price)) return;
        run.coll.push(o.card); o.sold = true; renderShop();
      }, { cls: 'buy', off: o.sold || run.funds < o.price })));
    });

    const full = run.jokers.length >= MAX_JOKERS;
    shopState.jokers.forEach(o => {
      const t = U.jokerEl(o.j, false);
      hoverInfo(t, () => jokerInfo(o.j));
      t.addEventListener('click', () => say(jokerInfo(o.j)));
      $('offJokers').appendChild(offer(t, mkBtn(o.sold ? 'Comprato' : `Compra · ${o.price}`, () => {
        if (run.jokers.length >= MAX_JOKERS) return deny(null, `Hai già ${MAX_JOKERS} joker: vendine uno per fare spazio.`);
        if (!spend(o.price)) return;
        run.jokers.push(o.j.k); o.sold = true; renderShop();
      }, { cls: 'buy', off: o.sold || full || run.funds < o.price })));
    });
    if (!shopState.jokers.length) $('offJokers').innerHTML = '<p class="nojoker">Hai già tutti i joker disponibili.</p>';

    if (!run.jokers.length) $('myJokers').innerHTML = '<p class="nojoker">Ancora nessuno.</p>';
    run.jokers.forEach(k => {
      const j = G.J[k], t = U.jokerEl(j, false);
      hoverInfo(t, () => jokerInfo(j));
      t.addEventListener('click', () => say(jokerInfo(j)));
      $('myJokers').appendChild(offer(t, mkBtn('Vendi · +2', () => {
        run.jokers = run.jokers.filter(x => x !== k); run.funds += 2; A.blip(300, .08, 'triangle'); renderShop();
      })));
    });

    const service = (name, text, label, fn, off) => {
      const d = document.createElement('div'); d.className = 'service';
      d.innerHTML = `<strong>${name}</strong><span>${text}</span>`;
      $('services').appendChild(offer(d, mkBtn(label, fn, { cls: 'buy', off })));
    };
    service('Potenziamento', 'Una carta a tua scelta vale +15 Copertura per il resto della campagna.', 'Scegli · 3', () => {
      picker('Potenzia una carta', 'La carta scelta vale +15 Copertura.', c => {
        if (!spend(3)) return;
        c.bonus += 15;
      });
    }, run.funds < 3);
    service('Nuove offerte', 'Cambia le carte e i joker in vendita.', 'Rinnova · 1', () => {
      if (!spend(1)) return;
      rollShop(); renderShop();
    }, run.funds < 1);

    $('shopFoot').appendChild(mkBtn('Prossima missione', () => { run.enc++; enterMission(); }, { cls: 'primary', id: 'shopNext' }));
    defaultInfo = SHOP_INFO;
  }
  function openShop() {
    mode = 'shop';
    A.track('shop');
    el.arena.hidden = true; el.prep.hidden = true; el.shop.hidden = false;
    el.table.classList.add('offfield');
    el.eyebrow.textContent = `Dopo la missione ${run.enc + 1} di ${G.FOES.length}`;
    el.foeName.textContent = 'Negozio';
    el.reserves.textContent = ''; el.steps.innerHTML = '';
    rollShop(); renderShop();
    U.retrigger(el.shop, 'enter');
    window.scrollTo(0, 0);
  }

  /* ---------- avvio ---------- */
  let seenIntro = false;
  // Divide un testo in frasi, una per riga della cutscene.
  const sentences = str => (str.match(/[^.!?]+[.!?]+/g) || [str]).map(x => x.trim());
  // Cutscene di una missione: cartello, mappa con zoom sulla città, la città, la scheda dell'avversario.
  function missionShots(i) {
    const f = G.FOES[i], [cx0, cy0] = G.CITY[i], last = i === G.FOES.length - 1;
    return [
      { card: { big: `Missione ${i + 1}`, sub: `${f.city} · ${f.site}` }, hold: 2800 },
      { scene: 'map', args: { cur: i }, cam: { z0: 1, z1: 1.75, x0: 96, y0: 54, x1: cx0, y1: cy0, dur: 8 }, place: `${f.city} · Repubblica di Calvera`, lines: f.cut[0] },
      { scene: f.scene, args: last ? { k: 1 } : {}, cam: { z0: 1.3, z1: 1.06, x0: 60, x1: 126, y0: 50, y1: 56, dur: 12 }, glitch: true, place: `${f.city} · ${f.site}`, lines: f.cut[1] },
      { scene: 'dossier', args: { emblem: f.k }, cam: { z0: 1.35, z1: 1, y0: 46, dur: 6 }, place: `${f.n} · ${f.tag}`, lines: f.cut[2], hold: 3000 },
    ];
  }
  function enterMission() {
    mode = 'cut'; A.track('cut');
    el.arena.hidden = true; el.shop.hidden = true; el.prep.hidden = true;
    G.cut.play(missionShots(run.enc), { cine: true }).then(openPrep);
  }
  function newRun() {
    U.closeModal();
    run = { enc: 0, lives: LIVES, funds: 4, coll: G.DEFS.filter(d => d.start).map(d => newCard(d.k)), deck: [], jokers: [], flags: {} };
    renderStatus();
    if (seenIntro) return enterMission();
    seenIntro = true; mode = 'cut'; A.track('cut');
    G.cut.play([
      { card: { big: 'Repubblica di Calvera', sub: 'Sei settimane prima delle elezioni' }, hold: 3400 },
      { scene: 'map', args: { cur: -1 }, cam: { z0: 1, z1: 1.18, dur: 12 }, place: 'Repubblica di Calvera', lines: G.STORY.intro[0] },
      { scene: 'rocca', args: { k: 0, k1: .28 }, cam: { z0: 1.35, x0: 96, x1: 138, y0: 78, y1: 36, dur: 9 }, place: 'Rocca Ardenza · la capitale', lines: G.STORY.intro[1] },
      { scene: 'dossier', args: { emblem: 'scudo' }, cam: { z0: 1.35, z1: 1, y0: 46, dur: 6 }, place: 'Scudo · squadra nazionale di risposta', lines: G.STORY.intro[2] },
      { scene: 'map', args: { cur: 'all' }, cam: { z0: 1.18, z1: 1, dur: 9 }, glitch: true, place: 'Repubblica di Calvera', lines: G.STORY.intro[3], hold: 3200 },
    ], { cine: true }).then(enterMission);
  }
  const RULES = `<p class="kicker">Come si gioca</p><h2>Le regole in breve</h2>
      <ul class="rules">
        <li><strong>Prepara.</strong> Prima di ogni missione leggi il briefing e scegli quali carte portare. Il mazzo è piccolo: non puoi coprire tutto.</li>
        <li><strong>Schiera.</strong> Durante l'attacco metti ogni difesa nella fase della kill chain in cui agisce. Ogni carta costa crediti.</li>
        <li><strong>Indaga.</strong> Le tecniche del red team sono coperte: il SOC può rivelarne una per 1 credito.</li>
        <li><strong>Avanza.</strong> L'attacco si risolve in 3 turni. Ogni blocco aumenta Copertura e Molt, e nelle fasi 1-3 il Molt vale doppio.</li>
        <li><strong>Occhio alle riserve.</strong> Un attaccante bloccato può cambiare tecnica: due difese diverse nella stessa fase fermano anche il ripiego.</li>
        <li><strong>Rinforza.</strong> Tra una missione e l'altra spendi i fondi in carte nuove, joker e potenziamenti.</li>
      </ul>`;
  function title() {
    mode = 'title';
    renderJokers(); ui();
    A.track('cut');
    const s = loadSave();
    $('contBtn').hidden = !s;
    if (s) $('contBtn').textContent = `Continua · missione ${s.enc + (s.stage === 'shop' ? 2 : 1)}`;
    G.cut.title();
  }
  const begin = fn => { A.music(true); syncAudio(); G.cut.closeTitle(); fn(); };
  $('startBtn').addEventListener('click', () => {
    if (!loadSave()) return begin(newRun);
    U.modal('<p class="kicker">Campagna salvata</p><h2>Ricominciare da capo?</h2><p>C\'è una campagna in corso. Iniziandone una nuova il salvataggio verrà sostituito.</p>', [
      { label: 'Annulla', fn: U.closeModal },
      { label: 'Ricomincia', primary: true, fn: () => { U.closeModal(); clearSave(); begin(newRun); } },
    ]);
  });
  $('contBtn').addEventListener('click', () => { const s = loadSave(); if (s) begin(() => resume(s)); });
  $('helpBtn').addEventListener('click', () => U.modal(RULES, [{ label: 'Chiudi', primary: true, fn: U.closeModal }]));
  function syncAudio() {
    el.sfxBtn.textContent = A.isSfx() ? 'Effetti attivi' : 'Effetti spenti';
    el.sfxBtn.setAttribute('aria-pressed', String(!A.isSfx()));
    el.musBtn.textContent = A.isMusic() ? 'Musica attiva' : 'Musica spenta';
    el.musBtn.setAttribute('aria-pressed', String(!A.isMusic()));
  }

  el.advanceBtn.addEventListener('click', advance);
  el.discardBtn.addEventListener('click', discardSel);
  el.howBtn.addEventListener('click', () => { if (mode === 'plan' && sel) openSim(defShots(sel._c.d)); });
  el.sfxBtn.addEventListener('click', () => { A.setSfx(!A.isSfx()); syncAudio(); });
  el.musBtn.addEventListener('click', () => { A.music(!A.isMusic()); syncAudio(); });

  G.game = { state: () => ({ run, enc, mode }), newRun, simTech: k => openSim(techShots(G.T[k])), simDef: k => openSim(defShots(G.D[k])) };
  syncAudio();
  title();
})(window.SLC);
