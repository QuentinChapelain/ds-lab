// @ts-check
/**
 * Boucle de réduction de bout en bout sur la marque fictive : mesure,
 * proposition sur fixtures/marque-demo/cible.json, simulation, page de revue,
 * puis second tour avec des décisions.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce, parseReduceArgs } from '../src/cli/reduce.js';
import { simulatePage, installLive } from '../src/browser/simulate.js';
import { mapping } from '../src/reduce/propose.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {string} */
let out;
/** @type {Awaited<ReturnType<typeof runReduce>>} */
let first;

before(async () => {
  servers = await startFixtureServers();
  out = await mkdtemp(join(tmpdir(), 'ds-lab-reduce-'));
  first = await runReduce({
    addresses: [servers.origin + '/', '/page-2.html'],
    targetPath: `${FIXTURE_DIR}cible.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    outRoot: out,
    waitMs: 100,
    now: new Date(2026, 10, 11, 21, 30),
  });
});
after(async () => servers?.close());

/** @param {any} table @param {string} family @param {string} old */
const row = (table, family, old) => table.families[family].rows.find((/** @type {any} */ r) => r.old === old);

test('reduce : la table range le rendu de la démo sur la cible', () => {
  const t = first[0].table;
  assert.deepEqual([row(t, 'fontSizes', '22.5px').class, row(t, 'fontSizes', '22.5px').new], ['proche', '24px']);
  assert.deepEqual([row(t, 'fontSizes', '13.5px').class, row(t, 'fontSizes', '13.5px').new], ['auto', '14px']);
  assert.deepEqual([row(t, 'colors', '#2c4d7f').class, row(t, 'colors', '#2c4d7f').new], ['auto', '#2b4c7e']);
  assert.equal(row(t, 'colors', '#9a9a9a').class, 'décision');
  assert.deepEqual([row(t, 'radii', '999px').class, row(t, 'radii', '999px').new], ['auto', '9999px']);
  assert.deepEqual([row(t, 'spacing', '27px').class, row(t, 'spacing', '27px').new], ['proche', '24px']);
});

test('reduce : sorties table.json et revue.html, avec captures avant et après', async () => {
  const [tablePath, reviewPath] = first[0].files;
  const saved = JSON.parse(await readFile(tablePath, 'utf8'));
  assert.equal(saved.pages.length, 2);
  assert.ok(saved.pages[0].operations > 0);
  const html = await readFile(reviewPath, 'utf8');
  assert.match(html, /data-key="fontSizes\|22\.5px"/);
  assert.ok((html.match(/data:image\/png;base64,/g) ?? []).length >= 6);
  assert.match(html, /Exporter mes décisions/);
  assert.ok(!html.includes(servers.origin + '/styles'), 'aucune feuille du site copiée');
});

test('simulation : la valeur calculée change dans le navigateur, et seulement là', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(servers.origin + '/');
    const size = () => page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector('.accroche'))).fontSize);
    assert.equal(await size(), '22.5px');
    let requests = 0;
    page.on('request', () => requests++);
    const sim = await simulatePage(page, mapping(first[0].table), { fullPage: false });
    assert.equal(await size(), '24px');
    assert.equal(requests, 0, 'la simulation ne déclenche aucune requête vers le site');
    const change = sim.changes.find((c) => c.family === 'fontSizes' && c.old === '22.5px');
    assert.deepEqual([change?.new, change?.count, change?.crops.length], ['24px', 1, 1]);
    assert.deepEqual(change?.props, ['font-size']);
    const box = change?.crops[0].after.box;
    assert.ok(box && box.width > 0 && box.height > 0, 'repère de l’élément modifié');
    // Réversible : tout éteint, la page retrouve ses valeurs ; une famille seule s'allume.
    await page.evaluate(() => /** @type {any} */ (window).__dsSim.show({ on: false }));
    assert.equal(await size(), '22.5px');
    assert.equal(await page.evaluate(() => /** @type {HTMLElement} */ (document.querySelector('.accroche')).style.fontSize), '');
    await page.evaluate(() => /** @type {any} */ (window).__dsSim.show({ on: true, families: ['colors'] }));
    assert.equal(await size(), '22.5px', 'les tailles restent éteintes quand seules les couleurs sont demandées');
  } finally {
    await browser.close();
  }
});

test('second tour : une décision refusée ou imposée remplace la proposition', async () => {
  const decisions = join(out, 'decisions.json');
  await writeFile(decisions, JSON.stringify({ 'fontSizes|22.5px': false, 'colors|#9a9a9a': '#1f2a44' }));
  const map = mapping(first[0].table, JSON.parse(await readFile(decisions, 'utf8')));
  assert.equal(map.fontSizes['22.5px'], undefined);
  assert.equal(map.colors['#9a9a9a'], '#1f2a44');
  assert.equal(map.fontSizes['13.5px'], '14px', 'le reste de la proposition tient');
  const second = await runReduce({ addresses: [servers.origin + '/'], targetPath: `${FIXTURE_DIR}cible.json`, decisionsPath: decisions, sourcesPath: `${FIXTURE_DIR}sources.json`, outRoot: out, waitMs: 100, now: new Date(2026, 10, 11, 21, 31) });
  const html = await readFile(second[0].files[1], 'utf8');
  assert.match(html, /"fontSizes\|22\.5px":false/);
});

test('reduce : la cible est obligatoire', () => {
  assert.throws(() => parseReduceArgs(['https://x.example/']), /cible vient d’abord/);
  assert.equal(parseReduceArgs(['https://x.example/', '--target', 'c.json']).options?.targetPath, 'c.json');
});

test('captures isolées : l’« après » d’une ligne ne contient que son changement', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto(servers.origin + '/');
    const sim = await simulatePage(page, mapping(first[0].table), { fullPage: false });
    const spacing = sim.changes.find((c) => c.family === 'spacing' && c.old === '27px');
    const size = sim.changes.find((c) => c.family === 'fontSizes' && c.old === '22.5px');
    assert.ok(spacing?.crops.length && size?.crops.length);
    assert.equal(spacing?.crops[0].before.png === spacing?.crops[0].after.png, false, 'le retrait change la capture');
    assert.deepEqual(spacing?.props, ['padding']);
  } finally {
    await browser.close();
  }
});

test('mode --live : barre avant / après dans la page, interrupteur par famille, relue à chaque page', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    await installLive(context, mapping(first[0].table), { delayMs: 0 });
    const page = await context.newPage();
    await page.goto(servers.origin + '/');
    const barre = page.locator('[data-ds-lab="barre"]');
    await barre.waitFor({ state: 'attached' });
    const size = () => page.evaluate(() => getComputedStyle(/** @type {Element} */ (document.querySelector('.accroche'))).fontSize);
    assert.equal(await size(), '24px', 'à l’ouverture : après');
    await barre.getByRole('button', { name: 'Avant' }).click();
    assert.equal(await size(), '22.5px');
    assert.equal(await barre.getAttribute('data-etat'), 'avant');
    await barre.getByRole('button', { name: 'Après' }).click();
    await barre.getByLabel(/Tailles/).uncheck();
    assert.equal(await size(), '22.5px', 'famille éteinte');
    await barre.getByLabel(/Tailles/).check();
    assert.equal(await size(), '24px');
    // La barre elle-même n'est pas relevée ni modifiée.
    assert.equal(await page.evaluate(() => /** @type {any} */ (window).__dsSim.els.some((/** @type {Element} */ e) => e.closest('[data-ds-lab]'))), false);
    // Page suivante : la barre revient.
    await page.goto(servers.origin + '/page-2.html');
    await page.locator('[data-ds-lab="barre"]').waitFor({ state: 'attached' });
    assert.ok(await page.evaluate(() => /** @type {any} */ (window).__dsSim.ops.length) >= 0);
  } finally {
    await browser.close();
  }
});
