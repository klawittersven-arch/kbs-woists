/*
 * Bausteine für die Abbildungen (eigene Zeichnungen, SVG).
 *
 * Koordinaten: 200 breit, 505 hoch, die Körpermitte liegt bei x = 100.
 * Gezeichnet wird meist nur die linke Bildhälfte; paar() spiegelt sie auf die andere Seite.
 * Jede antippbare Stelle ist eine Gruppe mit data-s="kennung". Gruppen dürfen ineinander liegen
 * (z. B. liegt „ossa-carpi“ in „manus“): Wer die Hand sucht, darf auch auf die Handwurzel tippen.
 */
export const BREITE = 200, HOEHE = 505;

// Linke Hälfte zeichnen und gespiegelt wiederholen
export const paar = inner => inner + `<g transform="matrix(-1 0 0 1 ${BREITE} 0)">${inner}</g>`;

// Antippbare Stelle
export const stelle = (id, inner, extra = '') => `<g data-s="${id}"${extra ? ' ' + extra : ''}>${inner}</g>`;

export const pfad = (d, attr = '') => `<path d="${d}"${attr ? ' ' + attr : ''}/>`;
export const ellipse = (cx, cy, rx, ry, attr = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${attr ? ' ' + attr : ''}/>`;
export const kreis = (cx, cy, r, attr = '') => `<circle cx="${cx}" cy="${cy}" r="${r}"${attr ? ' ' + attr : ''}/>`;
export const linie = (d, farbe, breite, extra = '') => `<path class="linie" d="${d}" fill="none" stroke="${farbe}" stroke-width="${breite}" stroke-linecap="round" stroke-linejoin="round"${extra ? ' ' + extra : ''}/>`;

// Mehrere Formen mit gemeinsamem Rand zeichnen: erst alle Ränder, dann alle Flächen darüber.
// So verschmelzen überlappende Teile (z. B. Arm und Rumpf) zu einem Umriss.
export function umriss(formen, fuellung, rand, breite = 2.4, extra = '') {
  return `<g fill="${rand}" stroke="${rand}" stroke-width="${breite}" stroke-linejoin="round"${extra ? ' ' + extra : ''}>${formen}</g>` +
    `<g fill="${fuellung}" stroke="none"${extra ? ' ' + extra : ''}>${formen}</g>`;
}

// Zahlen kurz halten
export const z = n => Math.round(n * 10) / 10;

// Symmetrische Form ohne Naht in der Mitte: Die linke Hälfte beginnt und endet auf der Mittellinie (x = 100),
// die rechte Hälfte wird gespiegelt und rückwärts angehängt. Erlaubt sind M, L, C, Q mit absoluten Zahlen.
export function symm(d) {
  const tok = d.match(/[MLCQZ]|-?\d*\.?\d+/gi);
  const segs = []; let cmd = null, nums = [];
  const flush = () => { if (cmd && cmd !== 'Z') segs.push({ cmd, nums: nums.slice() }); nums = []; };
  for (const t of tok) { if (/[A-Z]/i.test(t)) { flush(); cmd = t.toUpperCase(); } else nums.push(Number(t)); }
  flush();
  const m = x => z(BREITE - x);
  const start = segs[0].nums;                    // M x,y
  const pts = [[start[0], start[1]]];           // Endpunkte
  for (const s of segs.slice(1)) pts.push(s.nums.slice(-2));
  let out = d.replace(/Z\s*$/i, '');
  for (let k = segs.length - 1; k >= 1; k--) {
    const s = segs[k], prev = pts[k - 1], n = s.nums;
    if (s.cmd === 'L') out += ` L${m(prev[0])},${prev[1]}`;
    else if (s.cmd === 'Q') out += ` Q${m(n[0])},${n[1]} ${m(prev[0])},${prev[1]}`;
    else if (s.cmd === 'C') out += ` C${m(n[2])},${n[3]} ${m(n[0])},${n[1]} ${m(prev[0])},${prev[1]}`;
  }
  return out + ' Z';
}
