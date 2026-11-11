// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveAddresses, groupByHost, hostDirName } from '../src/lib/addresses.js';

test('resolveAddresses : URL complètes et chemins relatifs à la première', () => {
  assert.deepEqual(
    resolveAddresses(['https://a.test/fr/', '/fr/agenda', 'actualites', 'https://b.test/x#ancre', '/fr/agenda', '?p=2']),
    ['https://a.test/fr/', 'https://a.test/fr/agenda', 'https://a.test/fr/actualites', 'https://b.test/x', 'https://a.test/fr/?p=2'],
  );
});

test('resolveAddresses : erreurs', () => {
  assert.throws(() => resolveAddresses([]), /au moins une adresse/);
  assert.throws(() => resolveAddresses(['/fr/agenda']), /première adresse doit être une URL complète/);
  assert.throws(() => resolveAddresses(['a.test/fr']), /première adresse/);
  assert.throws(() => resolveAddresses(['ftp://a.test/']), /première adresse/);
  assert.throws(() => resolveAddresses(['https://a.test/', 'mailto:x@a.test']), /protocole/);
});

test('groupByHost et hostDirName', () => {
  const g = groupByHost(['http://127.0.0.1:4173/', 'http://localhost:4174/a', 'http://127.0.0.1:4173/b']);
  assert.deepEqual([...g.keys()], ['127.0.0.1:4173', 'localhost:4174']);
  assert.deepEqual(g.get('127.0.0.1:4173'), ['http://127.0.0.1:4173/', 'http://127.0.0.1:4173/b']);
  assert.equal(hostDirName('127.0.0.1:4173'), '127.0.0.1_4173');
  assert.equal(hostDirName('WWW.Marque-Demo.test'), 'www.marque-demo.test');
});
