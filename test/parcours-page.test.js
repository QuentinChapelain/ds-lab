// @ts-check
/**
 * La page du parcours dans Chromium (D72, docs/attendus/parcours.md), servie comme par parcours --servir :
 *   PG1 à 640 px de large (le panneau d'aperçu), le système en clair et en sombre : aucun défilement horizontal ; le
 *       fond de la page est background.app du mode sombre, seul mode de la page (D88) ; aucune requête hors de 127.0.0.1 ;
 *   PG2 quand le moment embarque un écran, le cadre prend la hauteur qui reste : plus de la moitié de la fenêtre
 *       (900 px de haut), sans nombre dans le style ;
 *   PG3 le lancement, l'écran des pages (D77), la dette (D79), la marque (D80) et les fondations (D83), servis par la commande, à 640 px, clair
 *       et sombre : aucun défilement horizontal, le fond sombre, aucune barre en bas (D92), chaque vignette chargée (capture ou dessin) ; les
 *       planches des fondations servies ;
 *   PG4 l'avant et après (D86) à 640 px, clair et sombre, sans script : Après montré d'abord ; un clic sur Avant le
 *       montre au même endroit, sans changer la hauteur du cadre ; un clic sur un onglet montre sa page et cache les
 *       autres ; aucune barre en bas (D92), aucun défilement horizontal, chaque image chargée ;
 *   PG5 la page en direct (D87), servie par la commande : ses feuilles ajoutées posées, chaque image chargée, aucune
 *       requête en échec ; « Mon compte » y mène en direct.
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
import { startFixtureServers } from './helpers/serveur.js';
import { ecrireSansCaptures } from './helpers/captures.js';
import { spawn } from 'node:child_process';
import { confirmerMarque } from '../src/parcours/pages.js';
import { cpSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MOMENTS = ['constat', 'marque', 'decisions', 'livraison', 'bilan', 'plusieurs'];
const FOND = { dark: 'rgb(18, 18, 18)' };

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
        assert.equal(r.fond, FOND.dark, `${m} ${scheme}`);
        if (r.cadre !== null) assert.ok(r.cadre > 450, `${m} ${scheme} : cadre de ${r.cadre} px`);
        assert.deepEqual(requetes.filter((u) => !u.startsWith(s.adresse)), [], m);
        await page.close();
      }
    } finally {
      await s.fermer();
    }
  }
});

test('PG3 le lancement, les pages, la dette, la marque et les fondations à 640 px, clair et sombre : sans barre en bas, les vignettes chargées', async () => {
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
    for (const ecran of ['lancement', 'pages', 'dette', 'marque', 'fondations']) {
      if (ecran === 'pages' || ecran === 'dette') cpSync(join(ROOT, 'fixtures', 'parcours', ecran === 'pages' ? 'pages' : 'constat'), d, { recursive: true });
      if (ecran === 'marque') {
        // La dette vue, sans entrée de marque : l'écran de la marque.
        const p = JSON.parse(readFileSync(join(d, 'projet.json'), 'utf8'));
        delete p.sites[0].brand;
        writeFileSync(join(d, 'projet.json'), JSON.stringify(p));
        writeFileSync(join(d, 'sorties', 'dette.json'), '{ "vue": true }\n');
      }
      if (ecran === 'fondations') {
        // La marque confirmée, puis la saisie que donne le parcours : l'écran des fondations.
        confirmerMarque(join(d, 'projet.json'));
        const e = calculerEtat(lireProjet(join(d, 'projet.json')), { base: ROOT });
        ecrireSansCaptures(/** @type {string} */ (e.courante.commande), join(d, 'marques', 'orbe'), ROOT);
      }
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
          planches: [...document.querySelectorAll('.planches a')].map((a) => /** @type {HTMLAnchorElement} */ (a).href),
        }));
        assert.equal(r.titre, { lancement: 'D’un site existant à un design system, sans chantier interminable.', pages: 'Les pages à mesurer', dette: 'La dette d’Annuaire des cafés', marque: 'La marque d’Annuaire des cafés', fondations: 'Les fondations d’Annuaire des cafés' }[ecran]);
        assert.ok(r.largeur <= 640, `${ecran} ${scheme} : ${r.largeur}`);
        assert.equal(r.fond, FOND.dark, `${ecran} ${scheme}`);
        // Aucune barre : le passage d'un écran au suivant se fait dans le chat (D92).
        assert.equal(r.barre, undefined, `${ecran} ${scheme}`);
        assert.deepEqual(r.vignettes, Array(/** @type {Record<string, number>} */ ({ lancement: 0, pages: 3, dette: 11, marque: 0, fondations: 0 })[ecran]).fill(true));
        assert.equal(r.planches.length, ecran === 'fondations' ? 3 : 0);
        for (const h of r.planches) assert.equal((await fetch(h)).status, 200, h);
        await page.close();
      }
    }
  } finally {
    p.kill();
    await new Promise((ok) => (p.exitCode !== null ? ok(null) : p.on('exit', ok)));
  }
});

test('PG4 l’avant et après à 640 px : la bascule et les onglets, sans script', async () => {
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-ecrans-')));
  cpSync(join(ROOT, 'fixtures', 'parcours', 'bilan'), d, { recursive: true });
  rmSync(join(d, 'sorties', 'avant-apres.json'));
  const f = join(d, 'projet.json');
  const s = await servir({ page: () => pageDuParcours(calculerEtat(lireProjet(f), { base: d })), sorties: () => lireProjet(f).sorties, marques: () => ({}) }, { port: 0 });
  try {
    for (const scheme of /** @type {const} */ (['light', 'dark'])) {
      const page = await browser.newPage({ viewport: { width: 640, height: 900 }, colorScheme: scheme, javaScriptEnabled: false });
      await page.goto(s.adresse);
      await page.waitForLoadState('load');
      /** Ce qui se voit : la vue montrée, l'image visible, la hauteur du cadre. */
      const vu = () =>
        page.evaluate(() => {
          const vue = [...document.querySelectorAll('.vue')].findIndex((v) => getComputedStyle(v).display !== 'none');
          const cadre = document.querySelectorAll('.cadre')[vue];
          const visible = [...cadre.querySelectorAll('img')].filter((i) => getComputedStyle(i).visibility === 'visible').map((i) => i.className.split(' ')[0]);
          return { vue, visible, hauteur: Math.round(cadre.getBoundingClientRect().height) };
        });
      const r = await page.evaluate(() => ({
        titre: document.querySelector('h1')?.textContent,
        largeur: document.documentElement.scrollWidth,
        barre: document.querySelector('.barre')?.getBoundingClientRect().bottom,
        images: [...document.querySelectorAll('img')].map((i) => i.complete && i.naturalWidth > 0),
      }));
      assert.deepEqual(r, { titre: 'Avant, après', largeur: 640, barre: undefined, images: Array(6).fill(true) }, scheme);
      const a = await vu();
      assert.deepEqual([a.vue, a.visible], [0, ['apres']], scheme);
      await page.click('label[for="avant-0"]');
      const b = await vu();
      assert.deepEqual([b.vue, b.visible, b.hauteur], [0, ['avant'], a.hauteur], scheme);
      await page.click('label[for="page-2"]');
      assert.deepEqual((await vu()).vue, 2, scheme);
      await page.close();
    }
  } finally {
    await s.fermer();
  }
});

test('PG5 la page en direct : feuilles posées, images chargées, liens en direct', async () => {
  const servers = await startFixtureServers();
  const d = realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-direct-')));
  cpSync(join(ROOT, 'fixtures', 'parcours', 'bilan'), d, { recursive: true });
  rmSync(join(d, 'sorties', 'avant-apres.json'));
  const f = join(d, 'projet.json');
  const projet = JSON.parse(readFileSync(f, 'utf8'));
  projet.sites[0].url = servers.origin;
  writeFileSync(f, JSON.stringify(projet));
  // Les sorties sont rangées par hôte : celui du serveur de fixtures.
  const hote = new URL(servers.origin).host.replace(':', '_');
  for (const r of ['reductions', 'verify', 'composants/orbe', 'audit/orbe']) renameSync(join(d, 'sorties', r, '127.0.0.1_4173'), join(d, 'sorties', r, hote));
  const p = spawn(process.execPath, [join(ROOT, 'src/cli/parcours.js'), f, '--servir', '--port', '0'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] });
  let sortie = '';
  p.stdout.on('data', (c) => (sortie += c));
  try {
    /** @type {string} */
    const adresse = await new Promise((ok, ko) => {
      const t = setInterval(() => {
        const m = /servie? sur (http:\/\/127\.0\.0\.1:\d+\/)/.exec(sortie);
        if (m) clearInterval(t), ok(m[1]);
      }, 50);
      p.on('exit', () => (clearInterval(t), ko(new Error(sortie))));
    });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    /** @type {string[]} */
    const echecs = [];
    page.on('response', (r) => void (r.status() >= 400 && echecs.push(`${r.status()} ${r.url()}`)));
    page.on('requestfailed', (r) => void echecs.push(`échec ${r.url()}`));
    await page.goto(`${adresse}direct/orbe?page=${encodeURIComponent('/desordre/gestion.html')}`);
    await page.waitForLoadState('networkidle');
    const r = await page.evaluate(() => ({
      feuilles: document.querySelectorAll('style[data-ds-lab-ajout]').length,
      images: [...document.images].map((i) => i.complete && i.naturalWidth > 0),
    }));
    // tokens.css, commun et ancienne : les deux feuilles de la gestion.
    assert.equal(r.feuilles, 3);
    assert.ok(r.images.length > 0 && r.images.every(Boolean), JSON.stringify(r.images));
    assert.deepEqual(echecs, []);
    await page.click('a[href*="compte.html"]');
    await page.waitForLoadState('networkidle');
    assert.ok(page.url().startsWith(`${adresse}direct/orbe?page=%2Fdesordre%2Fcompte.html`), page.url());
    assert.equal(await page.evaluate(() => document.querySelectorAll('style[data-ds-lab-ajout]').length), 3);
    await page.close();
  } finally {
    p.kill();
    await new Promise((ok) => (p.exitCode !== null ? ok(null) : p.on('exit', ok)));
    await servers.close();
  }
});
