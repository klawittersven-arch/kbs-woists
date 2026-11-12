// Handy-Seite der SuS: anmelden, Qualifying allein spielen, im Finale auf dem Handy tippen
import { KNet, randomId, store } from './net.js';
import { QuizSpiel } from './spiel.js';
import { erstelleFigur } from './figur.js';
import { frage, ZEIT_PRO_BEGRIFF, THEMEN, STUFE_TEXT, PUNKTE_TEXT } from './regeln.js';
import { Ton } from './ton.js';
import { esc, spielfeldZeigen, frageAnzeigen, frageText, ergebnisAnzeigen, zeitbalken, infoZeile, countdown, begriffListe, toast, wachHalten, mmss } from './ui.js';

const $ = s => document.querySelector(s);
const panel = $('#panel'), netdot = $('#netdot');

const params = new URLSearchParams(location.search);
let code = (params.get('c') || params.get('code') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
let pid = store('woists.pid');
if (!pid || !/^[a-z0-9]{8,24}$/.test(pid)) { pid = randomId(16); store('woists.pid', pid); }

let net = null, you = null, shown = '';
let Q = null;   // laufendes Qualifying
let F = null;   // Finale

// Handys bleiben immer stumm (kein Ton im Klassenzimmer). Ton gibt es nur im Finale vom Beamer-Laptop.
Ton.an = false;

// Die Abbildung (eine für alles)
let figur = null, tapHandler = null;
const fig = () => figur || (figur = erstelleFigur($('#figur'), { onTap: (x, y) => tapHandler && tapHandler(x, y) }));

// ---------------------------------------------------------------- Verbindung
const serverNow = () => net ? net.serverNow() : Date.now();
function connect() {
  net = KNet({
    code, params: { role: 'player', pid },
    onMessage,
    onStatus: s => {
      netdot.dataset.s = s;
      if (s === 'offline' && net.stopped) {
        if (net.stopped === 'no-room') show('noroom', `<div class="card"><h2>Raum nicht gefunden</h2><p>Zum Code <b>${esc(code)}</b> gibt es gerade kein Spiel. Ist die Lehrer-Seite am Beamer geöffnet? Scanne den QR-Code noch einmal.</p><button class="big-btn" id="btnRetry">Nochmal versuchen</button></div>`, () => { $('#btnRetry').onclick = () => location.reload(); });
        else if (net.stopped === 'ended') show('ended', '<div class="card"><h2>Das Spiel ist beendet</h2><p>Die Lehrkraft hat die Sitzung geschlossen. Danke fürs Mitspielen!</p></div>');
      }
    },
  });
  net.open();
}
function send(obj) { if (net) net.send(obj, true); }

function onMessage(m) {
  if (typeof m.now === 'number' && net.rtt > 5000) net.offset = m.now - Date.now();
  switch (m.t) {
    case 'you': you = m; update(); break;
    case 'q-ok': break;
    case 'ended': stopQuali(); stopFinal(); wachHalten(false); show('ended', '<div class="card"><h2>Das Spiel ist beendet</h2><p>Die Lehrkraft hat die Sitzung geschlossen. Danke fürs Mitspielen!</p></div>'); break;
    case 'kicked': you = null; stopQuali(); stopFinal(); store('woists.name', null); show('kicked', '<div class="card"><h2>Abgemeldet</h2><p>Die Lehrkraft hat deinen Namen entfernt. Du kannst dich mit einem anderen Namen neu anmelden.</p><button class="big-btn" id="btnAgain">Neu anmelden</button></div>', () => { $('#btnAgain').onclick = () => location.reload(); }); break;
    case 'error':
      if (m.why === 'bad-name') { const e = $('#joinErr'); if (e) { e.textContent = 'Bitte einen Vornamen (nur Buchstaben) und den ersten Buchstaben des Nachnamens eingeben.'; e.hidden = false; } }
      else if (m.why === 'full') toast('Das Spiel ist voll (60 Personen).');
      break;
  }
}

// ---------------------------------------------------------------- Anzeige
function show(key, html, after) {
  spielfeldZeigen(false);
  if (shown === key) return;
  shown = key;
  panel.innerHTML = html;
  after && after();
}

function update() {
  if (!you) return;
  const me = you.me;
  if (!me) { stopQuali(); stopFinal(); return joinForm(); }
  switch (you.phase) {
    case 'lobby': stopQuali(); stopFinal(); wachHalten(false); return show('lobby:' + me.name, waitCard(me.name), wireLeave);
    case 'quali': stopFinal(); return quali();
    case 'final-setup': stopQuali(); stopFinal(); wachHalten(false); return afterQuali();
    case 'final': case 'podium': stopQuali(); return final();
  }
}

function waitCard(name) {
  return `<div class="card"><p class="eyebrow">Hallo ${esc(name)}!</p><h2>Gleich geht’s los</h2>
    <p>Warte, bis die Lehrkraft das Qualifying startet. Alle spielen gleichzeitig auf dem eigenen Handy.</p><div class="waitdots"><i></i><i></i><i></i></div>
    <p class="hint">So geht’s: Oben steht ein Begriff, z. B. „Kniescheibe“. Tippe auf der Abbildung auf die richtige Stelle. ${esc(PUNKTE_TEXT)}</p>
    <button class="ghost-btn" id="btnLeave">Nicht ${esc(name)}? Namen ändern</button></div>`;
}
function wireLeave() { const b = $('#btnLeave'); if (b) b.onclick = () => { store('woists.name', null); send({ t: 'leave' }); shown = ''; }; }

function joinForm() {
  if (shown === 'join') return;
  const last = store('woists.name') || {};
  show('join', `<div class="card">
    <h2>Mitspielen</h2>
    <p>Gib deinen Vornamen und den ersten Buchstaben deines Nachnamens ein. Der Name erscheint am Beamer.</p>
    <form id="joinForm" class="settings" autocomplete="off">
      <div class="row">
        <div class="field grow"><label for="fFirst">Vorname</label><input id="fFirst" maxlength="16" required value="${esc(last.first || '')}" autocapitalize="words" enterkeyhint="next"></div>
        <div class="field initial"><label for="fInit">Nachname</label><input id="fInit" maxlength="1" required value="${esc(last.initial || '')}" autocapitalize="characters" enterkeyhint="go" aria-label="Erster Buchstabe des Nachnamens"></div>
      </div>
      <p class="err" id="joinErr" hidden></p>
      <button class="big-btn" type="submit">Mitspielen</button>
    </form></div>`, () => {
    const f = $('#fFirst'), i = $('#fInit');
    f.addEventListener('input', () => { if (/\s/.test(f.value)) { f.value = f.value.trim(); i.focus(); } });
    $('#joinForm').onsubmit = e => {
      e.preventDefault();
      const first = f.value.trim(), initial = i.value.trim();
      store('woists.name', { first, initial });
      send({ t: 'join', first, initial });
    };
  });
}

// ---------------------------------------------------------------- Qualifying
function quali() {
  const me = you.me, qi = you.quali;
  if (!qi) return;
  // Zeit um bzw. Endstand: Ergebnis zeigen
  if (!qi.open || serverNow() > qi.endAt) {
    if (Q && Q.nr === qi.nr && !Q.vorbei) return zeitUm();
    return qualiErgebnis();
  }
  if (Q && Q.nr === qi.nr) return; // läuft bereits
  stopQuali();
  // Neues Qualifying (auch nach dem Neuladen: mit dem gespeicherten Stand weiter)
  const sq = me.q;
  Q = { nr: qi.nr, qi, spiel: null, timers: [], raf: 0, vorbei: false };
  spielfeldZeigen(true);
  shown = 'quali-play';
  wachHalten(true);
  $('#sBarBox').hidden = false;
  zeitbalken(null);
  fig().zeige(qi.liste[0].b[0]);
  fig().leeren(); fig().eingabe(false);
  frageText('Gleich geht’s los', `Qualifying · ${THEMEN[qi.thema].name} · ${STUFE_TEXT[qi.stufe].name}`, 'warten');
  const spiel = Q.spiel = new QuizSpiel({
    figur: fig(), liste: qi.liste, seed: qi.seed, stufe: qi.stufe, weiterBtn: $('#btnWeiter'),
    i: sq ? sq.i + 1 : 0, cur: sq ? sq.cur : 0, best: sq ? sq.best : 0, r: sq ? sq.r : 0, n: sq ? sq.n : 0,
    vorbei: () => !Q || Q.vorbei || serverNow() >= qi.endAt,
    onAntwort: res => { send({ t: 'q', nr: qi.nr, i: res.i, ok: res.ok, ms: res.ms, why: res.why, hit: res.hit }); info(); },
  });
  tapHandler = (x, y) => spiel.tap(x, y);
  // Gemeinsamer Start: Countdown bis zur Startzeit, Nachzügler bekommen 3 Sekunden
  const bis = Math.max(qi.startAt - serverNow(), sq ? 1500 : 3000);
  const startLokal = performance.now() + bis;
  const cd = () => {
    if (!Q || Q.nr !== qi.nr) { countdown(null); return; }
    const rest = startLokal - performance.now();
    if (rest <= 0) { countdown(null); return; }
    const sec = Math.ceil(rest / 1000);
    countdown(sec <= 3 ? sec : '…', 'Lies den Begriff und tippe die Stelle an!');
    Q.timers.push(setTimeout(cd, Math.min(250, rest)));
  };
  cd();
  Q.timers.push(setTimeout(() => { if (Q && !Q.vorbei) spiel.start(); }, bis));
  // Restzeit des Qualifyings: Anzeige oben, am Ende ist Schluss
  const tick = () => {
    if (!Q || Q.nr !== qi.nr || Q.vorbei) return;
    info();
    if (qi.endAt - serverNow() <= 0) return zeitUm();
    Q.raf = requestAnimationFrame(tick);
  };
  Q.raf = requestAnimationFrame(tick);
}

function info() {
  if (!Q || !Q.spiel) return;
  const rest = Math.min(Q.qi.endAt - Q.qi.startAt, Q.qi.endAt - serverNow());
  infoZeile(`<span>⏱ <b>${mmss(rest)}</b></span><span class="punkte">Punkte <b>${Q.spiel.cur}</b></span><span>Bestwert <b>${Q.spiel.best}</b></span>`);
}

function zeitUm() {
  if (!Q || Q.vorbei) return;
  Q.vorbei = true;
  if (Q.spiel) Q.spiel.stop();
  Q.timers.forEach(clearTimeout); Q.timers = [];
  countdown(null);
  if (navigator.vibrate) try { navigator.vibrate(200); } catch (e) {}
  shown = '';
  qualiErgebnis();
}

function stopQuali() {
  if (!Q) return;
  Q.vorbei = true;
  Q.timers.forEach(clearTimeout);
  cancelAnimationFrame(Q.raf);
  countdown(null);
  if (Q.spiel) Q.spiel.stop();
  Q = null;
}

// Begriffe, die falsch waren (ohne doppelte)
function uebenListe(qi, fehler) {
  const seen = new Set(), out = [];
  for (const f of fehler || []) {
    const it = f.it || frage(qi.liste, qi.seed, f.i);
    if (!it || seen.has(it.s + it.t)) continue;
    seen.add(it.s + it.t); out.push(it);
  }
  return out;
}

function qualiErgebnis() {
  const me = you.me, qi = you.quali;
  const lokal = Q && Q.nr === (qi && qi.nr) ? Q.spiel : null;
  const srv = me.q || { best: 0, r: 0, n: 0, fehler: [] };
  const best = Math.max(srv.best || 0, lokal ? lokal.best : 0);
  const r = Math.max(srv.r || 0, lokal ? lokal.r : 0), n = Math.max(srv.n || 0, lokal ? lokal.n : 0);
  const fehler = lokal && lokal.fehler.length >= (srv.fehler || []).length ? lokal.fehler : srv.fehler;
  const liste = qi ? uebenListe(qi, fehler) : [];
  const endstand = qi && !qi.open;
  const key = 'qres:' + best + ':' + n + ':' + me.rank + ':' + me.of + ':' + endstand;
  wachHalten(false);
  const rank = endstand && me.rank > 0 ? `<div class="placebox">Platz ${me.rank} von ${me.of}</div>` : '<p class="hint">Gleich steht deine Platzierung fest …</p>';
  show(key, `<div class="card ${best ? 'good' : ''}">
      <p class="eyebrow">Qualifying</p>
      <h2>Zeit um!</h2>
      <div class="bigstat"><b>${best}</b><span>Punkte als Bestwert · ${r} von ${n} richtig</span></div>
      ${rank}
    </div>
    ${liste.length ? `<div class="card"><h3>Das solltest du noch üben</h3>${begriffListe(liste)}</div>` : (n ? '<div class="card good"><h2>Alles richtig! 🎉</h2></div>' : '')}
    <div class="card"><p>Die Besten kommen ins Finale am Beamer. Lass diese Seite offen.</p></div>`);
}

function afterQuali() {
  const me = you.me, chosen = you.final && you.final.chosen;
  const best = me.q ? me.q.best : 0;
  show('after:' + best + ':' + me.rank + ':' + chosen, `<div class="card ${chosen ? 'good' : ''}">
      <p class="eyebrow">Qualifying beendet</p>
      <h2>${chosen ? 'Du bist im Finale! 🎉' : 'Gleich kommt das Finale'}</h2>
      <div class="bigstat"><b>${best}</b><span>Punkte · Platz ${me.rank || '–'} von ${me.of}</span></div>
      <p>${chosen ? 'Lass diese Seite offen. Im Finale steht der Begriff am Beamer und hier. Du tippst auf deinem Handy.' : 'Das Finale läuft am Beamer. Schau zu und rate im Kopf mit!'}</p>
    </div>`);
}

// ---------------------------------------------------------------- Finale
function stopFinal() {
  if (!F) return;
  F.timers.forEach(clearTimeout);
  cancelAnimationFrame(F.raf);
  countdown(null);
  if (figur) figur.eingabe(false);
  F = null;
}

function final() {
  const f = you.final;
  if (!f) return;
  if (f.slot < 0) return zuschauer(f);
  if (!F || F.nr !== f.nr) {
    stopFinal();
    F = { nr: f.nr, q: -1, timers: [], raf: 0, offen: false, revealed: -1, endeGezeigt: false };
  }
  // Auflösung des letzten Begriffs
  if (f.last && F.revealed !== f.last.q) aufloesung(f);
  if (you.phase === 'podium') return finalEnde(f);
  wachHalten(true);
  if (f.state === 'run' && F.q !== f.q) planeFrage(f);
}

function zuschauer(f) {
  stopFinal(); wachHalten(false);
  if (you.phase === 'podium' && f.places) {
    const list = f.names.map((n, i) => ({ n, p: f.places[i] })).sort((a, b) => a.p - b.p);
    return show('spec-podium:' + f.nr, `<div class="card good"><p class="eyebrow">Finale</p><h2>🏆 ${esc(list[0].n)} gewinnt!</h2>
      <ol class="olist">${list.map(x => `<li><span class="nr">${x.p}.</span><b>${esc(x.n)}</b></li>`).join('')}</ol></div>
      ${f.bisher && f.bisher.length ? `<div class="card"><h3>Die Begriffe im Finale</h3>${begriffListe(f.bisher, true)}</div>` : ''}`);
  }
  return show('spec:' + f.nr, `<div class="card"><p class="eyebrow">Finale</p><h2>Schau zum Beamer! 👀</h2><p>Gerade spielen <b>${f.names.map(esc).join(', ')}</b> das Finale. Rate im Kopf mit!</p></div>`);
}

const stand = f => {
  const st = f.last ? f.last.st[f.slot] : { cur: 0, best: 0 };
  return `<span>Finale · ${Math.min(f.q + 1, f.n)}/${f.n}</span><span class="punkte">Punkte <b>${st.cur}</b></span><span>Bestwert <b>${st.best}</b></span>`;
};

function planeFrage(f) {
  F.timers.forEach(clearTimeout); F.timers = [];
  cancelAnimationFrame(F.raf);
  F.q = f.q; F.frage = f.frage; F.offen = false; F.startAt = f.startAt; F.deadline = f.deadline;
  spielfeldZeigen(true); shown = 'final-play';
  $('#btnWeiter').hidden = true;
  $('#sBarBox').hidden = false;
  infoZeile(stand(f));
  const at = (fn, when) => F.timers.push(setTimeout(fn, Math.max(0, when - serverNow())));
  if (!f.last || F.revealed !== f.last.q) {
    // erster Begriff (oder nach dem Neuladen): warten
    fig().zeige(f.frage.b); fig().leeren(); fig().eingabe(false);
    frageText(f.first ? 'Gleich geht’s los!' : 'Gleich kommt der nächste Begriff', `Finale${f.revanche ? ' · Revanche' : ''} · ${f.n} Begriffe`, 'warten');
  }
  if (f.first) for (let s = 3; s >= 1; s--) at(() => countdown(s, 'Gleich kommt der erste Begriff!'), f.startAt - s * 1000);
  at(() => {
    countdown(null);
    const g = you && you.final;
    if (!F || !g || g.nr !== F.nr || g.q !== F.q) return;
    // Nach dem Neuladen schon geantwortet?
    if (g.me && g.me.ans) { fig().zeige(F.frage.b); fig().leeren(); return frageText('Getippt!', 'Schau zum Beamer, gleich kommt die Auflösung', 'warten'); }
    fig().zeige(F.frage.b); fig().leeren();
    frageAnzeigen(F.frage, `Begriff ${F.q + 1} von ${g.n} · Wo ist …`);
    fig().eingabe(true); F.offen = true;
    tapHandler = finalTap;
    if (navigator.vibrate) try { navigator.vibrate(40); } catch (e) {}
    const tick = () => {
      if (!F || !F.offen) return;
      const rest = F.deadline - serverNow();
      zeitbalken(Math.max(0, rest), ZEIT_PRO_BEGRIFF);
      if (rest <= 0) return zeitAbgelaufen();
      F.raf = requestAnimationFrame(tick);
    };
    F.raf = requestAnimationFrame(tick);
  }, f.startAt);
}

function finalTap(x, y) {
  if (!F || !F.offen) return;
  F.offen = false;
  cancelAnimationFrame(F.raf);
  fig().eingabe(false);
  const r = fig().pruefe(x, y, F.frage.s);
  fig().punkt(r.x, r.y, 'neutral');
  send({ t: 'f', nr: F.nr, q: F.q, ok: r.ok, ms: Math.max(0, Math.round(serverNow() - F.startAt)), x: r.x, y: r.y, hit: r.hit });
  frageText('Getippt!', 'Schau zum Beamer, gleich kommt die Auflösung', 'warten');
  zeitbalken(null);
}
function zeitAbgelaufen() {
  if (!F || !F.offen) return;
  F.offen = false;
  fig().eingabe(false);
  send({ t: 'f', nr: F.nr, q: F.q, ok: false, why: 'zeit', ms: ZEIT_PRO_BEGRIFF });
  frageText('Zeit um!', 'Gleich kommt die Auflösung', 'warten');
  zeitbalken(null);
}

function aufloesung(f) {
  const L = f.last;
  F.revealed = L.q;
  F.offen = false;
  cancelAnimationFrame(F.raf);
  const a = L.ans[f.slot];
  spielfeldZeigen(true); shown = 'final-play';
  $('#btnWeiter').hidden = true;
  fig().zeige(L.frage.b); fig().leeren(); fig().eingabe(false);
  fig().markiere(L.frage.s, 'ziel');
  if (a) {
    if (!a.ok && a.hit) fig().markiere(a.hit, 'falsch', false);
    fig().punkt(a.x, a.y, a.ok ? 'ok' : 'bad');
    ergebnisAnzeigen({ ...a, it: L.frage }, f.stufe);
  }
  zeitbalken(null);
  const st = L.st[f.slot];
  infoZeile(`<span>Finale · ${L.q + 1}/${f.n}</span><span class="punkte">Punkte <b>${st.cur}</b></span><span>Bestwert <b>${st.best}</b></span>`);
  if (f.state === 'run' && L.q < f.q) {
    // Countdown bis zum nächsten Begriff
    const cd = () => {
      if (!F || F.q !== f.q || F.offen) return;
      const rest = f.startAt - serverNow();
      if (rest <= 0) return;
      const el = $('#sInfo span');
      if (el) el.innerHTML = `Nächster Begriff in <b>${Math.ceil(rest / 1000)}</b>`;
      F.timers.push(setTimeout(cd, 250));
    };
    setTimeout(cd, 0);
  }
}

function finalEnde(f) {
  stopTimersOnly();
  const me = f.me, place = f.places ? f.places[f.slot] : 0;
  const key = 'fend:' + f.nr + ':' + place;
  if (shown === key || shown === key + ':wait') return;
  const html = () => {
    const win = place === 1;
    const sieger = f.names[f.places.indexOf(1)] || '';
    return `<div class="card ${win ? 'good' : ''}">
      <p class="eyebrow">Finale${f.revanche ? ' · Revanche' : ''}</p>
      <h2>${win ? '🏆 Du hast gewonnen!' : `Platz ${place} 🎉`}</h2>
      <div class="bigstat"><b>${me.best}</b><span>Punkte als Bestwert · ${me.r} von ${f.n} richtig</span></div>
      <p>${win ? 'Herzlichen Glückwunsch!' : `Stark gespielt! Sieg: <b>${esc(sieger)}</b>`}</p>
    </div>
    <div class="card"><h3>Die Begriffe im Finale</h3>${begriffListe(f.bisher, true)}</div>`;
  };
  // Erst kurz die Auflösung des letzten Begriffs stehen lassen
  shown = key + ':wait';
  F.timers.push(setTimeout(() => {
    if (you && you.final && you.final.nr === f.nr && you.phase === 'podium') { wachHalten(false); fig().eingabe(false); shown = ''; show(key, html()); }
  }, F.revealed >= 0 ? 4000 : 0));
}
function stopTimersOnly() { if (F) { F.timers.forEach(clearTimeout); F.timers = []; cancelAnimationFrame(F.raf); countdown(null); } }

// Für den automatischen Test: aktuelle Abbildung und gesuchter Begriff
window.__woists = { figur: () => figur, ziel: () => (Q && Q.spiel && Q.spiel.offen && Q.spiel.it) || (F && F.offen && F.frage) || null };

// ---------------------------------------------------------------- Start
if (!code) {
  show('nocode', `<div class="card"><h2>Code eingeben</h2><p>Scanne den QR-Code am Beamer oder gib den Code ein, der dort oben rechts steht.</p>
    <form id="codeForm" class="settings"><div class="field"><label for="fCode">Code</label><input id="fCode" maxlength="5" autocapitalize="characters" required></div><button class="big-btn">Weiter</button></form></div>`, () => {
    $('#codeForm').onsubmit = e => { e.preventDefault(); const c = $('#fCode').value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (c.length === 5) location.search = '?c=' + c; };
  });
} else {
  connect();
}
