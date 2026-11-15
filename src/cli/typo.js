#!/usr/bin/env node
// @ts-check
/**
 * Séance 3c, typo : contrôle des styles de texte d'Orbe Café.
 * Sort en 1 si l'une des huit règles n'est pas tenue, sinon en 0. Le rapport de chaque style et les primitives
 * sans rôle sont affichés pour information ; ils ne changent pas le code de sortie.
 * Usage : npm run typo [-- --semantique <fichier>] [--primitives <fichier>] [--marque <fichier>]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { typo, fr } from '../tokens/typo.js';

const { values } = parseArgs({ options: { semantique: { type: 'string' }, primitives: { type: 'string' }, marque: { type: 'string' } } });
const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const read = (/** @type {string} */ p) => JSON.parse(readFileSync(p, 'utf8'));
const r = typo(
  read(values.semantique ?? join(dir, 'semantique.tokens.json')),
  read(values.primitives ?? join(dir, 'primitives.tokens.json')),
  read(values.marque ?? join(dir, 'marque.tokens.json')),
);

const ligne = (/** @type {number} */ n) => fr(Math.round(n * 100) / 100);
const cols = r.styles.map((s) => [
  s.style,
  `${fr(s.large.taille)} / ${ligne(s.large.ligne)} px`,
  `rapport ${fr(s.large.interligne)}`,
  s.etroit ? `étroit ${fr(s.etroit.taille)} / ${ligne(s.etroit.ligne)} px` : '',
  s.etroit ? `rapport ${fr(s.etroit.interligne)}` : '',
  String(s.graisse),
  String(s.police).replace(/^\{marque\.(.*)\}$/, '$1'),
]);
const w = cols[0].map((_, i) => Math.max(...cols.map((c) => c[i].length)));
const sous = r.styles.find((s) => s.sous !== null);
console.log(`styles (taille / ligne en px, rapport sans seuil${sous ? ` ; en étroit sous ${sous.sous} px ${sous.seuil}`.trimEnd() : ''} ; graisse ; police)`);
for (const c of cols) console.log(`  ${c.map((x, i) => x.padEnd(w[i])).join('  ').trimEnd()}`);

console.log('\nrègles');
for (const g of r.regles) {
  console.log(`  ${g.ok ? '✓' : '✗'} ${g.titre}`);
  for (const d of g.details) console.log(`      ${d}`);
}

console.log('\nprimitives sans rôle (affiché, non contrôlé)');
console.log(`  ${r.sansRole.length ? r.sansRole.join(', ') : 'aucune'}`);

const n = r.regles.length;
console.log(`\n${n} règles, ${r.fails.length ? `${r.fails.length} en échec` : 'aucune en échec'}.`);
process.exit(r.fails.length ? 1 : 0);
