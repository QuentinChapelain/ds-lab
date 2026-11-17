// @ts-check
/**
 * D33 : collectSheets range les feuilles d'une page dans l'ordre de la cascade, là où il se lit dans
 * ce que Chromium envoie. Pages d'essai de fixtures/marque-demo/cascade/, attendus écrits à la main :
 *   imbriques.html       une feuille importée passe avant celle qui l'importe, en profondeur, y compris
 *                        depuis un <style> ;
 *   conditionnels.html   un import conditionnel (media, print, supports vrai ou faux, layer) est rangé à
 *                        la place de son @import : condition et couche ne sont pas interprétées ;
 *   deja-chargees.html   une feuille liée et importée, une feuille importée trois fois : une feuille par
 *                        occurrence, chacune à sa place ;
 *   hors-cascade.html    un import introuvable (404) est annoncé vide, à sa place ; un import redirigé est
 *                        annoncé sous l'adresse finale, que rien ne rattache à son @import : il passe après
 *                        les feuilles rattachées, avec l'avertissement « feuille importée hors de l'ordre de
 *                        la cascade », que l'audit reprend (console et audit.json) sans changer son code de sortie.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { collectSheets } from '../src/browser/sheets.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { runAudit } from '../src/audit/run.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const S = '/cascade/styles/';
const HORS = 'feuille importée hors de l\'ordre de la cascade';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('playwright-core').Browser} */
let browser;

before(async () => {
  servers = await startFixtureServers();
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/**
 * Feuilles d'une page, dans l'ordre rendu par collectSheets : chemin, « style » ou « construite ».
 * @param {string} path
 */
async function sheetsOf(path) {
  const page = await browser.newPage();
  try {
    await gotoAndSettle(page, servers.origin + path, { waitMs: 0 });
    const { sheets, warnings } = await collectSheets(page);
    const names = sheets.map((s) => (s.constructed ? 'construite' : s.inline ? 'style' : new URL(/** @type {string} */ (s.href)).pathname));
    return { names, warnings };
  } finally {
    await page.close();
  }
}

test('imports imbriqués : chaque feuille importée avant celle qui l’importe, en profondeur, y compris depuis un <style>', async () => {
  const { names, warnings } = await sheetsOf('/cascade/imbriques.html');
  // racine.css importe a.css puis b.css, qui importe c.css ; le <style> importe g.css.
  assert.deepEqual(names, [`${S}a.css`, `${S}c.css`, `${S}b.css`, `${S}racine.css`, `${S}g.css`, 'style']);
  assert.deepEqual(warnings, []);
});

test('imports conditionnels : rangés à la place de leur @import, condition et couche non interprétées', async () => {
  const { names, warnings } = await sheetsOf('/cascade/conditionnels.html');
  // conditions.css importe a.css (media), d.css (print), e.css (supports vrai), f.css (supports faux), h.css (layer).
  assert.deepEqual(names, [`${S}a.css`, `${S}d.css`, `${S}e.css`, `${S}f.css`, `${S}h.css`, `${S}conditions.css`]);
  assert.deepEqual(warnings, []);
});

test('feuilles déjà chargées : une feuille par occurrence, chacune à sa place', async () => {
  const { names, warnings } = await sheetsOf('/cascade/deja-chargees.html');
  // <link> a.css ; <link> deux.css (importe a.css, d.css, d.css) ; <link> trois.css (importe d.css).
  assert.deepEqual(names, [`${S}a.css`, `${S}a.css`, `${S}d.css`, `${S}d.css`, `${S}deux.css`, `${S}d.css`, `${S}trois.css`]);
  assert.deepEqual(warnings, []);
});

test('import introuvable à sa place ; import redirigé après les feuilles rattachées, avec un avertissement', async () => {
  const { names, warnings } = await sheetsOf('/cascade/hors-cascade.html');
  // hors-cascade.css importe redirigee.css (302 vers g.css), absente.css (404), b.css en couche (importe c.css).
  assert.deepEqual(names, [`${S}absente.css`, `${S}c.css`, `${S}b.css`, `${S}hors-cascade.css`, `${S}g.css`]);
  assert.deepEqual(warnings, [`${HORS} : ${servers.origin}${S}g.css`]);
});

test('audit : l’avertissement hors de la cascade dans audit.json et à la console, code de sortie inchangé', async () => {
  const url = `${servers.origin}/cascade/hors-cascade.html`;
  const attendu = `${url} : ${HORS} : ${servers.origin}${S}g.css`;
  const [r] = await runAudit({ addresses: [url], sourcesPath: `${FIXTURE_DIR}sources.json`, waitMs: 0, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-cascade-')) });
  assert.equal(r.measured, r.total);
  const audit = JSON.parse(await readFile(join(/** @type {string} */ (r.dir), 'audit.json'), 'utf8'));
  assert.deepEqual(audit.warnings.filter((/** @type {any} */ w) => w.text.includes(HORS)), [{ text: attendu, tag: '[F]' }]);
  const out = await mkdtemp(join(tmpdir(), 'ds-lab-cascade-cli-'));
  const { code, stdout } = await new Promise((resolve) => {
    const p = spawn(process.execPath, [join(ROOT, 'src', 'cli', 'audit.js'), url, '--wait-ms', '0', '--no-states', '--out', out], { cwd: ROOT });
    let o = '';
    p.stdout.on('data', (d) => (o += d));
    p.on('close', (c) => resolve({ code: c, stdout: o }));
  });
  assert.equal(code, 0);
  assert.ok(stdout.includes(`  ! ${attendu} [F]`), stdout);
});
