// @ts-check
/**
 * Lot C (candidats) : cartes d'Orbe Café, grisé (C7 à C10), bilan par usage (C12) et consigne (C13).
 * Attendus écrits à la main avant le code : fixtures/marque-demo/expected-candidats.json (bloc « orbe »).
 *   cartes     fenêtre et ordre des candidats, « le plus proche » sur le défaut ;
 *   grisé      avec les choix du passage 2 : grisé, raison en clair, toujours cliquable ;
 *              paire « before » grisée aussi ; marge non appariée jamais grisée ; mis à jour à chaque clic ;
 *   bilan      une ligne par usage sous le compteur, mise à jour à chaque clic ;
 *   migration  candidats dans le même ordre, sans grisé ; nulle part « recommandé ».
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

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-candidats.json', import.meta.url), 'utf8')).orbe;
const D = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let browser;
const orbe = { table: /** @type {any} */ (null), md: '', revue: '', passage2: '', html: '' };

before(async () => {
  servers = await startFixtureServers();
  const [first, ...rest] = D.conditions.pages;
  const [o] = await runReduce({
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: D.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-candidats-')),
    now: new Date(2026, 10, 13, 11, 0),
  });
  orbe.table = o.table;
  orbe.md = await readFile(o.files[2], 'utf8');
  orbe.revue = pathToFileURL(o.files[1]).href;
  orbe.html = await readFile(o.files[1], 'utf8');
  const saved = JSON.parse(await readFile(o.files[0], 'utf8'));
  const withFile = join(await mkdtemp(join(tmpdir(), 'ds-lab-candidats-passage2-')), 'revue.html');
  await writeFile(withFile, renderReview(o.table, [], { host: saved.host, stamp: saved.stamp, target: 'cible-valise.json', decisions: E.passage2.choices }));
  orbe.passage2 = pathToFileURL(withFile).href;
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {{ family?: string, value: string, usage?: string | null, scope?: string | null }} w */
function rowOf(w) {
  const family = w.family ?? 'spacing';
  const r = orbe.table.families[family].rows.find(
    (/** @type {any} */ x) => x.old === w.value && (w.usage === undefined || (x.usage ?? null) === w.usage) && (w.scope === undefined || (x.scope ?? null) === w.scope),
  );
  assert.ok(r, `${family} ${w.value} ${w.usage ?? ''} ${w.scope ?? ''} absente`);
  return { family, r };
}
/** @param {any} page @param {any} w */
const card = (page, w) => {
  const { family, r } = rowOf(w);
  return page.locator(`article.row[data-key="${rowKey(family, r)}"]`);
};
/** @param {string} scope */
const margin10 = (scope) => ({ value: '10px', usage: 'marge', scope });
/** @param {string} url */
async function open(url) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(url);
  return { context, page };
}
/** Valeurs des versions grisées d'une carte. @param {any} c */
const greyed = (c) => c.locator('.versions .v.grise').evaluateAll((/** @type {Element[]} */ els) => els.map((e) => e.getAttribute('data-value')));
/** Choisit une version par sa valeur (« actuelle » : la première). @param {any} c @param {string} value */
async function choose(c, value) {
  await (value === 'actuelle' ? c.locator('.versions .v[data-v="0"]') : c.locator(`.versions .v[data-value="${value}"]`)).click();
  await c.locator('.retenir').click();
}
/** Lignes du bilan par usage. @param {any} page */
const bilan = async (page) => (await page.locator('#bilan-usages li').allTextContents()).map((/** @type {string} */ s) => s.replace(/\s+/g, ' ').trim());

test(`Orbe Café : ${E.decisions} décisions, inchangé (C5)`, () => {
  const n = Object.values(orbe.table.families).reduce((t, f) => t + /** @type {any} */ (f).rows.filter((/** @type {any} */ r) => r.class === 'décision').length, 0);
  assert.equal(n, E.decisions);
});

for (const w of E.cards)
  test(`C1 à C6, table : ${w.title}`, () => {
    const { r } = rowOf(w);
    assert.deepEqual(r.candidates.map((/** @type {any} */ c) => c.value), w.candidates);
    assert.deepEqual(r.candidates.filter((/** @type {any} */ c) => c.nearest).map((/** @type {any} */ c) => c.value), [w.nearest]);
    assert.equal(r.new, w.nearest, 'défaut inchangé');
  });

test('C6, revue : versions par valeur croissante, « le plus proche » sur le défaut seulement', async () => {
  const { context, page } = await open(orbe.revue);
  try {
    for (const w of E.cards) {
      const c = card(page, w);
      const values = await c.locator('.versions .v').evaluateAll((/** @type {Element[]} */ els) => els.slice(1).map((e) => e.getAttribute('data-value')));
      assert.deepEqual(values, w.candidates, `${w.title} : ordre`);
      const near = await c.locator('.versions .v', { hasText: 'le plus proche' }).evaluateAll((/** @type {Element[]} */ els) => els.map((e) => e.getAttribute('data-value')));
      assert.deepEqual(near, [w.nearest], `${w.title} : « le plus proche »`);
    }
  } finally {
    await context.close();
  }
});

test('C6, égalité : les deux candidats affichent leur écart, le défaut dit « à égalité avec »', async () => {
  const { context, page } = await open(orbe.revue);
  try {
    for (const w of E.ties.cards) {
      const c = card(page, w);
      for (const [value, note] of Object.entries(w.notes))
        assert.equal((await c.locator(`.versions .v[data-value="${value}"] .ecart`).textContent())?.trim(), note, `${w.value} ${value}`);
      for (const value of w.silent) assert.equal(await c.locator(`.versions .v[data-value="${value}"] .ecart`).count(), 0, `${w.value} ${value} : écart affiché`);
    }
  } finally {
    await context.close();
  }
});

test('C7, C8 : avec les choix du passage 2, candidats grisés et leur raison', async () => {
  const { context, page } = await open(orbe.passage2);
  try {
    for (const [scope, want] of Object.entries(E.passage2.greyed)) {
      const c = card(page, margin10(scope));
      assert.deepEqual(await greyed(c), want.values, `${scope} : grisés`);
      // Raisons répétées fusionnées en une phrase.
      for (const [value, reason] of Object.entries(want.reasons))
        assert.equal(await c.locator(`.versions .v[data-value="${value}"] .raison`).textContent(), reason, `${scope} ${value}`);
    }
  } finally {
    await context.close();
  }
});

test('C10 : une marge non appariée ne grise rien (gouttière 10 px, marge 6 px)', async () => {
  const { context, page } = await open(orbe.passage2);
  try {
    for (const w of [{ value: '10px', usage: 'gouttière' }, { value: '6px', usage: 'marge' }]) {
      const c = card(page, w);
      assert.deepEqual(await greyed(c), [], `${w.usage} ${w.value}`);
      assert.equal(await c.locator('.raison').count(), 0, `${w.usage} ${w.value} : raison affichée`);
    }
  } finally {
    await context.close();
  }
});

test('C7 : le grisé se met à jour à chaque clic', async () => {
  const { context, page } = await open(orbe.passage2);
  try {
    const between = card(page, margin10('entre composants'));
    const inside = card(page, margin10('dans le composant'));
    await choose(between, E.clicks.entre16.choose.value);
    assert.deepEqual(await greyed(inside), E.clicks.entre16.greyedDans, 'dans le composant, entre composants à 16');
    await choose(inside, E.clicks.dans8.choose.value);
    assert.deepEqual(await greyed(between), E.clicks.dans8.greyedEntre, 'entre composants, dans le composant à 8');
  } finally {
    await context.close();
  }
});

test('C9, C-P1 : un candidat grisé reste visible et cliquable ; choisi, l’avertissement du lot P s’affiche', async () => {
  const { context, page } = await open(orbe.passage2);
  try {
    const w = E.clicks.greyedClickable;
    const c = card(page, margin10(w.scope));
    const v = c.locator(`.versions .v[data-value="${w.value}"]`);
    assert.ok(await v.isVisible(), 'visible');
    assert.ok(await v.isEnabled(), 'cliquable');
    assert.equal(await v.getAttribute('class').then((/** @type {string | null} */ k) => /\bgrise\b/.test(k ?? '')), true, 'grisé');
    await choose(c, w.value);
    assert.equal(await c.locator('.choix').textContent(), w.choix);
    assert.ok((await c.locator('.controle .alerte').allTextContents()).some((/** @type {string} */ t) => t.includes(w.control)), 'avertissement');
  } finally {
    await context.close();
  }
});

test('C12 : bilan par usage sous le compteur, avec les choix du passage 2, mis à jour à chaque clic', async () => {
  const { context, page } = await open(orbe.passage2);
  try {
    assert.ok(await page.locator('#bilan-usages').isVisible(), 'bilan visible');
    const lines = await bilan(page);
    for (const l of E.passage2.bilan) assert.ok(lines.includes(l), `« ${l} » absent de\n${lines.join('\n')}`);
    for (const k of ['rayon6', 'rayon6actuelle']) {
      const x = E.clicks[k];
      await choose(card(page, x.choose), x.choose.pick);
      assert.ok((await bilan(page)).includes(x.bilan), `${k} : « ${x.bilan} » absent de\n${(await bilan(page)).join('\n')}`);
    }
  } finally {
    await context.close();
  }
});

test('C13 : migration.md liste les candidats dans le même ordre, sans grisé', () => {
  const pending = orbe.md.slice(orbe.md.indexOf('## Décisions en attente'), orbe.md.indexOf('## Refusée'));
  for (const w of E.migration.pending) {
    const { r } = rowOf(w);
    const line = pending.split('\n').find((l) => l.startsWith(`| ${r.id} `));
    assert.ok(line?.includes(`| ${w.cell} |`), `${w.value} : ${line}`);
  }
  assert.ok(!/gris/i.test(pending), 'pas de grisé dans la consigne');
});

test('C-P5 : nulle part « recommandé »', () => {
  assert.ok(!orbe.html.toLowerCase().includes(E.forbidden), 'revue.html');
  assert.ok(!orbe.md.toLowerCase().includes(E.forbidden), 'migration.md');
});
