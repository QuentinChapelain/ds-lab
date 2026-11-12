// @ts-check
/**
 * Lot P, étape 3 : revue et migration.md. Attendus écrits à la main avant le code
 * (fixtures/marque-demo/expected-proximite.json, bloc « etape3 ») :
 *   titre      la relation, pas les éléments (« Marge basse · champ vers son message ») ;
 *   détail     relation, signal et lieu de correction (composant ou page) ;
 *   contrôle   suit les choix, en clair, sur les cartes des deux marges d'une paire ;
 *   ancien choix sans relation : appliqué aux lignes coupées, dans la revue aussi ;
 *   migration.md : relation et motif sur chaque ligne, messages à relier par aria-describedby.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { rowKey } from '../src/reduce/propose.js';
import { renderReview } from '../src/report/review.js';

const P = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-proximite.json', import.meta.url), 'utf8'));
const D = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));
const E = P.etape3;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let browser;
/** Orbe Café : réduction des pages en désordre. */
const orbe = { table: /** @type {any} */ (null), data: /** @type {any} */ (null), md: '', revue: '', revueFichier: '' };
/** Page des pièges PX1 à PX8. */
const px = { table: /** @type {any} */ (null), data: /** @type {any} */ (null) };

before(async () => {
  servers = await startFixtureServers();
  const common = { targetPath: `${FIXTURE_DIR}cible-valise.json`, tokensPath: TOKENS, sourcesPath: `${FIXTURE_DIR}sources.json`, viewport: D.conditions.viewport, waitMs: 100 };
  const [first, ...rest] = D.conditions.pages;
  const [o] = await runReduce({ ...common, addresses: [servers.origin + first, ...rest], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-p3-')), now: new Date(2026, 10, 12, 21, 0) });
  orbe.table = o.table;
  orbe.data = o.migration;
  orbe.md = await readFile(o.files[2], 'utf8');
  orbe.revue = pathToFileURL(o.files[1]).href;
  // Même table, relue avec les décisions du passage 2c, écrites avant la coupure.
  const saved = JSON.parse(await readFile(o.files[0], 'utf8'));
  const decisions = JSON.parse(await readFile(`${FIXTURE_DIR}${E.orbe.oldChoice.file}`, 'utf8'));
  const withFile = join(await mkdtemp(join(tmpdir(), 'ds-lab-p3-fichier-')), 'revue.html');
  await writeFile(withFile, renderReview(o.table, [], { host: saved.host, stamp: saved.stamp, target: 'cible-valise.json', decisions }));
  orbe.revueFichier = pathToFileURL(withFile).href;
  const [x] = await runReduce({ ...common, addresses: [servers.origin + P.conditions.page], viewport: P.conditions.viewport, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-p3-px-')), now: new Date(2026, 10, 12, 21, 30) });
  px.table = x.table;
  px.data = x.migration;
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {any} table @param {string} value @param {string} scope */
const margin = (table, value, scope) => {
  const r = table.families.spacing.rows.find((/** @type {any} */ x) => x.old === value && x.usage === 'marge' && x.scope === scope);
  assert.ok(r, `marge ${value} « ${scope} » absente`);
  return r;
};
/** @param {any} page @param {any} r */
const card = (page, r) => page.locator(`article.row[data-key="${rowKey('spacing', r)}"]`);
/** @param {string} url */
async function open(url) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(url);
  return { context, page };
}
/** Texte d'une ligne du détail. @param {any} c @param {string} dt */
const dd = (c, dt) => c.locator('.detail dt', { hasText: dt }).locator('xpath=following-sibling::dd[1]').textContent();
/** Choisit une version par sa valeur. @param {any} c @param {string} value */
async function choose(c, value) {
  await c.locator(`.versions .v[data-value="${value}"]`).click();
  await c.locator('.retenir').click();
}

test('titre : la relation de la marge, pas ses éléments (Orbe Café et pièges)', () => {
  for (const w of E.orbe.rows) {
    const r = margin(orbe.table, w.value, w.scope);
    if (w.title) assert.equal(r.title, w.title, `${w.value} « ${w.scope} »`);
    else assert.ok(r.title.startsWith(w.titleStart), `${w.value} « ${w.scope} » : ${r.title}`);
  }
  for (const w of E.px.titles) assert.equal(margin(px.table, w.value, w.scope).title, w.title, `PX ${w.value} « ${w.scope} »`);
  // « relation inconnue » n'est dite que dans le détail et dans migration.md.
  for (const t of [orbe.table, px.table]) for (const r of t.families.spacing.rows) assert.ok(!r.title.includes('relation inconnue'), r.title);
  const unknown = margin(orbe.table, '6px', 'inconnue');
  assert.ok(orbe.md.split('\n').find((l) => l.startsWith(`| ${unknown.id} `) && l.includes('| espacements |'))?.includes('| relation inconnue · aucun voisin · à vérifier |'), 'migration.md : 6 px');
});

test('revue : le titre de la carte est celui de la table, avec la relation', async () => {
  const { context, page } = await open(orbe.revue);
  try {
    for (const w of E.orbe.rows) {
      const r = margin(orbe.table, w.value, w.scope);
      assert.equal((await card(page, r).locator('p.titre').textContent())?.replace(/\s+/g, ' ').trim().startsWith(`${r.id} ${r.title}`), true, `${w.value} « ${w.scope} »`);
    }
  } finally {
    await context.close();
  }
});

test('revue : le détail dit la relation, le signal et où corriger (composant ou page)', async () => {
  const { context, page } = await open(orbe.revue);
  try {
    // Les sections « Déjà sur la cible » et « d'office » sont fermées par défaut.
    await page.evaluate(() => document.querySelectorAll('main > section > details').forEach((d) => ((/** @type {HTMLDetailsElement} */ (d)).open = true)));
    for (const w of E.orbe.rows) {
      const c = card(page, margin(orbe.table, w.value, w.scope));
      await c.locator('.detail summary').click();
      assert.ok((await dd(c, 'Relation'))?.startsWith(w.scope === 'inconnue' ? 'relation inconnue' : w.scope), `${w.value} « ${w.scope} » : relation`);
      assert.equal(await dd(c, 'Signal'), w.signals, `${w.value} « ${w.scope} » : signal`);
      assert.ok((await dd(c, 'Où corriger'))?.startsWith(w.where), `${w.value} « ${w.scope} » : où corriger`);
    }
  } finally {
    await context.close();
  }
});

test('revue : le contrôle suit les choix, en clair, sur les deux cartes de 10 px', async () => {
  const { context, page } = await open(orbe.revue);
  try {
    const inside = card(page, margin(orbe.table, '10px', 'dans le composant'));
    const between = card(page, margin(orbe.table, '10px', 'entre composants'));
    /** @param {string} text @param {string} what */
    const both = async (text, what) => {
      for (const c of [inside, between]) assert.ok((await c.locator('.controle').textContent())?.includes(text), `${what} : ${await c.locator('.controle').textContent()}`);
    };
    await both(E.orbe.control.initial, 'sans choix');
    for (const k of ['same', 'inverted', 'restored']) {
      const w = E.orbe.control[k];
      await choose(inside, w.in);
      await choose(between, w.out);
      await both(w.text, k);
    }
  } finally {
    await context.close();
  }
});

test('revue : un ancien choix sans relation s’applique aux deux lignes coupées, et le contrôle le dit', async () => {
  const { context, page } = await open(orbe.revueFichier);
  try {
    for (const scope of ['dans le composant', 'entre composants']) {
      const c = card(page, margin(orbe.table, '10px', scope));
      assert.equal(await c.locator('.choix').textContent(), E.orbe.oldChoice.choix, scope);
      assert.ok((await c.locator('.controle').textContent())?.includes(E.orbe.oldChoice.control), `${scope} : ${await c.locator('.controle').textContent()}`);
    }
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
    const out = JSON.parse(await readFile(await download.path(), 'utf8'));
    for (const [k, v] of Object.entries(E.orbe.oldChoice.export)) assert.equal(out[k], v, k);
  } finally {
    await context.close();
  }
});

test('migration.md : relation et motif sur chaque ligne de la table', () => {
  const lines = orbe.md.split('\n');
  assert.ok(lines.includes(E.orbe.migration.tableColumns), 'en-tête de la table');
  for (const [scope, want] of Object.entries(E.orbe.migration.relationCells)) {
    const r = margin(orbe.table, '10px', scope);
    const row = lines.find((l) => l.startsWith(`| ${r.id} `) && l.includes('| espacements |'));
    assert.ok(row?.includes(`| ${want} |`), `${scope} : ${row}`);
    assert.ok(row?.includes(`| ${E.orbe.migration.motif} |`), `${scope} : motif`);
    // Décisions en attente et consigne : la relation aussi.
    const pending = orbe.md.slice(orbe.md.indexOf('## Décisions en attente'), orbe.md.indexOf('## Refusée'));
    assert.ok(pending.split('\n').find((l) => l.startsWith(`| ${r.id} `))?.includes(want), `${scope} : décisions en attente`);
    assert.ok(orbe.data.agent.lines.find((/** @type {string} */ l) => l.startsWith(`- ${r.id} `))?.includes(`Relation : ${want}`), `${scope} : consigne`);
  }
  // Une ligne sans relation (couleur) garde ses colonnes, avec « — ».
  const color = lines.find((l) => l.includes('| couleurs |') && l.startsWith('| coul'));
  assert.ok(color?.split(' | ').length === E.orbe.migration.tableColumns.split(' | ').length, `colonnes : ${color}`);
});

test('migration.md : « Change aussi » demande de relier chaque message à son champ par aria-describedby', () => {
  assert.ok(orbe.data.agent.lines.includes(E.orbe.migration.changeAussi), orbe.data.agent.lines.filter((/** @type {string} */ l) => l.includes('aria-describedby')).join('\n'));
  assert.deepEqual(
    px.data.exceptions.messages.map((/** @type {any} */ m) => ({ message: m.message, field: m.field })),
    E.px.messages,
    'pièges : messages non reliés',
  );
});
