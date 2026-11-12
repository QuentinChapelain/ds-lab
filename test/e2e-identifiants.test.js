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
import { runReduce, linesOf } from '../src/cli/reduce.js';
import { mapping } from '../src/reduce/propose.js';
import { installLive } from '../src/browser/simulate.js';
import { rowKey, propose } from '../src/reduce/propose.js';
import { collectRendered } from '../src/browser/rendered.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {{ table: any, json: any, html: string, md: string, map: any }[]} */
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
    runs.push({ table: r.table, json: JSON.parse(await readFile(r.files[0], 'utf8')), html: await readFile(r.files[1], 'utf8'), md: await readFile(r.files[2], 'utf8'), map: r.map });
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

/** Échappement de revue.html. @param {string} t */
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Cellule de migration.md. @param {string} t */
const cell = (t) => t.replace(/\|/g, '\\|');

/** Liste « Une ligne » de la barre --live, page par page : clé → texte de l'option. @param {any} run */
async function liveLists(run) {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  /** @type {Map<string, string>} */
  const out = new Map();
  try {
    const context = await browser.newContext({ viewport: E.conditions.viewport });
    await installLive(context, run.map, { delayMs: 0, lines: linesOf(run.table) });
    const page = await context.newPage();
    for (const p of E.conditions.pages) {
      await page.goto(servers.origin + p);
      const barre = page.locator('[data-ds-lab="barre"]');
      await barre.waitFor({ state: 'attached' });
      for (const o of await barre.locator('select option').evaluateAll((os) => os.map((x) => ({ key: /** @type {HTMLOptionElement} */ (x).value, text: x.textContent ?? '' }))))
        if (o.key) out.set(o.key, o.text);
    }
  } finally {
    await browser.close();
  }
  return out;
}

test('R-2 : pour chaque ligne, le même identifiant et le même titre dans table.json, revue.html, migration.md et la liste de la barre --live', async () => {
  const run = runs[0];
  const live = await liveLists(run);
  assert.ok(live.size > 0, 'liste de la barre vide');
  const applied = new Set(Object.entries(run.map).filter(([f]) => f !== 'thirdParty').flatMap(([f, m]) => Object.keys(/** @type {any} */ (m)).map((k) => `${f}|${k}`)));
  for (const [key, x] of ids(run.json.table)) {
    assert.equal(ids(run.table).get(key)?.title, x.title, `${x.id} : table.json`);
    assert.ok(run.html.includes(`<p class="titre"><b class="id">${x.id}</b> ${esc(x.title)}`), `${x.id} : revue.html`);
    assert.ok(run.md.includes(`| ${cell(`${x.id} ${x.title}`)} |`), `${x.id} : migration.md`);
    if (live.has(key)) assert.equal(live.get(key), `${x.id} ${x.title}`, `${x.id} : barre --live`);
  }
  // Toute ligne appliquée (dans la table posée par --live) figure dans la liste de la barre.
  for (const [key, x] of ids(run.json.table)) {
    const [family, old, usage] = key.split('|');
    if (applied.has(`${family}|${old}|${usage}`) || applied.has(`${family}|${old}`)) assert.ok(live.has(key), `${x.id} absente de la barre`);
  }
  // Consigne : chaque remplacement commence par l'identifiant et le titre.
  const steps = run.md.split('\n').filter((l) => /^[1-9]\d*\. /.test(l));
  assert.ok(steps.length > 0);
  const byText = new Set([...ids(run.json.table).values()].map((x) => `${x.id} ${x.title} — `));
  for (const l of steps) assert.ok([...byText].some((t) => l.slice(l.indexOf(' ') + 1).startsWith(t)), l);
});

test('R-2 : barre --live, choisir une ligne n’applique que cette ligne ; « Toutes » revient au mode par familles', async () => {
  const run = runs[0];
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: E.conditions.viewport });
    await installLive(context, run.map, { delayMs: 0, lines: linesOf(run.table) });
    const page = await context.newPage();
    await page.goto(servers.origin + E.conditions.pages[0]);
    const barre = page.locator('[data-ds-lab="barre"]');
    await barre.waitFor({ state: 'attached' });
    /** Clés des opérations posées (style en ligne à la nouvelle valeur). */
    const active = () =>
      page.evaluate(() => {
        const sim = /** @type {any} */ (window).__dsSim;
        // Même écriture des deux côtés : le navigateur note une couleur en rgb().
        const probe = document.createElement('i').style;
        /** @param {string} prop @param {string} v */
        const same = (prop, v) => (probe.setProperty(prop, v), probe.getPropertyValue(prop));
        return [...new Set(sim.ops.filter((/** @type {any} */ o) => { const st = sim.els[o.i].style; return st && st.getPropertyPriority(o.prop) === 'important' && st.getPropertyValue(o.prop) === same(o.prop, o.value); }).map((/** @type {any} */ o) => o.key))];
      });
    const all = await active();
    assert.ok(all.length > 1);
    const key = /** @type {string} */ (await barre.locator('select option').nth(1).getAttribute('value'));
    await barre.getByLabel('Une ligne').selectOption(key);
    assert.deepEqual(await active(), [key]);
    assert.equal(await barre.getAttribute('data-ligne'), key);
    await barre.getByRole('button', { name: 'Avant' }).click();
    assert.deepEqual(await active(), [], 'avant : rien de posé');
    await barre.getByRole('button', { name: 'Après' }).click();
    await barre.getByLabel('Une ligne').selectOption('');
    assert.deepEqual((await active()).sort(), [...all].sort(), 'Toutes : retour au mode par familles');
  } finally {
    await browser.close();
  }
});
