// @ts-check
/**
 * Lot C (candidats) : fenêtre des candidats d'une ligne numérique (C1 à C6).
 * Attendus écrits à la main avant le code : fixtures/marque-demo/expected-candidats.json (bloc « window »).
 * Le défaut et la classe (C5) sont comparés à la règle d'avant le lot, recopiée ici (todayRow).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as P from '../src/reduce/propose.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-candidats.json', import.meta.url), 'utf8'));
const { THRESHOLDS } = P;

/** @param {string} family @param {string} value @param {boolean} [pill] */
function rowOf(family, value, pill = false) {
  assert.equal(typeof P.dimensionRow, 'function', 'propose.js n’exporte pas dimensionRow');
  return P.dimensionRow({ old: value, count: 1, properties: [], selectors: [] }, E.scales[family], { forcePill: pill });
}

/**
 * Règle d'avant le lot C (8f11d24) : le plus proche sur toute l'échelle, départage par la plus petite valeur.
 * @param {number} n @param {number[]} scale
 */
function todayRow(n, scale) {
  const best = [...scale].map((s) => ({ s, d: Math.round(Math.abs(s - n) * 100) / 100 })).sort((a, b) => a.d - b.d || a.s - b.s)[0];
  const ratio = n === 0 ? (best.d === 0 ? 0 : 1) : best.d / Math.abs(n);
  const cls = best.d === 0 ? 'inchangé' : best.d <= THRESHOLDS.autoPx ? 'auto' : ratio <= THRESHOLDS.nearRatio ? 'proche' : 'décision';
  return { new: `${best.s}px`, class: cls, delta: best.d };
}

for (const w of E.window)
  test(`C1 à C4 : ${w.case} (${w.family} ${w.value})`, () => {
    const r = rowOf(w.family, w.value, w.pill);
    assert.deepEqual(r.candidates.map((/** @type {any} */ c) => c.value), w.candidates, 'candidats, par valeur croissante');
    const near = r.candidates.filter((/** @type {any} */ c) => c.nearest);
    assert.equal(near.length, 1, 'un seul candidat porte « le plus proche »');
    assert.equal(near[0].value, w.nearest, 'le plus proche');
    assert.equal(r.new, w.nearest, 'la proposition par défaut est le plus proche (C5)');
  });

test('C3 : 0 n’est jamais ajouté pour élargir la fenêtre', () => {
  for (const family of ['spacing', 'radii'])
    for (let n = 0.5; n <= 80; n += 0.5) {
      const r = rowOf(family, `${n}px`);
      const values = r.candidates.map((/** @type {any} */ c) => c.value);
      const steps = E.scales[family];
      const lowerIsZero = Math.max(...steps.filter((/** @type {number} */ s) => s <= n)) === 0;
      if (!lowerIsZero) assert.ok(!values.includes('0px'), `${family} ${n}px : 0 dans ${values}`);
    }
});

test('C4 : la pilule n’entre jamais dans la fenêtre', () => {
  for (let n = 0.5; n <= 400; n += 0.5) {
    const r = rowOf('radii', `${n}px`);
    assert.ok(!r.candidates.some((/** @type {any} */ c) => c.value === '9999px'), `rayon ${n}px`);
    assert.ok(r.candidates.length <= 4, `rayon ${n}px : ${r.candidates.length} candidats`);
  }
});

test('C5 : défaut, écart et classe inchangés sur les trois échelles (0 à 80 px, pas de 0,25)', () => {
  for (const family of ['spacing', 'radii', 'fontSizes'])
    for (let n = 0; n <= 80; n += 0.25) {
      const r = rowOf(family, `${n}px`);
      const t = todayRow(n, E.scales[family]);
      assert.deepEqual({ new: r.new, class: r.class, delta: r.delta }, t, `${family} ${n}px`);
    }
});

test('C1, C6 : quatre candidats au plus, par valeur croissante, le défaut parmi eux', () => {
  for (const family of ['spacing', 'radii', 'fontSizes'])
    for (let n = 0.5; n <= 80; n += 0.5) {
      const r = rowOf(family, `${n}px`);
      const v = r.candidates.map((/** @type {any} */ c) => parseFloat(c.value));
      assert.ok(v.length >= 1 && v.length <= 4, `${family} ${n}px : ${v.length} candidats`);
      assert.deepEqual(v, [...v].sort((a, b) => a - b), `${family} ${n}px : ordre`);
      assert.ok(r.candidates.some((/** @type {any} */ c) => c.nearest && c.value === r.new), `${family} ${n}px : défaut absent`);
    }
});
