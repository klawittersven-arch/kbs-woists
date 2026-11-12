// Organe von vorn (eigene Zeichnung, vereinfacht). Links im Bild ist die rechte Körperseite.
import { paar, stelle, pfad, ellipse, linie, symm } from './basis.js';
import { silhouette } from './koerper.js';

const HAUT = ['#f7e7da', '#d3ad93'];
const form = (d, f, r, w = 0.8) => pfad(d, `fill="${f}" stroke="${r}" stroke-width="${w}" stroke-linejoin="round"`);
const strich = (d, f, w, o = 0.6) => linie(d, f, w, `opacity="${o}"`);
const rohr = (d, f, r, w) => linie(d, r, w + 1.2) + linie(d, f, w);

function gehirn() {
  const halb = form('M99.4,12.6 C90,12.6 81,19 81,29.6 C81,33 82.2,35.2 84.2,35.8 C89.2,35 94.6,34.6 99.4,34.8 Z', '#eda7b2', '#a65a68');
  const windungen = strich('M97,16 C93,18 95,22 91,24 C88,26 91,29 87,31 M93,14.6 C89,15.6 86,18 84.4,21.6 M96,27 C93,28 94,31 90,32.4 M86.4,25 C84,26 84,29 82.6,30.6', '#a65a68', 0.55, 0.7);
  return stelle('cerebrum', paar(halb + windungen));
}
function augen() {
  return paar(stelle('oculus', ellipse(90.6, 39.6, 4.8, 2.7, 'fill="#fffaf3" stroke="#8a6a5a" stroke-width="0.6"') + ellipse(90.6, 39.6, 1.7, 1.7, 'fill="#4c7393"') + ellipse(90.6, 39.6, 0.7, 0.7, 'fill="#1d2633"')));
}
function hals() {
  let s = '';
  // Speiseröhre (hinter der Luftröhre, schaut links daneben hervor)
  s += stelle('oesophagus', form('M99.6,73 L107.4,73 L107.6,118 L99.6,118 Z', '#e59c90', '#9c5148') + strich('M104.4,76 L104.6,116', '#9c5148', 0.5, 0.5));
  // Luftröhre mit Knorpelspangen
  let tr = form('M96.6,72 L103.4,72 L103.6,116.4 L96.4,116.4 Z', '#d2e3ec', '#6f8ea0');
  for (let y = 75; y < 116; y += 3.2) tr += strich(`M96.8,${y} C98.6,${y + 0.9} 101.4,${y + 0.9} 103.2,${y}`, '#6f8ea0', 0.55, 0.8);
  s += stelle('trachea', tr);
  // Kehlkopf
  s += stelle('larynx', form(symm('M100,60.6 L93.6,61.6 C93.4,65.6 95,69.6 97.6,72.4 L100,73.6'), '#c3d8e4', '#5f7f92') + strich('M100,62 L100,72', '#5f7f92', 0.5, 0.7) + strich('M94.6,64 L105.4,64', '#5f7f92', 0.5, 0.6));
  // Schilddrüse
  s += stelle('glandula-thyreoidea', form(symm('M100,78.4 L97.6,78.2 C96.6,75.2 95,73.2 93,73.4 C90.6,74 90,77.8 90.4,81.4 C90.8,84.4 92.8,85.8 95,85.2 C96.8,84.4 97.6,82.8 97.8,81.4 L100,81.6'), '#bb4a52', '#76262d'));
  return s;
}
function lungen() {
  const f = '#f1aaa3', r = '#b0605a';
  const rechts = form('M93.4,96.6 C88.4,94.6 82,97 77,103.6 C70,112 66,124 65,140 C64,155 65,168 67,178.6 C72,182 80,181.6 88,177.6 C91,176 92.2,172 92.6,166 L94,121 C95,112 95.4,104 93.4,96.6 Z', f, r)
    + strich('M66.4,134 C74,134.6 84,134 92.6,131.6 M71,114 C76,130 83,152 90,177', r, 0.6, 0.8);
  const links = form('M106.6,96.6 C111.6,94.6 118,97 123,103.6 C130,112 134,124 135,140 C136,155 135,168 133,178.6 C128,182 121,181.6 115,178.6 C113.6,175 114.6,170 116.4,165 C113.6,160 110,155 108.4,149 C107.2,140 107,120 106.6,96.6 Z', f, r)
    + strich('M129,114 C124,132 119,152 116,176', r, 0.6, 0.8);
  return stelle('pulmo', `<g transform="matrix(1 0 0 0.885 0 10.9)">${rechts + links}</g>`);
}
function bronchien() {
  const f = '#d2e3ec', r = '#6f8ea0';
  return stelle('bronchi', '<g transform="matrix(1 0 0 0.885 0 10.9)">' + rohr('M100,115 C96,118 92,121 87.6,126.6 M87.6,126.6 L83,132 M87.6,126.6 L86,135', f, r, 3) + rohr('M100,115 C104,117.6 109,120 113.6,123 M113.6,123 L118.6,127.6 M113.6,123 L115,132', f, r, 2.8) + '</g>');
}
function herz() {
  let s = '';
  // große Gefäße (ohne eigenen Begriff)
  s += rohr('M95,103 L95,126', '#5a77b8', 3.4); // obere Hohlvene
  s += rohr('M101.6,126 C101,116 101,110 104.6,108.6 C108.6,107.4 110.4,111 110.2,116 L110,124', '#c8393f', 3.6); // Aorta
  s += stelle('cor', '<g transform="matrix(0.85 0 0 0.85 15.6 18.15)">' + form('M93,125.6 C99,120.6 110,121.6 117,127.6 C123,133.6 124,147.6 120,159.6 C118,165.6 114,169.6 110,169.6 C104,167.6 96,161.6 90,153.6 C86,147.6 85,139.6 87,132.6 C88,128.6 90,126.6 93,125.6 Z', '#d0414b', '#7a1f28')
    + strich('M104,124 C105,136 108,150 113,166', '#7a1f28', 0.7, 0.7) + strich('M92,134 C98,138 104,141 111,141', '#7a1f28', 0.5, 0.5) + '</g>');
  return s;
}
function zwerchfell() {
  return stelle('diaphragma', '<g transform="translate(0,-10)">' + form('M63.6,180.6 C72,172.6 86,170.4 100,172.4 C114,170.4 128,172.6 136.4,180.6 L136.6,185.6 C128,178.4 114,176.6 100,178.4 C86,176.6 72,178.4 63.4,185.6 Z', '#d98676', '#8d3b2e') + '</g>');
}
// Ein Organ verschieben und gleichmäßig verkleinern (gezeichnet um Mitte c, neue Mitte n)
const lage = (inner, c, n, f) => `<g transform="matrix(${f} 0 0 ${f} ${Math.round((n[0] - f * c[0]) * 100) / 100} ${Math.round((n[1] - f * c[1]) * 100) / 100})">${inner}</g>`;

function bauch() {
  let s = '';
  // Nieren (liegen hinten, die rechte etwas tiefer)
  const niere = (cx, cy, spiegel) => {
    const d = 'M0,-13 C5,-13 8,-8.6 7.6,-3.4 C7,-1.4 5.6,-0.6 5.8,1.4 C7.4,3.6 7.6,8 5,11 C2,14 -4,13.6 -6.2,9 C-8.2,4 -8.2,-5 -5.6,-9.4 C-4,-12 -2,-13 0,-13 Z';
    return `<g transform="translate(${cx},${cy}) scale(${spiegel ? -0.88 : 0.88},0.88)">${form(d, '#a8433e', '#5e1f1f')}${strich('M4,-2 C1,-1 1,2 4,3', '#5e1f1f', 0.5, 0.6)}</g>`;
  };
  s += stelle('ren', niere(74.6, 208, false) + niere(130, 204.6, true));
  // Dickdarm: Blinddarm mit Wurmfortsatz, Grimmdarm als Rahmen, Mastdarm (hinter der Harnblase)
  const dick = '#e8bf8e', dickR = '#9d7244';
  const rectum = form('M102,248 L108.4,248 L107.6,262 L102.4,262 Z', '#d99c78', '#8b5634');
  let colon = form('M64,249 L64,223 C64,218 67.6,215.4 72,215.6 C82,216 92,220 100,222.6 C108,220 118,216 128,215.6 C133,215.4 136.4,218 136.4,222 L136.6,247 C136.6,253 132,257 124,257.6 L112,257 C108.6,256.6 106.6,254.6 106.6,251.6 C112,251.6 120,251.4 125,250.8 C128.6,250.4 129.4,248.6 129.4,246 L129.4,226.4 C129.4,224 128,223 125.6,223.2 C117,224.2 108,227.6 100,230.4 C92,227.6 82,224.2 74,223.4 C72,223.2 71,224.4 71,226.4 L71,249 Z', dick, dickR);
  colon += strich('M64.4,231 L70.6,231 M64.4,240 L70.6,240 M129.8,231 L136.2,231 M129.8,239.4 L136.2,239.4 M80,217 L79.4,224.6 M90,220 L89.4,227.6 M110,220 L110.6,227.6 M120,217 L120.6,224.6', dickR, 0.5, 0.7);
  let caecum = form('M62.4,248 L72.4,248 C74.6,251 75,255.6 73,258.6 C71,260.6 65.6,261 63.2,258.6 C61.4,255.6 61.4,251.4 62.4,248 Z', dick, dickR);
  caecum += stelle('appendix', rohr('M70.4,259.4 C73.6,262 76.4,265.4 77,270.6', dick, dickR, 3.2));
  s += stelle('intestinum-crassum', stelle('rectum', rectum) + stelle('colon', colon) + stelle('caecum', caecum));
  // Dünndarm (Schlingen)
  let tenue = form('M75.6,234 C79,229.6 90,230.6 100,232.6 C110,230.6 121,229.6 124.6,234 C127.4,239 126.6,245 123.4,248.4 C118.4,251.6 110,251 104.6,251.2 C98,251.6 90,253 83,251.6 C77.6,250.2 74.6,246 74.4,241.6 C74.4,238.6 74.8,236 75.6,234 Z', '#f1b7a6', '#a96553');
  tenue += strich('M79,237 C84,234 90,239 96,236 C102,233 108,239 114,236 C118,234 122,236 122.6,238.6 M78,243 C84,240 89,245 95,242 C101,239 107,245 113,242 C117,240 121,243 123,245 M81,248.6 C87,246 92,250 98,247.6 C104,245 110,249.6 117,247.4', '#a96553', 0.65, 0.75);
  s += stelle('intestinum-tenue', tenue);
  // Harnblase (im Becken, hinter dem Schambein)
  s += stelle('vesica-urinaria', form('M91.6,254 C91.6,250.4 95.4,248.6 100,248.6 C104.6,248.6 108.4,250.4 108.4,254 C108.4,260 105.4,265.6 100,265.6 C94.6,265.6 91.6,260 91.6,254 Z', '#eac85e', '#a0802a') + strich('M94.6,256 C97,257.6 103,257.6 105.4,256', '#a0802a', 0.5, 0.5));
  // Bauchspeicheldrüse (hinter dem Magen, Kopf in der Schleife des Zwölffingerdarms)
  s += stelle('pancreas', lage(form('M92,226 C92,221.6 96,219.6 100,221.6 C108,223.6 116,221 124,215.6 C128,213 132,212 134,214 C135,217 131,220 126,223.4 C118,228 108,231.6 100,233.6 C95,234.6 92,231 92,226 Z', '#efce7e', '#a5843a') + strich('M96,226 C104,227 116,222 130,215.6', '#a5843a', 0.5, 0.6), [113.5, 223], [113, 206], 0.85));
  // Zwölffingerdarm
  s += stelle('duodenum', lage(rohr('M100.6,216 C95,215.6 90,217 88.6,222 C87.6,228 87.8,234 90.6,237.4 C93.6,240 99,239.6 103.6,237', '#eab38f', '#9d6644', 4.2), [95, 227], [94.5, 209], 0.85));
  // Milz
  s += stelle('splen', lage(form('M128.4,187.6 C133.4,184.6 138.4,187.6 139.4,193.6 C140.4,200.6 138.4,207.6 134.4,210.6 C131.4,211.6 129.4,208.6 129.9,203.6 C130.4,197.6 129.4,192.6 128.4,187.6 Z', '#874578', '#4d2245'), [134, 198], [134.5, 181.5], 0.9));
  // Speiseröhre unten (zwischen Herz und Magen, durch das Zwerchfell)
  s += stelle('oesophagus', form('M102.6,156 L108,156 C108.4,162 109,166 110.6,171.6 L105.2,173 C103.8,168 102.8,162 102.6,156 Z', '#e59c90', '#9c5148'));
  // Magen
  s += stelle('gaster', lage(form('M106,185.6 C110,182.6 118,181.6 124,185.6 C131,190.6 134,199.6 132,209.6 C130,217.6 124,222.6 116,223.4 C109,224 103,222 99.4,219 C97.4,217 97.4,214.6 99.4,213 C103.4,214.6 107.4,214.4 111.4,211.6 C115.4,207.6 115.6,201.6 113,196 C110.6,191.6 107.4,189.4 106,185.6 Z', '#eda887', '#a5634a')
    + strich('M118,190 C124,198 125,206 121,214 M112,216.6 C117,216 121,212 123,206', '#a5634a', 0.55, 0.6), [115.5, 202.5], [116, 186], 0.85));
  // Leber
  s += stelle('hepar', lage(form('M63.6,186.6 C72,179 88,177 100,179.6 C106,179 112,180 116.6,183.6 C115.6,187.6 112,190.6 106,193.6 C100,197 93,201.6 87,205 C81,208 73,210.6 67.6,210 C64,206.6 62.8,198.6 63.6,186.6 Z', '#9c3f33', '#5b1f18')
    + strich('M97,181 C95,188 92,195 88,203', '#5b1f18', 0.6, 0.6), [90, 194], [90, 180], 0.92));
  // Gallenblase (unter dem Leberrand)
  s += stelle('vesica-biliaris', lage(form('M84.4,201.4 C87.4,200 90,201.8 90.2,205.6 C90.4,209.6 88.8,212.4 86.6,212.8 C84.4,213 83,210.4 83.2,206.8 C83.2,204.4 83.4,202.6 84.4,201.4 Z', '#53a35a', '#2c5e31'), [86.7, 207], [86.6, 192.6], 0.9));
  return s;
}

export function organe() {
  let s = silhouette(HAUT[0], HAUT[1], 2.2);
  // Gesicht nur angedeutet
  s += pfad('M100,40 C99,44 98,47 97.6,49 C98.6,50 99.4,50 100,49.6 C100.6,50 101.4,50 102.4,49 C102,47 101,44 100,40 Z', `fill="#efd2bf" stroke="${HAUT[1]}" stroke-width="0.5"`);
  s += strich('M95.6,55.6 C98,56.6 102,56.6 104.4,55.6', '#b97a66', 0.8, 0.9);
  s += gehirn() + augen();
  s += lungen();
  s += hals();
  s += herz();
  s += bronchien();
  s += zwerchfell();
  s += bauch();
  return s;
}
