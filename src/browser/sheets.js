// @ts-check
/**
 * Collecte de toutes les feuilles de style d'une page chargée, par le
 * protocole DevTools (CDP) : feuilles liées, feuilles importées par une
 * règle d'import, balises style, feuilles
 * construites (adoptedStyleSheets) et feuilles d'un autre domaine, dont le
 * texte reste lisible ici alors que CORS le cache au script de la page.
 * Cadre principal seulement : les iframes ne sont pas parcourues.
 * D33 : les feuilles sont rendues dans l'ordre de la cascade, lu dans les données, pas dans
 * l'ordre où Chromium les annonce.
 */
import postcss from 'postcss';

/**
 * @typedef {object} CollectedSheet
 * @property {string | null} href     URL de la feuille ; null pour <style> et feuille construite.
 * @property {boolean} inline         <style> de la page.
 * @property {boolean} constructed    Feuille construite par JS (CSSStyleSheet adoptée).
 * @property {string} text            Texte de la feuille.
 * @property {number} startLine       Ligne (base 0) du début du texte dans le document, pour un <style>.
 * @property {'cdp' | 'requête'} via  Moyen d'obtention du texte.
 * @property {string} styleSheetId   Identifiant CDP, valable dans la session qui l'a obtenu.
 */

/**
 * @param {import('playwright-core').Page} page  page déjà chargée
 * @param {{ settleMs?: number, cdp?: import('playwright-core').CDPSession }} [opts]
 *   `cdp` : session à réutiliser (laissée ouverte, CSS et DOM activés) ; sinon une session
 *   est ouverte puis fermée.
 * @returns {Promise<{ sheets: CollectedSheet[], rootPx: number, warnings: string[] }>}
 */
export async function collectSheets(page, { settleMs = 150, cdp: given } = {}) {
  const cdp = given ?? (await page.context().newCDPSession(page));
  /** @type {any[]} */
  const headers = [];
  let last = Date.now();
  cdp.on('CSS.styleSheetAdded', (/** @type {any} */ e) => {
    headers.push(e.header);
    last = Date.now();
  });
  /** @type {string[]} */
  const warnings = [];
  try {
    const { frameTree } = /** @type {any} */ (await cdp.send('Page.getFrameTree'));
    const mainFrame = frameTree.frame.id;
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    // Chromium annonce les feuilles déjà présentes juste après CSS.enable : on attend le calme.
    while (Date.now() - last < settleMs) await new Promise((r) => setTimeout(r, settleMs / 3));

    /** @type {Entree[]} */
    const entrees = [];
    for (const h of headers) {
      if (h.frameId !== mainFrame || h.origin !== 'regular') continue;
      const inline = !!h.isInline;
      const constructed = !!h.isConstructed;
      const href = inline || constructed || !h.sourceURL ? null : h.sourceURL;
      /** @type {string | null} */
      let text = null;
      /** @type {'cdp' | 'requête'} */
      let via = 'cdp';
      try {
        text = /** @type {any} */ (await cdp.send('CSS.getStyleSheetText', { styleSheetId: h.styleSheetId })).text;
      } catch (e) {
        if (href) {
          try {
            const res = await page.request.get(href);
            if (res.ok()) {
              text = await res.text();
              via = 'requête';
            }
          } catch {
            /* signalé ci-dessous */
          }
        }
        if (text === null) warnings.push(`feuille illisible ${href ?? h.styleSheetId} (${/** @type {Error} */ (e).message})`);
      }
      if (text === null) continue;
      entrees.push({
        sheet: { href, inline, constructed, text, startLine: inline ? h.startLine ?? 0 : 0, via, styleSheetId: h.styleSheetId },
        url: h.sourceURL ?? '',
        ownerNode: h.ownerNode,
      });
    }
    const { rootPx, base } = await page.evaluate(() => ({ rootPx: parseFloat(getComputedStyle(document.documentElement).fontSize), base: document.baseURI }));
    const { root } = /** @type {any} */ (await cdp.send('DOM.getDocument', { depth: -1, pierce: true }));
    const { sheets, hors } = ordreDeCascade(entrees, rangsDuDocument(root), base);
    for (const u of hors) warnings.push(`feuille importée hors de l'ordre de la cascade : ${u}`);
    return { sheets, rootPx, warnings };
  } finally {
    if (!given) await cdp.detach().catch(() => {});
  }
}

/**
 * @typedef {{ sheet: CollectedSheet, url: string, ownerNode?: number }} Entree
 *   url : adresse annoncée par Chromium (adresse finale d'une feuille redirigée ; adresse du document pour un <style>) ;
 *   ownerNode : nœud <link> ou <style> propriétaire (backendNodeId), absent pour une feuille importée ou construite.
 */

/**
 * Rang de chaque nœud dans l'ordre du document (parcours en profondeur, racines fantômes comprises).
 * @param {any} root  nœud rendu par DOM.getDocument (depth -1, pierce)
 * @returns {Map<number, number>} backendNodeId → rang
 */
function rangsDuDocument(root) {
  /** @type {Map<number, number>} */
  const rangs = new Map();
  /** @type {any[]} */
  const pile = [root];
  while (pile.length) {
    const n = pile.pop();
    rangs.set(n.backendNodeId, rangs.size);
    pile.push(...[...(n.shadowRoots ?? []), ...(n.children ?? [])].reverse());
  }
  return rangs;
}

const URL_IMPORT = /^\s*(?:url\(\s*(['"]?)(.*?)\1\s*\)|(['"])(.*?)\3)/i;

/**
 * Adresses des règles d'import d'une feuille, dans l'ordre, résolues contre son adresse ; condition et couche ignorées.
 * @param {string} text @param {string} base
 * @returns {string[]}
 */
function importsDe(text, base) {
  let racine;
  try {
    racine = postcss.parse(text);
  } catch {
    return [];
  }
  /** @type {string[]} */
  const out = [];
  for (const n of racine.nodes) {
    if (n.type !== 'atrule' || n.name.toLowerCase() !== 'import') continue;
    const m = URL_IMPORT.exec(n.params);
    const brute = m?.[2] ?? m?.[4];
    if (!brute) continue;
    try {
      out.push(new URL(brute, base).href);
    } catch {
      /* adresse illisible : pas d'import à rattacher */
    }
  }
  return out;
}

/** @param {string} a @param {string} b */
const comparer = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
/** @param {Entree} a @param {Entree} b */
const parAdresseEtTexte = (a, b) => comparer(a.url, b.url) || comparer(a.sheet.text, b.sheet.text);

/**
 * D33 : ordre de la cascade, là où il se lit dans ce que Chromium envoie.
 * 1. Feuilles à nœud propriétaire (<link>, <style>) dans l'ordre du document ; chacune précédée de ses
 *    feuilles importées, dans l'ordre de ses règles d'import, en profondeur. Une feuille importée est rattachée à sa
 *    règle d'import par son adresse ; les copies d'une même adresse sont prises par texte. Condition (media,
 *    supports) et couche (layer) ne sont pas interprétées : l'import garde la place de sa règle.
 *    Un nœud propriétaire absent du document relu passe après les autres, par adresse puis par texte.
 * 2. Feuilles importées que rien ne rattache par leur adresse (redirection…) : ensuite, par adresse puis
 *    par texte, chacune précédée de ses propres imports ; leur adresse est rendue dans `hors`.
 * 3. Feuilles construites : à la fin, par texte.
 * @param {Entree[]} entrees @param {Map<number, number>} rangs @param {string} base  adresse de base du document
 * @returns {{ sheets: CollectedSheet[], hors: string[] }}
 */
function ordreDeCascade(entrees, rangs, base) {
  const rang = (/** @type {Entree} */ e) => /** @type {number} */ (rangs.get(/** @type {number} */ (e.ownerNode)));
  const proprietaires = entrees.filter((e) => !e.sheet.constructed && e.ownerNode !== undefined);
  const lues = proprietaires.filter((e) => rangs.has(/** @type {number} */ (e.ownerNode))).sort((a, b) => rang(a) - rang(b));
  const perdues = proprietaires.filter((e) => !rangs.has(/** @type {number} */ (e.ownerNode))).sort(parAdresseEtTexte);
  const importees = entrees.filter((e) => !e.sheet.constructed && e.ownerNode === undefined).sort(parAdresseEtTexte);
  const construites = entrees.filter((e) => e.sheet.constructed).sort((a, b) => comparer(a.sheet.text, b.sheet.text));
  const baseDe = (/** @type {Entree} */ e) => (e.sheet.inline || !e.url ? base : e.url);

  /** @type {Set<Entree>} */
  const prises = new Set();
  /** @type {CollectedSheet[]} */
  const sheets = [];
  /** @param {Entree} e */
  const ranger = (e) => {
    for (const u of importsDe(e.sheet.text, baseDe(e))) {
      const enfant = importees.find((c) => !prises.has(c) && c.url === u);
      if (!enfant) continue;
      prises.add(enfant);
      ranger(enfant);
    }
    sheets.push(e.sheet);
  };
  for (const e of [...lues, ...perdues]) ranger(e);

  // Feuilles importées restées seules : celles qu'une autre restée seule importe la suivent ;
  // les autres sont hors de l'ordre de la cascade.
  const seules = importees.filter((e) => !prises.has(e));
  /** @type {Set<Entree>} */
  const reclamees = new Set();
  for (const e of seules)
    for (const u of importsDe(e.sheet.text, baseDe(e))) {
      const enfant = seules.find((c) => c !== e && !reclamees.has(c) && c.url === u);
      if (enfant) reclamees.add(enfant);
    }
  /** @type {string[]} */
  const hors = [];
  for (const e of [...seules.filter((x) => !reclamees.has(x)), ...seules]) {
    if (prises.has(e)) continue;
    prises.add(e);
    hors.push(e.url);
    ranger(e);
  }
  for (const e of construites) sheets.push(e.sheet);
  return { sheets, hors };
}
