// @ts-check
/**
 * Séance 3a, T0 : statuts avertissement et info d'Orbe Café (marque fictive), générés par
 * generateScale (src/valise/generate.js) et rangés à part dans tokens/orbe-cafe/statuts.tokens.json.
 * primitives.tokens.json n'est pas modifié.
 *
 * Attendus écrits à la main avant le code :
 *   sources : avertissement #e5a000, info #0284c7 (attendu de la séance 3a) ;
 *   avertissement : école « plein clair » (k9 = wcagContrast('#e5a000', '#ffffff') < 3,2), onSolid #4c3200 ;
 *   info : école « normale », onSolid #000104 (le blanc ne tient pas 4,5 sur le pas 9) ;
 *     how : node --input-type=module -e "import { generateScale } from './src/valise/generate.js';
 *           console.log(generateScale('avertissement', '#e5a000'), generateScale('info', '#0284c7'))"
 *     (essai du 14/11/2026, avant le code de T0) ;
 *   empreinte de primitives.tokens.json à 3fddd72 : shasum -a 256 tokens/orbe-cafe/primitives.tokens.json ;
 *   séance 3c, typo (15/11/2026) : le bloc graisse est ajouté ; l'empreinte de 3fddd72 doit tenir une fois
 *   ce seul bloc retiré (rien d'autre ne change dans le fichier).
 * Les contrastes sont recalculés ici avec culori (wcagContrast), indépendamment du générateur.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { wcagContrast, rgb } from 'culori';
import { generateScale, checkValise } from '../src/valise/generate.js';
import { valiseFromTokens } from '../src/tokens/primitives.js';
import { charger, etroite, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const read = (/** @type {string} */ f) => readFileSync(join(COMMUN, f), 'utf8');

const PRIMITIVES_SHA256 = 'a6cee106711c62c619d8af653a2c040bccea4d642c5c6cc3805a22cbdd3667ce';
const SOURCES = { avertissement: '#e5a000', info: '#0284c7' };
const SCHOOLS = { avertissement: 'plein clair', info: 'normale' };
const ON_SOLID = { avertissement: '#4c3200', info: '#000104' };
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'sur-plein'];

/** @type {any} */
let statuts;
test('T0 statuts.tokens.json existe et se lit en JSON', () => {
  statuts = JSON.parse(read('statuts.tokens.json'));
  assert.ok(typeof statuts.$description === 'string' && /DTCG 2025\.10/.test(statuts.$description), 'description racine citant DTCG 2025.10');
  assert.equal(statuts.couleur.$type, 'color');
});

test('T0 deux échelles exactement : avertissement et info', () => {
  const scales = Object.keys(statuts.couleur).filter((k) => !k.startsWith('$'));
  assert.deepEqual(scales, ['avertissement', 'info']);
  for (const s of scales) assert.deepEqual(Object.keys(statuts.couleur[s]).filter((k) => !k.startsWith('$')), KEYS, `${s} : 12 pas et sur-plein`);
});

test('T0 chaque jeton : valeur DTCG 2025.10 cohérente (srgb, composantes à 4 décimales, hex)', () => {
  for (const s of Object.keys(SOURCES)) {
    for (const k of KEYS) {
      const v = statuts.couleur[s][k].$value;
      assert.equal(v.colorSpace, 'srgb', `${s}.${k}`);
      assert.match(v.hex, /^#[0-9a-f]{6}$/, `${s}.${k}`);
      const c = rgb(v.hex);
      assert.deepEqual(v.components, [c.r, c.g, c.b].map((x) => Math.round(x * 10000) / 10000), `${s}.${k} : composantes = hex`);
    }
  }
});

test('T0 pas égaux à generateScale ; pas 9 = source ; sur-plein = onSolid', () => {
  for (const [s, src] of Object.entries(SOURCES)) {
    const g = generateScale(s, src);
    const got = KEYS.slice(0, 12).map((k) => statuts.couleur[s][k].$value.hex);
    assert.deepEqual(got, g.steps, s);
    assert.equal(got[8], src, `${s} : pas 9 = source`);
    assert.equal(statuts.couleur[s]['sur-plein'].$value.hex, ON_SOLID[/** @type {keyof ON_SOLID} */ (s)], `${s} : sur-plein`);
  }
});

test('T0 école et source écrites dans $extensions de chaque échelle', () => {
  for (const [s, src] of Object.entries(SOURCES)) {
    const x = statuts.couleur[s].$extensions?.['ds-lab.valise'];
    assert.ok(x, `${s} : $extensions["ds-lab.valise"]`);
    assert.equal(x.source, src);
    assert.equal(x.ecole, SCHOOLS[/** @type {keyof SCHOOLS} */ (s)]);
  }
});

test('T0 sur-plein lisible sur les pas 9 et 10 (culori, ≥ 4,5)', () => {
  for (const s of Object.keys(SOURCES)) {
    const os = statuts.couleur[s]['sur-plein'].$value.hex;
    for (const step of ['9', '10']) {
      const r = wcagContrast(os, statuts.couleur[s][step].$value.hex);
      assert.ok(r >= 4.5, `${s} : sur-plein sur ${step}, ${r.toFixed(2)}`);
    }
  }
});

test('T0 phrases d\'usage : chaque pas a celle de primitives.tokens.json ; sur-plein cite les pas 9 et 10', () => {
  const prim = charger('primitives.tokens.json').couleur.bleu;
  for (const s of Object.keys(SOURCES)) {
    for (const k of KEYS.slice(0, 12)) assert.equal(statuts.couleur[s][k].$description, prim[k].$description, `${s}.${k}`);
    assert.equal(statuts.couleur[s]['sur-plein'].$description, 'texte posé sur les pas 9 et 10 (4,5:1)');
    assert.ok(typeof statuts.couleur[s].$description === 'string' && statuts.couleur[s].$description.length > 0, `${s} : phrase d'échelle`);
  }
});

test('T0 checkValise passe sur les deux échelles', () => {
  assert.deepEqual(checkValise(valiseFromTokens(statuts)), []);
});

test('T0 primitives.tokens.json inchangé (empreinte de 3fddd72), au bloc graisse près (séance 3c) ; copie figée dans fixtures/marque-demo/jetons/ (étape 4b)', () => {
  const s = readFileSync(join(ROOT, 'fixtures', 'marque-demo', 'jetons', 'primitives.tokens.json'), 'utf8');
  const sansGraisse = s.replace(/ {2}"graisse": \{\n[^]*?\n {2}\},\n/, '');
  assert.notEqual(sansGraisse, s, 'bloc graisse présent');
  const h = createHash('sha256').update(sansGraisse).digest('hex');
  assert.equal(h, PRIMITIVES_SHA256);
});

test('4b lot 1 : primitives communes et échelles d\'Orbe Café réunies = primitives d\'avant le rangement, descriptions de fichier mises à part', () => {
  const avant = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'marque-demo', 'jetons', 'primitives.tokens.json'), 'utf8'));
  const apres = charger('primitives.tokens.json');
  delete avant.$description;
  delete apres.$description;
  const tri = (/** @type {any} */ o) => JSON.stringify(o, (_, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v));
  assert.equal(tri(apres), tri(avant));
});
