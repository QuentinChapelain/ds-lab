// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveBackground } from '../src/rendered/aggregate.js';
import { winner } from '../src/browser/trace.js';
import { blend } from '../src/lib/color.js';

/** @param {Partial<import('../src/browser/rendered.js').RenderedRecord>} r */
const rec = (r) => /** @type {any} */ ({ parent: -1, retained: true, bg: 'rgba(0, 0, 0, 0)', bgImage: false, opacity: '1', ...r });

test('fond effectif : fonds semi-transparents empilés jusqu’au premier opaque', () => {
  const records = [
    rec({ bg: 'rgb(255, 0, 0)' }), // html
    rec({ parent: 0, bg: 'rgb(0, 0, 255)' }), // body, opaque : le fond de html ne compte plus
    rec({ parent: 1, bg: 'rgba(0, 0, 0, 0.2)' }),
    rec({ parent: 2, bg: 'rgba(255, 255, 255, 0.4)' }),
  ];
  const e = effectiveBackground(records, 3);
  assert.equal(e.bg, blend('#ffffff66', blend('#00000033', '#0000ff')));
  assert.deepEqual([e.opacity, e.backgroundImage], [false, false]);
});

test('fond effectif : blanc sans aucun fond, marqueurs opacity et background-image', () => {
  assert.equal(effectiveBackground([rec({}), rec({ parent: 0 })], 1).bg, '#ffffff');
  // opacity : l'élément lui-même ou n'importe quel ancêtre, même au-delà du fond opaque.
  const op = [rec({ opacity: '0.9' }), rec({ parent: 0, bg: 'rgb(0, 0, 0)' }), rec({ parent: 1 })];
  assert.equal(effectiveBackground(op, 2).opacity, true);
  assert.equal(effectiveBackground([rec({}), rec({ parent: 0, opacity: '0.5' })], 1).opacity, true);
  // background-image : seulement sur l'élément ou un ancêtre plus proche que le fond opaque.
  const imgNear = [rec({ bg: 'rgb(0, 0, 0)' }), rec({ parent: 0, bgImage: true })];
  assert.equal(effectiveBackground(imgNear, 1).backgroundImage, true);
  const imgFar = [rec({ bgImage: true }), rec({ parent: 0, bg: 'rgb(0, 0, 0)' }), rec({ parent: 1 })];
  assert.equal(effectiveBackground(imgFar, 2).backgroundImage, false);
});

/** @param {string} origin @param {string} selector @param {object[]} props */
const rule = (origin, selector, props) => ({ rule: { origin, selectorList: { text: selector }, style: { cssProperties: props } } });

test('trace : cascade normale, !important, attribut style, navigateur', () => {
  const entry = {
    inlineStyle: { cssProperties: [{ name: 'color', value: 'red' }] },
    matchedCSSRules: [
      rule('user-agent', 'a', [{ name: 'color', value: '-webkit-link' }, { name: 'cursor', value: 'pointer' }]),
      rule('regular', '.a', [{ name: 'color', value: 'blue', important: true }]),
      rule('regular', '.b', [{ name: 'color', value: 'green' }]),
      rule('regular', '.c', [{ name: 'border', value: '1px solid', longhandProperties: [{ name: 'border-top-width' }] }]),
    ],
  };
  assert.equal(winner(entry, 'color')?.rule.selectorList.text, '.a', '!important d’auteur bat l’attribut style normal');
  assert.equal(winner(entry, 'cursor')?.rule.selectorList.text, 'a', 'navigateur si l’auteur ne déclare rien');
  assert.equal(winner(entry, 'border-top-width')?.rule.selectorList.text, '.c', 'longhand d’un raccourci');
  assert.equal(winner(entry, 'margin-top'), null);
  const noImportant = { ...entry, matchedCSSRules: entry.matchedCSSRules.filter((r) => r.rule.selectorList.text !== '.a') };
  assert.equal(winner(noImportant, 'color')?.inline, true, 'attribut style bat les règles normales');
  const disabled = { matchedCSSRules: [rule('regular', '.x', [{ name: 'color', value: 'red' }]), rule('regular', '.y', [{ name: 'color', value: 'x', parsedOk: false }])] };
  assert.equal(winner(disabled, 'color')?.rule.selectorList.text, '.x', 'déclaration invalide ignorée');
});

test('textGreys : chroma < 0,02 en color seulement, transparence comprise, blanc à part', async () => {
  const { textGreys } = await import('../src/rendered/aggregate.js');
  const ctx = (/** @type {string} */ property, /** @type {number} */ count) => ({ property, count });
  const g = textGreys({
    '#212121': { contexts: [ctx('color', 3), ctx('background-color', 9)] },
    '#00000042': { contexts: [ctx('color', 2)] },
    '#808080': { contexts: [ctx('background-color', 5)] },
    '#1f2a44': { contexts: [ctx('color', 4)] },
    '#ffffff': { contexts: [ctx('color', 6), ctx('background-color', 1)] },
  });
  assert.deepEqual(Object.keys(g.values), ['#212121', '#00000042']);
  assert.equal(g.values['#212121'].count, 3, 'seules les occurrences en color comptent');
  assert.deepEqual([g.total, g.distinct, g.white], [5, 2, 6]);
});

test('R14 : gris de texte sur fond sombre (contraste avec le fond > contraste avec le blanc)', async () => {
  const { createRenderedAggregator } = await import('../src/rendered/aggregate.js');
  const props = (/** @type {string} */ color) => ({
    color, 'font-family': 'x', 'font-size': '16px', 'font-weight': '400', 'line-height': 'normal', 'letter-spacing': 'normal',
    'background-color': 'rgba(0, 0, 0, 0)', opacity: '1',
  });
  const agg = createRenderedAggregator();
  agg.addPage({
    url: 'https://a.test/',
    iframes: 0,
    excluded: 0,
    records: [
      rec({ bg: 'rgb(255, 255, 255)' }), // html
      rec({ parent: 0 }), // body
      rec({ parent: 1, bg: 'rgb(32, 32, 32)' }), // bandeau sombre
      rec({ parent: 2, tag: 'p', selector: 'p', role: 'texte', text: true, props: props('rgb(218, 218, 218)') }), // gris clair sur sombre
      rec({ parent: 1, tag: 'p', selector: 'p', role: 'texte', text: true, props: props('rgb(218, 218, 218)') }), // même gris sur blanc
      rec({ parent: 1, tag: 'p', selector: 'p', role: 'texte', text: true, props: props('rgb(97, 97, 97)') }), // gris foncé sur blanc
    ],
  });
  const g = agg.result().textGreys;
  assert.equal(g.values['#dadada'].count, 2);
  assert.equal(g.values['#dadada'].onDark, 1);
  assert.deepEqual(g.values['#dadada'].darkBackgrounds, { '#202020': 1 });
  assert.equal(g.values['#616161'].onDark, 0);
  assert.equal(g.onDark, 1);
});
