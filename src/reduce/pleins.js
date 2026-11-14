// @ts-check
/**
 * Lot K : texte sur plein, une décision par plein (par échelle).
 *
 * K1. Les lignes de fond « plein » dont la proposition (ou la valeur, déjà sur la cible) est le pas 9
 *     ou 10 d'une échelle mènent au plein de cette échelle. L'échelle a une carte quand un texte posé
 *     sur l'un de ces fonds, après sa propre ligne, passe sous son seuil sur le pas 9 (ou sur le fond
 *     que la table lui donnerait). La carte couvre tous les éléments portés par ces fonds.
 *     Retouche : l'échelle n'a pas de carte quand chaque texte passe déjà sur son fond tel qu'il
 *     est et sur le fond où la table le mène (blanc sur terre-10 après migration).
 * K2. Versions : (a) « onSolid » : l'onSolid de l'échelle sur le pas 9 ; (b) « pas-10 » : le texte
 *     d'origine sur le pas 10, seulement si chaque texte du plein y passe son seuil ; (c) « garder » :
 *     fond au pas 9, texte gardé, sous le seuil. Aucune recommandée.
 * K3. Une seule décision par plein, sous la clé « plein|<échelle> » : les lignes de fond suivent la
 *     carte (pas 9 pour (a) et (c), pas 10 pour (b)) ; une décision de ligne du fichier est ignorée.
 * K5. Carte non tranchée : les lignes de fond ne sont pas appliquées (ni fond, ni texte).
 */
import { isOut, decisionFor, rowKey, onSolidOf, mapping } from './propose.js';
import { contrastRatio, isOpaque, toLab, deltaE, relativeLuminance } from '../lib/color.js';

/** Versions d'une carte de plein, dans l'ordre de la carte. */
export const PLEIN_CHOICES = /** @type {const} */ (['onSolid', 'pas-10', 'garder']);

/**
 * Pas 9 ou 10 de la valise le plus proche d'une couleur (ΔE), ou null.
 * @param {any} target
 */
export function pleinFinder(target) {
  const T = (target.colors ?? []).map((/** @type {any} */ c) => ({ name: c.name, value: c.value.toLowerCase(), lab: toLab(c.value.toLowerCase()) }));
  /** @param {string} hex @returns {{ scale: string, step: 9 | 10 } | null} */
  const pleinOf = (hex) => {
    if (!T.length || !isOpaque(hex)) return null;
    const lab = toLab(hex);
    const best = T.map((/** @type {any} */ t) => ({ t, d: deltaE(lab, t.lab) })).sort((/** @type {any} */ a, /** @type {any} */ b) => a.d - b.d)[0];
    const m = /^(.+)-(\d+)$/.exec(best.t.name ?? '');
    return m && Number(m[2]) >= 9 && Number(m[2]) <= 10 ? { scale: m[1], step: /** @type {9 | 10} */ (Number(m[2])) } : null;
  };
  return { T, pleinOf };
}

/** @param {Record<string, any>} map @param {string} v @param {string} usage */
const mapped = (map, v, usage) => map.colors?.[`${v}|${usage}`] ?? map.colors?.[v] ?? v;
const r4 = (/** @type {number} */ x) => Math.round(x * 10000) / 10000;

/**
 * @typedef {{ choice: string, label: string, text: string, bg: string, ratio: number, threshold: number, pass: boolean }} PleinVersion
 * @typedef {{ id: string, key: string, scale: string, title: string, steps: { 9: { name: string, value: string }, 10: { name: string, value: string } | null },
 *   onSolid: string, rows: { id: string, key: string, old: string, class: string }[], pairs: { text: string, after: string, bg: string, threshold: number, n: number }[],
 *   elements: { page: string, selector: string, text: string, bg: string }[], versions: PleinVersion[], choice: string | null,
 *   ignored: { id: string, key: string, value: string | false }[], capture?: any }} Plein
 */

/**
 * K1, K2 : cartes « Texte sur plein <échelle> », une par plein concerné.
 * @param {{ table: { families: Record<string, { rows: any[] }> }, rendered: any, target: any, decisions?: Record<string, string | false> }} o
 * @returns {Plein[]}
 */
export function pleinGroups({ table, rendered, target, decisions = {} }) {
  const { T, pleinOf } = pleinFinder(target);
  /** @param {string} name */
  const step = (name) => {
    const t = T.find((/** @type {any} */ x) => x.name === name);
    return t ? { name, value: t.value } : null;
  };
  // Le texte suit sa propre ligne (et ses décisions) ; les fonds de plein, la carte.
  const base = mapping(table, decisions);
  /** @type {Map<string, any[]>} */
  const byScale = new Map();
  for (const r of table.families.colors?.rows ?? []) {
    if (r.usage !== 'plein' || isOut(r.class) || !r.new) continue;
    const p = pleinOf(r.new);
    if (!p) continue;
    byScale.set(p.scale, [...(byScale.get(p.scale) ?? []), r]);
  }
  /** @type {Plein[]} */
  const out = [];
  for (const [scale, rows] of [...byScale].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const s9 = step(`${scale}-9`);
    const s10 = step(`${scale}-10`);
    const onSolid = onSolidOf(target.onSolid ?? {}, scale, 9);
    if (!s9 || !onSolid) continue;
    const olds = new Set(rows.map((r) => r.old));
    const pairs = (rendered.usages?.pairs ?? [])
      .filter((/** @type {any} */ p) => p.bgUsage === 'plein' && olds.has(p.bg))
      .map((/** @type {any} */ p) => ({ text: p.text, after: mapped(base, p.text, 'texte'), bg: p.bg, threshold: p.threshold, n: p.n }));
    if (!pairs.length) continue;
    // Retouche : pas de carte quand chaque texte passe déjà sur le fond tel qu'il est (texte tel
    // qu'il est) et sur le fond où la table le mène (texte après sa propre ligne) : ex. blanc sur
    // terre-10 après migration.
    /** @param {string} bg */
    const nextOf = (bg) => rows.find((r) => r.old === bg)?.new ?? bg;
    const passes = pairs.every(
      (/** @type {any} */ p) => contrastRatio(p.text, p.bg) >= p.threshold && contrastRatio(p.after, nextOf(p.bg)) >= p.threshold,
    );
    const concerned =
      !passes &&
      pairs.some(
        (/** @type {any} */ p) => contrastRatio(p.after, s9.value) < p.threshold || contrastRatio(p.after, mapped(base, p.bg, 'plein')) < p.threshold,
      );
    if (!concerned) continue;
    /** Paire la moins favorable d'un fond donné, et si toutes passent. @param {string} bg @param {(p: any) => string} textOf */
    const worst = (bg, textOf) => {
      const list = pairs.map((/** @type {any} */ p) => ({ text: textOf(p), ratio: contrastRatio(textOf(p), bg), threshold: p.threshold }));
      const w = list.sort((a, b) => a.ratio - b.ratio)[0];
      return { text: w.text, bg, ratio: r4(w.ratio), threshold: Math.max(...pairs.map((/** @type {any} */ p) => p.threshold)), pass: list.every((x) => x.ratio >= x.threshold - 1e-9) };
    };
    const solid = String(onSolid).toLowerCase();
    // Libellés pour un designer, valables pour toute échelle et tout texte d'origine ; valeurs et
    // contraste sont affichés à part.
    const darker = (/** @type {string} */ a, /** @type {string} */ b2) => relativeLuminance(a) < relativeLuminance(b2);
    const allWhite = pairs.every((/** @type {any} */ p) => p.after === '#ffffff');
    const keep = worst(s9.value, (p) => p.after);
    /** @type {PleinVersion[]} */
    const versions = [{ choice: 'onSolid', label: darker(solid, s9.value) ? 'Texte foncé' : 'Texte clair', ...worst(s9.value, () => solid) }];
    const b = s10 ? worst(s10.value, (p) => p.after) : null;
    if (b?.pass && s10)
      versions.push({ choice: 'pas-10', label: `${allWhite ? 'Texte blanc' : 'Texte d’origine'}, fond plus ${darker(s10.value, s9.value) ? 'foncé' : 'clair'}`, ...b });
    versions.push({ choice: 'garder', label: keep.pass ? 'Garder' : 'Garder (sous le seuil)', ...keep });
    out.push({
      id: `plein-${scale}`,
      key: `plein|${scale}`,
      scale,
      title: `Texte sur plein ${scale}`,
      steps: { 9: s9, 10: s10 },
      onSolid: solid,
      rows: rows.map((r) => ({ id: r.id ?? '', key: rowKey('colors', r), old: r.old, class: r.class })),
      pairs,
      elements: [],
      versions,
      choice: null,
      ignored: [],
    });
  }
  return out;
}

/**
 * K4 : choix lus dans le fichier de décisions, par échelle. Une version inconnue, ou absente de la
 * carte (pas-10 quand le texte n'y passe pas), est refusée. Une clé « plein|… » sans carte (le plein
 * ne pose plus de problème, après migration) est sans effet.
 * @param {Plein[]} groups @param {Record<string, string | false>} decisions
 * @returns {Record<string, string | null>}
 */
export function pleinChoices(groups, decisions) {
  /** @type {Record<string, string | null>} */
  const out = {};
  for (const g of groups) {
    const v = decisions[g.key];
    if (v === undefined) {
      out[g.scale] = null;
      continue;
    }
    const allowed = g.versions.map((x) => x.choice);
    if (typeof v !== 'string' || !allowed.includes(v))
      throw new Error(`Décision ${g.key} : « ${String(v)} » n'est pas une version de la carte ${g.title} (${allowed.join(', ')})`);
    out[g.scale] = v;
  }
  return out;
}

/**
 * K3, K5 : pose le choix de chaque carte sur ses lignes de fond (r.plein) et renvoie les décisions
 * effectives : chaque ligne de fond reçoit le pas de la version choisie, ou false (rien n'est
 * appliqué) tant que la carte n'est pas tranchée. Les décisions de ligne du fichier sont ignorées.
 * @param {{ families: Record<string, { rows: any[] }> }} table @param {Plein[]} groups @param {Record<string, string | false>} decisions
 * @returns {Record<string, string | false>}
 */
export function applyPleins(table, groups, decisions) {
  const choices = pleinChoices(groups, decisions);
  /** @type {Record<string, string | false>} */
  const eff = { ...decisions };
  const rows = table.families.colors?.rows ?? [];
  for (const g of groups) {
    g.choice = choices[g.scale];
    g.ignored = [];
    const value = g.choice === 'pas-10' ? /** @type {any} */ (g.steps[10]).value : g.steps[9].value;
    for (const x of g.rows) {
      const r = rows.find((y) => rowKey('colors', y) === x.key);
      if (!r) continue;
      const d = decisionFor(decisions, 'colors', r);
      if (d !== undefined) g.ignored.push({ id: x.id, key: x.key, value: d });
      eff[x.key] = g.choice ? value : false;
      r.plein = { id: g.id, key: g.key, title: g.title, choice: g.choice, ignored: d ?? null };
    }
  }
  return eff;
}

/**
 * Lot K : carte de simulation d'une version d'une carte de plein : ses fonds, et pour (a) les couplages.
 * @param {Plein} g @param {string} choice @param {string[]} solid
 */
export function pleinVersionMap(g, choice, solid = []) {
  const to = choice === 'pas-10' ? /** @type {any} */ (g.steps[10]).value : g.steps[9].value;
  /** @type {Record<string, string>} */
  const colors = {};
  for (const r of g.rows) colors[`${r.old}|plein`] = to;
  const couplings =
    choice === 'onSolid'
      ? g.pairs.filter((p) => p.text !== g.onSolid).map((p) => ({ text: p.text, bg: p.bg, to, onSolid: g.onSolid }))
      : [];
  return { colors, solid, couplings };
}
