#!/usr/bin/env node
// @ts-check
/**
 * Planches d'Orbe Café, écrites dans tokens/orbe-cafe/ : roles.html (paires de rôles, séance 3a), espacements.html et
 * typo.html (jetons, séance 3c). Revue de code du 15/11, lot 4 : une seule commande pour les trois, par la garde commune
 * (D18) ; une planche inconnue ou une panne sort en 2, sans rien écrire.
 * Usage : node src/cli/planche.js [roles|espacements|typo]...   (sans argument : les trois)
 */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { loadRoles, contratRoles } from '../tokens/roles.js';
import { rolesHtml } from '../report/roles.js';
import { planche as plancheEspacements } from '../report/espacements.js';
import { planche as plancheTypo } from '../report/typo.js';
import { lancer } from './garde.js';

const dir = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
/** Nom de la planche → fichier écrit et page. @type {Record<string, [string, (dir: string) => string]>} */
const PLANCHES = {
  roles: ['roles.html', (d) => rolesHtml(contratRoles(loadRoles(d)))],
  espacements: ['espacements.html', plancheEspacements],
  typo: ['typo.html', plancheTypo],
};

await lancer('planche', async () => {
  const { positionals } = parseArgs({ options: {}, allowPositionals: true });
  for (const p of positionals) if (!(p in PLANCHES)) throw new Error(`planche inconnue : ${p} (${Object.keys(PLANCHES).join(', ')})`);
  // Toutes les pages d'abord : une panne n'écrit rien.
  const pages = (positionals.length ? positionals : Object.keys(PLANCHES)).map((nom) => {
    const [fichier, page] = PLANCHES[nom];
    return [join(dir, fichier), page(dir)];
  });
  for (const [out, html] of pages) {
    await writeFile(out, html);
    console.log(`écrit : ${out}`);
  }
});
