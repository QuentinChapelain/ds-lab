// @ts-check
/**
 * Collecte de toutes les feuilles de style d'une page chargée, par le
 * protocole DevTools (CDP) : feuilles liées, @import, <style>, feuilles
 * construites (adoptedStyleSheets) et feuilles d'un autre domaine, dont le
 * texte reste lisible ici alors que CORS le cache au script de la page.
 * Cadre principal seulement : les iframes ne sont pas parcourues.
 */

/**
 * @typedef {object} CollectedSheet
 * @property {string | null} href     URL de la feuille ; null pour <style> et feuille construite.
 * @property {boolean} inline         <style> de la page.
 * @property {boolean} constructed    Feuille construite par JS (CSSStyleSheet adoptée).
 * @property {string} text            Texte de la feuille.
 * @property {number} startLine       Ligne (base 0) du début du texte dans le document, pour un <style>.
 * @property {'cdp' | 'requête'} via  Moyen d'obtention du texte.
 */

/**
 * @param {import('playwright-core').Page} page  page déjà chargée
 * @param {{ settleMs?: number }} [opts]
 * @returns {Promise<{ sheets: CollectedSheet[], rootPx: number, warnings: string[] }>}
 */
export async function collectSheets(page, { settleMs = 150 } = {}) {
  const cdp = await page.context().newCDPSession(page);
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

    /** @type {CollectedSheet[]} */
    const sheets = [];
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
      sheets.push({ href, inline, constructed, text, startLine: inline ? h.startLine ?? 0 : 0, via });
    }
    const rootPx = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    return { sheets, rootPx, warnings };
  } finally {
    await cdp.detach().catch(() => {});
  }
}
