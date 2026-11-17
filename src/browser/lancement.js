// @ts-check
/**
 * D34 : le seul lancement de Chromium des commandes. L'option --disable-partial-raster fait redessiner
 * chaque tuile en entier : sans elle, deux captures de la même page, au même code, différaient de
 * quelques pixels au bord des coins arrondis, selon le moment des invalidations précédentes.
 */

/**
 * @param {import('playwright-core').LaunchOptions} [options]
 * @returns {Promise<import('playwright-core').Browser>}
 */
export async function lancerChromium(options = {}) {
  const { chromium } = await import('playwright-core');
  return chromium.launch({ ...options, args: [...(options.args ?? []), '--disable-partial-raster'] });
}
