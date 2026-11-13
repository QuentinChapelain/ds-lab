// @ts-check
/**
 * Lot V, étape 2. Attendus écrits avant le code :
 * 1. demo --racine <dossier> : le serveur principal sert ce dossier (même remplacement de
 *    {{ORIGINE_DISTANTE}}), le serveur distant est inchangé ; sans option, comportement actuel.
 * 2. reduce --references <dossier> : pour chaque page de la table, <page>.reference.png =
 *    capture pleine page après simulation complète (celle de la revue, décisions comprises),
 *    <page>.reference.aria.yml = ariaSnapshot de la page avant simulation.
 * 3. verify accepte ces fichiers comme référence, dans la même fenêtre (1366x900).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PNG } from 'pngjs';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { parseDemoArgs } from './helpers/demo.js';
import { runReduce, parseReduceArgs } from '../src/cli/reduce.js';
import { referenceFiles, verifyPage } from '../src/verify/reference.js';
import { capturePage } from '../src/verify/capture.js';
import { compareAria, compareImages } from '../src/verify/compare.js';

const VIEWPORT = { width: 1366, height: 900 };

/** @type {string} */
let root;
/** @type {string} */
let refs;
/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof runReduce>>[number]} */
let run;

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-racine-'));
  await cp(join(FIXTURE_DIR, 'desordre'), join(root, 'desordre'), { recursive: true });
  await writeFile(join(root, 'seulement-ici.txt'), 'racine copiée\n');
  refs = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-refs-'));
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/desordre/carte.html`, '/desordre/temoin.html'],
    targetPath: `${FIXTURE_DIR}cible.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    referencesPath: refs,
    viewport: VIEWPORT,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-reduce-')),
  });
});

after(async () => servers?.close());

test('demo : --racine résolu, défaut = fixtures/marque-demo', () => {
  assert.equal(parseDemoArgs([]).root, FIXTURE_DIR);
  assert.equal(parseDemoArgs(['--racine', 'local/lot-v']).root, resolve('local/lot-v'));
});

test('serveur --racine : la copie est servie, {{ORIGINE_DISTANTE}} remplacé, distant inchangé', async () => {
  assert.equal(await (await fetch(`${servers.origin}/seulement-ici.txt`)).text(), 'racine copiée\n');
  const html = await (await fetch(`${servers.origin}/desordre/temoin.html`)).text();
  assert.ok(!html.includes('{{ORIGINE_DISTANTE}}'));
  assert.ok(html.includes(`${servers.remoteOrigin}/styles/cookies.css`));
  assert.equal((await fetch(`${servers.remoteOrigin}/styles/cookies.css`)).status, 200);
  assert.equal((await fetch(`${servers.origin}/cible.json`)).status, 404);
});

test('serveur sans option : fixtures/marque-demo, comme avant', async () => {
  const s = await startFixtureServers();
  try {
    assert.equal((await fetch(`${s.origin}/cible.json`)).status, 200);
    assert.equal((await fetch(`${s.origin}/desordre/carte.html`)).status, 200);
  } finally {
    await s.close();
  }
});

test('reduce : --references lu', () => {
  const p = parseReduceArgs(['http://x/', '--target', 't.json', '--references', 'local/lot-v/references']);
  assert.equal(p.options?.referencesPath, 'local/lot-v/references');
  assert.equal(parseReduceArgs(['http://x/', '--target', 't.json']).options?.referencesPath, undefined);
});

test('noms des fichiers de référence : <page>.reference.png et <page>.reference.aria.yml', () => {
  assert.deepEqual(referenceFiles('d', 'http://h:1/desordre/temoin.html'), { png: join('d', 'temoin.reference.png'), aria: join('d', 'temoin.reference.aria.yml') });
  assert.deepEqual(referenceFiles('d', 'http://h:1/'), { png: join('d', 'index.reference.png'), aria: join('d', 'index.reference.aria.yml') });
});

test('reduce --references : deux fichiers par page de la table, et rien d’autre', async () => {
  assert.deepEqual((await readdir(refs)).sort(), ['carte.reference.aria.yml', 'carte.reference.png', 'temoin.reference.aria.yml', 'temoin.reference.png']);
});

test('reference.png = la capture « après » de la revue, en 1366 de large', async () => {
  const revue = await readFile(join(run.dir, 'revue.html'), 'utf8');
  for (const page of ['carte', 'temoin']) {
    const png = await readFile(join(refs, `${page}.reference.png`));
    assert.equal(PNG.sync.read(png).width, VIEWPORT.width);
    assert.ok(revue.includes(png.toString('base64')), `${page} : capture absente de revue.html`);
  }
});

test('carte : la référence est simulée (différente de l’original), l’arbre est celui d’avant simulation', async () => {
  const url = `${servers.origin}/desordre/carte.html`;
  const original = await capturePage({ url, viewport: VIEWPORT, waitMs: 100 });
  const files = referenceFiles(refs, url);
  assert.ok(compareImages(await readFile(files.png), original.png).different > 0);
  assert.equal(compareAria((await readFile(files.aria, 'utf8')).replace(/\n$/, ''), original.aria).identical, true);
});

test('verify accepte la référence de reduce : même fenêtre, arbre identique sur l’original', async () => {
  const r = await verifyPage({ url: `${servers.origin}/desordre/carte.html`, referenceDir: refs, viewport: VIEWPORT, waitMs: 100 });
  assert.equal(r.aria.identical, true);
  assert.equal(r.pixels.sizeMismatch?.reference?.[0] ?? VIEWPORT.width, VIEWPORT.width);
  assert.ok(r.pixels.different > 0);
});
