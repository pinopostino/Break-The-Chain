/* Logica di gioco: campagna, briefing e scelta del mazzo, attacchi a tre turni, joker, negozio. */
(function (G) {
  const U = G.ui, A = G.audio, $ = U.$;
  const HAND = 5, INCOME = 4, MAX_JOKERS = 4, LIVES = 3, DISCARDS = 3, DECK_SIZE = 10;
  const SHOP_INFO = 'Passa sopra una carta o un joker per leggere cosa fa. Le carte comprate entrano nella collezione: sceglierai quali portare nel briefing.';
  const prepInfo = () => run.enc < HINT_UNTIL
    ? 'Clicca una tecnica del profilo per vedere l\'attacco in azione; passandoci sopra si evidenziano le carte che la fermano. Nel mazzo c\'è posto per poche carte: non puoi coprire tutto.'
    : 'Clicca una tecnica del profilo per vedere l\'attacco in azione. Da questa missione nessuno ti dice quali carte la fermano: decidi tu, o guarda la simulazione. Nel mazzo c\'è posto per poche carte: non puoi coprire tutto.';

  const el = {};
  ['table', 'track', 'hand', 'info', 'stamp', 'debrief', 'base', 'mult', 'total', 'goal', 'multBox', 'advanceBtn', 'discardBtn',
    'coins', 'credN', 'jokers', 'eyebrow', 'foeName', 'reserves', 'lives', 'funds', 'deckN', 'steps', 'arena', 'shop', 'prep', 'sfxBtn', 'musBtn', 'howBtn']
    .forEach(id => { el[id] = $(id); });

  // Dalla missione HINT_UNTIL in poi il gioco non dice più quali difese fermano una tecnica: lo dice solo nel debrief.
  const HINT_UNTIL = 2;
  // Molt di base per un blocco: le fasi 1-3 valgono doppio.
  const multOf = p => p < 3 ? 2 : 1;

  let run = null, enc = null, mode = 'title', sel = null, defaultInfo = '', shopState = null, prepSel = null, prepFocus = null, uid = 0;
  const cols = [];

  const newCard = (k, ed) => ({ id: ++uid, d: G.D[k], ed: ed || null, bonus: 0 });
  const has = k => !!run && run.jokers.includes(k);
  const bossIs = k => !!enc && !!enc.foe.boss && enc.foe.boss.k === k;
  const slotCost = s => s._free ? 0 : U.costOf(s._c);
  const scoutCost = () => enc.freeScouts > 0 ? 0 : 1;
  const credits = n => `${n} ${n === 1 ? 'credito' : 'crediti'}`;
  const deckSize = () => Math.min(DECK_SIZE, run.coll.length);
  const hints = () => !run || run.enc < HINT_UNTIL;
  const stopsText = t => `La fermano: ${G.countersOf(t.k).map(d => d.n).join(', ')}.`;
  // full = true mostra sempre le contromisure (debrief); altrimenti solo nelle prime missioni.
  const techInfo = (t, full) => `<strong>${t.n}</strong> · ${t.id}. ${t.d}${full || hints() ? ' ' + stopsText(t) : ''}`;
  const jokerInfo = j => `<strong>${j.n}</strong> · ${j.e} ${j.l}`;

  function say(html) {
    const t = mode === 'shop' ? $('shopInfo') : mode === 'prep' ? $('prepInfo') : el.info;
    if (t) t.innerHTML = html;
  }
  // Annuncio per i lettori di schermo: solo rifiuti, verdetti ed esito, non ogni passaggio del mouse.
  function announce(html) {
    const a = $('announce');
    if (!a) return;
    const d = document.createElement('div'); d.innerHTML = html;
    a.textContent = ''; setTimeout(() => { a.textContent = d.textContent; }, 30);
  }
  function deny(target, msg) { if (target) U.retrigger(target, 'shake'); A.blip(140, .12, 'sawtooth', .04); if (msg) { say(msg); announce(msg); } }
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
  // Cosa succede se una fase passa: lo si vede sulla colonna prima di decidere, non solo nel debrief.
  const STAKES = {
    4: 'Se la fase 5 passa, l\'attaccante lascia una backdoor: nella prossima missione avrà 1 riserva in più.',
    6: 'Se la fase 7 passa, l\'attaccante raggiunge l\'obiettivo: l\'attacco è perso qualunque sia il punteggio. Esfiltrazione: nessuna fase nota nella prossima missione. Ransomware o distruzione dati: perdi fino a 3 fondi.',
  };
  G.PHASES.forEach((name, p) => {
    const c = document.createElement('div');
    c.className = 'col';
    c.innerHTML = `<div class="ph"><b>${p + 1}</b><span>${name}</span></div>
      <div class="phmeta"><span class="molt" title="Molt per ogni blocco in questa fase">Molt +${multOf(p)}</span>${STAKES[p] ? `<button type="button" class="stake" aria-label="Conseguenza se la fase ${p + 1} passa">!</button>` : ''}</div>
      <div class="chain" aria-hidden="true"><i></i><i></i></div>
      <div class="rslot"></div>
      <p class="poss"></p>
      <div class="bslot" role="button" tabindex="0" aria-label="Fase ${p + 1}, ${name}: schiera qui una difesa"><span class="plus">+</span></div>
      <div class="verdict"></div>`;
    el.track.appendChild(c);
    const o = { el: c, rslot: c.querySelector('.rslot'), bslot: c.querySelector('.bslot'), plus: c.querySelector('.plus'), verdict: c.querySelector('.verdict'), poss: c.querySelector('.poss'), red: null };
    o.bslot.addEventListener('click', () => dropOn(p));
    o.bslot.addEventListener('keydown', e => { if (e.target === o.bslot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); dropOn(p); } });
    const stake = c.querySelector('.stake');
    if (stake) { hoverInfo(stake, () => STAKES[p]); stake.addEventListener('click', () => say(STAKES[p])); }
    cols.push(o);
  });
  // Sotto ogni carta coperta: le tecniche che il profilo dell'avversario prevede per quella fase.
  function possText(p) {
    if (enc.foe.hide.includes(p)) return 'Possibili: nessuna informazione';
    const pool = enc.foe.pool[p];
    return `Possibili: ${pool.map(k => G.T[k].n).join(' / ')}`;
  }

  /* ---------- pannelli di stato ---------- */
  function renderStatus() {
    el.lives.innerHTML = Array.from({ length: LIVES }, (_, i) => `<i class="${i < run.lives ? '' : 'off'}"></i>`).join('');
    el.lives.setAttribute('aria-label', `${run.lives} su ${LIVES}`);
    el.funds.textContent = run.funds;
    el.deckN.textContent = run.coll.length;
  }
  function renderReserves() {
    el.reserves.innerHTML = enc.reservesMax
      ? `Riserve dell'attaccante <span class="pipsrow red" aria-label="${enc.reserves} su ${enc.reservesMax}">${Array.from({ length: enc.reservesMax }, (_, i) => `<i class="${i < enc.reserves ? '' : 'off'}"></i>`).join('')}</span>`
      : 'Attaccante senza riserve';
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
      s += 'Scegli una difesa dalla mano e schierala in una fase: i quadratini blu sulla carta indicano dove funziona. Puoi schierare anche sulle fasi dei turni successivi. Clicca una carta coperta per farla analizzare dal SOC: la prima analisi di ogni turno è gratis.';
    } else {
      s += `Avanza risolve le fasi ${ph[0] + 1}-${ph[ph.length - 1] + 1}. I crediti non spesi e le carte in mano restano per il turno dopo, e ogni fase accetta fino a due difese.`;
    }
    if (enc.freeScouts > 0) s += ' Analisi del SOC gratuita disponibile.';
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
    const s = U.redEl(p);
    hoverInfo(s, () => enc.revealed[p]
      ? `${techInfo(enc.chain[p], mode === 'debrief')} Clicca per vederla in azione.`
      : mode === 'plan' ? `Carta coperta. ${possText(p)}. Clicca per farla analizzare dal SOC: costa ${credits(scoutCost())}.` : `Carta coperta. ${possText(p)}.`);
    s.addEventListener('click', () => {
      if (enc.revealed[p] && (mode === 'plan' || mode === 'debrief')) return openSim(techShots(enc.chain[p]));
      scout(p, s);
    });
    return s;
  }
  // La faccia della carta si scrive nel DOM solo quando si gira: prima non c'è nulla da leggere.
  function flipUp(p) {
    enc.revealed[p] = true;
    const r = cols[p].red, t = enc.chain[p];
    U.paintRed(r, t);
    r.classList.remove('down');
    r.setAttribute('aria-label', `Fase ${p + 1}: ${t.n}, ${t.id}`);
  }
  function scout(p, s) {
    if (mode !== 'plan' || enc.revealed[p]) return;
    const c = scoutCost();
    if (enc.credits < c) return deny(s, 'Crediti insufficienti per l\'analisi del SOC.');
    enc.credits -= c;
    if (enc.freeScouts > 0) { enc.freeScouts--; if (has('soc247') && enc.turn === 0) fire('soc247'); }
    flipUp(p); A.blip(700, .08); ui();
    G.fx.burst(s, { colors: ['#ffb000', '#e4ebec'], n: 10, speed: 170 });
    say(techInfo(enc.chain[p]));
    saveAttack();
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
    saveAttack();
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

  /* ---------- salvataggio ----------
     La campagna si salva al briefing, nel negozio (offerte comprese), a ogni turno dell'attacco e dopo ogni analisi o scarto.
     Così ricaricare la pagina non annulla una sconfitta e non rinnova le offerte del negozio. */
  const SAVE_KEY = 'spezza-la-catena-v1';
  function save(stage, extra) {
    try {
      const s = {
        v: 1, stage, enc: run.enc, lives: run.lives, funds: run.funds, jokers: run.jokers, flags: run.flags,
        coll: run.coll.map(c => ({ k: c.d.k, ed: c.ed, bonus: c.bonus })),
        deck: run.deck.map(c => run.coll.indexOf(c)).filter(i => i >= 0),
      };
      if (stage === 'shop' && shopState) {
        s.shop = {
          cards: shopState.cards.map(o => ({ k: o.card.d.k, ed: o.card.ed, price: o.price, sold: o.sold })),
          jokers: shopState.jokers.map(o => ({ k: o.j.k, price: o.price, sold: o.sold })),
        };
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign(s, extra)));
    } catch (e) { /* salvataggio non disponibile: si gioca lo stesso */ }
  }
  // Fotografia dell'attacco in corso. Le carte si identificano con la loro posizione nella collezione.
  function saveAttack(resolving) {
    if (!enc || !run) return;
    const ix = c => run.coll.indexOf(c);
    save('attack', { att: {
      resolving: !!resolving,
      chain: enc.chain.map(t => t.k), revealed: enc.revealed, result: enc.result, locked: enc.locked,
      placed: enc.placed.map(a => a.map(s => ({ i: ix(s._c), paid: s._paid, free: s._free }))),
      hand: [...el.hand.children].map(s => ({ i: ix(s._c), free: s._free })),
      draw: enc.draw.map(ix), pile: enc.pile.map(ix),
      verdicts: cols.map(c => c.verdict.textContent),
      log: enc.log.map(l => Object.assign({}, l, { techs: l.techs.map(t => t.k) })),
      reserves: enc.reserves, reservesMax: enc.reservesMax, turn: enc.turn, credits: enc.credits, chips: enc.chips, mult: enc.mult,
      blocked: enc.blocked, layers: enc.layers, hits: enc.hits, discards: enc.discards, freeScouts: enc.freeScouts, notes: enc.notes, turnNote: enc.turnNote,
    } });
  }
  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || s.v !== 1 || !G.FOES[s.enc] || !Array.isArray(s.coll) || s.coll.some(c => !G.D[c.k])) return null;
      if (s.stage === 'shop' && !G.FOES[s.enc + 1]) return null;
      if (s.stage === 'attack' && (!s.att || !Array.isArray(s.att.chain) || s.att.chain.some(k => !G.T[k]))) return null;
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
    if (s.stage === 'shop') {
      shopState = s.shop ? {
        cards: s.shop.cards.filter(o => G.D[o.k]).map(o => ({ card: newCard(o.k, o.ed), price: o.price, sold: o.sold })),
        jokers: s.shop.jokers.filter(o => G.J[o.k]).map(o => ({ j: G.J[o.k], price: o.price, sold: o.sold })),
      } : null;
      openShop(true);
    } else if (s.stage === 'attack') {
      try { resumeEncounter(s.att); } catch (e) { openPrep(); }
    } else openPrep();
  }

  /* ---------- briefing e scelta del mazzo ---------- */
  function openPrep() {
    const foe = G.FOES[run.enc];
    mode = 'prep'; sel = null; prepFocus = null; defaultInfo = prepInfo();
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
    if (run.flags.backdoor) notes.push('Una backdoor rimasta dall\'attacco precedente dà all\'attaccante 1 riserva in più.');
    if (run.flags.noIntel) notes.push('I dati esfiltrati nell\'attacco precedente ti lasciano senza fasi note all\'inizio.');
    notes.push('Ferma la fase 7, Obiettivo: se passa, l\'attacco è perso anche con la Difesa sopra la soglia.');
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
      <p class="info" id="prepInfo">${prepInfo()}</p>
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
      const show = () => { say(techInfo(t)); if (hints()) grid.querySelectorAll('.slot').forEach(s => s.classList.toggle('hint', s._c.d.x.includes(t.k))); };
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
      reserves: foe.reserves, reservesMax: foe.reserves, turn: -1, credits: 0, chips: 0, mult: 1, blocked: 0, layers: 0, hits: 0,
      draw: U.shuffle(run.deck.slice()), pile: [], discards: DISCARDS, freeScouts: 0, log: [], notes, turnNote: '',
    };
    if (run.flags.backdoor) { enc.reserves++; enc.reservesMax++; }
    const intelN = run.flags.noIntel ? 0 : foe.intel;
    run.flags = {};
    if (has('shadow')) {
      // Mai la fase 7: un debito non deve rendere l'attacco impossibile da vincere.
      const p = Math.random() * 6 | 0;
      enc.locked[p] = true;
      notes.push(`Shadow IT: la fase ${p + 1} non può ricevere difese.`);
    }
    // Le fasi note si scelgono solo tra quelle incerte: una fase con un'unica tecnica possibile è già nota dal briefing.
    const unsure = [0, 1, 2, 3, 4, 5, 6].filter(p => foe.pool[p].length > 1 || foe.hide.includes(p));
    const intel = U.shuffle(unsure).slice(0, intelN);
    if (has('bounty') && !intel.includes(3)) {
      if (run.funds > 0) {
        run.funds--; intel.push(3);
        notes.push('Bug bounty: la fase 4, Exploit, è già nota. Hai pagato 1 fondo.');
      } else notes.push('Bug bounty: senza fondi il programma è sospeso per questo attacco.');
    }

    showArena();
    intel.forEach((p, i) => {
      enc.revealed[p] = true;
      setTimeout(() => { flipUp(p); A.blip(600 + i * 90, .07); }, 350 + i * 240);
    });
    startTurn(0);
  }
  // Prepara il tavolo per l'attacco in enc: usato sia all'inizio sia quando si riprende un salvataggio.
  function showArena() {
    const foe = enc.foe;
    sel = null; defaultInfo = '';
    A.track('attack');
    el.table.classList.remove('offfield');
    el.shop.hidden = true; el.prep.hidden = true; el.arena.hidden = false;
    el.stamp.hidden = true; el.debrief.hidden = true; el.hand.hidden = false;
    el.hand.textContent = ''; el.info.textContent = '';
    el.eyebrow.textContent = `Missione ${run.enc + 1} di ${G.FOES.length} · ${foe.city} · ${foe.tag}`;
    el.foeName.textContent = foe.n;
    el.goal.textContent = foe.goal;
    el.base.textContent = enc.chips; el.mult.textContent = enc.mult; el.total.textContent = enc.chips * enc.mult;
    el.multBox.classList.toggle('hot', enc.mult >= 6); el.total.closest('.box').classList.remove('won');
    U.retrigger(el.arena, 'enter');
    cols.forEach((c, p) => {
      c.el.className = 'col'; c.verdict.textContent = '';
      c.rslot.textContent = ''; c.red = makeRed(p); c.rslot.appendChild(c.red);
      c.poss.textContent = possText(p);
      c.bslot.querySelectorAll('.slot').forEach(x => x.remove());
      c.bslot.className = 'bslot' + (enc.locked[p] ? ' locked' : '');
      c.bslot.tabIndex = enc.locked[p] ? -1 : 0;
      c.plus.textContent = enc.locked[p] ? 'Shadow IT' : '+';
    });
    renderStatus(); renderJokers(); renderReserves();
    window.scrollTo(0, 0);
  }
  // Riprende un attacco salvato esattamente dove era: stesso turno, stessa mano, stesse carte coperte.
  function resumeEncounter(a) {
    const foe = G.FOES[run.enc], C = i => run.coll[i];
    const card = o => { const c = C(o.i); if (!c) throw new Error('carta mancante'); return c; };
    enc = {
      foe, chain: a.chain.map(k => G.T[k]), revealed: a.revealed.slice(), result: a.result.slice(), locked: a.locked.slice(),
      placed: Array.from({ length: 7 }, () => []), draw: a.draw.map(C).filter(Boolean), pile: a.pile.map(C).filter(Boolean),
      log: a.log.map(l => Object.assign({}, l, { techs: l.techs.map(k => G.T[k]) })),
      reserves: a.reserves, reservesMax: a.reservesMax, turn: a.turn, credits: a.credits, chips: a.chips, mult: a.mult,
      blocked: a.blocked, layers: a.layers || 0, hits: a.hits, discards: a.discards, freeScouts: a.freeScouts || 0, notes: a.notes || [], turnNote: a.turnNote || '',
    };
    showArena();
    cols.forEach((c, p) => {
      if (enc.revealed[p]) flipUp(p);
      a.placed[p].forEach(o => {
        const s = makeBlue(card(o));
        s._at = p; s._paid = o.paid; s._free = o.free;
        if (s._free) U.paintBlue(s);
        enc.placed[p].push(s); c.bslot.appendChild(s);
      });
      slotState(p);
      c.verdict.textContent = a.verdicts[p] || '';
      if (enc.result[p]) c.el.classList.add(enc.result[p] === 'ok' ? 'blocked' : 'passed');
      c.el.classList.toggle('now', enc.result[p] === null && G.TURNS[enc.turn].ph.includes(p));
    });
    a.hand.forEach(o => {
      const s = makeBlue(card(o));
      if (o.free) { s._free = true; U.paintBlue(s); }
      el.hand.appendChild(s);
    });
    U.fan(el.hand);
    mode = 'plan';
    renderSteps(); ui(); say(defaultInfo);
    // Se la pagina è stata chiusa durante la risoluzione, le difese erano già schierate: si risolve subito.
    if (a.resolving) advance();
  }
  function startTurn(t) {
    enc.turn = t; enc.turnNote = t === 0 ? enc.notes.join(' ') : '';
    enc.credits += INCOME - (has('legacy') ? 1 : 0) - (bossIs('friday') ? 1 : 0);
    // Una analisi gratuita a ogni turno; SOC 24/7 le rende tutte gratuite nel primo turno; la regola Silenzioso le toglie.
    enc.freeScouts = bossIs('silent') ? 0 : has('soc247') && t === 0 ? 7 : 1;
    if (has('legacy')) fire('legacy');
    // La gratuità dello Stagista vale un turno solo, anche per le carte già schierate su fasi future.
    [...el.hand.children, ...enc.placed.flat()].forEach(s => { if (s._free) { s._free = false; U.paintBlue(s); } });
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
    saveAttack();
  }

  async function award(s, p) {
    const pts = U.ptsOf(s._c);
    enc.chips += pts;
    enc.mult += multOf(p) + (s._c.ed === 'holo' ? 1 : 0) + (has('zerotrust') && p >= 3 ? 1 : 0);
    U.retrigger(s, 'bump'); U.pop(s, '+' + pts);
    G.fx.burst(s, { colors: ['#ffb000', '#2473d6', '#e4ebec'], n: 16, up: true, speed: 300 });
    setNum(el.base, enc.chips);
    A.blip(440 * 2 ** (enc.hits * 2 / 12), .1); enc.hits++;
    await U.sleep(200);
    setNum(el.mult, enc.mult); el.multBox.classList.toggle('hot', enc.mult >= 6);
    A.blip(660 * 2 ** (enc.hits * 2 / 12), .08, 'square', .04);
    if (has('zerotrust') && p >= 3) fire('zerotrust');
    if (p < 3) quake();
    // Il totale non diventa «vinto» prima della fine: la vittoria si decide anche sulla fase 7.
    el.total.textContent = enc.chips * enc.mult;
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
  // Scopre la prima carta ancora coperta tra le fasi dei turni successivi. Restituisce la fase scoperta, o -1.
  async function exposeNext(p, why) {
    const later = G.TURNS.slice(enc.turn + 1).flatMap(T => T.ph);
    const q = later.find(x => x > p && !enc.revealed[x]);
    if (q === undefined) return -1;
    flipUp(q); A.blip(760, .07);
    G.fx.burst(cols[q].red, { colors: ['#ffb000', '#e4ebec'], n: 10, speed: 170 });
    say(`${why} La fase ${q + 1} è scoperta: ${enc.chain[q].n}.`);
    await U.sleep(520);
    return q;
  }
  async function resolvePhase(p) {
    const c = cols[p], cards = enc.placed[p], tech = enc.chain[p];
    const entry = { p, techs: [tech], ok: false, by: [], wrong: [] };
    const stops = (s, t) => s._c.d.x.includes(t.k);
    c.el.classList.add('active');
    if (!enc.revealed[p]) { flipUp(p); A.blip(200, .06, 'triangle', .07); await U.sleep(480); }
    else await U.sleep(220);

    const b1 = cards.find(s => stops(s, tech));
    if (b1 && enc.reserves > 0) {
      // Il premio arriva solo a ripiego risolto: se il ripiego passa, la fase non vale nulla.
      const alt = altOf(p, tech), off = !enc.foe.pool[p].includes(alt.k);
      enc.reserves--; renderReserves();
      U.retrigger(b1, 'bump');
      say(`<strong>Ripiego.</strong> ${tech.n} è bloccata, ma l'attaccante spende una riserva e cambia tecnica: ${alt.n}${off ? ', una tecnica fuori dal profilo' : ''}.`);
      await swapRed(p, alt);
      entry.techs.push(alt);
      // Due difese diverse: una per la tecnica iniziale, l'altra per il ripiego.
      const pair = cards.flatMap(x => cards.filter(y => y !== x && stops(x, tech) && stops(y, alt)).map(y => [x, y]))[0];
      if (pair) {
        await award(pair[0], p); await award(pair[1], p);
        entry.by.push(pair[0]._c.d.n, pair[1]._c.d.n); entry.ok = true;
        if (has('purple')) { enc.mult += 3; fire('purple'); setNum(el.mult, enc.mult); el.total.textContent = enc.chips * enc.mult; }
        c.verdict.textContent = 'Doppio blocco';
      } else {
        entry.by.push(b1._c.d.n);
        c.verdict.textContent = 'Ripiego riuscito'; strike(p);
        A.blip(150, .16, 'sawtooth', .05);
      }
    } else if (b1) {
      await award(b1, p);
      entry.by.push(b1._c.d.n); entry.ok = true;
      c.verdict.textContent = 'Bloccata';
    } else if (cards.length) {
      c.verdict.textContent = 'Aggirata'; strike(p);
      entry.wrong = cards.map(s => s._c.d.n);
      A.blip(180, .14, 'sawtooth', .04);
    } else {
      c.verdict.textContent = 'Passa'; strike(p);
      A.blip(120, .16, 'sawtooth', .05);
    }

    c.el.classList.add(entry.ok ? 'blocked' : 'passed');
    announce(`Fase ${p + 1}, ${G.PHASES[p]}: ${c.verdict.textContent}.`);
    if (entry.ok) { enc.blocked++; if (cards.length >= 2) enc.layers++; }
    enc.result[p] = entry.ok ? 'ok' : 'ko';
    enc.log.push(entry);
    await U.sleep(520);
    c.el.classList.remove('active', 'now');
    // La catena: un anello spezzato costringe l'attaccante a scoprirsi più avanti.
    if (entry.ok) await exposeNext(p, `<strong>Catena spezzata in fase ${p + 1}.</strong> L'attaccante deve ripartire allo scoperto.`);
    else if (has('honey') && await exposeNext(p, '<strong>Honeypot.</strong> L\'attaccante passa, ma si tradisce.') >= 0) fire('honey');
  }
  async function advance() {
    if (mode !== 'plan') return;
    mode = 'resolve';
    if (sel) { sel.classList.remove('sel'); sel = null; }
    saveAttack(true);
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
    else if (l.ok) txt = `Bloccata da ${l.by[0]}. L'attaccante ha ripiegato su ${t1.n}, fermata da ${l.by[1]}.`;
    else if (t1) txt = `Bloccata da ${l.by[0]}, ma il ripiego su ${t1.n} è passato: serviva una seconda difesa diversa. Lo fermano: ${stops(t1)}.`;
    else if (l.wrong.length) txt = `${l.wrong.join(' e ')} non ${l.wrong.length > 1 ? 'la fermano' : 'la ferma'}. La fermano: ${stops(t0)}.`;
    else txt = `Nessuna difesa schierata. La fermano: ${stops(t0)}.`;
    return `<li class="${l.ok ? 'ok' : ''}"><b>${l.p + 1}</b><span><strong>${t0.n}</strong> <small>${t0.id}</small><br>${txt}${l.ok ? '' : ` <button type="button" class="btn small see" data-k="${(t1 || t0).k}">Guarda l'attacco</button>`}</span></li>`;
  }
  async function endEncounter() {
    mode = 'ending'; ui();
    if (has('depth') && enc.layers >= 3) {
      enc.mult *= 2; fire('depth'); setNum(el.mult, enc.mult); el.multBox.classList.add('hot');
      quake(); A.blip(880, .14);
      await U.sleep(600);
    }
    const total = enc.chips * enc.mult, foe = enc.foe;
    // Si vince solo se l'attaccante non ha raggiunto l'obiettivo: una Difesa alta non compensa la fase 7 passata.
    const reached = enc.result[6] !== 'ok', win = total >= foe.goal && !reached;
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
    const cons = [], last = run.enc === G.FOES.length - 1;
    if (enc.result[4] === 'ko') {
      run.flags.backdoor = true;
      cons.push('Fase 5 passata: l\'attaccante lascia una backdoor. Nella prossima missione avrà 1 riserva in più.');
    }
    if (reached) {
      if (enc.chain[6].k === 'exfil') {
        run.flags.noIntel = true;
        cons.push('Fase 7 passata: i dati esfiltrati aiutano chi verrà dopo. Nella prossima missione non avrai fasi note all\'inizio.');
      } else {
        const lost = Math.min(3, run.funds); run.funds -= lost;
        cons.push(`Fase 7 passata: ${enc.chain[6].k === 'ransom' ? 'il ransomware cifra i dati' : 'i dati vengono distrutti'}. Il ripristino ti costa ${lost} fondi.`);
      }
    }
    if (!win) {
      const why = reached ? 'L\'attaccante ha raggiunto l\'obiettivo' : 'Soglia non raggiunta';
      if (has('insurance') && !last) {
        run.jokers = run.jokers.filter(k => k !== 'insurance'); renderJokers();
        cons.push(`${why}. La polizza cyber copre il danno e si esaurisce: non perdi Resilienza.`);
      } else {
        run.lives--;
        cons.push(`${why}: perdi 1 Resilienza.`);
      }
    }
    const dead = run.lives <= 0, closing = dead || last;
    // Nell'ultima missione non c'è un negozio dopo: niente ricompensa da mostrare.
    const reward = closing ? 0 : win ? 5 + Math.min(3, enc.credits) + (foe.boss ? 2 : 0) : 2;
    run.funds += reward;
    renderStatus();
    // Il salvataggio passa subito al negozio: ricaricare la pagina non annulla l'esito.
    shopState = null;
    if (closing) clearSave(); else save('shop');

    const head = win ? `Attacco respinto: ${enc.blocked} fasi bloccate su 7`
      : reached ? 'Violazione: l\'attaccante ha raggiunto l\'obiettivo' : `Violazione: Difesa ${total} su ${foe.goal}`;
    const lead = win ? 'Hai fermato l\'attaccante prima dell\'obiettivo. Ogni fase bloccata è un anello spezzato; quelle rimaste scoperte hanno comunque un costo.'
      : reached ? 'La fase 7 è passata: qualunque punteggio tu abbia fatto, l\'attaccante ha ottenuto ciò che voleva. Qui sotto trovi cosa avrebbe fermato ogni tecnica.'
        : 'L\'attaccante ha trovato troppe fasi scoperte. Qui sotto trovi cosa avrebbe fermato ogni tecnica.';
    announce(`${head}.`);
    el.debrief.innerHTML = `<h2>${head}</h2>
      <p>${lead}</p>
      <ol>${enc.log.map(logLine).join('')}</ol>
      ${cons.length ? `<h3>Conseguenze</h3><ul class="cons">${cons.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
      <div class="realcase"><h3>Caso reale · ${foe.real.t}</h3><p>${foe.real.d}</p><p><strong>Lezione.</strong> ${foe.real.l}</p></div>
      ${closing ? '' : `<p class="reward">Ricompensa: +${reward} fondi${win && enc.credits ? ` (di cui ${Math.min(3, enc.credits)} per i crediti risparmiati)` : ''}.</p>`}
      <button class="btn primary" id="nextBtn" type="button">${closing ? 'Fine della campagna' : 'Vai al negozio'}</button>`;
    el.debrief.querySelectorAll('.see').forEach(b => b.addEventListener('click', () => openSim(techShots(G.T[b.dataset.k]))));
    $('nextBtn').addEventListener('click', () => {
      A.blip(380, .08, 'triangle', .06);
      if (dead) return ending(false);
      if (last) return ending(win);
      if (!win) return openShop();
      // Dopo una vittoria: il cerchio nero copre un altro pezzo di luna.
      mode = 'cut'; A.track('cut');
      const n = G.FOES.length;
      G.cut.play([{ scene: 'eclipse', args: { from: run.enc / n, k: (run.enc + 1) / n }, cam: { z0: 1, z1: 1.18, dur: 8 }, place: `${foe.city} · cosa scopri`, lines: sentences(foe.after), hold: 3000 }], { cine: true }).then(() => openShop());
    });
    await U.sleep(900);
    el.hand.hidden = true; el.debrief.hidden = false;
    defaultInfo = 'Passa sopra le carte dell\'attaccante per rileggere ogni tecnica e le difese che la fermano.';
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
      : `<p class="kicker">Campagna terminata · missione ${run.enc + 1} di ${G.FOES.length}</p><h2>Calvera è al buio</h2><p>Puoi riprovare: le missioni restano le stesse, ma le tecniche che gli avversari usano cambiano a ogni campagna.</p>`,
      [{ label: 'Nuova campagna', primary: true, fn: newRun }]);
  }

  /* ---------- negozio ---------- */
  // I debiti tecnici non occupano posti joker: sono un rischio accettato, non un potenziamento.
  const jokerCount = () => run.jokers.filter(k => !G.J[k].debt).length;
  function rollShop() {
    const next = G.FOES[run.enc + 1], eds = ['foil', 'holo', 'cert'];
    const owned = new Set(run.coll.map(c => c.d.k)), cards = [];
    // Prima le carte nuove che servono alla prossima missione, poi altre carte nuove, infine un'edizione speciale.
    (next.wants || []).forEach(k => { if (!owned.has(k) && cards.length < 2) cards.push({ card: newCard(k), price: 3, sold: false }); });
    U.shuffle(G.DEFS.filter(d => !owned.has(d.k) && !cards.some(o => o.card.d.k === d.k)))
      .forEach(d => { if (cards.length < 2) cards.push({ card: newCard(d.k), price: 3, sold: false }); });
    U.shuffle(G.DEFS.filter(d => !cards.some(o => o.card.d.k === d.k)))
      .forEach(d => { if (cards.length < 3) cards.push({ card: newCard(d.k, eds[Math.random() * eds.length | 0]), price: 4, sold: false }); });
    shopState = {
      cards,
      jokers: U.shuffle(G.JOKERS.filter(j => !j.debt && !run.jokers.includes(j.k))).slice(0, 2).map(j => ({ j, price: j.price, sold: false })),
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
      [{ label: 'Annulla', fn: U.closeModal }], { dismiss: true });
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
      <div class="shoprow"><h3>I tuoi joker <small>${jokerCount()} su ${MAX_JOKERS}</small></h3><div class="offers" id="myJokers"></div></div>
      <div class="shoprow"><h3>Debiti tecnici <small>fondi subito, un punto debole finché non lo estingui</small></h3><div class="offers" id="offDebts"></div></div>
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

    const full = jokerCount() >= MAX_JOKERS;
    shopState.jokers.forEach(o => {
      const t = U.jokerEl(o.j, false);
      hoverInfo(t, () => jokerInfo(o.j));
      t.addEventListener('click', () => say(jokerInfo(o.j)));
      $('offJokers').appendChild(offer(t, mkBtn(o.sold ? 'Comprato' : `Compra · ${o.price}`, () => {
        if (jokerCount() >= MAX_JOKERS) return deny(null, `Hai già ${MAX_JOKERS} joker: vendine uno per fare spazio.`);
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
      // Un debito non si rivende: si estingue pagando.
      $('myJokers').appendChild(offer(t, j.debt
        ? mkBtn(`Estingui · ${j.price}`, () => {
          if (!spend(j.price)) return;
          run.jokers = run.jokers.filter(x => x !== k); renderShop();
        }, { cls: 'buy', off: run.funds < j.price })
        : mkBtn('Vendi · +2', () => {
          run.jokers = run.jokers.filter(x => x !== k); run.funds += 2; A.blip(300, .08, 'triangle'); renderShop();
        })));
    });

    const debts = G.JOKERS.filter(j => j.debt && !run.jokers.includes(j.k));
    if (!debts.length) $('offDebts').innerHTML = '<p class="nojoker">Hai già accettato tutti i debiti.</p>';
    debts.forEach(j => {
      const t = U.jokerEl(j, false);
      const info = () => `${jokerInfo(j)} Accettarlo ti dà ${j.gain} fondi subito; estinguerlo costa ${j.price}.`;
      hoverInfo(t, info);
      t.addEventListener('click', () => say(info()));
      $('offDebts').appendChild(offer(t, mkBtn(`Accetta · +${j.gain}`, () => {
        run.jokers.push(j.k); run.funds += j.gain; A.blip(300, .1, 'sawtooth', .05); renderShop();
      }, { cls: 'buy' })));
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
  // keep = true riusa le offerte già estratte (ripresa da salvataggio) invece di estrarne di nuove.
  function openShop(keep) {
    mode = 'shop';
    A.track('shop');
    el.arena.hidden = true; el.prep.hidden = true; el.shop.hidden = false;
    el.table.classList.add('offfield');
    el.eyebrow.textContent = `Dopo la missione ${run.enc + 1} di ${G.FOES.length}`;
    el.foeName.textContent = 'Negozio';
    el.reserves.textContent = ''; el.steps.innerHTML = '';
    if (!keep || !shopState) rollShop();
    renderShop();
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
        <li><strong>Schiera.</strong> Durante l'attacco metti ogni difesa nella fase della kill chain in cui agisce. Ogni carta costa crediti. Puoi schierare anche sulle fasi dei turni successivi e riprendere una carta finché la sua fase non è risolta. Le carte in mano e i crediti non spesi restano per il turno dopo.</li>
        <li><strong>Indaga.</strong> Le tecniche dell'attaccante sono coperte; sotto ognuna vedi quelle possibili secondo il profilo. Il SOC ne rivela una: la prima analisi di ogni turno è gratis, le altre costano 1 credito.</li>
        <li><strong>Avanza.</strong> L'attacco si risolve in 3 turni. Ogni blocco aumenta la Copertura (i punti della carta) e il Molt (+2 nelle fasi 1-3, +1 nelle fasi 4-7). La Difesa è Copertura × Molt.</li>
        <li><strong>Spezza la catena.</strong> Ogni fase bloccata costringe l'attaccante a scoprirsi: la prima carta ancora coperta dei turni successivi si gira.</li>
        <li><strong>Occhio alle riserve.</strong> Un attaccante bloccato può spendere una riserva e cambiare tecnica. Serve una seconda difesa, diversa dalla prima, che fermi il ripiego: se il ripiego passa, la fase non vale nulla. Se il profilo prevede una sola tecnica per quella fase, il ripiego può essere una qualsiasi tecnica della fase.</li>
        <li><strong>Vinci.</strong> L'attacco è respinto se la Difesa raggiunge la soglia e la fase 7, Obiettivo, è bloccata. Se la fase 7 passa hai perso, qualunque sia il punteggio.</li>
        <li><strong>Conseguenze.</strong> Fase 5 passata: l'attaccante lascia una backdoor (1 riserva in più la prossima volta). Fase 7 passata: dati esfiltrati (nessuna fase nota la prossima volta) oppure fino a 3 fondi persi. Un attacco perso costa 1 Resilienza; a zero la campagna finisce.</li>
        <li><strong>Rinforza.</strong> Tra una missione e l'altra spendi i fondi in carte nuove, joker e potenziamenti. Vinci 5 fondi, più 1 per ogni credito avanzato (massimo 3). I debiti tecnici danno fondi subito ma lasciano un punto debole finché non li estingui.</li>
        <li><strong>Impara.</strong> Nelle prime due missioni il gioco ti dice quali difese fermano ogni tecnica. Poi lo dice solo nel debrief: le simulazioni restano sempre a disposizione.</li>
      </ul>`;
  const showRules = () => U.modal(RULES, [{ label: 'Chiudi', primary: true, fn: U.closeModal }], { dismiss: true });
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
  $('helpBtn').addEventListener('click', showRules);
  $('rulesBtn').addEventListener('click', showRules);
  function syncAudio() {
    el.sfxBtn.textContent = A.isSfx() ? 'Effetti attivi' : 'Effetti spenti';
    el.sfxBtn.setAttribute('aria-pressed', String(A.isSfx()));
    el.musBtn.textContent = A.isMusic() ? 'Musica attiva' : 'Musica spenta';
    el.musBtn.setAttribute('aria-pressed', String(A.isMusic()));
  }
  // Effetto CRT: righe di scansione e vignettatura, disattivabili.
  const CRT_KEY = 'spezza-la-catena-crt';
  function syncCrt(on) {
    document.body.classList.toggle('nocrt', !on);
    $('crtBtn').textContent = on ? 'Effetto CRT attivo' : 'Effetto CRT spento';
    $('crtBtn').setAttribute('aria-pressed', String(on));
  }
  let crtOn = true;
  try { crtOn = localStorage.getItem(CRT_KEY) !== 'off'; } catch (e) { /* preferenza non disponibile */ }
  $('crtBtn').addEventListener('click', () => {
    crtOn = !crtOn; syncCrt(crtOn);
    try { localStorage.setItem(CRT_KEY, crtOn ? 'on' : 'off'); } catch (e) { /* preferenza non salvata */ }
  });
  syncCrt(crtOn);

  el.advanceBtn.addEventListener('click', advance);
  el.discardBtn.addEventListener('click', discardSel);
  el.howBtn.addEventListener('click', () => { if (mode === 'plan' && sel) openSim(defShots(sel._c.d)); });
  el.sfxBtn.addEventListener('click', () => { A.setSfx(!A.isSfx()); syncAudio(); });
  el.musBtn.addEventListener('click', () => { A.music(!A.isMusic()); syncAudio(); });

  G.game = { newRun, simTech: k => openSim(techShots(G.T[k])), simDef: k => openSim(defShots(G.D[k])) };
  // Lo stato interno (carte coperte comprese) è visibile solo allo strumento di sviluppo ?autotest.
  if (/autotest/.test(location.search)) G.game.state = () => ({ run, enc, mode });
  syncAudio();
  title();
})(window.SLC);
