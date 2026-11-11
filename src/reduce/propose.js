// @ts-check
/**
 * Proposition d'une table ancien → nouveau, à partir du rendu d'un audit
 * (audit.json, clé rendered) et d'une cible écrite à la main.
 *
 * La cible vient d'abord : on ne fusionne pas des valeurs voisines pour
 * trouver une palette, on range chaque valeur existante sur l'échelle voulue.
 * Chaque ligne reçoit une classe, qui dit qui décide :
 *   inchangé   déjà sur la cible ;
 *   auto       écart invisible (≤ 1 px, ou ΔE ≤ 2) : appliqué sans revue ;
 *   proche     écart faible (≤ 15 % pour une dimension, ΔE ≤ 5) : à valider par lot ;
 *   décision   au-delà : trois candidats, le designer tranche ;
 *   hors table valeur non convertible (%, em…) ou couleur transparente.
 * Les seuils sont des hypothèses de départ, à régler à l'œil. [H]
 */
import { toLab, deltaE, isOpaque } from '../lib/color.js';

export const CLASSES = /** @type {const} */ (['décision', 'proche', 'auto', 'inchangé', 'hors table']);

export const THRESHOLDS = { autoPx: 1, nearRatio: 0.15, autoDeltaE: 2, nearDeltaE: 5, pillPx: 500 };

/**
 * @typedef {{ name?: string, value: string }} TargetColor
 * @typedef {{ radii?: number[], spacing?: number[], fontSizes?: number[], colors?: TargetColor[] }} Target
 * @typedef {object} Row
 * @property {string} old
 * @property {number} count          occurrences d'interface dans le rendu
 * @property {string | null} new
 * @property {string} [name]         nom du pas de la cible, pour une couleur
 * @property {typeof CLASSES[number]} class
 * @property {number | null} delta   écart en px, ou ΔE × 100 pour une couleur
 * @property {{ value: string, name?: string, delta: number }[]} candidates
 * @property {string[]} properties   familles ou propriétés d'origine
 * @property {string[]} selectors    exemples
 */

/** @param {string} key  « 12px » */
const px = (key) => {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(key);
  return m ? Number(m[1]) : null;
};
/** @param {number} n */
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Fusionne les valeurs de plusieurs familles du rendu (marges, retraits et
 * gouttières partagent une échelle d'espacement).
 * @param {any} rendered
 * @param {string[]} families
 */
function gather(rendered, families) {
  /** @type {Map<string, { count: number, properties: Set<string>, selectors: string[] }>} */
  const out = new Map();
  for (const f of families) {
    for (const [key, v] of Object.entries(rendered.families[f]?.values ?? {})) {
      const x = /** @type {any} */ (v);
      // Rayons : une clé peut porter deux longueurs (ellipse) ; seule la première sert.
      const k = key.split(' ')[0];
      const n = x.count - (x.content ?? 0);
      if (n <= 0) continue;
      const e = out.get(k) ?? { count: 0, properties: new Set(), selectors: [] };
      e.count += n;
      e.properties.add(f);
      for (const c of x.contexts ?? []) for (const s of c.selectors ?? []) if (e.selectors.length < 4 && !e.selectors.includes(s)) e.selectors.push(s);
      out.set(k, e);
    }
  }
  return out;
}

/**
 * @param {Row[]} rows
 */
function summarize(rows) {
  const live = rows.filter((r) => r.class !== 'hors table');
  return {
    before: live.length,
    after: new Set(live.map((r) => r.new)).size,
    decisions: rows.filter((r) => r.class === 'décision').length,
    near: rows.filter((r) => r.class === 'proche').length,
    auto: rows.filter((r) => r.class === 'auto').length,
    unchanged: rows.filter((r) => r.class === 'inchangé').length,
    outOfTable: rows.length - live.length,
    occurrences: live.reduce((t, r) => t + r.count, 0),
  };
}

/** @param {Row[]} rows */
const ordered = (rows) => rows.sort((a, b) => CLASSES.indexOf(a.class) - CLASSES.indexOf(b.class) || b.count - a.count || (a.old < b.old ? -1 : 1));

/**
 * @param {Map<string, { count: number, properties: Set<string>, selectors: string[] }>} values
 * @param {number[]} scale
 * @param {{ pill?: boolean }} [opts]
 * @returns {Row[]}
 */
function dimensionRows(values, scale, { pill = false } = {}) {
  const steps = [...scale].sort((a, b) => a - b);
  /** @type {Row[]} */
  const rows = [];
  for (const [old, v] of values) {
    const base = { old, count: v.count, properties: [...v.properties], selectors: v.selectors };
    const n = px(old);
    if (n === null) {
      rows.push({ ...base, new: null, class: 'hors table', delta: null, candidates: [] });
      continue;
    }
    const maxStep = steps[steps.length - 1];
    if (pill && n >= THRESHOLDS.pillPx && maxStep >= THRESHOLDS.pillPx) {
      const same = n === maxStep;
      rows.push({ ...base, new: `${maxStep}px`, class: same ? 'inchangé' : 'auto', delta: 0, candidates: [{ value: `${maxStep}px`, delta: 0 }] });
      continue;
    }
    const candidates = steps
      .map((s) => ({ value: `${s}px`, delta: round2(Math.abs(s - n)) }))
      .sort((a, b) => a.delta - b.delta || px(a.value) - px(b.value))
      .slice(0, 3);
    const best = candidates[0];
    const ratio = n === 0 ? (best.delta === 0 ? 0 : 1) : best.delta / Math.abs(n);
    /** @type {Row['class']} */
    const cls = best.delta === 0 ? 'inchangé' : best.delta <= THRESHOLDS.autoPx ? 'auto' : ratio <= THRESHOLDS.nearRatio ? 'proche' : 'décision';
    rows.push({ ...base, new: best.value, class: cls, delta: best.delta, candidates });
  }
  return ordered(rows);
}

/**
 * @param {Map<string, { count: number, properties: Set<string>, selectors: string[] }>} values
 * @param {TargetColor[]} targets
 * @returns {Row[]}
 */
function colorRows(values, targets) {
  const labs = targets.map((t) => ({ ...t, value: t.value.toLowerCase(), lab: toLab(t.value.toLowerCase()) }));
  /** @type {Row[]} */
  const rows = [];
  for (const [old, v] of values) {
    const base = { old, count: v.count, properties: [...v.properties], selectors: v.selectors };
    if (!isOpaque(old)) {
      rows.push({ ...base, new: null, class: 'hors table', delta: null, candidates: [] });
      continue;
    }
    const lab = toLab(old);
    const candidates = labs
      .map((t) => ({ value: t.value, name: t.name, delta: round2(deltaE(lab, t.lab)) }))
      .sort((a, b) => a.delta - b.delta || (a.value < b.value ? -1 : 1))
      .slice(0, 3);
    const best = candidates[0];
    /** @type {Row['class']} */
    const cls = best.value === old ? 'inchangé' : best.delta <= THRESHOLDS.autoDeltaE ? 'auto' : best.delta <= THRESHOLDS.nearDeltaE ? 'proche' : 'décision';
    rows.push({ ...base, new: best.value, name: best.name, class: cls, delta: best.delta, candidates });
  }
  return ordered(rows);
}

/**
 * @param {any} rendered  audit.rendered
 * @param {Target} target
 */
export function propose(rendered, target) {
  /** @type {Record<string, { rows: Row[], summary: ReturnType<typeof summarize> }>} */
  const families = {};
  /** @param {string} name @param {Row[]} rows */
  const put = (name, rows) => {
    families[name] = { rows, summary: summarize(rows) };
  };
  if (target.radii) put('radii', dimensionRows(gather(rendered, ['radii']), target.radii, { pill: true }));
  if (target.spacing) put('spacing', dimensionRows(gather(rendered, ['margins', 'paddings', 'gaps']), target.spacing));
  if (target.fontSizes) put('fontSizes', dimensionRows(gather(rendered, ['fontSizes']), target.fontSizes));
  if (target.colors) put('colors', colorRows(gather(rendered, ['colors']), target.colors));
  return { thresholds: THRESHOLDS, families };
}

/**
 * Applique des décisions du designer à une table : { "<famille>|<ancien>": "<nouveau>" | false }.
 * `false` refuse le changement (la valeur reste telle quelle) ; une chaîne impose une valeur.
 * Sans décision, la proposition tient.
 * @param {ReturnType<typeof propose>} table
 * @param {Record<string, string | false>} [decisions]
 * @returns {Record<string, Record<string, string>>} par famille : ancien → nouveau, changements seulement
 */
export function mapping(table, decisions = {}) {
  /** @type {Record<string, Record<string, string>>} */
  const out = {};
  for (const [family, f] of Object.entries(table.families)) {
    out[family] = {};
    for (const r of f.rows) {
      const d = decisions[`${family}|${r.old}`];
      if (d === false) continue;
      const next = typeof d === 'string' ? d : r.new;
      if (next && next !== r.old) out[family][r.old] = next;
    }
  }
  return out;
}
