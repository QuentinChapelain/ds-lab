// @ts-check
/**
 * Lot M : choix du jeton DTCG d'une couleur quand plusieurs jetons ont la même
 * valeur (src/report/migration.js), sur tokens/orbe-cafe/primitives.tokens.json.
 * Règle : d'abord le nom de la ligne dans la valise ; un jeton sur-plein
 * seulement pour un texte posé sur le plein de cette échelle.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { indexTokens, pickColorToken } from '../src/report/migration.js';

const tokens = JSON.parse(await readFile(new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url), 'utf8'));
const idx = indexTokens(tokens);

test('jetons : le nom de la valise d’abord (#ffffff → couleur.blanc, jamais un sur-plein)', () => {
  assert.equal(idx.find('colors', '#ffffff', { name: 'blanc' }), 'couleur.blanc');
  assert.equal(idx.find('colors', '#ffffff', { name: 'blanc', pleinScales: new Set(['bleu']) }), 'couleur.blanc', 'le nom de la valise l’emporte');
  assert.equal(idx.find('colors', '#ffffff'), 'couleur.blanc', 'sans nom : le premier jeton qui n’est pas sur-plein');
  assert.equal(idx.find('colors', '#4a2900', { name: 'sable-12' }), 'couleur.sable.12');
  assert.equal(idx.find('colors', '#6a0000', { name: 'erreur-12' }), 'couleur.erreur.12');
  assert.equal(idx.find('colors', '#6d675b', { name: 'neutre-11' }), 'couleur.neutre.11');
});

test('jetons : sur-plein seulement pour un texte posé sur le plein de son échelle', () => {
  const surPlein = ['couleur.neutre.sur-plein'];
  assert.equal(pickColorToken(surPlein), null, 'ni texte sur plein, ni nom : pas de jeton');
  assert.equal(pickColorToken(surPlein, { pleinScales: new Set(['bleu']) }), null, 'texte sur un plein d’une autre échelle');
  assert.equal(pickColorToken(surPlein, { pleinScales: new Set(['neutre']) }), 'couleur.neutre.sur-plein');
  assert.equal(pickColorToken(['couleur.sable.12', 'couleur.sable.sur-plein'], { pleinScales: new Set(['sable']) }), 'couleur.sable.sur-plein', 'sans nom, texte sur plein sable : sur-plein permis');
  assert.equal(pickColorToken(['couleur.sable.12', 'couleur.sable.sur-plein'], { name: 'sable-12', pleinScales: new Set(['sable']) }), 'couleur.sable.12', 'le nom de la valise l’emporte');
  assert.equal(pickColorToken(['couleur.sable.12', 'couleur.sable.sur-plein']), 'couleur.sable.12', 'ni nom ni plein : jamais sur-plein');
});

test('jetons : dimensions par groupe (espace, taille-texte, rayon)', () => {
  assert.equal(idx.find('spacing', '16px'), 'espace.16');
  assert.equal(idx.find('fontSizes', '16px'), 'taille-texte.16');
  assert.equal(idx.find('radii', '12px'), 'rayon.12');
  assert.equal(idx.find('radii', '9999px'), 'rayon.pilule');
  assert.equal(idx.find('spacing', '20px'), null);
});
