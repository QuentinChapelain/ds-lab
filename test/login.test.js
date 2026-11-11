// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, stat, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseLoginArgs, saveState } from '../src/cli/login.js';

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
