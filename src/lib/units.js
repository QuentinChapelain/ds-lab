// @ts-check
/**
 * Conversion des longueurs et des durées CSS en valeurs comparables.
 * Une valeur qui dépend du contexte (em, %, vw, var(), calc()…) n'est pas
 * convertie : elle est gardée brute et marquée `normalizable: false`.
 */

/** Facteurs vers px pour les unités absolues (CSS Values 4). */
const ABSOLUTE = /** @type {Record<string, number>} */ ({
  px: 1,
  pt: 4 / 3,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 101.6,
});

/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * @typedef {object} Length
 * @property {string} raw            Écriture d'origine, espaces retirés aux bords.
 * @property {number | null} px      Valeur en px, arrondie au centième, si convertible.
 * @property {string | null} unit    Unité lue (`px`, `rem`…), `''` pour un nombre sans unité, `null` si non lue.
 * @property {boolean} normalizable  Vrai si `px` est renseigné.
 * @property {string} key            Clé de comptage : `"<px>px"` si convertible, sinon l'écriture en minuscules.
 */

/**
 * Convertit une longueur CSS en px.
 * - px, pt, pc, in, cm, mm, Q : conversion exacte ;
 * - rem : × `rootPx` (taille de police racine mesurée dans la page) ;
 * - `0` sans unité : 0 px ;
 * - em, ex, ch, %, vw, vh, var(), calc()…, ou tout autre nombre sans unité : non convertible.
 * @param {string} value
 * @param {{ rootPx?: number }} [opts]
 * @returns {Length}
 */
export function toPx(value, { rootPx = 16 } = {}) {
  const raw = String(value).trim();
  const w = raw.toLowerCase();
  const m = w.match(/^(-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/);
  if (!m) return { raw, px: null, unit: null, normalizable: false, key: w };
  const n = parseFloat(m[1]);
  const unit = m[2];
  /** @type {number | null} */
  let px = null;
  if (unit in ABSOLUTE) px = n * ABSOLUTE[unit];
  else if (unit === 'rem') px = n * rootPx;
  else if (unit === '' && n === 0) px = 0;
  if (px === null) return { raw, px: null, unit, normalizable: false, key: w };
  px = round2(px);
  if (Object.is(px, -0)) px = 0;
  return { raw, px, unit, normalizable: true, key: `${px}px` };
}

/**
 * @typedef {object} Duration
 * @property {string} raw
 * @property {number | null} ms
 * @property {boolean} normalizable
 * @property {string} key  `"<ms>ms"` si convertible, sinon l'écriture en minuscules.
 */

/**
 * Convertit une durée CSS (`s`, `ms`) en millisecondes.
 * @param {string} value
 * @returns {Duration}
 */
export function toMs(value) {
  const raw = String(value).trim();
  const w = raw.toLowerCase();
  const m = w.match(/^(-?(?:\d+\.?\d*|\.\d+))(ms|s)$/);
  if (!m) return { raw, ms: null, normalizable: false, key: w };
  let ms = round2(parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1));
  if (Object.is(ms, -0)) ms = 0;
  return { raw, ms, normalizable: true, key: `${ms}ms` };
}

/**
 * Découpe une valeur CSS en composants séparés par des espaces de premier
 * niveau (hors parenthèses et guillemets). Ex. `"4px calc(1rem + 2px) 0"` →
 * `["4px", "calc(1rem + 2px)", "0"]`.
 * @param {string} value
 * @returns {string[]}
 */
export function splitSpaces(value) {
  return splitTopLevel(value, (c) => /\s/.test(c));
}

/**
 * Découpe une valeur CSS sur les virgules de premier niveau.
 * Ex. `"color .2s, transform 300ms cubic-bezier(.2,0,0,1)"` → deux éléments.
 * @param {string} value
 * @returns {string[]}
 */
export function splitCommas(value) {
  return splitTopLevel(value, (c) => c === ',');
}

/**
 * @param {string} value
 * @param {(c: string) => boolean} isSep
 * @returns {string[]}
 */
function splitTopLevel(value, isSep) {
  /** @type {string[]} */
  const out = [];
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  let cur = '';
  for (const c of String(value)) {
    if (quote) {
      cur += c;
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
      cur += c;
    } else if (c === '(') {
      depth++;
      cur += c;
    } else if (c === ')') {
      depth = Math.max(0, depth - 1);
      cur += c;
    } else if (depth === 0 && isSep(c)) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
