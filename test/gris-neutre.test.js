// @ts-check
/**
 * Lot G, règle G8 (13/11/2026) : un gris (chroma OKLCH < 0,02) ne se range que sur l'échelle
 * neutre, jamais sur une échelle de marque ni de statut, même quand un pas foncé d'une autre
 * échelle est plus proche. Valise fictive générée (neutre + bleu nuit très foncé).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { oklch, differenceEuclidean } from 'culori';
import { generateValise } from '../src/valise/generate.js';
import { propose } from '../src/reduce/propose.js';

const dE = (/** @type {string} */ a, /** @type {string} */ b) => 100 * differenceEuclidean('oklab')(a, b);
const valise = generateValise({ scales: [{ name: 'neutre', source: '#858585' }, { name: 'nuit', source: '#2b3350' }], dims: { radii: [0], spacing: [0], fontSizes: [16] } });

/** Relevé minimal : une couleur de texte sur blanc. @param {string} hex */
const rendered = (hex) => ({
  usages: {
    colors: { [hex]: { texte: { count: 4, content: 0, properties: ['color'], selectors: ['p'], pages: {} } } },
    pairs: [{ text: hex, bg: '#ffffff', bgUsage: 'fond', threshold: 4.5, n: 4 }],
    borderPairs: [],
  },
});

test('G8 : un gris presque noir va sur neutre, même si un pas de nuit est plus proche', () => {
  const grey = '#212121';
  assert.ok((oklch(grey).c ?? 0) < 0.02, 'gris');
  const nearest = valise.colors.map((/** @type {any} */ c) => ({ ...c, d: dE(grey, c.value) })).sort((/** @type {any} */ a, /** @type {any} */ b) => a.d - b.d)[0];
  assert.match(nearest.name, /^nuit-/, `précondition : le plus proche de toute la valise est un pas de nuit (${nearest.name})`);
  const row = propose(rendered(grey), { colors: valise.colors }).families.colors.rows.find((/** @type {any} */ r) => r.old === grey);
  assert.ok(row, 'ligne absente');
  assert.match(row.name ?? '', /^neutre-/, `rangé sur ${row.name}`);
});

test('G8 : une couleur teintée (chroma ≥ 0,02) garde le pas le plus proche', () => {
  const tinted = '#1c2238';
  assert.ok((oklch(tinted).c ?? 0) >= 0.02);
  const row = propose(rendered(tinted), { colors: valise.colors }).families.colors.rows.find((/** @type {any} */ r) => r.old === tinted);
  assert.match(row.name ?? '', /^nuit-/, `rangé sur ${row.name}`);
});
