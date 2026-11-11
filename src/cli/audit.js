#!/usr/bin/env node
// @ts-check
/**
 * npm run audit -- <adresses> [options]
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { runAudit } from '../audit/run.js';
import { DEFAULT_WAIT_MS } from '../browser/navigate.js';

const USAGE = `Usage : npm run audit -- <adresse> [<adresse ou chemin relatif>…] [options]

  La première adresse est une URL complète ; les suivantes peuvent être
  relatives à elle (/fr/agenda). Une adresse d'un autre hôte donne un audit séparé.

Options :
  --storage-state <fichier>  session enregistrée par npm run login (.auth/<nom>.json)
  --sources <fichier>        motifs d'attribution des feuilles (défaut : local/sources.json)
  --viewport <LxH>           fenêtre (défaut : 1366x900)
  --wait-ms <ms>             délai après load et networkidle (défaut : ${DEFAULT_WAIT_MS})
  --trace-rendered           feuille de la règle gagnante pour chaque contexte rendu (plus lent)
  --v1-script <fichier.md>   exécute le script v1 (bloc js) sur chaque page et compare
  --out <dossier>            racine des sorties (défaut : local/audits)
  -h, --help                 cette aide`;

/**
 * @param {string[]} argv
 */
export function parseAuditArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'storage-state': { type: 'string' },
      sources: { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      'wait-ms': { type: 'string', default: String(DEFAULT_WAIT_MS) },
      'trace-rendered': { type: 'boolean', default: false },
      'v1-script': { type: 'string' },
      out: { type: 'string', default: 'local/audits' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) return { help: true };
  const vp = /^(\d+)x(\d+)$/.exec(String(values.viewport));
  if (!vp) throw new Error(`--viewport : format LxH attendu (reçu « ${values.viewport} »)`);
  const waitMs = Number(values['wait-ms']);
  if (!Number.isFinite(waitMs) || waitMs < 0) throw new Error(`--wait-ms : nombre positif attendu (reçu « ${values['wait-ms']} »)`);
  if (!positionals.length) throw new Error('au moins une adresse est attendue');
  return {
    help: false,
    options: {
      addresses: positionals,
      storageState: values['storage-state'],
      sourcesPath: values.sources,
      viewport: { width: Number(vp[1]), height: Number(vp[2]) },
      waitMs,
      trace: !!values['trace-rendered'],
      v1ScriptPath: values['v1-script'],
      outRoot: String(values.out),
    },
  };
}

async function main() {
  let parsed;
  try {
    parsed = parseAuditArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`Erreur : ${/** @type {Error} */ (e).message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (parsed.help || !parsed.options) {
    console.log(USAGE);
    return;
  }
  const results = await runAudit({ ...parsed.options, log: (m) => console.log(m) });
  for (const r of results) {
    console.log(`\n${r.host} : ${r.files.join(', ')}`);
    for (const w of r.warnings) console.log(`  ! ${w.text} ${w.tag}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`Erreur : ${e.message}`);
    process.exit(1);
  });
}
