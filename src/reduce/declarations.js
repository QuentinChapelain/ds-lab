// @ts-check
/**
 * Lot V, étape 6 : déclarations sources de chaque ligne de la table, et conflits.
 *
 * D3. Chaque élément d'une ligne est tracé jusqu'à sa déclaration gagnante (héritage compris) ;
 *     la valeur écrite donne l'unité (unitOf). Une ligne inchangée tenue par une déclaration en
 *     unité relative n'est pas rattachée : la valeur calculée dépend de la racine de la page.
 * D4. Une même déclaration (feuille, ligne, sélecteur, propriété) dans deux lignes dont l'issue
 *     diffère est un conflit : la remplacer pour l'une casse l'autre ; il faudrait couper la règle.
 *     Les pages témoins comptent : elles ne font pas la table, mais elles partagent les feuilles.
 */
import { APPLIED, decisionFor, rowKey } from './propose.js';
import { scanInPage } from '../browser/simulate.js';
import { traceElements, unitOf, declarationId } from '../browser/trace.js';
import { basename } from 'node:path';

/**
 * Carte de simulation qui couvre toutes les lignes, valeur inchangée : pour savoir, sans rien
 * changer à la page, de quelle ligne relève chaque élément.
 * @param {{ families: Record<string, { rows: any[] }>, thirdParty?: string[] }} table
 * @param {{ split?: string[], solid?: string[] }} [extra]
 */
export function identityMapping(table, { split = [], solid = [] } = {}) {
  /** @type {Record<string, any>} */
  const out = {};
  for (const [family, f] of Object.entries(table.families)) {
    /** @type {Record<string, string>} */
    const fam = (out[family] = {});
    for (const r of f.rows) fam[r.usage ? `${r.old}|${r.usage}${r.scope ? `|${r.scope}` : ''}` : r.old] = r.old;
  }
  return { ...out, thirdParty: table.thirdParty ?? [], split, solid };
}

/**
 * Sur une page chargée : chaque opération (élément, propriété, ligne) de la carte identité, tracée.
 * @param {import('playwright-core').Page} page
 * @param {Record<string, any>} identity  identityMapping(…)
 * @param {{ sources?: any }} [o]
 * @returns {Promise<{ key: string, family: string, property: string, page: string, trace: any, coupled: boolean }[]>}
 *   coupled : couleur de texte d'un élément visé par un COUPLAGE (carte identité : couplings, fond attendu = fond lu)
 */
export async function declarationsOnPage(page, identity, { sources = null } = {}) {
  await page.evaluate(scanInPage, identity);
  const all = await page.evaluate(() => /** @type {any} */ (window).__dsSim.ops.map((/** @type {any} */ o) => ({ i: o.i, prop: o.prop, key: o.key, family: o.family })));
  // Lot V, étape 6 : opérations de couplage (clé « …|sur-plein ») : elles marquent l'élément, sans ligne à elles.
  const coupledEls = new Set(all.filter((/** @type {any} */ o) => o.key.endsWith('|sur-plein')).map((/** @type {any} */ o) => o.i));
  const ops = all.filter((/** @type {any} */ o) => !o.key.endsWith('|sur-plein'));
  const traces = await traceElements(
    page,
    ops.map((/** @type {any} */ o) => ({ index: o.i, property: o.prop, pseudo: false })),
    { sources, lookup: (i) => `window.__dsSim.els[${Number(i)}]` },
  );
  const path = new URL(page.url()).pathname;
  return ops.map((/** @type {any} */ o, /** @type {number} */ n) => ({ key: o.key, family: o.family, property: o.prop, page: path, trace: traces[n], coupled: o.prop === 'color' && coupledEls.has(o.i) }));
}

/**
 * Issue d'une ligne pour l'agent : la valeur qu'il écrira, ou « laisse ».
 * @param {string} family @param {any} r @param {Record<string, string | false>} decisions @param {string} unit
 */
function outcomeOf(family, r, decisions, unit) {
  const d = decisionFor(decisions, family, r);
  const next = d === false ? null : typeof d === 'string' ? d : APPLIED.has(r.class) ? r.new : null;
  if (!next) return 'laisse';
  if (next === r.old && unit === 'relative') return 'laisse';
  return next;
}

/**
 * Déclarations par ligne et conflits. Pose sur chaque ligne de la table `declarations` et, le cas
 * échéant, `conflict` (« total » : toutes ses déclarations en conflit ; « partiel ») et `conflicts`.
 * @param {{ families: Record<string, { rows: any[] }> }} table
 * @param {{ key: string, family: string, property: string, page: string, trace: any, coupled?: boolean }[]} records
 * @param {Record<string, string | false>} decisions
 * @returns {any[]} conflits
 */
export function attachDeclarations(table, records, decisions) {
  /** @type {Map<string, { family: string, r: any }>} */
  const rows = new Map();
  for (const [family, f] of Object.entries(table.families)) for (const r of f.rows) rows.set(rowKey(family, r), { family, r });
  /** @param {string} key @param {string} family */
  const rowAt = (key, family) => rows.get(key) ?? rows.get(`${family}|${key.split('|')[1]}`);
  /** @type {Map<string, Map<string, any>>} */
  const byRow = new Map();
  /** @type {Map<string, any>} */
  const decls = new Map();
  for (const x of records) {
    const t = x.trace;
    if (!t || t.origin !== 'feuille') continue;
    const hit = rowAt(x.key, x.family);
    if (!hit) continue;
    // Lot V, étape 6 : un élément couplé sort de sa ligne ; sa déclaration est rangée à part.
    if (x.coupled) {
      const list = (hit.r.coupledDeclarations ??= []);
      const file = t.href ? basename(new URL(t.href).pathname) : '<style>';
      const line = t.sheetLine ?? t.line;
      if (!list.some((/** @type {any} */ e) => e.file === file && e.line === line && e.selector === t.selector)) list.push({ file, href: t.href ?? null, line, selector: t.selector, property: x.property, written: t.written, pages: [x.page] });
      else list.find((/** @type {any} */ e) => e.file === file && e.line === line && e.selector === t.selector)?.pages?.push(x.page);
      continue;
    }
    const key = rowKey(hit.family, hit.r);
    const id = declarationId(t, x.property, x.page);
    const file = t.href ? basename(new URL(t.href).pathname) : '<style>';
    let d = decls.get(id);
    if (!d) decls.set(id, (d = { id, file, href: t.href, line: t.sheetLine ?? t.line, selector: t.selector, property: x.property, written: t.written, unit: unitOf(t.written), rows: new Map() }));
    const m = byRow.get(key) ?? new Map();
    byRow.set(key, m);
    const e = m.get(id) ?? { id, file, href: d.href ?? null, line: d.line, selector: d.selector, property: x.property, written: t.written, unit: d.unit, inherited: false, pages: new Set(), elements: 0 };
    e.inherited = e.inherited || !!t.inherited;
    e.pages.add(x.page);
    e.elements++;
    m.set(id, e);
    const rr = d.rows.get(key) ?? { key, family: hit.family, r: hit.r, pages: new Set() };
    rr.pages.add(x.page);
    d.rows.set(key, rr);
  }
  // Conflits : issues différentes pour une même déclaration.
  const conflicts = [];
  for (const d of decls.values()) {
    if (d.rows.size < 2) continue;
    const outs = [...d.rows.values()].map((x) => ({ ...x, outcome: outcomeOf(x.family, x.r, decisions, d.unit) }));
    if (new Set(outs.map((x) => x.outcome)).size < 2) continue;
    conflicts.push({
      id: d.id,
      file: d.file,
      href: d.href ?? null,
      line: d.line,
      selector: d.selector,
      property: d.property,
      written: d.written,
      rows: outs.map((x) => ({ id: x.r.id ?? '', key: x.key, outcome: x.outcome, usage: x.r.usage ?? null, scope: x.r.scope ?? null })).sort((a, b) => (a.id < b.id ? -1 : 1)),
      pages: [...new Set(outs.flatMap((x) => [...x.pages]))].sort(),
    });
  }
  const conflictIds = new Set(conflicts.map((c) => c.id));
  for (const [key, m] of byRow) {
    const hit = rows.get(key);
    if (!hit) continue;
    const list = [...m.values()]
      .map((e) => ({ ...e, pages: [...e.pages].sort(), conflict: conflictIds.has(e.id) }))
      .sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
    hit.r.declarations = list;
    const inConflict = list.filter((e) => e.conflict);
    if (inConflict.length) {
      hit.r.conflict = inConflict.length === list.length ? 'total' : 'partiel';
      hit.r.conflicts = inConflict.map((e) => {
        const c = conflicts.find((x) => x.id === e.id);
        return { file: e.file, line: e.line, selector: e.selector, property: e.property, with: (c?.rows ?? []).filter((y) => y.key !== key).map((y) => y.id) };
      });
    }
  }
  return conflicts;
}
