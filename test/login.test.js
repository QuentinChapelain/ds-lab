// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLoginArgs, saveState, readState } from '../src/cli/login.js';

test('login : adresse, nom de session et chemin dans .auth/', () => {
  assert.deepEqual(parseLoginArgs(['https://demo.example.com/fr/', '--name', 'demo']), { help: false, url: 'https://demo.example.com/fr/', file: join('.auth', 'demo.json') });
  assert.equal(parseLoginArgs(['https://demo.example.com/']).file, join('.auth', 'session.json'));
  assert.throws(() => parseLoginArgs([]), /adresse/);
  assert.throws(() => parseLoginArgs(['pas une adresse']), /invalide/);
  assert.throws(() => parseLoginArgs(['https://x.example/', '--name', '../ailleurs']), /--name/);
});

test('login : le fichier de session est écrit en droits 600', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-'));
  const file = join(dir, 's.json');
  await saveState(file, { cookies: [] });
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), { cookies: [] });
});

test('login : la lecture de la session n’ouvre aucune page et ne recharge rien', async () => {
  const { chromium } = await import('playwright-core');
  const { startFixtureServers } = await import('./helpers/serveur.js');
  const servers = await startFixtureServers();
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${servers.origin}/cadres.html`);
    await context.addCookies([{ name: 'session', value: 'abc', url: servers.origin }]);
    await page.evaluate(() => localStorage.setItem('cle', 'valeur'));
    let navigations = 0;
    page.on('framenavigated', () => navigations++);
    const state = await readState(context, page);
    await readState(context, page);
    assert.equal(context.pages().length, 1);
    assert.equal(navigations, 0);
    assert.equal(state.cookies.find((c) => c.name === 'session')?.value, 'abc');
    assert.deepEqual(state.origins, [{ origin: servers.origin, localStorage: [{ name: 'cle', value: 'valeur' }] }]);
    // Le fichier produit est accepté tel quel comme storageState.
    const again = await browser.newContext({ storageState: /** @type {any} */ (state) });
    assert.equal((await again.cookies()).length, 1);
  } finally {
    await browser.close();
    await servers.close();
  }
});
