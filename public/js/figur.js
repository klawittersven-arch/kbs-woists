// Eine Abbildung anzeigen, Tipps auswerten (mit Toleranz) und Stellen markieren
import { BILDER } from './bilder/index.js';
import { BEGRIFFE } from './inhalte.js';
import { TOLERANZ_PX } from './regeln.js';

const NS = 'http://www.w3.org/2000/svg';

// Namen einer gezeichneten Stelle (für die Auflösung „Du hast getippt: …“)
const NAMEN = new Map();
for (const e of BEGRIFFE) if (e && e.stelle && !NAMEN.has(e.stelle)) NAMEN.set(e.stelle, { einfach: e.einfach || e.schwer, schwer: e.schwer || e.einfach });
export function name(stelle, stufe) {
  const n = NAMEN.get(stelle);
  if (!n) return null;
  return stufe === 'schwer' ? { t: n.schwer, a: n.einfach === n.schwer ? '' : n.einfach } : { t: n.einfach, a: n.einfach === n.schwer ? '' : n.schwer };
}
export const hatName = stelle => NAMEN.has(stelle);

// Alle Stellen, in denen ein Element liegt (innen zuerst)
function kette(node, svg) {
  const out = [];
  for (let n = node; n && n !== svg; n = n.parentNode) {
    if (n.getAttribute && n.getAttribute('data-s')) out.push(n.getAttribute('data-s'));
  }
  return out;
}

export function erstelleFigur(el, opts = {}) {
  el.classList.add('figur');
  el.innerHTML = '<div class="fhalter"></div><div class="fansicht" hidden></div>';
  const halter = el.querySelector('.fhalter'), ansicht = el.querySelector('.fansicht');
  let bild = null, svg = null, ueber = null, aktiv = false;

  const zuSvg = (cx, cy) => {
    const m = svg.getScreenCTM().inverse();
    const p = new DOMPoint(cx, cy).matrixTransform(m);
    return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
  };
  const vonSvg = (x, y) => {
    const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM());
    return { x: p.x, y: p.y };
  };
  // Stellen am Bildschirmpunkt (oberstes Element)
  const stellenAn = (cx, cy) => {
    const n = document.elementFromPoint(cx, cy);
    if (!n || !svg || !svg.contains(n)) return [];
    return kette(n, svg);
  };

  const api = {
    get bild() { return bild; },
    get svg() { return svg; },
    zeige(id) {
      if (id === bild && svg) { api.leeren(); return; }
      const B = BILDER[id]; if (!B) return;
      bild = id;
      halter.innerHTML = B.svg;
      svg = halter.querySelector('svg');
      ueber = document.createElementNS(NS, 'g');
      ueber.setAttribute('class', 'ueber');
      ueber.setAttribute('pointer-events', 'none');
      svg.appendChild(ueber);
      ansicht.textContent = B.name + ' · ' + B.ansicht;
      ansicht.className = 'fansicht ' + (B.ansicht === 'von hinten' ? 'hinten' : '');
      ansicht.hidden = false;
      el.dataset.bild = id;
    },
    eingabe(on) { aktiv = !!on; el.classList.toggle('aktiv', aktiv); },
    leeren() {
      if (!svg) return;
      svg.querySelectorAll('.ziel,.falsch,.info').forEach(n => n.classList.remove('ziel', 'falsch', 'info'));
      ueber.innerHTML = '';
    },
    // Stelle hervorheben (art: ziel = richtig, falsch, info). Kleine Stellen bekommen zusätzlich einen Ring.
    markiere(stelle, art = 'ziel', ring = true) {
      if (!svg || !stelle) return 0;
      const els = [...svg.querySelectorAll(`[data-s="${CSS.escape(stelle)}"]`)];
      els.forEach(n => n.classList.add(art));
      if (ring) {
        for (const n of els) {
          const r = n.getBoundingClientRect();
          const a = zuSvg(r.left, r.top), b = zuSvg(r.right, r.bottom);
          const w = b.x - a.x, h = b.y - a.y;
          if (w > 34 || h > 34) continue;
          const e = document.createElementNS(NS, 'ellipse');
          e.setAttribute('cx', (a.x + b.x) / 2); e.setAttribute('cy', (a.y + b.y) / 2);
          e.setAttribute('rx', Math.max(5, w / 2 + 3.5)); e.setAttribute('ry', Math.max(5, h / 2 + 3.5));
          e.setAttribute('class', 'ring ' + art);
          ueber.appendChild(e);
        }
      }
      return els.length;
    },
    // Markierung, wo getippt wurde (wahlweise mit Buchstabe und Farbe, z. B. im Finale)
    punkt(x, y, art, text, farbe) {
      if (!svg || x == null || y == null) return;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'punkt ' + (art || ''));
      g.setAttribute('transform', `translate(${x},${y})`);
      g.innerHTML = `<circle r="${text ? 4.6 : 3.4}"${farbe ? ` style="fill:${farbe}"` : ''}/>` + (text ? `<text y="1.7">${String(text).replace(/[<&>"]/g, '')}</text>` : '');
      ueber.appendChild(g);
    },
    // Tipp auswerten: ok, wenn die gesuchte Stelle am Tipp oder in Fingerbreite daneben liegt
    pruefe(cx, cy, ziel) {
      const R = TOLERANZ_PX;
      const pts = [[0, 0]];
      for (const r of [R * 0.5, R]) for (let k = 0; k < 8; k++) pts.push([r * Math.cos(k * Math.PI / 4), r * Math.sin(k * Math.PI / 4)]);
      let ok = false, hit = '', mitte = null;
      for (const [dx, dy] of pts) {
        const k = stellenAn(cx + dx, cy + dy);
        if (dx === 0 && dy === 0) mitte = k;
        if (k.includes(ziel)) { ok = true; break; }
      }
      // Was wurde getroffen? Die innerste Stelle mit Namen genau am Tipp
      if (mitte) hit = mitte.find(hatName) || '';
      if (ok) hit = ziel;
      const p = svg ? zuSvg(cx, cy) : { x: null, y: null };
      return { ok, hit, x: p.x, y: p.y };
    },
    stellenAn,
    zuSvg, vonSvg,
    // Für Tests: ein Bildschirmpunkt, an dem die Stelle sichtbar ist, und ihre sichtbare Fläche (in Bildschirmpunkten²)
    punktFuer(stelle, schritt = 1.5) {
      if (!svg) return null;
      let best = null, flaeche = 0;
      for (const n of svg.querySelectorAll(`[data-s="${CSS.escape(stelle)}"]`)) {
        const r = n.getBoundingClientRect();
        const mx = (r.left + r.right) / 2, my = (r.top + r.bottom) / 2;
        for (let y = r.top + 0.5; y < r.bottom; y += schritt) for (let x = r.left + 0.5; x < r.right; x += schritt) {
          if (!stellenAn(x, y).includes(stelle)) continue;
          flaeche += schritt * schritt;
          const d = (x - mx) ** 2 + (y - my) ** 2;
          // möglichst weit innen: alle Nachbarn auch getroffen
          const innen = [[3, 0], [-3, 0], [0, 3], [0, -3]].every(([dx, dy]) => stellenAn(x + dx, y + dy).includes(stelle));
          const score = (innen ? 0 : 1e6) + d;
          if (!best || score < best.score) best = { x, y, score };
        }
      }
      return best ? { x: best.x, y: best.y, flaeche: Math.round(flaeche) } : null;
    },
  };
  el.addEventListener('pointerdown', e => {
    if (!aktiv || !opts.onTap || !svg) return;
    e.preventDefault();
    opts.onTap(e.clientX, e.clientY);
  });
  return api;
}
