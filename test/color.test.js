// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeColor,
  toLab,
  deltaE,
  cluster,
  blend,
  contrastRatio,
  relativeLuminance,
  isLargeText,
  wcagLevels,
} from '../src/lib/color.js';

/** @param {number} a @param {number} b @param {number} tol */
const near = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b} (± ${tol})`);

test('normalizeColor : écritures équivalentes → même hexadécimal', () => {
  for (const s of ['#F00', '#ff0000', '#FF0000FF', 'red', 'rgb(255, 0, 0)', 'rgb(255 0 0)', 'hsl(0 100% 50%)', 'color(srgb 1 0 0)']) {
    assert.deepEqual(normalizeColor(s), { hex: '#ff0000', alpha: 1, outOfGamut: false }, s);
  }
  assert.equal(normalizeColor('#abcf')?.hex, '#aabbcc', 'alpha ff à 4 chiffres retiré comme en v1');
});

test('normalizeColor : transparence conservée sur 8 chiffres', () => {
  assert.deepEqual(normalizeColor('rgb(255 0 0 / 50%)'), { hex: '#ff000080', alpha: 0.5, outOfGamut: false });
  assert.equal(normalizeColor('rgba(0,0,0,.1)')?.hex, '#0000001a');
});

test('normalizeColor : transparent, currentcolor, var() et texte libre → null', () => {
  for (const s of ['transparent', 'rgba(0,0,0,0)', '#0000', 'currentcolor', 'var(--brand)', 'inherit', '', 'pas une couleur']) {
    assert.equal(normalizeColor(s), null, s);
  }
});

test('normalizeColor : un hexadécimal sRGB ressort identique (non-régression #e0c000 → #e0c001)', () => {
  // Cas qui échouaient quand toute couleur passait par OKLCH pour la mise au gamut.
  for (const [input, hex] of [['#e0c000', '#e0c000'], ['#00ff80', '#00ff80'], ['#00c0c0', '#00c0c0'], ['#ff0', '#ffff00'], ['#0ff', '#00ffff'], ['orange', '#ffa500']]) {
    assert.equal(normalizeColor(input)?.hex, hex, input);
  }
  const h = (/** @type {number} */ n) => n.toString(16).padStart(2, '0');
  const bad = [];
  for (const r of [0, 255]) for (const g of [0, 1, 128, 254, 255]) for (const b of [0, 1, 128, 254, 255]) {
    const hex = `#${h(r)}${h(g)}${h(b)}`;
    if (normalizeColor(hex)?.hex !== hex) bad.push(hex);
  }
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) % 256);
  for (let i = 0; i < 2000; i++) {
    const hex = `#${h(rand())}${h(rand())}${h(rand())}`;
    if (normalizeColor(hex)?.hex !== hex) bad.push(hex);
    if (normalizeColor(`rgb(${parseInt(hex.slice(1, 3), 16)} ${parseInt(hex.slice(3, 5), 16)} ${parseInt(hex.slice(5, 7), 16)})`)?.hex !== hex) bad.push(`rgb ${hex}`);
  }
  assert.deepEqual(bad, []);
});

test('normalizeColor : couleur hors sRGB ramenée dans le gamut et signalée', () => {
  const c = normalizeColor('oklch(0.7 0.3 30)');
  assert.ok(c);
  assert.match(c.hex, /^#[0-9a-f]{6}$/);
  assert.equal(c.outOfGamut, true);
  assert.equal(normalizeColor('oklch(0.5 0.05 250)')?.outOfGamut, false);
});

test('toLab : valeurs de référence OKLab (B. Ottosson)', () => {
  const [L, a, b] = toLab('#ff0000');
  near(L, 0.62796, 1e-4);
  near(a, 0.22486, 1e-4);
  near(b, 0.12585, 1e-4);
  const w = toLab('#ffffff');
  near(w[0], 1, 1e-4);
  near(w[1], 0, 1e-4);
  near(w[2], 0, 1e-4);
  assert.deepEqual(toLab('#000000'), [0, 0, 0]);
  assert.deepEqual(toLab('#ff000080'), toLab('#ff0000'), 'alpha ignoré comme en v1');
});

test('deltaE : échelle × 100, blanc–noir = 100', () => {
  near(deltaE(toLab('#ffffff'), toLab('#000000')), 100, 1e-2);
  assert.equal(deltaE(toLab('#336699'), toLab('#336699')), 0);
});

// ΔE×100 entre gris, calculés avec toLab :
// 808080–818181 0,34 ; 808080–868686 2,02 ; 808080–8a8a8a 3,36 ; 808080–909090 5,35
// 868686–8a8a8a 1,34 ; 868686–909090 3,33 ; rouge à > 25 de tous.
const SAMPLE = [
  { hex: '#808080', n: 10 },
  { hex: '#868686', n: 2 },
  { hex: '#8a8a8a', n: 2 },
  { hex: '#818181', n: 3 },
  { hex: '#909090', n: 1 },
  { hex: '#ff0000', n: 4 },
  { hex: '#80808080', n: 99 },
];

test('cluster ΔE 2 : glouton par fréquence, seuil strict, couleurs transparentes exclues', () => {
  assert.deepEqual(cluster(SAMPLE, 2), [
    { rep: '#808080', members: ['#808080', '#818181'], n: 13 },
    { rep: '#ff0000', members: ['#ff0000'], n: 4 },
    { rep: '#868686', members: ['#868686', '#8a8a8a'], n: 4 },
    { rep: '#909090', members: ['#909090'], n: 1 },
  ]);
});

test('cluster ΔE 5', () => {
  assert.deepEqual(cluster(SAMPLE, 5), [
    { rep: '#808080', members: ['#808080', '#818181', '#868686', '#8a8a8a'], n: 17 },
    { rep: '#ff0000', members: ['#ff0000'], n: 4 },
    { rep: '#909090', members: ['#909090'], n: 1 },
  ]);
});

test('blend : composition alpha sur fond opaque et transparent', () => {
  assert.equal(blend('#00000080', '#ffffff'), '#7f7f7f');
  assert.equal(blend('#ff0000', '#00ff00'), '#ff0000');
  assert.equal(blend('#00000000', '#123456'), '#123456');
  // a = 128/255 + 128/255 × 127/255 = 0,752 → 191,75 → c0 ; r = 128 / 0,752 = 170,2 → aa ; b = 63,75 / 0,752 = 84,8 → 55
  assert.equal(blend('#ff000080', '#0000ff80'), '#aa0055c0');
});

test('contraste WCAG 2.1 : valeurs de référence', () => {
  near(contrastRatio('#000000', '#ffffff'), 21, 1e-9);
  near(contrastRatio('#ffffff', '#000000'), 21, 1e-9);
  assert.equal(contrastRatio('#336699', '#336699'), 1);
  near(contrastRatio('#767676', '#ffffff'), 4.54, 5e-3);
  near(contrastRatio('#777777', '#ffffff'), 4.48, 5e-3);
  near(relativeLuminance('#ffffff'), 1, 1e-12);
});

test('grand texte et niveaux AA / AAA', () => {
  assert.equal(isLargeText(24, 400), true);
  assert.equal(isLargeText(23.9, 400), false);
  // 14 pt = 18,666… px : 18,66 px n'y est pas (corrigé après la relecture du 11/11/2026).
  assert.equal(isLargeText(18.67, 700), true);
  assert.equal(isLargeText(18.66, 700), false);
  assert.equal(isLargeText(18.67, 600), false);
  assert.deepEqual(wcagLevels(4.48, false), { AA: false, AAA: false });
  assert.deepEqual(wcagLevels(4.48, true), { AA: true, AAA: false });
  assert.deepEqual(wcagLevels(7, false), { AA: true, AAA: true });
});
