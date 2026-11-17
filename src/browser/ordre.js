// @ts-check
/**
 * Règles gagnantes sur une page chargée, pour les feuilles ajoutées (src/apply/ajout.js, D37).
 * Pour chaque cible (feuille, ligne et colonne d'une règle, sélecteur de la source, propriété longue) : sur chaque élément
 * que cette règle atteint vraiment (contexte compris, lu par Chromium), la règle qui gagne la propriété, avec sa
 * feuille, sa ligne et sa spécificité, et la spécificité de la règle visée sur cet élément. C'est ce qui dit si
 * la règle, reprise juste après sa feuille, passerait devant une règle de même spécificité qui la suit.
 */
import { collectSheets } from './sheets.js';
import { winner } from './trace.js';

/**
 * @typedef {{ feuille: string, ligne: number, colonne: number | null, selecteur: string, propriete: string }} Cible
 *   colonne : celle de l'accolade ouvrante, base 1 (la colonne de début de bloc que Chromium donne, base 0) ;
 *   null : la ligne seule situe la règle
 * @typedef {{ origine: 'feuille' | 'attribut style' | 'navigateur', feuille: string | null, ligne: number | null,
 *   colonne: number | null, selecteur: string | null, important: boolean, specificite: number[] | null }} Gagnante
 * @typedef {{ specificite: number[], gagnante: Gagnante }} Sur
 */

/** Ordre de deux spécificités [a, b, c]. @param {number[]} x @param {number[]} y */
export const comparer = (x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2];

/** Spécificité la plus forte parmi les sélecteurs qui atteignent l'élément. @param {any} m  entrée de matchedCSSRules */
function specificiteDe(m) {
  const sel = m.rule.selectorList?.selectors ?? [];
  /** @type {number[] | null} */
  let best = null;
  for (const i of m.matchingSelectors ?? []) {
    const s = sel[i]?.specificity;
    if (!s) continue;
    const v = [s.a, s.b, s.c];
    if (!best || comparer(v, best) > 0) best = v;
  }
  return best;
}

/**
 * @param {import('playwright-core').Page} page  page chargée
 * @param {Cible[]} cibles
 * @returns {Promise<Sur[][]>}  par cible, un relevé par élément atteint
 */
export async function reglesGagnantes(page, cibles) {
  if (!cibles.length) return [];
  const cdp = await page.context().newCDPSession(page);
  try {
    const { sheets } = await collectSheets(page, { cdp });
    const origine = new URL(page.url()).origin;
    /** Chemin d'URL d'une feuille de l'origine de la page, ou null. @type {Map<string, string | null>} */
    const chemin = new Map(
      sheets.map((s) => {
        if (!s.href) return [s.styleSheetId, null];
        const u = new URL(s.href);
        return [s.styleSheetId, u.origin === origine ? u.pathname : null];
      }),
    );
    // Éléments atteints par le sélecteur de chaque cible, une liste commune sans doublon.
    const index = await page.evaluate((sels) => {
      /** @type {Element[]} */
      const els = [];
      const out = sels.map((s) => {
        let found = [];
        try {
          found = [...document.querySelectorAll(s)];
        } catch {
          // sélecteur que querySelectorAll refuse (pseudo-élément) : aucun élément
        }
        return found.map((e) => {
          let i = els.indexOf(e);
          if (i < 0) i = els.push(e) - 1;
          return i;
        });
      });
      Object.defineProperty(window, '__dsOrdre', { value: els, configurable: true });
      return out;
    }, cibles.map((c) => c.selecteur));
    await cdp.send('DOM.getDocument', { depth: 0 });
    /** @type {Map<number, any>} */
    const matched = new Map();
    /** @param {number} i */
    const stylesOf = async (i) => {
      const known = matched.get(i);
      if (known) return known;
      const { result } = /** @type {any} */ (await cdp.send('Runtime.evaluate', { expression: `window.__dsOrdre[${Number(i)}]` }));
      const { nodeId } = /** @type {any} */ (await cdp.send('DOM.requestNode', { objectId: result.objectId }));
      const m = await cdp.send('CSS.getMatchedStylesForNode', { nodeId });
      matched.set(i, m);
      return m;
    };
    /** @type {Sur[][]} */
    const out = [];
    for (const [k, c] of cibles.entries()) {
      /** @type {Sur[]} */
      const list = [];
      for (const i of index[k]) {
        const m = await stylesOf(i);
        const rules = /** @type {any[]} */ (m.matchedCSSRules ?? []);
        const visee = rules.find(
          (x) =>
            x.rule.origin !== 'user-agent' &&
            chemin.get(x.rule.styleSheetId) === c.feuille &&
            x.rule.style?.range?.startLine + 1 === c.ligne &&
            (c.colonne == null || x.rule.style?.range?.startColumn === c.colonne),
        );
        // La règle n'atteint pas l'élément (contexte faux à cette largeur) : rien à juger.
        if (!visee) continue;
        const w = winner(m, c.propriete);
        if (!w) continue;
        const gm = w.rule ? rules.find((x) => x.rule === w.rule) : null;
        list.push({
          specificite: specificiteDe(visee) ?? [0, 0, 0],
          gagnante: {
            origine: w.inline ? 'attribut style' : w.rule?.origin === 'user-agent' ? 'navigateur' : 'feuille',
            feuille: w.rule ? (chemin.get(w.rule.styleSheetId) ?? null) : null,
            ligne: typeof w.rule?.style?.range?.startLine === 'number' ? w.rule.style.range.startLine + 1 : null,
            colonne: typeof w.rule?.style?.range?.startColumn === 'number' ? w.rule.style.range.startColumn : null,
            selecteur: w.rule?.selectorList?.text ?? null,
            important: w.important,
            specificite: gm ? specificiteDe(gm) : null,
          },
        });
      }
      out.push(list);
    }
    return out;
  } finally {
    await cdp.detach().catch(() => {});
  }
}
