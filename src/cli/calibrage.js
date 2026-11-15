#!/usr/bin/env node
// @ts-check
/**
 * Étape 4, séance a, lot 3 : table des marques et balayage des teintes près des seuils du cas clair.
 * Écrit calibrage.html (table, boutons rendus, balayage) et calibrage.md (table) dans le dossier de sortie.
 * Ne décide rien, ne change aucun seuil. Avec des marques témoins (vrais sites), la sortie va dans local/.
 * Usage : node src/cli/calibrage.js --sortie <dossier> <entree.json>...
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { colonne, balayage, calibrageHtml, calibrageMd } from '../report/calibrage.js';
import { loadRoles } from '../tokens/roles.js';
import { COMMUN } from '../tokens/saisie.js';

const { values, positionals } = parseArgs({ options: { sortie: { type: 'string' } }, allowPositionals: true });
if (!values.sortie || !positionals.length) {
  console.error('usage : node src/cli/calibrage.js --sortie <dossier> <entree.json>...');
  process.exit(2);
}
const commun = loadRoles(COMMUN);
const cols = positionals.map((f) => colonne({ dossier: dirname(f), entree: JSON.parse(readFileSync(f, 'utf8')) }, commun));
mkdirSync(values.sortie, { recursive: true });
const planches = balayage();
const md = calibrageMd(cols, planches);
writeFileSync(join(values.sortie, 'calibrage.md'), md);
writeFileSync(join(values.sortie, 'calibrage.html'), calibrageHtml(cols, planches));
console.log(md);
console.log(`écrit : ${join(values.sortie, 'calibrage.html')}, ${join(values.sortie, 'calibrage.md')}`);
