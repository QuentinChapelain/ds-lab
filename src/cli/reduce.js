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
import { propose, mapping, rowKey, controlAfter, splitOf, brandOf, worstContrast } from '../reduce/propose.js';
import { collectSheets } from '../browser/sheets.js';
import { contradictionsIn } from '../brand/brand.js';
import { simulatePage, installLive, captureDecision, touchedElements, FRAME } from '../browser/simulate.js';
import { renderReview } from '../report/review.js';
import { buildMigration } from '../report/migration.js';
import { stampOf, freeOutputDir } from '../report/json.js';

const USAGE = `Usage : npm run reduce -- <adresse> [<chemins…>] --target <cible.json> [options]

  --target <fichier>         échelles cibles : radii, spacing, fontSizes (px), colors ({ name, value })
  --decisions <fichier>      decisions.json exporté depuis revue.html (tour suivant)
  --tokens <fichier>         jetons DTCG de la cible (.tokens.json) : leurs chemins nomment les lignes de migration.md
  --storage-state <fichier>  session enregistrée par npm run login
  --sources <fichier>        fichier de sources (pour thirdParty ; sans lui : aucun fichier lu)
  --viewport <LxH>           fenêtre (défaut : 1366x900)
  --live                     après la revue, ouvre la première adresse dans une fenêtre avec une barre
                             avant / après et un interrupteur par famille ; fermer la fenêtre pour finir
  --out <dossier>            racine des sorties (défaut : local/reductions)
  -h, --help                 cette aide

  Sorties : table.json (proposition et synthèse), revue.html (à ouvrir) et
  migration.md (pour le développeur, lisible sans l'outil).
  Le site n'est pas modifié : chaque page est chargée une fois, les valeurs sont
  remplacées dans ce navigateur le temps des captures.`;

/**
 * @typedef {object} ReduceOptions
 * @property {string[]} addresses
 * @property {string} targetPath
 * @property {string} [decisionsPath]
 * @property {string} [tokensPath]     jetons DTCG de la cible, pour migration.md
 * @property {string} [storageState]
 * @property {string} [sourcesPath]
 * @property {{ width: number, height: number }} [viewport]
 * @property {number} [waitMs]
 * @property {string} [outRoot]
 * @property {boolean} [live]
 * @property {Date} [now]
 * @property {(msg: string) => void} [log]
 */

/**
 * @param {ReduceOptions} opts
 * @returns {Promise<{ host: string, dir: string, files: string[], table: ReturnType<typeof propose>, map: Record<string, any>, first: string, migration: ReturnType<typeof buildMigration>['data'] }[]>}
 */
/**
 * Lot R, R-2 : identifiant et titre de chaque ligne de la table, pour la barre --live.
 * @param {ReturnType<typeof propose>} table
 */
export const linesOf = (table) =>
  Object.entries(table.families).flatMap(([family, f]) => f.rows.filter((r) => r.id).map((r) => ({ key: rowKey(family, r), id: /** @type {string} */ (r.id), title: r.title ?? '' })));

/** Lot R : vignettes des autres éléments touchés par une décision, au plus. */
const THUMBS = 3;
/** Lot R : classes dont les lignes reçoivent des captures par version (5c : avant et après hors décision). */
const CAPTURED = new Set(['décision', 'proche', 'auto', 'correction']);

export async function runReduce(opts) {
  const { viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, outRoot = 'local/reductions', now = new Date(), log = () => {} } = opts;
  const target = JSON.parse(await readFile(opts.targetPath, 'utf8'));
  /** @type {Record<string, string | false>} */
  const decisions = opts.decisionsPath ? JSON.parse(await readFile(opts.decisionsPath, 'utf8')) : {};
  const tokens = opts.tokensPath ? JSON.parse(await readFile(opts.tokensPath, 'utf8')) : null;
  const { sources } = await loadSources({ path: opts.sourcesPath });
  const urls = resolveAddresses(opts.addresses);
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const [host, hostUrls] of groupByHost(urls)) {
      const context = await browser.newContext({ viewport, storageState: opts.storageState ?? undefined });
      const agg = createRenderedAggregator();
      // Lot M (M7) : avec une marque déclarée, feuilles lues pour les replis contraires au back-office.
      const brandSheets = /** @type {any[]} */ ([]);
      const seenSheets = new Set();
      // Tour 1 : mesurer, pour proposer la table sur l'ensemble des pages.
      for (const url of hostUrls) {
        log(`mesure → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          // Lot M : origine CSS (règle d'un élément d'exemple) et états forcés, pour migration.md.
          await measureRendered(page, agg, { trace: true, states: true, thirdParty: sources?.thirdParty ?? [], sources });
          if (target.brand)
            for (const sh of (await collectSheets(page)).sheets) {
              const k = sh.href ?? `${url}#${sh.styleSheetId}`;
              if (seenSheets.has(k)) continue;
              seenSheets.add(k);
              brandSheets.push(sh);
            }
        } finally {
          await page.close().catch(() => {});
        }
      }
      // R6 : les sélecteurs tiers suivent la table, pour que la simulation les exclue.
      const rendered = agg.result();
      const contradictions = target.brand ? contradictionsIn(brandSheets, brandOf(target).variables) : [];
      const table = { ...propose(rendered, target, { contradictions }), thirdParty: sources?.thirdParty ?? [] };
      // Lot P (P3) : la hiérarchie des espaces, recalculée avec les décisions relues.
      controlAfter(table, decisions);
      const map = mapping(table, decisions);
      // Tour 2 : simuler la table, page par page.
      const pages = [];
      for (const url of hostUrls) {
        log(`simulation → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          // Lot R, 5c : les captures par ligne viennent du passage des versions ; ici, pages entières seulement.
          pages.push(await simulatePage(page, { ...map, split: splitOf(table) }, { maxCropped: 0 }));
        } finally {
          await page.close().catch(() => {});
        }
      }
      // Lot R, R-3 : une capture par version de chaque décision, sur la page d'origine ; puis une
      // vignette par autre élément touché (3 au plus), et le relevé de tous les éléments touchés.
      // Lot R, 5c : les lignes proches, d'office et les corrections reçoivent les mêmes captures,
      // en deux versions, « avant » et « après », sans vignettes.
      const pending = Object.entries(table.families).flatMap(([family, f]) =>
        f.rows
          .filter((r) => CAPTURED.has(r.class) && (r.class === 'décision' || (r.new && r.new !== r.old)))
          .map((r) => ({ family, r, decision: r.class === 'décision', others: /** @type {any[]} */ ([]), touched: /** @type {any[]} */ ([]) })),
      );
      // R-8 : captures des versions en densité 2, dans un contexte à part (les pages entières restent en densité 1).
      const sharp = pending.length ? await browser.newContext({ viewport, storageState: opts.storageState ?? undefined, deviceScaleFactor: FRAME.scale }) : null;
      for (const url of sharp ? hostUrls : []) {
        log(`versions → ${url}`);
        const page = await /** @type {any} */ (sharp).newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          for (const x of pending) {
            const { family, r, decision } = x;
            const candidates = decision ? r.candidates : [{ value: /** @type {string} */ (r.new), name: r.name }];
            const d = { key: rowKey(family, r), family, usage: r.usage, mapKey: r.usage ? `${r.old}|${r.usage}${r.scope ? `|${r.scope}` : ''}` : r.old, old: r.old, candidates };
            const here = await touchedElements(page, d, table.thirdParty);
            if (!here.length) continue;
            for (const t of here) x.touched.push({ page: url, selector: t.selector, text: t.text });
            let rest = here.map((t) => t.index);
            if (!r.capture) {
              const c = await captureDecision(page, d, table.thirdParty, decision ? {} : { labels: ['avant', 'après'] });
              if (!c) continue;
              r.capture = c;
              rest = rest.filter((i) => i !== c.element.index);
            }
            for (const i of decision ? rest : []) {
              if (x.others.length >= THUMBS) break;
              const c = await captureDecision(page, d, table.thirdParty, { index: i, compact: true });
              if (c) x.others.push({ ...c, selector: here.find((t) => t.index === i)?.selector });
            }
          }
        } finally {
          await page.close().catch(() => {});
        }
      }
      for (const { r, others, touched } of pending) if (r.capture) Object.assign(r.capture, { elements: touched.length, touched, others });
      // Lot M : sous chaque version de couleur, le contraste le plus défavorable sur toutes les paires
      // de la ligne (toutes pages), pas seulement celui des éléments de la page capturée.
      for (const { family, r } of pending)
        if (family === 'colors')
          for (const v of r.capture?.versions ?? []) {
            const w = worstContrast(rendered.usages, r, v.value, map.colors ?? {});
            if (w) v.contrast = w;
          }
      await sharp?.close();
      await context.close();
      const stamp = stampOf(now);
      const dir = await freeOutputDir(outRoot, host, stamp);
      await mkdir(dir, { recursive: true });
      const files = [join(dir, 'table.json'), join(dir, 'revue.html'), join(dir, 'migration.md')];
      await writeFile(files[0], JSON.stringify({ host, stamp, viewport, target, decisions, table, pages: pages.map((p) => ({ url: p.url, elements: p.elements, operations: p.operations })) }, null, 2) + '\n');
      await writeFile(files[1], renderReview(table, pages, { host, stamp, target: opts.targetPath.split('/').pop() ?? '', decisions }));
      const migration = buildMigration({
        table,
        rendered,
        map,
        target,
        tokens,
        decisions,
        meta: {
          host,
          stamp,
          target: opts.targetPath.split('/').pop() ?? '',
          tokens: opts.tokensPath ? opts.tokensPath.split('/').pop() ?? null : null,
          decisions: opts.decisionsPath ? opts.decisionsPath.split('/').pop() ?? null : null,
          pages: hostUrls.map((u) => new URL(u).pathname),
          viewport,
          // Commande à relancer pour vérifier la migration.
          command: [
            'npm run reduce --',
            q(hostUrls[0]),
            ...hostUrls.slice(1).map((u) => q(new URL(u).pathname)),
            `--target ${q(opts.targetPath)}`,
            opts.tokensPath ? `--tokens ${q(opts.tokensPath)}` : '',
            opts.sourcesPath ? `--sources ${q(opts.sourcesPath)}` : '',
            opts.decisionsPath ? `--decisions ${q(opts.decisionsPath)}` : '',
            `--viewport ${viewport.width}x${viewport.height}`,
          ]
            .filter(Boolean)
            .join(' '),
        },
      });
      await writeFile(files[2], migration.markdown);
      results.push({ host, dir, files, table, map, first: hostUrls[0], migration: migration.data });
    }
  } finally {
    await browser.close();
  }
  if (opts.live && results.length) {
    // Fenêtre visible, sur la première adresse. Aucune boucle : on attend la fermeture.
    const { map, first } = results[0];
    log(`fenêtre ouverte sur ${first} : barre avant / après en bas de page ; fermer la fenêtre pour finir`);
    const headed = await chromium.launch({ headless: false });
    try {
      const context = await headed.newContext({ viewport: null, storageState: opts.storageState ?? undefined });
      await installLive(context, { ...map, split: splitOf(results[0].table) }, { lines: linesOf(results[0].table) });
      const page = await context.newPage();
      await page.goto(first, { waitUntil: 'load', timeout: 60000 }).catch(() => {});
      await new Promise((done) => {
        page.on('close', done);
        headed.on('disconnected', done);
      });
    } finally {
      await headed.close().catch(() => {});
    }
  }
  return results;
}

/** Argument de shell, entre apostrophes s'il le faut. @param {string} x */
const q = (x) => (/[\s()'"$&;|<>*?]/.test(x) ? `'${x.replace(/'/g, `'\\''`)}'` : x);

/** @param {string[]} argv */
export function parseReduceArgs(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      target: { type: 'string' },
      decisions: { type: 'string' },
      tokens: { type: 'string' },
      'storage-state': { type: 'string' },
      sources: { type: 'string' },
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
      storageState: values['storage-state'],
      sourcesPath: values.sources,
      viewport: { width: Number(vp[1]), height: Number(vp[2]) },
      outRoot: String(values.out),
      live: !!values.live,
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
      console.log(`  ${family} : ${s.before} → ${s.after} valeurs ; ${s.decisions} décision(s), ${s.corrections} correction(s), ${s.near} proche(s), ${s.auto} d'office`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`Erreur : ${e.message}`);
    process.exit(1);
  });
}
