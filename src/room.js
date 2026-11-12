// Raum-Logik für eine Klasse: Anmeldung, Qualifying (jede/r allein auf dem Handy) und Finale am Beamer.
// Diese Datei kennt weder Cloudflare noch Node. Der Server-Adapter
// (src/worker.js für Cloudflare, server/local.mjs für den Laptop) reicht Verbindungen und Speicher herein.
import { BEGRIFFE } from '../public/js/inhalte.js';
import {
  THEMA_LISTE, STUFEN, QUALI_SEKUNDEN, FINAL_GROESSEN, FINAL_FRAGEN, BILD_LISTE, CPU, CPU_LISTE,
  ZEIT_PRO_BEGRIFF, VORLAUF_START, PAUSE_FINALE, GNADE, SCHLUSS_GNADE,
  auswahl, fragen, punkte, vergleich, zufallsSeed, cpuZug,
} from '../public/js/regeln.js';

export const MAX_PLAYERS = 60;
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ' -]{0,15}$/;
const STELLE_RE = /^[a-z0-9-]{1,40}$/;

export function cleanName(first, initial) {
  first = String(first || '').trim().replace(/\s+/g, ' ');
  initial = String(initial || '').trim();
  if (!NAME_RE.test(first)) return null;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]$/.test(initial)) return null;
  const cap = s => s.charAt(0).toLocaleUpperCase('de-DE') + s.slice(1);
  return cap(first) + ' ' + initial.toLocaleUpperCase('de-DE') + '.';
}
const int = (v, lo, hi, def) => {
  v = Number(v);
  return Number.isInteger(v) && v >= lo && v <= hi ? v : def;
};
const dauer = v => { v = Math.round(Number(v)); return Number.isFinite(v) ? Math.max(0, Math.min(ZEIT_PRO_BEGRIFF, v)) : ZEIT_PRO_BEGRIFF; };
const koord = v => { v = Number(v); return Number.isFinite(v) ? Math.round(Math.max(-50, Math.min(600, v)) * 10) / 10 : null; };
const stelleOk = v => (typeof v === 'string' && STELLE_RE.test(v) ? v : '');

export function cleanCfg(c, old) {
  c = c || {}; old = old || {};
  const pick = (v, list, def) => list.includes(v) ? v : def;
  return {
    thema: pick(c.thema, THEMA_LISTE, pick(old.thema, THEMA_LISTE, 'skelett')),
    stufe: pick(c.stufe, STUFEN, pick(old.stufe, STUFEN, 'einfach')),
    qsek: pick(Number(c.qsek), QUALI_SEKUNDEN, pick(Number(old.qsek), QUALI_SEKUNDEN, 120)),
    finalN: pick(Number(c.finalN), FINAL_GROESSEN, pick(Number(old.finalN), FINAL_GROESSEN, 4)),
    fragen: pick(Number(c.fragen), FINAL_FRAGEN, pick(Number(old.fragen), FINAL_FRAGEN, 10)),
    cpu: pick(c.cpu, CPU_LISTE, pick(old.cpu, CPU_LISTE, 'mittel')),
  };
}

export function freshState(code) {
  return {
    v: 1, code, teacherKey: null, created: 0, updated: 0,
    phase: 'lobby', // lobby | quali | final-setup | final | podium
    cfg: cleanCfg({}),
    players: {},
    order: [], // pids in Anmelde-Reihenfolge
    quali: null,
    final: null,
    nr: 0, // zählt Qualifying- und Finalrunden, damit alte Nachrichten nicht zählen
  };
}
const neuQ = () => ({ i: -1, cur: 0, best: 0, r: 0, n: 0, fehler: [] });

// Platzierung im Finale: höherer Bestwert, dann mehr Treffer, dann weniger Zeit für die Treffer
export function finalPlaetze(st) {
  const idx = st.map((x, i) => i);
  idx.sort((a, b) => vergleich(st[a], st[b]) || (st[a].ms - st[b].ms) || (a - b));
  const places = [];
  idx.forEach((i, j) => { places[i] = j + 1; });
  return places;
}

export class RoomLogic {
  /**
   * @param {object} io  Adapter:
   *   io.load() -> Promise<state|null>
   *   io.save(state) -> Promise
   *   io.wipe() -> Promise
   *   io.conns() -> Array<{meta, ws, send(obj), sendRaw(str), close(code, reason)}>
   *   io.setMeta(conn, meta)
   *   io.now() -> ms
   */
  constructor(io) { this.io = io; this.s = null; }

  async state(code) {
    if (!this.s) this.s = (await this.io.load()) || freshState(code);
    return this.s;
  }
  async persist() { this.s.updated = this.io.now(); await this.io.save(this.s); }

  // ---------- Verbindungen
  async open(conn, q) {
    const s = await this.state(q.code);
    const role = q.role === 'teacher' ? 'teacher' : 'player';
    if (role === 'teacher') {
      const key = String(q.key || '');
      if (key.length < 12 || key.length > 64) return this.reject(conn, 'bad-key');
      if (!s.teacherKey) { s.teacherKey = key; s.created = this.io.now(); await this.persist(); }
      else if (s.teacherKey !== key) return this.reject(conn, 'code-taken');
      this.io.setMeta(conn, { role: 'teacher' });
      conn.send(this.roomMsg());
    } else {
      const pid = String(q.pid || '');
      if (!/^[a-z0-9]{8,24}$/.test(pid)) return this.reject(conn, 'bad-pid');
      if (!s.teacherKey) return this.reject(conn, 'no-room');
      this.io.setMeta(conn, { role: 'player', pid });
      conn.send(this.youMsg(pid));
      this.pushTeachers();
    }
  }
  reject(conn, why) {
    try { conn.send({ t: 'error', why }); conn.close(4001, why); } catch (e) {}
  }
  async close(conn) {
    const m = conn.meta || {};
    if (m.role !== 'player') return;
    await this.state();
    this.closing = conn.ws;
    try { this.pushTeachers(); } finally { this.closing = null; }
  }

  // ---------- Nachrichten
  async message(conn, raw) {
    if (typeof raw !== 'string' || raw.length > 4096) return;
    let msg; try { msg = JSON.parse(raw); } catch (e) { return; }
    if (!msg || typeof msg.t !== 'string') return;
    const m = conn.meta || {};
    const s = await this.state();
    if (msg.t === 'sync') { conn.send({ t: 'sync', c: msg.c, s: this.io.now() }); return; }
    if (m.role === 'teacher') return this.teacherMsg(conn, msg, s);
    if (m.role === 'player') return this.playerMsg(conn, msg, s, m.pid);
  }

  async teacherMsg(conn, msg, s) {
    const now = this.io.now();
    switch (msg.t) {
      case 'cfg': {
        s.cfg = cleanCfg(msg.cfg, s.cfg);
        await this.persist(); this.pushTeachers(); return;
      }
      case 'kick': {
        const pid = String(msg.pid || ''); if (!s.players[pid]) return;
        if (s.final && s.final.p.includes(pid) && (s.phase === 'final' || s.phase === 'podium')) return conn.send({ t: 'error', why: 'kick-finalist' });
        delete s.players[pid]; s.order = s.order.filter(p => p !== pid);
        if (s.final && s.phase === 'final-setup') s.final.p = s.final.p.filter(p => p !== pid);
        for (const c of this.io.conns()) if ((c.meta || {}).pid === pid) c.send({ t: 'kicked' });
        await this.persist(); this.pushTeachers(); return;
      }
      case 'quali-start': {
        if (s.phase !== 'lobby') return;
        if (!s.order.length) return conn.send({ t: 'error', why: 'no-players' });
        s.cfg = cleanCfg(msg.cfg, s.cfg);
        const liste = auswahl(BEGRIFFE, s.cfg.thema, s.cfg.stufe);
        if (!liste.length) return conn.send({ t: 'error', why: 'no-terms' });
        s.nr++;
        s.quali = {
          nr: s.nr, seed: zufallsSeed(), thema: s.cfg.thema, stufe: s.cfg.stufe, liste,
          startAt: now + VORLAUF_START, endAt: now + VORLAUF_START + s.cfg.qsek * 1000, open: true,
        };
        for (const pid of s.order) s.players[pid].q = null;
        s.final = null; s.phase = 'quali';
        await this.persist(); this.pushAll(); return;
      }
      case 'quali-schluss': {
        // Der Beamer meldet: Die Zeit des Qualifyings ist um → Endstand
        if (s.phase !== 'quali' || !s.quali || !s.quali.open || msg.nr !== s.quali.nr) return;
        if (now < s.quali.endAt) return;
        this.qualiSchliessen(s);
        await this.persist(); this.pushAll(); return;
      }
      case 'quali-end': {
        if (s.phase !== 'quali' || !s.quali) return;
        this.qualiSchliessen(s);
        s.phase = 'final-setup';
        const beste = this.ranking().slice(0, s.cfg.finalN);
        s.final = { p: beste.length === 1 ? [beste[0], CPU] : beste, state: 'setup' };
        await this.persist(); this.pushAll(); return;
      }
      case 'final-pick': {
        if (s.phase !== 'final-setup') return;
        const p = this.cleanFinalists(msg.p, s);
        if (!p) return;
        s.final = { p, state: 'setup' };
        await this.persist(); this.pushTeachers(); return;
      }
      case 'final-start': case 'revanche': {
        if (msg.t === 'final-start' && s.phase !== 'final-setup') return;
        if (msg.t === 'revanche' && s.phase !== 'podium') return;
        const p = msg.t === 'revanche' && s.final ? s.final.p.slice() : this.cleanFinalists(msg.p, s);
        if (!p || p.length < 2 || !p.every(pid => pid === CPU || s.players[pid]) || !p.some(pid => pid !== CPU)) return conn.send({ t: 'error', why: 'final-players' });
        const on = this.online();
        if (!p.every(pid => pid === CPU || on.has(pid))) return conn.send({ t: 'error', why: 'final-offline' });
        if (msg.cfg) s.cfg = cleanCfg(msg.cfg, s.cfg);
        const liste = auswahl(BEGRIFFE, s.cfg.thema, s.cfg.stufe);
        if (!liste.length) return conn.send({ t: 'error', why: 'no-terms' });
        const seed = zufallsSeed();
        s.nr++;
        const startAt = now + VORLAUF_START;
        s.final = {
          nr: s.nr, p, names: p.map(pid => pid === CPU ? 'CPU' : s.players[pid].name), seed, thema: s.cfg.thema, stufe: s.cfg.stufe,
          cpu: p.indexOf(CPU), cpuStufe: s.cfg.cpu,
          fragen: fragen(liste, seed, Math.min(s.cfg.fragen, Math.max(liste.length, 1) * 3)),
          q: 0, startAt, deadline: startAt + ZEIT_PRO_BEGRIFF, first: true, state: 'run', last: null,
          st: p.map(() => ({ cur: 0, best: 0, r: 0, ms: 0, ans: null })),
          places: null,
          revanche: msg.t === 'revanche' ? ((s.final && s.final.revanche) || 0) + 1 : 0,
        };
        s.phase = 'final';
        await this.persist(); this.pushAll(); return;
      }
      case 'tick': case 'runde-stopp': {
        // tick: Der Beamer meldet, dass die Zeit für den Begriff abgelaufen ist.
        // runde-stopp: Die Lehrkraft beendet den Begriff (z. B. wenn ein Handy hängt). Wer nicht getippt hat, bekommt 0.
        const f = s.final;
        if (s.phase !== 'final' || !f || f.state !== 'run' || msg.nr !== f.nr || msg.q !== f.q) return;
        if (msg.t === 'tick' && now < f.deadline + GNADE) return;
        if (msg.t === 'runde-stopp' && now < f.startAt) return;
        const why = msg.t === 'tick' ? 'zeit' : 'stopp';
        this.cpuTipp(f, now);
        f.st.forEach(x => { if (!x.ans) this.antwort(x, { ok: false, why, ms: ZEIT_PRO_BEGRIFF }); });
        return this.maybeResolve(s);
      }
      case 'cpu': {
        // Der Beamer meldet: Jetzt ist der Computergegner mit Tippen dran
        const f = s.final;
        if (s.phase !== 'final' || !f || f.state !== 'run' || msg.nr !== f.nr || msg.q !== f.q) return;
        if (!this.cpuTipp(f, now)) return;
        return this.maybeResolve(s);
      }
      case 'final-abort': {
        if (s.phase !== 'final' && s.phase !== 'podium') return;
        s.final = { p: s.final ? s.final.p : [], state: 'setup' };
        s.phase = 'final-setup';
        await this.persist(); this.pushAll(); return;
      }
      case 'to-setup': {
        if (s.phase !== 'podium') return;
        s.final = { p: s.final ? s.final.p : [], state: 'setup' };
        s.phase = 'final-setup';
        await this.persist(); this.pushAll(); return;
      }
      case 'to-lobby': {
        s.phase = 'lobby'; s.quali = null; s.final = null;
        for (const pid of s.order) s.players[pid].q = null;
        await this.persist(); this.pushAll(); return;
      }
      case 'wipe': {
        for (const c of this.io.conns()) { try { c.send({ t: 'ended' }); c.close(4000, 'ended'); } catch (e) {} }
        this.s = null; await this.io.wipe(); return;
      }
    }
  }

  qualiSchliessen(s) {
    s.quali.open = false;
    for (const pid of s.order) {
      const p = s.players[pid];
      if (!p.q) p.q = neuQ();
      p.q.done = true;
    }
  }

  cleanFinalists(list, s) {
    const p = Array.isArray(list) ? list.map(String).filter(pid => pid === CPU || s.players[pid]) : [];
    if (new Set(p).size !== p.length || p.length > 4) return null;
    return p;
  }

  // Zug des Computergegners verbuchen, sobald seine Bedenkzeit um ist. true, wenn er jetzt getippt hat.
  cpuTipp(f, now) {
    if (!(f.cpu >= 0)) return false;
    const x = f.st[f.cpu];
    if (x.ans) return false;
    const z = cpuZug(f.seed, f.q, f.cpuStufe);
    if (now < f.startAt + z.ms - 500) return false;
    this.antwort(x, { ok: z.ok, ms: z.ms, why: 'falsch' });
    return true;
  }

  // Eine Antwort verbuchen: richtig = Punkte dazu, falsch = Punkte auf 0. Der Bestwert bleibt.
  antwort(x, a) {
    const ok = a.ok === true;
    const ms = dauer(a.ms);
    const pts = ok ? punkte(ms) : 0;
    x.cur = ok ? x.cur + pts : 0;
    x.best = Math.max(x.best, x.cur);
    if (ok) { x.r++; x.ms += ms; }
    x.ans = { ok, pts, ms, why: ok ? '' : (a.why === 'zeit' || a.why === 'stopp' ? a.why : 'falsch'), hit: stelleOk(a.hit), x: koord(a.x), y: koord(a.y) };
    return x.ans;
  }

  async playerMsg(conn, msg, s, pid) {
    const now = this.io.now();
    switch (msg.t) {
      case 'join': {
        const name = cleanName(msg.first, msg.initial);
        if (!name) return conn.send({ t: 'error', why: 'bad-name' });
        let p = s.players[pid];
        if (!p) {
          if (s.order.length >= MAX_PLAYERS) return conn.send({ t: 'error', why: 'full' });
          let shown = name, n = 2;
          const taken = new Set(Object.values(s.players).map(x => x.name));
          while (taken.has(shown)) shown = name + ' ' + (n++);
          p = s.players[pid] = { name: shown, at: now, q: null };
          s.order.push(pid);
        }
        await this.persist();
        conn.send(this.youMsg(pid)); this.pushTeachers(); return;
      }
      case 'leave': {
        // „Nicht ich?“: Name freigeben, solange kein Spiel mit diesem Namen läuft
        const p = s.players[pid]; if (!p) return;
        if (s.final && s.final.p.includes(pid) && s.phase !== 'lobby') return;
        delete s.players[pid]; s.order = s.order.filter(x => x !== pid);
        await this.persist(); conn.send(this.youMsg(pid)); this.pushTeachers(); return;
      }
      case 'q': {
        // Qualifying: Antwort auf Begriff Nr. i (ok, ms). Falsch → Punkte auf 0, es zählt der Bestwert.
        const p = s.players[pid], Q = s.quali;
        if (!p || !Q || s.phase !== 'quali' || !Q.open || msg.nr !== Q.nr) return;
        if (now > Q.endAt + SCHLUSS_GNADE || now < Q.startAt - 2000) return;
        const i = int(msg.i, 0, 9999, -1);
        if (i < 0) return;
        if (!p.q) p.q = neuQ();
        if (i > p.q.i) {
          p.q.i = i; p.q.n++;
          const a = this.antwort(p.q, msg);
          if (!a.ok) { p.q.fehler.push({ i, hit: a.hit, why: a.why }); if (p.q.fehler.length > 40) p.q.fehler.shift(); }
          delete p.q.ans;
          await this.persist();
          this.pushTeachers();
        }
        conn.send({ t: 'q-ok', i: p.q.i, cur: p.q.cur, best: p.q.best });
        return;
      }
      case 'f': {
        const f = s.final;
        if (s.phase !== 'final' || !f || f.state !== 'run' || msg.nr !== f.nr || msg.q !== f.q) return;
        const slot = f.p.indexOf(pid); if (slot < 0) return;
        const x = f.st[slot]; if (x.ans) return;
        if (now < f.startAt - 1000) return;
        if (now > f.deadline + GNADE) return; // zu spät: zählt als „Zeit um“
        this.antwort(x, msg);
        return this.maybeResolve(s);
      }
    }
  }

  // Alle Finalisten haben geantwortet (oder die Zeit ist um): Auflösung zeigen, dann der nächste Begriff
  async maybeResolve(s) {
    const f = s.final;
    if (f.st.some(x => !x.ans)) {
      await this.persist(); this.pushAll(); return;
    }
    const now = this.io.now();
    f.last = { q: f.q, frage: f.fragen[f.q], ans: f.st.map(x => x.ans), st: f.st.map(x => ({ cur: x.cur, best: x.best, r: x.r })) };
    if (f.q + 1 >= f.fragen.length) {
      f.state = 'done'; f.endAt = now;
      f.places = finalPlaetze(f.st);
      s.phase = 'podium';
    } else {
      f.q++;
      f.first = false;
      f.startAt = now + PAUSE_FINALE;
      f.deadline = f.startAt + ZEIT_PRO_BEGRIFF;
      for (const x of f.st) x.ans = null;
    }
    await this.persist(); this.pushAll();
  }

  // ---------- Sicht auf den Raum
  online() {
    const set = new Set();
    for (const c of this.io.conns()) { const m = c.meta || {}; if (m.role === 'player' && c.ws !== this.closing) set.add(m.pid); }
    return set;
  }
  ranking() {
    const s = this.s;
    const list = s.order.filter(p => s.players[p] && s.players[p].q);
    list.sort((a, b) => vergleich(s.players[a].q, s.players[b].q) || s.players[a].at - s.players[b].at);
    return list;
  }
  // Finale: nur die Begriffe bis zum aktuellen (nichts verraten)
  finalView(f, full) {
    if (!f) return null;
    if (f.state === 'setup') return { state: 'setup', p: f.p };
    const done = f.state === 'done';
    return {
      nr: f.nr, state: f.state, p: f.p, names: f.names, thema: f.thema, stufe: f.stufe, n: f.fragen.length,
      q: f.q, frage: done ? null : f.fragen[f.q], bisher: f.fragen.slice(0, done ? f.fragen.length : f.q),
      startAt: f.startAt, deadline: f.deadline, first: f.first, last: f.last, places: f.places, revanche: f.revanche,
      st: full ? f.st : undefined,
      cpu: f.cpu >= 0 ? f.cpu : -1, cpuStufe: f.cpuStufe,
      cpuMs: full && f.cpu >= 0 && !done ? cpuZug(f.seed, f.q, f.cpuStufe).ms : undefined,
    };
  }
  roomMsg() {
    const s = this.s, on = this.online(), rank = this.ranking();
    const players = s.order.filter(p => s.players[p]).map(pid => {
      const p = s.players[pid], q = p.q;
      return { pid, name: p.name, q: q ? { cur: q.cur, best: q.best, r: q.r, n: q.n } : null, online: on.has(pid), rank: rank.indexOf(pid) + 1 };
    });
    const f = this.finalView(s.final, true);
    if (f) f.online = f.p.map(pid => pid === CPU || on.has(pid));
    const Q = s.quali;
    const quali = Q ? { nr: Q.nr, thema: Q.thema, stufe: Q.stufe, anzahl: Q.liste.length, startAt: Q.startAt, endAt: Q.endAt, open: Q.open } : null;
    return { t: 'room', code: s.code, phase: s.phase, cfg: s.cfg, quali, players, now: this.io.now(), final: f };
  }
  youMsg(pid) {
    const s = this.s, p = s.players[pid] || null, f = s.final;
    const rank = this.ranking(), r = rank.indexOf(pid);
    let final = null;
    if (f && f.state !== 'setup' && (s.phase === 'final' || s.phase === 'podium')) {
      const slot = f.p.indexOf(pid);
      final = this.finalView(f, false);
      final.slot = slot;
      final.me = slot >= 0 ? f.st[slot] : null;
      if (slot < 0) { delete final.frage; }
    } else if (f && s.phase === 'final-setup') {
      final = { state: 'setup', chosen: f.p.includes(pid) };
    }
    const Q = s.quali;
    return {
      t: 'you', phase: s.phase, now: this.io.now(),
      me: p ? { name: p.name, q: p.q, rank: r + 1, of: rank.length } : null,
      quali: Q ? { nr: Q.nr, seed: Q.seed, thema: Q.thema, stufe: Q.stufe, liste: Q.liste, startAt: Q.startAt, endAt: Q.endAt, open: Q.open } : null,
      final,
    };
  }
  pushTeachers() {
    if (!this.s) return;
    let msg = null;
    for (const c of this.io.conns()) if ((c.meta || {}).role === 'teacher') { msg = msg || JSON.stringify(this.roomMsg()); c.sendRaw(msg); }
  }
  pushPlayers() {
    if (!this.s) return;
    for (const c of this.io.conns()) { const m = c.meta || {}; if (m.role === 'player') c.send(this.youMsg(m.pid)); }
  }
  pushAll() { this.pushTeachers(); this.pushPlayers(); }
}

export { BILD_LISTE };
