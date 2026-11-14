// @ts-check
/**
 * Proposition de table ancien → nouveau (src/reduce/propose.js).
 * Attendus écrits à la main avant le code, à partir de fixtures/marque-demo/cible.json.
 * Classes : inchangé (déjà sur la cible) ; auto (écart invisible : ≤ 1 px, ou ΔE ≤ 2) ;
 * proche (écart ≤ 15 % pour une dimension, ΔE ≤ 5 pour une couleur) ; décision (au-delà,
 * avec 3 candidats) ; hors table (valeur non convertible, couleur transparente).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { propose, CLASSES } from '../src/reduce/propose.js';

const target = JSON.parse(await readFile(new URL('../fixtures/marque-demo/cible.json', import.meta.url), 'utf8'));
/** @param {Record<string, number>} counts */
const fam = (counts) => ({ values: Object.fromEntries(Object.entries(counts).map(([k, n]) => [k, { count: n, content: 0, contexts: [{ property: 'x', role: 'texte', count: n, selectors: ['p'] }] }])) });
const rendered = {
  families: {
    radii: fam({ '8px': 4, '12px': 4, '4px': 4, '999px': 8, '50%': 4, '3px': 2 }),
    paddings: fam({ '16px': 2, '32px': 6, '27px': 4, '5px': 3 }),
    margins: fam({ '24px': 2, '36px': 1, '75px': 2 }),
    gaps: fam({ '18px': 1 }),
    fontSizes: fam({ '18px': 7, '54px': 2, '22.5px': 1, '13.5px': 2, '15.75px': 2, '11px': 3 }),
    colors: fam({ '#2b4c7e': 5, '#2c4d7f': 1, '#30548a': 1, '#9a9a9a': 1, '#1f2a4433': 1, '#ffffff': 4 }),
  },
};
const T = propose(rendered, target);
/** @param {string} family @param {string} old */
const row = (family, old) => T.families[family].rows.find((/** @type {any} */ r) => r.old === old);

test('classes de la table : cinq, dans l’ordre de lecture', () => {
  assert.deepEqual(CLASSES, ['décision', 'proche', 'auto', 'inchangé', 'hors table']);
});

test('rayons : pilule ramenée à 9999, pourcentage hors table, 3 px vers 4 px', () => {
  assert.deepEqual([row('radii', '8px').class, row('radii', '8px').new], ['inchangé', '8px']);
  assert.deepEqual([row('radii', '999px').class, row('radii', '999px').new], ['auto', '9999px'], 'au-delà de 500 px, la forme est une pilule : écart invisible');
  assert.equal(row('radii', '50%').class, 'hors table');
  assert.deepEqual([row('radii', '3px').class, row('radii', '3px').new], ['auto', '4px'], '|Δ| = 1 px');
});

test('espacements : marges, retraits et gouttières partagent une échelle', () => {
  assert.deepEqual([row('spacing', '27px').class, row('spacing', '27px').new], ['proche', '24px'], '24 (Δ 3, 11 %) plus près que 32');
  assert.deepEqual([row('spacing', '18px').class, row('spacing', '18px').new], ['proche', '16px'], 'Δ 2, 11 %');
  assert.deepEqual([row('spacing', '36px').class, row('spacing', '36px').new], ['proche', '32px'], 'Δ 4, 11 %');
  assert.deepEqual([row('spacing', '5px').class, row('spacing', '5px').new], ['auto', '4px']);
  const r = row('spacing', '75px');
  assert.equal(r.class, 'décision', '48 est à 36 % : au designer de trancher');
  // Lot C : fenêtre au bord haut (C2), par valeur croissante.
  assert.deepEqual(r.candidates.map((/** @type {any} */ c) => c.value), ['32px', '48px']);
  assert.equal(row('spacing', '32px').count, 6);
});

test('tailles de police', () => {
  assert.deepEqual([row('fontSizes', '13.5px').class, row('fontSizes', '13.5px').new], ['auto', '14px']);
  assert.deepEqual([row('fontSizes', '15.75px').class, row('fontSizes', '15.75px').new], ['auto', '16px']);
  assert.deepEqual([row('fontSizes', '22.5px').class, row('fontSizes', '22.5px').new], ['proche', '24px'], 'Δ 1,5 px, 6,7 %');
  assert.deepEqual([row('fontSizes', '54px').class, row('fontSizes', '54px').new], ['proche', '56px'], 'Δ 2 px, 3,7 %');
  assert.deepEqual([row('fontSizes', '11px').class, row('fontSizes', '11px').new], ['décision', '14px'], 'Δ 3 px, 27 %');
});

test('lot R : une taille de texte n’est proche qu’à 2 px au plus, même sous 15 %', () => {
  const t = propose({ families: { fontSizes: fam({ '30px': 1, '29.99px': 1 }) } }, { fontSizes: target.fontSizes });
  /** @param {string} old */
  const r = (old) => t.families.fontSizes.rows.find((/** @type {any} */ x) => x.old === old);
  assert.deepEqual([r('30px').class, r('30px').new, r('30px').delta], ['proche', '32px', 2], 'Δ 2 px, 6,25 %');
  assert.deepEqual([r('29.99px').class, r('29.99px').new, r('29.99px').delta], ['décision', '32px', 2.01], 'Δ 2,01 px, 6,7 %');
});

test('couleurs : ΔE OKLab × 100 vers la cible, transparentes hors table', () => {
  assert.deepEqual([row('colors', '#2b4c7e').class, row('colors', '#2b4c7e').name], ['inchangé', 'bleu']);
  assert.deepEqual([row('colors', '#2c4d7f').class, row('colors', '#2c4d7f').new], ['auto', '#2b4c7e'], 'ΔE 0,35');
  assert.deepEqual([row('colors', '#30548a').class, row('colors', '#30548a').new], ['proche', '#2b4c7e'], 'ΔE 2,97');
  const g = row('colors', '#9a9a9a');
  assert.deepEqual([g.class, g.new, g.candidates.length], ['décision', '#767676', 3]);
  assert.equal(row('colors', '#1f2a4433').class, 'hors table');
});

test('synthèse : valeurs avant et après, décisions à prendre', () => {
  const s = T.families.spacing.summary;
  assert.equal(s.before, 8, '16, 32, 27, 5 (retraits) ; 24, 36, 75 (marges) ; 18 (gouttière)');
  assert.equal(s.after, 5, '16, 32, 24, 4, 48');
  assert.equal(s.decisions, 1, '75 px');
  assert.equal(s.occurrences, 21);
});
