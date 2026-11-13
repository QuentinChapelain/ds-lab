// @ts-check
/**
 * Lot V : comparaisons pures, sans navigateur.
 * - compareImages : deux PNG → nombre et pourcentage de pixels différents, image des différences.
 *   Seuil 0 et anticrénelage compté : un pixel qui change est un pixel différent.
 *   Tailles différentes (page plus longue) : les deux images sont étendues à la plus grande
 *   par du transparent, la zone ajoutée compte comme différente, et `sizeMismatch` le dit.
 * - compareAria : deux instantanés d'arbre d'accessibilité (texte YAML) → identique ou diff ligne à ligne.
 */
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

/**
 * @param {PNG} img
 * @param {number} width
 * @param {number} height
 */
function padTo(img, width, height) {
  if (img.width === width && img.height === height) return img.data;
  const out = new PNG({ width, height });
  out.data.fill(0);
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out.data;
}

/**
 * @param {Buffer} referencePng
 * @param {Buffer} actualPng
 * @param {{ threshold?: number }} [opts]
 * @returns {{ width: number, height: number, total: number, different: number, percent: number,
 *   sizeMismatch: null | { reference: [number, number], actual: [number, number] }, diffPng: Buffer }}
 */
export function compareImages(referencePng, actualPng, { threshold = 0 } = {}) {
  const a = PNG.sync.read(referencePng);
  const b = PNG.sync.read(actualPng);
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  const diff = new PNG({ width, height });
  const different = pixelmatch(padTo(a, width, height), padTo(b, width, height), diff.data, width, height, {
    threshold,
    includeAA: true,
  });
  const total = width * height;
  const sizeMismatch =
    a.width === b.width && a.height === b.height
      ? null
      : { reference: /** @type {[number, number]} */ ([a.width, a.height]), actual: /** @type {[number, number]} */ ([b.width, b.height]) };
  return { width, height, total, different, percent: total ? (different / total) * 100 : 0, sizeMismatch, diffPng: PNG.sync.write(diff) };
}

/**
 * Diff ligne à ligne (plus longue sous-suite commune) : « - » retirée, « + » ajoutée, « ␣␣ » commune.
 * @param {string} before
 * @param {string} after
 * @returns {{ identical: boolean, diff: string }}
 */
export function compareAria(before, after) {
  if (before === after) return { identical: true, diff: '' };
  const a = before.split('\n');
  const b = after.split('\n');
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push(`  ${a[i]}`);
      i++;
      j++;
    } else if (j < b.length && (i === a.length || lcs[i][j + 1] > lcs[i + 1][j])) {
      lines.push(`+ ${b[j++]}`);
    } else {
      lines.push(`- ${a[i++]}`);
    }
  }
  return { identical: false, diff: lines.join('\n') };
}
