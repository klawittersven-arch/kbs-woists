// Übungsseite: allein spielen oder in Ruhe erkunden, ohne Klasse und ohne Server
import { store } from './net.js';
import { QuizSpiel } from './spiel.js';
import { erstelleFigur, name, hatName } from './figur.js';
import { BEGRIFFE } from './inhalte.js';
import { BILDER } from './bilder/index.js';
import { auswahl, zufallsSeed, THEMEN, THEMA_LISTE, STUFEN, STUFE_TEXT, BILD_LISTE, PUNKTE_TEXT } from './regeln.js';
import { Ton } from './ton.js';
import { esc, spielfeldZeigen, frageText, zeitbalken, infoZeile, countdown, begriffListe, wachHalten, mmss } from './ui.js';

const $ = s => document.querySelector(s);
const panel = $('#panel');
const SPIELZEIT = 120000;
const opt = Object.assign({ thema: 'skelett', stufe: 'einfach' }, store('woists.ueben') || {});
if (!THEMA_LISTE.includes(opt.thema)) opt.thema = 'skelett';
if (!STUFEN.includes(opt.stufe)) opt.stufe = 'einfach';
let rekorde = store('woists.rekorde') || {};
let spiel = null, timers = [], raf = 0, endAt = 0;

// Auch beim Üben bleibt das Handy stumm
Ton.an = false;

let figur = null, tapHandler = null;
const fig = () => figur || (figur = erstelleFigur($('#figur'), { onTap: (x, y) => tapHandler && tapHandler(x, y) }));
const rkey = () => opt.thema + ':' + opt.stufe;

function seg(name, options, value) {
  return `<div class="seg ${options.length === 3 ? 'c3' : ''}" role="radiogroup" aria-label="${esc(name)}" data-name="${esc(name)}">${options.map(([v, l]) => `<button type="button" role="radio" data-v="${esc(v)}" aria-checked="${v === value}">${esc(l)}</button>`).join('')}</div>`;
}
function rekordText() {
  const r = rekorde[rkey()];
  return r ? `Dein Rekord mit diesen Einstellungen: <b>${r} Punkte</b>` : 'Jedes Spiel dauert 2 Minuten.';
}

function aufraeumen() {
  if (spiel) spiel.stop();
  spiel = null;
  timers.forEach(clearTimeout); timers = [];
  cancelAnimationFrame(raf);
  countdown(null);
  tapHandler = null;
  $('#tabs').hidden = true;
}

function menu() {
  aufraeumen();
  spielfeldZeigen(false);
  wachHalten(false);
  panel.innerHTML = `
    <div class="card">
      <h2>Wo ist’s?</h2>
      <p>Oben steht ein Begriff, z. B. „Kniescheibe“. Tippe auf der Abbildung so schnell wie möglich auf die richtige Stelle.</p>
      <p class="hint">${esc(PUNKTE_TEXT)}</p>
      <div class="settings">
        <div><div class="lbl">Thema</div>${seg('thema', THEMA_LISTE.map(k => [k, THEMEN[k].name]), opt.thema)}</div>
        <div><div class="lbl">Begriffe</div>${seg('stufe', STUFEN.map(k => [k, STUFE_TEXT[k].name]), opt.stufe)}<p class="hint" id="sDesc" style="margin-top:6px">${esc(STUFE_TEXT[opt.stufe].kurz)}</p></div>
      </div>
      <p class="hint" id="rek">${rekordText()}</p>
      <button class="big-btn" id="btnGo">Spielen</button>
      <button class="ghost-btn" id="btnErk">In Ruhe erkunden: Stelle antippen, Namen lesen</button>
    </div>
    <p class="foot">Klassenturnier mit Beamer: <a class="mehr" href="lehrer">Klassenmodus für Lehrkräfte</a><br>Spiel und Abbildungen: © 2026 Sven Klawitter · Karoline-Breitinger-Schule</p>`;
  panel.querySelectorAll('.seg').forEach(g => {
    g.querySelectorAll('button').forEach(b => b.onclick = () => {
      g.querySelectorAll('button').forEach(x => x.setAttribute('aria-checked', String(x === b)));
      opt[g.dataset.name] = b.dataset.v;
      store('woists.ueben', opt);
      $('#sDesc').textContent = STUFE_TEXT[opt.stufe].kurz;
      $('#rek').innerHTML = rekordText();
    });
  });
  $('#btnGo').onclick = start;
  $('#btnErk').onclick = () => erkunden();
}

// ---------------------------------------------------------------- Spielen
function start() {
  aufraeumen();
  const liste = auswahl(BEGRIFFE, opt.thema, opt.stufe);
  spielfeldZeigen(true);
  wachHalten(true);
  $('#sBarBox').hidden = false;
  zeitbalken(null);
  fig().zeige(liste[0].b[0]); fig().leeren(); fig().eingabe(false);
  frageText('Gleich geht’s los', `${THEMEN[opt.thema].name} · ${STUFE_TEXT[opt.stufe].name}`, 'warten');
  spiel = new QuizSpiel({
    figur: fig(), liste, seed: zufallsSeed(), stufe: opt.stufe, weiterBtn: $('#btnWeiter'),
    vorbei: () => performance.now() >= endAt,
    onAntwort: () => info(),
  });
  tapHandler = (x, y) => spiel && spiel.tap(x, y);
  endAt = performance.now() + 3000 + SPIELZEIT;
  let s = 3;
  const cd = () => { if (s === 0) { countdown(null); return; } countdown(s, 'Lies den Begriff und tippe die Stelle an!'); s--; timers.push(setTimeout(cd, 1000)); };
  cd();
  timers.push(setTimeout(() => spiel && spiel.start(), 3000));
  const tick = () => {
    if (!spiel) return;
    info();
    if (performance.now() >= endAt) return ende();
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function info() {
  if (!spiel) return;
  infoZeile(`<span>⏱ <b>${mmss(Math.min(SPIELZEIT, endAt - performance.now()))}</b></span><span class="punkte">Punkte <b>${spiel.cur}</b></span><span>Bestwert <b>${spiel.best}</b></span><button class="ende" id="btnEnde">Beenden</button>`);
  const b = $('#btnEnde'); if (b) b.onclick = () => ende();
}

function ende() {
  const sp = spiel;
  aufraeumen();
  if (!sp) return menu();
  spielfeldZeigen(false);
  wachHalten(false);
  const k = rkey(), alt = rekorde[k] || 0, neu = sp.best > alt;
  if (neu) { rekorde[k] = sp.best; store('woists.rekorde', rekorde); }
  const seen = new Set(), liste = [];
  for (const f of sp.fehler) if (!seen.has(f.it.s + f.it.t)) { seen.add(f.it.s + f.it.t); liste.push(f.it); }
  panel.innerHTML = `
    <div class="card ${neu && sp.best ? 'good' : ''}">
      <h2>${neu && sp.best ? 'Neuer Rekord! 🎉' : 'Zeit um!'}</h2>
      <div class="bigstat"><b>${sp.best}</b><span>Punkte als Bestwert · ${sp.r} von ${sp.n} richtig${!neu && alt ? ` · Rekord: ${alt}` : ''}</span></div>
      <button class="big-btn" id="btnAgain">Nochmal</button>
      <button class="ghost-btn" id="btnMenu">Einstellungen</button>
    </div>
    ${liste.length ? `<div class="card"><h3>Das solltest du noch üben</h3>${begriffListe(liste)}</div>` : ''}`;
  $('#btnAgain').onclick = start;
  $('#btnMenu').onclick = menu;
}

// ---------------------------------------------------------------- Erkunden
function erkunden(bild) {
  aufraeumen();
  const bilder = THEMEN[opt.thema].bilder;
  bild = bild || bilder[0];
  spielfeldZeigen(true);
  $('#sBarBox').hidden = true;
  infoZeile(`<span><b>Erkunden</b> · tippe auf eine Stelle</span><button class="ende" id="btnZurueck">Zurück</button>`);
  $('#btnZurueck').onclick = menu;
  const tabs = $('#tabs');
  tabs.hidden = false;
  tabs.innerHTML = BILD_LISTE.map(b => `<button type="button" data-b="${b}" aria-pressed="${b === bild}">${esc(BILDER[b].name)} ${BILDER[b].ansicht === 'von hinten' ? 'hinten' : 'vorn'}</button>`).join('');
  tabs.querySelectorAll('button').forEach(b => b.onclick = () => erkunden(b.dataset.b));
  fig().zeige(bild); fig().leeren(); fig().eingabe(true);
  frageText('Tippe auf eine Stelle', `${BILDER[bild].name} · ${BILDER[bild].ansicht}`, 'warten');
  tapHandler = (x, y) => {
    fig().leeren();
    const kette = fig().stellenAn(x, y).filter(hatName);
    const p = fig().zuSvg(x, y);
    if (!kette.length) { fig().punkt(p.x, p.y, 'neutral'); return frageText('Hier ist kein Begriff hinterlegt', 'Tippe auf eine andere Stelle', 'warten'); }
    fig().markiere(kette[0], 'info');
    const n = name(kette[0], opt.stufe);
    const teil = kette.slice(1).map(s => name(s, opt.stufe)).filter(Boolean).map(x => x.t);
    const el = $('#frage');
    el.className = 'frage';
    el.innerHTML = `<small>${teil.length ? 'gehört zu: ' + esc(teil.join(' · ')) : esc(BILDER[bild].name + ' · ' + BILDER[bild].ansicht)}</small><b class="${n.t.length > 22 ? 'lang' : ''}">${esc(n.t)}</b>${n.a ? `<div class="aufl">= ${esc(n.a)}</div>` : ''}`;
  };
}

// Für den automatischen Test
window.__woists = { figur: () => figur, ziel: () => (spiel && spiel.offen ? spiel.it : null) };

menu();
