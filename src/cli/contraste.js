#!/usr/bin/env node
// @ts-check
/**
 * Séance 3a, T3 : contrôle des paires de rôles d'Orbe Café.
 * Sort en 1 si une paire est sous son seuil sans exception écrite, sinon en 0.
 * Le contrat par échelle (contractOf) est affiché pour information ; il ne change pas le code de sortie.
 * Usage : npm run contraste [-- --paires <fichier>]
 */
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { loadRoles, contrat } from '../tokens/roles.js';

const { values } = parseArgs({ options: { paires: { type: 'string' } } });
const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const c = contrat(loadRoles(dir, { paires: values.paires }));

const fr = (/** @type {number} */ n) => n.toFixed(2).replace('.', ',');
const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => `${n} ${n > 1 ? many : one}`;

let group = '';
for (const p of c.roles.pairs) {
  const g = p.devant.split('.')[0];
  if (g !== group) console.log(`\n${(group = g)}`);
  const mark = p.ok ? '✓' : p.exception ? '~' : '✗';
  console.log(`  ${mark} ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1, seuil ${fr(p.min)}:1${p.exception ? ` (exception : ${p.exception})` : ''}`);
}

console.log(`\n${plural(c.roles.pairs.length, 'paire', 'paires')} de rôles, ${plural(c.roles.fails.length, 'paire en échec', 'paires en échec')}, ${plural(c.roles.exceptions.length, 'exception écrite', 'exceptions écrites')}.`);
for (const p of c.roles.fails) console.log(`  ✗ ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1 < ${fr(p.min)}:1`);

if (c.echelles.fails.length) {
  console.log(`\nContrat par échelle (contractOf, pour information) : ${plural(c.echelles.fails.length, 'écart', 'écarts')}.`);
  for (const f of c.echelles.fails) console.log(`  · ${f}`);
}
process.exit(c.roles.fails.length ? 1 : 0);
