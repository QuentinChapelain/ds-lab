// @ts-check
/**
 * Étape 4c, lot 1 : lecture d'une police des titres. Mesures en unités de la police, telles que le fichier les déclare :
 * unités par em (head), hauteur de capitale et hauteur d'x (OS/2 version 2 et plus), ascendante, descendante et
 * interligne ajouté (hhea, ce que les navigateurs prennent sur macOS), métriques typo (OS/2), graisses (axe wght de fvar,
 * sinon usWeightClass), famille (name 1), licence (name 13, sinon 14) et couverture (cmap, format 4 ou 12).
 * Seul le WOFF2 est lu ; tout autre format est reconnu et rendu illisible (le garde-fou de format le refuse).
 */
import { formatPolice, tablesWoff2 } from './woff2.js';

/**
 * @typedef {{
 *   format: string, lisible: true, famille: string | null, unitesParEm: number,
 *   capitale: number | null, x: number | null, ascendante: number, descendante: number, interligneAjoute: number,
 *   typo: { ascendante: number, descendante: number }, graisses: { min: number, max: number }, variable: boolean,
 *   licence: string | null, couverture: Set<number>
 * }} Police
 * @typedef {{ format: string, lisible: false }} Illisible
 */

/** @param {Map<string, { donnees: Buffer }>} tables @param {string} tag */
const table = (tables, tag) => {
  const t = tables.get(tag);
  if (!t) throw new Error(`table ${tag} absente`);
  return t.donnees;
};

/** Texte d'un enregistrement name : UTF-16 gros-boutiste (plateformes 0 et 3), sinon latin1. */
function nom(/** @type {Buffer} */ d, /** @type {number} */ id) {
  const count = d.readUInt16BE(2);
  const base = d.readUInt16BE(4);
  /** @type {{ plateforme: number, langue: number, texte: string }[]} */
  const trouves = [];
  for (let i = 0; i < count; i++) {
    const r = 6 + i * 12;
    if (d.readUInt16BE(r + 6) !== id) continue;
    const plateforme = d.readUInt16BE(r);
    const langue = d.readUInt16BE(r + 4);
    const brut = d.subarray(base + d.readUInt16BE(r + 10), base + d.readUInt16BE(r + 10) + d.readUInt16BE(r + 8));
    const texte = plateforme === 0 || plateforme === 3 ? Buffer.from(brut).swap16().toString('utf16le') : brut.toString('latin1');
    trouves.push({ plateforme, langue, texte });
  }
  // Windows, anglais des États-Unis d'abord, comme fontTools ; sinon le premier.
  const t = trouves.find((x) => x.plateforme === 3 && x.langue === 0x409) ?? trouves[0];
  return t && t.texte.trim() ? t.texte : null;
}

/** Caractères couverts : sous-table 12 (3,10 ou 0,4+), sinon 4 (3,1 ou 0,3) ; glyphe 0 = absent. */
function couverture(/** @type {Buffer} */ d) {
  const n = d.readUInt16BE(2);
  /** @type {{ rang: number, offset: number }[]} */
  const choix = [];
  for (let i = 0; i < n; i++) {
    const r = 4 + i * 8;
    const pl = d.readUInt16BE(r);
    const enc = d.readUInt16BE(r + 2);
    const offset = d.readUInt32BE(r + 4);
    const format = d.readUInt16BE(offset);
    const rang = format === 12 && ((pl === 3 && enc === 10) || pl === 0) ? 0 : format === 4 && ((pl === 3 && enc === 1) || pl === 0) ? 1 : -1;
    if (rang >= 0) choix.push({ rang, offset });
  }
  choix.sort((a, b) => a.rang - b.rang);
  const c = choix[0];
  if (!c) throw new Error('cmap sans sous-table Unicode lisible');
  /** @type {Set<number>} */
  const s = new Set();
  const o = c.offset;
  if (d.readUInt16BE(o) === 12) {
    const groupes = d.readUInt32BE(o + 12);
    for (let g = 0; g < groupes; g++) {
      const r = o + 16 + g * 12;
      const debut = d.readUInt32BE(r);
      const fin = d.readUInt32BE(r + 4);
      const glyphe = d.readUInt32BE(r + 8);
      for (let cp = debut; cp <= fin; cp++) if (glyphe + (cp - debut) !== 0) s.add(cp);
    }
    return s;
  }
  const seg = d.readUInt16BE(o + 6) / 2;
  const fins = o + 14;
  const debuts = fins + seg * 2 + 2;
  const deltas = debuts + seg * 2;
  const decalages = deltas + seg * 2;
  for (let i = 0; i < seg; i++) {
    const fin = d.readUInt16BE(fins + i * 2);
    const debut = d.readUInt16BE(debuts + i * 2);
    const delta = d.readInt16BE(deltas + i * 2);
    const dec = d.readUInt16BE(decalages + i * 2);
    for (let cp = debut; cp <= fin && cp !== 0xffff; cp++) {
      let glyphe;
      if (dec === 0) glyphe = (cp + delta) & 0xffff;
      else {
        const g = d.readUInt16BE(decalages + i * 2 + dec + (cp - debut) * 2);
        glyphe = g === 0 ? 0 : (g + delta) & 0xffff;
      }
      if (glyphe !== 0) s.add(cp);
    }
  }
  return s;
}

/** Axe wght de fvar, s'il existe. @param {Buffer} d @returns {{ min: number, max: number } | null} */
function axeGraisse(d) {
  const debut = d.readUInt16BE(4);
  const n = d.readUInt16BE(8);
  const taille = d.readUInt16BE(10);
  for (let i = 0; i < n; i++) {
    const r = debut + i * taille;
    if (d.toString('latin1', r, r + 4) === 'wght') return { min: d.readInt32BE(r + 4) / 65536, max: d.readInt32BE(r + 12) / 65536 };
  }
  return null;
}

/**
 * Lecture d'un fichier de police.
 * @param {Buffer} buf
 * @returns {Police | Illisible}
 */
export function lirePolice(buf) {
  const format = formatPolice(buf);
  if (format !== 'WOFF2') return { format, lisible: false };
  const tables = tablesWoff2(buf);
  const head = table(tables, 'head');
  const hhea = table(tables, 'hhea');
  const os2 = table(tables, 'OS/2');
  const name = table(tables, 'name');
  const version = os2.readUInt16BE(0);
  const capitale = version >= 2 && os2.length >= 90 ? os2.readInt16BE(88) : null;
  const x = version >= 2 && os2.length >= 90 ? os2.readInt16BE(86) : null;
  const fvar = tables.get('fvar');
  const axe = fvar ? axeGraisse(fvar.donnees) : null;
  const statique = os2.readUInt16BE(4);
  return {
    format,
    lisible: true,
    famille: nom(name, 1),
    unitesParEm: head.readUInt16BE(18),
    capitale: capitale && capitale > 0 ? capitale : null,
    x: x && x > 0 ? x : null,
    ascendante: hhea.readInt16BE(4),
    descendante: hhea.readInt16BE(6),
    interligneAjoute: hhea.readInt16BE(8),
    typo: { ascendante: os2.readInt16BE(68), descendante: os2.readInt16BE(70) },
    graisses: axe ?? { min: statique, max: statique },
    variable: Boolean(axe),
    licence: nom(name, 13) ?? nom(name, 14),
    couverture: couverture(table(tables, 'cmap')),
  };
}

/**
 * Une ligne lisible : format, mesures en unités de la police, graisses, licence.
 * @param {Police | Illisible} p
 */
export function decrirePolice(p) {
  if (!p.lisible) return `${p.format}, non lu`;
  const u = p.unitesParEm;
  return [
    `${p.format}, ${u} unités par em`,
    `capitale ${p.capitale ?? 'absente'}`,
    `x ${p.x ?? 'absente'}`,
    `ascendante ${p.ascendante}, descendante ${p.descendante}`,
    p.variable ? `axe de graisse ${p.graisses.min} à ${p.graisses.max}` : `graisse ${p.graisses.min}`,
    `licence ${p.licence ?? 'non déclarée'}`,
    `${p.couverture.size} caractères`,
  ].join(' ; ');
}
