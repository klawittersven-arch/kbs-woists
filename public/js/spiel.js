// Einzelspiel auf dem Handy (Qualifying und Übungsseite): Begriff lesen, Stelle antippen.
// Richtig: Punkte dazu (je schneller, desto mehr). Falsch oder Zeit um: Punkte auf 0, der Bestwert bleibt.
import { frage, punkte, ZEIT_PRO_BEGRIFF } from './regeln.js';
import { frageAnzeigen, ergebnisAnzeigen, zeitbalken } from './ui.js';

export class QuizSpiel {
  /**
   * o: { figur, liste, seed, i (nächster Begriff), cur, best, stufe, weiterBtn,
   *      onAntwort(res), vorbei() -> true, wenn die Spielzeit um ist }
   */
  constructor(o) {
    Object.assign(this, { i: 0, cur: 0, best: 0, r: 0, n: 0 }, o);
    this.timers = []; this.raf = 0; this.offen = false; this.stopped = false; this.fehler = [];
    if (this.weiterBtn) this.weiterBtn.onclick = () => this.weiter();
  }
  start() { this.weiter(); }
  weiter() {
    this.timers.forEach(clearTimeout); this.timers = [];
    if (this.weiterBtn) this.weiterBtn.hidden = true;
    if (this.stopped || (this.vorbei && this.vorbei())) return;
    const it = this.it = frage(this.liste, this.seed, this.i);
    if (!it) return;
    this.figur.zeige(it.b);
    this.figur.leeren();
    frageAnzeigen(it);
    this.t0 = performance.now();
    this.offen = true;
    this.figur.eingabe(true);
    cancelAnimationFrame(this.raf);
    const tick = () => {
      if (!this.offen) return;
      const ms = performance.now() - this.t0;
      zeitbalken(ZEIT_PRO_BEGRIFF - ms, ZEIT_PRO_BEGRIFF);
      if (ms >= ZEIT_PRO_BEGRIFF) return this.antwort(null, 'zeit');
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }
  tap(cx, cy) {
    if (!this.offen) return;
    const r = this.figur.pruefe(cx, cy, this.it.s);
    this.antwort(r, r.ok ? '' : 'falsch');
  }
  antwort(r, why) {
    if (!this.offen) return;
    this.offen = false;
    cancelAnimationFrame(this.raf);
    this.figur.eingabe(false);
    const it = this.it;
    const ms = Math.min(ZEIT_PRO_BEGRIFF, Math.round(performance.now() - this.t0));
    const ok = !!(r && r.ok);
    const pts = ok ? punkte(ms) : 0;
    this.cur = ok ? this.cur + pts : 0;
    this.best = Math.max(this.best, this.cur);
    this.n++; if (ok) this.r++;
    this.figur.markiere(it.s, 'ziel');
    if (r) {
      if (!ok && r.hit) this.figur.markiere(r.hit, 'falsch', false);
      this.figur.punkt(r.x, r.y, ok ? 'ok' : 'bad');
    }
    const res = { i: this.i, it, ok, ms, pts, why, hit: r ? r.hit : '', x: r ? r.x : null, y: r ? r.y : null, cur: this.cur, best: this.best };
    if (!ok) this.fehler.push(res);
    this.i++;
    ergebnisAnzeigen(res, this.stufe);
    zeitbalken(null);
    if (navigator.vibrate) try { navigator.vibrate(ok ? 30 : [80, 50, 120]); } catch (e) {}
    this.onAntwort && this.onAntwort(res);
    if (ok) this.timers.push(setTimeout(() => this.weiter(), 1000));
    else {
      if (this.weiterBtn) this.weiterBtn.hidden = false;
      this.timers.push(setTimeout(() => this.weiter(), 5000));
    }
  }
  stop() {
    this.stopped = true; this.offen = false;
    this.timers.forEach(clearTimeout); this.timers = [];
    cancelAnimationFrame(this.raf);
    if (this.figur) this.figur.eingabe(false);
    if (this.weiterBtn) this.weiterBtn.hidden = true;
  }
}
