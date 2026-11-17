// @ts-check
/**
 * D30 : orchestration de npm run reduce, sortie de src/cli/ (qui garde l'aide, les options et le
 * lancement). Une boucle : mesurer le rendu, ranger chaque valeur sur la cible, simuler la table dans le navigateur,
 * produire la page de revue, migration.md et modifications.json. Une panne lève (D18) : page qui tombe, en nommant son
 * étape ; couleur de marque illisible dans la cible ; --tokens sans jeton.
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { loadSources } from '../lib/sources.js';
import { gotoAndSettle, navigationWarnings, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { createRenderedAggregator } from '../rendered/aggregate.js';
import { measureRendered } from '../rendered/run.js';
import { propose, mapping, rowKey, controlAfter, splitOf, brandOf, worstContrast, solidPairs, uncoveredValues, decisionKeysOrphelines, NON_STABILISE } from './propose.js';
import { collectSheets } from '../browser/sheets.js';
import { lancerChromium } from '../browser/lancement.js';
import { contradictionsIn } from '../brand/brand.js';
import { simulatePage, installLive, captureDecision, touchedElements, capturePlein, FRAME } from '../browser/simulate.js';
import { renderReview } from '../report/review.js';
import { buildMigration, indexTokens } from '../report/migration.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { pageName, writeReference } from '../verify/reference.js';
import { identityMapping, declarationsOnPage, attachDeclarations, reperesDe } from './declarations.js';
import { pleinGroups, applyPleins, pleinVersionMap, couplingsOf, simulationCouplings } from './pleins.js';
import { lireJson } from '../lib/fichiers.js';
import { jetonsDe } from '../tokens/resolver.js';

/**
 * @typedef {object} ReduceOptions
 * @property {string[]} addresses
 * @property {string} targetPath
 * @property {string} [decisionsPath]
 * @property {string} [tokensPath]     jetons DTCG de la cible (fichier de jetons ou resolver), pour migration.md
 * @property {string} [storageState]
 * @property {string} [sourcesPath]
 * @property {string} [referencesPath]  Dossier des références de npm run verify
 * @property {string[]} [temoins]  Pages témoins, hors de la table
 * @property {{ width: number, height: number }} [viewport]
 * @property {number} [waitMs]
 * @property {string} [outRoot]
 * @property {boolean} [live]
 * @property {Date} [now]
 * @property {(msg: string) => void} [log]
 */

/**
 * R-2 : identifiant et titre de chaque ligne de la table, pour la barre --live.
 * @param {ReturnType<typeof propose>} table
 */
export const linesOf = (table) =>
  Object.entries(table.families).flatMap(([family, f]) => f.rows.filter((r) => r.id).map((r) => ({ key: rowKey(family, r), id: /** @type {string} */ (r.id), title: r.title ?? '' })));

/** Vignettes des autres éléments touchés par une décision, au plus. */
const THUMBS = 3;
/** Classes dont les lignes reçoivent des captures par version (avant et après, hors décision). */
const CAPTURED = new Set(['décision', 'proche', 'auto', 'correction']);

/**
 * @param {ReduceOptions} opts
 * @returns {Promise<{ host: string, dir: string, files: string[], references: string[], table: ReturnType<typeof propose>, map: Record<string, any>, first: string, migration: ReturnType<typeof buildMigration>['data'], pages: Awaited<ReturnType<typeof simulatePage>>[] }[]>}
 */
export async function runReduce(opts) {
  const { viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, outRoot = 'local/reductions', now = new Date(), log = () => {} } = opts;
  const target = JSON.parse(await readFile(opts.targetPath, 'utf8'));
  /** @type {Record<string, string | false>} */
  const decisions = opts.decisionsPath ? JSON.parse(await readFile(opts.decisionsPath, 'utf8')) : {};
  // --tokens lit un fichier de jetons ou un resolver ; un fichier qui ne donne aucun jeton est une
  // panne (D18) : migration.md ne nommerait aucune ligne.
  const tokens = opts.tokensPath ? jetonsDe(lireJson(opts.tokensPath), opts.tokensPath) : null;
  if (tokens && !indexTokens(tokens).size)
    throw new Error(`--tokens ${opts.tokensPath} : aucun jeton lu (couleur en hex, dimension en px) ; un fichier .tokens.json ou un resolver DTCG 2025.10 attendu`);
  // D18 : une couleur de marque illisible dans la cible lève avant de lancer Chromium.
  if (target.brand) brandOf(target);
  const { sources } = await loadSources({ path: opts.sourcesPath });
  const urls = resolveAddresses(opts.addresses);
  // Pages témoins, relatives à la première adresse, distinctes des pages de la table.
  const witnessUrls = [
    ...new Set(
      (opts.temoins ?? []).map((t) => {
        const u = new URL(t, urls[0]);
        u.hash = '';
        return u.href;
      }),
    ),
  ];
  for (const w of witnessUrls) {
    if (urls.includes(w)) throw new Error(`--temoins : ${w} est déjà une page de la table`);
    if (!urls.some((u) => new URL(u).host === new URL(w).host)) throw new Error(`--temoins : ${w} n'a aucune page de la table sur son hôte`);
  }
  if (opts.referencesPath) {
    // Un nom de fichier par page ; deux pages du même nom s'écraseraient.
    const seen = new Map();
    for (const u of [...urls, ...witnessUrls]) {
      const n = pageName(u);
      if (seen.has(n)) throw new Error(`--references : ${seen.get(n)} et ${u} donneraient le même fichier ${n}.reference.png`);
      seen.set(n, u);
    }
  }
  const browser = await lancerChromium();
  const results = [];
  try {
    for (const [host, hostUrls] of groupByHost(urls)) {
      const context = await browser.newContext({ viewport, storageState: opts.storageState ?? undefined });
      // Un fond qui porte l'onSolid de son échelle est un plein.
      const solid = solidPairs(target);
      const agg = createRenderedAggregator({ solid });
      // M7 : avec une marque déclarée, feuilles lues pour les replis contraires au back-office.
      const brandSheets = /** @type {any[]} */ ([]);
      const seenSheets = new Set();
      // Tour 1 : mesurer, pour proposer la table sur l'ensemble des pages.
      for (const url of hostUrls) {
        log(`mesure → ${url}`);
        const page = await context.newPage();
        // D18 : une page qui tombe arrête la réduction (une table faite sur une partie
        // des pages tromperait), en nommant l'étape ; les avertissements de navigation sont affichés, plus jetés.
        let etape = 'navigation';
        try {
          const nav = await gotoAndSettle(page, url, { waitMs });
          etape = 'feuilles';
          const { sheets, warnings: sw } = await collectSheets(page);
          for (const w of navigationWarnings({ url, ...nav }, sw)) log(`  ! ${w.text} ${w.tag}`);
          etape = 'mesure';
          // Origine CSS (règle d'un élément d'exemple) et états forcés, pour migration.md.
          const m = await measureRendered(page, agg, { trace: true, states: true, thirdParty: sources?.thirdParty ?? [], sources });
          if (m.traceError) {
            etape = 'trace';
            throw new Error(m.traceError);
          }
          if (target.brand)
            for (const sh of sheets) {
              const k = sh.href ?? `${url}#${sh.styleSheetId}`;
              if (seenSheets.has(k)) continue;
              seenSheets.add(k);
              brandSheets.push(sh);
            }
        } catch (e) {
          throw new Error(`${url} : étape ${etape} tombée (${/** @type {Error} */ (e).message.split('\n')[0]}), réduction arrêtée`);
        } finally {
          await page.close().catch(() => {});
        }
      }
      // R6 : les sélecteurs tiers suivent la table, pour que la simulation les exclue.
      const rendered = agg.result();
      // Un sélecteur tiers invalide est signalé ici aussi, comme par l'audit.
      for (const sel of rendered.thirdParty?.invalid ?? []) log(`  ! sources : sélecteur thirdParty invalide, ignoré : ${sel} [F]`);
      const contradictions = target.brand ? contradictionsIn(brandSheets, brandOf(target).variables) : [];
      const table = { ...propose(rendered, target, { contradictions }), thirdParty: sources?.thirdParty ?? [] };
      for (const r of table.families.colors?.rows ?? []) if (r.reason === NON_STABILISE) log(`  ! ${r.old} (${r.usage ?? 'couleur'}) : ${NON_STABILISE} [F]`);
      // Une carte par plein dont le texte échoue ; ses lignes de fond suivent son choix.
      const pleins = pleinGroups({ table, rendered, target, decisions });
      /** @type {any} */ (table).pleins = pleins;
      // Clés de decisions.json qui ne visent aucune ligne ni carte, listées.
      const orphelines = decisionKeysOrphelines(/** @type {any} */ (table), decisions);
      for (const k of orphelines) log(`  ! clé de décision sans ligne ni carte, ignorée : ${k} [F]`);
      const effective = applyPleins(table, pleins, decisions);
      // P3 : la hiérarchie des espaces, recalculée avec les décisions relues.
      controlAfter(table, effective);
      const map = mapping(table, effective);
      // La simulation (revue, références, captures, --live) pose aussi les COUPLAGES.
      // Seulement ceux des pleins dont la carte a retenu « onSolid ».
      map.solid = [...solid];
      map.couplings = simulationCouplings(couplingsOf({ rendered, map, pleins }));
      // Déclarations sources de chaque ligne (l'unité écrite décide du rattachement) et conflits (une déclaration, deux issues),
      // sur les pages de la table et les pages témoins, qui partagent les feuilles.
      const hostWitnesses = witnessUrls.filter((w) => new URL(w).host === host);
      // Couplages lus sur la page telle quelle (fond attendu = fond lu) : ils marquent les éléments couplés.
      const identity = { ...identityMapping(table, { split: splitOf(table), solid: map.solid }), couplings: map.couplings.map((/** @type {any} */ c) => ({ ...c, to: c.bg })) };
      /** @type {any[]} */
      const records = [];
      for (const url of [...hostUrls, ...hostWitnesses]) {
        log(`déclarations → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          records.push(...(await declarationsOnPage(page, identity, { sources })));
        } finally {
          await page.close().catch(() => {});
        }
      }
      const conflicts = attachDeclarations(table, records, effective);
      const reperes = reperesDe(records);
      map.conflicts = conflicts.map((c) => ({ id: c.id, keys: c.rows.map((/** @type {any} */ r) => r.key) }));
      // Tour 2 : simuler la table, page par page.
      const pages = [];
      /** @type {string[]} */
      const references = [];
      for (const url of hostUrls) {
        log(`simulation → ${url}`);
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          // L'arbre d'accessibilité avant simulation, la capture après simulation complète.
          const aria = opts.referencesPath ? await page.ariaSnapshot() : '';
          // Les captures par ligne viennent du passage des versions ; ici, pages entières seulement.
          const simulated = await simulatePage(page, { ...map, split: splitOf(table) });
          pages.push(simulated);
          if (opts.referencesPath && simulated.after) {
            const f = await writeReference(opts.referencesPath, url, { png: Buffer.from(simulated.after, 'base64'), aria });
            references.push(f.png, f.aria);
          }
        } finally {
          await page.close().catch(() => {});
        }
      }
      // Pages témoins. Hors de la table : relevé à part (valeurs non couvertes),
      // puis la table simulée dessus, couplages compris, et sa référence.
      /** @type {any[]} */
      const witnesses = [];
      for (const url of hostWitnesses) {
        log(`témoin → ${url}`);
        const wagg = createRenderedAggregator({ solid });
        const probe = await context.newPage();
        try {
          await gotoAndSettle(probe, url, { waitMs });
          await measureRendered(probe, wagg, { thirdParty: sources?.thirdParty ?? [], sources });
        } finally {
          await probe.close().catch(() => {});
        }
        const page = await context.newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          const aria = opts.referencesPath ? await page.ariaSnapshot() : '';
          const simulated = await simulatePage(page, { ...map, split: splitOf(table) });
          if (opts.referencesPath && simulated.after) {
            const f = await writeReference(opts.referencesPath, url, { png: Buffer.from(simulated.after, 'base64'), aria });
            references.push(f.png, f.aria);
          }
          witnesses.push({
            url,
            page: new URL(url).pathname,
            elements: simulated.elements,
            changed: simulated.changed,
            operations: simulated.operations,
            byFamily: simulated.byFamily,
            uncovered: uncoveredValues(wagg.result(), table),
          });
        } finally {
          await page.close().catch(() => {});
        }
      }
      // R-3 : une capture par version de chaque décision, sur la page d'origine ; puis une
      // vignette par autre élément touché (3 au plus), et le relevé de tous les éléments touchés.
      // Les lignes proches, d'office et les corrections reçoivent les mêmes captures,
      // en deux versions, « avant » et « après », sans vignettes.
      const pending = Object.entries(table.families).flatMap(([family, f]) =>
        f.rows
          // Une ligne de fond d'un plein n'a pas de captures à elle ; la carte du plein les porte.
          .filter((r) => !r.plein && CAPTURED.has(r.class) && (r.class === 'décision' || (r.new && r.new !== r.old)))
          .map((r) => ({ family, r, decision: r.class === 'décision', others: /** @type {any[]} */ ([]), touched: /** @type {any[]} */ ([]) })),
      );
      // R-8 : captures des versions en densité 2, dans un contexte à part (les pages entières restent en densité 1).
      const sharp = pending.length || pleins.length ? await browser.newContext({ viewport, storageState: opts.storageState ?? undefined, deviceScaleFactor: FRAME.scale }) : null;
      for (const url of sharp ? hostUrls : []) {
        log(`versions → ${url}`);
        const page = await /** @type {any} */ (sharp).newPage();
        try {
          await gotoAndSettle(page, url, { waitMs });
          // Éléments de chaque carte de plein, et ses trois versions sur la première page qui en porte.
          for (const g of pleins) {
            const els = await capturePlein(page, g, table.thirdParty, map.solid, { versions: !g.capture, versionMap: pleinVersionMap });
            if (!els) continue;
            for (const e of els.elements) g.elements.push({ page: new URL(url).pathname, ...e });
            if (els.capture && !g.capture) g.capture = els.capture;
          }
          for (const x of pending) {
            const { family, r, decision } = x;
            const candidates = decision ? r.candidates : [{ value: /** @type {string} */ (r.new), name: r.name }];
            const d = { key: rowKey(family, r), family, usage: r.usage, mapKey: r.usage ? `${r.old}|${r.usage}${r.scope ? `|${r.scope}` : ''}` : r.old, old: r.old, candidates, solid: map.solid, couplings: map.couplings };
            const here = await touchedElements(page, d, table.thirdParty);
            if (!here.length) continue;
            for (const t of here) x.touched.push({ page: url, selector: t.selector, text: t.text });
            let rest = here.map((t) => t.index);
            // J8 : une capture hors de la page cède la place à celle d'une page suivante.
            if (!r.capture || r.capture.offPage) {
              const c = await captureDecision(page, d, table.thirdParty, decision ? {} : { labels: ['avant', 'après'] });
              if (!c) continue;
              if (!r.capture || !c.offPage) r.capture = c;
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
      // Sous chaque version de couleur, le contraste le plus défavorable sur toutes les paires
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
      await writeFile(files[0], JSON.stringify({ host, stamp, viewport, target, decisions, decisionsOrphelines: orphelines, table, pages: pages.map((p) => ({ url: p.url, elements: p.elements, operations: p.operations })) }, null, 2) + '\n');
      await writeFile(files[1], renderReview(table, pages, { host, stamp, target: opts.targetPath.split('/').pop() ?? '', decisions }));
      const migration = buildMigration({
        table,
        rendered,
        map,
        target,
        tokens,
        decisions: effective,
        witnesses,
        conflicts,
        reperes,
        // Verdict par ligne décidée (verify --ajout) : la coupure par relation et les clés posées par page.
        simulee: { split: splitOf(table), pages: pages.map((p) => ({ page: new URL(p.url).pathname, keys: p.keys })) },
        meta: {
          host,
          // Schéma des adresses (http, https) : l'adresse du site intact, pour npm run ajout, sans port de plus.
          scheme: new URL(hostUrls[0]).protocol.replace(/:$/, ''),
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
      // S1 : à côté de migration.md, les modifications que npm run apply sait faire.
      if (migration.modifications) {
        files.push(join(dir, 'modifications.json'));
        await writeFile(files[3], JSON.stringify(migration.modifications, null, 2) + '\n');
      }
      results.push({ host, dir, files, references, table, map, first: hostUrls[0], migration: migration.data, pages, rendered });
    }
  } finally {
    await browser.close();
  }
  if (opts.live && results.length) {
    // Fenêtre visible, sur la première adresse. Aucune boucle : on attend la fermeture.
    const { map, first } = results[0];
    log(`fenêtre ouverte sur ${first} : barre avant / après en bas de page ; fermer la fenêtre pour finir`);
    const headed = await lancerChromium({ headless: false });
    try {
      const context = await headed.newContext({ viewport: null, storageState: opts.storageState ?? undefined });
      await installLive(context, { ...map, split: splitOf(results[0].table) }, { lines: linesOf(results[0].table) });
      const page = await context.newPage();
      // Une navigation qui échoue est dite ; la fenêtre reste ouverte pour naviguer à la main.
      await page.goto(first, { waitUntil: 'load', timeout: 60000 }).catch((e) => log(`  ! --live : navigation vers ${first} échouée (${String(e?.message ?? e).split('\n')[0]}) ; la fenêtre reste ouverte`));
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
