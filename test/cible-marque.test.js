// @ts-check
/**
 * La cible prise dans la marque (D76), sans navigateur :
 *   CB1 ses couleurs : le blanc, le neutre (sous le nom que lit la réduction), les statuts erreur et succès, les échelles
 *       de la marque ; ni avertissement ni information ; le texte sur plein de chaque échelle ; les dimensions de la
 *       cible donnée ; les autres teintes vont au neutre ;
 *   CB2 chaque couleur de la cible est un jeton de la marque ;
 *   CB3 --brand-colors se lit, et demande --tokens : sans lui, une panne avant le navigateur ;
 *   CB4 M8 ne compare qu'aux échelles de la marque : une couleur qui a la teinte de l'erreur, sans échelle de la marque
 *       à sa teinte, va au neutre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cibleDeLaMarque } from '../src/tokens/cible.js';
import { lireResolver } from '../src/tokens/resolver.js';
import { flattenTokens } from '../src/tokens/roles.js';
import { runReduce } from '../src/reduce/run.js';
import { parseReduceArgs } from '../src/cli/reduce.js';
import { propose } from '../src/reduce/propose.js';

const BASE_CHEMIN = new URL('../fixtures/marque-demo/cible-valise.json', import.meta.url).pathname;
const BASE = JSON.parse(readFileSync(BASE_CHEMIN, 'utf8'));
const RESOLVER = new URL('../tokens/atelier-lavandine/marque.resolver.json', import.meta.url).pathname;
const { jetons } = lireResolver(RESOLVER);
const cible = cibleDeLaMarque(BASE, jetons, { marque: 'Essai' });

test('CB1 la cible prend ses couleurs dans la marque et ses dimensions dans la cible donnée', () => {
  const echelles = [...new Set(cible.colors.map((/** @type {any} */ c) => c.name.replace(/-\d+$/, '')))];
  assert.deepEqual(echelles, ['blanc', 'neutre', 'error', 'success', 'primary', 'accent']);
  assert.equal(cible.colors.find((/** @type {any} */ c) => c.name === 'primary-9').value, '#8a4fd8');
  assert.deepEqual(Object.keys(cible.onSolid), ['neutre', 'error', 'success', 'primary', 'accent']);
  assert.deepEqual([cible.radii, cible.spacing, cible.fontSizes], [BASE.radii, BASE.spacing, BASE.fontSizes]);
  assert.equal(cible.otherHues, 'neutre');
  assert.deepEqual(cible.brandScales, ['primary', 'accent']);
  assert.equal(cible.brand, undefined);
});

test('CB2 chaque couleur de la cible est un jeton de la marque', () => {
  const valeurs = new Set([...flattenTokens(jetons).values()].map((/** @type {any} */ t) => String(t.$value?.hex ?? '').toLowerCase()));
  assert.deepEqual(cible.colors.filter((/** @type {any} */ c) => !valeurs.has(c.value)), []);
  assert.deepEqual(Object.values(cible.onSolid).filter((v) => !valeurs.has(String(v))), []);
});

test('CB3 --brand-colors se lit et demande --tokens', async () => {
  assert.equal(parseReduceArgs(['http://x.test/', '--target', 'c.json', '--brand-colors']).options?.brandColors, true);
  assert.equal(parseReduceArgs(['http://x.test/', '--target', 'c.json']).options?.brandColors, false);
  await assert.rejects(runReduce({ addresses: ['http://127.0.0.1:9/'], targetPath: BASE_CHEMIN, brandColors: true }), /--brand-colors demande --tokens/);
});

test('CB4 M8 ne compare qu’aux échelles de la marque : la teinte de l’erreur va au neutre', async () => {
  const rouge = '#d0563f';
  const rendered = { usages: { colors: { [rouge]: { fond: { count: 2, elements: 2, properties: ['background-color'], selectors: ['.etiquette'] } } }, pairs: [], radii: {}, spacing: {} } };
  const t = propose(rendered, { colors: cible.colors, onSolid: cible.onSolid, otherHues: cible.otherHues, brandScales: cible.brandScales });
  const lignes = t.families.colors.rows.filter((/** @type {any} */ r) => r.old === rouge);
  assert.deepEqual(lignes.map((/** @type {any} */ r) => [r.name?.replace(/-\d+$/, ''), /M8/.test(r.reason ?? '')]), [['neutre', true]]);
});
