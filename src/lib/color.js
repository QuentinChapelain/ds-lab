// @ts-check
/**
 * Couleurs : normalisation, OKLab, ΔE, regroupement, contraste WCAG 2.1.
 *
 * `toLab`, `deltaE` et `cluster` reprennent exactement la méthode de l'outil v1 :
 * OKLab depuis sRGB, ΔE = distance euclidienne × 100, regroupement glouton
 * des couleurs triées par fréquence décroissante.
 */
import { parse, toGamut, displayable, converter, formatHex, formatHex8 } from 'culori';

const toRgbGamut = toGamut('rgb', 'oklch');
const toRgb = converter('rgb');

/**
 * @typedef {object} NormalizedColor
 * @property {string} hex     `#rrggbb` si opaque, `#rrggbbaa` sinon.
 * @property {number} alpha   0 < alpha ≤ 1.
 * @property {boolean} outOfGamut  Vrai si la couleur sortait du gamut sRGB et a été ramenée dedans.
 */

/**
 * Normalise une écriture de couleur CSS (hexadécimal, nom, rgb(), hsl(), lab(), oklch(), color()…).
 * Renvoie `null` pour une couleur entièrement transparente ou non analysable
 * (`currentcolor`, `var(--x)`, couleurs système…), comme la fonction `norm` de v1.
 * @param {string} input
 * @returns {NormalizedColor | null}
 */
export function normalizeColor(input) {
  if (typeof input !== 'string') return null;
  const parsed = parse(input.trim().toLowerCase());
  if (!parsed) return null;
  const alpha = parsed.alpha ?? 1;
  if (alpha === 0) return null;
  // Conversion directe si la couleur est déjà dans sRGB : passer par OKLCH (toGamut)
  // décale certains canaux à 0 d'une unité (#e0c000 → #e0c001).
  const outOfGamut = !displayable(parsed);
  const inGamut = outOfGamut ? toRgbGamut(parsed) : toRgb(parsed);
  const rounded8 = formatHex8(inGamut);
  const a255 = parseInt(rounded8.slice(7, 9), 16);
  if (a255 === 0) return null;
  const hex = a255 === 255 ? formatHex(inGamut) : rounded8;
  return { hex, alpha: a255 === 255 ? 1 : alpha, outOfGamut };
}

/** @param {string} hex */
export function isOpaque(hex) {
  return /^#[0-9a-f]{6}$/.test(hex);
}

/**
 * sRGB 8 bits → OKLab. Identique à `lab()` de v1 (le canal alpha est ignoré).
 * @param {string} hex
 * @returns {[number, number, number]}
 */
export function toLab(hex) {
  const n = parseInt(hex.slice(1, 7), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * ΔE OKLab × 100 (même échelle que v1 : seuils 2 et 5).
 * @param {[number, number, number]} a
 * @param {[number, number, number]} b
 */
export function deltaE(a, b) {
  return 100 * Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * @typedef {object} ColorCount
 * @property {string} hex
 * @property {number} n
 */

/**
 * @typedef {object} ColorCluster
 * @property {string} rep      Couleur représentante (la plus fréquente du groupe).
 * @property {string[]} members  Membres, représentante comprise, dans l'ordre d'arrivée.
 * @property {number} n        Somme des occurrences.
 */

/**
 * Regroupement glouton de v1 : les couleurs opaques sont triées par fréquence
 * décroissante ; chacune rejoint le premier groupe dont la représentante est
 * à ΔE < seuil, sinon ouvre un groupe. Les couleurs non opaques sont ignorées.
 * Tri stable : à fréquence égale, l'ordre d'entrée est conservé.
 * @param {ColorCount[]} colors
 * @param {number} threshold
 * @returns {ColorCluster[]}
 */
export function cluster(colors, threshold) {
  const list = colors
    .filter((c) => isOpaque(c.hex))
    .map((c) => ({ ...c, lab: toLab(c.hex) }))
    .sort((a, b) => b.n - a.n);
  /** @type {(ColorCluster & { lab: [number, number, number] })[]} */
  const groups = [];
  for (const c of list) {
    const g = groups.find((x) => deltaE(x.lab, c.lab) < threshold);
    if (g) {
      g.members.push(c.hex);
      g.n += c.n;
    } else {
      groups.push({ rep: c.hex, members: [c.hex], n: c.n, lab: c.lab });
    }
  }
  return groups.map(({ rep, members, n }) => ({ rep, members, n }));
}

/**
 * @typedef {ColorCluster & { diameter: number }} CompleteCluster
 *   diameter : plus grand ΔE entre deux membres du groupe (0 pour un groupe d'une couleur).
 */

/**
 * Regroupement à liaison complète : deux groupes ne fusionnent que si TOUTES
 * leurs couleurs sont à ΔE < seuil les unes des autres. À chaque pas, la paire
 * de groupes la plus proche fusionne (à égalité, ordre des hexadécimaux).
 * Contrairement au regroupement glouton de v1, le résultat ne dépend ni des
 * fréquences ni de l'ordre d'entrée, et le diamètre d'un groupe reste sous le
 * seuil. Les fréquences ne servent qu'à choisir la représentante.
 * Les couleurs non opaques sont ignorées.
 * @param {ColorCount[]} colors
 * @param {number} threshold
 * @returns {CompleteCluster[]} triés par occurrences décroissantes
 */
export function clusterComplete(colors, threshold) {
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const c of colors) if (isOpaque(c.hex)) counts.set(c.hex, (counts.get(c.hex) ?? 0) + c.n);
  const hexes = [...counts.keys()].sort();
  const n = hexes.length;
  const labs = hexes.map(toLab);
  // dist[i][j] : distance de liaison complète entre les groupes i et j (i, j = indices de groupes vivants).
  /** @type {Float64Array[]} */
  const dist = hexes.map((_, i) => Float64Array.from(hexes, (_, j) => (i === j ? 0 : deltaE(labs[i], labs[j]))));
  /** @type {(number[] | null)[]} */
  const groups = hexes.map((_, i) => [i]);
  const diameter = new Float64Array(n);
  for (;;) {
    let bi = -1;
    let bj = -1;
    let best = threshold;
    for (let i = 0; i < n; i++) {
      if (!groups[i]) continue;
      for (let j = i + 1; j < n; j++) {
        if (groups[j] && dist[i][j] < best) {
          best = dist[i][j];
          bi = i;
          bj = j;
        }
      }
    }
    if (bi < 0) break;
    /** @type {number[]} */ (groups[bi]).push(.../** @type {number[]} */ (groups[bj]));
    groups[bj] = null;
    diameter[bi] = best;
    for (let k = 0; k < n; k++) {
      if (!groups[k] || k === bi) continue;
      const d = Math.max(dist[bi][k], dist[bj][k]);
      dist[bi][k] = d;
      dist[k][bi] = d;
    }
  }
  /** @type {CompleteCluster[]} */
  const out = [];
  groups.forEach((g, i) => {
    if (!g) return;
    const members = g.map((k) => hexes[k]).sort((a, b) => /** @type {number} */ (counts.get(b)) - /** @type {number} */ (counts.get(a)) || (a < b ? -1 : 1));
    out.push({
      rep: members[0],
      members,
      n: members.reduce((t, h) => t + /** @type {number} */ (counts.get(h)), 0),
      diameter: Math.round(diameter[i] * 10000) / 10000,
    });
  });
  return out.sort((a, b) => b.n - a.n || (a.rep < b.rep ? -1 : 1));
}

/**
 * @param {string} hex `#rrggbb` ou `#rrggbbaa`
 * @returns {{ r: number, g: number, b: number, a: number }} canaux 0–255, alpha 0–1
 */
export function hexToRgba(hex) {
  const h = hex.slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
  };
}

/**
 * Couleur vue à travers une opacity d'élément : alpha multiplié (R15 bis).
 * @param {string} hex
 * @param {number} opacity  0 à 1
 * @returns {string | null} null si plus rien n'est peint
 */
export function withOpacity(hex, opacity) {
  if (!(opacity > 0)) return null;
  if (opacity >= 1) return hex;
  const { a } = hexToRgba(hex);
  const a255 = Math.round(a * opacity * 255);
  if (a255 === 0) return null;
  return hex.slice(0, 7) + (a255 === 255 ? '' : a255.toString(16).padStart(2, '0'));
}

/** @param {number} v */
const hex2 = (v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');

/**
 * Composition alpha « source over » en sRGB 8 bits (comme le navigateur).
 * @param {string} fg  couleur du dessus, éventuellement transparente
 * @param {string} bg  couleur du dessous, éventuellement transparente
 * @returns {string} hexadécimal ; opaque si `bg` l'est
 */
export function blend(fg, bg) {
  const f = hexToRgba(fg);
  const b = hexToRgba(bg);
  const a = f.a + b.a * (1 - f.a);
  if (a === 0) return '#00000000';
  /** @param {'r'|'g'|'b'} k */
  const ch = (k) => (f[k] * f.a + b[k] * b.a * (1 - f.a)) / a;
  const rgb = '#' + hex2(ch('r')) + hex2(ch('g')) + hex2(ch('b'));
  const a255 = Math.round(a * 255);
  return a255 === 255 ? rgb : rgb + hex2(a255);
}

/**
 * Luminance relative WCAG 2.1 (seuil de linéarisation 0,03928 de la norme).
 * @param {string} hex couleur opaque
 */
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgba(hex);
  const [R, G, B] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Ratio de contraste WCAG 2.1, de 1 à 21.
 * @param {string} a couleur opaque
 * @param {string} b couleur opaque
 */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * « Grand texte » WCAG 2.1 : ≥ 18 pt (24 px), ou ≥ 14 pt (18,666… px) en gras (≥ 700).
 * @param {number} fontSizePx
 * @param {number} fontWeight
 */
export function isLargeText(fontSizePx, fontWeight) {
  return fontSizePx >= 24 || (fontSizePx >= (14 * 96) / 72 && fontWeight >= 700);
}

/**
 * Niveaux WCAG 2.1 atteints pour un ratio donné.
 * @param {number} ratio
 * @param {boolean} large
 * @returns {{ AA: boolean, AAA: boolean }}
 */
export function wcagLevels(ratio, large) {
  return large ? { AA: ratio >= 3, AAA: ratio >= 4.5 } : { AA: ratio >= 4.5, AAA: ratio >= 7 };
}
