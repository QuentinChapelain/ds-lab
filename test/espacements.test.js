// @ts-check
/**
 * Séance 3c, lot 2 : contrôle des espacements par relation (src/tokens/espacements.js, npm run espacements).
 *
 * Attendu écrit à la main avant le code, d'après la séance 3c du 15/11/2026 :
 *   les quatre ecart, dans l'ordre dans-composant, entre-composants, entre-groupes, section, sont
 *   strictement croissants ; un voisin égal ou plus petit est un échec, code de sortie 1 ;
 *   le rapport entre voisins (b / a) est affiché, jamais contrôlé ;
 *   marge-interieure.composant est affichée, hors contrôle ;
 *   Orbe Café : 4, 16, 24, 48 px ; rapports 4 ; 1,5 ; 2 ; aucun échec, code de sortie 0 ;
 *   rouge (deux rôles égaux) : entre-groupes → {espace.16} ; 4, 16, 16, 48 ; un échec,
 *     entre-composants / entre-groupes, rapport 1 ;
 *   rouge (ordre inversé) : entre-composants → {espace.24}, entre-groupes → {espace.16} ;
 *     4, 24, 16, 48 ; un échec, entre-composants / entre-groupes, rapport 0,67 (16 / 24 arrondi
 *     au centième) ; les deux autres voisins conformes (rapports 6 et 3).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { espacements } from '../src/tokens/espacements.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const prims = load('primitives.tokens.json');

/** Lance la commande sur une couche sémantique donnée (fichier temporaire hors dépôt). @param {any} [sem] */
function run(sem) {
  const args = [join(ROOT, 'src', 'cli', 'espacements.js')];
  if (sem) {
    const f = join(mkdtempSync(join(tmpdir(), 'ds-lab-3c-')), 'semantique.tokens.json');
    writeFileSync(f, JSON.stringify(sem));
    args.push('--semantique', f);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}
/** @param {(s: any) => void} edit */
const variant = (edit) => {
  const s = load('semantique.tokens.json');
  edit(s);
  return s;
};
/** @param {ReturnType<typeof espacements>} r */
const values = (r) => r.ecarts.map((e) => e.px);

test('3c vert : Orbe Café, 4 < 16 < 24 < 48, rapports affichés, code 0', () => {
  const r = espacements(load('semantique.tokens.json'), prims);
  assert.deepEqual(values(r), [4, 16, 24, 48]);
  assert.deepEqual(r.ecarts.map((e) => e.role), ['ecart.dans-composant', 'ecart.entre-composants', 'ecart.entre-groupes', 'ecart.section']);
  assert.deepEqual(r.voisins.map((v) => v.rapport), [4, 1.5, 2]);
  assert.deepEqual(r.fails, []);
  assert.deepEqual(r.horsControle.map((e) => [e.role, e.px]), [['marge-interieure.composant', 16]]);
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.match(p.stdout, /✓ ecart\.dans-composant < ecart\.entre-composants : 4 → 16 px, rapport 4\n/);
  assert.match(p.stdout, /✓ ecart\.entre-composants < ecart\.entre-groupes : 16 → 24 px, rapport 1,5\n/);
  assert.match(p.stdout, /✓ ecart\.entre-groupes < ecart\.section : 24 → 48 px, rapport 2\n/);
  assert.match(p.stdout, /marge-interieure\.composant +16 px/);
  assert.match(p.stdout, /3 paires de voisins, aucune en échec\./);
  assert.doesNotMatch(p.stdout, /✗/);
});

test('3c rouge : deux rôles égaux (entre-composants = entre-groupes = 16), code 1', () => {
  const sem = variant((s) => { s.ecart['entre-groupes'].$value = '{espace.16}'; });
  const r = espacements(sem, prims);
  assert.deepEqual(values(r), [4, 16, 16, 48]);
  assert.deepEqual(r.fails.map((v) => [v.de, v.vers, v.rapport]), [['ecart.entre-composants', 'ecart.entre-groupes', 1]]);
  const p = run(sem);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, /✗ ecart\.entre-composants < ecart\.entre-groupes : 16 → 16 px, rapport 1\n/);
  assert.match(p.stdout, /3 paires de voisins, 1 en échec\./);
});

test('3c rouge : ordre inversé (entre-composants 24, entre-groupes 16), code 1', () => {
  const sem = variant((s) => {
    s.ecart['entre-composants'].$value = '{espace.24}';
    s.ecart['entre-groupes'].$value = '{espace.16}';
  });
  const r = espacements(sem, prims);
  assert.deepEqual(values(r), [4, 24, 16, 48]);
  assert.deepEqual(r.voisins.map((v) => [v.ok, v.rapport]), [[true, 6], [false, 0.67], [true, 3]]);
  assert.deepEqual(r.fails.map((v) => [v.de, v.vers]), [['ecart.entre-composants', 'ecart.entre-groupes']]);
  const p = run(sem);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, /✗ ecart\.entre-composants < ecart\.entre-groupes : 24 → 16 px, rapport 0,67\n/);
});
