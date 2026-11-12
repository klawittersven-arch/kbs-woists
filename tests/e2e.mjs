// Browser-Durchlauf: Beamer + 5 Handys durch Qualifying, Finale (4 Personen) und ein zweites Finale (2 Personen),
// dazu Übungsseite, Erkunden und eine Prüfung, dass jeder Begriff auf dem Handy gut antippbar ist.
// Start:  node tests/e2e.mjs      (startet den lokalen Server selbst; Bildschirmfotos in tests/ergebnisse/)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

let chromium;
try { ({ chromium } = await import(process.env.PLAYWRIGHT || 'playwright')); }
catch (e) { ({ chromium } = createRequire(import.meta.url)('playwright')); }

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'tests', 'ergebnisse');
fs.mkdirSync(OUT, { recursive: true });
// Mit Adresse (z. B. node tests/e2e.mjs http://127.0.0.1:8787 bei laufendem „npx wrangler dev“) wird kein eigener Server gestartet
const PORT = 8790, BASE = process.argv[2] || `http://127.0.0.1:${PORT}`;
let srv = null;
if (!process.argv[2]) {
  srv = spawn(process.execPath, [path.join(ROOT, 'server', 'local.mjs')], { env: { ...process.env, PORT: String(PORT) }, stdio: 'pipe' });
  await new Promise(r => srv.stdout.once('data', r));
}

const { BEGRIFFE } = await import('../public/js/inhalte.js');
const { BILD_LISTE } = await import('../public/js/regeln.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));
// Zählt, ob eine Seite eine Tonausgabe (AudioContext) startet – Handys müssen stumm bleiben
const audioZaehler = () => {
  window.__audio = 0;
  const A = window.AudioContext || window.webkitAudioContext;
  if (!A) return;
  const Z = function (...a) { window.__audio++; return new A(...a); };
  Z.prototype = A.prototype;
  window.AudioContext = window.webkitAudioContext = Z;
};
const log = (...a) => console.log(new Date().toISOString().slice(14, 23), ...a);
const errors = [];
const shot = (p, name, full) => p.screenshot({ path: path.join(OUT, name + '.png'), fullPage: !!full });
const HANDY = { viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };

// Auf dem Handy tippen: 'ok' = gesuchte Stelle, 'falsch' = eine andere, weit entfernte Stelle mit Namen
const ANDERE = ['cor', 'hepar', 'femur', 'cranium', 'tibia', 'humerus', 'pulmo', 'gaster', 'vesica-urinaria', 'm-gluteus-maximus', 'm-rectus-abdominis', 'm-trapezius', 'm-pectoralis-major', 'm-gastrocnemius', 'm-quadriceps-femoris'];
async function tippe(p, art) {
  await p.waitForFunction(() => window.__woists && window.__woists.ziel(), null, { timeout: 30000 });
  const ziel = await p.evaluate(() => window.__woists.ziel());
  const pt = await p.evaluate(([s, art, andere]) => {
    const f = window.__woists.figur();
    const own = f.punktFuer(s);
    if (art === 'ok') return own;
    for (const k of andere) {
      if (k === s) continue;
      const q = f.punktFuer(k, 4);
      if (q && Math.hypot(q.x - own.x, q.y - own.y) > 60) return { ...q, stelle: k };
    }
    return null;
  }, [ziel.s, art, ANDERE]);
  if (!pt) throw new Error('Kein Punkt für ' + ziel.s + ' (' + art + ')');
  await p.touchscreen.tap(pt.x, pt.y);
  return { ziel, pt };
}
const text = async (p, sel) => (await p.textContent(sel)).replace(/\s+/g, ' ').trim();

// Live-Adresse aus einer Umgebung mit Proxy (z. B. Cloud-Sitzung): Browser über den Proxy schicken
const proxy = process.argv[2] && (process.env.HTTPS_PROXY || process.env.https_proxy);
const browser = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
let ok = false;
try {
  // ================================================================ Anmeldung
  const tctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const T = await tctx.newPage();
  T.on('pageerror', e => errors.push('Beamer: ' + e.message));
  T.on('dialog', d => d.accept());
  await T.goto(BASE + '/lehrer');
  await T.waitForSelector('#qr');
  const code = (await T.textContent('#codeChip')).replace('Code ', '').trim();
  log('Code', code);

  const names = [['Lena', 'K'], ['Tom', 'B'], ['Aylin', 'S'], ['Max', 'M'], ['Sara', 'P']];
  const phones = [];
  for (const [first, ini] of names) {
    const ctx = await browser.newContext(HANDY);
    await ctx.addInitScript(audioZaehler);
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(first + ': ' + e.message));
    await p.goto(`${BASE}/mitspielen?c=${code}`);
    await p.fill('#fFirst', first); await p.fill('#fInit', ini);
    await p.click('button[type=submit]');
    await p.waitForSelector('.waitdots');
    phones.push({ p, name: first });
  }
  const ph = n => phones.find(x => x.name === n).p;
  await T.waitForFunction(() => document.querySelectorAll('.name').length === 5);
  await shot(T, '01-beamer-lobby');
  await shot(phones[0].p, '02-handy-warten');

  // ================================================================ Qualifying: Organe, Einfach, 90 Sekunden
  await T.click('.seg[aria-label="Thema"] button:has-text("Organe")');
  await T.click('.seg[aria-label="Schwierigkeit"] button:has-text("Einfach")');
  await T.click('.seg[aria-label="Dauer des Qualifyings"] button:has-text("90 Sekunden")');
  await sleep(300);
  await T.keyboard.press('Enter');
  const { auswahl } = await import('../public/js/regeln.js');
  const organeEinfach = new Set(auswahl(BEGRIFFE, 'organe', 'einfach').map(e => e.t));
  // Plan je Handy: ok / falsch nacheinander
  const plan = {
    Lena: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
    Tom: ['ok', 'ok', 'ok', 'ok', 'falsch'],
    Max: ['ok', 'falsch', 'ok', 'ok'],
    Aylin: ['ok'],
    Sara: ['falsch'],
  };
  const t0 = Date.now();
  await Promise.all(phones.map(async ({ p, name }) => {
    for (const [k, art] of plan[name].entries()) {
      const { ziel, pt } = await tippe(p, art);
      if (!organeEinfach.has(ziel.t)) throw new Error(name + ': Begriff passt nicht zu Organe/Einfach: ' + ziel.t);
      if (name === 'Lena' && k === 0) { await sleep(150); await shot(p, '03-handy-quali-richtig'); }
      if (art === 'falsch') {
        await p.waitForSelector('.frage.bad');
        const t = await text(p, '#frage');
        const erwartet = BEGRIFFE.find(e => e.stelle === pt.stelle).einfach;
        if (!t.includes('Daneben') || !t.includes('Gesucht') || !t.includes(erwartet)) throw new Error(name + ': Auflösung unvollständig: ' + t);
        if (name === 'Max') { await sleep(200); await shot(p, '04-handy-quali-daneben'); }
        await p.click('#btnWeiter');
      } else {
        await p.waitForSelector('.frage.ok');
      }
      await p.waitForFunction(() => window.__woists.ziel(), null, { timeout: 8000 });
    }
  }));
  log('Qualifying gespielt nach', Math.round((Date.now() - t0) / 1000), 's');
  await sleep(800);
  await shot(T, '05-beamer-quali-laeuft');
  // Bestwerte auf den Handys ablesen
  const best = {};
  for (const { p, name } of phones) best[name] = Number((await p.textContent('#sInfo')).match(/Bestwert\s*(\d+)/)[1]);
  log('Bestwerte Handys', JSON.stringify(best));
  if (!(best.Lena >= 6 * 90 && best.Tom >= 4 * 90 && best.Tom <= 400 && best.Max <= 200 && best.Aylin <= 100 && best.Sara === 0)) throw new Error('Bestwerte unplausibel');
  const lvBeamer = await T.$$eval('.rk', els => els.map(e => [e.querySelector('.nm').textContent, Number(e.querySelector('.lv').textContent)]));
  log('Beamer live', JSON.stringify(lvBeamer));
  for (const [nm, v] of lvBeamer) if (best[nm.split(' ')[0]] !== v) throw new Error('Beamer zeigt anderen Bestwert für ' + nm);
  // Ende der Spielzeit abwarten
  await phones[0].p.waitForSelector('.card h2:has-text("Zeit um")', { timeout: 120000 });
  await T.waitForFunction(() => document.querySelector('#qTimer') && document.querySelector('#qTimer').textContent.includes('Endstand'), null, { timeout: 20000 });
  await phones[1].p.waitForSelector('.placebox', { timeout: 10000 });
  await sleep(600);
  await shot(phones[1].p, '06-handy-quali-ergebnis', true);
  await shot(T, '07-beamer-quali-endstand');
  const order = await T.$$eval('.rk .nm', els => els.map(e => e.textContent));
  log('Rangliste', order.join(', '));
  if (order.join() !== 'Lena K.,Tom B.,Max M.,Aylin S.,Sara P.') throw new Error('Rangliste falsch: ' + order.join());
  const ueben = await phones[1].p.textContent('.card:has(h3:has-text("noch üben"))');
  if (!ueben || !ueben.includes('=')) throw new Error('Tom: Liste „noch üben“ fehlt');

  // ================================================================ Finale 1: 4 Personen, Skelett, Schwer, 5 Begriffe
  await T.keyboard.press('Enter');
  await T.waitForSelector('#slots select');
  await T.click('.seg[aria-label="Thema"] button:has-text("Skelett")');
  await T.click('.seg[aria-label="Schwierigkeit"] button:has-text("Schwer")');
  await T.click('.seg[aria-label="Begriffe im Finale"] button:has-text("5 Begriffe")');
  await sleep(400);
  await shot(T, '08-beamer-finale-auswahl');
  await T.keyboard.press('Enter');
  await T.waitForSelector('#fFigur');
  // q2: Aylin tippt nicht (Zeit läuft ab)
  const fplan = [
    { Lena: 'ok', Tom: 'ok', Max: 'ok', Aylin: 'ok' },
    { Lena: 'ok', Tom: 'falsch', Max: 'ok', Aylin: 'falsch' },
    { Lena: 'falsch', Tom: 'ok', Max: 'ok', Aylin: 'nichts' },
    { Lena: 'ok', Tom: 'ok', Max: 'ok', Aylin: 'falsch' },
    { Lena: 'ok', Tom: 'ok', Max: 'falsch', Aylin: 'ok' },
  ];
  const fachSkelett = new Set(auswahl(BEGRIFFE, 'skelett', 'schwer').map(e => e.t));
  for (const [q, runde] of fplan.entries()) {
    await T.waitForFunction(q => document.querySelector('.fbegriff .fnr') && document.querySelector('.fbegriff .fnr').textContent.startsWith(`Begriff ${q + 1} von 5`), q, { timeout: 40000 });
    const term = await T.textContent('.fterm');
    if (!fachSkelett.has(term)) throw new Error('Finale: kein Fachbegriff vom Skelett: ' + term);
    log('Finale Begriff', q + 1, term);
    if (q === 0) {
      // Lena tippt zuerst und wartet dann auf die anderen
      await tippe(ph('Lena'), runde.Lena);
      await ph('Lena').waitForSelector('.frage.warten');
      await shot(ph('Lena'), '09-handy-finale-getippt');
    }
    await Promise.all(Object.entries(runde).map(async ([name, art]) => {
      if (art === 'nichts' || (q === 0 && name === 'Lena')) return;
      const { ziel } = await tippe(ph(name), art);
      if (ziel.t !== term) throw new Error(name + ': anderer Begriff als am Beamer');
    }));
    if (q === 2) {
      await sleep(1500);
      await shot(T, '10-beamer-finale-begriff');
      const getippt = await T.$$eval('.fcard.getippt', els => els.length);
      if (getippt !== 3) throw new Error('Beamer: 3 Finalisten sollten als „hat getippt“ markiert sein, sind ' + getippt);
    }
    // Auflösung abwarten
    await T.waitForFunction(q => document.querySelector('.fbegriff.aufl .fnr') && document.querySelector('.fbegriff.aufl .fnr').textContent.includes(`Begriff ${q + 1} von 5`), q, { timeout: 40000 });
    const dots = await T.$$eval('#fFigur .punkt', els => els.length);
    const soll = Object.values(runde).filter(a => a !== 'nichts').length;
    if (dots !== soll) throw new Error(`Auflösung: ${dots} Punkte statt ${soll}`);
    const cards = await T.$$eval('.fcard', els => els.map(e => e.className.includes(' ok') ? 'ok' : e.className.includes(' bad') ? 'bad' : '?'));
    const sollCards = ['Lena', 'Tom', 'Max', 'Aylin'].map(n => runde[n] === 'ok' ? 'ok' : 'bad');
    if (cards.join() !== sollCards.join()) throw new Error('Karten nach der Auflösung: ' + cards.join() + ' statt ' + sollCards.join());
    if (q === 1) {
      await sleep(400);
      await shot(T, '11-beamer-finale-aufloesung');
      await shot(ph('Tom'), '12-handy-finale-aufloesung-falsch');
      await shot(ph('Lena'), '12b-handy-finale-aufloesung-richtig');
      await shot(ph('Sara'), '13-handy-zuschauer');
    }
    if (q === 2) {
      const t = await text(ph('Aylin'), '#frage');
      if (!t.includes('Zeit um')) throw new Error('Aylin: „Zeit um“ erwartet, steht: ' + t);
    }
  }
  await T.waitForSelector('.winner', { timeout: 30000 });
  await sleep(1500);
  await shot(T, '14-beamer-siegerehrung');
  const places = await T.$$eval('.places li', els => els.map(e => e.textContent.trim()));
  log('Plätze', places.join(' | '));
  // Bestwerte: Max 4 richtig am Stück, Tom 3, Lena 2+2, Aylin 1+1 → Max, Tom, Lena, Aylin
  if (!places[0].startsWith('1. Max') || !places[1].startsWith('2. Tom') || !places[2].startsWith('3. Lena') || !places[3].startsWith('4. Aylin')) throw new Error('Plätze falsch');
  await ph('Max').waitForSelector('.card.good h2:has-text("gewonnen")', { timeout: 10000 });
  await shot(ph('Max'), '15-handy-sieg', true);
  await ph('Aylin').waitForSelector('.card h2:has-text("Platz 4")', { timeout: 10000 });
  await ph('Sara').waitForSelector('.card h2:has-text("Max M. gewinnt")', { timeout: 10000 });

  // ================================================================ Finale 2: 2 Personen, Muskeln, Einfach, „Begriff beenden“
  await T.click('#btnOther');
  await T.waitForSelector('#slots select');
  await T.click('.seg[aria-label="Thema"] button:has-text("Muskeln")');
  await T.click('.seg[aria-label="Schwierigkeit"] button:has-text("Einfach")');
  await T.click('.seg[aria-label="Größe des Finales"] button:has-text("2 Personen")');
  await sleep(600);
  await T.keyboard.press('Enter');
  for (let q = 0; q < 5; q++) {
    await T.waitForFunction(q => document.querySelector('.fbegriff .fnr') && document.querySelector('.fbegriff .fnr').textContent.startsWith(`Begriff ${q + 1} von 5`), q, { timeout: 40000 });
    await tippe(ph('Lena'), 'ok');
    if (q === 1) {
      // Tom tippt nicht: Die Lehrkraft beendet den Begriff
      await sleep(600);
      await T.click('#btnStop');
    } else await tippe(ph('Tom'), q === 3 ? 'falsch' : 'ok');
    if (q === 0) { await sleep(300); await shot(ph('Tom'), '16-handy-finale-muskeln'); }
    await T.waitForFunction(q => document.querySelector('.fbegriff.aufl .fnr') && document.querySelector('.fbegriff.aufl .fnr').textContent.includes(`Begriff ${q + 1} von 5`), q, { timeout: 40000 });
    if (q === 1) {
      const tom = await T.textContent('.fcard:nth-child(2) .fs');
      if (!tom.includes('nicht getippt')) throw new Error('Tom: „nicht getippt“ erwartet: ' + tom);
      await sleep(300); await shot(T, '17-beamer-finale-muskeln-aufloesung');
    }
  }
  await T.waitForSelector('.winner', { timeout: 30000 });
  const places2 = await T.$$eval('.places li', els => els.map(e => e.textContent.trim()));
  log('Plätze', places2.join(' | '));
  if (!places2[0].startsWith('1. Lena')) throw new Error('Plätze (2) falsch');

  // ================================================================ Übungsseite und Erkunden
  const uctx = await browser.newContext(HANDY);
  await uctx.addInitScript(audioZaehler);
  const U = await uctx.newPage();
  U.on('pageerror', e => errors.push('Üben: ' + e.message));
  await U.goto(BASE + '/');
  await U.click('.seg[data-name="thema"] button[data-v="muskeln"]');
  await U.click('.seg[data-name="stufe"] button[data-v="schwer"]');
  await shot(U, '18-ueben-menue');
  await U.click('#btnGo');
  for (const art of ['ok', 'ok', 'falsch']) {
    const { ziel } = await tippe(U, art);
    if (!ziel.t.startsWith('M') && !ziel.t.startsWith('T')) throw new Error('Üben: Fachbegriff erwartet: ' + ziel.t);
    await U.waitForSelector(art === 'ok' ? '.frage.ok' : '.frage.bad');
    if (art === 'falsch') { await shot(U, '19-ueben-daneben'); await U.click('#btnWeiter'); }
  }
  await U.waitForFunction(() => window.__woists.ziel());
  await shot(U, '20-ueben-frage');
  await U.click('#btnEnde');
  await U.waitForSelector('.card h2');
  await shot(U, '21-ueben-ende', true);
  if (!(await U.textContent('.bigstat span')).includes('2 von 3 richtig')) throw new Error('Üben: Ergebnis falsch');
  await U.click('#btnMenu');
  await U.click('#btnErk');
  await U.click('#tabs button[data-b="organe"]');
  const herz = await U.evaluate(() => window.__woists.figur().punktFuer('cor'));
  await U.touchscreen.tap(herz.x, herz.y);
  await sleep(200);
  const erk = await text(U, '#frage');
  if (!erk.includes('Cor') || !erk.includes('Herz')) throw new Error('Erkunden: ' + erk);
  await shot(U, '22-erkunden-organe');
  await U.click('#tabs button[data-b="muskeln-hinten"]');
  const glut = await U.evaluate(() => window.__woists.figur().punktFuer('m-biceps-femoris'));
  await U.touchscreen.tap(glut.x, glut.y);
  await sleep(200);
  const erk2 = await text(U, '#frage');
  if (!erk2.includes('M. biceps femoris') || !erk2.includes('gehört zu')) throw new Error('Erkunden (verschachtelt): ' + erk2);
  await shot(U, '23-erkunden-muskeln-hinten');

  // ================================================================ Jeder Begriff ist auf dem Handy antippbar
  const klein = [];
  for (const b of BILD_LISTE) {
    await U.click(`#tabs button[data-b="${b}"]`);
    await sleep(150);
    await shot(U, '24-bild-' + b);
    const stellen = [...new Set(BEGRIFFE.filter(e => (Array.isArray(e.bild) ? e.bild : [e.bild]).includes(b)).map(e => e.stelle))];
    const res = await U.evaluate(stellen => {
      const f = window.__woists.figur();
      return stellen.map(s => {
        const p = f.punktFuer(s, 1);
        if (!p) return { s, fehlt: true };
        const r = f.pruefe(p.x, p.y, s);
        return { s, flaeche: p.flaeche, ok: r.ok };
      });
    }, stellen);
    for (const r of res) {
      if (r.fehlt || !r.ok) throw new Error(`${b}: ${r.s} ist nicht antippbar`);
      klein.push([r.flaeche, b + ':' + r.s]);
    }
  }
  klein.sort((a, b) => a[0] - b[0]);
  log('Kleinste sichtbare Flächen (Bildschirmpunkte²):', klein.slice(0, 8).map(([f, s]) => s + '=' + f).join(', '));
  if (klein[0][0] < 40) throw new Error('Eine Stelle ist zu klein zum Antippen: ' + klein[0][1]);

  for (const { p, name } of phones) if (await p.evaluate(() => window.__audio)) throw new Error(name + ': Handy hat Ton gestartet');
  if (await U.evaluate(() => window.__audio)) throw new Error('Übungsseite hat Ton gestartet');
  log('Handys und Übungsseite stumm ✓');

  // ================================================================ Sitzung beenden: Daten sofort löschen
  await T.click('#btnSess');
  await T.click('#btnWipe');
  await ph('Sara').waitForSelector('.card h2:has-text("Das Spiel ist beendet")', { timeout: 15000 });
  await T.waitForFunction(old => { const c = document.querySelector('#codeChip'); return c && !c.textContent.includes(old); }, code, { timeout: 15000 });
  await T.waitForSelector('#qr', { timeout: 15000 });
  log('Sitzung gelöscht, Handys informiert, neuer Code am Beamer ✓');
  if (errors.length) throw new Error('JavaScript-Fehler:\n' + errors.join('\n'));
  ok = true;
  log('ALLES OK');
} catch (e) {
  console.error('FEHLER:', e.message);
  if (errors.length) console.error(errors.join('\n'));
} finally {
  await browser.close();
  if (srv) srv.kill();
  process.exit(ok ? 0 : 1);
}
