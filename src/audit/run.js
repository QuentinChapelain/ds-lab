// @ts-check
/**
 * Orchestration d'un audit : un navigateur, un contexte par hôte (session
 * partagée entre ses pages), mesures page par page, puis analyse et sorties.
 */
import { readFile, access } from 'node:fs/promises';
import { basename, relative } from 'node:path';
import { chromium } from 'playwright-core';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { gotoAndSettle, DEFAULT_WAIT_MS, NETWORK_IDLE_TIMEOUT_MS } from '../browser/navigate.js';
import { collectSheets } from '../browser/sheets.js';
import { dedupeSheets, analyzeDeclared } from '../declared/analyze.js';
import { createRenderedAggregator } from '../rendered/aggregate.js';
import { measureRendered } from '../rendered/run.js';
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
    if (p.networkIdle === false) w.push({ text: `${p.url} : networkidle non atteint en ${NETWORK_IDLE_TIMEOUT_MS / 1000} s, mesure faite quand même.`, tag: '[F]' });
    if (typeof p.status === 'number' && p.status >= 400) w.push({ text: `${p.url} : statut HTTP ${p.status}.`, tag: '[F]' });
    if (p.finalUrl && p.finalUrl !== p.url) w.push({ text: `${p.url} : redirigée vers ${p.finalUrl} (session expirée ?).`, tag: '[V]' });
  }
  for (const p of pages.filter((x) => x.error)) w.push({ text: `${p.url} : échec du chargement (${p.error}), page ignorée.`, tag: '[F]' });
  return w;
}

/**
 * @param {AuditOptions} opts
 * @returns {Promise<{ host: string, dir: string, files: string[], warnings: Warning[] }[]>}
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

  const browser = await chromium.launch();
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
        try {
          const nav = await gotoAndSettle(page, url, { waitMs });
          Object.assign(meta, nav);
          const { sheets, rootPx, warnings: sw } = await collectSheets(page);
          meta.rootPx = rootPx;
          meta.sheets = sheets.length;
          for (const t of sw) warnings.push({ text: `${url} : ${t}`, tag: '[F]' });
          const pageAgg = v1Code ? createRenderedAggregator() : null;
          const r = await measureRendered(page, agg, { trace, states, thirdParty: sources?.thirdParty ?? [], sources, also: pageAgg ? [pageAgg] : [] });
          meta.iframes = r.iframes;
          meta.traced = r.traced;
          meta.stateSamples = r.stateSamples;
          perPage.push({ pageUrl: nav.finalUrl, sheets });
          if (v1Code && pageAgg) {
            const v1 = await runV1(page, v1Code);
            const pageDeclared = analyzeDeclared(dedupeSheets([{ pageUrl: nav.finalUrl, sheets }]), { rootPx, sources });
            const pageRendered = pageAgg.result();
            if ('error' in v1) {
              v1Pages.push({ url, error: v1.error });
              warnings.push({ text: `${url} : échec du script v1 (${v1.error}).`, tag: '[F]' });
            } else {
              v1Raw.push({ url, result: v1.result });
              v1Pages.push({
                url,
                rows: compareV1(v1.result, { rootPx, declared: pageDeclared, rendered: pageRendered, elements: pageRendered.elements }),
              });
            }
          }
        } catch (e) {
          meta.error = /** @type {Error} */ (e).message.split('\n')[0];
        } finally {
          await page.close().catch(() => {});
        }
        pages.push(meta);
      }
      await context.close();

      const firstOk = pages.find((p) => !p.error);
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
      const dir = await freeOutputDir(outRoot, host, stamp);
      const files = await writeAuditFiles(dir, audit, v1Code ? { script: basename(/** @type {string} */ (v1ScriptPath)), pages: v1Raw } : undefined);
      results.push({ host, dir, files, warnings });
    }
  } finally {
    await browser.close();
  }
  return results;
}
