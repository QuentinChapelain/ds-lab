// @ts-check
/**
 * Transitions et animations coupées le temps d'un relevé : une valeur lue juste après un changement (état forcé,
 * feuille posée) serait sinon celle du départ de la transition, l'ancienne. Feuille construite, adoptée par le
 * document : elle n'est pas soumise à une CSP qui interdirait un <style> en ligne, et n'est pas un nœud de la page.
 * Retirée, elle ne relance aucune transition : les valeurs ont déjà changé.
 */

/** @param {import('playwright-core').Page} page */
export async function immobiliser(page) {
  await page.evaluate(() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync('*, *::before, *::after { transition: none !important; animation: none !important; }');
    /** @type {any} */ (window).__dsImmobile = sheet;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  });
}

/** @param {import('playwright-core').Page} page */
export async function liberer(page) {
  await page
    .evaluate(() => {
      const sheet = /** @type {any} */ (window).__dsImmobile;
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== sheet);
      delete (/** @type {any} */ (window).__dsImmobile);
    })
    .catch(() => {});
}
