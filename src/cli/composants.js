#!/usr/bin/env node
// @ts-check
/**
 * npm run composants -- <adresse> [<chemin>…] [options]
 * npm run composants -- --releve <dossier> [--decisions <fichier>] [--nom <texte>] [--out <dossier>]
 *
 * Constat des composants d'un site (D46) : il ne juge rien. D18 : sort en 0, ou en 2 sur une panne (fichier absent ou
 * illisible, option inconnue, page qui ne se charge pas : constat écrit sans elle ; aucune page relevée : rien d'écrit).
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { runComposants, recalculer } from '../composants/run.js';
import { DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancer } from './garde.js';

const USAGE = `Usage : npm run composants -- <adresse> [<adresse ou chemin relatif>…] [options]
        npm run composants -- --releve <dossier> [--decisions <fichier>] [--nom <texte>] [--out <dossier>]

  Regarde les pages d'une même origine, au repos, et rend un constat de leurs pièces d'interface :
  types, versions, origine, rendu, poids, captures, code ; cinq scores en « x sur y ». Il ne juge rien.

Options :
  --signatures <fichier>     table de signatures d'un framework (config/signatures/vuetify.json) ; répétable ;
                             sans elle : aucun framework reconnu, tout marche pareil
  --decisions <fichier>      décisions du designer : versions à garder, sort des blocs non identifiés
  --releve <dossier>         refaire le constat depuis un relevé écrit (releve.json, captures/), sans navigateur
  --nom <texte>              nom du site affiché dans le constat (défaut : l'hôte de l'adresse)
  --viewport <LxH>           fenêtre (défaut : 1366x900) ; une seule largeur par constat
  --wait-ms <ms>             délai après load et networkidle (défaut : ${DEFAULT_WAIT_MS})
  --storage-state <fichier>  session enregistrée par npm run login (.auth/<nom>.json)
  --out <dossier>            racine des sorties (défaut : local/composants)
  -h, --help                 cette aide`;

/** @param {string[]} argv */
export function parseComposantsArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      signatures: { type: 'string', multiple: true },
      decisions: { type: 'string' },
      nom: { type: 'string' },
      releve: { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      'wait-ms': { type: 'string', default: String(DEFAULT_WAIT_MS) },
      'storage-state': { type: 'string' },
      out: { type: 'string', default: 'local/composants' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return { help: true };
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  if (!vp) throw new Error(`--viewport : format LxH attendu (reçu « ${values.viewport} »)`);
  const waitMs = Number(values['wait-ms']);
  if (!Number.isFinite(waitMs) || waitMs < 0) throw new Error(`--wait-ms : nombre positif attendu (reçu « ${values['wait-ms']} »)`);
  if (values.releve && positionals.length) throw new Error('--releve refait un constat sans navigateur : aucune adresse attendue');
  if (values.releve && values.signatures?.length) throw new Error('--releve : la table de signatures est celle du relevé ; un relevé neuf est à faire pour en changer');
  if (!values.releve && !positionals.length) throw new Error('au moins une adresse est attendue, ou --releve <dossier>');
  return {
    help: false,
    releve: values.releve,
    options: {
      addresses: positionals,
      signatures: values.signatures ?? [],
      decisions: values.decisions,
      nom: values.nom,
      viewport: { width: Number(vp[1]), height: Number(vp[2]) },
      waitMs,
      storageState: values['storage-state'],
      outRoot: String(values.out),
    },
  };
}

async function main() {
  const parsed = parseComposantsArgs(process.argv.slice(2));
  if (parsed.help || !parsed.options) {
    console.log(USAGE);
    return 0;
  }
  const { options } = parsed;
  const r = parsed.releve
    ? await recalculer({ releve: parsed.releve, decisions: options.decisions, nom: options.nom, outRoot: options.outRoot })
    : await runComposants({ ...options, log: (m) => console.log(m) });
  console.log(`\n${r.constat.phrase}`);
  for (const d of r.constat.decisionsSansCible) console.log(`  ! décision sans cible : ${d.texte}`);
  console.log(`\n${r.fichiers.join('\n')}`);
  if (r.tombees.length) throw new Error(`${r.tombees.length} page(s) non relevée(s) : ${r.tombees.join(', ')} ; constat écrit, incomplet`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await lancer('composants', main);
