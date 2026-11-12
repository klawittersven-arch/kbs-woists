// Skelett von vorn und von hinten (eigene Zeichnung)
import { paar, stelle, pfad, ellipse, kreis, linie, z, symm } from './basis.js';
import { silhouette } from './koerper.js';

const K = '#f6efdf';      // Knochen
const KR = '#7d6850';     // Rand der Knochen
const KS = '#e2d5bb';     // Knochen hinten (Schatten)
const KN = '#d5e5ee';     // Knorpel
const LOCH = '#6a5642';   // Öffnungen (Augenhöhle, Nase …)
const kn = d => pfad(d, `fill="${K}" stroke="${KR}" stroke-width="0.9" stroke-linejoin="round"`);
const ks = d => pfad(d, `fill="${KS}" stroke="${KR}" stroke-width="0.8" stroke-linejoin="round"`);
const loch = d => pfad(d, `fill="${LOCH}" stroke="none"`);
const fein = (d, w = 0.6) => linie(d, KR, w, 'opacity="0.55"');
// Knochenstab mit Rand (z. B. Rippen, Finger): erst dunkler, dann heller Strich
const stab = (d, w, farbe = K) => linie(d, KR, w + 1.4) + linie(d, farbe, w);

// ---------------------------------------------------------------- Teile, die vorn und hinten gleich sind
function wirbel(y, h, b, mitDorn) {
  // ein Wirbel als abgerundeter Block, wahlweise mit Querfortsätzen und Dornfortsatz (Ansicht von hinten)
  const x0 = 100 - b, x1 = 100 + b, r = Math.min(2.2, h / 2.5);
  let s = kn(`M${z(x0 + r)},${z(y)} L${z(x1 - r)},${z(y)} Q${z(x1)},${z(y)} ${z(x1)},${z(y + r)} L${z(x1)},${z(y + h - r)} Q${z(x1)},${z(y + h)} ${z(x1 - r)},${z(y + h)} L${z(x0 + r)},${z(y + h)} Q${z(x0)},${z(y + h)} ${z(x0)},${z(y + h - r)} L${z(x0)},${z(y + r)} Q${z(x0)},${z(y)} ${z(x0 + r)},${z(y)} Z`);
  if (mitDorn) s += pfad(`M${z(100 - 1.6)},${z(y + 0.6)} L${z(100 + 1.6)},${z(y + 0.6)} L${z(100 + 1.1)},${z(y + h + 1.2)} L${z(100 - 1.1)},${z(y + h + 1.2)} Z`, `fill="${KS}" stroke="${KR}" stroke-width="0.6"`);
  return s;
}
function querfortsatz(y, h, b, weite) {
  return paar(kn(`M${z(100 - b + 0.5)},${z(y + h * 0.25)} L${z(100 - weite)},${z(y + h * 0.15)} Q${z(100 - weite - 1.5)},${z(y + h * 0.5)} ${z(100 - weite)},${z(y + h * 0.8)} L${z(100 - b + 0.5)},${z(y + h * 0.75)} Z`));
}

function halswirbel(hinten) {
  let s = '';
  for (let i = 0; i < 7; i++) s += wirbel(57 + i * 4.4, 3.7, 5.6 + i * 0.25, hinten);
  return stelle('vertebrae-cervicales', s);
}
function brustwirbel(hinten) {
  let s = '';
  for (let i = 0; i < 12; i++) {
    const y = 88.5 + i * 7, h = 6, b = 6 + i * 0.25;
    if (hinten) s += querfortsatz(y, h, b, b + 4.5);
    s += wirbel(y, h, b, hinten);
  }
  return stelle('vertebrae-thoracicae', s);
}
function lendenwirbel(hinten) {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const y = 173 + i * 11.8, h = 10, b = 9 + i * 0.6;
    s += querfortsatz(y, h, b, b + (hinten ? 6.5 : 4.5));
    s += wirbel(y, h, b, hinten);
  }
  return stelle('vertebrae-lumbales', s);
}
function kreuzbein(hinten) {
  let s = kn('M87,232 L113,232 C113.5,244 109,258 100,271 C91,258 86.5,244 87,232 Z');
  // Löcher (Foramina sacralia)
  for (let i = 0; i < 4; i++) s += paar(ellipse(z(93.8 + i * 1.4), z(238 + i * 7.5), 1.5, 1.2, `fill="${LOCH}" opacity="0.6"`));
  if (hinten) s += fein('M100,234 L100,262', 1.1);
  else for (let i = 0; i < 4; i++) s += fein(`M${z(92 + i * 1.6)},${z(242 + i * 7.5)} L${z(108 - i * 1.6)},${z(242 + i * 7.5)}`);
  return stelle('os-sacrum', s);
}
function steissbein() {
  let s = '';
  for (let i = 0; i < 4; i++) s += kn(`M${z(96.5 + i * 0.7)},${z(270 + i * 3.4)} L${z(103.5 - i * 0.7)},${z(270 + i * 3.4)} L${z(102.8 - i * 0.8)},${z(273 + i * 3.4)} L${z(97.2 + i * 0.8)},${z(273 + i * 3.4)} Z`);
  return stelle('os-coccygis', s);
}

// Oberarmknochen
function humerus(hinten) {
  let s = kreis(56.5, 101, 6.6, `fill="${K}" stroke="${KR}" stroke-width="0.9"`);
  s += kn('M50.5,99 C49.5,104 50.5,108 51.5,111 C50.5,135 48.5,160 46.3,178 C42.5,180.5 40,185 41,189.5 C43.5,193 47.5,192.5 50,191 C52.5,193 55.5,193 57.2,190 C58,186 56,181.5 53,178.5 C54,160 56,135 58.5,108 C59,104 56,99 50.5,99 Z');
  s += fein(hinten ? 'M49.5,184 C51,186 53,186 54.5,184' : 'M47,187 C49,189 52,189 54,187');
  return stelle('humerus', s);
}
// Speiche (außen, Daumenseite) und Elle (innen)
function radius() {
  return stelle('radius', kn('M41.5,190.5 C38.3,191.3 37.4,194.5 38.6,197.6 C37.6,215 34.5,235 31.4,250 C30.6,254 31.6,257.6 34.6,257.6 L39.6,257.6 C40.6,254.5 40.3,252 40.5,249 C41.3,230 42.4,212 43.6,198 C44.6,195 44.4,191.5 41.5,190.5 Z'));
}
function ulna(hinten) {
  let s = kn('M49,185.5 C53.5,184.5 56.6,188 55.4,193 C54.4,205 51.5,225 47.6,248 C46.8,252.3 46.4,255.5 44.3,257.4 C42.1,257.6 41.3,255 42.1,250.5 C44.2,228 46,208 47.1,196 C47.2,192 46.6,187.5 49,185.5 Z');
  if (hinten) s += ellipse(50.8, 187.5, 3.4, 3, `fill="${KS}" stroke="${KR}" stroke-width="0.7"`); // Olecranon
  return stelle('ulna', s);
}
// Hand (Handfläche nach vorn, Daumen außen)
function hand() {
  // Handwurzel: 8 kleine Knochen
  let carpi = kn('M33,256.6 L45.6,256.6 C46.6,260 46.6,264 45.6,267.6 L32.4,267.6 C31.3,264 31.3,260 33,256.6 Z');
  carpi += fein('M36,257 L35.5,267.4 M39.3,257 L39.3,267.4 M42.6,257 L43,267.4 M32,262.2 L46.3,262.2', 0.5);
  // Mittelhand: Strahlen
  const mc = [[34.3, 268.6, 32.8, 283], [37.6, 268.6, 36.7, 284], [40.8, 268.6, 40.4, 283.4], [43.8, 268.6, 43.8, 281.6]];
  let meta = mc.map(([x1, y1, x2, y2]) => stab(`M${x1},${y1} L${x2},${y2}`, 2.2)).join('');
  meta += stab('M32.6,267.8 L27.6,276.2', 2.4); // Daumen
  // Fingerknochen: je 3 Glieder, Daumen 2
  const fing = [[32.8, 283, 31.6, 300.5], [36.7, 284, 36.4, 303], [40.4, 283.4, 40.6, 300.6], [43.8, 281.6, 43.6, 296]];
  let phal = '';
  for (const [x1, y1, x2, y2] of fing) {
    const L = y2 - y1;
    const p = [0, 0.43, 0.75, 1].map(t => [z(x1 + (x2 - x1) * t), z(y1 + L * t)]);
    for (let i = 0; i < 3; i++) phal += stab(`M${p[i][0]},${z(p[i][1] + 0.9)} L${p[i + 1][0]},${z(p[i + 1][1] - 0.4)}`, 1.9 - i * 0.2);
  }
  phal += stab('M27.2,277.4 L25.2,281.6', 2.1) + stab('M24.9,283 L23.6,286.6', 1.9);
  return stelle('manus', stelle('ossa-carpi', carpi) + stelle('ossa-metacarpi', meta) + stelle('phalanges-manus', phal));
}
// Oberschenkelknochen
function femur(hinten) {
  let s = kn('M63.6,246.5 C62.6,252 64.8,257 68.2,260 C71,285 74,310 76.2,332 C73,337 72,345 74,351 C76.5,355.5 81.5,355.5 85.2,352.3 C89,355.5 94,355.5 96.2,351.2 C98.2,346 97.4,339 93.2,334 C89.2,315 86.2,290 83.6,262 C82.6,258 80,255.5 77.5,254 L75,250 C72,246 67,243.5 63.6,246.5 Z');
  s += kn('M72,251.5 L78.5,243.5 L83.5,248.5 L78,256.5 Z');
  s += kreis(80.4, 246.6, 6.3, `fill="${K}" stroke="${KR}" stroke-width="0.9"`);
  s += hinten ? fein('M80,265 C80.5,290 82,315 84.5,334', 0.7) : fein('M75,350 C80,346 90,346 95,350', 0.5);
  return stelle('femur', s);
}
function patella() {
  return stelle('patella', ellipse(85.6, 346.5, 5.6, 6.6, `fill="${K}" stroke="${KR}" stroke-width="0.9"`) + fein('M82.5,343 C84.5,341.5 87,341.5 88.8,343', 0.5));
}
function tibia() {
  return stelle('tibia', kn('M75,355.5 C73.8,359.5 75.2,362.5 78.2,364.2 C82.2,366.5 84.2,370.5 85.2,380 C86.2,410 86.2,440 86,458 C86,463.4 88.2,467.6 92.2,467.6 C95.2,467.6 96.4,463.4 95.4,458 C94.2,440 94,410 95,380 C95.4,370 97.4,364 98.2,360 C98.4,356.2 96.4,354.4 93.2,354.4 C88,356 80,356.5 75,355.5 Z'));
}
function fibula() {
  return stelle('fibula', kn('M72.3,359.6 C70.2,362 70.4,366 72.4,368 C73.6,390 75.4,420 77.2,452 C76.2,458 77.2,466 80.2,468.4 C83.2,468.4 84.2,463 82.4,456 C80.4,425 78.6,392 77.4,368 C79.2,365 78.4,361 75.4,359.4 Z'));
}
// Fuß von vorn (von oben gesehen): Fußwurzel, Mittelfuß, Zehen. Großzehe innen.
function fussVorn() {
  let tarsi = kn('M80.5,463.5 L93.5,463.5 C95.5,467 96.5,471 96.6,475.5 L80.2,476.6 C79.2,472 79.3,467.5 80.5,463.5 Z');
  tarsi += fein('M86.5,464 L86,476 M80.5,470 L96.2,470', 0.5);
  const mt = [[81.4, 477.2, 78, 488], [84.4, 477.2, 82, 489.4], [87.6, 477, 86.2, 490.2], [90.8, 476.8, 90.4, 490.6], [94.4, 476.4, 95.4, 489.2]];
  let meta = mt.map(([x1, y1, x2, y2], i) => stab(`M${x1},${y1} L${x2},${y2}`, i === 4 ? 2.8 : 1.9)).join('');
  let phal = '';
  mt.forEach(([, , x, y], i) => {
    const big = i === 4, len = big ? 7.4 : 6 - i * 0.3, dx = (x - 87) * 0.12;
    phal += stab(`M${z(x + dx * 0.2)},${z(y + 1.4)} L${z(x + dx)},${z(y + len * 0.5)}`, big ? 2.6 : 1.7);
    phal += stab(`M${z(x + dx)},${z(y + len * 0.5 + 1.2)} L${z(x + dx * 1.3)},${z(y + len)}`, big ? 2.4 : 1.5);
  });
  return stelle('pes', stelle('ossa-tarsi', tarsi) + stelle('ossa-metatarsi', meta) + stelle('phalanges-pedis', phal));
}
// Fuß von hinten: Ferse (Fersenbein) und Sprungbein
function fussHinten() {
  let s = stelle('talus', kn('M81.5,463.5 L94,463.5 C95.6,466 95.6,469 94.4,471 L81.6,471 C80.4,469 80.4,466 81.5,463.5 Z'));
  s += stelle('calcaneus', kn('M80.6,471 L95.2,471 C96.8,477 96.6,485 94.6,490.6 C91.6,494.6 84.6,494.6 81.6,490.6 C79.4,485 79.2,477 80.6,471 Z') + fein('M83,486 C86,488 90,488 93,486', 0.5));
  // Zehen ragen seitlich etwas hervor
  s += stelle('ossa-metatarsi', stab('M95.6,474 L98.6,490', 2.2) + stab('M80.2,476 L77.8,488', 1.6));
  return stelle('pes', s);
}

// Schulterblatt
function scapula(hinten) {
  if (!hinten) {
    // von vorn: nur der äußere Teil ist neben den Rippen zu sehen
    return stelle('scapula', kn('M58.5,94 C64,93 70,94.5 74,97.5 C77,99.5 77,102 74.5,103 C71.5,103.5 69.5,103 68.5,104 C71,118 74,134 77.5,148 C76,150.5 73,151 71,149 C67,132 63.5,117 61,108 C58,105 57,99 58.5,94 Z'));
  }
  let s = kn('M61.6,100.5 C67,96.5 75,93.6 81.2,93.2 C82.4,105 83.8,126 80.6,150.4 C79.6,153.6 76.4,153.8 75.2,151.6 C71.2,135 66.2,118 61.8,107 Z');
  s += pfad('M57.4,91.6 C66,95.2 75.6,100.6 84.2,105.2 L83.4,108.8 C74.6,104.6 65.6,100 57.2,96.4 Z', `fill="${KS}" stroke="${KR}" stroke-width="0.8"`); // Spina scapulae
  s += kn('M54.2,90.4 L60.4,90 C61.6,92 61.4,95 59.8,96.6 L54.8,96.4 C53.6,94.6 53.4,92.2 54.2,90.4 Z'); // Acromion
  return stelle('scapula', s);
}
function clavicula() {
  return stelle('clavicula', kn('M97.5,90.6 C91,88.6 85,91.4 79,91.6 C72.6,91.8 66.4,88.6 59.6,89.6 C57.6,90.6 57.6,93 59.8,94.2 C66.4,93.4 72.4,95.4 78.6,95.4 C85.4,95.4 91.2,93 97.4,94.2 Z'));
}
function sternum() {
  let s = kn('M92.6,90.4 L107.4,90.4 C108.4,94.6 106.4,99 105.2,102 L94.8,102 C93.6,99 91.6,94.6 92.6,90.4 Z');
  s += kn('M94.8,102.4 L105.2,102.4 C105.2,118 104.4,132 103.6,141.2 L96.4,141.2 C95.6,132 94.8,118 94.8,102.4 Z');
  s += kn('M96.8,141.4 L103.2,141.4 L100,149.4 Z');
  return stelle('sternum', s);
}

// Rippen von vorn: hinterer Bogen (Schatten), vorderer Bogen (Knochen), Rippenknorpel bis zum Brustbein
const RIPPEN = [
  // seitlich (Lx, Ly), Knochen-Knorpel-Grenze (Cx, Cy), Ansatz am Brustbein (Sx, Sy), Ansatz an der Wirbelsäule (Py)
  { L: [77, 98.5], C: [86, 101.5], S: [93.6, 97], P: 89.5 },
  { L: [70.5, 108], C: [84, 112.5], S: [95, 104], P: 96.5 },
  { L: [66.5, 118], C: [83, 123], S: [95, 111], P: 103.5 },
  { L: [64.2, 128], C: [82, 133.5], S: [95, 118], P: 110.5 },
  { L: [63.2, 138], C: [81, 144], S: [95.2, 125], P: 117.5 },
  { L: [63.2, 148], C: [80.6, 154], S: [95.6, 132], P: 124.5 },
  { L: [64.2, 157.5], C: [80.4, 163], S: [96.2, 139], P: 131.5 },
  { L: [66, 165.5], C: [80.4, 170.6], S: [90.4, 150.5], P: 138.5 },
  { L: [68.2, 172.2], C: [79.6, 176.4], S: [86.4, 159], P: 145.5 },
  { L: [70.6, 177.8], C: [78.6, 181], S: [83.4, 167], P: 152.5 },
];
function rippenVorn() {
  let hinten = '', vorn = '', knorpel = '';
  for (const { L, C, S, P } of RIPPEN) {
    const [lx, ly] = L, [cx, cy] = C, [sx, sy] = S;
    hinten += stab(`M93.5,${P} C${z(86)},${z(P - 2)} ${z(lx + 3)},${z(ly - 13)} ${lx},${ly}`, 2.2, KS);
    vorn += stab(`M${lx},${ly} C${z(lx - 0.6)},${z(ly + 4.5)} ${z(cx - 6)},${z(cy + 0.6)} ${cx},${cy}`, 3);
    knorpel += stab(`M${cx},${cy} C${z(cx + (sx - cx) * 0.5)},${z(cy)} ${z(sx - 1.5)},${z(sy + 1.4)} ${sx},${sy}`, 2.4, KN);
  }
  // 11. und 12. Rippe (frei endend)
  hinten += stab('M93.5,159.5 C86,158 79,166 73.4,181.4', 2.2, KS) + stab('M93.5,166 C88,166 83.5,172 80.4,180.4', 2, KS);
  return stelle('costae', paar(hinten) + paar(vorn + knorpel));
}
// Rippen von hinten: kräftige hintere Bögen
function rippenHinten() {
  let s = '';
  RIPPEN.forEach(({ L, P }, i) => {
    const [lx, ly] = L;
    s += stab(`M${z(91)},${z(P + 1)} C${z(84)},${z(P - 1.5)} ${z(lx + 2.5)},${z(ly - 12)} ${lx},${ly}`, 3.1);
    s += stab(`M${lx},${ly} C${z(lx - 0.5)},${z(ly + 3)} ${z(lx + 1)},${z(ly + 6)} ${z(lx + 2.5)},${z(ly + 7)}`, 2.6, KS);
  });
  s += stab('M91.5,160.5 C85,159 78.5,167 73.4,181.4', 2.8) + stab('M91.5,167 C87,167 83,172 80.4,180.4', 2.5);
  return stelle('costae', paar(s));
}

// Becken: Hüftbein (Darmbein, Sitzbein, Schambein) beidseits, Kreuzbein, Steißbein
function hueftbein(hinten) {
  let ilium = kn('M88.4,236.5 C84.5,228 76.5,220.4 66.4,218.2 C60.6,217.6 57,221.6 57.8,227.6 C58.6,233.6 61,237.6 63.4,240.4 C65.6,243.4 68.6,245.2 72.4,246.2 C76.4,246.4 80.4,243.4 84.4,244.2 C86.4,242.2 88.4,239.4 88.4,236.5 Z');
  ilium += fein(hinten ? 'M62,224 C70,224 80,228 86,236' : 'M64,226 C70,228 77,233 82,240', 0.6);
  let ischii = kn('M75.4,252 C74.4,258 75.4,266 78.6,272.6 C81.6,277.4 86.6,277.4 89.6,273.4 C90.6,271 89.8,268.6 88.6,266.4 C85,264 81,259 79.6,253 Z');
  let pubis = kn('M83.6,246.6 C88.6,250.8 93.6,255.2 98.6,257.2 L98.6,271.4 C95.4,271.6 92.4,270.6 90.2,268.4 C89.2,264.6 88.6,261.4 87.6,258.6 C86,255.6 84,252.6 81.4,250.4 Z');
  const foramen = ellipse(85.6, 263.2, 3.6, 5.6, `fill="${LOCH}" opacity="0.8"`);
  return paar(stelle('os-coxae', stelle('os-ilium', ilium) + stelle('os-ischii', ischii) + stelle('os-pubis', pubis) + foramen));
}

// Schädel von vorn
function schaedelVorn() {
  let s = '';
  s += kn(symm('M100,11 C88.6,11 79.6,19 79.6,33 C79.6,40 80.6,45 82.6,49.2 C84,52.4 86,54.6 88.4,55.6 L92,56.6 L100,56.8'));
  // Stirnbein (bis zu den Augenbrauenbögen)
  s += stelle('os-frontale', kn(symm('M100,11.6 C89,11.6 80.4,19.2 80.4,30.6 C84,30.2 87.6,29.4 91,29.4 C94.4,29.4 97,30.2 100,30.4')));
  // Augenhöhlen
  s += paar(stelle('orbita', loch('M84.6,36.2 C84.4,32.2 87.4,30.2 91,30.4 C94.6,30.6 97,32.8 96.8,36.6 C96.6,40.6 94,42.2 90.6,42.2 C87.4,42.2 84.8,40.2 84.6,36.2 Z')));
  // Jochbein (Wangenknochen)
  s += paar(stelle('os-zygomaticum', kn('M81.6,37.6 C83,41.2 86.6,43.4 90.8,43.8 C92.4,44 93.4,45 93.2,46.2 C90.6,48.4 86.2,48.8 83,48 C81.4,44.8 80.8,41 81.6,37.6 Z')));
  // Oberkiefer mit Nasenöffnung und oberen Zähnen
  let max = kn(symm('M100,41.8 L96.8,42.4 C95.2,44.6 94,46.2 92.8,46.8 C90.8,47.4 89.4,49.4 89,51.8 L88.9,55.2 C92.4,56.6 96.2,57 100,57'));
  max += loch('M100,40.6 C98.6,43.4 96.6,46.6 97,48.8 C97.4,50.6 99,50.8 100,49.6 C101,50.8 102.6,50.6 103,48.8 C103.4,46.6 101.4,43.4 100,40.6 Z');
  max += zaehne(55.2, 57.8);
  s += stelle('maxilla', max);
  // Nasenbein
  s += stelle('os-nasale', kn('M98.4,33.6 L101.6,33.6 L102.4,40.6 C101,41.2 99,41.2 97.6,40.6 Z'));
  return stelle('cranium', s + unterkiefer(false));
}
function zaehne(y0, y1) {
  let s = '';
  for (let i = -4; i < 4; i++) {
    const x = 100 + i * 2.1;
    s += pfad(`M${z(x + 0.15)},${y0} L${z(x + 1.95)},${y0} L${z(x + 1.85)},${y1} Q${z(x + 1.05)},${z(y1 + 0.5)} ${z(x + 0.25)},${y1} Z`, `fill="#fffdf6" stroke="${KR}" stroke-width="0.35"`);
  }
  return s;
}
function unterkiefer(hinten) {
  let s = kn(symm('M100,58.2 L91.6,58.2 C88.6,57.6 86.6,55.6 85.6,51.4 L83.6,45.6 L80.4,45.8 L80.8,55.6 C81.2,59.4 83.2,61.6 86.2,63.6 C90.2,66 95,67.2 100,67.2'));
  if (!hinten) s += zaehne(58.2, 60.8);
  return stelle('mandibula', s);
}

// Schädel von hinten: Scheitelbeine, Hinterhauptbein
function schaedelHinten() {
  let s = kn(symm('M100,11 C88.6,11 79.6,19 79.6,33 C79.6,41 81,47 84,52 C88,56 94,58 100,58'));
  s += paar(stelle('os-parietale', kn('M100,11.6 C89,11.6 80.4,19.2 80.4,32.4 C80.4,35 80.6,37 81,39 C88,36 94,34.4 100,33.8 Z')));
  s += stelle('os-occipitale', kn(symm('M100,34.6 C93,35 87,37.2 81.4,40.6 C82.6,46 85,50.6 88.4,53.6 C92,56.4 96,57.4 100,57.4')) + fein('M89,49 C95,47.4 105,47.4 111,49', 0.6));
  return stelle('cranium', unterkiefer(true) + s); // Unterkiefer liegt von hinten gesehen hinter dem Schädel
}

// ---------------------------------------------------------------- ganze Abbildungen
const HAUT = ['#dde6f0', '#b3c2d4'];

export function skelettVorn() {
  let s = silhouette(HAUT[0], HAUT[1], 2.2);
  s += paar(scapula(false));
  s += stelle('columna', halswirbel(false) + brustwirbel(false) + lendenwirbel(false));
  s += rippenVorn();
  s += sternum();
  s += paar(clavicula());
  s += stelle('pelvis', kreuzbein(false) + hueftbein(false));
  s += paar(humerus(false) + radius() + ulna(false) + hand());
  s += paar(femur(false) + tibia() + fibula() + patella() + fussVorn());
  s += schaedelVorn();
  return s;
}

export function skelettHinten() {
  let s = silhouette(HAUT[0], HAUT[1], 2.2);
  s += rippenHinten();
  s += stelle('pelvis', hueftbein(true) + kreuzbein(true) + steissbein());
  s += stelle('columna', halswirbel(true) + brustwirbel(true) + lendenwirbel(true));
  s += paar(scapula(true) + clavicula());
  s += paar(humerus(true) + radius() + ulna(true) + hand());
  s += paar(femur(true) + tibia() + fibula() + fussHinten());
  s += schaedelHinten();
  return s;
}
