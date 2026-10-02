/* Audio sintetizzato con Web Audio: effetti e musica, senza file esterni.
   Ogni momento del gioco ha la sua traccia: cutscene, briefing, attacco, negozio. */
(function (G) {
  let ac = null, sfx = true, mus = false, timer = null, step = 0, fast = false, cur = 'cut';

  // ms = durata di un passo, pat = note della melodia come posizioni nella scala (-1 = pausa),
  // bass = note del basso in semitoni dalla tonica, una ogni bassEvery passi.
  const TRACKS = {
    cut:    { ms: 330, root: 196, wave: 'sine',     vol: .032, scale: [0, 2, 3, 7, 8, 12, 14, 15], pat: [0, -1, 2, -1, 4, -1, 3, -1, 0, -1, 5, -1, 4, -1, 2, -1], bass: [0, 0, -4, -2], bassEvery: 8 },
    prep:   { ms: 250, root: 220, wave: 'triangle', vol: .02,  scale: [0, 3, 5, 7, 10, 12, 15, 17], pat: [0, -1, 0, 3, -1, 2, -1, 0, 0, -1, 0, 4, -1, 3, -1, 2], bass: [0, 0, 3, 5], bassEvery: 4 },
    attack: { ms: 210, root: 220, wave: 'triangle', vol: .02,  scale: [0, 3, 5, 7, 10, 12, 15, 17], pat: [0, 2, 4, 2, 5, 4, 2, 1, 0, 2, 4, 6, 5, 4, 2, 3], bass: [0, 0, 5, 3], bassEvery: 4 },
    shop:   { ms: 240, root: 262, wave: 'triangle', vol: .02,  scale: [0, 2, 4, 7, 9, 12, 14, 16], pat: [0, 2, 4, 2, 5, -1, 4, 2, 0, 2, 4, 5, 7, -1, 4, -1], bass: [0, 5, 7, 5], bassEvery: 4 },
  };

  function ctx() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; }
    return ac;
  }
  function tone(freq, dur, type, vol) {
    const a = ctx(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur);
  }
  function blip(freq, dur, type, vol) {
    if (sfx) tone(freq || 440, dur || .09, type || 'square', vol || .05);
  }
  function tick() {
    if (!mus) return;
    const T = TRACKS[cur], n = T.pat[step % T.pat.length];
    if (n >= 0) tone(T.root * 2 ** (T.scale[n] / 12), T.ms / 1000 * .9, T.wave, T.vol);
    if (step % T.bassEvery === 0) tone(T.root / 4 * 2 ** (T.bass[(step / T.bassEvery | 0) % T.bass.length] / 12), T.ms / 1000 * T.bassEvery * .45, 'square', .02);
    step++;
    timer = setTimeout(tick, T.ms * (fast ? .65 : 1));
  }

  // Colpo grave per i cartelli delle cutscene.
  function boom() {
    if (!sfx) return;
    tone(62, 1.4, 'sine', .14); tone(124, .9, 'triangle', .05); tone(31, 1.6, 'sine', .1);
  }

  G.audio = {
    blip, boom,
    setSfx(v) { sfx = v; },
    isSfx() { return sfx; },
    music(v) { mus = v; clearTimeout(timer); if (v) tick(); },
    isMusic() { return mus; },
    tempo(isFast) { fast = isFast; },
    track(name) { if (TRACKS[name] && name !== cur) { cur = name; step = 0; } },
    currentTrack() { return cur; },
  };
})(window.SLC);
