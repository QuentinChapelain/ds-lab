#!/usr/bin/env node
// @ts-check
/**
 * Séance 3c : contrôle des espacements par relation d'Orbe Café.
 * Sort en 1 si les quatre ecart ne sont pas strictement croissants, sinon en 0.
 * Le rapport entre voisins est affiché pour information ; il ne change pas le code de sortie.
 * Usage : npm run espacements [-- --semantique <fichier>]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { espacements } from '../tokens/espacements.js';

const { values } = parseArgs({ options: { semantique: { type: 'string' } } });
const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const read = (/** @type {string} */ p) => JSON.parse(readFileSync(p, 'utf8'));
const r = espacements(read(values.semantique ?? join(dir, 'semantique.tokens.json')), read(join(dir, 'primitives.tokens.json')));

const fr = (/** @type {number | null} */ n) => (n === null ? '—' : String(n).replace('.', ','));
const w = Math.max(...[...r.ecarts, ...r.horsControle].map((e) => e.role.length));
const line = (/** @type {import('../tokens/espacements.js').Espace} */ e) => `  ${e.role.padEnd(w)}  ${String(e.px).padStart(2)} px  ${e.alias}`;

console.log('ecart (strictement croissants, du plus proche au plus lointain)');
for (const e of r.ecarts) console.log(line(e));
console.log('\nvoisins (rapport affiché, non contrôlé)');
for (const v of r.voisins) console.log(`  ${v.ok ? '✓' : '✗'} ${v.de} < ${v.vers} : ${v.a} → ${v.b} px, rapport ${fr(v.rapport)}`);
console.log('\nhors contrôle');
for (const e of r.horsControle) console.log(line(e));

const n = r.voisins.length;
console.log(`\n${n} ${n > 1 ? 'paires' : 'paire'} de voisins, ${r.fails.length ? `${r.fails.length} en échec` : 'aucune en échec'}.`);
process.exit(r.fails.length ? 1 : 0);
