/* Sfondo: vortice a bassa risoluzione disegnato su canvas e ingrandito a pixel netti. */
(function () {
  const cv = document.getElementById('bg'), cx = cv.getContext('2d'), W = 96, H = 60;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  cv.width = W; cv.height = H;
  const img = cx.createImageData(W, H);
  const PAL = [[9, 22, 34], [12, 31, 47], [16, 41, 60], [21, 53, 74], [31, 47, 86]];

  function paint(ms) {
    const t = ms * .00025;
    for (let y = 0, i = 0; y < H; y++) {
      const v = y / H * 2.6 - 1.3;
      for (let x = 0; x < W; x++, i += 4) {
        const u = x / W * 4 - 2, r = Math.hypot(u, v), a = Math.atan2(v, u);
        const s = Math.sin(r * 3 - t * 2 + Math.sin(a * 2 + t) * 1.6) + Math.sin(u * 2.1 + t * 1.3 + Math.sin(v * 2.3 - t) * 1.2);
        const c = PAL[Math.max(0, Math.min(PAL.length - 1, Math.floor((s + 2) / 4 * PAL.length)))];
        img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
      }
    }
    cx.putImageData(img, 0, 0);
  }

  paint(0);
  if (calm) return;
  let last = 0;
  const loop = ms => { if (ms - last > 66) { last = ms; paint(ms); } requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
})();
