// @ts-check
/**
 * Revue de code, lot 5, points 4 et 5 : reduce --tokens lit un resolver et refuse un fichier qui ne donne aucun jeton
 * (docs/attendus/revue-lot-5-marque.md, D18). Sans navigateur : chaque refus sort avant de lancer Chromium.
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   J1 un resolver (version et resolutionOrder) est résolu depuis son dossier, dans ses contextes par défaut : le resolver
 *      d'Orbe Café donne 133 entrées à l'index (108 chemins de couleur, 25 de dimension), dont chaque chemin de la copie
 *      figée d'avant l'étape 4b, avec sa valeur ; un fichier de jetons est lu tel quel (copie figée : 104 entrées) ;
 *   J2 un fichier qui ne donne aucun jeton ({}, ou les rôles seuls, tout en alias) : sortie 2, une ligne
 *      « reduce : --tokens <chemin> : aucun jeton lu (couleur en hex, dimension en px) ; un fichier .tokens.json ou un
 *      resolver DTCG 2025.10 attendu » ;
 *   J3 fichier absent : « reduce : <chemin> : fichier absent » ; fichier vide : « reduce : <chemin> : JSON illisible
 *      (Unexpected end of JSON input) » (lireJson, src/cli/garde.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexTokens } from '../src/report/migration.js';
import { jetonsDe } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RESOLVER = join(ROOT, 'tokens', 'orbe-cafe', 'marque.resolver.json');
const COPIE = join(ROOT, 'fixtures', 'marque-demo', 'jetons', 'primitives.tokens.json');
const SANS_CHROMIUM = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/nulle/part' };
const lire = (/** @type {string} */ f) => JSON.parse(readFileSync(f, 'utf8'));
/** @param {string} tokens */
const reduce = (tokens) =>
  spawnSync(process.execPath, ['src/cli/reduce.js', 'http://127.0.0.1:9/', '--target', 'fixtures/marque-demo/cible-valise.json', '--tokens', tokens, '--out', mkdtempSync(join(tmpdir(), 'ds-lab-jetons-'))], { cwd: ROOT, encoding: 'utf8', env: SANS_CHROMIUM });

/** Chemins et valeurs des jetons de couleur (hex) et de dimension (px). @param {any} t */
function feuilles(t) {
  /** @type {Map<string, string>} */
  const out = new Map();
  /** @param {any} n @param {string[]} p @param {string | undefined} ty */
  const walk = (n, p, ty) => {
    if (!n || typeof n !== 'object') return;
    const type = n.$type ?? ty;
    if ('$value' in n) {
      if (type === 'color' && n.$value?.hex) out.set(p.join('.'), n.$value.hex.toLowerCase());
      if (type === 'dimension' && n.$value?.unit === 'px') out.set(p.join('.'), `${n.$value.value}px`);
      return;
    }
    for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) walk(v, [...p, k], type);
  };
  walk(t, [], undefined);
  return out;
}

test('J1 un resolver est résolu depuis son dossier ; un fichier de jetons est lu tel quel', () => {
  const r = jetonsDe(lire(RESOLVER), RESOLVER);
  assert.equal(indexTokens(r).size, 133);
  const copie = lire(COPIE);
  assert.equal(jetonsDe(copie, COPIE), copie);
  assert.equal(indexTokens(copie).size, 104);
  const vrais = feuilles(r);
  for (const [chemin, valeur] of feuilles(copie)) assert.equal(vrais.get(chemin), valeur, chemin);
});

test('J2 un fichier qui ne donne aucun jeton : sortie 2, message nommé', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-lab-jetons-'));
  const vide = join(dir, 'accolades.tokens.json');
  writeFileSync(vide, '{}');
  for (const f of [vide, join(ROOT, 'tokens', 'commun', 'semantique.tokens.json')]) {
    const p = reduce(f);
    assert.equal(p.status, 2, p.stderr);
    assert.equal(p.stderr, `reduce : --tokens ${f} : aucun jeton lu (couleur en hex, dimension en px) ; un fichier .tokens.json ou un resolver DTCG 2025.10 attendu\n`);
  }
});

test('J3 fichier absent, fichier vide : sortie 2, le fichier nommé', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ds-lab-jetons-'));
  const absent = join(dir, 'absent.tokens.json');
  const vide = join(dir, 'vide.tokens.json');
  writeFileSync(vide, '');
  const a = reduce(absent);
  assert.equal(a.status, 2);
  assert.equal(a.stderr, `reduce : ${absent} : fichier absent\n`);
  const v = reduce(vide);
  assert.equal(v.status, 2);
  assert.equal(v.stderr, `reduce : ${vide} : JSON illisible (Unexpected end of JSON input)\n`);
});
