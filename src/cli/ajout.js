#!/usr/bin/env node
// @ts-check
/**
 * npm run ajout -- --modifications <fichier> --sortie <dossier> [--origine <adresse>] [options]
 *
 * Feuilles ajoutées (D37) : la migration de modifications.json posée à côté de l'ancien code. Une feuille ajoutée
 * par feuille modifiée, à charger juste après elle, tokens.css avant toutes les feuilles ; pertes.md dit, ligne par
 * ligne, ce qui n'est pas écrit et pourquoi. Le site est lu, jamais écrit : feuilles et pages de la réduction.
 * D18 : sort en 0 si chaque ligne décidée est écrite ; en 1 s'il reste au moins une ligne décidée non écrite ou une
 * ligne hors de modifications.json (listées dans pertes.md) ; en 2 sur une panne (option inconnue, fichier de
 * modifications absent ou illisible, CSS invalide, navigation : rien n'est écrit).
 */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { feuillesAjoutees, ecrireAjouts } from '../apply/ajout.js';
import { lancer } from './garde.js';
import { lireJson } from '../lib/fichiers.js';

const USAGE = `Usage : npm run ajout -- --modifications <fichier> --sortie <dossier> [options]
  --modifications <fichier>  modifications.json écrit par npm run reduce (avec --tokens)
  --sortie <dossier>         où écrire les feuilles ajoutées, tokens.css, pertes.md et feuilles-ajoutees.json
  --origine <adresse>        site intact, servi (défaut : http://<hôte de modifications.json>)
  --viewport <LxH>           fenêtre des pages lues (défaut : 1366x900, celle de la réduction)
  --storage-state <fichier>  session enregistrée par npm run login
  -h, --help                 cette aide

  Chargement : tokens.css avant toutes les feuilles ; chaque <feuille>.ajout.css juste après <feuille>.
  Preuve : npm run verify -- <adresse> --reference <dossier> --ajout <sortie>.`;

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      modifications: { type: 'string' },
      sortie: { type: 'string' },
      origine: { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      'storage-state': { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    console.log(USAGE);
    return 0;
  }
  // D18 : une erreur d'usage est une panne d'une ligne, sans l'aide (-h la donne).
  if (!values.modifications || !values.sortie) throw new Error('--modifications et --sortie sont attendus');
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  if (!vp) throw new Error(`--viewport : format LxH attendu (reçu « ${values.viewport} »)`);
  const mods = lireJson(values.modifications);
  const r = await feuillesAjoutees(mods, {
    origine: values.origine,
    viewport: { width: Number(vp[1]), height: Number(vp[2]) },
    storageState: values['storage-state'],
  });
  const sortie = resolve(values.sortie);
  const ecrits = await ecrireAjouts(r, sortie);
  const c = r.compte;
  console.log(
    `${r.feuilles.length} feuille(s) ajoutée(s), ${c.ecrites} déclaration(s) écrite(s) ; ${c.nonEcrites} ligne(s) décidée(s) non écrite(s), ${c.rattachements} rattachement(s) non fait(s), ${c.horsModifications} ligne(s) hors de modifications.json`,
  );
  for (const x of r.nonEcrites) console.log(`  non écrite ${x.entry.rows.join(', ')} ${x.entry.sheet}:${x.entry.line} ${x.entry.selector} ${x.entry.property} : ${x.cause}`);
  console.log(`Écrits dans ${sortie} : ${ecrits.join(', ')}`);
  return c.nonEcrites || c.horsModifications ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await lancer('ajout', main);
