// @ts-check
/**
 * --trace-rendered : pour un échantillon d'éléments (un par contexte), trouve
 * la déclaration qui donne la valeur calculée et la feuille qui la porte
 * (règles T1 à T5 de expected.json, rendered.trace).
 * Coûteux sur une grande page : désactivé par défaut.
 */
import { collectSheets } from './sheets.js';
import { attributeSource } from '../lib/sources.js';

/** Propriétés relevées qui s'héritent (T3). */
const INHERITED = new Set(['color', 'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing']);

/**
 * @typedef {object} TraceResult
 * @property {'feuille' | 'attribut style' | 'navigateur' | 'initiale' | 'non tracé'} origin
 * @property {string | null} source    étiquette de la feuille (sources.json), pour origin = feuille
 * @property {string | null} selector
 * @property {string | null} href
 * @property {number | null} line      ligne (base 1) de la règle dans le texte de sa feuille (pour un <style>, ajouter startLine de la feuille)
 * @property {boolean} inherited
 * @property {boolean} important
 * @property {string | null} [written]  lot V, étape 6 : valeur écrite dans la déclaration (composante d'un raccourci)
 * @property {number | null} [sheetLine]  ligne dans le document pour un <style> (startLine ajouté), sinon = line
 */

/**
 * Cherche la déclaration de `prop` dans un style CDP, la dernière l'emportant.
 * @param {any} style
 * @param {string} prop
 * @param {boolean} important
 */
function declares(style, prop, important) {
  const list = style?.cssProperties ?? [];
  /** @param {any} p */
  const usable = (p) => !(p.disabled || p.parsedOk === false || !!p.important !== important);
  /** Valeur de `prop` dans une entrée : la propriété elle-même ou la composante d'un raccourci. @param {any} p */
  const valueIn = (p) => (p.name === prop ? p : p.longhandProperties?.find((/** @type {any} */ x) => x.name === prop));
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (!usable(p)) continue;
    const l = valueIn(p);
    if (!l) continue;
    let written = typeof l.value === 'string' ? l.value : null;
    // Lot V, étape 6 : une entrée implicite (sans emplacement dans la source) porte une valeur
    // normalisée (rgb(…)) ; la valeur écrite est celle de l'entrée de la source qui la déclare.
    /** @type {any} */
    let src = p;
    if (!p.range) {
      src = list.findLast((/** @type {any} */ q) => usable(q) && q.range && valueIn(q)) ?? p;
      const v = valueIn(src)?.value;
      if (typeof v === 'string') written = v;
    }
    // Composante d'un raccourci (border: 1px solid #dadada) : la couleur arrive normalisée en rgb() ;
    // la valeur écrite est le jeton du raccourci qui donne cette couleur.
    if (src.name !== prop && typeof src.value === 'string' && written && /^rgba?\(/.test(written)) {
      const token = src.value.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi)?.find((/** @type {string} */ t) => sameColor(t, /** @type {string} */ (written)));
      if (token) written = token;
    }
    return { written };
  }
  return null;
}

/**
 * Deux écritures de couleur opaques égales (#rgb, #rrggbb, rgb(…)) ; faux si l'une est illisible.
 * @param {string} a @param {string} b
 */
function sameColor(a, b) {
  /** @param {string} v */
  const rgb = (v) => {
    const t = v.trim().toLowerCase();
    const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t);
    if (h) {
      const x = h[1].length === 3 ? [...h[1]].map((c) => c + c).join('') : h[1];
      return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16)).join(',');
    }
    const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*(?:[,/]\s*1(?:\.0+)?\s*)?\)$/.exec(t);
    return m ? [m[1], m[2], m[3]].join(',') : null;
  };
  const x = rgb(a);
  return !!x && x === rgb(b);
}

/**
 * T2 : règle gagnante pour `prop` dans une entrée CDP { inlineStyle, matchedCSSRules }.
 * Cascade, de la plus faible à la plus forte :
 * normales : navigateur < auteur (ordre CDP) < attribut style ;
 * importantes : auteur < attribut style < navigateur.
 * @param {any} entry
 * @param {string} prop
 * @returns {{ rule: any | null, inline: boolean, important: boolean, written: string | null } | null}
 */
export function winner(entry, prop) {
  const rules = entry.matchedCSSRules ?? [];
  const ua = rules.filter((/** @type {any} */ r) => r.rule.origin === 'user-agent');
  const author = rules.filter((/** @type {any} */ r) => r.rule.origin !== 'user-agent');
  /** @type {{ style: any, rule: any | null, inline: boolean }[]} */
  const important = [
    ...author.map((/** @type {any} */ r) => ({ style: r.rule.style, rule: r.rule, inline: false })),
    { style: entry.inlineStyle, rule: null, inline: true },
    ...ua.map((/** @type {any} */ r) => ({ style: r.rule.style, rule: r.rule, inline: false })),
  ];
  const normal = [
    ...ua.map((/** @type {any} */ r) => ({ style: r.rule.style, rule: r.rule, inline: false })),
    ...author.map((/** @type {any} */ r) => ({ style: r.rule.style, rule: r.rule, inline: false })),
    { style: entry.inlineStyle, rule: null, inline: true },
  ];
  for (const [list, imp] of /** @type {const} */ ([[important, true], [normal, false]])) {
    for (let i = list.length - 1; i >= 0; i--) {
      const d = list[i].style ? declares(list[i].style, prop, imp) : null;
      if (d) return { rule: list[i].rule, inline: list[i].inline, important: imp, written: d.written };
    }
  }
  return null;
}

/**
 * Trace un lot d'échantillons sur une page ouverte, après collectRendered
 * (qui a gardé les éléments dans window.__dsAuditElements).
 * @param {import('playwright-core').Page} page
 * @param {{ index: number, property: string, pseudo: boolean }[]} samples
 * @param {{ sources: import('../lib/sources.js').CompiledSources | null }} opts
 * @returns {Promise<TraceResult[]>} dans l'ordre des échantillons
 */
export async function traceSamples(page, samples, { sources }) {
  return traceElements(page, samples, { sources, lookup: (i) => `window.__dsAuditElements[${Number(i)}]` });
}

/**
 * Lot V, étape 6 : comme traceSamples, pour des éléments désignés par une expression de page
 * (par exemple les éléments de la simulation, window.__dsSim.els[i]).
 * @param {import('playwright-core').Page} page
 * @param {{ index: number, property: string, pseudo: boolean }[]} samples
 * @param {{ sources: import('../lib/sources.js').CompiledSources | null, lookup: (i: number) => string }} opts
 * @returns {Promise<TraceResult[]>}
 */
export async function traceElements(page, samples, { sources, lookup }) {
  if (!samples.length) return [];
  const cdp = await page.context().newCDPSession(page);
  try {
    // collectSheets active DOM et CSS elle-même : son écouteur doit précéder CSS.enable
    // pour recevoir l'annonce des feuilles déjà présentes.
    const { sheets } = await collectSheets(page, { cdp });
    const pageUrl = page.url();
    /** @type {Map<string, { source: string, href: string | null, startLine: number }>} */
    const byId = new Map(
      sheets.map((s) => [
        s.styleSheetId,
        { source: attributeSource({ href: s.href ?? undefined, inline: s.inline }, sources, pageUrl), href: s.href, startLine: s.startLine },
      ]),
    );
    await cdp.send('DOM.getDocument', { depth: 0 });
    /** @type {Map<number, any>} */
    const matched = new Map();

    /** @type {TraceResult[]} */
    const out = [];
    for (const s of samples) {
      /** @type {TraceResult} */
      const none = { origin: 'non tracé', source: null, selector: null, href: null, line: null, inherited: false, important: false };
      if (s.pseudo) {
        out.push(none);
        continue;
      }
      let m = matched.get(s.index);
      if (!m) {
        const { result } = /** @type {any} */ (
          await cdp.send('Runtime.evaluate', { expression: lookup(s.index) })
        );
        if (!result?.objectId) {
          out.push(none);
          continue;
        }
        const { nodeId } = /** @type {any} */ (await cdp.send('DOM.requestNode', { objectId: result.objectId }));
        m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
        matched.set(s.index, m);
      }
      let w = winner(m, s.property);
      let inherited = false;
      if (!w && INHERITED.has(s.property)) {
        for (const inh of m.inherited ?? []) {
          w = winner(inh, s.property);
          if (w) {
            inherited = true;
            break;
          }
        }
      }
      if (!w) {
        out.push({ ...none, origin: 'initiale' });
        continue;
      }
      if (w.inline) {
        out.push({ ...none, origin: 'attribut style', inherited, important: w.important, written: w.written });
        continue;
      }
      const rule = w.rule;
      const selector = rule.selectorList?.text ?? null;
      if (rule.origin === 'user-agent') {
        out.push({ ...none, origin: 'navigateur', selector, inherited, important: w.important, written: w.written });
        continue;
      }
      const sheet = byId.get(rule.styleSheetId);
      const startLine = rule.style?.range?.startLine;
      out.push({
        origin: 'feuille',
        source: sheet?.source ?? null,
        selector,
        href: sheet?.href ?? null,
        line: typeof startLine === 'number' ? startLine + 1 : null,
        sheetLine: typeof startLine === 'number' ? startLine + 1 + (sheet?.href ? 0 : sheet?.startLine ?? 0) : null,
        inherited,
        important: w.important,
        written: w.written,
      });
    }
    return out;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Lot V, étape 6 : identifiant d'une déclaration de feuille (feuille, ligne, sélecteur, propriété).
 * @param {{ href: string | null, sheetLine?: number | null, line: number | null, selector: string | null }} t
 * @param {string} property @param {string} page  chemin de la page (feuille <style>)
 */
export const declarationId = (t, property, page) => `${t.href ?? `${page}#style`}|${t.sheetLine ?? t.line}|${t.selector}|${property}`;

/**
 * Lot V, étape 6 (D3) : unité d'une valeur écrite dans la source. « relative » : rem, em, %, unités
 * de fenêtre ou de police ; « absolue » : px ou zéro ; « inconnue » : var(), calc(), env(), mot-clé
 * d'héritage ; « sans unité » : le reste (couleurs, mots-clés).
 * @param {string | null | undefined} v
 * @returns {'relative' | 'absolue' | 'inconnue' | 'sans unité'}
 */
export function unitOf(v) {
  const t = String(v ?? '').trim().toLowerCase();
  if (!t || /\b(var|calc|env|min|max|clamp)\(/.test(t) || /^(inherit|initial|unset|revert|revert-layer)$/.test(t)) return 'inconnue';
  if (/(^|[\s(,])-?(\d*\.)?\d+(rem|em|%|vw|vh|vmin|vmax|ch|ex|lh|rlh|cap|ic)\b/.test(t) || /(^|[\s(,])-?(\d*\.)?\d+%/.test(t)) return 'relative';
  if (/^-?(\d*\.)?\d+px$/.test(t) || /^-?0$/.test(t)) return 'absolue';
  return 'sans unité';
}
