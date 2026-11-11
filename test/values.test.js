// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isGlobalKeyword,
  fontFamilyKey,
  fontWeightKey,
  lineHeightKey,
  lengthOrKeywordKey,
  opacityKey,
  timingKey,
  shadowKey,
  mediaWidths,
} from '../src/lib/values.js';

test('mots-clés globaux', () => {
  for (const k of ['inherit', 'INITIAL', ' unset ', 'revert', 'revert-layer']) assert.equal(isGlobalKeyword(k), true, k);
  for (const k of ['normal', 'auto', 'none', '0']) assert.equal(isGlobalKeyword(k), false, k);
});

test('fontFamilyKey : casse, guillemets et espaces uniformisés', () => {
  assert.equal(fontFamilyKey('"Orbe Sans", Arial, sans-serif').key, 'orbe sans, arial, sans-serif');
  assert.equal(fontFamilyKey("'orbe   sans',arial,  sans-serif").key, 'orbe sans, arial, sans-serif');
  assert.equal(fontFamilyKey('"Orbe, Display", serif').key, 'orbe, display, serif');
  assert.equal(fontFamilyKey('var(--police)').normalizable, false);
});

test('fontWeightKey', () => {
  assert.deepEqual(fontWeightKey('bold'), { key: '700', normalizable: true });
  assert.deepEqual(fontWeightKey('Normal'), { key: '400', normalizable: true });
  assert.deepEqual(fontWeightKey('650'), { key: '650', normalizable: true });
  assert.deepEqual(fontWeightKey('bolder'), { key: 'bolder', normalizable: false });
});

test('lineHeightKey : nombre, longueur, mot-clé', () => {
  assert.equal(lineHeightKey('1.5', 18).key, '1.5');
  assert.equal(lineHeightKey('.5', 18).key, '0.5');
  assert.equal(lineHeightKey('21px', 18).key, '21px');
  assert.equal(lineHeightKey('1.5rem', 18).key, '27px');
  assert.deepEqual(lineHeightKey('normal', 18), { key: 'normal', normalizable: true });
  assert.equal(lineHeightKey('150%', 18).normalizable, false);
});

test('lengthOrKeywordKey', () => {
  assert.deepEqual(lengthOrKeywordKey('auto', 16), { key: 'auto', normalizable: true });
  assert.deepEqual(lengthOrKeywordKey('1.5rem', 18), { key: '27px', normalizable: true });
  assert.deepEqual(lengthOrKeywordKey('2em', 18), { key: '2em', normalizable: false });
});

test('opacityKey', () => {
  assert.equal(opacityKey('.6').key, '0.6');
  assert.equal(opacityKey('60%').key, '0.6');
  assert.equal(opacityKey('1').key, '1');
  assert.equal(opacityKey('var(--o)').normalizable, false);
});

test('timingKey : déclaré et calculé donnent la même clé', () => {
  assert.equal(timingKey('cubic-bezier(.2, 0, 0, 1)').key, 'cubic-bezier(0.2,0,0,1)');
  assert.equal(timingKey('cubic-bezier(0.2, 0, 0, 1)').key, 'cubic-bezier(0.2,0,0,1)');
  assert.equal(timingKey('cubic-bezier(.68,-.6,.32,1.6)').key, 'cubic-bezier(0.68,-0.6,0.32,1.6)');
  assert.equal(timingKey('Ease-In-Out').key, 'ease-in-out');
  assert.equal(timingKey('steps(4, end)').key, 'steps(4,end)');
});

test('shadowKey : déclaré et calculé donnent la même clé', () => {
  const declared = shadowKey('0 2px 4px rgba(0, 0, 0, .15)', 16);
  const computed = shadowKey('rgba(0, 0, 0, 0.15) 0px 2px 4px 0px', 16);
  assert.deepEqual(declared, { key: '0px 2px 4px 0px #00000026', normalizable: true });
  assert.deepEqual(computed, declared);
  assert.equal(shadowKey('inset 0 0 0 1px #FFF, 0 1px 2px black', 16).key, 'inset 0px 0px 0px 1px #ffffff, 0px 1px 2px 0px #000000');
  assert.equal(shadowKey('0 1px .5rem', 16).key, '0px 1px 8px 0px currentcolor');
  assert.equal(shadowKey('none', 16).key, 'none');
  assert.equal(shadowKey('0 2px 4px var(--ombre)', 16).normalizable, false);
  assert.equal(shadowKey('var(--ombre)', 16).normalizable, false);
});

test('mediaWidths : em et rem à 16 px, syntaxe d’intervalle', () => {
  assert.deepEqual(mediaWidths('(min-width: 48em)'), [{ key: '768px', feature: 'min', normalizable: true }]);
  assert.deepEqual(mediaWidths('screen and (min-width:480px) and (max-width: 63.99rem)').map((x) => x.key), ['480px', '1023.84px']);
  assert.deepEqual(mediaWidths('(width >= 768px)'), [{ key: '768px', feature: 'min', normalizable: true }]);
  assert.deepEqual(
    mediaWidths('(400px <= width <= 700px)').map((x) => [x.key, x.feature]),
    [['700px', 'max'], ['400px', 'min']],
  );
  assert.deepEqual(mediaWidths('(prefers-reduced-motion: reduce)'), []);
  assert.deepEqual(mediaWidths('print'), []);
});
