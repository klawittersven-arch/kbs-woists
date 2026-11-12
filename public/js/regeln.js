/*
 * Spielregeln, Zeiten, Punkte und Zufall. Diese Datei lesen Handys, Beamer UND der Cloudflare-Dienst.
 */

export const BILD_LISTE = ['skelett-vorn', 'skelett-hinten', 'muskeln-vorn', 'muskeln-hinten', 'organe'];
export const THEMEN = {
  skelett: { name: 'Skelett', bilder: ['skelett-vorn', 'skelett-hinten'] },
  muskeln: { name: 'Muskeln', bilder: ['muskeln-vorn', 'muskeln-hinten'] },
  organe: { name: 'Organe', bilder: ['organe'] },
  alle: { name: 'Alles gemischt', bilder: BILD_LISTE },
};
export const THEMA_LISTE = Object.keys(THEMEN);
export const STUFEN = ['einfach', 'schwer'];
export const STUFE_TEXT = {
  einfach: { name: 'Einfach', kurz: 'Deutsche Wörter wie „Schienbein“, „Kapuzenmuskel“ oder „Leber“.' },
  schwer: { name: 'Schwer', kurz: 'Fachbegriffe wie „Tibia“, „M. trapezius“ oder „Hepar“. Es kommen auch mehr Begriffe dran.' },
};
export const QUALI_SEKUNDEN = [90, 120, 180];       // Dauer des Qualifyings (voreingestellt: 2 Minuten)
export const FINAL_GROESSEN = [2, 3, 4];
export const FINAL_FRAGEN = [5, 10, 15];            // Begriffe im Finale (voreingestellt: 10)
export const dauerText = s => s % 60 ? s + ' Sekunden' : s === 60 ? '1 Minute' : s / 60 + ' Minuten';

// Zeiten (ms). Großzügig: Getestet wird das Wissen, nicht das Tipptempo.
export const ZEIT_PRO_BEGRIFF = 20000;  // so lange darf man pro Begriff überlegen
export const TEMPO_VOLL = 2000;         // bis hierhin gibt es alle Tempopunkte (Zeit zum Lesen)
export const TEMPO_NULL = 15000;        // ab hier gibt es keine Tempopunkte mehr
export const VORLAUF_START = 5000;      // Countdown vor dem Qualifying und vor dem ersten Begriff im Finale
export const PAUSE_FINALE = 6500;       // Finale: so lange steht die Auflösung am Beamer, dann kommt der nächste Begriff
export const GNADE = 1500;              // so lange nach Ablauf der Zeit zählen Antworten noch (Netz)
export const SCHLUSS_GNADE = 3000;      // so lange nach Ende des Qualifyings zählen Ergebnisse noch (Netz)
export const TOLERANZ_PX = 11;          // so weit (Bildschirmpunkte) darf man danebentippen

// Punkte für einen richtigen Tipp: 50 sicher, dazu bis zu 50 Tempopunkte
export const GRUNDPUNKTE = 50, TEMPOPUNKTE = 50;
export function punkte(ms) {
  ms = Math.max(0, Number(ms) || 0);
  const f = Math.min(1, Math.max(0, (TEMPO_NULL - ms) / (TEMPO_NULL - TEMPO_VOLL)));
  return GRUNDPUNKTE + Math.round(TEMPOPUNKTE * f);
}
export const PUNKTE_TEXT = `Richtig: 50 Punkte, dazu bis zu 50 Tempopunkte (je schneller, desto mehr). Falsch: Deine Punkte fallen auf 0. Es zählt dein Bestwert.`;

// Rangfolge: höherer Bestwert vorn, bei Gleichstand mehr Treffer
export function vergleich(a, b) {
  return ((b.best || 0) - (a.best || 0)) || ((b.r || 0) - (a.r || 0));
}

// Pseudozufall mit Startwert: Alle bekommen dieselbe Reihenfolge
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function zufallsSeed() {
  if (globalThis.crypto && crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 4294967296);
}

// Begriffe für Thema und Stufe: { s: Stelle, b: [Bilder], t: angezeigter Begriff, a: das andere Wort }
export function auswahl(begriffe, thema, stufe) {
  const erlaubt = (THEMEN[thema] || THEMEN.skelett).bilder;
  const schwer = stufe === 'schwer';
  const out = [];
  for (const e of begriffe || []) {
    if (!e || typeof e.stelle !== 'string') continue;
    if (e.nur === 'schwer' && !schwer) continue;
    if (e.nur === 'einfach' && schwer) continue;
    const bilder = (Array.isArray(e.bild) ? e.bild : [e.bild]).filter(b => erlaubt.includes(b));
    if (!bilder.length) continue;
    const de = String(e.einfach || e.schwer || '').trim(), fach = String(e.schwer || e.einfach || '').trim();
    if (!de && !fach) continue;
    const t = schwer ? fach : de, a = schwer ? de : fach;
    out.push({ s: e.stelle, b: bilder, t, a: a === t ? '' : a });
  }
  return out;
}

// Der i-te Begriff einer endlosen, gemischten Reihe. Jeder Durchgang ist neu gemischt,
// derselbe Begriff kommt nie zweimal direkt hintereinander. Ergebnis: { s, b (ein Bild), t, a }
export function frage(liste, seed, i) {
  const n = liste.length;
  if (!n) return null;
  const runde = Math.floor(i / n);
  const perm = mischung(n, seed, runde);
  const e = liste[perm[i % n]];
  const r = rng((seed ^ Math.imul(i + 1, 2654435761)) >>> 0);
  return { s: e.s, b: e.b[Math.floor(r() * e.b.length)], t: e.t, a: e.a };
}
function mischung(n, seed, runde) {
  const r = rng((seed + Math.imul(runde, 7919)) >>> 0);
  const p = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  if (runde > 0 && n > 1) {
    const vorher = mischung(n, seed, runde - 1);
    if (p[0] === vorher[n - 1]) [p[0], p[1]] = [p[1], p[0]];
  }
  return p;
}
export function fragen(liste, seed, anzahl) {
  return Array.from({ length: anzahl }, (_, i) => frage(liste, seed, i)).filter(Boolean);
}
