// @ts-check
/**
 * Unités ajoutées après la relecture externe : regroupement à liaison
 * complète, seuil du grand texte, descripteurs @font-face.
 * Attendus : fixtures/marque-demo/expected-cas-limites.json, clé unit.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { cluster, clusterComplete, isLargeText } from '../src/lib/color.js';
import { analyzeDeclared } from '../src/declared/analyze.js';

const U = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-cas-limites.json', import.meta.url), 'utf8')).unit;

test('regroupement à liaison complète : diamètre < seuil, là où le glouton fusionne tout', () => {
  const C = U.clusterComplete;
  assert.equal(cluster(C.colors, 5).length, C.greedyDE5.value);
  const got = clusterComplete(C.colors, 5);
  assert.equal(got.length, C.completeDE5.value);
  for (const want of C.completeDE5.groups) {
    const g = got.find((x) => x.rep === want.rep);
    assert.ok(g, `groupe ${want.rep} absent`);
    assert.deepEqual([...g.members].sort(), [...want.members].sort());
    assert.equal(g.n, want.n);
    assert.ok(Math.abs(g.diameter - want.diameter) < 5e-4, `diamètre ${g.diameter}`);
  }
});

test('regroupement à liaison complète : indépendant des fréquences et de l’ordre d’entrée', () => {
  const hex = (/** @type {number} */ v) => '#' + v.toString(16).padStart(2, '0').repeat(3);
  const ramp = [];
  for (let v = 0x80; v <= 0xff; v += 5) ramp.push(hex(v));
  const partition = (/** @type {{hex:string,n:number}[]} */ list) =>
    clusterComplete(list, 5).map((g) => [...g.members].sort().join(' ')).sort();
  const a = partition(ramp.map((h, i) => ({ hex: h, n: 100 - i })));
  const b = partition([...ramp].reverse().map((h, i) => ({ hex: h, n: i % 3 === 0 ? 200 : 50 - i })));
  assert.deepEqual(a, b);
  for (const g of clusterComplete(ramp.map((h) => ({ hex: h, n: 1 })), 5)) assert.ok(g.diameter < 5);
});

test('grand texte : 14 pt exactement', () => {
  for (const [px, weight, want] of U.largeText.cases) assert.equal(isLargeText(px, weight), want, `${px}px ${weight}`);
});

test('déclaré : les descripteurs de @font-face sont comptés à part', () => {
  const F = U.fontFace;
  const sheet = { id: 0, href: null, inline: true, constructed: false, text: F.css, startLine: 0, via: 'cdp', styleSheetId: 'x', pages: ['http://x/'], hash: 'h' };
  const d = analyzeDeclared(/** @type {any} */ ([sheet]), { rootPx: 16, sources: null });
  assert.equal(d.families.fontFamilies.total, F.fontFamiliesTotal.value);
  assert.deepEqual(Object.fromEntries(Object.entries(d.families.fontWeights.values).map(([k, v]) => [k, v.count])), F.fontWeights.value);
  assert.equal(/** @type {any} */ (d).fontFaces.total, F.fontFaces.value);
});
