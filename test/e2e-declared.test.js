// @ts-check
/**
 * Bout en bout, partie déclarée : Chromium charge les deux pages de
 * fixtures/marque-demo, l'outil collecte et analyse les feuilles, et le
 * résultat est comparé à expected.json (écrit à la main, jamais recalé).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { collectSheets } from '../src/browser/sheets.js';
import { dedupeSheets, analyzeDeclared } from '../src/declared/analyze.js';
import { loadSources } from '../src/lib/sources.js';

const expected = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected.json', import.meta.url), 'utf8'));
const E = expected.declared;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('playwright-core').Browser} */
let browser;
/** @type {ReturnType<typeof analyzeDeclared>} */
let result;
/** @type {number[]} */
const rootPxs = [];

before(async () => {
  servers = await startFixtureServers();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const perPage = [];
  for (const path of expected.conditions.pages) {
    const page = await context.newPage();
    const url = servers.origin + path;
    await page.goto(url, { waitUntil: 'load' });
    const { sheets, rootPx, warnings } = await collectSheets(page);
    assert.deepEqual(warnings, []);
    rootPxs.push(rootPx);
    perPage.push({ pageUrl: url, sheets });
    await page.close();
  }
  const { sources } = await loadSources({ path: `${FIXTURE_DIR}sources.json` });
  result = analyzeDeclared(dedupeSheets(perPage), { rootPx: rootPxs[0], sources });
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {Record<string, { count: number }>} values */
const counts = (values) => Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.count]));
/** @param {Record<string, any>} values */
const expectedCounts = (values) =>
  Object.fromEntries(Object.entries(values).filter(([k]) => k !== '$comment').map(([k, v]) => [k, v.value]));
/** @param {string | null} href */
const pathOf = (href) => (href ? new URL(href).pathname : null);

test('rootPx mesuré sur chaque page', () => {
  assert.deepEqual(rootPxs, [expected.conditions.rootPx.value, expected.conditions.rootPx.value]);
});

test('feuilles : 5 feuilles, sources, pages et autre origine', () => {
  assert.equal(result.sheets.length, expected.sheets.total.value);
  const got = result.sheets
    .map((s) => ({
      path: pathOf(s.href),
      source: s.source,
      crossOrigin: s.crossOrigin,
      pages: s.pages.map((p) => new URL(p).pathname).sort(),
    }))
    .sort((a, b) => (a.source < b.source ? -1 : 1));
  const want = expected.sheets.list
    .map((/** @type {any} */ s) => ({ path: s.path, source: s.source, crossOrigin: !!s.crossOrigin, pages: [...s.pages].sort() }))
    .sort((/** @type {any} */ a, /** @type {any} */ b) => (a.source < b.source ? -1 : 1));
  assert.deepEqual(got, want);
});

test('propriétés personnalisées', () => {
  assert.equal(result.customProperties, E.customProperties.value);
});

for (const family of [
  'colors',
  'fontFamilies',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'margins',
  'paddings',
  'gaps',
  'borderWidths',
  'radii',
  'shadows',
  'opacities',
  'durations',
  'timingFunctions',
  'breakpoints',
]) {
  test(`déclaré ${family} : valeurs, total, distinctes, non normalisables`, () => {
    const got = result.families[family];
    const want = E[family];
    assert.deepEqual(counts(got.values), expectedCounts(want.values));
    assert.equal(got.total, want.total.value, 'total');
    if (want.distinct) assert.equal(got.distinct, want.distinct.value, 'distinct');
    assert.equal(got.nonNormalizable, want.nonNormalizable?.value ?? 0, 'nonNormalizable');
  });
}

test('déclaré fontFamilies : écritures d’origine', () => {
  for (const [key, v] of Object.entries(E.fontFamilies.values)) {
    assert.deepEqual(result.families.fontFamilies.values[key].originals, expectedCounts(/** @type {any} */ (v).originals));
  }
});

test('déclaré fontWeights : bold compté comme 700, écriture gardée', () => {
  assert.deepEqual(result.families.fontWeights.values['700'].originals, { 700: 1, bold: 1 });
});

test('déclaré colors : opaques, transparentes, var(), sources', () => {
  const c = /** @type {any} */ (result.families.colors);
  assert.equal(c.opaque, E.colors.opaque.value);
  assert.equal(c.opaqueOnce, E.colors.opaqueOnce.value);
  assert.equal(c.translucent, E.colors.translucent.value);
  assert.equal(c.varReferences, E.colors.varReferences.value);
  const bySource = Object.fromEntries(
    Object.entries(E.colors.bySource)
      .map(([k, v]) => [k, { distinct: /** @type {any} */ (v).distinct.value, occurrences: /** @type {any} */ (v).occurrences.value }])
      .filter(([, v]) => /** @type {any} */ (v).occurrences > 0),
  );
  assert.deepEqual(c.bySource, bySource);
});

for (const g of ['groupsDE2', 'groupsDE5']) {
  test(`déclaré colors ${g} : groupes et membres`, () => {
    const got = /** @type {any} */ (result.families.colors)[g];
    assert.equal(got.length, E.colors[g].value);
    const multi = got
      .filter((/** @type {any} */ x) => x.members.length > 1)
      .map((/** @type {any} */ x) => ({ rep: x.rep, members: [...x.members].sort(), n: x.n }));
    const want = E.colors[g].groups.map((/** @type {any} */ x) => ({ rep: x.rep, members: [...x.members].sort(), n: x.n }));
    assert.deepEqual(multi, want);
  });
}

test('déclaré breakpoints : @media sans largeur', () => {
  assert.equal(/** @type {any} */ (result.families.breakpoints).mediaOther, E.breakpoints.mediaOther.value);
});

test('déclaré : chaque valeur est attribuée à une source connue', () => {
  const labels = new Set(result.sheets.map((s) => s.source));
  for (const f of Object.values(result.families))
    for (const v of Object.values(f.values)) for (const s of Object.keys(v.sources)) assert.ok(labels.has(s), s);
  assert.deepEqual(result.families.letterSpacings.values['1px'].sources, { injecté: 1 });
  assert.deepEqual(result.families.colors.values['#ff00ff'].sources, { inline: 1 });
  assert.deepEqual(result.families.colors.values['#ffffff'].sources, { composants: 3, distant: 1 });
});
