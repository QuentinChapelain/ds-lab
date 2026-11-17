// @ts-check
/**
 * Capture d'une page servie, pleine page, et son arbre d'accessibilité
 * (page.ariaSnapshot()). Animations figées pour que deux captures du même état coïncident.
 * Mêmes réglages que la capture « après » de reduce (simulatePage), pour comparer à ses références.
 * Avec `ajout` (D37) : les feuilles ajoutées d'un dossier écrit par npm run ajout sont posées dans la page,
 * tokens.css avant toutes les feuilles, chaque feuille ajoutée juste après la sienne.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancerChromium } from '../browser/lancement.js';
import { hideThirdParty } from '../browser/simulate.js';
import { MANIFESTE } from '../apply/ajout.js';

/**
 * Pose les feuilles ajoutées d'un dossier dans une page chargée : tokens.css en tête du document, chaque feuille
 * ajoutée juste après le lien de sa feuille (même origine que la page, même chemin). Rend le nombre de feuilles
 * ajoutées posées. Une feuille importée par une règle d'import n'a pas de lien : la sienne n'est pas posée.
 * @param {import('playwright-core').Page} page @param {string} dossier
 */
export async function poserAjouts(page, dossier) {
  let m;
  try {
    m = JSON.parse(await readFile(join(dossier, MANIFESTE), 'utf8'));
  } catch (e) {
    throw new Error(`--ajout ${dossier} : ${MANIFESTE} ${/** @type {any} */ (e).code === 'ENOENT' ? 'absent' : 'illisible'} ; le dossier écrit par npm run ajout est attendu`);
  }
  const tokens = m.tokensCss ? { chemin: m.tokensCss, texte: await readFile(join(dossier, m.tokensCss), 'utf8') } : null;
  const feuilles = await Promise.all(
    (m.feuilles ?? []).map(async (/** @type {any} */ f) => ({ feuille: String(f.feuille), ajout: String(f.ajout), texte: await readFile(join(dossier, f.ajout), 'utf8') })),
  );
  return page.evaluate(
    ({ tokens, feuilles }) => {
      /** @param {string} nom @param {string} texte */
      const style = (nom, texte) => {
        const s = document.createElement('style');
        s.setAttribute('data-ds-lab-ajout', nom);
        s.textContent = texte;
        return s;
      };
      if (tokens) document.head.prepend(style(tokens.chemin, tokens.texte));
      let posees = 0;
      for (const l of document.querySelectorAll('link[rel~="stylesheet"][href]')) {
        const u = new URL(/** @type {HTMLLinkElement} */ (l).href, location.href);
        const f = u.origin === location.origin ? feuilles.find((x) => x.feuille === u.pathname) : undefined;
        if (!f) continue;
        l.after(style(f.ajout, f.texte));
        posees++;
      }
      return posees;
    },
    { tokens, feuilles },
  );
}

/**
 * J5 : `thirdParty` (sélecteurs de sources.json) masqués dans la capture, comme dans
 * les références de reduce --sources ; l'arbre d'accessibilité est lu avant le masque.
 * @param {{ url: string, viewport?: { width: number, height: number }, waitMs?: number, storageState?: string, thirdParty?: string[],
 *   ajout?: string, colorScheme?: 'light' | 'dark' }} opts
 *   ajout : dossier écrit par npm run ajout ; colorScheme : préférence du système (sans elle, celle de Playwright : clair)
 * @returns {Promise<{ png: Buffer, aria: string, status: number | null, finalUrl: string }>}
 */
export async function capturePage({ url, viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, storageState, thirdParty = [], ajout, colorScheme }) {
  const browser = await lancerChromium();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined, ...(colorScheme ? { colorScheme } : {}) });
    const page = await context.newPage();
    const nav = await gotoAndSettle(page, url, { waitMs });
    if (ajout) await poserAjouts(page, ajout);
    const aria = await page.ariaSnapshot();
    await hideThirdParty(page, thirdParty, true);
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    return { png, aria, status: nav.status, finalUrl: nav.finalUrl };
  } finally {
    await browser.close();
  }
}
