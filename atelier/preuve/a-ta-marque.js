// Preuve des composants à la marque (D101) : pour chaque marque de tokens/, les six stories de « Parcours/À ta
// marque » se capturent dans la version construite avec le thème clair de la marque posé avant le chargement
// (captures.js), et le bouton principal y prend le plein de la marque, pas celui du thème de la barre.
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { dossiersDeMarque } from '../../src/tokens/resolver.js';
import { COMPOSANTS } from '../../src/parcours/diapason.js';
import { capturer, storyDe, themeClair } from '../captures.js';
import { css } from './commun.js';

/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/** @param {{ navigateur: import('playwright-core').Browser, construite: { base: string }, verifier: (ok: boolean, ligne: string) => void }} p */
export async function preuveATaMarque({ navigateur, construite, verifier }) {
  for (const dossier of dossiersDeMarque()) {
    const nom = basename(dossier);
    const sortie = mkdtempSync(join(tmpdir(), 'ds-lab-a-ta-marque-'));
    try {
      let ecrits = /** @type {string[]} */ ([]);
      let panne = '';
      try {
        ecrits = await capturer({ dossier, sortie, base: construite.base, navigateur });
      } catch (e) {
        panne = /** @type {Error} */ (e).message;
      }
      const fichiers = readdirSync(join(sortie, 'composants'), { withFileTypes: true }).length;
      verifier(!panne && ecrits.length === COMPOSANTS.length && fichiers === COMPOSANTS.length, `${nom}, à ta marque : ${panne || `${fichiers} captures sur ${COMPOSANTS.length}`}`);
      // Le bouton principal, rendu dans le thème posé : le plein de la marque.
      const theme = themeClair(dossier);
      const contexte = await navigateur.newContext({ viewport: { width: 1100, height: 700 } });
      await contexte.addInitScript((t) => {
        /** @type {any} */ (globalThis).dsLabTheme = t;
      }, theme);
      const page = await contexte.newPage();
      await page.goto(`${construite.base}/iframe.html?id=${storyDe('button')}&viewMode=story`, { waitUntil: 'networkidle' });
      const fond = await page.locator('[data-a-ta-marque] button').first().evaluate((b) => getComputedStyle(b).backgroundColor);
      const attendu = css(rgb(theme.colors.primary));
      verifier(fond === attendu, `${nom}, à ta marque : bouton principal ${fond}, attendu ${attendu}`);
      await contexte.close();
    } finally {
      rmSync(sortie, { recursive: true, force: true });
    }
  }
  return null;
}
