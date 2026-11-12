// Tests der Regeln, der Inhalte und der Raum-Logik ohne Server:  node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomLogic, cleanName, cleanCfg, finalPlaetze } from '../src/room.js';
import { auswahl, frage, fragen, punkte, vergleich, cpuZug, CPU_STUFEN, THEMEN, THEMA_LISTE, BILD_LISTE, ZEIT_PRO_BEGRIFF, GNADE, PAUSE_FINALE, VORLAUF_START, SCHLUSS_GNADE } from '../public/js/regeln.js';
import { BEGRIFFE } from '../public/js/inhalte.js';
import { BILDER } from '../public/js/bilder/index.js';

function makeRoom() {
  let t = 1_000_000, saved = null;
  const conns = [];
  const logic = new RoomLogic({
    load: async () => saved, save: async s => { saved = structuredClone(s); }, wipe: async () => { saved = null; },
    conns: () => conns, setMeta: (c, m) => { c.meta = m; }, now: () => t,
  });
  const conn = () => { const c = { meta: {}, ws: {}, inbox: [], send(o) { this.inbox.push(o); }, sendRaw(s) { this.inbox.push(JSON.parse(s)); }, close() {} }; conns.push(c); return c; };
  const last = (c, type) => [...c.inbox].reverse().find(m => m.t === type);
  return { logic, conns, conn, last, tick: ms => { t += ms; }, now: () => t, msg: (c, o) => logic.message(c, JSON.stringify(o)) };
}
// Lehrkraft und n Spieler anmelden
async function klasse(n = 3) {
  const R = makeRoom();
  const T = R.conn();
  await R.logic.open(T, { code: 'ABCDE', role: 'teacher', key: 'k'.repeat(20) });
  const P = [];
  for (let i = 0; i < n; i++) {
    const c = R.conn(); c.pid = 'spieler' + 'abcdefgh'[i] + 'x';
    await R.logic.open(c, { code: 'ABCDE', role: 'player', pid: c.pid });
    await R.msg(c, { t: 'join', first: ['Lena', 'Tom', 'Aylin', 'Max', 'Sara'][i], initial: 'K' });
    P.push(c);
  }
  return { R, T, P };
}

// ---------------------------------------------------------------- Inhalte und Abbildungen
test('Jeder Begriff ist vollständig und seine Stelle ist auf der Abbildung gezeichnet', () => {
  assert.ok(BEGRIFFE.length >= 60, 'genug Begriffe');
  const keys = new Set();
  for (const e of BEGRIFFE) {
    const name = e.stelle + ' (' + e.einfach + ')';
    assert.ok(e.einfach && e.schwer, name + ': einfach und schwer ausgefüllt');
    assert.ok(!e.nur || e.nur === 'schwer' || e.nur === 'einfach', name + ': nur');
    const bilder = Array.isArray(e.bild) ? e.bild : [e.bild];
    for (const b of bilder) {
      assert.ok(BILD_LISTE.includes(b), name + ': unbekanntes Bild ' + b);
      assert.ok(BILDER[b].svg.includes(`data-s="${e.stelle}"`), name + ': Stelle fehlt auf ' + b);
      const k = e.stelle + '@' + b;
      assert.ok(!keys.has(k), 'doppelt: ' + k); keys.add(k);
    }
  }
});

test('Auswahl nach Thema und Stufe', () => {
  for (const th of THEMA_LISTE) for (const st of ['einfach', 'schwer']) {
    const l = auswahl(BEGRIFFE, th, st);
    assert.ok(l.length >= 15, `${th}/${st}: ${l.length} Begriffe`);
    assert.ok(l.every(e => e.b.every(b => THEMEN[th].bilder.includes(b))));
  }
  const e = auswahl(BEGRIFFE, 'skelett', 'einfach'), s = auswahl(BEGRIFFE, 'skelett', 'schwer');
  assert.ok(s.length > e.length, 'Schwer hat mehr Begriffe');
  const femE = e.find(x => x.s === 'femur'), femS = s.find(x => x.s === 'femur');
  assert.equal(femE.t, 'Oberschenkelknochen'); assert.equal(femE.a, 'Femur');
  assert.equal(femS.t, 'Femur'); assert.equal(femS.a, 'Oberschenkelknochen');
  assert.ok(!e.some(x => x.s === 'ossa-carpi'), '„nur schwer“ fehlt bei Einfach');
  assert.equal(auswahl(BEGRIFFE, 'organe', 'einfach').filter(x => x.b.includes('skelett-vorn')).length, 0);
});

test('Reihenfolge: für alle gleich, gemischt, nie zweimal derselbe Begriff direkt hintereinander', () => {
  const l = auswahl(BEGRIFFE, 'alle', 'schwer');
  const a = fragen(l, 77, 300), b = fragen(l, 77, 300), c = fragen(l, 78, 300);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map(x => x.s), c.map(x => x.s));
  for (let i = 1; i < a.length; i++) assert.notEqual(a[i].s + a[i].b, a[i - 1].s + a[i - 1].b, 'Wiederholung bei ' + i);
  // im ersten Durchgang kommt jeder Begriff genau einmal
  assert.equal(new Set(a.slice(0, l.length).map(x => x.s + x.t)).size, l.length);
  // Begriffe mit zwei Bildern kommen auf beiden vor
  const delt = a.filter(x => x.s === 'vertebrae-lumbales').map(x => x.b);
  assert.ok(new Set(delt).size === 2, 'beide Ansichten kommen vor');
  assert.equal(frage([], 1, 0), null);
});

test('Punkte: 50 sicher, volle Tempopunkte in der ersten Sekunde, ab 4 Sekunden keine mehr', () => {
  assert.equal(punkte(0), 100);
  assert.equal(punkte(1000), 100);
  assert.equal(punkte(2500), 75);
  assert.equal(punkte(4000), 50);
  assert.equal(punkte(19999), 50);
  assert.ok(punkte(1200) > punkte(2000) && punkte(2000) > punkte(3000) && punkte(3000) > 50);
  assert.equal(vergleich({ best: 300, r: 4 }, { best: 200, r: 9 }) < 0, true);
  assert.equal(vergleich({ best: 300, r: 4 }, { best: 300, r: 5 }) > 0, true);
});

test('Namen und Einstellungen werden geprüft', () => {
  assert.equal(cleanName('lena', 'k'), 'Lena K.');
  assert.equal(cleanName('<b>', 'k'), null);
  assert.equal(cleanName('Lena', ''), null);
  const c = cleanCfg({ thema: 'quatsch', stufe: 'schwer', qsek: 7, fragen: 15 });
  assert.equal(c.thema, 'skelett'); assert.equal(c.stufe, 'schwer'); assert.equal(c.qsek, 120); assert.equal(c.fragen, 15);
});

// ---------------------------------------------------------------- Qualifying
test('Qualifying: Punkte steigen, ein Fehler setzt auf 0, es zählt der Bestwert', async () => {
  const { R, T, P } = await klasse(3);
  await R.msg(T, { t: 'quali-start', cfg: { thema: 'organe', stufe: 'einfach', qsek: 90 } });
  const you = R.last(P[0], 'you');
  assert.equal(you.phase, 'quali');
  assert.ok(you.quali.liste.length >= 15 && you.quali.seed >= 0);
  assert.ok(you.quali.liste.every(e => e.b.every(b => b === 'organe')));
  const nr = you.quali.nr;
  R.tick(VORLAUF_START + 100);
  // Lena: 3 richtig (schnell), dann falsch, dann 1 richtig
  await R.msg(P[0], { t: 'q', nr, i: 0, ok: true, ms: 1000 });
  await R.msg(P[0], { t: 'q', nr, i: 1, ok: true, ms: 15000 });
  await R.msg(P[0], { t: 'q', nr, i: 1, ok: true, ms: 1000 }); // doppelt gesendet: zählt nicht
  await R.msg(P[0], { t: 'q', nr, i: 2, ok: true, ms: 2000 });
  assert.equal(R.last(P[0], 'q-ok').cur, 233); // 100 + 50 + 83
  await R.msg(P[0], { t: 'q', nr, i: 3, ok: false, ms: 4000, hit: 'hepar' });
  assert.equal(R.last(P[0], 'q-ok').cur, 0);
  assert.equal(R.last(P[0], 'q-ok').best, 233);
  await R.msg(P[0], { t: 'q', nr, i: 4, ok: true, ms: 0 });
  // Tom: 2 richtig, langsam
  await R.msg(P[1], { t: 'q', nr, i: 0, ok: true, ms: 20000 });
  await R.msg(P[1], { t: 'q', nr, i: 1, ok: true, ms: 99999 }); // wird auf 20 s begrenzt
  // Aylin: Zeit um
  await R.msg(P[2], { t: 'q', nr, i: 0, ok: false, why: 'zeit' });
  // falsche Runde zählt nicht
  await R.msg(P[2], { t: 'q', nr: nr + 5, i: 1, ok: true, ms: 0 });
  const room = R.last(T, 'room');
  const lena = room.players.find(p => p.name === 'Lena K.');
  assert.deepEqual(lena.q, { cur: 100, best: 233, r: 4, n: 5 });
  assert.deepEqual(room.players.map(p => [p.name, p.rank, p.q.best]), [['Lena K.', 1, 233], ['Tom K.', 2, 100], ['Aylin K.', 3, 0]]);
  // Nach dem Neuladen bekommt das Handy seinen Stand zurück
  await R.logic.open(P[0], { code: 'ABCDE', role: 'player', pid: P[0].pid });
  const me = R.last(P[0], 'you').me;
  assert.equal(me.q.i, 4); assert.equal(me.q.cur, 100); assert.equal(me.q.fehler[0].hit, 'hepar');
  // Ende der Spielzeit: Beamer meldet Schluss, späte Antworten zählen nicht mehr
  R.tick(90000 + SCHLUSS_GNADE + 10);
  await R.msg(P[1], { t: 'q', nr, i: 2, ok: true, ms: 0 });
  await R.msg(T, { t: 'quali-schluss', nr });
  const end = R.last(T, 'room');
  assert.equal(end.quali.open, false);
  assert.equal(end.players.find(p => p.name === 'Tom K.').q.best, 100);
  await R.msg(T, { t: 'quali-end' });
  assert.equal(R.last(T, 'room').phase, 'final-setup');
  assert.deepEqual(R.last(T, 'room').final.p, [P[0].pid, P[1].pid, P[2].pid]);
});

// ---------------------------------------------------------------- Finale
async function finaleStarten(n = 3, cfg = { thema: 'skelett', stufe: 'schwer', fragen: 5 }) {
  const k = await klasse(n);
  const { R, T, P } = k;
  await R.msg(T, { t: 'quali-start' });
  await R.msg(T, { t: 'quali-end' });
  await R.msg(T, { t: 'final-start', p: P.map(c => c.pid), cfg });
  return k;
}

test('Finale: Punkte-Duell mit Auflösung, Zeitablauf, Platzierung nach Bestwert', async () => {
  const { R, T, P } = await finaleStarten(3);
  let f = R.last(T, 'room').final;
  assert.equal(R.last(T, 'room').phase, 'final');
  assert.equal(f.n, 5); assert.equal(f.q, 0); assert.ok(f.frage && f.frage.t);
  assert.equal(f.bisher.length, 0);
  // Finalisten kennen nur den aktuellen Begriff, Zuschauer gar keinen
  const yf = R.last(P[0], 'you').final;
  assert.ok(yf.frage && !yf.st && yf.slot === 0);
  const nr = f.nr;
  R.tick(VORLAUF_START + 500);
  // Begriff 1: alle richtig, unterschiedlich schnell
  await R.msg(P[0], { t: 'f', nr, q: 0, ok: true, ms: 1000, x: 80, y: 300, hit: 'femur' });
  await R.msg(P[0], { t: 'f', nr, q: 0, ok: false, ms: 1000 }); // zweite Antwort zählt nicht
  await R.msg(P[1], { t: 'f', nr, q: 0, ok: true, ms: 8000 });
  assert.equal(R.last(T, 'room').final.q, 0, 'wartet auf alle');
  await R.msg(P[2], { t: 'f', nr, q: 0, ok: true, ms: 14000 });
  f = R.last(T, 'room').final;
  assert.equal(f.q, 1);
  assert.equal(f.last.q, 0);
  assert.deepEqual(f.last.ans.map(a => a.pts), [100, 50, 50]);
  assert.equal(f.last.ans[0].hit, 'femur');
  assert.equal(f.startAt, R.now() + PAUSE_FINALE);
  // Begriff 2: Lena falsch (Punkte auf 0), Aylin tippt nicht → Zeit um
  R.tick(PAUSE_FINALE + 300);
  await R.msg(P[0], { t: 'f', nr, q: 1, ok: false, ms: 3000, hit: 'tibia' });
  await R.msg(P[1], { t: 'f', nr, q: 1, ok: true, ms: 2000 });
  await R.msg(T, { t: 'tick', nr, q: 1 }); // zu früh: zählt nicht
  assert.equal(R.last(T, 'room').final.q, 1);
  R.tick(ZEIT_PRO_BEGRIFF + GNADE + 10);
  await R.msg(T, { t: 'tick', nr, q: 1 });
  f = R.last(T, 'room').final;
  assert.equal(f.q, 2);
  assert.deepEqual(f.last.ans.map(a => a.why), ['falsch', '', 'zeit']);
  assert.deepEqual(f.last.st.map(x => x.cur), [0, 133, 0]);
  assert.deepEqual(f.last.st.map(x => x.best), [100, 133, 50]);
  // Begriffe 3 bis 5: Lehrkraft beendet einen Begriff, Rest richtig
  for (let q = 2; q < 5; q++) {
    R.tick(PAUSE_FINALE + 100);
    await R.msg(P[0], { t: 'f', nr, q, ok: true, ms: 1500 });
    if (q === 3) await R.msg(T, { t: 'runde-stopp', nr, q });
    else { await R.msg(P[1], { t: 'f', nr, q, ok: false, ms: 1500 }); await R.msg(P[2], { t: 'f', nr, q, ok: true, ms: 1500 }); }
  }
  const room = R.last(T, 'room');
  assert.equal(room.phase, 'podium');
  f = room.final;
  assert.equal(f.state, 'done');
  assert.equal(f.bisher.length, 5);
  // Lena: 0 → 92, 184, 276 = Bestwert 276. Tom: Bestwert 133. Aylin: 92 (q2), stopp → 0, 92 → Bestwert 92
  assert.deepEqual(f.st.map(x => x.best), [276, 133, 92]);
  assert.deepEqual(f.places, [1, 2, 3]);
  const me = R.last(P[2], 'you').final;
  assert.deepEqual(me.places, [1, 2, 3]);
  // Revanche mit denselben Finalisten, neue Begriffe
  await R.msg(T, { t: 'revanche' });
  const rv = R.last(T, 'room').final;
  assert.equal(rv.revanche, 1); assert.equal(rv.q, 0); assert.equal(rv.state, 'run');
});

test('Computergegner: Stärken unterscheiden sich, Züge sind für alle gleich', () => {
  const quote = st => { let ok = 0; for (let q = 0; q < 2000; q++) ok += cpuZug(99, q, st).ok; return ok / 2000; };
  assert.ok(quote('leicht') < quote('mittel') && quote('mittel') < quote('stark'));
  assert.deepEqual(cpuZug(5, 3, 'mittel'), cpuZug(5, 3, 'mittel'));
  for (const [st, c] of Object.entries(CPU_STUFEN)) for (let q = 0; q < 200; q++) { const z = cpuZug(q * 31, q, st); assert.ok(z.ms >= c.ms[0] && z.ms <= c.ms[1]); }
});

test('Finale gegen den Computer: CPU wird vorgeschlagen und tippt zur geplanten Zeit', async () => {
  const { R, T, P } = await klasse(1);
  await R.msg(T, { t: 'quali-start' });
  await R.msg(T, { t: 'quali-end' });
  assert.deepEqual(R.last(T, 'room').final.p, [P[0].pid, 'cpu'], 'nur eine Person: CPU als Finalist/in 2');
  await R.msg(T, { t: 'final-pick', p: ['cpu', 'cpu'] }); // zweimal CPU geht nicht
  assert.deepEqual(R.last(T, 'room').final.p, [P[0].pid, 'cpu']);
  await R.msg(T, { t: 'final-start', p: ['cpu'] });
  assert.equal(R.last(T, 'error').why, 'final-players');
  await R.msg(T, { t: 'final-start', p: [P[0].pid, 'cpu'], cfg: { cpu: 'stark', fragen: 5 } });
  let f = R.last(T, 'room').final;
  const nr = f.nr;
  assert.equal(f.names[1], 'CPU'); assert.equal(f.cpu, 1); assert.equal(f.cpuStufe, 'stark');
  assert.ok(f.cpuMs >= 700 && f.cpuMs <= 2500);
  assert.equal(R.last(P[0], 'you').final.cpuMs, undefined, 'Handys kennen den Zug der CPU nicht');
  // Begriff 1: Lena tippt sofort, die CPU erst zu ihrer Zeit
  R.tick(VORLAUF_START + 100);
  await R.msg(P[0], { t: 'f', nr, q: 0, ok: true, ms: 100 });
  await R.msg(T, { t: 'cpu', nr, q: 0 }); // zu früh
  assert.equal(R.last(T, 'room').final.q, 0, 'wartet auf die CPU');
  const ms0 = f.cpuMs;
  R.tick(ms0);
  await R.msg(T, { t: 'cpu', nr, q: 0 });
  f = R.last(T, 'room').final;
  assert.equal(f.q, 1);
  assert.equal(f.last.ans[1].ms, ms0);
  assert.equal(f.last.ans[1].pts, f.last.ans[1].ok ? punkte(ms0) : 0);
  // Begriff 2: Lena tippt nicht, nach Ablauf der Zeit hat die CPU trotzdem ihren Zug gemacht
  R.tick(PAUSE_FINALE + ZEIT_PRO_BEGRIFF + GNADE + 10);
  await R.msg(T, { t: 'tick', nr, q: 1 });
  f = R.last(T, 'room').final;
  assert.equal(f.q, 2);
  assert.equal(f.last.ans[0].why, 'zeit');
  assert.notEqual(f.last.ans[1].why, 'zeit');
  // Begriff 3: Lehrkraft beendet sofort, bevor die CPU dran war
  R.tick(f.startAt - R.now());
  await R.msg(T, { t: 'runde-stopp', nr, q: 2 });
  f = R.last(T, 'room').final;
  assert.deepEqual(f.last.ans.map(a => a.why), ['stopp', 'stopp']);
  // Begriffe 4 und 5
  for (const q of [3, 4]) {
    R.tick(f.startAt - R.now() + 100);
    await R.msg(P[0], { t: 'f', nr, q, ok: true, ms: 100 });
    R.tick(R.last(T, 'room').final.cpuMs);
    await R.msg(T, { t: 'cpu', nr, q });
    f = R.last(T, 'room').final;
  }
  assert.equal(R.last(T, 'room').phase, 'podium');
  assert.equal(f.places.length, 2);
  assert.deepEqual([...f.places].sort(), [1, 2]);
  // Revanche mit CPU
  await R.msg(T, { t: 'revanche' });
  assert.equal(R.last(T, 'room').phase, 'final');
  assert.equal(R.last(T, 'room').final.cpu, 1);
});

test('Finale: Platz bei gleichem Bestwert nach Treffern und Zeit', () => {
  assert.deepEqual(finalPlaetze([{ best: 200, r: 2, ms: 5000 }, { best: 200, r: 3, ms: 9000 }, { best: 200, r: 3, ms: 8000 }, { best: 250, r: 1, ms: 1 }]), [4, 3, 2, 1]);
});

test('Finale nur mit verbundenen Handys, Zuschauer sehen keine Begriffe', async () => {
  const { R, T, P } = await klasse(3);
  await R.msg(T, { t: 'quali-start' });
  await R.msg(T, { t: 'quali-end' });
  R.conns.splice(R.conns.indexOf(P[2]), 1);
  await R.msg(T, { t: 'final-start', p: [P[0].pid, P[2].pid] });
  assert.equal(R.last(T, 'error').why, 'final-offline');
  await R.msg(T, { t: 'final-start', p: [P[0].pid, P[1].pid] });
  assert.equal(R.last(T, 'room').phase, 'final');
  // Zuschauer (Aylin, neu verbunden) bekommt keinen Begriff
  R.conns.push(P[2]);
  await R.logic.open(P[2], { code: 'ABCDE', role: 'player', pid: P[2].pid });
  const y = R.last(P[2], 'you');
  assert.equal(y.final.slot, -1);
  assert.equal(y.final.frage, undefined);
  // Finalisten können nicht entfernt werden, Zuschauer schon
  await R.msg(T, { t: 'kick', pid: P[0].pid });
  assert.equal(R.last(T, 'error').why, 'kick-finalist');
  await R.msg(T, { t: 'kick', pid: P[2].pid });
  assert.ok(R.last(P[2], 'kicked'));
});

test('Lehrkraft-Schlüssel schützt den Raum, Löschen beendet alles', async () => {
  const { R, T } = await klasse(1);
  const fremd = R.conn();
  await R.logic.open(fremd, { code: 'ABCDE', role: 'teacher', key: 'x'.repeat(20) });
  assert.equal(R.last(fremd, 'error').why, 'code-taken');
  await R.msg(T, { t: 'wipe' });
  assert.ok(R.last(T, 'ended'));
});
