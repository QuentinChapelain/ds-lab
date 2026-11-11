// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPx, toMs, splitSpaces, splitCommas } from '../src/lib/units.js';

test('toPx : unités absolues et rem', () => {
  /** @type {[string, number, number?][]} */
  const cases = [
    ['16px', 16],
    ['1.5rem', 24],
    ['1.5rem', 15, 10],
    ['.5rem', 8],
    ['12pt', 16],
    ['1pc', 16],
    ['1in', 96],
    ['10mm', 37.8],
    ['1.234px', 1.23],
    ['0', 0],
    ['-0px', 0],
    ['-4px', -4],
    [' 2PX ', 2],
  ];
  for (const [v, px, rootPx] of cases) {
    const r = toPx(v, { rootPx });
    assert.equal(r.px, px, v);
    assert.equal(r.normalizable, true, v);
    assert.equal(r.key, `${px}px`, v);
  }
});

test('toPx : valeurs dépendantes du contexte gardées brutes', () => {
  for (const v of ['1em', '50%', '2vw', '3ch', 'var(--space)', 'calc(1rem + 2px)', 'auto', '1.5', 'normal']) {
    const r = toPx(v);
    assert.equal(r.px, null, v);
    assert.equal(r.normalizable, false, v);
    assert.equal(r.key, v.toLowerCase(), v);
  }
  assert.equal(toPx('1EM').unit, 'em');
  assert.equal(toPx('1.5').unit, '');
  assert.equal(toPx('var(--x)').unit, null);
});

test('toMs : secondes et millisecondes', () => {
  assert.equal(toMs('.2s').ms, 200);
  assert.equal(toMs('300ms').ms, 300);
  assert.equal(toMs('1.5S').ms, 1500);
  assert.equal(toMs('0s').key, '0ms');
  assert.equal(toMs('var(--duree)').normalizable, false);
  assert.equal(toMs('var(--duree)').key, 'var(--duree)');
});

test('splitSpaces / splitCommas : découpe au premier niveau seulement', () => {
  assert.deepEqual(splitSpaces('4px  calc(1rem + 2px) 0'), ['4px', 'calc(1rem + 2px)', '0']);
  assert.deepEqual(splitCommas('color .2s, transform 300ms cubic-bezier(.2,0,0,1)'), [
    'color .2s',
    'transform 300ms cubic-bezier(.2,0,0,1)',
  ]);
  assert.deepEqual(splitCommas('"Orbe Sans, Display", serif'), ['"Orbe Sans, Display"', 'serif']);
  assert.deepEqual(splitCommas(''), []);
});
