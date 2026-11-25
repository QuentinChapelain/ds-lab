// @ts-check
/**
 * Capture d'une page servie, pleine page, et son arbre d'accessibilité
 * (page.ariaSnapshot()). Animations figées pour que deux captures du même état coïncident.
 * Mêmes réglages que la capture « après » de reduce (simulatePage), pour comparer à ses références.
 * Avec `ajout` (D37, D38, D39) : les feuilles ajoutées d'un dossier écrit par npm run ajout sont posées dans la page,
 * tokens.css avant toutes les feuilles, chaque feuille ajoutée juste après la sienne, avec le media de son lien ; la
 * fenêtre est celle du manifeste (la réduction) ; avant puis après la pose, dans le même chargement, chaque opération
 * de la simulation de la réduction est relevée, avec la hauteur de la page (src/verify/arrivee.js), transitions et
 * animations coupées le temps du relevé ; tokens.css et les feuilles ajoutées y sont reconnus comme posés par verify.
 * Avec `ajout`, la page intacte est aussi capturée avant la pose, dans le même chargement (l'avant de D86).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancerChromium } from '../browser/lancement.js';
import { hideThirdParty } from '../browser/simulate.js';
import { MANIFESTE, FENETRE_PAR_DEFAUT } from '../apply/ajout.js';
import { releverAvant, releverApres } from './arrivee.js';

/**
 * Manifeste d'un dossier écrit par npm run ajout, et le texte de ses feuilles.
 * @param {string} dossier
 */
export async function lireAjouts(dossier) {
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
  /** @type {import('./arrivee.js').Manifeste} */
  const manifeste = { simulation: m.simulation ?? null, lignes: m.lignes ?? [], hors: m.hors ?? [], declarations: m.declarations ?? [] };
  return { dossier, tokens, feuilles, viewport, manifeste };
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
 *   ajout : dossier écrit par npm run ajout (la fenêtre est alors celle de son manifeste) ; juger : avec ajout, relever
 *   les opérations de la simulation avant et après la pose (oui par défaut) ; colorScheme : préférence du système (sans
 *   elle, celle de Playwright : clair)
 * @returns {Promise<{ png: Buffer, aria: string, status: number | null, finalUrl: string, viewport: { width: number, height: number },
 *   releve?: import('./arrivee.js').Releve, avant?: Buffer }>}  releve : avec ajout, les opérations de la page et ses hauteurs ; avant :
 *   avec ajout, la capture de la page intacte, prise avant la pose dans le même chargement
 */
export async function capturePage({ url, viewport, waitMs = DEFAULT_WAIT_MS, storageState, thirdParty = [], ajout, juger = true, colorScheme }) {
  const ajouts = ajout ? await lireAjouts(ajout) : null;
  if (ajouts && juger && !ajouts.manifeste.simulation)
    throw new Error(`--ajout ${ajout} : ${MANIFESTE} sans simulation (tiré d'un modifications.json qui ne la porte pas) ; relancer npm run reduce, puis npm run ajout`);
  const fenetre = viewport ?? ajouts?.viewport ?? FENETRE_PAR_DEFAUT;
  const browser = await lancerChromium();
  try {
    const context = await browser.newContext({ viewport: fenetre, storageState: storageState ?? undefined, ...(colorScheme ? { colorScheme } : {}) });
    const page = await context.newPage();
    const nav = await gotoAndSettle(page, url, { waitMs });
    /** @type {import('./arrivee.js').Releve | undefined} */
    let releve;
    /** @type {Buffer | undefined} */
    let avant;
    // L'avant (D86) : la page intacte, dans le même chargement, éléments tiers masqués comme l'après.
    if (ajouts) {
      await hideThirdParty(page, thirdParty, true);
      avant = await page.screenshot({ fullPage: true, animations: 'disabled' });
      await hideThirdParty(page, thirdParty, false);
    }
    if (ajouts && !juger) await poserAjouts(page, ajouts);
    else if (ajouts) {
      // HTML brut de la page : un bloc <style> absent est inséré par un script.
      const html = await context.request
        .get(nav.finalUrl || url)
        .then((r) => (r.ok() ? r.text() : null))
        .catch(() => null);
      const avant = await releverAvant(page, ajouts.manifeste);
      await poserAjouts(page, ajouts);
      /** @type {import('./arrivee.js').Pose[]} */
      const poses = ajouts.feuilles.map((f) => ({ nom: f.ajout, texte: f.texte, sorte: 'ajout' }));
      if (ajouts.tokens) poses.push({ nom: ajouts.tokens.chemin, texte: ajouts.tokens.texte, sorte: 'jetons' });
      releve = await releverApres(page, ajouts.manifeste, avant, poses, html);
    }
    const aria = await page.ariaSnapshot();
    await hideThirdParty(page, thirdParty, true);
    const png = await page.screenshot({ fullPage: true, animations: 'disabled' });
    return { png, aria, status: nav.status, finalUrl: nav.finalUrl, viewport: fenetre, ...(releve ? { releve } : {}), ...(avant ? { avant } : {}) };
  } finally {
    await browser.close();
  }
}
