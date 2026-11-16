#!/usr/bin/env node
// @ts-check
/**
 * Planches d'une marque, écrites dans son dossier tokens/<marque>/ : roles.html (paires de rôles),
 * espacements.html et typo.html (jetons). Une seule commande pour les trois, par
 * la garde commune (D18) ; une planche inconnue ou une panne sort en 2, sans rien écrire.
 * D27 : --marque <dossier> écrit les planches de cette marque ; sans l'option, celles de chaque
 * marque de tokens/ (dossiersDeMarque), même code pour toutes.
 * Usage : node src/cli/planche.js [--marque <dossier>] [roles|espacements|typo]...   (sans planche nommée : les trois)
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { planche as plancheRoles } from '../report/roles.js';
import { planche as plancheEspacements } from '../report/espacements.js';
import { planche as plancheTypo } from '../report/typo.js';
import { dossiersDeMarque } from '../tokens/resolver.js';
import { lancer } from './garde.js';

/** Nom de la planche → fichier écrit et page. @type {Record<string, [string, (dir: string) => string]>} */
const PLANCHES = {
  roles: ['roles.html', plancheRoles],
  espacements: ['espacements.html', plancheEspacements],
  typo: ['typo.html', plancheTypo],
};

await lancer('planche', async () => {
  const { values, positionals } = parseArgs({ options: { marque: { type: 'string' } }, allowPositionals: true });
  for (const p of positionals) if (!(p in PLANCHES)) throw new Error(`planche inconnue : ${p} (${Object.keys(PLANCHES).join(', ')})`);
  const noms = positionals.length ? positionals : Object.keys(PLANCHES);
  // Toutes les pages d'abord, de toutes les marques : une panne n'écrit rien.
  const pages = (values.marque ? [values.marque] : dossiersDeMarque()).flatMap((dir) =>
    noms.map((nom) => {
      const [fichier, page] = PLANCHES[nom];
      return [join(dir, fichier), page(dir)];
    }),
  );
  for (const [out, html] of pages) {
    await writeFile(out, html);
    console.log(`écrit : ${out}`);
  }
});
