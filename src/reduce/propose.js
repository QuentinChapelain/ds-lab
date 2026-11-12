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
 *              lot R : pour une taille de texte, il faut aussi ≤ 2 px ;
 *   décision   au-delà : trois candidats, le designer tranche ;
 *   hors table valeur non convertible (%, em…) ou couleur transparente.
 * Les seuils sont des hypothèses de départ, à régler à l'œil. [H]
 *
 * Lot B (règles R1 à R9, voir fixtures/marque-demo/expected-pieges.json et
 * expected-desordre-valise.json), quand l'audit fournit le relevé par usage :
 *   R1  l'usage choisit la tranche (texte 11-12, bordure 6-8, fond 1-5, plein 9-10),
 *       la proximité choisit le pas, dans l'échelle de la valeur la plus proche ;
 *       pour le texte et les bordures de champ, le pas le plus proche qui passe le seuil ;
 *   R2  une ligne auto ou proche qui fait passer une paire sous son seuil devient une décision ;
 *   R3  une ligne par valeur × usage ;
 *   R4  ΔE > 10 à toute la valise : hors table, aucune échelle (avant R1) ;
 *   R5  une décision sans réponse, ou une ligne hors table, n'est pas appliquée ;
 *   R6  les éléments tiers sont exclus de la simulation (src/browser/simulate.js) ;
 *   R7  espacement négatif, > 64 px ou marge auto : hors table, mise en page ;
 *       rayon ≥ moitié du plus petit côté, ou pourcentage ≥ 50 % : pilule ;
 *   R8  fond plus sombre que le pas 10 le plus sombre : hors table, fond sombre (avant R1) ;
 *       un texte posé dessus est une décision ;
 *   R9  correction : la paire la plus défavorable échoue avant et passe après, cible
 *       dans l'échelle de la valeur la plus proche ; appliquée par défaut, annulable.
 *
 * Lot R, R-1 : chaque ligne reçoit un identifiant (coul-, esp-, arr-, tail- et un numéro
 * sur deux chiffres, par famille, rangé par occurrences décroissantes, puis valeur, puis
 * usage, indépendant de la classe) et un titre en clair : « propriété · élément « texte
 * visible » et n autres (rôles) ». L'élément de référence est le premier, dans l'ordre des
 * pages, du rôle le plus fréquent parmi les éléments touchés ; les rôles des autres suivent,
 * trois au plus, quand ils sont mélangés.
 */
import { toLab, deltaE, isOpaque, contrastRatio, relativeLuminance } from '../lib/color.js';

export const CLASSES = /** @type {const} */ (['décision', 'proche', 'auto', 'inchangé', 'hors table']);

/** Lot B : sous-classes « hors table » avec leur motif. */
export const OUT = /** @type {const} */ ({ scale: 'hors table, aucune échelle', dark: 'hors table, fond sombre', layout: 'hors table, mise en page' });

/** Toutes les classes, dans l'ordre de la revue. */
export const ALL_CLASSES = /** @type {const} */ (['décision', 'correction', 'proche', 'auto', 'inchangé', OUT.scale, OUT.dark, OUT.layout, 'hors table']);

/** R5 : classes appliquées sans réponse du designer. */
export const APPLIED = new Set(['correction', 'proche', 'auto', 'inchangé']);

export const THRESHOLDS = { autoPx: 1, nearRatio: 0.15, nearTextPx: 2, autoDeltaE: 2, nearDeltaE: 5, pillPx: 500 };

/** Lot B : seuils des règles R4 et R7. */
export const RULES = { noScaleDeltaE: 10, layoutMaxPx: 64 };

/** R1 : tranches de pas par usage. */
export const SLICES = /** @type {Record<string, [number, number]>} */ ({ texte: [11, 12], bordure: [6, 8], fond: [1, 5], plein: [9, 10] });

/** Libellé court d'un usage de couleur (un plein est un fond). */
const USAGE_LABEL = /** @type {Record<string, string>} */ ({ texte: 'texte', bordure: 'bordure', fond: 'fond', plein: 'fond', autre: 'autre' });

/** @param {string} cls */
export const isOut = (cls) => cls.startsWith('hors table');

/**
 * @typedef {{ name?: string, value: string }} TargetColor
 * @typedef {{ radii?: number[], spacing?: number[], fontSizes?: number[], colors?: TargetColor[] }} Target
 * @typedef {object} Row
 * @property {string} old
 * @property {number} count          occurrences d'interface dans le rendu
 * @property {string | null} new
 * @property {string} [name]         nom du pas de la cible, pour une couleur
 * @property {string} class          une de ALL_CLASSES
 * @property {string} [usage]        lot B : usage de la ligne (R3)
 * @property {string[]} [usages]     lot B : usages couverts (une ligne hors table « aucune échelle » les regroupe)
 * @property {string} [slice]        lot B : tranche de la valise (R1)
 * @property {string} [reason]       lot B : motif d'une décision imposée, d'une correction ou d'un hors table
 * @property {{ threshold: number, before: number, after: number }} [contrast]  lot B : paire la plus défavorable,
 *   avant et avec la cible proposée (appliquée ou non), les autres lignes suivant la table
 * @property {number | null} delta   écart en px, ou ΔE × 100 pour une couleur
 * @property {{ value: string, name?: string, delta: number }[]} candidates
 * @property {string[]} properties   familles ou propriétés d'origine
 * @property {string[]} selectors    exemples
 * @property {string} [id]           lot R : identifiant stable de la ligne (R-1)
 * @property {string} [title]        lot R : titre en clair (R-1)
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
  /** @type {Map<string, { count: number, properties: Set<string>, selectors: string[], kinds?: Record<string, Kind> }>} */
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
      e.kinds = mergeKinds(e.kinds, x.kinds);
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
  const live = rows.filter((r) => !isOut(r.class));
  return {
    before: new Set(live.map((r) => r.old)).size,
    after: new Set(live.map((r) => r.new)).size,
    decisions: rows.filter((r) => r.class === 'décision').length,
    corrections: rows.filter((r) => r.class === 'correction').length,
    near: rows.filter((r) => r.class === 'proche').length,
    auto: rows.filter((r) => r.class === 'auto').length,
    unchanged: rows.filter((r) => r.class === 'inchangé').length,
    outOfTable: rows.length - live.length,
    occurrences: live.reduce((t, r) => t + r.count, 0),
  };
}

/** @param {Row[]} rows */
const ordered = (rows) =>
  rows.sort(
    (a, b) =>
      ALL_CLASSES.indexOf(/** @type {any} */ (a.class)) - ALL_CLASSES.indexOf(/** @type {any} */ (b.class)) ||
      b.count - a.count ||
      (a.old < b.old ? -1 : a.old > b.old ? 1 : (a.usage ?? '') < (b.usage ?? '') ? -1 : 1),
  );

/**
 * @param {Map<string, { count: number, properties: Set<string>, selectors: string[] }>} values
 * @param {number[]} scale
 * @param {{ pill?: boolean, nearPx?: number }} [opts]
 * @returns {Row[]}
 */
function dimensionRows(values, scale, { pill = false, nearPx = Infinity } = {}) {
  /** @type {Row[]} */
  const rows = [];
  for (const [old, v] of values) rows.push(dimensionRow({ old, count: v.count, properties: [...v.properties], selectors: v.selectors, kinds: v.kinds }, scale, { pill, nearPx }));
  return ordered(rows);
}

/**
 * Une ligne de dimension : la valeur rangée sur l'échelle.
 * @param {{ old: string, count: number, properties: string[], selectors: string[] }} base
 * @param {number[]} scale
 * @param {{ pill?: boolean, forcePill?: boolean, nearPx?: number }} [opts]  forcePill : l'élément dessine une pilule (R7) ;
 *   nearPx : écart absolu au-delà duquel la ligne n'est plus proche (lot R, tailles de texte)
 * @returns {Row}
 */
function dimensionRow(base, scale, { pill = false, forcePill = false, nearPx = Infinity } = {}) {
  const steps = [...scale].sort((a, b) => a - b);
  const old = base.old;
  const n = px(old);
  const maxStep = steps[steps.length - 1];
  // R7 : une pilule (y compris un pourcentage de 50 % ou plus) va au plus grand pas.
  if (forcePill && maxStep >= THRESHOLDS.pillPx) {
    const same = n === maxStep;
    return { ...base, new: `${maxStep}px`, class: same ? 'inchangé' : 'auto', delta: 0, candidates: [{ value: `${maxStep}px`, delta: 0 }] };
  }
  if (n === null) return { ...base, new: null, class: 'hors table', delta: null, candidates: [] };
  if (pill && n >= THRESHOLDS.pillPx && maxStep >= THRESHOLDS.pillPx) {
    const same = n === maxStep;
    return { ...base, new: `${maxStep}px`, class: same ? 'inchangé' : 'auto', delta: 0, candidates: [{ value: `${maxStep}px`, delta: 0 }] };
  }
  const candidates = steps
    .map((s) => ({ value: `${s}px`, delta: round2(Math.abs(s - n)) }))
    .sort((a, b) => a.delta - b.delta || /** @type {number} */ (px(a.value)) - /** @type {number} */ (px(b.value)))
    .slice(0, 3);
  const best = candidates[0];
  const ratio = n === 0 ? (best.delta === 0 ? 0 : 1) : best.delta / Math.abs(n);
  const cls = best.delta === 0 ? 'inchangé' : best.delta <= THRESHOLDS.autoPx ? 'auto' : ratio <= THRESHOLDS.nearRatio && best.delta <= nearPx ? 'proche' : 'décision';
  return { ...base, new: best.value, class: cls, delta: best.delta, candidates };
}

/**
 * Lot B : entrées d'un usage, hors occurrences de contenu.
 * @param {Record<string, { count: number, content: number, properties: string[], selectors: string[], field?: number }>} byUsage
 */
const usageEntries = (byUsage) =>
  Object.entries(byUsage)
    .map(([usage, e]) => ({ usage, e, n: e.count - (e.content ?? 0) }))
    .filter((x) => x.n > 0);

/**
 * Lot B : espacements par valeur × usage (R3), hors table « mise en page » (R7).
 * @param {Record<string, Record<string, any>>} usages @param {number[]} scale
 * @returns {Row[]}
 */
function spacingUsageRows(usages, scale) {
  /** @type {Row[]} */
  const rows = [];
  for (const [old, byUsage] of Object.entries(usages)) {
    for (const { usage, e, n } of usageEntries(byUsage)) {
      const base = { old, count: n, properties: e.properties, selectors: e.selectors, usage, usages: [usage], kinds: e.kinds };
      const v = px(old);
      if (v !== null && (v < 0 || v > RULES.layoutMaxPx)) {
        rows.push({ ...base, new: null, class: OUT.layout, delta: null, candidates: [], reason: v < 0 ? 'espacement négatif (R7)' : `espacement supérieur à ${RULES.layoutMaxPx} px (R7)` });
        continue;
      }
      rows.push(dimensionRow(base, scale));
    }
  }
  return ordered(rows);
}

/**
 * Lot B : rayons par valeur × usage ; une pilule va au plus grand pas (R7).
 * @param {Record<string, Record<string, any>>} usages @param {number[]} scale
 * @returns {Row[]}
 */
function radiusUsageRows(usages, scale) {
  /** @type {Row[]} */
  const rows = [];
  for (const [old, byUsage] of Object.entries(usages)) {
    for (const { usage, e, n } of usageEntries(byUsage)) {
      const base = { old, count: n, properties: e.properties, selectors: e.selectors, usage, usages: [usage], kinds: e.kinds };
      rows.push(dimensionRow(base, scale, { forcePill: usage === 'pilule' }));
    }
  }
  return ordered(rows);
}

/** @param {number} d  ΔE */
const byDelta = (d) => (d <= THRESHOLDS.autoDeltaE ? 'auto' : d <= THRESHOLDS.nearDeltaE ? 'proche' : 'décision');
/** @param {number} n */
const round4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Lot B : couleurs par valeur × usage, règles R1 à R5, R8 et R9.
 * @param {any} usages   rendered.usages
 * @param {TargetColor[]} targets
 * @returns {Row[]}
 */
function colorUsageRows(usages, targets) {
  const T = targets.map((t) => {
    const value = t.value.toLowerCase();
    const m = /^(.+)-(\d+)$/.exec(t.name ?? '');
    return { name: t.name, value, lab: toLab(value), lum: relativeLuminance(value), scale: m ? m[1] : t.name ?? value, step: m ? Number(m[2]) : null };
  });
  const hasScales = T.some((t) => t.step !== null);
  const tens = T.filter((t) => t.step === 10);
  const darkLum = hasScales && tens.length ? Math.min(...tens.map((t) => t.lum)) : null;
  /** @param {[number, number, number]} lab @param {typeof T} list */
  const sorted = (lab, list) =>
    list.map((t) => ({ t, delta: round2(deltaE(lab, t.lab)) })).sort((a, b) => a.delta - b.delta || (a.t.value < b.t.value ? -1 : 1));
  /** @param {{ t: (typeof T)[number], delta: number }[]} list */
  const candidatesOf = (list) => list.slice(0, 3).map((c) => ({ value: c.t.value, name: c.t.name, delta: c.delta }));

  /** @type {(Row & { _cands?: any[], _nearest?: any, _fixed?: boolean, _exact?: any })[]} */
  const rows = [];
  for (const [old, byUsage] of Object.entries(usages.colors ?? {})) {
    const entries = usageEntries(byUsage);
    if (!entries.length) continue;
    const properties = [...new Set(entries.flatMap((x) => x.e.properties))];
    const selectors = [...new Set(entries.flatMap((x) => x.e.selectors))].slice(0, 4);
    const count = entries.reduce((t, x) => t + x.n, 0);
    const labels = [...new Set(entries.map((x) => USAGE_LABEL[x.usage] ?? x.usage))];
    const kinds = entries.reduce((/** @type {Record<string, Kind> | undefined} */ a, x) => mergeKinds(a, x.e.kinds), undefined);
    if (!isOpaque(old)) {
      rows.push({ old, count, properties, selectors, usages: labels, kinds, new: null, class: 'hors table', delta: null, candidates: [] });
      continue;
    }
    const lab = toLab(old);
    const all = sorted(lab, T);
    const nearest = all[0];
    if (nearest.delta > RULES.noScaleDeltaE) {
      rows.push({
        old, count, properties, selectors, usages: labels, kinds, new: null, class: OUT.scale, delta: nearest.delta, candidates: candidatesOf(all),
        reason: `ΔE ${nearest.delta} à la valeur la plus proche de la valise (${nearest.t.name}) : aucune échelle (R4)`,
      });
      continue;
    }
    for (const { usage, e, n } of entries) {
      const range = hasScales ? SLICES[usage] : undefined;
      let pool = range ? T.filter((t) => t.scale === nearest.t.scale && t.step !== null && t.step >= range[0] && t.step <= range[1]) : T;
      if (!pool.length) pool = T;
      const cands = sorted(lab, pool);
      const exact = T.find((t) => t.value === old);
      /** @type {any} */
      const row = { old, count: n, properties: e.properties, selectors: e.selectors, usage, usages: [USAGE_LABEL[usage] ?? usage], kinds: e.kinds, candidates: candidatesOf(cands), _cands: cands, _nearest: nearest, _exact: exact };
      if (range) row.slice = usage;
      if (e.field) row.field = e.field;
      if (darkLum !== null && (usage === 'fond' || usage === 'plein') && relativeLuminance(old) < darkLum) {
        Object.assign(row, { new: null, class: OUT.dark, delta: null, reason: 'fond plus sombre que le pas 10 le plus sombre de la valise (R8)', _fixed: true });
      } else if (exact) {
        Object.assign(row, { new: old, name: exact.name, class: 'inchangé', delta: 0 });
      } else {
        Object.assign(row, { new: cands[0].t.value, name: cands[0].t.name, class: byDelta(cands[0].delta), delta: cands[0].delta });
      }
      rows.push(row);
    }
  }

  // Paires de contraste rattachées aux lignes.
  /** @type {Map<string, any[]>} */
  const textPairs = new Map();
  /** @type {Map<string, any[]>} */
  const bgPairs = new Map();
  /** @type {Map<string, any[]>} */
  const fieldPairs = new Map();
  /** @param {Map<string, any[]>} m @param {string} k @param {any} v */
  const push = (m, k, v) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const p of usages.pairs ?? []) {
    push(textPairs, p.text, p);
    push(bgPairs, `${p.bg}|${p.bgUsage}`, p);
  }
  for (const p of usages.borderPairs ?? []) push(fieldPairs, p.border, { ...p, text: p.border });
  /** @type {Map<string, any>} */
  const byKey = new Map(rows.filter((r) => r.usage).map((r) => [`${r.old}|${r.usage}`, r]));
  /** Valeur après la table provisoire (R5 : décision et hors table non appliquées). @param {string} v @param {string} usage */
  const now = (v, usage) => {
    const r = byKey.get(`${v}|${usage}`);
    return r && APPLIED.has(r.class) && r.new ? r.new : v;
  };
  /** @param {string} a @param {string} b @param {number} thr */
  const fails = (a, b, thr) => contrastRatio(a, b) < thr - 1e-9;
  /** Paire la plus défavorable, rapportée à son seuil. @param {any[]} ps @param {(p: any) => [string, string]} side */
  const worst = (ps, side) => {
    let best = null;
    for (const p of ps) {
      const [a, b] = side(p);
      const ratio = contrastRatio(a, b);
      if (!best || ratio / p.threshold < best.ratio / best.threshold) best = { ratio, threshold: p.threshold };
    }
    return /** @type {{ ratio: number, threshold: number }} */ (best);
  };

  // R8 : un texte posé sur un fond sombre est une décision.
  if (darkLum !== null)
    for (const r of rows)
      if (r.usage === 'texte' && (textPairs.get(r.old) ?? []).some((p) => relativeLuminance(p.bg) < darkLum) && !r._exact)
        Object.assign(r, { class: 'décision', reason: 'texte posé sur un fond sombre (R8)', _fixed: true });

  /** @param {any} r @param {{ t: any, delta: number }} c @param {string} cls @param {string} [reason] */
  const set = (r, c, cls, reason) => {
    const changed = r.new !== c.t.value || r.class !== cls;
    Object.assign(r, { new: c.t.value, name: c.t.name, delta: c.delta, class: cls });
    if (reason) r.reason = reason;
    else delete r.reason;
    return changed;
  };
  for (let round = 0; round < 10; round++) {
    let changed = false;
    for (const r of rows) {
      if (!r.usage || r._fixed || !r._cands) continue;
      const nearestScale = r._nearest.t.scale;
      const fg = r.usage === 'texte' || (r.usage === 'bordure' && fieldPairs.has(r.old));
      if (fg) {
        const ps = r.usage === 'texte' ? textPairs.get(r.old) : fieldPairs.get(r.old);
        if (!ps?.length) continue;
        const beforeFail = ps.some((p) => fails(r.old, p.bg, p.threshold));
        /** @param {string} c */
        const ok = (c) => ps.every((p) => !fails(c, now(p.bg, p.bgUsage), p.threshold));
        const exactCand = r._exact ? { t: r._exact, delta: 0 } : null;
        let chosen;
        let cls;
        let reason;
        if (exactCand && !(beforeFail && hasScales)) {
          chosen = exactCand;
          cls = 'inchangé';
        } else if (exactCand) {
          const found = r._cands.find((/** @type {any} */ c) => ok(c.t.value));
          chosen = found ?? exactCand;
          cls = found && found.t.value !== r.old ? 'correction' : 'inchangé';
        } else {
          chosen = (hasScales && r._cands.find((/** @type {any} */ c) => ok(c.t.value))) || r._cands[0];
          cls = byDelta(chosen.delta);
          if (beforeFail && hasScales && ok(chosen.t.value) && chosen.t.scale === nearestScale) cls = 'correction';
          else if (!beforeFail && !ok(chosen.t.value) && (cls === 'auto' || cls === 'proche')) {
            cls = 'décision';
            reason = `la paire passe avant et échoue après (R2)`;
          }
        }
        if (cls === 'correction') reason = r.usage === 'texte' ? 'texte sous 4,5:1 avant, au seuil après (R9)' : 'bordure de champ sous 3:1 avant, au seuil après (R9)';
        if (set(r, chosen, cls, reason)) changed = true;
        const b = worst(ps, (p) => [r.old, p.bg]);
        const a = worst(ps, (p) => [r.new ?? r.old, now(p.bg, p.bgUsage)]);
        r.contrast = { threshold: b.threshold, before: round4(b.ratio), after: round4(a.ratio) };
      } else if (r.usage === 'fond' || r.usage === 'plein') {
        const ps = bgPairs.get(`${r.old}|${r.usage}`);
        if (!ps?.length || r._exact) continue;
        const c = r._cands[0];
        const beforeFail = ps.some((p) => fails(p.text, r.old, p.threshold));
        const afterOk = ps.every((p) => !fails(now(p.text, 'texte'), c.t.value, p.threshold));
        // R9 : la correction revient au fond si son propre changement suffit, texte tel quel.
        const ownFix = ps.every((p) => !fails(p.text, c.t.value, p.threshold));
        let cls = byDelta(c.delta);
        let reason;
        if (beforeFail && ownFix && hasScales && c.t.scale === nearestScale) {
          cls = 'correction';
          reason = 'texte porté sous 4,5:1 avant, au seuil après (R9)';
        } else if (!beforeFail && !afterOk && (cls === 'auto' || cls === 'proche')) {
          cls = 'décision';
          reason = 'la paire passe avant et échoue après (R2)';
        } else if (beforeFail && !afterOk && r.usage === 'plein' && hasScales) {
          cls = 'décision';
          reason = `texte posé sur ${c.t.scale} : utiliser onSolid`;
        }
        if (set(r, c, cls, reason)) changed = true;
        const b = worst(ps, (p) => [p.text, r.old]);
        const a = worst(ps, (p) => [now(p.text, 'texte'), r.new ?? r.old]);
        r.contrast = { threshold: b.threshold, before: round4(b.ratio), after: round4(a.ratio) };
      }
    }
    if (!changed) break;
  }
  for (const r of rows) {
    delete r._cands;
    delete r._nearest;
    delete r._fixed;
    delete r._exact;
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
    const base = { old, count: v.count, properties: [...v.properties], selectors: v.selectors, kinds: v.kinds };
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
 * @typedef {import('../rendered/aggregate.js').First} First
 * @typedef {import('../rendered/aggregate.js').Kind} Kind
 */
/** Lot R (R-1) : le plus tôt de deux premiers éléments, dans l'ordre [page, relevé]. @param {First | undefined} a @param {First | undefined} b */
const earliest = (a, b) => (!a ? b : !b ? a : b.order[0] < a.order[0] || (b.order[0] === a.order[0] && b.order[1] < a.order[1]) ? b : a);
/**
 * Lot R (R-1) : réunit deux relevés de sortes (comptes additionnés, premier le plus tôt).
 * @param {Record<string, Kind> | undefined} a @param {Record<string, Kind> | undefined} b
 */
function mergeKinds(a, b) {
  if (!b) return a;
  /** @type {Record<string, Kind>} */
  const out = { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b)) out[k] = out[k] ? { n: out[k].n + v.n, first: /** @type {First} */ (earliest(out[k].first, v.first)) } : v;
  return out;
}

/** Lot R (R-1) : préfixe d'identifiant par famille. */
export const ID_PREFIX = /** @type {Record<string, string>} */ ({ colors: 'coul', spacing: 'esp', radii: 'arr', fontSizes: 'tail' });
/** Lot R (R-1) : propriété en clair, par famille puis par usage. */
const PROPERTY_LABEL = /** @type {Record<string, Record<string, string>>} */ ({
  colors: { texte: 'Couleur du texte', bordure: 'Couleur de bordure', fond: 'Fond', plein: 'Fond', autre: 'Couleur', '': 'Couleur' },
  spacing: { marge: 'Marge', retrait: 'Retrait intérieur', gouttière: 'Espace entre éléments', '': 'Espacement' },
  radii: { '': 'Arrondi' },
  fontSizes: { '': 'Taille du texte' },
});
/** Lot R (R-1) : marge sur un seul côté. */
const MARGIN_SIDE = /** @type {Record<string, string>} */ ({ 'margin-top': 'Marge haute', 'margin-bottom': 'Marge basse', 'margin-left': 'Marge gauche', 'margin-right': 'Marge droite' });
/** Lot R (R-1) : nom français du rôle relevé par src/browser/rendered.js (roleOf), et son pluriel. */
const ROLE_LABEL = /** @type {Record<string, string>} */ ({ bouton: 'bouton', lien: 'lien', champ: 'champ', titre: 'titre', image: 'image', texte: 'texte', conteneur: 'bloc' });
/** Texte visible coupé à 30 caractères ; trois rôles au plus après « n autres ». */
export const TITLE_TEXT_MAX = 30;
const TITLE_ROLES_MAX = 3;

/**
 * Lot R (R-1) : nom de l'élément, d'après son rôle. html et body sont la page ; un texte
 * ou un bloc en ligne, à fond opaque, au texte de 20 caractères au plus, est une étiquette.
 */
const elementName = (/** @type {{ role: string, tag: string, chip: boolean }} */ f) =>
  f.tag === 'html' || f.tag === 'body' ? 'page' : f.chip && (f.role === 'texte' || f.role === 'conteneur') ? 'étiquette' : ROLE_LABEL[f.role] ?? 'bloc';

/** Lot R (R-1) : texte visible coupé à 30 caractères. @param {string} raw */
const cut = (raw) => (raw.length > TITLE_TEXT_MAX ? `${raw.slice(0, TITLE_TEXT_MAX).trimEnd()}…` : raw);

/**
 * Lot R (R-1) : titre en clair d'une ligne.
 * @param {string} family @param {Row & { kinds?: Record<string, Kind> }} r
 */
export function rowTitle(family, r) {
  const labels = PROPERTY_LABEL[family] ?? { '': family };
  const usage = r.usage ?? (r.usages?.length === 1 ? r.usages[0] : '');
  let property = labels[usage] ?? labels[''] ?? family;
  if (family === 'spacing' && usage === 'marge' && r.properties?.length === 1 && MARGIN_SIDE[r.properties[0]]) property = MARGIN_SIDE[r.properties[0]];
  // Sortes réunies par nom : compte et premier élément de chaque nom.
  /** @type {Map<string, { n: number, first: First }>} */
  const byName = new Map();
  for (const k of Object.values(r.kinds ?? {})) {
    const name = elementName(k.first);
    const g = byName.get(name);
    byName.set(name, g ? { n: g.n + k.n, first: /** @type {First} */ (earliest(g.first, k.first)) } : { n: k.n, first: k.first });
  }
  /** @param {[string, { n: number, first: First }]} a @param {[string, { n: number, first: First }]} b */
  const rank = (a, b) => b[1].n - a[1].n || (earliest(a[1].first, b[1].first) === a[1].first ? -1 : 1);
  const groups = [...byName.entries()].sort(rank);
  if (!groups.length) return property;
  const [refName, ref] = groups[0];
  const text = cut(ref.first.label ?? '');
  const total = groups.reduce((t, [, g]) => t + g.n, 0);
  const others = total - 1;
  // Gouttière : les enfants que l'espace sépare, et non le bloc ; puis le nombre de blocs s'il y en a plusieurs.
  const kids = family === 'spacing' && usage === 'gouttière' ? ref.first.children : undefined;
  if (kids) {
    const names = [...new Set(kids.items.map(elementName))];
    const kind = names.length === 1 ? (kids.n > 1 ? `${names[0]}s` : names[0]) : 'éléments';
    const quoted = kids.items.map((c) => cut(c.label)).filter(Boolean).map((t) => `« ${t} »`);
    const more = kids.n - kids.items.length;
    const rest = others ? `, dans ${others + 1} blocs` : '';
    return `${property} · ${kids.n} ${kind}${quoted.length ? ` ${quoted.join(', ')}` : ''}${more ? ` et ${more} ${more === 1 ? 'autre' : 'autres'}` : ''}${rest}`;
  }
  let tail = others ? ` et ${others} ${others === 1 ? 'autre' : 'autres'}` : '';
  if (others && groups.length > 1) {
    const rest = groups
      .map(([name, g]) => /** @type {[string, number]} */ ([name, name === refName ? g.n - 1 : g.n]))
      .filter(([, n]) => n > 0)
      .slice(0, TITLE_ROLES_MAX)
      .map(([name, n]) => (n > 1 ? `${name}s` : name));
    tail += ` (${rest.join(', ')})`;
  }
  return `${property} · ${text ? `${refName} « ${text} »` : refName}${tail}`;
}

/** @param {string} a @param {string} b */
const byValue = (a, b) => {
  const x = px(a);
  const y = px(b);
  if (x !== null && y !== null && x !== y) return x - y;
  return a < b ? -1 : a > b ? 1 : 0;
};

/**
 * Lot R (R-1) : identifiant et titre de chaque ligne d'une famille ; retire les sortes
 * d'éléments, qui ne servent qu'au titre.
 * @param {string} family @param {(Row & { kinds?: Record<string, Kind> })[]} rows
 */
function identify(family, rows) {
  const prefix = ID_PREFIX[family] ?? family;
  const order = [...rows].sort((a, b) => b.count - a.count || byValue(a.old, b.old) || ((a.usage ?? '') < (b.usage ?? '') ? -1 : (a.usage ?? '') > (b.usage ?? '') ? 1 : 0));
  order.forEach((r, i) => {
    r.id = `${prefix}-${String(i + 1).padStart(2, '0')}`;
    r.title = rowTitle(family, r);
    delete r.kinds;
  });
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
    identify(name, rows);
    families[name] = { rows, summary: summarize(rows) };
  };
  // Lot B : avec le relevé par usage, une ligne par valeur × usage et les règles R1 à R9.
  const u = rendered.usages;
  if (target.radii) put('radii', u ? radiusUsageRows(u.radii, target.radii) : dimensionRows(gather(rendered, ['radii']), target.radii, { pill: true }));
  if (target.spacing) put('spacing', u ? spacingUsageRows(u.spacing, target.spacing) : dimensionRows(gather(rendered, ['margins', 'paddings', 'gaps']), target.spacing));
  if (target.fontSizes) put('fontSizes', dimensionRows(gather(rendered, ['fontSizes']), target.fontSizes, { nearPx: THRESHOLDS.nearTextPx }));
  if (target.colors) put('colors', u ? colorUsageRows(u, target.colors) : colorRows(gather(rendered, ['colors']), target.colors));
  return { thresholds: THRESHOLDS, rules: RULES, families };
}

/**
 * Clé d'une ligne dans les décisions et dans la simulation.
 * @param {string} family @param {{ old: string, usage?: string }} r
 */
export const rowKey = (family, r) => (r.usage ? `${family}|${r.old}|${r.usage}` : `${family}|${r.old}`);

/**
 * Applique des décisions du designer à une table : { "<famille>|<ancien>[|<usage>]": "<nouveau>" | false }.
 * `false` refuse le changement (la valeur reste telle quelle) ; une chaîne impose une valeur.
 * Sans décision, la proposition tient, sauf une décision ou une ligne hors table (R5).
 * Une valeur dont tous les usages vont au même pas est rangée sous « ancien » ; sinon
 * chaque usage l'est sous « ancien|usage ». `thirdParty` : sélecteurs exclus de la simulation (R6).
 * @param {{ families: Record<string, { rows: Row[] }>, thirdParty?: string[] }} table
 * @param {Record<string, string | false>} [decisions]
 * @returns {Record<string, any>} par famille : ancien (ou ancien|usage) → nouveau, changements seulement
 */
export function mapping(table, decisions = {}) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [family, f] of Object.entries(table.families)) {
    /** @type {Record<string, string>} */
    const fam = (out[family] = {});
    /** @type {Map<string, { usage?: string, next: string | null }[]>} */
    const byOld = new Map();
    for (const r of f.rows) {
      const k = rowKey(family, r);
      const d = k in decisions ? decisions[k] : decisions[`${family}|${r.old}`];
      const next = d === false ? null : typeof d === 'string' ? d : APPLIED.has(r.class) ? r.new : null;
      byOld.set(r.old, [...(byOld.get(r.old) ?? []), { usage: r.usage, next }]);
    }
    for (const [old, list] of byOld) {
      const first = list[0].next;
      if (list.every((x) => x.next === first)) {
        if (first && first !== old) fam[old] = first;
        continue;
      }
      for (const x of list) if (x.next && x.next !== old) fam[x.usage ? `${old}|${x.usage}` : old] = x.next;
    }
  }
  if (table.thirdParty?.length) out.thirdParty = [...table.thirdParty];
  return out;
}
