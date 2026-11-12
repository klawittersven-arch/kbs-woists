// Beamer-Seite der Lehrkraft: Lobby mit QR-Code, Live-Rangliste im Qualifying, Finale mit Ton, Siegerehrung
import { KNet, randomCode, randomId, store } from './net.js';
import { erstelleFigur } from './figur.js';
import {
  THEMEN, THEMA_LISTE, STUFEN, STUFE_TEXT, QUALI_SEKUNDEN, FINAL_GROESSEN, FINAL_FRAGEN, dauerText,
  ZEIT_PRO_BEGRIFF, GNADE, SCHLUSS_GNADE, PUNKTE_TEXT,
} from './regeln.js';
import { Ton } from './ton.js';
import { esc, getipptText, mmss } from './ui.js';

const $ = s => document.querySelector(s);
const view = $('#view'), netdot = $('#netdot'), codeChip = $('#codeChip'), toastEl = $('#toast');
const FARBEN = ['#ffb238', '#5ec8ff', '#c08bff', '#ff7eb6']; // Finalisten 1 bis 4

let sess = store('woists.lehrer');
let net = null, room = null, screen = '';
let cfg = Object.assign({ thema: 'skelett', stufe: 'einfach', qsek: 120, finalN: 4, fragen: 10 }, store('woists.lehrer.cfg') || {});
if (!THEMA_LISTE.includes(cfg.thema)) cfg.thema = 'skelett';
if (!STUFEN.includes(cfg.stufe)) cfg.stufe = 'einfach';
if (!QUALI_SEKUNDEN.includes(Number(cfg.qsek))) cfg.qsek = 120;
if (!FINAL_GROESSEN.includes(Number(cfg.finalN))) cfg.finalN = 4;
if (!FINAL_FRAGEN.includes(Number(cfg.fragen))) cfg.fragen = 10;
let quitArmed = 0;
const bekannt = new Set(); // Namen in der Lobby, die schon angezeigt wurden
const serverNow = () => net ? net.serverNow() : Date.now();
const treffer = q => q ? `${q.r}/${q.n} ✓` : '';

// ---------------------------------------------------------------- Ton & Werkzeuge
Ton.an = store('woists.ton.beamer') !== false;
const btnTon = $('#btnTon');
function tonText() { btnTon.textContent = Ton.an ? 'Ton: an' : 'Ton: aus'; btnTon.setAttribute('aria-pressed', String(Ton.an)); }
tonText();
btnTon.onclick = () => { Ton.init(); Ton.an = !Ton.an; store('woists.ton.beamer', Ton.an); tonText(); };
document.addEventListener('pointerdown', () => Ton.init(), { capture: true });
document.addEventListener('keydown', () => Ton.init(), { capture: true });
$('#btnFull').onclick = vollbild;
function vollbild() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}
$('#btnSess').onclick = () => { $('#dlgCode').textContent = sess.code; $('#dlg').hidden = false; };
$('#btnDlgClose').onclick = () => { $('#dlg').hidden = true; };
$('#btnNewSess').onclick = () => { $('#dlg').hidden = true; newSession(); };
$('#btnWipe').onclick = () => { $('#dlg').hidden = true; send({ t: 'wipe' }); setTimeout(newSession, 600); };

let toastT = 0;
function toast(t) { toastEl.textContent = t; toastEl.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { toastEl.hidden = true; }, 4500); }

// ---------------------------------------------------------------- Verbindung
function newSession() {
  sess = { code: randomCode(5), key: randomId(24) };
  store('woists.lehrer', sess);
  room = null; screen = '';
  connect();
}
function connect() {
  if (net) net.close();
  codeChip.hidden = false; codeChip.textContent = 'Code ' + sess.code;
  net = KNet({
    code: sess.code, params: { role: 'teacher', key: sess.key },
    onMessage,
    onStatus: s => { netdot.dataset.s = s; if (s === 'offline' && net.stopped === 'code-taken') newSession(); },
  });
  net.open();
}
function onMessage(m) {
  if (typeof m.now === 'number' && net.rtt > 5000) net.offset = m.now - Date.now();
  switch (m.t) {
    case 'room': room = m; render(); break;
    case 'error':
      if (m.why === 'code-taken') newSession();
      else if (m.why === 'final-offline') toast('Alle Finalisten-Handys müssen verbunden sein. Wer nicht verbunden ist, öffnet die Seite neu oder scannt den QR-Code noch einmal.');
      else if (m.why === 'final-players') toast('Bitte mindestens zwei verschiedene Personen für das Finale auswählen.');
      else if (m.why === 'no-players') toast('Es hat sich noch niemand angemeldet.');
      else if (m.why === 'no-terms') toast('Für diese Einstellung gibt es keine Begriffe. Bitte die Datei inhalte.js prüfen.');
      else if (m.why === 'kick-finalist') toast('Finalisten können während des Finales nicht entfernt werden.');
      break;
    case 'ended': room = null; screen = ''; break;
  }
}
function send(obj) { if (net && !net.send(obj, true)) toast('Keine Verbindung zum Server. Der Befehl wird gesendet, sobald die Verbindung wieder steht.'); }

function joinUrl() { return location.origin + '/mitspielen?c=' + sess.code; }
function drawQR(canvas, text) {
  const qr = window.qrcode(0, 'M'); qr.addData(text); qr.make();
  const n = qr.getModuleCount(), q = 2, s = Math.max(4, Math.floor(512 / (n + 2 * q)));
  canvas.width = canvas.height = (n + 2 * q) * s;
  const g = canvas.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = '#0d1030';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect((c + q) * s, (r + q) * s, s, s);
}

// ---------------------------------------------------------------- Bausteine
function seg(name, options, value, onPick) {
  const w = document.createElement('div');
  w.className = 'seg'; w.setAttribute('role', 'radiogroup'); w.setAttribute('aria-label', name);
  for (const [val, label] of options) {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(val === value)); b.textContent = label;
    b.onclick = () => { w.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b))); onPick(val); };
    w.appendChild(b);
  }
  return w;
}
function setCfg(part) {
  Object.assign(cfg, part);
  store('woists.lehrer.cfg', cfg);
  send({ t: 'cfg', cfg });
}
function optionen(el, wo) {
  el.innerHTML = '';
  const add = (lbl, node, desc, id) => {
    const l = document.createElement('div'); l.className = 'lbl'; l.textContent = lbl;
    el.append(l, node);
    if (desc != null) { const d = document.createElement('div'); d.className = 'desc'; d.id = id || ''; d.textContent = desc; el.appendChild(d); }
  };
  add('Thema', seg('Thema', THEMA_LISTE.map(k => [k, THEMEN[k].name]), cfg.thema, thema => setCfg({ thema })));
  add('Begriffe', seg('Schwierigkeit', STUFEN.map(k => [k, STUFE_TEXT[k].name]), cfg.stufe, stufe => { setCfg({ stufe }); $('#desc-stufe').textContent = STUFE_TEXT[stufe].kurz; }), STUFE_TEXT[cfg.stufe].kurz, 'desc-stufe');
  if (wo === 'lobby') add('Qualifying', seg('Dauer des Qualifyings', QUALI_SEKUNDEN.map(s => [s, dauerText(s)]), Number(cfg.qsek), qsek => setCfg({ qsek })), 'Alle spielen gleichzeitig auf dem eigenen Handy. ' + PUNKTE_TEXT);
  add('Finale', seg('Größe des Finales', FINAL_GROESSEN.map(n => [n, n + ' Personen']), Number(cfg.finalN), finalN => setCfg({ finalN })));
  if (wo === 'setup') add('Länge', seg('Begriffe im Finale', FINAL_FRAGEN.map(n => [n, n + ' Begriffe']), Number(cfg.fragen), fragen => setCfg({ fragen })), `Pro Begriff ${ZEIT_PRO_BEGRIFF / 1000} Sekunden Zeit. Es zählt der Bestwert, wie im Qualifying.`);
}
function bigCount(num, text) {
  let el = $('#bigcount');
  if (num == null) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'bigcount'; el.className = 'bigcount'; document.body.appendChild(el); }
  el.innerHTML = `<div><b>${num}</b><span>${esc(text || '')}</span></div>`;
}
const einstellText = x => `${THEMEN[x.thema].name} · ${STUFE_TEXT[x.stufe].name}`;

// ---------------------------------------------------------------- Bildschirme
function render() {
  if (!room) return;
  if (room.phase !== 'final' && room.phase !== 'podium') stopFinal();
  switch (room.phase) {
    case 'lobby': return lobby();
    case 'quali': return quali();
    case 'final-setup': return setup();
    case 'final': return final();
    case 'podium': return podium();
  }
}

function lobby() {
  if (screen !== 'lobby') {
    screen = 'lobby';
    view.innerHTML = `<div class="tpage"><div class="lobby">
      <div class="tcard joinbox">
        <h2>Mitspielen!</h2>
        <canvas id="qr" class="qr" role="img" aria-label="QR-Code zum Mitspielen"></canvas>
        <div class="joinurl">${esc(location.host)}/mitspielen</div>
        <div>Code: <span class="joincode">${esc(sess.code)}</span></div>
      </div>
      <div class="lobbyright">
        <div class="tcard" style="flex:1;min-height:0">
          <div class="thead"><h2 id="nameCount">Angemeldet</h2></div>
          <div class="names" id="names"></div>
        </div>
        <div class="tcard"><div class="optgrid" id="opts"></div></div>
        <div class="tactions">
          <p class="hint grow">Auf dem Handy steht ein Begriff, alle tippen die Stelle auf der Abbildung an. Erst spielen alle gleichzeitig (Qualifying), die Besten kommen ins Finale am Beamer.</p>
          <button class="big-btn" id="btnStart">Qualifying starten <span class="kbd">Enter</span></button>
        </div>
      </div>
    </div></div>`;
    drawQR($('#qr'), joinUrl());
    optionen($('#opts'), 'lobby');
    $('#btnStart').onclick = startQuali;
  }
  const ps = room.players;
  $('#nameCount').textContent = ps.length ? `Angemeldet: ${ps.length}` : 'Angemeldet';
  $('#names').innerHTML = ps.length ? ps.map(p => `<span class="name ${p.online ? '' : 'off'} ${bekannt.has(p.pid) ? '' : 'neu'}">${esc(p.name)}<button class="x" data-pid="${esc(p.pid)}" title="${esc(p.name)} entfernen" aria-label="${esc(p.name)} entfernen">×</button></span>`).join('')
    : '<p class="empty">Noch niemand da. Scannt den QR-Code und gebt euren Namen ein.</p>';
  ps.forEach(p => bekannt.add(p.pid));
  $('#names').querySelectorAll('.x').forEach(b => { b.onclick = () => send({ t: 'kick', pid: b.dataset.pid }); });
  $('#btnStart').disabled = !ps.length;
}
function startQuali() {
  Ton.init();
  if (!room || !room.players.length) return toast('Es hat sich noch niemand angemeldet.');
  send({ t: 'quali-start', cfg });
}

let qualiTimer = 0;
function quali() {
  const Q = room.quali;
  if (screen !== 'quali:' + Q.nr) {
    screen = 'quali:' + Q.nr;
    view.innerHTML = `<div class="tpage">
      <div class="qhead">
        <div class="tcard"><div class="thead"><div><h2>Qualifying</h2><p>${esc(einstellText(Q))} · ${Q.anzahl} Begriffe · ${dauerText(Math.round((Q.endAt - Q.startAt) / 1000))} · alle spielen gleichzeitig auf dem Handy</p></div></div>
          <p class="hint">${esc(PUNKTE_TEXT)}</p></div>
        <div class="tcard qside"><div class="qtimer" id="qTimer"></div><canvas id="qrSmall" class="qr small" role="img" aria-label="QR-Code für Nachzügler"></canvas></div>
      </div>
      <div class="rkhead"><span>gerade</span><span>Treffer</span><span>Bestwert</span></div>
      <div class="ranks" id="ranks"></div>
      <div class="tactions"><p class="hint grow" id="qHint"></p>
        <button class="ghost-btn" id="btnBack">Zurück zur Anmeldung</button>
        <button class="big-btn" id="btnEnd"></button></div>
    </div>`;
    drawQR($('#qrSmall'), joinUrl());
    $('#btnEnd').onclick = endQuali;
    $('#btnBack').onclick = () => { if (confirm('Zurück zur Anmeldung? Die Ergebnisse dieses Qualifyings werden gelöscht.')) send({ t: 'to-lobby' }); };
    clearInterval(qualiTimer);
    let gemeldet = 0;
    const tick = () => {
      if (screen !== 'quali:' + Q.nr || !room || room.phase !== 'quali') { clearInterval(qualiTimer); bigCount(null); return; }
      const now = serverNow();
      const vor = Q.startAt - now;
      if (vor > 0) { const s = Math.ceil(vor / 1000); bigCount(s <= 3 ? s : '…', 'Alle schauen aufs eigene Handy!'); } else bigCount(null);
      const el = $('#qTimer');
      const rest = Math.min(Q.endAt - Q.startAt, Q.endAt - now);
      if (!room.quali.open) { el.className = 'qtimer um'; el.innerHTML = 'Endstand'; }
      else if (rest > 0) { el.className = 'qtimer' + (rest <= 10000 ? ' knapp' : ''); el.innerHTML = `${mmss(rest)}<small>NOCH</small>`; }
      else {
        el.className = 'qtimer um'; el.innerHTML = 'Zeit um!<small>AUSWERTUNG …</small>';
        if (now > Q.endAt + SCHLUSS_GNADE && now - gemeldet > 3000) { gemeldet = now; send({ t: 'quali-schluss', nr: Q.nr }); }
      }
    };
    qualiTimer = setInterval(tick, 200);
    tick();
  }
  const offen = room.quali.open;
  const ps = room.players;
  const ranked = ps.filter(p => p.q).sort((a, b) => a.rank - b.rank);
  const rest = ps.filter(p => !p.q);
  const N = cfg.finalN;
  const row = (p, place) => {
    const st = offen ? `<span class="stt live">${p.q ? p.q.cur + ' P.' : 'spielt …'}</span>` : '<span></span>';
    return `<div class="rk ${place && place <= N ? 'fin' : ''} ${p.online ? '' : 'off'}"><span class="p">${place ? place + '.' : ''}</span><span class="nm">${esc(p.name)}</span>${st}<span class="tm">${treffer(p.q)}</span><span class="lv">${p.q ? p.q.best : 0}</span></div>`;
  };
  $('#ranks').innerHTML = ranked.map(p => row(p, p.rank)).join('') + rest.map(p => row(p, 0)).join('');
  const btn = $('#btnEnd');
  btn.innerHTML = offen ? 'Qualifying beenden <span class="kbd">Enter</span>' : 'Weiter zum Finale <span class="kbd">Enter</span>';
  btn.classList.toggle('pulse', !offen);
  $('#qHint').textContent = offen
    ? `Es zählt der Bestwert: die meisten Punkte am Stück (Zahl rechts). Die ersten ${N} kommen ins Finale.`
    : `Zeit um! Das ist der Endstand. Die ersten ${N} kommen ins Finale.`;
}
function endQuali() {
  const Q = room.quali;
  const rest = Q.endAt - serverNow();
  if (Q.open && rest > 0 && Date.now() - quitArmed > 4000) {
    quitArmed = Date.now();
    return toast(`Das Qualifying läuft noch ${Math.ceil(rest / 1000)} Sekunden. Nochmal drücken, um es jetzt zu beenden (der Bestwert bis jetzt zählt).`);
  }
  quitArmed = 0;
  send({ t: 'quali-end' });
}

function setup() {
  const f = room.final || { p: [] };
  const ranked = room.players.filter(p => p.rank > 0).sort((a, b) => a.rank - b.rank);
  const others = room.players.filter(p => !(p.rank > 0));
  const all = ranked.concat(others);
  if (screen !== 'setup') {
    screen = 'setup';
    view.innerHTML = `<div class="tpage">
      <div class="thead"><div><h2>Finale</h2><p>Die Besten aus dem Qualifying sind ausgewählt. Der Begriff erscheint am Beamer und auf den Handys der Finalisten. Getippt wird auf dem Handy.</p></div></div>
      <div class="tcard"><div class="slots" id="slots"></div></div>
      <div class="tcard"><div class="optgrid" id="opts"></div></div>
      <div class="ranks" id="ranks"></div>
      <div class="tactions"><button class="ghost-btn" id="btnLobby">Neues Spiel <span class="kbd">Esc</span></button><span class="grow"></span>
        <button class="big-btn" id="btnFinal">Finale starten <span class="kbd">Enter</span></button></div>
    </div>`;
    optionen($('#opts'), 'setup');
    // Größe des Finales geändert → Auswahl anpassen
    $('#opts').addEventListener('click', () => setTimeout(() => {
      const cur = (room.final && room.final.p) || [];
      if (cur.length !== cfg.finalN) {
        const r = room.players.filter(p => p.rank > 0).sort((a, b) => a.rank - b.rank).map(p => p.pid);
        const next = cur.slice(0, cfg.finalN);
        for (const pid of r) if (next.length < cfg.finalN && !next.includes(pid)) next.push(pid);
        send({ t: 'final-pick', p: next });
      }
    }, 0));
    $('#btnLobby').onclick = toLobby;
    $('#btnFinal').onclick = startFinal;
  }
  const slots = $('#slots');
  const n = Math.min(cfg.finalN, Math.max(2, all.length));
  slots.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const pid = f.p[i] || '';
    const pl = room.players.find(p => p.pid === pid);
    const d = document.createElement('div'); d.className = 'slot';
    d.innerHTML = `<h3>Finalist/in ${i + 1}</h3>`;
    const sel = document.createElement('select');
    sel.innerHTML = '<option value="">– niemand –</option>' + all.map(p => `<option value="${esc(p.pid)}" ${p.pid === pid ? 'selected' : ''}>${p.rank ? p.rank + '. ' : ''}${esc(p.name)}${p.q ? ' · ' + p.q.best + ' Punkte' : ''}</option>`).join('');
    sel.onchange = () => {
      const next = [];
      slots.querySelectorAll('select').forEach(s => { if (s.value && !next.includes(s.value)) next.push(s.value); });
      send({ t: 'final-pick', p: next });
    };
    d.appendChild(sel);
    const on = document.createElement('div');
    on.className = 'online ' + (pl ? (pl.online ? 'ja' : 'nein') : '');
    on.textContent = pl ? (pl.online ? '● Handy verbunden' : '● Handy nicht verbunden: Seite neu öffnen') : '';
    d.appendChild(on);
    slots.appendChild(d);
  }
  $('#ranks').innerHTML = ranked.map(p => `<div class="rk ${f.p.includes(p.pid) ? 'fin' : ''}"><span class="p">${p.rank}.</span><span class="nm">${esc(p.name)}</span><span></span><span class="tm">${treffer(p.q)}</span><span class="lv">${p.q ? p.q.best : 0}</span></div>`).join('');
  $('#btnFinal').disabled = f.p.length < 2;
}
function startFinal() {
  Ton.init();
  const f = room.final || { p: [] };
  if (f.p.length < 2) return toast('Bitte mindestens zwei Personen für das Finale auswählen.');
  send({ t: 'final-start', p: f.p, cfg });
}
function toLobby() {
  if (!confirm('Neues Spiel starten? Alle bleiben angemeldet, die Ergebnisse werden gelöscht.')) return;
  send({ t: 'to-lobby' });
}

// ---------------------------------------------------------------- Finale
let FB = null; // { nr, figur, q, revealed, timers, raf }
function stopFinal() {
  if (!FB) return;
  FB.timers.forEach(clearTimeout);
  clearInterval(FB.iv);
  cancelAnimationFrame(FB.raf);
  bigCount(null);
  FB = null;
}

function final() {
  const f = room.final;
  if (!FB || FB.nr !== f.nr || screen !== 'final:' + f.nr) {
    stopFinal();
    screen = 'final:' + f.nr;
    view.innerHTML = `<div class="tpage"><div class="final">
      <div class="figur" id="fFigur"></div>
      <div class="fright">
        <div class="fbegriff" id="fBegriff"></div>
        <div class="zeitbalken" id="fBarBox"><i id="fBar"></i></div>
        <div class="fcards" id="fCards"></div>
        <div class="tactions"><button class="ghost-btn" id="btnStop" title="Wer noch nicht getippt hat, bekommt 0 Punkte">Begriff beenden</button><button class="ghost-btn" id="btnAbort">Finale abbrechen</button></div>
      </div>
    </div></div>`;
    FB = { nr: f.nr, figur: erstelleFigur($('#fFigur')), q: -1, revealed: -1, timers: [], raf: 0, iv: 0 };
    $('#btnAbort').onclick = () => { if (confirm('Finale abbrechen? Es geht zurück zur Auswahl der Finalisten.')) send({ t: 'final-abort' }); };
    $('#btnStop').onclick = () => {
      const g = room && room.final;
      if (!g || g.state !== 'run') return;
      if (serverNow() < g.startAt) return toast('Der Begriff ist noch nicht zu sehen.');
      if (confirm('Begriff jetzt beenden? Wer noch nicht getippt hat, bekommt 0 Punkte.')) send({ t: 'runde-stopp', nr: g.nr, q: g.q });
    };
    FB.iv = setInterval(() => { if (FB && room && room.final && room.phase === 'final') karten(room.final); }, 500);
  }
  if (f.last && FB.revealed !== f.last.q) aufloesung(f);
  if (f.state === 'run' && FB.q !== f.q) planeFrage(f);
  karten(f);
}

function begriffBox(html, cls) {
  const el = $('#fBegriff'); if (!el) return;
  el.className = 'fbegriff ' + (cls || '');
  el.innerHTML = html;
}
function zeit(rest, gesamt) {
  const box = $('#fBarBox'), bar = $('#fBar'); if (!box) return;
  if (rest == null) { bar.style.transform = 'scaleX(0)'; box.classList.remove('knapp'); return; }
  bar.style.transform = `scaleX(${Math.max(0, Math.min(1, rest / gesamt))})`;
  box.classList.toggle('knapp', rest < 5000);
}

function planeFrage(f) {
  FB.timers.forEach(clearTimeout); FB.timers = [];
  cancelAnimationFrame(FB.raf);
  FB.q = f.q;
  const fr = f.frage;
  const at = (fn, when) => FB.timers.push(setTimeout(fn, Math.max(0, when - serverNow())));
  if (f.first) {
    FB.figur.zeige(fr.b); FB.figur.leeren();
    zeit(null);
    begriffBox(`<div class="fnr">Finale${f.revanche ? ' · Revanche' : ''} · ${esc(einstellText(f))}</div><div class="fterm">Gleich geht’s los!</div><div class="fwo">${f.n} Begriffe · Getippt wird auf dem Handy</div>`);
    for (let s = 3; s >= 1; s--) at(() => { bigCount(s, 'Gleich kommt der erste Begriff!'); Ton.piep(false); }, f.startAt - s * 1000);
  } else {
    // Während der Auflösung: wann kommt der nächste Begriff?
    const cd = () => {
      const el = $('#fNext'); if (!el || !FB || FB.q !== f.q) return;
      const rest = f.startAt - serverNow();
      if (rest > 0) { el.textContent = `Nächster Begriff in ${Math.ceil(rest / 1000)} …`; FB.timers.push(setTimeout(cd, 250)); }
    };
    cd();
  }
  at(() => {
    bigCount(null);
    if (!FB || FB.q !== f.q) return;
    FB.figur.zeige(fr.b); FB.figur.leeren();
    begriffBox(`<div class="fnr">Begriff ${f.q + 1} von ${f.n}</div><div class="fwo">Wo ist …</div><div class="fterm ${fr.t.length > 20 ? 'lang' : ''}">${esc(fr.t)}</div>`);
    Ton.neu();
    karten(room.final);
    const tick = () => {
      if (!FB || FB.q !== f.q || FB.revealed === f.q) return zeit(null);
      const rest = f.deadline - serverNow();
      zeit(Math.max(0, rest), ZEIT_PRO_BEGRIFF);
      if (rest > 0) FB.raf = requestAnimationFrame(tick);
    };
    FB.raf = requestAnimationFrame(tick);
  }, f.startAt);
  // die letzten 5 Sekunden leise ticken
  for (let s = 5; s >= 1; s--) at(() => { if (FB && FB.q === f.q && FB.revealed !== f.q) Ton.tick(); }, f.deadline - s * 1000);
  // Zeit abgelaufen: dem Server Bescheid geben (er wertet dann aus)
  at(() => send({ t: 'tick', nr: f.nr, q: f.q }), f.deadline + GNADE + 200);
  at(() => { if (room && room.final && room.final.q === f.q && room.phase === 'final' && FB && FB.revealed !== f.q) send({ t: 'tick', nr: f.nr, q: f.q }); }, f.deadline + GNADE + 2500);
}

function aufloesung(f) {
  const L = f.last;
  FB.revealed = L.q;
  cancelAnimationFrame(FB.raf);
  zeit(null);
  bigCount(null);
  const fig = FB.figur;
  fig.zeige(L.frage.b); fig.leeren();
  fig.markiere(L.frage.s, 'ziel');
  L.ans.forEach((a, i) => { if (a && a.x != null) fig.punkt(a.x, a.y, a.ok ? 'ok' : 'bad', String(i + 1), FARBEN[i]); });
  const richtig = L.ans.filter(a => a && a.ok).length;
  begriffBox(`<div class="fnr">Auflösung · Begriff ${L.q + 1} von ${f.n} · ${richtig === L.ans.length ? 'alle richtig!' : richtig ? richtig + ' von ' + L.ans.length + ' richtig' : 'niemand richtig'}</div>
    <div class="fterm ${L.frage.t.length > 20 ? 'lang' : ''}">${esc(L.frage.t)}</div>${L.frage.a ? `<div class="falt">= ${esc(L.frage.a)}</div>` : ''}<div class="fnext" id="fNext"></div>`, 'aufl');
  if (richtig) Ton.richtig(); else Ton.fehler();
}

// Karten der Finalisten: Punkte und Bestwert zeigen erst nach der Auflösung den neuen Stand
function karten(f) {
  const el = $('#fCards'); if (!el || !f.st) return;
  const now = serverNow();
  const zeigtAuflösung = f.last && (room.phase === 'podium' || (f.last.q === f.q - 1 && now < f.startAt) || f.state === 'done');
  el.innerHTML = f.p.map((pid, i) => {
    const st = f.last ? f.last.st[i] : { cur: 0, best: 0, r: 0 };
    let cls = '', txt = '';
    if (zeigtAuflösung) {
      const a = f.last.ans[i];
      if (a && a.ok) { cls = 'ok'; txt = `✓ richtig <b>+${a.pts}</b>`; }
      else if (a) { cls = 'bad'; txt = a.why === 'zeit' ? '✗ Zeit um' : a.why === 'stopp' ? '✗ nicht getippt' : '✗ ' + esc(getipptText(a.hit, f.stufe) || 'daneben'); }
    } else if (f.state === 'run' && now >= f.startAt) {
      const x = f.st[i];
      if (x.ans) { cls = 'getippt'; txt = '● hat getippt'; } else txt = 'überlegt …';
    } else txt = 'bereit';
    const off = f.online && !f.online[i] && room.phase === 'final' ? '<div class="warn">Handy nicht verbunden!</div>' : '';
    return `<div class="fcard ${cls}" style="--c:${FARBEN[i]}"><div class="fn"><i>${i + 1}</i>${esc(f.names[i])}</div><div class="fbest">${st.best}<small>BESTWERT</small></div><div class="fs">${txt} · Punkte <b>${st.cur}</b></div>${off}</div>`;
  }).join('');
}

// ---------------------------------------------------------------- Siegerehrung
let podiumT = 0;
function podium() {
  const f = room.final;
  if (screen === 'podium:' + f.nr) return;
  // Erst die Auflösung des letzten Begriffs am Finale-Bildschirm zeigen
  if (screen === 'final:' + f.nr && FB) {
    if (f.last && FB.revealed !== f.last.q) aufloesung(f);
    karten(f);
    FB.timers.forEach(clearTimeout); FB.timers = []; cancelAnimationFrame(FB.raf); zeit(null);
    const nx = $('#fNext'); if (nx) nx.textContent = 'Das war der letzte Begriff!';
    clearTimeout(podiumT);
    podiumT = setTimeout(() => { screen = 'pre-podium'; podiumZeigen(); }, 5000);
    screen = 'final-end:' + f.nr;
    return;
  }
  if (screen === 'final-end:' + f.nr) return;
  podiumZeigen();
}
function podiumZeigen() {
  const f = room && room.final; if (!f || room.phase !== 'podium') return;
  stopFinal();
  screen = 'podium:' + f.nr;
  const order = f.p.map((pid, i) => ({ name: f.names[i], place: f.places[i], x: f.st[i] })).sort((a, b) => a.place - b.place);
  const w = order[0];
  view.innerHTML = `<div class="tpage"><div class="podium">
      <div class="tcard winner">
        <div class="pokal">🏆</div>
        <h2>${esc(w.name)} gewinnt!</h2>
        <p>Bestwert ${w.x.best} Punkte · ${w.x.r} von ${f.n} richtig</p>
        <ol class="places">${order.map(o => `<li>${o.place}. ${esc(o.name)} <span>${o.x.best} Punkte · ${o.x.r} richtig</span></li>`).join('')}</ol>
      </div>
      <div class="tcard seqcard"><h2 style="font-size:1.3em">Die Begriffe zum Nachlesen</h2>
        <ul class="olist">${f.bisher.map((it, j) => `<li><span class="nr">${j + 1}.</span><span><b>${esc(it.t)}</b>${it.a ? ` = ${esc(it.a)}` : ''}</span></li>`).join('')}</ul>
      </div>
    </div>
    <div class="tactions"><button class="ghost-btn" id="btnLobby">Neues Spiel <span class="kbd">Esc</span></button>
      <button class="ghost-btn" id="btnOther">Andere Finalisten</button><span class="grow"></span>
      <button class="big-btn" id="btnRev">Revanche <span class="kbd">Enter</span></button></div>
  </div>`;
  $('#btnLobby').onclick = toLobby;
  $('#btnOther').onclick = () => send({ t: 'to-setup' });
  $('#btnRev').onclick = () => { Ton.init(); send({ t: 'revanche', cfg }); };
  Ton.fanfare();
  konfetti();
}
function konfetti() {
  const c = document.createElement('div'); c.className = 'confetti';
  const cols = ['#ffb238', '#ff5d73', '#4da3ff', '#3ddc97', '#b57bff', '#fff'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = cols[i % cols.length];
    p.style.animationDuration = 2.4 + Math.random() * 2.6 + 's';
    p.style.animationDelay = Math.random() * 1.2 + 's';
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 6500);
}

// ---------------------------------------------------------------- Tasten
document.addEventListener('keydown', e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (!$('#dlg').hidden) { if (e.key === 'Escape') $('#dlg').hidden = true; return; }
  if (!room) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (room.phase === 'lobby') startQuali();
    else if (room.phase === 'quali') endQuali();
    else if (room.phase === 'final-setup') startFinal();
    else if (room.phase === 'podium' && screen.startsWith('podium')) { Ton.init(); send({ t: 'revanche', cfg }); }
  } else if (e.key === 'Escape') {
    if (room.phase === 'final-setup' || (room.phase === 'podium' && screen.startsWith('podium'))) toLobby();
  } else if (e.key === 'f' || e.key === 'F') vollbild();
  else if (e.key === 'm' || e.key === 'M') btnTon.click();
});

// Für den automatischen Test
window.__woists = { figur: () => FB && FB.figur };

// ---------------------------------------------------------------- Start
if (!sess || !sess.code || !sess.key) newSession(); else connect();
