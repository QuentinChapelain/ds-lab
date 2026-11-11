// @ts-check
/**
 * Vérifie fixtures/marque-demo/expected.json lui-même, sans le code de l'outil :
 * - chaque chiffre a son « how » ;
 * - chaque valeur marquée « verify » est recalculée avec culori (indépendant de src/) ;
 * - les sommes, regroupements et niveaux WCAG sont cohérents entre eux.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse, formatHex, formatHex8, blend, wcagContrast, differenceEuclidean } from 'culori';

const expected = JSON.parse(
  await readFile(new URL('../fixtures/marque-demo/expected.json', import.meta.url), 'utf8'),
);
const dOklab = differenceEuclidean('oklab');

/**
 * @param {any} node
 * @param {string} path
 * @param {(node: any, path: string) => void} visit
 */
function walk(node, path, visit) {
  if (node && typeof node === 'object') {
    visit(node, path);
    for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`, visit);
  }
}

test('expected.json : chaque chiffre a un « how » non vide', () => {
  /** @type {string[]} */
  const missing = [];
  walk(expected, '$', (n, p) => {
    if (!Array.isArray(n) && 'value' in n && !(typeof n.how === 'string' && n.how.trim())) missing.push(p);
  });
  assert.deepEqual(missing, []);
});

test('expected.json : valeurs « verify » recalculées avec culori', () => {
  let checked = 0;
  walk(expected, '$', (n, p) => {
    if (!n.verify) return;
    const { culori: fn, args, result } = n.verify;
    for (const a of args) assert.ok(n.how.includes(a), `${p} : how doit citer ${a}`);
    if (fn === 'formatHex8') assert.equal(formatHex8(parse(args[0])), result, p);
    else if (fn === 'blendOver') assert.equal(formatHex(blend([args[0], args[1]], 'normal', 'rgb')), result, p);
    else if (fn === 'deltaE100') assert.ok(Math.abs(100 * dOklab(args[0], args[1]) - n.value) < 5e-5, p);
    else if (fn === 'wcagContrast') assert.ok(Math.abs(wcagContrast(args[0], args[1]) - n.ratio) < 5e-5, p);
    else assert.fail(`${p} : fonction inconnue ${fn}`);
    if (fn === 'formatHex8' || fn === 'blendOver') assert.ok(n.how.includes(result), `${p} : how doit citer ${result}`);
    checked++;
  });
  assert.equal(checked, 17, '2 hex8 + 4 ΔE + 1 fusion + 10 contrastes');
});

test('expected.json : totaux = somme des valeurs, contextes = valeur, pages = contexte', () => {
  for (const side of ['declared', 'rendered']) {
    for (const [family, f] of Object.entries(expected[side])) {
      if (!f || typeof f !== 'object' || !f.values) continue;
      const vals = Object.values(f.values);
      const sum = vals.reduce((s, v) => s + v.value, 0);
      assert.equal(sum, f.total.value, `${side}.${family} : somme ${sum} ≠ total ${f.total.value}`);
      if (f.distinct) assert.equal(vals.length, f.distinct.value, `${side}.${family}.distinct`);
      for (const [key, v] of Object.entries(f.values)) {
        if (v.originals) {
          const s = Object.values(v.originals).reduce((t, o) => t + /** @type {any} */ (o).value, 0);
          assert.equal(s, v.value, `${side}.${family}.${key}.originals`);
        }
        if (v.contexts) {
          const s = v.contexts.reduce((/** @type {number} */ t, /** @type {any} */ c) => t + c.count.value, 0);
          assert.equal(s, v.value, `${side}.${family}.${key}.contexts`);
          for (const c of v.contexts) {
            const pages = Object.values(c.pages).reduce((/** @type {number} */ t, /** @type {any} */ x) => t + x, 0);
            assert.equal(pages, c.count.value, `${side}.${family}.${key} ${c.property}/${c.role} : pages`);
            assert.ok(c.selectors.length >= 1 && c.selectors.length <= 3, `${side}.${family}.${key} : 1 à 3 sélecteurs`);
          }
        }
      }
    }
  }
});

test('expected.json : couleurs opaques, transparentes et groupes ΔE cohérents', () => {
  for (const side of ['declared', 'rendered']) {
    const c = expected[side].colors;
    const keys = Object.keys(c.values);
    const opaque = keys.filter((k) => /^#[0-9a-f]{6}$/.test(k));
    assert.equal(opaque.length, c.opaque.value, `${side} opaque`);
    if (c.translucent) assert.equal(keys.length - opaque.length, c.translucent.value, `${side} translucent`);
    if (c.opaqueOnce) assert.equal(opaque.filter((k) => c.values[k].value === 1).length, c.opaqueOnce.value);
    for (const g of ['groupsDE2', 'groupsDE5']) {
      const groups = c[g].groups;
      const singles = c[g].singletons ?? opaque.filter((k) => !groups.some((/** @type {any} */ x) => x.members.includes(k)));
      assert.equal(groups.length + singles.length, c[g].value, `${side}.${g}`);
      const all = [...groups.flatMap((/** @type {any} */ x) => x.members), ...singles].sort();
      assert.deepEqual(all, [...opaque].sort(), `${side}.${g} : chaque opaque une seule fois`);
      for (const x of groups) {
        const n = x.members.reduce((/** @type {number} */ t, /** @type {string} */ m) => t + c.values[m].value, 0);
        assert.equal(n, x.n, `${side}.${g} ${x.rep} : n`);
      }
    }
  }
});

test('expected.json : regroupements ΔE confirmés par les distances culori', () => {
  // Distances culori entre couleurs opaques du déclaré : aucune paire < 5 hors celles listées.
  const opaque = Object.keys(expected.declared.colors.values).filter((k) => /^#[0-9a-f]{6}$/.test(k));
  const listed = new Set(expected.declared.colors.deltaE.pairs.map((/** @type {any} */ p) => [p.a, p.b].sort().join()));
  for (let i = 0; i < opaque.length; i++)
    for (let j = i + 1; j < opaque.length; j++) {
      const v = 100 * dOklab(opaque[i], opaque[j]);
      if (v < 5) assert.ok(listed.has([opaque[i], opaque[j]].sort().join()), `paire non listée ${opaque[i]}–${opaque[j]} (${v})`);
    }
});

test('expected.json : contraste, occurrences et niveaux WCAG cohérents', () => {
  const { pairs, pairsTotal, occurrencesTotal } = expected.contrast;
  assert.equal(pairs.length, pairsTotal.value);
  assert.equal(pairs.reduce((/** @type {number} */ t, /** @type {any} */ p) => t + p.n, 0), occurrencesTotal.value);
  assert.equal(occurrencesTotal.value, expected.rendered.textBearing.value);
  for (const p of pairs) {
    const normal = p.n - p.nLarge;
    const belowAA = (p.ratio < 4.5 ? normal : 0) + (p.ratio < 3 ? p.nLarge : 0);
    const belowAAA = (p.ratio < 7 ? normal : 0) + (p.ratio < 4.5 ? p.nLarge : 0);
    assert.equal(p.belowAA, belowAA, `${p.text}/${p.bg} belowAA`);
    assert.equal(p.belowAAA, belowAAA, `${p.text}/${p.bg} belowAAA`);
    const u = p.uncertain?.value ?? 0;
    assert.ok(u <= p.n, `${p.text}/${p.bg} : uncertain ≤ n`);
    assert.equal(p.flag === '[V]', u > 0, `${p.text}/${p.bg} : [V] si et seulement si une occurrence est incertaine`);
    if (p.uncertain) {
      const r = Object.values(p.uncertain.reasons).reduce((/** @type {number} */ t, /** @type {any} */ x) => t + x, 0);
      assert.ok(r >= u, `${p.text}/${p.bg} : chaque occurrence incertaine a au moins une raison`);
    }
  }
});

test('expected.json : clés v1 des tailles rendues = Math.round des valeurs exactes', () => {
  const f = expected.rendered.fontSizes;
  /** @type {Record<string, number>} */
  const fromExact = {};
  for (const [k, v] of Object.entries(f.values)) {
    const key = `${Math.round(parseFloat(k))}px`;
    fromExact[key] = (fromExact[key] ?? 0) + /** @type {any} */ (v).value;
  }
  /** @type {Record<string, number>} */
  const listed = {};
  for (const [k, v] of Object.entries(f.v1Keys)) if (k !== '$comment') listed[k] = /** @type {any} */ (v).value;
  assert.deepEqual(listed, fromExact);
});
