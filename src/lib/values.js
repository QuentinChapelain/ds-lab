// @ts-check
/**
 * Clés de comptage des valeurs CSS, communes au déclaré et au rendu
 * (conventions D4 à D13 de fixtures/marque-demo/expected.json).
 * Chaque fonction renvoie `{ key, normalizable }` : `key` sert au comptage,
 * `normalizable` est faux quand la valeur dépend du contexte (em, %, var()…).
 */
import { normalizeColor } from './color.js';
import { toPx, toMs, splitSpaces, splitCommas } from './units.js';

/** D4 : mots-clés globaux exclus de toutes les familles. */
export const GLOBAL_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

/**
 * @param {string} raw
 */
export function isGlobalKeyword(raw) {
  return GLOBAL_KEYWORDS.has(String(raw).trim().toLowerCase());
}

/**
 * @typedef {{ key: string, normalizable: boolean }} Keyed
 */

const NUMBER = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;

/**
 * Longueur → clé px (D6).
 * @param {string} raw
 * @param {number} rootPx
 * @returns {Keyed}
 */
export function lengthKey(raw, rootPx) {
  const r = toPx(raw, { rootPx });
  return { key: r.key, normalizable: r.normalizable };
}

/**
 * Durée → clé ms (D11).
 * @param {string} raw
 * @returns {Keyed}
 */
export function durationKey(raw) {
  const r = toMs(raw);
  return { key: r.key, normalizable: r.normalizable };
}

/**
 * D8 : liste en minuscules, guillemets retirés, séparateur « , ».
 * @param {string} raw
 * @returns {Keyed}
 */
export function fontFamilyKey(raw) {
  const parts = splitCommas(raw).map((p) =>
    p
      .trim()
      .replace(/^(["'])(.*)\1$/s, '$2')
      .replace(/\s+/g, ' ')
      .toLowerCase(),
  );
  return { key: parts.join(', '), normalizable: !/var\(/i.test(raw) };
}

/**
 * D9 : bold → 700, normal → 400, nombres tels quels ; bolder, lighter, var() bruts.
 * @param {string} raw
 * @returns {Keyed}
 */
export function fontWeightKey(raw) {
  const w = String(raw).trim().toLowerCase();
  if (w === 'bold') return { key: '700', normalizable: true };
  if (w === 'normal') return { key: '400', normalizable: true };
  if (NUMBER.test(w)) return { key: String(Number(w)), normalizable: true };
  return { key: w, normalizable: false };
}

/**
 * D10 : nombre sans unité gardé comme nombre, longueurs en px, mots-clés tels quels.
 * @param {string} raw
 * @param {number} rootPx
 * @returns {Keyed}
 */
export function lineHeightKey(raw, rootPx) {
  const w = String(raw).trim().toLowerCase();
  if (NUMBER.test(w)) return { key: String(Number(w)), normalizable: true };
  if (/^[a-z-]+$/.test(w)) return { key: w, normalizable: true };
  return lengthKey(w, rootPx);
}

/**
 * Longueur ou mot-clé (letter-spacing: normal, margin: auto…) : mots-clés gardés
 * tels quels et comptés comme comparables.
 * @param {string} raw
 * @param {number} rootPx
 * @returns {Keyed}
 */
export function lengthOrKeywordKey(raw, rootPx) {
  const w = String(raw).trim().toLowerCase();
  if (/^[a-z-]+$/.test(w)) return { key: w, normalizable: true };
  return lengthKey(w, rootPx);
}

/**
 * D13 : nombre ; pourcentage divisé par 100.
 * @param {string} raw
 * @returns {Keyed}
 */
export function opacityKey(raw) {
  const w = String(raw).trim().toLowerCase();
  if (NUMBER.test(w)) return { key: String(Number(w)), normalizable: true };
  const m = w.match(/^(-?(?:\d+\.?\d*|\.\d+))%$/);
  if (m) return { key: String(Math.round(Number(m[1]) * 100) / 10000), normalizable: true };
  return { key: w, normalizable: false };
}

/**
 * D11 : minuscules, espaces retirés, zéro devant « .x ».
 * `cubic-bezier(.2, 0, 0, 1)` → `cubic-bezier(0.2,0,0,1)`.
 * @param {string} raw
 * @returns {Keyed}
 */
export function timingKey(raw) {
  const w = String(raw)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/(^|[^\d.])\.(\d)/g, '$10.$2');
  return { key: w, normalizable: !/var\(/.test(w) };
}

/**
 * D12 : `[inset ]x y flou étalement couleur`, en px, étalement 0px par défaut,
 * couleur selon D7, ombres multiples jointes par « , ».
 * Une ombre illisible (var(), nombre de longueurs invalide) garde son écriture brute.
 * @param {string} raw
 * @param {number} rootPx
 * @returns {Keyed}
 */
export function shadowKey(raw, rootPx) {
  const w = String(raw).trim().toLowerCase();
  if (w === 'none') return { key: 'none', normalizable: true };
  let normalizable = true;
  /** @type {string[]} */
  const parts = [];
  for (const shadow of splitCommas(w)) {
    let inset = false;
    /** @type {string[]} */
    const lengths = [];
    /** @type {string[]} */
    const colors = [];
    for (const tok of splitSpaces(shadow)) {
      if (tok === 'inset') inset = true;
      else if (/^-?(?:\d+\.?\d*|\.\d+)[a-z%]*$/.test(tok)) lengths.push(tok);
      else colors.push(tok);
    }
    if (lengths.length < 2 || lengths.length > 4 || colors.length > 1) return { key: w, normalizable: false };
    while (lengths.length < 4) lengths.push('0');
    const keys = lengths.map((l) => {
      const k = lengthKey(l, rootPx);
      if (!k.normalizable) normalizable = false;
      return k.key;
    });
    let color = 'currentcolor';
    if (colors.length) {
      const c = normalizeColor(colors[0]);
      if (c) color = c.hex;
      else {
        color = colors[0];
        if (color !== 'currentcolor') normalizable = false;
      }
    }
    parts.push((inset ? 'inset ' : '') + keys.join(' ') + ' ' + color);
  }
  return { key: parts.join(', '), normalizable };
}

/**
 * D14 : largeurs des media queries, em et rem à 16 px (taille initiale).
 * Gère `(min-width: 48em)`, `(max-width: 1023px)` et la syntaxe d'intervalle
 * `(width >= 768px)`, `(400px <= width <= 700px)`.
 * @param {string} params  texte de la @media, sans « @media »
 * @returns {{ key: string, feature: 'min' | 'max', normalizable: boolean }[]}
 */
export function mediaWidths(params) {
  const p = String(params).toLowerCase();
  /** @type {{ key: string, feature: 'min' | 'max', normalizable: boolean }[]} */
  const out = [];
  const LEN = '(-?(?:\\d+\\.?\\d*|\\.\\d+)[a-z%]*)';
  /** @param {string} v @param {'min'|'max'} feature */
  const push = (v, feature) => {
    // Dans une media query, em et rem valent la taille initiale (16 px), pas rootPx.
    const em = v.match(/^(-?(?:\d+\.?\d*|\.\d+))r?em$/);
    const k = em ? toPx(`${em[1]}rem`, { rootPx: 16 }) : toPx(v, { rootPx: 16 });
    out.push({ key: k.key, feature, normalizable: k.normalizable });
  };
  for (const m of p.matchAll(new RegExp(`\\(\\s*(min|max)-width\\s*:\\s*${LEN}\\s*\\)`, 'g'))) {
    push(m[2], /** @type {'min'|'max'} */ (m[1]));
  }
  for (const m of p.matchAll(new RegExp(`\\(([^()]*\\bwidth\\b[^()]*)\\)`, 'g'))) {
    const inner = m[1];
    if (/(min|max)-width/.test(inner)) continue;
    const after = inner.match(new RegExp(`\\bwidth\\s*(>=|<=|>|<)\\s*${LEN}`));
    if (after) push(after[2], after[1].startsWith('>') ? 'min' : 'max');
    const before = inner.match(new RegExp(`${LEN}\\s*(>=|<=|>|<)\\s*width\\b`));
    if (before) push(before[1], before[2].startsWith('<') ? 'min' : 'max');
  }
  return out;
}
