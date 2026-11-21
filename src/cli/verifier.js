#!/usr/bin/env node
// @ts-check
/**
 * D66 : contrôle des tokens et du style d'un dépôt externe, lancé depuis un clone de ds-lab placé n'importe où.
 * Usage : node <clone>/src/cli/verifier.js --marques <dossier> --style <motif> [--style <motif>…]
 *   --marques <dossier>  chaque sous-dossier qui a un marque.resolver.json (comme npm run contraste --marques) ;
 *   --style <motif>      fichiers des composants de l'équipe, jugés par stylelint.config.mjs du clone (CP3).
 * Juge, dans le processus : contraste dans les quatre contextes, espacements, typo, style. Écrit un en-tête, une ligne
 * par échec qui dit quoi faire (src/report/verifier.js), et un bilan. Sortie 0 sans échec, 1 sinon, 2 sur une panne :
 * option absente, motif sans fichier, dossier sans marque (D18, src/cli/garde.js).
 */
import { parseArgs } from 'node:util';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { lancer, marquesDe } from './garde.js';
import { nomDeMarque } from '../tokens/resolver.js';
import { echecsDeMarque, echecsDeStyle, entete, bilan } from '../report/verifier.js';

const CONFIG = fileURLToPath(new URL('../../stylelint.config.mjs', import.meta.url));
const USAGE = 'node <clone>/src/cli/verifier.js --marques <dossier> --style <motif> [--style <motif>…]';

await lancer('verifier', async () => {
  const { values } = parseArgs({ options: { marques: { type: 'string' }, style: { type: 'string', multiple: true } } });
  if (!values.marques) throw new Error(`--marques <dossier> attendu, le dossier qui contient un sous-dossier par marque ; usage : ${USAGE}`);
  if (!values.style?.length) throw new Error(`--style <motif> attendu, les fichiers des composants (par exemple --style "src/**/*.vue") ; usage : ${USAGE}`);
  const dossiers = marquesDe(undefined, values.marques);
  /** @type {string[]} */
  const fichiers = [];
  for (const motif of values.style) {
    const trouves = globSync(motif, { exclude: (f) => f.includes('node_modules') });
    if (!trouves.length) throw new Error(`--style ${motif} : aucun fichier ; nommer les fichiers des composants, par exemple --style "src/**/*.vue"`);
    fichiers.push(...trouves.map((f) => resolve(f)));
  }
  const uniques = [...new Set(fichiers)].sort();
  console.log(entete(values.marques, dossiers.map(nomDeMarque), uniques.length));
  const echecs = dossiers.flatMap((d) => echecsDeMarque(d));
  const { results } = await stylelint.lint({ files: uniques, configFile: CONFIG });
  echecs.push(...echecsDeStyle(results));
  for (const e of echecs) console.log(e.texte);
  console.log(bilan(echecs));
  return echecs.length ? 1 : 0;
});
