// @ts-check
/**
 * Preuve par décision (D38) : sur une page chargée, avant puis après la pose des feuilles ajoutées, chaque ligne
 * décidée de feuilles-ajoutees.json est-elle arrivée à l'écran ?
 *   - avant la pose : les éléments que la règle d'origine atteint (lus par Chromium, contexte compris), et parmi eux
 *     ceux où elle gagne la propriété longue : m ;
 *   - après la pose : parmi ces m, ceux où une règle d'une feuille ajoutée gagne et où la valeur calculée est celle
 *     du jeton (lue sur une sonde qui ne porte que var(--jeton)) : n.
 * « arrivée » si n = m, « arrivée en partie » si 0 < n < m, « non arrivée » si n = 0 ; quand m = 0, « non vue » :
 * aucun élément atteint par la règle sur la page, ou la règle d'origine perdait déjà partout avant la pose.
 * juger : sortie 1 dès qu'une ligne écrite n'est pas arrivée sur une page vérifiée, ou n'est vue sur aucune de ses
 * pages vérifiées ; les lignes non écrites et les « non vues » sur une page ne décident pas seules.
 */
import { collectSheets } from '../browser/sheets.js';
import { winner } from '../browser/trace.js';

/**
 * @typedef {{ rows: string[], sheet: string, line: number, column: number | null, selector: string, property: string, value: string,
 *   pages: string[], ecrite: boolean, cause: string | null, important: boolean, injectee: boolean }} Ligne  ligne du manifeste
 * @typedef {'arrivée' | 'arrivée en partie' | 'non arrivée' | 'non vue : aucun élément' | 'non vue : perdait déjà'} Statut
 * @typedef {Ligne & { statut: Statut, n: number, m: number, gagnantes: string[], texte: string }} Decision
 */

/** Feuille, ligne et colonne d'une ligne. @param {Ligne} l */
const repere = (l) => `${l.sheet}:${l.line}${l.column != null ? `:${l.column}` : ''}`;
/** En-tête d'une ligne dans un texte. @param {Ligne} l */
const tete = (l) => `${l.rows.join(', ')} ${repere(l)} ${l.selector} { ${l.property} }`;
/** @param {number} n */
const elements = (n) => `${n} élément${n > 1 ? 's' : ''}`;

/**
 * Ouvre une lecture CDP de la page : feuilles (chemin d'URL de l'origine de la page, ou feuille ajoutée reconnue à son
 * texte), styles appliqués à un élément de window.__dsArrivee.
 * @param {import('playwright-core').Page} page @param {Map<string, string>} ajouts  texte d'une feuille ajoutée → son chemin
 */
async function lecture(page, ajouts) {
  const cdp = await page.context().newCDPSession(page);
  const { sheets } = await collectSheets(page, { cdp });
  const origine = new URL(page.url()).origin;
  /** @type {Map<string, { chemin: string | null, ajout: string | null }>} */
  const parId = new Map(
    sheets.map((s) => {
      const u = s.href ? new URL(s.href) : null;
      // Un <style> inséré par un script n'est pas « inline » pour Chromium : la feuille ajoutée se reconnaît à son texte.
      return [s.styleSheetId, { chemin: u ? (u.origin === origine ? u.pathname : u.href) : null, ajout: u ? null : ajouts.get(s.text) ?? null }];
    }),
  );
  await cdp.send('DOM.getDocument', { depth: 0 });
  /** @param {number} i */
  const styles = async (i) => {
    const { result } = /** @type {any} */ (await cdp.send('Runtime.evaluate', { expression: `window.__dsArrivee[${Number(i)}]` }));
    const { nodeId } = /** @type {any} */ (await cdp.send('DOM.requestNode', { objectId: result.objectId }));
    return /** @type {any} */ (await cdp.send('CSS.getMatchedStylesForNode', { nodeId }));
  };
  return { cdp, parId, styles };
}

/** La règle d'origine d'une ligne parmi les règles qui atteignent un élément. @param {any[]} rules @param {Ligne} l @param {Map<string, any>} parId */
const regleSource = (rules, l, parId) =>
  rules.find(
    (x) =>
      x.rule.origin !== 'user-agent' &&
      parId.get(x.rule.styleSheetId)?.chemin === l.sheet &&
      x.rule.style?.range?.startLine + 1 === l.line &&
      (l.column == null || x.rule.style?.range?.startColumn === l.column),
  ) ?? null;

/**
 * Avant la pose : pour chaque ligne, les éléments que sa règle atteint et ceux où elle gagne (indices dans
 * window.__dsArrivee, posé ici).
 * @param {import('playwright-core').Page} page @param {Ligne[]} lignes
 * @returns {Promise<{ atteints: number[], gagnes: number[] }[]>}
 */
export async function avantPose(page, lignes) {
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
    Object.defineProperty(window, '__dsArrivee', { value: els, configurable: true });
    return out;
  }, lignes.map((l) => l.selector));
  const { cdp, parId, styles } = await lecture(page, new Map());
  try {
    const out = [];
    for (const [k, l] of lignes.entries()) {
      /** @type {number[]} */
      const atteints = [];
      /** @type {number[]} */
      const gagnes = [];
      for (const i of index[k]) {
        const m = await styles(i);
        const source = regleSource(m.matchedCSSRules ?? [], l, parId);
        if (!source) continue;
        atteints.push(i);
        if (winner(m, l.property)?.rule === source.rule) gagnes.push(i);
      }
      out.push({ atteints, gagnes });
    }
    return out;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Après la pose : le statut de chaque ligne.
 * @param {import('playwright-core').Page} page @param {Ligne[]} lignes @param {{ atteints: number[], gagnes: number[] }[]} avant
 * @param {{ ajout: string, texte: string }[]} feuilles  feuilles ajoutées posées
 * @returns {Promise<Decision[]>}
 */
export async function apresPose(page, lignes, avant, feuilles) {
  // Valeur visée : celle du jeton seul, sur une sonde ; sans jeton, la nouvelle valeur.
  const visees = await page.evaluate(
    (ls) =>
      ls.map(({ property, value }) => {
        const jeton = /^var\(\s*(--[\w-]+)/.exec(value)?.[1];
        const d = document.createElement('div');
        d.style.setProperty(property, jeton ? `var(${jeton})` : value);
        document.body.append(d);
        const v = getComputedStyle(d).getPropertyValue(property);
        d.remove();
        return v;
      }),
    lignes.map((l) => ({ property: l.property, value: l.value })),
  );
  const { cdp, parId, styles } = await lecture(page, new Map(feuilles.map((f) => [f.texte, f.ajout])));
  try {
    /** @type {Decision[]} */
    const out = [];
    for (const [k, l] of lignes.entries()) {
      const { atteints, gagnes } = avant[k];
      let n = 0;
      /** @type {string[]} */
      const gagnantes = [];
      for (const i of gagnes) {
        const m = await styles(i);
        const w = winner(m, l.property);
        const f = w?.rule ? parId.get(w.rule.styleSheetId) : null;
        const valeur = /** @type {string} */ (
          await page.evaluate(([i, p]) => getComputedStyle(/** @type {any} */ (window).__dsArrivee[i]).getPropertyValue(p), /** @type {[number, string]} */ ([i, l.property]))
        );
        if (f?.ajout && valeur === visees[k]) {
          n++;
          continue;
        }
        const sel = w?.rule?.selectorList?.text ?? '';
        const r = w?.rule?.style?.range;
        const ou = r ? `:${r.startLine + 1}:${r.startColumn}` : '';
        const g = !w
          ? 'aucune règle (valeur héritée ou initiale)'
          : w.inline
            ? 'attribut style'
            : w.rule?.origin === 'user-agent'
              ? 'navigateur'
              : f?.ajout
                ? `feuille ajoutée ${f.ajout} ${sel}, valeur ${valeur} au lieu de ${visees[k]}`
                : `${f?.chemin ?? 'bloc <style>'}${ou} ${sel}${w.important ? ' !important' : ''}`;
        if (!gagnantes.includes(g)) gagnantes.push(g);
      }
      const mm = gagnes.length;
      /** @type {Statut} */
      const statut = !atteints.length ? 'non vue : aucun élément' : !mm ? 'non vue : perdait déjà' : n === mm ? 'arrivée' : n ? 'arrivée en partie' : 'non arrivée';
      const corps =
        statut === 'arrivée'
          ? `arrivée (${elements(n)})`
          : statut === 'non vue : aucun élément'
            ? 'non vue sur cette page (aucun élément atteint par la règle)'
            : statut === 'non vue : perdait déjà'
              ? "non vue sur cette page (la règle d'origine perdait déjà partout avant la pose)"
              : `${statut} (${elements(n)} sur ${mm}) ; gagne : ${gagnantes.join(' ; ')}`;
      const avantCorps = l.ecrite ? '' : `non écrite (${l.cause}), `;
      const apres = l.ecrite && l.injectee ? " ; feuille injectée par un script : posée après l'injection" : '';
      out.push({ ...l, statut, n, m: mm, gagnantes, texte: `${tete(l)} : ${avantCorps}${corps}${apres}` });
    }
    return out;
  } finally {
    await cdp.detach().catch(() => {});
  }
}

/**
 * Jugement sur les pages vérifiées : sortie 1 et ses motifs, ou 0.
 * @param {{ page: string, decisions: Decision[] }[]} pages
 * @returns {{ sortie: 0 | 1, motifs: string[] }}
 */
export function juger(pages) {
  /** @type {Map<string, { l: Decision, vue: boolean }>} */
  const parLigne = new Map();
  /** @type {string[]} */
  const motifs = [];
  for (const { page, decisions } of pages)
    for (const d of decisions) {
      if (!d.ecrite) continue;
      const k = JSON.stringify([d.rows, d.sheet, d.line, d.column, d.selector, d.property]);
      const x = parLigne.get(k) ?? { l: d, vue: false };
      x.vue ||= !d.statut.startsWith('non vue');
      parLigne.set(k, x);
      if (d.statut === 'non arrivée' || d.statut === 'arrivée en partie') motifs.push(`${tete(d)} : ${d.statut} sur ${page}`);
    }
  for (const { l, vue } of parLigne.values()) if (!vue) motifs.push(`${tete(l)} : écrite, vue sur aucune de ses pages vérifiées`);
  return { sortie: motifs.length ? 1 : 0, motifs };
}
