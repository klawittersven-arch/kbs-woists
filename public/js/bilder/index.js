// Alle Abbildungen. Jede ist eine eigene Zeichnung (SVG), nichts wird nachgeladen.
import { BREITE, HOEHE } from './basis.js';
import { skelettVorn, skelettHinten } from './skelett.js';
import { muskelnVorn, muskelnHinten } from './muskeln.js';
import { organe } from './organe.js';

const svg = inner => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 4 176 ${HOEHE - 2}" preserveAspectRatio="xMidYMid meet" role="img">${inner}</svg>`;

export const BILDER = {
  'skelett-vorn': { name: 'Skelett', ansicht: 'von vorn', thema: 'skelett', svg: svg(skelettVorn()) },
  'skelett-hinten': { name: 'Skelett', ansicht: 'von hinten', thema: 'skelett', svg: svg(skelettHinten()) },
  'muskeln-vorn': { name: 'Muskeln', ansicht: 'von vorn', thema: 'muskeln', svg: svg(muskelnVorn()) },
  'muskeln-hinten': { name: 'Muskeln', ansicht: 'von hinten', thema: 'muskeln', svg: svg(muskelnHinten()) },
  'organe': { name: 'Organe', ansicht: 'von vorn', thema: 'organe', svg: svg(organe()) },
};
export { BREITE, HOEHE };
