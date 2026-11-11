// @ts-check
/**
 * Bout en bout, partie rendue : styles calculés, contextes, contraste, trace
 * et iframes, comparés à fixtures/marque-demo/expected.json (jamais recalé).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
import { measureRendered } from '../src/rendered/run.js';
import { loadSources } from '../src/lib/sources.js';

const expected = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected.json', import.meta.url), 'utf8'));
const E = expected.rendered;
const [VW, VH] = expected.conditions.viewport.split('x').map(Number);

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('playwright-core').Browser} */
let browser;
/** @type {ReturnType<ReturnType<typeof createRenderedAggregator>['result']>} */
let R;
/** @type {Record<string, number>} */
const iframesByPath = {};
let cadresIframes = -1;
/** @type {any} */
let untraced;

/** @param {string} url */
const pathOf = (url) => new URL(url).pathname;
/** @param {Record<string, number>} pages */
const byPath = (pages) => Object.fromEntries(Object.entries(pages).map(([u, n]) => [pathOf(u), n]));

before(async () => {
  servers = await startFixtureServers();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: VW, height: VH } });
  const { sources } = await loadSources({ path: `${FIXTURE_DIR}sources.json` });
  const agg = createRenderedAggregator();
  for (const path of expected.conditions.pages) {
    const page = await context.newPage();
    await gotoAndSettle(page, servers.origin + path, { waitMs: 100 });
    const r = await measureRendered(page, agg, { trace: true, sources });
    iframesByPath[path] = r.iframes;
    await page.close();
  }
  R = agg.result();

  const page = await context.newPage();
  await gotoAndSettle(page, `${servers.origin}/cadres.html`, { waitMs: 0 });
  cadresIframes = (await measureRendered(page, createRenderedAggregator())).iframes;
  await page.close();

  const p2 = await context.newPage();
  await gotoAndSettle(p2, `${servers.origin}/page-2.html`, { waitMs: 0 });
  const a2 = createRenderedAggregator();
  await measureRendered(p2, a2);
  untraced = a2.result();
  await p2.close();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {Record<string, any>} values */
const expectedCounts = (values) =>
  Object.fromEntries(Object.entries(values).filter(([k]) => k !== '$comment').map(([k, v]) => [k, v.value]));
/** @param {Record<string, { count: number }>} values */
const counts = (values) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.count]));

test('éléments, pseudo-éléments, exclus, porteurs de texte, rôles', () => {
  assert.equal(R.elements, E.elements.value);
  assert.deepEqual(
    Object.fromEntries(Object.entries(R.byPage).map(([u, s]) => [pathOf(u), s.elements])),
    expectedCounts(E.elements.byPage),
  );
  assert.equal(R.pseudoElements, E.pseudoElements.value);
  assert.equal(R.excluded, E.excluded.value);
  assert.equal(R.textBearing, E.textBearing.value);
  assert.deepEqual(R.roles, E.roles.value);
});

test('iframes comptées par page', () => {
  assert.deepEqual(iframesByPath, expectedCounts(E.iframes.byPage));
  assert.equal(cadresIframes, E.iframes.pageCadres.value);
});

for (const family of Object.keys(E).filter((k) => E[k]?.values)) {
  test(`rendu ${family} : valeurs et total`, () => {
    const got = /** @type {any} */ (R.families)[family];
    assert.ok(got, family);
    assert.deepEqual(counts(got.values), expectedCounts(E[family].values));
    assert.equal(got.total, E[family].total.value, 'total');
    if (E[family].distinct) assert.equal(got.distinct, E[family].distinct.value, 'distinct');
  });

  const withContexts = Object.entries(E[family].values).filter(([, v]) => /** @type {any} */ (v).contexts);
  if (!withContexts.length) continue;
  test(`rendu ${family} : contextes (propriété, rôle, compte, pages, sélecteurs)`, () => {
    for (const [key, v] of withContexts) {
      const got = /** @type {any} */ (R.families)[family].values[key];
      assert.ok(got, `${family} ${key} absent`);
      /** @type {Map<string, any>} */
      const merged = new Map();
      for (const c of got.contexts) {
        // border-*-radius : les quatre longhands sont additionnées (expected.json, rendered.radii.$comment).
        const property = /^border-.*-radius$/.test(c.property) ? 'border-*-radius' : c.property;
        const k = `${property}|${c.role}`;
        const m = merged.get(k) ?? { property, role: c.role, count: 0, pages: {}, selectors: new Set() };
        m.count += c.count;
        for (const [p, n] of Object.entries(byPath(c.pages))) m.pages[p] = (m.pages[p] ?? 0) + n;
        for (const s of c.selectors) m.selectors.add(s);
        merged.set(k, m);
      }
      const gotList = [...merged.values()]
        .map((m) => ({ ...m, selectors: [...m.selectors].sort() }))
        .sort((a, b) => (`${a.property}|${a.role}` < `${b.property}|${b.role}` ? -1 : 1));
      const want = /** @type {any} */ (v).contexts
        .map((/** @type {any} */ c) => ({ property: c.property, role: c.role, count: c.count.value, pages: c.pages, selectors: [...c.selectors].sort() }))
        .sort((/** @type {any} */ a, /** @type {any} */ b) => (`${a.property}|${a.role}` < `${b.property}|${b.role}` ? -1 : 1));
      assert.deepEqual(gotList, want, `${family} ${key}`);
    }
  });
}

test('rendu fontFamilies : écritures calculées', () => {
  for (const [key, v] of Object.entries(E.fontFamilies.values)) {
    assert.deepEqual(R.families.fontFamilies.values[key].originals, expectedCounts(/** @type {any} */ (v).originals));
  }
});

test('rendu fontSizes : clés compatibles v1 (Math.round)', () => {
  assert.deepEqual(/** @type {any} */ (R.families.fontSizes).v1Keys, expectedCounts(E.fontSizes.v1Keys));
});

test('rendu colors : opaques, transparentes, groupes ΔE', () => {
  const c = /** @type {any} */ (R.families.colors);
  assert.equal(c.opaque, E.colors.opaque.value);
  for (const g of ['groupsDE2', 'groupsDE5']) {
    assert.equal(c[g].length, E.colors[g].value, g);
    const multi = c[g]
      .filter((/** @type {any} */ x) => x.members.length > 1)
      .map((/** @type {any} */ x) => ({ rep: x.rep, members: [...x.members].sort(), n: x.n }));
    assert.deepEqual(
      multi,
      E.colors[g].groups.map((/** @type {any} */ x) => ({ rep: x.rep, members: [...x.members].sort(), n: x.n })),
      g,
    );
  }
});

test('contraste : paires, ratios à ± 0,01, niveaux, incertitudes', () => {
  const C = expected.contrast;
  assert.equal(R.contrast.pairs.length, C.pairsTotal.value);
  assert.equal(R.contrast.occurrences, C.occurrencesTotal.value);
  assert.equal(R.contrast.unmeasured, 0);
  for (const want of C.pairs) {
    const got = R.contrast.pairs.find((p) => p.text === want.text && p.bg === want.bg);
    assert.ok(got, `paire ${want.text}/${want.bg} absente`);
    const label = `${want.text}/${want.bg}`;
    assert.ok(Math.abs(got.ratio - want.ratio) <= 0.01, `${label} ratio ${got.ratio} ≠ ${want.ratio}`);
    assert.equal(got.n, want.n, `${label} n`);
    assert.equal(got.nLarge, want.nLarge, `${label} nLarge`);
    assert.equal(got.belowAA, want.belowAA, `${label} belowAA`);
    assert.equal(got.belowAAA, want.belowAAA, `${label} belowAAA`);
    assert.deepEqual([...got.selectors].sort(), [...want.selectors].sort(), `${label} sélecteurs`);
    assert.equal(got.uncertain.value, want.uncertain?.value ?? 0, `${label} incertaines`);
    if (want.uncertain) assert.deepEqual(got.uncertain.reasons, want.uncertain.reasons, `${label} raisons`);
    assert.equal(got.flag, want.flag ?? null, `${label} [V]`);
  }
});

test('--trace-rendered : règle gagnante et source des échantillons', () => {
  for (const ck of E.trace.checks) {
    const v = /** @type {any} */ (R.families)[ck.family].values[ck.value];
    assert.ok(v, `${ck.family} ${ck.value} absent`);
    const ctx = v.contexts.find((/** @type {any} */ c) => c.property === ck.property && c.role === ck.role);
    assert.ok(ctx, `contexte ${ck.family} ${ck.value} ${ck.property}/${ck.role} absent`);
    const t = ctx.trace;
    const label = `${ck.family} ${ck.value} ${ck.property}/${ck.role} (${ck.element})`;
    assert.equal(t.origin, ck.origin, `${label} origin`);
    assert.equal(t.source, ck.source, `${label} source`);
    assert.equal(t.selector, ck.selector, `${label} selector`);
    assert.equal(t.inherited, ck.inherited, `${label} inherited`);
  }
});

test('--trace-rendered désactivée par défaut', () => {
  for (const f of Object.values(untraced.families))
    for (const v of Object.values(/** @type {any} */ (f).values))
      for (const c of /** @type {any} */ (v).contexts) assert.equal(c.trace, undefined);
});
