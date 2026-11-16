// @ts-check
/**
 * Revue de code du 15/11, lot 4 (docs/attendus/revue-lot-4-copies.md, point 8 ; Q5, décision de Quentin du 15/11/2026) :
 * au déclaré, audit.json n'écrit plus le champ `properties` vide des 8 familles qui ne le remplissent pas.
 *
 * Attendu écrit à la main avant le code (16/11/2026), sur les deux feuilles de fixtures/marque-demo/styles/ :
 *   colors, fontFamilies, fontSizes, lineHeights, shadows, radii, durations, timingFunctions (lues par Wallace, sans la
 *     propriété) : aucune valeur ne porte la clé `properties` (aujourd'hui : `properties: {}` partout) ;
 *   fontWeights, letterSpacings, margins, paddings, gaps, borderWidths, opacities, breakpoints (lues par PostCSS) : chaque
 *     valeur garde ses comptes par propriété, non vides, à leur place, entre `sources` et `locations`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeDeclared } from '../src/declared/analyze.js';

const SANS = ['colors', 'fontFamilies', 'fontSizes', 'lineHeights', 'shadows', 'radii', 'durations', 'timingFunctions'];
const AVEC = ['fontWeights', 'letterSpacings', 'margins', 'paddings', 'gaps', 'borderWidths', 'opacities', 'breakpoints'];
const sheets = ['theme.css', 'composants.css'].map((f, id) => ({
  id, href: `https://demo.test/styles/${f}`, inline: false, constructed: false, startLine: 0, via: 'cdp', styleSheetId: String(id), pages: ['https://demo.test/'], hash: f,
  text: readFileSync(new URL(`../fixtures/marque-demo/styles/${f}`, import.meta.url), 'utf8'),
}));
const d = /** @type {any} */ (analyzeDeclared(/** @type {any} */ (sheets), { rootPx: 16, sources: null }));

test('Q5 familles lues sans propriété : pas de clé properties', () => {
  const avec = SANS.flatMap((f) => Object.entries(d.families[f].values).filter(([, e]) => 'properties' in /** @type {any} */ (e)).map(([k]) => `${f} ${k}`));
  assert.ok(SANS.every((f) => Object.keys(d.families[f].values).length), 'chaque famille a des valeurs');
  assert.deepEqual(avec, []);
});

test('Q5 familles lues avec propriété : comptes gardés, à leur place', () => {
  for (const f of AVEC) {
    const values = Object.entries(d.families[f].values);
    assert.ok(values.length, f);
    for (const [k, e] of values) {
      assert.deepEqual(Object.keys(/** @type {any} */ (e)), ['count', 'normalizable', 'originals', 'sources', 'properties', 'locations'], `${f} ${k}`);
      assert.ok(Object.keys(/** @type {any} */ (e).properties).length, `${f} ${k} : properties non vide`);
    }
  }
});
