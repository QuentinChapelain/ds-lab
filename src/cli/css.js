#!/usr/bin/env node
// @ts-check
/**
 * Feuille CSS complète des jetons d'une marque, tous contextes, écrite par Terrazzo dans tokens/<marque>/jetons.css
 * (feuilleCss, src/tokens/css.js ; D36).
 * --marque <dossier> écrit la feuille de cette marque ; sans l'option, celle de chaque marque de tokens/ (D26), un bloc
 * par marque (parMarque).
 * Issues (D18) : 0 feuilles écrites ou inchangées ; 1 une marque refusée, motif affiché (sombre et étroit changent un
 * même jeton, ou Terrazzo et le lecteur diffèrent), sa feuille n'est pas écrite ; 2 panne (option inconnue, resolver
 * absent ou illisible, erreur de Terrazzo), rien n'est écrit. Les feuilles s'écrivent une fois toutes les marques lues.
 * Usage : npm run css [-- --marque <dossier>]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { feuilleCss, FEUILLE } from '../tokens/css.js';
import { lancer, parMarque } from './garde.js';

await lancer('css', async () => {
  const { values } = parseArgs({ options: { marque: { type: 'string' } } });
  /** @type {[string, string][]} chemin et texte, écrits une fois toutes les marques lues */
  const aEcrire = [];
  const code = await parMarque(values.marque, async (dossier) => {
    const r = await feuilleCss(dossier);
    if (!r.texte) {
      for (const m of r.motifs) console.log(`✗ ${m}`);
      return 1;
    }
    const chemin = join(dossier, FEUILLE);
    const inchangee = existsSync(chemin) && readFileSync(chemin, 'utf8') === r.texte;
    console.log(`✓ ${FEUILLE} ${inchangee ? 'inchangée' : 'écrite'}`);
    if (!inchangee) aEcrire.push([chemin, r.texte]);
    return 0;
  });
  for (const [chemin, texte] of aEcrire) writeFileSync(chemin, texte);
  return code;
});
