#!/usr/bin/env node
// @ts-check
/**
 * Étape 4, séance a, lot 1 : saisie d'une marque. Lit tokens/<marque>/entree.json, génère les échelles et la couche
 * marque, refuse avec motif (entrée invalide, checkValise, paire de rôles en échec) ou écrit marque.tokens.json
 * (et echelles.tokens.json si une échelle est générée) dans le dossier de l'entrée, puis lance le contrôle de contraste.
 * Sort en 0 si la marque est acceptée, en 1 si elle est refusée (rien n'est écrit), en 2 sur une erreur d'usage.
 * Usage : npm run saisie -- <entree.json>
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { saisir, serialiser } from '../tokens/saisie.js';

const fichier = process.argv[2];
if (!fichier) {
  console.error('usage : npm run saisie -- <entree.json>');
  process.exit(2);
}
const dossier = dirname(fichier);
/** @type {any} */
let entree;
try {
  entree = JSON.parse(readFileSync(fichier, 'utf8'));
} catch (e) {
  console.error(`marque refusée : ${fichier}\n  entrée invalide : ${/** @type {Error} */ (e).message}`);
  process.exit(1);
}
const r = saisir(entree, { dossier });
const nom = typeof entree?.nom === 'string' && entree.nom.trim() ? entree.nom : fichier;
if (r.motifs.length) {
  console.error(`marque refusée : ${nom}`);
  for (const m of r.motifs) console.error(`  ${m}`);
  process.exit(1);
}
writeFileSync(join(dossier, 'marque.tokens.json'), serialiser(r.marque));
const echelles = join(dossier, 'echelles.tokens.json');
if (r.echelles) writeFileSync(echelles, serialiser(r.echelles));
else if (existsSync(echelles)) rmSync(echelles);
console.log(`marque acceptée : ${nom}`);
console.log(`écrit : ${join(dossier, 'marque.tokens.json')}${r.echelles ? `, ${echelles}` : ''}`);
const contraste = fileURLToPath(new URL('./contraste.js', import.meta.url));
const c = spawnSync(process.execPath, [contraste, '--marque', dossier], { stdio: 'inherit' });
process.exit(c.status ?? 1);
