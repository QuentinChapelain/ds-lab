// @ts-check
/**
 * Deux lancements, la même sortie : sur une même entrée et une même machine, chaque
 * sortie rendue stable est identique à l'octet d'un lancement à l'autre, sans neutralisation.
 *   ordre des feuilles  collectSheets range les feuilles d'une page dans l'ordre de la cascade (D33),
 *                       pas dans l'ordre où Chromium les annonce ; attendu écrit à la main ;
 *   audit               audit.json, rapport.md et rapport.html de deux audits ;
 *   réduction           revue.html, table.json, migration.md et modifications.json de deux réductions
 *                       de la page de marque (ses deux captures pleine page variaient, D34) ;
 *   verify              deux captures de la page de marque par capturePage ;
 *   composants          releve.json, constat.json, constat.md, constat.html et chaque capture de deux constats des pages
 *                       d'annuaire (D46) ;
 *   lancement           aucun module de src/ ne lance Chromium hors de src/browser/lancement.js (D34).
 * Chaque paire tourne sur le même serveur : même port, donc même entrée.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir } from 'node:fs/promises';
import { readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { collectSheets } from '../src/browser/sheets.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { runAudit } from '../src/audit/run.js';
import { runReduce } from '../src/reduce/run.js';
import { capturePage } from '../src/verify/capture.js';
import { runComposants } from '../src/composants/run.js';

const D = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre.json', import.meta.url), 'utf8'));
const M = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-marque.json', import.meta.url), 'utf8'));
const NOW = new Date(2026, 10, 17, 12, 0);
const TOKENS = fileURLToPath(new URL('../tokens/orbe-cafe/marque.resolver.json', import.meta.url));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;

before(async () => {
  servers = await startFixtureServers();
});

after(async () => {
  await servers?.close();
});

/**
 * Fichiers d'un dossier de sortie, par nom.
 * @param {string} dir
 * @returns {Promise<Map<string, Buffer>>}
 */
async function filesOf(dir) {
  const names = (await readdir(dir)).sort();
  return new Map(await Promise.all(names.map(async (n) => /** @type {[string, Buffer]} */ ([n, await readFile(join(dir, n))]))));
}

/**
 * Deux dossiers de sortie identiques à l'octet, fichier par fichier.
 * @param {string} a @param {string} b
 */
async function assertSameFiles(a, b) {
  const [x, y] = [await filesOf(a), await filesOf(b)];
  assert.deepEqual([...y.keys()], [...x.keys()]);
  const different = [...x.keys()].filter((n) => !x.get(n)?.equals(/** @type {Buffer} */ (y.get(n))));
  assert.deepEqual(different, [], `fichiers différents entre deux lancements : ${different.join(', ')}`);
}

test('ordre des feuilles : la cascade de index.html (import avant la feuille qui l’importe, feuille construite à la fin)', async () => {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await gotoAndSettle(page, `${servers.origin}/`, { waitMs: 0 });
    const { sheets } = await collectSheets(page);
    const names = sheets.map((s) => (s.constructed ? 'construite' : s.inline ? 'style' : new URL(/** @type {string} */ (s.href)).pathname));
    // index.html : <link> theme.css (qui importe composants.css), <link> remote.css (autre origine), <style>, feuille adoptée.
    assert.deepEqual(names, ['/styles/composants.css', '/styles/theme.css', '/styles/remote.css', 'style', 'construite']);
  } finally {
    await browser.close();
  }
});

test('audit : deux lancements, audit.json, rapport.md et rapport.html identiques à l’octet', async () => {
  const [first, ...rest] = D.conditions.pages;
  const opts = {
    addresses: [servers.origin + first, ...rest, '/'],
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: D.conditions.viewport,
    waitMs: 100,
    now: NOW,
  };
  const [a] = await runAudit({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-audit-')) });
  const [b] = await runAudit({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-audit-')) });
  assert.equal(a.measured, 4);
  await assertSameFiles(/** @type {string} */ (a.dir), /** @type {string} */ (b.dir));
});

test('réduction : deux lancements sur la page de marque, revue.html et les trois autres fichiers identiques à l’octet', async () => {
  const opts = {
    addresses: [servers.origin + M.conditions.page],
    targetPath: `${FIXTURE_DIR}cible-marque.json`,
    tokensPath: TOKENS,
    viewport: M.conditions.viewport,
    waitMs: 100,
    now: NOW,
  };
  const [a] = await runReduce({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-reduce-')) });
  const [b] = await runReduce({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-reduce-')) });
  assert.deepEqual([...(await filesOf(a.dir)).keys()], ['migration.md', 'modifications.json', 'revue.html', 'table.json']);
  await assertSameFiles(a.dir, b.dir);
});

test('verify : deux captures de la page de marque inchangée, même image à l’octet', async () => {
  const url = servers.origin + M.conditions.page;
  const a = await capturePage({ url, viewport: M.conditions.viewport, waitMs: 100 });
  const b = await capturePage({ url, viewport: M.conditions.viewport, waitMs: 100 });
  assert.ok(a.png.equals(b.png), 'les deux captures diffèrent');
});

test('composants : deux constats des pages d’annuaire, relevé, constat et captures identiques à l’octet', async () => {
  const opts = {
    addresses: [`${servers.origin}/annuaire/liste.html`, '/annuaire/fiche.html'],
    signatures: [fileURLToPath(new URL('../config/signatures/vuetify.json', import.meta.url))],
    waitMs: 100,
    now: NOW,
  };
  const a = await runComposants({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-composants-')) });
  const b = await runComposants({ ...opts, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-determinisme-composants-')) });
  assert.deepEqual([...(await filesOf(join(a.dir, 'captures'))).keys()].length, 15);
  await assertSameFiles(join(a.dir, 'captures'), join(b.dir, 'captures'));
  for (const f of ['releve.json', 'constat.json', 'constat.md', 'constat.html']) assert.ok((await readFile(join(a.dir, f))).equals(await readFile(join(b.dir, f))), f);
});

test('lancement : aucun module de src/ ne lance Chromium hors de src/browser/lancement.js', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const lanceurs = readdirSync(src, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.js') && /\.launch\s*\(/.test(readFileSync(join(src, f), 'utf8')))
    .sort();
  assert.deepEqual(lanceurs, [join('browser', 'lancement.js')]);
});
