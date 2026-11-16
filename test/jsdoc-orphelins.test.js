// @ts-check
/**
 * Revue de code du 15/11, lot 3 (docs/attendus/revue-lot-3-types.md, point 5) : aucun bloc JSDoc à
 * @param n'est suivi d'un autre bloc JSDoc. Un tel bloc ne documente aucune fonction : TypeScript
 * prend le second, et la fonction visée par le premier n'est pas vérifiée par @ts-check.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** @param {string} dir @returns {string[]} */
const jsFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = join(dir, d.name);
    return d.isDirectory() ? jsFiles(p) : d.name.endsWith('.js') ? [p] : [];
  });

/**
 * Lignes (1 = première) des blocs JSDoc à @param suivis, après des blancs seulement, d'un autre bloc JSDoc.
 * @param {string} text
 */
export function orphanBlocks(text) {
  /** @type {number[]} */
  const lines = [];
  for (const m of text.matchAll(/\/\*\*[\s\S]*?\*\//g)) {
    if (!/@param\b/.test(m[0])) continue;
    const end = (m.index ?? 0) + m[0].length;
    if (/^\s*\/\*\*/.test(text.slice(end))) lines.push(text.slice(0, m.index).split('\n').length);
  }
  return lines;
}

test('le repérage trouve un bloc à @param suivi d’un bloc, et rien d’autre', () => {
  const text = [
    '/** @param {string} a */',
    '/** Autre fonction. @param {number} b */',
    'function f(b) {}',
    '/** @typedef {{ x: number }} T */',
    '/** @param {T} t */',
    'function g(t) {}',
    '/** @param {string} c */',
    '',
    'function h(c) {}',
  ].join('\n');
  assert.deepEqual(orphanBlocks(text), [1]);
});

test('aucun bloc JSDoc à @param de src/ n’est suivi d’un autre bloc JSDoc', () => {
  const found = jsFiles(join(ROOT, 'src')).flatMap((f) => orphanBlocks(readFileSync(f, 'utf8')).map((n) => `${relative(ROOT, f)}:${n}`));
  assert.deepEqual(found, []);
});
