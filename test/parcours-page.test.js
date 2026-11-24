// @ts-check
/**
 * La page du parcours dans Chromium (D72, docs/attendus/parcours.md), servie comme par parcours --servir :
 *   PG1 à 640 px de large (le panneau d'aperçu), clair et sombre : aucun défilement horizontal ; le fond de la page est
 *       background.app du mode ; aucune requête hors de 127.0.0.1 ;
 *   PG2 quand le moment embarque un écran, le cadre prend la hauteur qui reste : plus de la moitié de la fenêtre
 *       (900 px de haut), sans nombre dans le style.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireProjet } from '../src/parcours/projet.js';
import { calculerEtat } from '../src/parcours/etat.js';
import { pageDuParcours } from '../src/parcours/page.js';
import { servir } from '../src/parcours/serveur.js';
import { lancerChromium } from '../src/browser/lancement.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MOMENTS = ['lancement', 'constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs'];
const FOND = { light: 'rgb(251, 251, 251)', dark: 'rgb(18, 18, 18)' };

/** @type {import('playwright-core').Browser} */
let browser;
before(async () => {
  browser = await lancerChromium();
});
after(async () => browser?.close());

test('PG1 et PG2 chaque moment à 640 px, clair et sombre : aucun défilement, le cadre prend la hauteur qui reste', async () => {
  for (const m of MOMENTS) {
    const f = join(ROOT, 'fixtures', 'parcours', m, 'projet.json');
    const s = await servir(
      {
        page: () => pageDuParcours(calculerEtat(lireProjet(f), { base: ROOT })),
        sorties: () => lireProjet(f).sorties,
        marques: () => Object.fromEntries(lireProjet(f).sites.map((x) => [x.id, /** @type {string} */ (x.dossierMarque)])),
      },
      { port: 0 },
    );
    try {
      for (const scheme of /** @type {const} */ (['light', 'dark'])) {
        const page = await browser.newPage({ viewport: { width: 640, height: 900 }, colorScheme: scheme });
        /** @type {string[]} */
        const requetes = [];
        page.on('request', (r) => requetes.push(r.url()));
        await page.goto(s.adresse);
        await page.waitForLoadState('load');
        const r = await page.evaluate(() => {
          const cadre = document.querySelector('iframe');
          return {
            largeur: document.documentElement.scrollWidth,
            fond: getComputedStyle(document.body).backgroundColor,
            cadre: cadre ? cadre.getBoundingClientRect().height : null,
          };
        });
        assert.ok(r.largeur <= 640, `${m} ${scheme} : ${r.largeur}`);
        assert.equal(r.fond, FOND[scheme], `${m} ${scheme}`);
        if (r.cadre !== null) assert.ok(r.cadre > 450, `${m} ${scheme} : cadre de ${r.cadre} px`);
        assert.deepEqual(requetes.filter((u) => !u.startsWith(s.adresse)), [], m);
        await page.close();
      }
    } finally {
      await s.fermer();
    }
  }
});
