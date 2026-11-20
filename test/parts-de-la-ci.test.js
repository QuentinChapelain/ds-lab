// @ts-check
/**
 * Parts de npm test dans la CI (D58), lues dans test/parts-de-la-ci.json :
 *   Y1 chaque fichier de test (test/**\/*.test.js, le motif de npm test) est dans une part, et une seule ;
 *   Y2 la liste ne nomme aucun fichier absent, et aucune part n'est vide ;
 *   Y3 la matrice du job de tests de .github/workflows/ci.yml a autant de parts que la liste, le nom du job le même
 *      total, et l'étape de tests lit la liste.
 * Sans Y1, un fichier oublié ne serait joué par aucune part, et la CI resterait verte.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const RACINE = new URL('../', import.meta.url);
const LISTE = 'test/parts-de-la-ci.json';
/** @type {{ parts: string[][] }} */
const { parts } = JSON.parse(await readFile(new URL(LISTE, RACINE), 'utf8'));
const listes = parts.flat();

test('Y1 chaque fichier de test est dans une part, et une seule', async () => {
  const fichiers = (await readdir(new URL('test/', RACINE), { recursive: true }))
    .filter((f) => f.endsWith('.test.js'))
    .map((f) => `test/${f}`)
    .sort();
  assert.deepEqual(fichiers.filter((f) => !listes.includes(f)), [], `absents de ${LISTE}`);
  assert.deepEqual(listes.filter((f, i) => listes.indexOf(f) !== i), [], `en double dans ${LISTE}`);
});

test('Y2 la liste ne nomme aucun fichier absent, et aucune part n’est vide', () => {
  assert.deepEqual(listes.filter((f) => !f.endsWith('.test.js') || !existsSync(new URL(f, RACINE))), [], 'fichiers absents');
  assert.ok(parts.length > 0);
  assert.deepEqual(parts.map((p) => p.length).filter((n) => n === 0), [], 'part vide');
});

test('Y3 la matrice de la CI a autant de parts que la liste, et l’étape de tests la lit', async () => {
  const ci = await readFile(new URL('.github/workflows/ci.yml', RACINE), 'utf8');
  const job = ci.slice(ci.indexOf('\n  tests:'), ci.indexOf('\n  atelier:'));
  assert.ok(job.length > 0, 'job tests absent');
  const matrice = job.match(/^\s+part: \[([\d, ]+)\]$/m);
  assert.ok(matrice, 'matrice des parts absente');
  assert.deepEqual(matrice[1].split(',').map(Number), parts.map((_, i) => i + 1), 'matrice');
  assert.ok(job.includes(`name: tests (\${{ matrix.part }}/${parts.length})`), 'nom du job');
  assert.ok(job.includes(LISTE), 'étape de tests sans la liste');
  assert.ok(!job.includes('--test-shard'), 'plus de --test-shard');
});
