#!/usr/bin/env node
// @ts-check
/**
 * npm run reduce -- <adresse> [<chemins…>] --target <cible.json> [options]
 *
 * Une boucle : mesurer le rendu, ranger chaque valeur sur la cible, simuler
 * la table dans le navigateur, produire la page de revue. Les décisions
 * exportées depuis la page se redonnent avec --decisions pour le tour suivant.
 */
import { parseArgs } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { createRenderedAggregator } from '../rendered/aggregate.js';
import { measureRendered } from '../rendered/run.js';
import { propose, mapping } from '../reduce/propose.js';
import { simulatePage } from '../browser/simulate.js';
import { renderReview } from '../report/review.js';
import { stampOf, freeOutputDir } from '../report/json.js';

const USAGE = `Usage : npm run reduce -- <adresse> [<chemins…>] --target <cible.json> [options]

  --target <fichier>         échelles cibles : radii, spacing, fontSizes (px), colors ({ name, value })
  --decisions <fichier>      decisions.json exporté depuis revue.html (tour suivant)
  --storage-state <fichier>  session enregistrée par npm run login
  --sources <fichier>        fichier de sources (pour thirdParty ; défaut : local/sources.json)
  --viewport <LxH>           fenêtre (défaut : 1366x900)
  --out <dossier>            racine des sorties (défaut : local/reductions)
  -h, --help                 cette aide

  Sorties : table.json (proposition et synthèse) et revue.html (à ouvrir).
  Le site n'est pas modifié : chaque page est chargée une fois, les valeurs sont
  remplacées dans ce navigateur le temps des captures.`;

/**
 * @typedef {object} ReduceOptions
 * @property {string[]} addresses
 * @property {string} targetPath
 * @property {string} [decisionsPath]
 * @property {string} [storageState]
 * @property {string} [sourcesPath]
 * @property {{ width: number, height: number }} [viewport]
 * @property {number} [waitMs]
 * @property {string} [outRoot]
 * @property {Date} [now]
 * @property {(msg: string) => void} [log]
 */

/**
 * @param {ReduceOptions} opts
 * @returns {Promise<{ host: string, dir: string, files: string[], table: ReturnType<typeof propose> }[]>}
 */
export async function runReduce(opts) {
  const { viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, outRoot = 'local/reductions', now = new Date(), log = () => {} } = opts;
  const target = JSON.parse(await readFile(opts.targetPath, 'utf8'));
  /** @type {Record<string, string | false>} */
  const decisions = opts.decisionsPath ? JSON.parse(await readFile(opts.decisionsPath, 'utf8')) : {};
  const { sources } = await loadSources({ path: opts.sourcesPath });
  const urls = resolveAddresses(opts.addresses);
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const [host, hostUrls] of groupByHost(urls)) {
      const context = await browser.newContext({ viewport, storageState: opts.storageState ?? undefined });
      const agg = createRenderedAggregator();
      // Tour 1 : mesurer, pour proposer la table sur l'ensemble des pages.
      for (const url of hostUrls) {
        log(`mesure → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          await measureRendered(page, agg, { thirdParty: sources?.thirdParty ?? [], sources });
        } finally {
          await page.close().catch(() => {});
        }
      }
      const table = propose(agg.result(), target);
      const map = mapping(table, decisions);
      // Tour 2 : simuler la table, page par page.
      const pages = [];
      for (const url of hostUrls) {
        log(`simulation → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          pages.push(await simulatePage(page, map));
        } finally {
          await page.close().catch(() => {});
        }
      }
      await context.close();
      const stamp = stampOf(now);
      const dir = await freeOutputDir(outRoot, host, stamp);
      await mkdir(dir, { recursive: true });
      const files = [join(dir, 'table.json'), join(dir, 'revue.html')];
      await writeFile(files[0], JSON.stringify({ host, stamp, viewport, target, decisions, table, pages: pages.map((p) => ({ url: p.url, elements: p.elements, operations: p.operations })) }, null, 2) + '\n');
      await writeFile(files[1], renderReview(table, pages, { host, stamp, target: opts.targetPath.split('/').pop() ?? '', decisions }));
      results.push({ host, dir, files, table });
    }
  } finally {
    await browser.close();
  }
  return results;
}

/** @param {string[]} argv */
export function parseReduceArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      target: { type: 'string' },
      decisions: { type: 'string' },
      'storage-state': { type: 'string' },
      sources: { type: 'string' },
      viewport: { type: 'string', default: '1366x900' },
      out: { type: 'string', default: 'local/reductions' },
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
      storageState: values['storage-state'],
      sourcesPath: values.sources,
      viewport: { width: Number(vp[1]), height: Number(vp[2]) },
      outRoot: String(values.out),
    },
  };
}

async function main() {
  let parsed;
  try {
    parsed = parseReduceArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`Erreur : ${/** @type {Error} */ (e).message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (parsed.help || !parsed.options) {
    console.log(USAGE);
    return;
  }
  const results = await runReduce({ ...parsed.options, log: (m) => console.log(m) });
  for (const r of results) {
    console.log(`\n${r.host} : ${r.files.join(', ')}`);
    for (const [family, f] of Object.entries(r.table.families)) {
      const s = f.summary;
      console.log(`  ${family} : ${s.before} → ${s.after} valeurs ; ${s.decisions} décision(s), ${s.near} proche(s), ${s.auto} d'office`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`Erreur : ${e.message}`);
    process.exit(1);
  });
}
