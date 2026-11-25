#!/usr/bin/env node
// @ts-check
/**
 * npm run reduce -- <adresse> [<chemins…>] --target <cible.json> [options]
 * D18 : sort en 0, ou en 2 sur une panne (page qui tombe, en nommant son étape ;
 * couleur de marque illisible dans la cible ; option inconnue).
 *
 * Une boucle : mesurer le rendu, ranger chaque valeur sur la cible, simuler
 * la table dans le navigateur, produire la page de revue. Les décisions
 * exportées depuis la page se redonnent avec --decisions pour le tour suivant.
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { runReduce } from '../reduce/run.js';
import { compterDecisions } from '../reduce/propose.js';
import { lancer } from './garde.js';

const USAGE = `Usage : npm run reduce -- <adresse> [<chemins…>] --target <cible.json> [options]

  --target <fichier>         échelles cibles : radii, spacing, fontSizes (px), colors ({ name, value })
  --decisions <fichier>      decisions.json exporté depuis revue.html (tour suivant)
  --tokens <fichier>         jetons DTCG de la cible (.tokens.json, ou resolver de la marque, marque.resolver.json) :
                             leurs chemins nomment les lignes de migration.md
  --brand-colors             couleurs de la cible prises dans les jetons de --tokens : la revue ne propose que
                             des nuances de la marque ; rayons, espacements et tailles restent ceux de --target
  --storage-state <fichier>  session enregistrée par npm run login
  --sources <fichier>        fichier de sources (pour thirdParty ; sans lui : aucun fichier lu)
  --viewport <LxH>           fenêtre (défaut : 1366x900)
  --references <dossier>     pour chaque page : <page>.reference.png (pleine page après simulation complète,
                             décisions comprises) et <page>.reference.aria.yml (arbre avant simulation),
                             à comparer ensuite avec npm run verify
  --temoins <adresses>       pages témoins (option répétable, adresses séparées par des virgules, relatives
                             à la première adresse) : hors de la table, la table y est simulée (couplages
                             compris) ; références avec --references ; section « Pages témoins » de migration.md
  --live                     après la revue, ouvre la première adresse dans une fenêtre avec une barre
                             avant / après et un interrupteur par famille ; fermer la fenêtre pour finir
  --out <dossier>            racine des sorties (défaut : local/reductions)
  -h, --help                 cette aide

  Sorties : table.json (proposition et synthèse), revue.html (à ouvrir) et
  migration.md (pour le développeur, lisible sans l'outil) ; avec --tokens,
  modifications.json (pour npm run apply).
  Le site n'est pas modifié : chaque page est chargée une fois, les valeurs sont
  remplacées dans ce navigateur le temps des captures.`;

/** @param {string[]} argv */
export function parseReduceArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      target: { type: 'string' },
      decisions: { type: 'string' },
      tokens: { type: 'string' },
      'brand-colors': { type: 'boolean', default: false },
      'storage-state': { type: 'string' },
      sources: { type: 'string' },
      references: { type: 'string' },
      temoins: { type: 'string', multiple: true },
      viewport: { type: 'string', default: '1366x900' },
      out: { type: 'string', default: 'local/reductions' },
      live: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return { help: true };
  if (!positionals.length) throw new Error('au moins une adresse est attendue');
  if (!values.target) throw new Error('--target <cible.json> est obligatoire : la cible vient d’abord');
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  if (!vp) throw new Error(`--viewport : format LxH attendu (reçu « ${values.viewport} »)`);
  return {
    help: false,
    options: {
      addresses: positionals,
      targetPath: String(values.target),
      decisionsPath: values.decisions,
      tokensPath: values.tokens,
      brandColors: !!values['brand-colors'],
      storageState: values['storage-state'],
      sourcesPath: values.sources,
      referencesPath: values.references,
      temoins: (values.temoins ?? []).flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean),
      viewport: { width: Number(vp[1]), height: Number(vp[2]) },
      outRoot: String(values.out),
      live: !!values.live,
    },
  };
}

async function main() {
  const parsed = parseReduceArgs(process.argv.slice(2));
  if (parsed.help || !parsed.options) {
    console.log(USAGE);
    return 0;
  }
  const results = await runReduce({ ...parsed.options, log: (m) => console.log(m) });
  for (const r of results) {
    console.log(`\n${r.host} : ${r.files.join(', ')}`);
    if (r.references.length) console.log(`  références : ${r.references.join(', ')}`);
    for (const [family, f] of Object.entries(r.table.families)) {
      const s = f.summary;
      console.log(`  ${family} : ${s.before} → ${s.after} valeurs ; ${s.decisions} décision(s), ${s.corrections} correction(s), ${s.near} proche(s), ${s.auto} d'office`);
    }
    // Le même compte que le parcours (D73) : texte sur plein compris.
    const c = compterDecisions(/** @type {any} */ (r.table), r.decisions);
    console.log(`  décisions à trancher : ${c.total}, texte sur plein compris ; ${c.total - c.enAttente} tranchée(s)`);
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await lancer('reduce', main);
