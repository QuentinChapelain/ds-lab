#!/usr/bin/env node
// @ts-check
/**
 * Thèmes Vuetify d'une marque, clair et sombre, écrits dans tokens/<marque>/vuetify.json depuis ses jetons résolus et
 * la table commune tokens/commun/vuetify.json (themesVuetify, src/tokens/vuetify.js ; D41).
 * --marque <dossier> écrit les thèmes de cette marque ; sans l'option, ceux de chaque marque de tokens/ (D26), un bloc
 * par marque (parMarque).
 * Issues (D18) : 0 thèmes écrits ou inchangés ; 2 panne (option inconnue, resolver absent ou illisible, table fausse :
 * paire hors de paires.json, clé en on-, rôle ou jeton absent), rien n'est écrit. La commande ne juge rien : le
 * contraste des paires de la table est celui de npm run contraste. Les fichiers s'écrivent une fois toutes les marques lues.
 * Usage : npm run vuetify [-- --marque <dossier>]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { texteThemes, lireTable, THEMES } from '../tokens/vuetify.js';
import { lancer, parMarque } from './garde.js';

await lancer('vuetify', async () => {
  const { values } = parseArgs({ options: { marque: { type: 'string' } } });
  const table = lireTable();
  /** @type {[string, string][]} chemin et texte, écrits une fois toutes les marques lues */
  const aEcrire = [];
  const code = await parMarque(values.marque, async (dossier) => {
    const texte = texteThemes(dossier, table);
    const chemin = join(dossier, THEMES);
    const inchange = existsSync(chemin) && readFileSync(chemin, 'utf8') === texte;
    console.log(`✓ ${THEMES} ${inchange ? 'inchangé' : 'écrit'}`);
    if (!inchange) aEcrire.push([chemin, texte]);
    return 0;
  });
  for (const [chemin, texte] of aEcrire) writeFileSync(chemin, texte);
  return code;
});
