// @ts-check
/**
 * Lot R, R-1 : identifiant et titre en clair de chaque ligne. Réduction des trois
 * pages en désordre sur la valise, sans puis avec decisions-passage-2c.json : les
 * identifiants sont uniques et ne dépendent pas des décisions. Un champ est nommé par
 * son libellé, jamais par sa valeur saisie.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { rowKey, propose } from '../src/reduce/propose.js';
import { collectRendered } from '../src/browser/rendered.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {{ table: any, json: any, html: string }[]} */
const runs = [];

before(async () => {
  servers = await startFixtureServers();
  const [first, ...rest] = E.conditions.pages;
  const common = {
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    now: new Date(2026, 10, 12, 15, 0),
  };
  for (const decisionsPath of [undefined, `${FIXTURE_DIR}decisions-passage-2c.json`]) {
    const [r] = await runReduce({ ...common, decisionsPath, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-identifiants-')) });
    runs.push({ table: r.table, json: JSON.parse(await readFile(r.files[0], 'utf8')), html: await readFile(r.files[1], 'utf8') });
  }
});

after(async () => servers?.close());

/** @param {any} table @returns {Map<string, { id: string, title: string }>} */
const ids = (table) => {
  const out = new Map();
  for (const [family, f] of Object.entries(table.families)) for (const r of /** @type {any} */ (f).rows) out.set(rowKey(family, r), { id: r.id, title: r.title });
  return out;
};

test('R-1 : identifiants uniques, au format préfixe-numéro, un titre par ligne', () => {
  for (const { table } of runs) {
    const list = [...ids(table).values()];
    assert.ok(list.length > 0);
    for (const x of list) {
      assert.match(x.id, /^(coul|esp|arr|tail)-\d{2,}$/);
      assert.ok(x.title, `${x.id} sans titre`);
    }
    assert.equal(new Set(list.map((x) => x.id)).size, list.length, 'identifiants en double');
  }
});

test('R-1 : mêmes identifiants sans et avec decisions-passage-2c.json', () => {
  const [a, b] = runs.map((r) => ids(r.table));
  assert.deepEqual([...b.keys()].sort(), [...a.keys()].sort());
  for (const [key, x] of a) assert.equal(b.get(key)?.id, x.id, key);
});

test('R-1 : identifiant et titre écrits dans table.json et en tête de chaque carte de revue.html', () => {
  for (const { table, json, html } of runs) {
    assert.deepEqual(ids(json.table), ids(table));
    for (const { id } of ids(table).values()) assert.ok(html.includes(`<p class="titre"><b class="id">${id}</b> `), `${id} absent de revue.html`);
  }
});

test('R-1 : un champ rempli « X » avec le libellé « E-mail » donne « E-mail », jamais « X »', async () => {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><label for="m">E-mail</label> <input id="m" type="email" style="font-size:15px"></body></html>');
    await page.fill('#m', 'X');
    const pc = await collectRendered(page);
    const input = pc.records.find((r) => r.tag === 'input' && !r.pseudo);
    assert.equal(input?.label, 'E-mail');
    const agg = createRenderedAggregator();
    agg.addPage(pc);
    const t = propose(agg.result(), { fontSizes: [16] });
    const row = t.families.fontSizes.rows.find((/** @type {any} */ r) => r.old === '15px');
    assert.equal(row.title, 'Taille du texte · champ « E-mail »');
    assert.ok(!/X/.test(row.title), row.title);
  } finally {
    await browser.close();
  }
});
