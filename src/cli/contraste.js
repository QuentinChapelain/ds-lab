#!/usr/bin/env node
// @ts-check
/**
 * Séance 3a, T3 : contrôle des paires de rôles d'Orbe Café.
 * Sort en 1 si une paire est sous son seuil sans exception écrite, sinon en 0.
 * Le contrat par échelle (contractOf) est affiché pour information ; il ne change pas le code de sortie.
 * Étape 4, séance a : --marque <dossier> contrôle la marque de ce dossier ; sans l'option, Orbe Café.
 * Étape 4, séance b : la marque se lit par son resolver (marque.resolver.json), avec les couches communes de tokens/commun/.
 * Usage : npm run contraste [-- --paires <fichier>] [--marque <dossier>]
 */
import { parseArgs } from 'node:util';
import { loadRoles, contrat } from '../tokens/roles.js';
import { ORBE } from '../tokens/resolver.js';

const { values } = parseArgs({ options: { paires: { type: 'string' }, marque: { type: 'string' } } });
const c = contrat(loadRoles(values.marque ?? ORBE, { paires: values.paires }));

const fr = (/** @type {number} */ n) => n.toFixed(2).replace('.', ',');
const plural = (/** @type {number} */ n, /** @type {string} */ one, /** @type {string} */ many) => `${n} ${n > 1 ? many : one}`;

let group = '';
for (const p of c.roles.pairs) {
  const g = p.devant.split('.')[0];
  if (g !== group) console.log(`\n${(group = g)}`);
  const mark = p.ok ? '✓' : p.exception ? '~' : '✗';
  console.log(`  ${mark} ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1, seuil ${fr(p.min)}:1${p.exception ? ` (exception : ${p.exception})` : ''}`);
}

console.log(`\n${plural(c.roles.pairs.length, 'paire', 'paires')} de rôles, ${plural(c.roles.fails.length, 'paire en échec', 'paires en échec')}, ${plural(c.roles.exceptions.length, 'exception écrite', 'exceptions écrites')}, ${plural(c.roles.interdites.length, 'paire interdite', 'paires interdites')}.`);
for (const p of c.roles.fails) console.log(`  ✗ ${p.devant} sur ${p.fond} : ${fr(p.ratio)}:1 < ${fr(p.min)}:1`);
for (const p of c.roles.interdites) console.log(`  ⊘ ${p.devant} sur ${p.fond} (${fr(p.ratio)}:1) : interdite, ${p.regle}`);

if (c.echelles.fails.length) {
  console.log(`\nContrat par échelle (contractOf, pour information) : ${plural(c.echelles.fails.length, 'écart', 'écarts')}.`);
  for (const f of c.echelles.fails) console.log(`  · ${f}`);
}
process.exit(c.roles.fails.length ? 1 : 0);
