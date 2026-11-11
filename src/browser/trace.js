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
 */

/**
 * Cherche la déclaration de `prop` dans un style CDP, la dernière l'emportant.
 * @param {any} style
 * @param {string} prop
 * @param {boolean} important
 */
function declares(style, prop, important) {
  const list = style?.cssProperties ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    if (p.disabled || p.parsedOk === false || !!p.important !== important) continue;
    if (p.name === prop || p.longhandProperties?.some((/** @type {any} */ l) => l.name === prop)) return true;
  }
  return false;
}

/**
 * T2 : règle gagnante pour `prop` dans une entrée CDP { inlineStyle, matchedCSSRules }.
 * Cascade, de la plus faible à la plus forte :
 * normales : navigateur < auteur (ordre CDP) < attribut style ;
 * importantes : auteur < attribut style < navigateur.
 * @param {any} entry
 * @param {string} prop
 * @returns {{ rule: any | null, inline: boolean, important: boolean } | null}
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
      if (list[i].style && declares(list[i].style, prop, imp)) return { rule: list[i].rule, inline: list[i].inline, important: imp };
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
          await cdp.send('Runtime.evaluate', { expression: `window.__dsAuditElements[${Number(s.index)}]` })
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
        out.push({ ...none, origin: 'attribut style', inherited, important: w.important });
        continue;
      }
      const rule = w.rule;
      const selector = rule.selectorList?.text ?? null;
      if (rule.origin === 'user-agent') {
        out.push({ ...none, origin: 'navigateur', selector, inherited, important: w.important });
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
        inherited,
        important: w.important,
      });
    }
    return out;
  } finally {
    await cdp.detach().catch(() => {});
  }
}
