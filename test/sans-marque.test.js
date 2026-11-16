// @ts-check
/**
 * Aucune marque par défaut (docs/attendus/revue-lot-5-marque.md, Q1 et Q2).
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   D1 les marques sont les dossiers de tokens/ qui ont un marque.resolver.json, par ordre de nom : atelier-lavandine,
 *      ecume-et-sel, grenat-papeterie, orbe-cafe ; leur nom est le champ name de leur resolver ;
 *   D2 plus de constante ORBE ; loadRoles et largeurs exigent un dossier : sans lui, elles lèvent en le disant
 *      (« loadRoles : dossier de marque attendu », « largeurs : dossier de marque attendu ») ;
 *   D3 contraste, espacements et typo prennent --marque <dossier> ; avec l'option, la sortie est celle d'une seule marque ;
 *      sans l'option, un bloc par marque, dans l'ordre de D1, chacun précédé d'une ligne « marque <nom> (tokens/<dossier>/) »,
 *      les blocs séparés par une ligne vide ; chaque bloc égale la sortie avec --marque ; sortie 0 si toutes passent ;
 *   D4 sortie 1 si une marque échoue (contraste avec un seuil d'essai que toutes manquent) ;
 *   D5 typo : la couche marque donnée à part passe par --couche-marque <fichier> ; --marque attend un dossier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as resolver from '../src/tokens/resolver.js';
import { loadRoles } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'orbe-cafe'];
const NOMS = ['Atelier Lavandine', 'Écume et Sel', 'Grenat Papeterie', 'Orbe Café'];
/** @param {string} cli @param {...string} args */
const run = (cli, ...args) => spawnSync(process.execPath, [`src/cli/${cli}.js`, ...args], { cwd: ROOT, encoding: 'utf8' });

test('D1 marques lues dans tokens/, nom lu dans le resolver', () => {
  const ds = /** @type {any} */ (resolver).dossiersDeMarque();
  assert.deepEqual(ds, MARQUES.map((m) => join(ROOT, 'tokens', m) + '/'));
  assert.deepEqual(ds.map((/** @type {string} */ d) => /** @type {any} */ (resolver).nomDeMarque(d)), NOMS);
});

test('D2 aucune marque par défaut dans les fonctions', () => {
  assert.equal('ORBE' in resolver, false);
  assert.throws(() => /** @type {any} */ (loadRoles)(), { message: 'loadRoles : dossier de marque attendu' });
  assert.throws(() => /** @type {any} */ (resolver.largeurs)(), { message: 'largeurs : dossier de marque attendu' });
});

for (const cli of ['contraste', 'espacements', 'typo']) {
  test(`D3 ${cli} : --marque <dossier>, puis toutes les marques sans l'option`, () => {
    const blocs = MARQUES.map((m, i) => {
      const p = run(cli, '--marque', `tokens/${m}/`);
      assert.equal(p.status, 0, `${m}\n${p.stderr}`);
      return `marque ${NOMS[i]} (tokens/${m}/)\n${p.stdout}`;
    });
    const tout = run(cli);
    assert.equal(tout.status, 0, tout.stderr);
    assert.equal(tout.stdout, blocs.join('\n'));
  });
}

test('D3 contraste --marque : sortie d\'une seule marque, sans en-tête', () => {
  const p = run('contraste', '--marque', 'tokens/orbe-cafe/');
  assert.ok(p.stdout.startsWith('\ncouleur') || p.stdout.startsWith('\ntexte') || /^\n\S/.test(p.stdout), p.stdout.slice(0, 80));
  assert.doesNotMatch(p.stdout, /^marque /m);
});

test('D4 une marque qui échoue : sortie 1', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-lab-sans-marque-'));
  const paires = JSON.parse(readFileSync(join(ROOT, 'tokens', 'commun', 'paires.json'), 'utf8'));
  for (const k of Object.keys(paires.seuils ?? {})) paires.seuils[k] = 21;
  writeFileSync(join(dir, 'paires.json'), JSON.stringify(paires));
  const p = run('contraste', '--paires', join(dir, 'paires.json'));
  assert.equal(p.status, 1, p.stderr);
  assert.equal(p.stdout.match(/^marque /gm)?.length, 4);
});

test('D5 typo : --couche-marque <fichier>', () => {
  const a = run('typo', '--marque', 'tokens/orbe-cafe/', '--couche-marque', 'tokens/orbe-cafe/marque.tokens.json');
  assert.equal(a.status, 0, a.stderr);
  const b = run('typo', '--marque', 'tokens/orbe-cafe/marque.tokens.json');
  assert.equal(b.status, 2);
  assert.match(b.stderr, /^typo : /);
});
