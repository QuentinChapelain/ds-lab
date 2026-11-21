// @ts-check
/**
 * Choix du jeton DTCG d'une couleur quand plusieurs jetons ont la même
 * valeur (src/report/migration.js), sur le resolver d'Orbe Café (tokens/orbe-cafe/marque.resolver.json).
 * Règle : d'abord le nom de la ligne dans la valise ; un jeton sur-plein
 * seulement pour un texte posé sur le plein de cette échelle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { indexTokens, pickColorToken } from '../src/report/migration.js';
import { jetonsDe } from '../src/tokens/resolver.js';

const RESOLVER = new URL('../tokens/orbe-cafe/marque.resolver.json', import.meta.url);
const tokens = jetonsDe(JSON.parse(await readFile(RESOLVER, 'utf8')), RESOLVER.pathname);
const idx = indexTokens(tokens);

test('jetons : le nom de la valise d’abord (#ffffff → color.white, jamais un sur-plein)', () => {
  assert.equal(idx.find('colors', '#ffffff', { name: 'blanc' }), 'color.white');
  assert.equal(idx.find('colors', '#ffffff', { name: 'white', pleinScales: new Set(['blue']) }), 'color.white', 'le nom de la valise l’emporte');
  assert.equal(idx.find('colors', '#ffffff'), 'color.white', 'sans nom : le premier jeton qui n’est pas sur-plein');
  assert.equal(idx.find('colors', '#4a2900', { name: 'sand-12' }), 'color.sand.12');
  assert.equal(idx.find('colors', '#6a0000', { name: 'error-12' }), 'color.error.12');
  assert.equal(idx.find('colors', '#6d675b', { name: 'neutral-11' }), 'color.neutral.11');
});

test('jetons : sur-plein seulement pour un texte posé sur le plein de son échelle', () => {
  const surPlein = ['color.neutral.on-solid'];
  assert.equal(pickColorToken(surPlein), null, 'ni texte sur plein, ni nom : pas de jeton');
  assert.equal(pickColorToken(surPlein, { pleinScales: new Set(['blue']) }), null, 'texte sur un plein d’une autre échelle');
  assert.equal(pickColorToken(surPlein, { pleinScales: new Set(['neutral']) }), 'color.neutral.on-solid');
  assert.equal(pickColorToken(['color.sand.12', 'color.sand.on-solid'], { pleinScales: new Set(['sand']) }), 'color.sand.on-solid', 'sans nom, texte sur plein sable : sur-plein permis');
  assert.equal(pickColorToken(['color.sand.12', 'color.sand.on-solid'], { name: 'sand-12', pleinScales: new Set(['sand']) }), 'color.sand.12', 'le nom de la valise l’emporte');
  assert.equal(pickColorToken(['color.sand.12', 'color.sand.on-solid']), 'color.sand.12', 'ni nom ni plein : jamais sur-plein');
});

test('jetons : dimensions par groupe (espace, taille-texte, rayon)', () => {
  assert.equal(idx.find('spacing', '16px'), 'space.16');
  assert.equal(idx.find('fontSizes', '16px'), 'font-size.16');
  assert.equal(idx.find('radii', '12px'), 'radius.12');
  assert.equal(idx.find('radii', '9999px'), 'radius.full');
  assert.equal(idx.find('spacing', '20px'), null);
});
