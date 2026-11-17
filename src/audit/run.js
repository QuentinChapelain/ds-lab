// @ts-check
/**
 * Orchestration d'un audit : un navigateur, un contexte par hôte (session
 * partagée entre ses pages), mesures page par page, puis analyse et sorties.
 */
import { readFile, access } from 'node:fs/promises';
import { basename, relative } from 'node:path';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { gotoAndSettle, navigationWarnings, DEFAULT_WAIT_MS, NETWORK_IDLE_TIMEOUT_MS } from '../browser/navigate.js';
import { collectSheets } from '../browser/sheets.js';
import { lancerChromium } from '../browser/lancement.js';
import { dedupeSheets, analyzeDeclared } from '../declared/analyze.js';
import { createRenderedAggregator } from '../rendered/aggregate.js';
import { relever, verser } from '../rendered/run.js';
import { loadV1Script, runV1, compareV1 } from './v1.js';
import { stampOf, freeOutputDir, writeAuditFiles } from '../report/json.js';

const PKG = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

/**
 * @typedef {object} AuditOptions
 * @property {string[]} addresses
 * @property {string} [storageState]   chemin d'un storageState Playwright (.auth/<nom>.json)
 * @property {string} [sourcesPath]    sans lui : aucun fichier de sources lu
 * @property {{ width: number, height: number }} [viewport]
 * @property {number} [waitMs]
 * @property {boolean} [trace]          --trace-rendered
 * @property {boolean} [states]         états forcés hover, focus, active (défaut : oui ; --no-states pour les couper)
 * @property {string} [v1ScriptPath]
 * @property {string} [outRoot]        défaut : local/audits
 * @property {Date} [now]
 * @property {(msg: string) => void} [log]
 */

/**
 * @typedef {{ text: string, tag: string }} Warning
 */

/**
 * Avertissements liés aux pages (rootPx, iframes, chargement).
 * @param {any[]} pages
 * @returns {Warning[]}
 */
export function pageWarnings(pages) {
  /** @type {Warning[]} */
  const w = [];
  const ok = pages.filter((p) => !p.error);
  const roots = [...new Set(ok.map((p) => p.rootPx))];
  if (roots.length > 1) {
    w.push({
      text: `rootPx différente selon les pages (${ok.map((p) => `${new URL(p.url).pathname} : ${p.rootPx} px`).join(', ')}) : le déclaré convertit les rem avec ${ok[0].rootPx} px (première page).`,
      tag: '[F]',
    });
  }
  for (const p of ok) {
    if (p.iframes > 0) w.push({ text: `${p.url} : ${p.iframes} iframe(s) non parcourue(s) (feuilles et rendu ignorés).`, tag: '[F]' });
    // Avertissements de navigation partagés avec reduce et la lecture de marque.
    w.push(...navigationWarnings(p, p.sheetWarnings ?? []));
    if (p.traceError) w.push({ text: `${p.url} : étape trace tombée (${p.traceError}), échantillons non tracés.`, tag: '[F]' });
    if (p.v1Error) w.push({ text: `${p.url} : étape script v1 tombée (${p.v1Error}), comparaison absente pour cette page.`, tag: '[F]' });
  }
  // Une page tombée est nommée par son étape ; elle n'entre ni dans le rendu ni dans le déclaré.
  for (const p of pages.filter((x) => x.error)) w.push({ text: `${p.url} : étape ${p.etape ?? 'navigation'} tombée (${p.error}), page non mesurée.`, tag: '[F]' });
  return w;
}

/**
 * @param {AuditOptions} opts
 * @returns {Promise<{ host: string, dir: string | null, files: string[], warnings: Warning[], total: number, measured: number, traceFailed: number, v1Failed: number }[]>}
 *   `measured` pages mesurées sur `total` ; aucune page mesurée : rien n'est écrit (dir null).
 */
export async function runAudit(opts) {
  const {
    storageState,
    sourcesPath,
    viewport = { width: 1366, height: 900 },
    waitMs = DEFAULT_WAIT_MS,
    trace = false,
    states = true,
    v1ScriptPath,
    outRoot = 'local/audits',
    now = new Date(),
    log = () => {},
  } = opts;
  const urls = resolveAddresses(opts.addresses);
  const { sources, path: sourcesFile, warning: sourcesWarning } = await loadSources({ path: sourcesPath });
  const v1Code = v1ScriptPath ? await loadV1Script(v1ScriptPath) : null;
  if (storageState) {
    try {
      await access(storageState);
    } catch {
      throw new Error(`--storage-state : fichier introuvable ${storageState} (le créer avec npm run login -- <adresse>)`);
    }
  }

  const browser = await lancerChromium();
  const results = [];
  try {
    for (const [host, hostUrls] of groupByHost(urls)) {
      const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
      /** @type {any[]} */
      const pages = [];
      /** @type {{ pageUrl: string, sheets: import('../browser/sheets.js').CollectedSheet[] }[]} */
      const perPage = [];
      /** @type {Warning[]} */
      const warnings = [];
      const agg = createRenderedAggregator();
      /** @type {any[]} */
      const v1Pages = [];
      /** @type {any[]} */
      const v1Raw = [];

      for (const url of hostUrls) {
        log(`→ ${url}`);
        const page = await context.newPage();
        /** @type {any} */
        const meta = { url };
        // Chaque étape est nommée ; la page n'entre dans le rendu et le déclaré
        // qu'une fois ses étapes de mesure réussies (navigation, feuilles, mesure). Le script v1 n'est pas une étape de
        // mesure : son échec laisse la page mesurée, sans comparaison, et l'audit est dit incomplet, comme pour la trace.
        let etape = 'navigation';
        try {
          const nav = await gotoAndSettle(page, url, { waitMs });
          Object.assign(meta, nav);
          etape = 'feuilles';
          const { sheets, rootPx, warnings: sw } = await collectSheets(page);
          meta.rootPx = rootPx;
          meta.sheets = sheets.length;
          meta.sheetWarnings = sw;
          etape = 'mesure';
          const lu = await relever(page, { states, thirdParty: sources?.thirdParty ?? [] });
          const r = await verser(page, agg, lu, { trace, sources });
          meta.iframes = r.iframes;
          meta.traced = r.traced;
          meta.stateSamples = r.stateSamples;
          if (r.traceError) meta.traceError = r.traceError;
          perPage.push({ pageUrl: nav.finalUrl, sheets });
          if (v1Code) {
            try {
              const pageAgg = createRenderedAggregator();
              pageAgg.addPage(lu.pc);
              if (lu.sc) pageAgg.addStates(lu.sc);
              const v1 = await runV1(page, v1Code);
              if ('error' in v1) throw new Error(v1.error);
              const pageDeclared = analyzeDeclared(dedupeSheets([{ pageUrl: nav.finalUrl, sheets }]), { rootPx, sources });
              const pageRendered = pageAgg.result();
              v1Raw.push({ url, result: v1.result });
              v1Pages.push({ url, rows: compareV1(v1.result, { rootPx, declared: pageDeclared, rendered: pageRendered, elements: pageRendered.elements }) });
            } catch (e) {
              meta.v1Error = /** @type {Error} */ (e).message.split('\n')[0];
              v1Pages.push({ url, error: meta.v1Error });
            }
          }
        } catch (e) {
          meta.error = /** @type {Error} */ (e).message.split('\n')[0];
          meta.etape = etape;
        } finally {
          await page.close().catch(() => {});
        }
        pages.push(meta);
      }
      await context.close();

      const firstOk = pages.find((p) => !p.error);
      const measured = pages.filter((p) => !p.error).length;
      const traceFailed = pages.filter((p) => !p.error && p.traceError).length;
      const v1Failed = pages.filter((p) => !p.error && p.v1Error).length;
      const declared = analyzeDeclared(dedupeSheets(perPage), { rootPx: firstOk?.rootPx ?? 16, sources });
      const rendered = agg.result();
      if (sourcesWarning) warnings.unshift({ text: sourcesWarning, tag: '[F]' });
      warnings.push(...pageWarnings(pages));
      for (const t of declared.warnings) warnings.push({ text: t, tag: '[F]' });
      for (const sel of rendered.thirdParty.invalid) warnings.push({ text: `sources : sélecteur thirdParty invalide, ignoré : ${sel}`, tag: '[F]' });

      const stamp = stampOf(now);
      const audit = {
        tool: { name: 'ds-lab audit', version: PKG.version },
        meta: {
          host,
          date: now.toISOString(),
          stamp,
          addresses: hostUrls,
          viewport,
          waitMs,
          networkIdleTimeoutMs: NETWORK_IDLE_TIMEOUT_MS,
          traceRendered: trace,
          states,
          storageState: storageState ? basename(storageState) : null,
          sources: sourcesFile ? relative(process.cwd(), sourcesFile) || sourcesFile : null,
          v1Script: v1ScriptPath ? basename(v1ScriptPath) : null,
          browser: browser.version(),
        },
        pages,
        warnings,
        declared,
        rendered,
        v1: v1Code ? { pages: v1Pages } : undefined,
      };
      if (!measured) {
        results.push({ host, dir: null, files: [], warnings, total: pages.length, measured, traceFailed, v1Failed });
        continue;
      }
      const dir = await freeOutputDir(outRoot, host, stamp);
      const files = await writeAuditFiles(dir, audit, v1Code ? { script: basename(/** @type {string} */ (v1ScriptPath)), pages: v1Raw } : undefined);
      results.push({ host, dir, files, warnings, total: pages.length, measured, traceFailed, v1Failed });
    }
  } finally {
    await browser.close();
  }
  return results;
}
