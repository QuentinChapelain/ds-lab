// @ts-check
/**
 * Cas limites issus de la relecture externe : champs, bordures, couleurs
 * peintes hors color/background/border, texte sur image, états, ventilation
 * des pseudo-éléments. Attendus : fixtures/marque-demo/expected-cas-limites.json
 * (écrits avant le code, jamais recalés).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { startFixtureServers } from './helpers/serveur.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
import { measureRendered } from '../src/rendered/run.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-cas-limites.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('playwright-core').Browser} */
let browser;
/** @type {any} */
let R;

before(async () => {
  servers = await startFixtureServers();
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  await gotoAndSettle(page, `${servers.origin}/cas-limites.html`, { waitMs: 100 });
  const agg = createRenderedAggregator();
  await measureRendered(page, agg, { states: true, thirdParty: E.conditions.thirdParty });
  R = agg.result();
  await page.close();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {string} family @param {string} value @param {string} property @param {string} role */
const context = (family, value, property, role) =>
  R.families[family].values[value]?.contexts.find((/** @type {any} */ c) => c.property === property && c.role === role);

test('champs : porteurs de texte et pseudo-élément ::placeholder (R3 bis)', () => {
  assert.equal(R.pseudoElements, E.pseudoElements.value);
  assert.equal(R.textBearing, E.textBearing.value);
  for (const s of E.fontSizes.present) {
    const v = R.families.fontSizes.values[s.value];
    assert.ok(v, `taille ${s.value} absente`);
    assert.ok(v.contexts.some((/** @type {any} */ c) => c.role === s.role), `taille ${s.value} sans rôle ${s.role}`);
  }
});

test('couleurs peintes : champs, bordures par couleur, ombre, contour, soulignement, dégradé, SVG (R5 bis, R6 bis)', () => {
  for (const want of E.colors.present) {
    const c = context('colors', want.value, want.property, want.role);
    assert.ok(c, `${want.value} ${want.property}/${want.role} absent`);
    assert.equal(c.count, want.count, `${want.value} ${want.property} compte`);
    assert.deepEqual(c.selectors, want.selectors, `${want.value} sélecteurs`);
  }
  for (const hex of E.colors.absentAtRest.value) assert.equal(R.families.colors.values[hex], undefined, `${hex} ne doit pas être rendue au repos`);
});

test('ventilation élément / pseudo-élément (R16)', () => {
  for (const [family, want] of /** @type {const} */ ([['colors', E.colors.pseudoOnly.value], ['fontSizes', E.fontSizes.pseudoOnly.value]])) {
    const f = R.families[family];
    const pseudoOnly = Object.entries(f.values).filter(([, v]) => /** @type {any} */ (v).pseudo === /** @type {any} */ (v).count).map(([k]) => k);
    assert.deepEqual(pseudoOnly.sort(), [...want].sort(), family);
    assert.equal(f.distinct - f.distinctWithoutPseudo, want.length, `${family} distinctWithoutPseudo`);
  }
});

test('états forcés : hover, focus, active (R15)', () => {
  const S = R.states;
  assert.equal(S.sampled, E.states.sampled.value);
  for (const want of E.states.action) {
    const c = S.colors[want.value]?.contexts.find(
      (/** @type {any} */ x) => x.state === want.state && x.property === want.property && x.selectors.includes('a.action'),
    );
    assert.ok(c, `${want.state} ${want.value} ${want.property} sur a.action absent`);
  }
  const focus = S.colors['#f0a500'].contexts.filter((/** @type {any} */ x) => x.state === 'focus' && x.property === 'outline-color');
  assert.equal(focus.reduce((/** @type {number} */ t, /** @type {any} */ x) => t + x.count, 0), E.states.focusCount.value);
  assert.deepEqual([...S.onlyInStates].sort(), E.states.onlyInStates.value);
  const v = E.states.survol;
  const voile = S.colors[v.value]?.contexts.find((/** @type {any} */ x) => x.state === v.state && x.property === v.property && x.selectors.includes(v.selector));
  assert.ok(voile, `voile ${v.value} sur ${v.selector} absent (R15 bis)`);
});

test('contraste : texte posé sur un peintre marqué [V] overlap, témoins non marqués (R11 bis)', () => {
  for (const want of E.contrast.pairs) {
    const got = R.contrast.pairs.find((/** @type {any} */ p) => p.text === want.text && p.bg === want.bg);
    const label = `${want.text}/${want.bg}`;
    assert.ok(got, `paire ${label} absente`);
    assert.ok(Math.abs(got.ratio - want.ratio) <= 0.01, `${label} ratio ${got.ratio}`);
    assert.equal(got.n, want.n, `${label} n`);
    assert.equal(got.belowAA, want.belowAA, `${label} sous AA`);
    assert.equal(got.nIcon, want.nIcon, `${label} icônes`);
    assert.equal(got.uncertain.reasons.overlap, want.overlap, `${label} overlap`);
    assert.equal(got.flag, want.flag, `${label} [V]`);
    assert.deepEqual(got.selectors, want.selectors, `${label} sélecteurs`);
  }
});

test('éléments tiers écartés et éléments à opacity 0 exclus (R17, R1 bis)', () => {
  assert.equal(R.thirdParty.elements, E.thirdParty.elements.value);
  assert.deepEqual(Object.keys(R.thirdParty.selectors).sort(), E.thirdParty.selectors.value);
  assert.ok(R.excluded >= E.excludedOpacity.value.length);
  for (const f of Object.values(R.families))
    for (const v of Object.values(/** @type {any} */ (f).values))
      for (const c of /** @type {any} */ (v).contexts)
        for (const sel of c.selectors) assert.ok(!/fantome|tiers-/.test(sel), `${sel} ne doit pas être rendu`);
});
