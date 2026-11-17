// @ts-check
/**
 * Capture d'une page servie, pleine page, et son arbre d'accessibilité
 * (page.ariaSnapshot()). Animations figées pour que deux captures du même état coïncident.
 * Mêmes réglages que la capture « après » de reduce (simulatePage), pour comparer à ses références.
 * Avec `ajout` (D37, D38) : les feuilles ajoutées d'un dossier écrit par npm run ajout sont posées dans la page,
 * tokens.css avant toutes les feuilles, chaque feuille ajoutée juste après la sienne, avec le media de son lien ; la
 * fenêtre est celle du manifeste (la réduction), et chaque ligne décidée tracée sur la page est jugée, avant puis
 * après la pose (src/verify/arrivee.js).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancerChromium } from '../browser/lancement.js';
import { hideThirdParty } from '../browser/simulate.js';
import { MANIFESTE, FENETRE_PAR_DEFAUT } from '../apply/ajout.js';
import { avantPose, apresPose } from './arrivee.js';

/**
 * Manifeste d'un dossier écrit par npm run ajout, et le texte de ses feuilles.
 * @param {string} dossier
 */
async function lireAjouts(dossier) {
  let m;
  try {
    m = JSON.parse(await readFile(join(dossier, MANIFESTE), 'utf8'));
  } catch (e) {
    throw new Error(`--ajout ${dossier} : ${MANIFESTE} ${/** @type {any} */ (e).code === 'ENOENT' ? 'absent' : 'illisible'} ; le dossier écrit par npm run ajout est attendu`);
  }
  const tokens = m.tokensCss ? { chemin: String(m.tokensCss), texte: await readFile(join(dossier, m.tokensCss), 'utf8') } : null;
  const feuilles = await Promise.all(
    (m.feuilles ?? []).map(async (/** @type {any} */ f) => ({ feuille: String(f.feuille), ajout: String(f.ajout), texte: await readFile(join(dossier, f.ajout), 'utf8') })),
  );
  /** @type {{ width: number, height: number }} */
  const viewport = m.viewport ?? FENETRE_PAR_DEFAUT;
  /** @type {import('./arrivee.js').Ligne[]} */
  const lignes = m.lignes ?? [];
  return { tokens, feuilles, viewport, lignes };
}

/**
 * Pose les feuilles ajoutées d'un dossier dans une page chargée : tokens.css en tête du document, chaque feuille
 * ajoutée juste après le lien de sa feuille (même origine que la page, même chemin), avec le media du lien. Rend le
 * nombre de feuilles ajoutées posées. Une feuille importée par une règle d'import n'a pas de lien : la sienne n'est
 * pas posée. Une feuille injectée par un script l'est si elle est déjà là : posée après coup.
 * @param {import('playwright-core').Page} page @param {string | Awaited<ReturnType<typeof lireAjouts>>} dossier
 */
export async function poserAjouts(page, dossier) {
  const { tokens, feuilles } = typeof dossier === 'string' ? await lireAjouts(dossier) : dossier;
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
        const s = style(f.ajout, f.texte);
        const media = l.getAttribute('media');
        if (media) s.setAttribute('media', media);
        l.after(s);
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
 *   ajout?: string, juger?: boolean, colorScheme?: 'light' | 'dark' }} opts
 *   ajout : dossier écrit par npm run ajout (la fenêtre est alors celle de son manifeste) ; juger : avec ajout, lire la
 *   preuve par décision (oui par défaut) ; colorScheme : préférence du système (sans elle, celle de Playwright : clair)
 * @returns {Promise<{ png: Buffer, aria: string, status: number | null, finalUrl: string, viewport: { width: number, height: number },
 *   decisions?: import('./arrivee.js').Decision[] }>}  decisions : avec ajout, les lignes décidées tracées sur la page
 */
export async function capturePage({ url, viewport, waitMs = DEFAULT_WAIT_MS, storageState, thirdParty = [], ajout, juger = true, colorScheme }) {
  const ajouts = ajout ? await lireAjouts(ajout) : null;
  const fenetre = viewport ?? ajouts?.viewport ?? FENETRE_PAR_DEFAUT;
  const browser = await lancerChromium();
  try {
    const context = await browser.newContext({ viewport: fenetre, storageState: storageState ?? undefined, ...(colorScheme ? { colorScheme } : {}) });
    const page = await context.newPage();
    const nav = await gotoAndSettle(page, url, { waitMs });
    /** @type {import('./arrivee.js').Decision[] | undefined} */
    let decisions;
    if (ajouts && !juger) await poserAjouts(page, ajouts);
    else if (ajouts) {
      const chemin = new URL(url).pathname;
      const lignes = ajouts.lignes.filter((l) => l.pages.includes(chemin));
      const avant = await avantPose(page, lignes);
      await poserAjouts(page, ajouts);
      decisions = await apresPose(page, lignes, avant, ajouts.feuilles);
    }
    const aria = await page.ariaSnapshot();
    await hideThirdParty(page, thirdParty, true);
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    return { png, aria, status: nav.status, finalUrl: nav.finalUrl, viewport: fenetre, ...(decisions ? { decisions } : {}) };
  } finally {
    await browser.close();
  }
}
