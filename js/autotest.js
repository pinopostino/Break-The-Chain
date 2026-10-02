/* Strumento di sviluppo: aprendo index.html?autotest il gioco fa una campagna da solo
   e scrive un riepilogo in fondo alla pagina. Senza quel parametro non fa nulla. */
(function (G) {
  if (!/autotest/.test(location.search)) return;
  const out = [];
  const stopAt = (location.search.match(/autotest=(\w+)/) || [])[1];   // es. ?autotest=shop si ferma al primo negozio
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  function dump() {
    let p = document.getElementById('autolog');
    if (!p) { p = document.createElement('pre'); p.id = 'autolog'; document.body.appendChild(p); }
    p.textContent = out.join('\n');
  }
  window.addEventListener('error', e => { out.push(`ERROR ${e.message} @${e.filename}:${e.lineno}`); dump(); });
  window.addEventListener('unhandledrejection', e => { out.push('REJECT ' + ((e.reason && e.reason.stack) || e.reason)); dump(); });

  const byId = id => document.getElementById(id);
  async function waitMode(m) {
    for (let i = 0; i < 600; i++) {
      if (G.game.state().mode === m) return true;
      if (!byId('cut').hidden && !byId('cutSkip').hidden) byId('cutSkip').click();   // salta le cutscene
      await sleep(100);
    }
    out.push(`TIMEOUT in attesa di ${m}, fermo su ${G.game.state().mode}`); dump();
    return false;
  }

  async function play() {
    G.audio.setSfx(false);
    await sleep(300);
    if (stopAt === 'cont') {   // prova il salvataggio: riprende la campagna salvata
      const b = byId('contBtn');
      if (b.hidden) { out.push('CONT: nessun salvataggio'); dump(); return; }
      out.push('CONT pulsante: ' + b.textContent);
      b.click(); await sleep(500);
      const st = G.game.state();
      out.push(`CONT ripreso: modo ${st.mode}, missione ${st.run.enc + 1}, collezione ${st.run.coll.length}, mazzo ${st.run.deck.length}, fondi ${st.run.funds}, joker ${st.run.jokers.join(',')}`);
      dump(); return;
    }
    try { localStorage.removeItem('spezza-la-catena-v1'); } catch (e) { /* ignora */ }
    if (stopAt === 'sim') {    // prova una simulazione per ogni tecnica e ogni difesa
      let bad = 0;
      const cv = document.createElement('canvas'); cv.width = 192; cv.height = 108;
      G.TECH.flat().forEach(t => { try { [0, .8, 1.6, 2.2].forEach(tt => G.scenes.net(cv.getContext('2d'), tt, { from: t.sim[0][0], to: t.sim[0][1], hit: t.hit, mark: t.sim[0][3] })); if (t.sim.length !== 2) throw new Error('passi'); } catch (e) { bad++; out.push('SIM ' + t.k + ': ' + e.message); } });
      out.push('SIM problemi: ' + bad); dump(); return;
    }
    byId('startBtn').click();   // Nuova campagna
    if (stopAt === 'cut') return;
    if (/^cine_/.test(stopAt || '')) {   // es. ?autotest=cine_2_5 mostra la terza inquadratura dell'apertura al secondo 5
      const [, i, sec] = stopAt.split('_');
      await sleep(200); G.cut.debugShow(Number(i), Number(sec || 4));
      return;
    }
    G.audio.music(false);
    for (let guard = 0; guard < 10; guard++) {
      // Briefing: porta prima le carte che fermano le tecniche del profilo
      if (!await waitMode('prep')) return;
      await sleep(200);
      const pool = new Set(G.FOES[G.game.state().run.enc].pool.flat());
      const slots = [...document.querySelectorAll('#coll .slot')];
      const score = s => s._c.d.x.filter(k => pool.has(k)).length;
      slots.filter(s => s.classList.contains('in')).forEach(s => s.click());
      slots.slice().sort((a, b) => score(b) - score(a)).forEach(s => { if (byId('prepGo').disabled) s.click(); });
      if (stopAt === 'prep') return;
      if (/^(win|def)_/.test(stopAt || '')) {   // es. ?autotest=win_phish_2 apre la simulazione e si ferma alla terza inquadratura
        const [kind, k, n] = stopAt.split('_');
        if (kind === 'win') G.game.simTech(k); else G.game.simDef(k);
        for (let i = 0; i < Number(n || 0) * 2 + 1; i++) { byId('cut').click(); await sleep(50); }
        return;
      }
      byId('prepGo').click();

      for (let t = 0; t < 3; t++) {
        if (!await waitMode('plan')) return;
        await sleep(200);
        const { enc } = G.game.state();
        for (const s of [...document.querySelectorAll('#hand .slot')]) {
          const p = s._ph.find(q => enc.result[q] === null && !enc.locked[q] && enc.placed[q].length < 2
            && s._c.d.x.includes(enc.chain[q].k) && !enc.placed[q].some(o => o._c.d.x.includes(enc.chain[q].k)));
          if (p === undefined) continue;
          s.click(); document.querySelectorAll('.bslot')[p].click();
        }
        if (stopAt === 'play' && t === 1) return;   // si ferma a metà attacco, con le difese schierate
        byId('advanceBtn').click();
        await sleep(300);
      }
      if (!await waitMode('debrief')) return;
      if (stopAt === 'debrief') return;
      const st = G.game.state();
      out.push(`missione ${st.run.enc + 1} ${st.enc.foe.city}: ${st.enc.chips} x ${st.enc.mult} = ${st.enc.chips * st.enc.mult} su ${st.enc.foe.goal} | bloccate ${st.enc.blocked} resilienza ${st.run.lives} fondi ${st.run.funds} joker ${st.run.jokers.join(',')}`);
      dump();
      byId('nextBtn').click();
      for (let i = 0; i < 50 && !['over', 'shop'].includes(G.game.state().mode); i++) {
        if (!byId('cut').hidden && !byId('cutSkip').hidden) byId('cutSkip').click();
        await sleep(100);
      }
      const m = G.game.state().mode;
      if (m === 'over') { out.push('FINE: ' + document.querySelector('#sheet h2').textContent); break; }
      if (m !== 'shop') { out.push('modo inatteso ' + m); break; }
      if (stopAt === 'shop') return;
      for (let i = 0; i < 6; i++) {
        const b = document.querySelector('#offCards .buy:not(:disabled)') || document.querySelector('#offJokers .buy:not(:disabled)');
        if (!b) break;
        b.click();
      }
      out.push(`  negozio: collezione ${G.game.state().run.coll.length}, joker ${G.game.state().run.jokers.join(',')}`);
      byId('shopNext').click();
    }
    out.push('COMPLETATO'); dump();
  }
  window.addEventListener('load', () => play().catch(e => { out.push('ECCEZIONE ' + (e.stack || e)); dump(); }));
})(window.SLC);
