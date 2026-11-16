// @ts-check
/**
 * Revue de code du 15/11, lot 4 (docs/attendus/revue-lot-4-copies.md, point 4 ; réponse de Quentin du 16/11/2026) : une
 * seule commande de planche, `node src/cli/planche.js <roles|espacements|typo>`, les trois sans argument, par la garde
 * commune (D18). Les octets écrits sont ceux des fonctions de planche, vérifiés par les tests *-planche.test.js.
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   src/cli/planche-espaces.js et src/cli/planche-typo.js n'existent plus ;
 *   une planche inconnue sort en 2, en une ligne « planche : planche inconnue : <nom> (roles, espacements, typo) », sans rien
 *     écrire ; une option inconnue sort en 2 (« planche : option inconnue --x »).
 * Tant que les deux anciennes commandes existent, la commande n'est pas lancée : elle écrirait la planche des rôles dans
 * tokens/ pendant que d'autres tests la lisent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const anciennes = ['src/cli/planche-espaces.js', 'src/cli/planche-typo.js'].filter((f) => existsSync(new URL(`../${f}`, import.meta.url)));
/** @param {string[]} args */
const lancer = (args) => spawnSync(process.execPath, ['src/cli/planche.js', ...args], { cwd: ROOT, encoding: 'utf8' });

test('P1 une seule commande de planche', () => {
  assert.deepEqual(anciennes, []);
});

test('P2 planche inconnue : sortie 2, une ligne', () => {
  assert.deepEqual(anciennes, [], 'commande non fusionnée : non lancée');
  const r = lancer(['inconnue']);
  assert.equal(r.status, 2);
  assert.equal(r.stderr, 'planche : planche inconnue : inconnue (roles, espacements, typo)\n');
  assert.equal(r.stdout, '');
});

test('P3 option inconnue : sortie 2', () => {
  assert.deepEqual(anciennes, [], 'commande non fusionnée : non lancée');
  const r = lancer(['--x']);
  assert.equal(r.status, 2);
  assert.equal(r.stderr, 'planche : option inconnue --x\n');
});
