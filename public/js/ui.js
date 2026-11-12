// Gemeinsame Anzeige-Bausteine für Handy und Übungsseite
import { name } from './figur.js';

const $ = s => document.querySelector(s);
export const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function spielfeldZeigen(on) {
  document.body.classList.toggle('spielt', !!on);
  $('#spielfeld').hidden = !on;
  $('#panel').hidden = !!on;
}

// Begriff über der Abbildung
export function frageAnzeigen(it, text = 'Wo ist …') {
  const el = $('#frage');
  el.className = 'frage';
  el.innerHTML = `<small>${esc(text)}</small><b class="${it.t.length > 22 ? 'lang' : ''}">${esc(it.t)}</b>`;
}
export function frageText(titel, unter, art) {
  const el = $('#frage');
  el.className = 'frage ' + (art || '');
  el.innerHTML = `<small>${esc(unter || '')}</small><b>${esc(titel)}</b>`;
}

// Was wurde getippt? z. B. „Tibia (Schienbein)“
export function getipptText(hit, stufe) {
  const n = hit ? name(hit, stufe) : null;
  return n ? n.t + (n.a ? ` (${n.a})` : '') : '';
}

// Ergebnis eines Tipps über der Abbildung
export function ergebnisAnzeigen(res, stufe) {
  const el = $('#frage'), it = res.it;
  if (res.ok) {
    el.className = 'frage ok';
    el.innerHTML = `<small>Richtig! ✓</small><b>${esc(it.t)} <span class="plus">+${res.pts}</span></b>`;
    return;
  }
  el.className = 'frage bad';
  const titel = res.why === 'zeit' ? 'Zeit um!' : res.why === 'stopp' ? 'Begriff beendet' : 'Daneben!';
  const got = res.why === 'falsch' ? getipptText(res.hit, stufe) : '';
  el.innerHTML = `<small>${titel} Deine Punkte sind wieder bei 0.</small>
    <div class="aufl"><span>Gesucht:</span> <b>${esc(it.t)}</b>${it.a ? ` = ${esc(it.a)}` : ''}</div>
    ${res.why === 'falsch' ? `<div class="aufl getippt"><span>Du hast getippt:</span> ${got ? esc(got) : 'eine Stelle ohne Begriff'}</div>` : ''}`;
}

export function zeitbalken(rest, gesamt) {
  const box = $('#sBarBox'), bar = $('#sBar');
  if (rest == null) { bar.style.transform = 'scaleX(0)'; box.classList.remove('knapp'); return; }
  const f = Math.max(0, Math.min(1, rest / gesamt));
  bar.style.transform = `scaleX(${f})`;
  box.classList.toggle('knapp', rest < 5000);
}

export function infoZeile(html) {
  const el = $('#sInfo');
  if (el.innerHTML !== html) el.innerHTML = html;
}

export function countdown(num, text) {
  const el = $('#countdown');
  if (num == null) { el.hidden = true; return; }
  el.hidden = false;
  const b = $('#cdNum');
  if (b.textContent !== String(num)) { b.textContent = num; b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
  $('#cdText').textContent = text || '';
}

// Liste von Begriffen mit beiden Wörtern (z. B. „Das solltest du noch üben“)
export function begriffListe(items, mitNr) {
  return `<ul class="olist">${items.map((it, j) => `<li>${mitNr ? `<span class="nr">${j + 1}.</span>` : ''}<span><b>${esc(it.t)}</b>${it.a ? ` = ${esc(it.a)}` : ''}</span></li>`).join('')}</ul>`;
}

let toastT = 0;
export function toast(t) {
  const el = $('#toast'); if (!el) return;
  el.textContent = t; el.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 4200);
}

// Bildschirm nicht ausgehen lassen, solange gespielt wird
let lock = null, lockWanted = false;
export async function wachHalten(on) {
  lockWanted = !!on;
  try {
    if (on && !lock && navigator.wakeLock) {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } else if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && lockWanted) wachHalten(true); });

export const punkteText = n => n === 1 ? '1 Punkt' : n + ' Punkte';
export const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
