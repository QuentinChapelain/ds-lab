// @ts-check
/**
 * La page du parcours dans Chromium (D72, docs/attendus/parcours.md), servie comme par parcours --servir :
 *   PG1 à 640 px de large (le panneau d'aperçu), clair et sombre : aucun défilement horizontal ; le fond de la page est
 *       background.app du mode ; aucune requête hors de 127.0.0.1 ;
 *   PG2 quand le moment embarque un écran, le cadre prend la hauteur qui reste : plus de la moitié de la fenêtre
 *       (900 px de haut), sans nombre dans le style ;
 *   PG3 le lancement, l'écran des pages (D77) et la dette (D78), servis par la commande, à 640 px, clair et sombre : aucun défilement
 *       horizontal, le fond du mode, la barre au bas de la fenêtre, chaque vignette chargée (capture ou dessin).
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
import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MOMENTS = ['constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs'];
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

test('PG3 le lancement, les pages et la dette à 640 px, clair et sombre : la barre au bas de la fenêtre, les vignettes chargées', async () => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-ecrans-')));
  const p = spawn(process.execPath, [join(ROOT, 'src/cli/parcours.js'), join(d, 'projet.json'), '--servir', '--port', '0'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] });
  let sortie = '';
  p.stdout.on('data', (c) => (sortie += c));
  try {
    /** @type {string} */
    const adresse = await new Promise((ok, ko) => {
      const t = setInterval(() => {
        const m = /servi sur (http:\/\/127\.0\.0\.1:\d+\/)/.exec(sortie);
        if (m) clearInterval(t), ok(m[1]);
      }, 50);
      p.on('exit', () => (clearInterval(t), ko(new Error(sortie))));
    });
    for (const ecran of ['lancement', 'pages', 'dette']) {
      if (ecran !== 'lancement') cpSync(join(ROOT, 'fixtures', 'parcours', ecran === 'pages' ? 'pages' : 'constat'), d, { recursive: true });
      for (const scheme of /** @type {const} */ (['light', 'dark'])) {
        const page = await browser.newPage({ viewport: { width: 640, height: 900 }, colorScheme: scheme });
        await page.goto(adresse);
        await page.waitForLoadState('load');
        const r = await page.evaluate(() => ({
          titre: document.querySelector('h1')?.textContent,
          largeur: document.documentElement.scrollWidth,
          fond: getComputedStyle(document.body).backgroundColor,
          barre: document.querySelector('.barre')?.getBoundingClientRect().bottom,
          vignettes: [...document.querySelectorAll('img')].map((i) => i.complete && i.naturalWidth > 0),
        }));
        assert.equal(r.titre, { lancement: 'Le parcours', pages: 'Les pages à mesurer', dette: 'La dette de Annuaire des cafés' }[ecran]);
        assert.ok(r.largeur <= 640, `${ecran} ${scheme} : ${r.largeur}`);
        assert.equal(r.fond, FOND[scheme], `${ecran} ${scheme}`);
        assert.equal(r.barre, 900, `${ecran} ${scheme}`);
        assert.deepEqual(r.vignettes, Array(/** @type {Record<string, number>} */ ({ lancement: 0, pages: 3, dette: 11 })[ecran]).fill(true));
        await page.close();
      }
    }
  } finally {
    p.kill();
    await new Promise((ok) => (p.exitCode !== null ? ok(null) : p.on('exit', ok)));
  }
});
