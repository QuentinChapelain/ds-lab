#!/usr/bin/env node
// @ts-check
/**
 * npm run audit -- <adresses> [options]
 *
 * D18 : sort en 0 si toutes les pages sont mesurées ; en 2 sur une panne, ou si l'audit
 * est incomplet (pages non mesurées, trace en panne, script v1 en échec : audit écrit ; aucune page mesurée : rien d'écrit).
 */
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { runAudit } from '../audit/run.js';
import { DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancer } from './garde.js';
import { noterPage } from '../lib/avancement.js';

const USAGE = `Usage : npm run audit -- <adresse> [<adresse ou chemin relatif>…] [options]

  La première adresse est une URL complète ; les suivantes peuvent être
  relatives à elle (/fr/agenda). Une adresse d'un autre hôte donne un audit séparé.

Options :
  --storage-state <fichier>  session enregistrée par npm run login (.auth/<nom>.json)
  --sources <fichier>        motifs d'attribution des feuilles (sans lui : aucun fichier lu, attribution par origine)
  --viewport <LxH>           fenêtre (défaut : 1366x900) ; un audit mesure une seule fenêtre :
                             relancer avec --viewport 390x844 pour la mise en page mobile
  --wait-ms <ms>             délai après load et networkidle (défaut : ${DEFAULT_WAIT_MS})
  --trace-rendered           feuille de la règle gagnante pour chaque contexte rendu (plus lent)
  --no-states                ne pas forcer hover, focus et active sur les éléments interactifs
                             (par défaut : un élément par rôle et sélecteur, 60 au plus par page)
  --v1-script <fichier.md>   exécute le script v1 (bloc js) sur chaque page et compare
  --out <dossier>            racine des sorties (défaut : local/audits)
  --avancement <fichier>     note l'état de chaque page au fil de l'audit (en cours, mesurée, pas mesurée), pour
                             l'écran de la mesure du parcours
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
      'no-states': { type: 'boolean', default: false },
      'v1-script': { type: 'string' },
      out: { type: 'string', default: 'local/audits' },
      avancement: { type: 'string' },
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
      states: !values['no-states'],
      v1ScriptPath: values['v1-script'],
      outRoot: String(values.out),
    },
    avancement: values.avancement,
  };
}

/** @param {number} n @param {string} un @param {string} plusieurs */
const accorde = (n, un, plusieurs) => (n > 1 ? plusieurs : un);

/**
 * D18 : un audit incomplet est une panne. Message d'une ligne, ou null si tout est mesuré.
 * @param {Awaited<ReturnType<typeof runAudit>>} results
 */
export function incomplet(results) {
  const plusieurs = results.length > 1;
  /** @type {string[]} */
  const parts = [];
  for (const r of results) {
    const sur = plusieurs ? ` (${r.host})` : '';
    if (!r.measured) {
      parts.push(`aucune page mesurée${sur} : rien d'écrit`);
      continue;
    }
    const tombees = r.total - r.measured;
    /** @type {string[]} */
    const quoi = [];
    if (tombees) quoi.push(`${tombees} ${accorde(tombees, 'page', 'pages')} sur ${r.total} non ${accorde(tombees, 'mesurée', 'mesurées')}`);
    if (r.traceFailed) quoi.push(`trace en panne sur ${r.traceFailed} ${accorde(r.traceFailed, 'page', 'pages')} sur ${r.total}`);
    if (r.v1Failed) quoi.push(`script v1 en échec sur ${r.v1Failed} ${accorde(r.v1Failed, 'page', 'pages')} sur ${r.total}`);
    if (quoi.length) parts.push(`${quoi.join(', ')}${sur} : audit écrit, incomplet`);
  }
  return parts.length ? parts.join(' ; ') : null;
}

async function main() {
  const parsed = parseAuditArgs(process.argv.slice(2));
  if (parsed.help || !parsed.options) {
    console.log(USAGE);
    return 0;
  }
  const av = parsed.avancement;
  const results = await runAudit({ ...parsed.options, log: (m) => console.log(m), ...(av ? { onPage: (u, e) => noterPage(av, u, e) } : {}) });
  for (const r of results) {
    console.log(`\n${r.host} : ${r.files.join(', ') || 'rien d\'écrit'}`);
    for (const w of r.warnings) console.log(`  ! ${w.text} ${w.tag}`);
  }
  const panne = incomplet(results);
  if (panne) throw new Error(panne);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await lancer('audit', main);
