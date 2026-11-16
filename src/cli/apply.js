#!/usr/bin/env node
// @ts-check
/**
 * npm run apply -- --modifications <fichier> --racine <dossier> [--essai] [--reste <fichier>]
 *
 * Lot S : applique aux feuilles d'une copie du site les modifications préparées par reduce
 * (modifications.json, à côté de migration.md). Le HTML n'est pas touché. Une entrée dont la
 * valeur écrite n'est pas celle attendue n'est pas appliquée et sort en écart. reste.md (dans la
 * racine) dit ce qui reste à faire à la main.
 * Revue de code du 15/11, lot 1b (D18) : sort en 0 si tout est appliqué ou déjà appliqué ; en 1 s'il reste au moins un
 * écart (entrée ou commentaire refusé, listé dans reste.md), --essai compris ; en 2 sur une panne (option inconnue,
 * fichier de modifications absent ou illisible, feuille illisible, CSS invalide : rien n'est écrit).
 */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { applyModifications } from '../apply/apply.js';
import { lancer, lireJson } from './garde.js';

const USAGE = `Usage : npm run apply -- --modifications <fichier> --racine <dossier> [options]
  --modifications <fichier>  modifications.json écrit par npm run reduce (avec --tokens)
  --racine <dossier>         copie du site : les feuilles y sont cherchées par leur chemin d'URL
  --essai                    n'écrit rien ; même rapport
  --reste <fichier>          où écrire reste.md (défaut : <racine>/reste.md)
  -h, --help                 cette aide

  Sorties : feuilles modifiées, tokens.css, reste.md (la consigne réduite à ce que le script
  n'a pas fait : lien vers tokens.css, CHANGE AUSSI, unités inconnues, écarts de l'exécution).`;

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      modifications: { type: 'string' },
      racine: { type: 'string' },
      essai: { type: 'boolean', default: false },
      reste: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help || !values.modifications || !values.racine) {
    console.log(USAGE);
    if (values.help) return 0;
    throw new Error('--modifications et --racine sont attendus (npm run apply -- --help)');
  }
  const t0 = Date.now();
  const mods = lireJson(values.modifications);
  const root = resolve(values.racine);
  const r = await applyModifications(mods, { root, dryRun: values.essai, restePath: values.reste ? resolve(values.reste) : undefined });
  const n = (/** @type {string} */ s) => r.results.filter((x) => x.status === s).length;
  const c = (/** @type {string} */ s) => r.comments.filter((x) => x.status === s).length;
  console.log(`${values.essai ? 'Essai (rien n’est écrit) : ' : ''}${n('appliquée')} appliquée(s), ${n('déjà appliquée')} déjà appliquée(s), ${n('écart')} écart(s) sur ${r.results.length} entrée(s)`);
  console.log(`Commentaires : ${c('posé')} posé(s), ${c('déjà posé')} déjà posé(s), ${c('écart')} écart(s)`);
  for (const x of r.results.filter((y) => y.status === 'écart')) console.log(`  écart ${x.at ?? `${x.entry.sheet}:${x.entry.line}`} ${x.entry.selector} ${x.entry.property} (${x.entry.rows.join(', ')}) : ${x.reason}`);
  for (const x of r.comments.filter((y) => y.status === 'écart')) console.log(`  écart (commentaire) ${x.comment.sheet}:${x.comment.line} ${x.comment.selector} : ${x.reason}`);
  console.log(`${values.essai ? 'Seraient écrits' : 'Écrits'} : ${r.written.join(', ') || 'aucun'}${values.essai ? '' : ` ; reste : ${r.resteFile}`}`);
  console.log(`Durée : ${Date.now() - t0} ms`);
  return n('écart') || c('écart') ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await lancer('apply', main);
