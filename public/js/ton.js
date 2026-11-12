// Töne (Web Audio, ohne Dateien). Nur der Beamer-Laptop spielt Töne, und nur im Finale.
// Handy-Seiten und Übungsseite setzen Ton.an = false und rufen init() nie auf.
let ctx = null, master = null;
export const Ton = {
  an: true,
  // Muss einmal nach einem Tippen/Klicken aufgerufen werden (Browser-Regel)
  init() {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  },
  _osc(freq, start, dur, type, vol, slide) {
    if (!ctx || !this.an) return;
    const t0 = ctx.currentTime + Math.max(0, start);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  piep(hoch) { this._osc(hoch ? 1046.5 : 659.25, 0, hoch ? 0.45 : 0.16, 'square', 0.16); },
  neu() { this._osc(784, 0, 0.12, 'triangle', 0.35); this._osc(1175, 0.1, 0.25, 'triangle', 0.35); },
  tick() { this._osc(1500, 0, 0.05, 'square', 0.07); },
  richtig() { [784, 988, 1319].forEach((f, j) => this._osc(f, j * 0.07, 0.22, 'triangle', 0.32)); },
  fehler() { this._osc(150, 0, 0.55, 'sawtooth', 0.28, 90); this._osc(155, 0, 0.55, 'square', 0.12, 92); },
  fanfare() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, j) => this._osc(f, j * 0.13, j === 5 ? 0.8 : 0.2, 'triangle', 0.4)); },
};
