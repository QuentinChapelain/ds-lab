#!/usr/bin/env node
// @ts-check
/**
 * Étape 4, séance a, lot 3 : table des marques et balayage des teintes près des seuils du cas clair.
 * Écrit calibrage.html (table, boutons rendus, balayage) et calibrage.md (table) dans le dossier de sortie.
 * Ne décide rien, ne change aucun seuil. Avec des marques témoins (vrais sites), la sortie va dans local/.
 * Usage : node src/cli/calibrage.js --sortie <dossier> <entree.json>...
 * Revue de code du 15/11, lot 1b (D18) : sort en 0, ou en 2 sur une panne (usage, fichier absent ou illisible), par la
 * garde commune (src/cli/garde.js).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { colonne, balayage, calibrageHtml, calibrageMd } from '../report/calibrage.js';
import { chargerCommun } from '../tokens/saisie.js';
import { lancer, lireJson } from './garde.js';

await lancer('calibrage', () => {
  const { values, positionals } = parseArgs({ options: { sortie: { type: 'string' } }, allowPositionals: true });
  if (!values.sortie || !positionals.length) throw new Error('--sortie <dossier> et au moins un fichier d\'entrée sont attendus');
  const commun = chargerCommun();
  const cols = positionals.map((f) => colonne({ dossier: dirname(f), entree: lireJson(f) }, commun));
  mkdirSync(values.sortie, { recursive: true });
  const planches = balayage();
  const md = calibrageMd(cols, planches);
  writeFileSync(join(values.sortie, 'calibrage.md'), md);
  writeFileSync(join(values.sortie, 'calibrage.html'), calibrageHtml(cols, planches));
  console.log(md);
  console.log(`écrit : ${join(values.sortie, 'calibrage.html')}, ${join(values.sortie, 'calibrage.md')}`);
  return 0;
});
