// @ts-check
/**
 * Lot V, étape 1 : comparaison de captures et d'arbres d'accessibilité.
 * Attendus écrits avant le code :
 * - deux images identiques → 0 pixel différent, 0 % ;
 * - une image dont un carré 5×5 est modifié → exactement ces 25 pixels, et l'image des
 *   différences marque en rouge ces pixels-là et aucun autre.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { compareImages, compareAria } from '../src/verify/compare.js';

const W = 20;
const H = 16;

/** Image unie W×H, encodée en PNG. `paint(x, y)` peut remplacer la couleur d'un pixel. */
function png(/** @type {(x: number, y: number) => number[] | null} */ paint = () => null) {
  const img = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const [r, g, b] = paint(x, y) ?? [240, 236, 228];
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(img);
}

test('deux images identiques : 0 pixel différent', () => {
  const r = compareImages(png(), png());
  assert.equal(r.different, 0);
  assert.equal(r.percent, 0);
  assert.equal(r.total, W * H);
});

test('un carré modifié : exactement ce carré', () => {
  const inSquare = (/** @type {number} */ x, /** @type {number} */ y) => x >= 7 && x < 12 && y >= 3 && y < 8;
  const r = compareImages(png(), png((x, y) => (inSquare(x, y) ? [40, 90, 160] : null)));
  assert.equal(r.different, 25);
  assert.equal(r.percent, (25 / (W * H)) * 100);

  const diff = PNG.sync.read(r.diffPng);
  assert.equal(diff.width, W);
  assert.equal(diff.height, H);
  const red = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (diff.data[i] === 255 && diff.data[i + 1] === 0 && diff.data[i + 2] === 0) red.push(`${x},${y}`);
    }
  }
  const expected = [];
  for (let y = 3; y < 8; y++) for (let x = 7; x < 12; x++) expected.push(`${x},${y}`);
  assert.deepEqual(red, expected);
});

test('arbre d’accessibilité : identique, puis une ligne changée', () => {
  const before = '- heading "Carte" [level=1]\n- button "Commander"';
  assert.deepEqual(compareAria(before, before), { identical: true, diff: '' });
  const r = compareAria(before, '- heading "Carte" [level=1]\n- button "Payer"');
  assert.equal(r.identical, false);
  assert.equal(r.diff, '  - heading "Carte" [level=1]\n- - button "Commander"\n+ - button "Payer"');
});
