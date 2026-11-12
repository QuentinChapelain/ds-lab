// @ts-check
/**
 * Lot P (proximité), étape 1 : pièges PX1 à PX8 sur la page
 * fixtures/marque-demo/proximite/proximite.html de la marque fictive, comparés à
 * fixtures/marque-demo/expected-proximite.json, écrit avant le code et jamais recalé.
 *   construction  la page est bien celle décrite (marges calculées et espace visible
 *                 mesurés ici, sans l'outil) : doit passer dès que la page existe ;
 *   PX1 à PX8     ce que le relevé et la table doivent produire après le lot P.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { collectRendered } from '../src/browser/rendered.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-proximite.json', import.meta.url), 'utf8'));
const PX = 0.5;
/** @type {Record<string, any>} */
const T = Object.fromEntries(E.traps.map((/** @type {any} */ t) => [t.id, t]));

/**
 * Exécutée dans la page : marge calculée et espace visible entre l'élément et son
 * voisin attendu, du côté de la marge, mesurés sans l'outil.
 * @param {{ element: string, side: string, neighbor: string }[]} list
 */
function geometryInPage(list) {
  return list.map(({ element, side, neighbor }) => {
    const el = document.querySelector(element);
    const nb = document.querySelector(neighbor);
    if (!el || !nb) return { element, missing: !el ? element : neighbor };
    const a = el.getBoundingClientRect();
    const b = nb.getBoundingClientRect();
    const gap = side === 'top' ? a.top - b.bottom : side === 'bottom' ? b.top - a.bottom : side === 'left' ? a.left - b.right : b.left - a.right;
    return { element, side, computed: parseFloat(getComputedStyle(el).getPropertyValue(`margin-${side}`)), gap };
  });
}

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any[]} */
let records;
/** @type {any[]} */
let geometry;
/** @type {any} */
let table;
/** Même page, relue avec un choix enregistré sans relation. @type {{ table: any, map: any }} */
const old = { table: null, map: null };

before(async () => {
  servers = await startFixtureServers();
  const url = servers.origin + E.conditions.page;
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: E.conditions.viewport });
    const page = await context.newPage();
    await gotoAndSettle(page, url, { waitMs: 100 });
    geometry = await page.evaluate(
      geometryInPage,
      E.traps.flatMap((/** @type {any} */ t) => t.margins.map((/** @type {any} */ m) => ({ element: m.element, side: m.side, neighbor: m.construction?.from ?? m.neighbor }))),
    );
    records = (await collectRendered(page)).records;
    await context.close();
  } finally {
    await browser.close();
  }
  const [r] = await runReduce({
    addresses: [url],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-proximite-')),
    now: new Date(2026, 10, 12, 12, 0),
  });
  table = r.table;
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-proximite-'));
  const decisionsPath = join(dir, 'decisions.json');
  await writeFile(decisionsPath, JSON.stringify(E.oldDecision.decisions));
  const [d] = await runReduce({
    addresses: [url],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    decisionsPath,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: dir,
    now: new Date(2026, 10, 12, 12, 30),
  });
  old.table = d.table;
  old.map = d.map;
});

after(async () => servers?.close());

/** @param {number} n @param {number} want @param {string} msg */
const near = (n, want, msg) => assert.ok(Math.abs(n - want) <= PX, `${msg} : ${n}, attendu ${want}`);

test('construction : marges calculées et espace visible conformes aux attendus (sans l’outil)', () => {
  const want = E.traps.flatMap((/** @type {any} */ t) => t.margins.map((/** @type {any} */ m) => ({ ...m, id: t.id })));
  want.forEach((m, i) => {
    const g = geometry[i];
    assert.equal(g.missing, undefined, `${m.id} : ${g.missing} absent de la page`);
    near(g.computed, m.computedPx, `${m.id} ${m.element} marge ${m.side} calculée`);
    near(g.gap, m.construction?.gapPx ?? m.visiblePx, `${m.id} ${m.element} espace visible côté ${m.side}`);
  });
});

/** @param {any} trap */
function checkMargins(trap) {
  for (const m of trap.margins) {
    const what = `${trap.id} ${m.element} marge ${m.side}`;
    const rec = records.find((r) => r.selector === m.element && !r.pseudo);
    assert.ok(rec, `${what} : élément absent du relevé`);
    const got = rec.margins?.[m.side];
    assert.ok(got, `${what} : relevé sans margins.${m.side}`);
    assert.equal(got.neighbor, m.neighbor, `${what} : voisin`);
    assert.equal(got.scope, m.scope, `${what} : portée`);
    assert.equal(got.signal ?? null, m.signal, `${what} : signal`);
    if (m.detail) assert.equal(got.detail, m.detail, `${what} : détail du signal`);
    if (m.visiblePx === null) assert.equal(got.visiblePx ?? null, null, `${what} : espace visible (aucun contrôle)`);
    else near(got.visiblePx, m.visiblePx, `${what} : espace visible`);
  }
}

/** @param {any} r */
const isMargin = (r) => String(r.usage ?? '').startsWith('marge');

/** @param {any} trap */
function checkTable(trap) {
  const t = trap.table;
  if (!t) return;
  for (const want of t.rows ?? []) {
    const what = `${trap.id} ${want.value} « ${want.scope} »`;
    const rows = table.families[want.family].rows.filter((/** @type {any} */ r) => r.old === want.value && isMargin(r));
    const r = rows.find((/** @type {any} */ x) => x.scope === want.scope);
    assert.ok(r, `${what} : pas de ligne de marge (portées : ${rows.map((/** @type {any} */ x) => x.scope ?? 'aucune').join(', ') || 'aucune ligne'})`);
    assert.equal(r.class, want.class, `${what} : classe`);
    if ('new' in want) assert.equal(r.new, want.new, `${what} : cible`);
    if ('reason' in want) assert.equal(r.reason ?? null, want.reason, `${what} : motif`);
  }
  const decisions = table.families.spacing.rows.filter((/** @type {any} */ r) => isMargin(r) && (t.noDecisionOn ?? []).includes(r.old) && r.class === 'décision');
  assert.deepEqual(decisions.map((/** @type {any} */ r) => `${r.old} ${r.scope ?? ''}`), [], `${trap.id} : décision sur une marge de ${t.noDecisionOn?.join(' ou ')}`);
}

for (const trap of E.traps)
  test(`${trap.id} : ${trap.title}`, () => {
    checkMargins(trap);
    checkTable(trap);
  });

test('simulation : chaque ligne de marge en décision touche ses éléments (relation calculée comme au relevé)', () => {
  const rows = table.families.spacing.rows.filter((/** @type {any} */ r) => isMargin(r) && r.class === 'décision');
  assert.ok(rows.length >= 3, `${rows.length} ligne(s)`);
  for (const r of rows) assert.ok(r.capture?.elements > 0, `${r.old} « ${r.scope} » : aucun élément touché dans la simulation`);
});

test(`ancien choix sans relation : ${E.oldDecision.rule}`, () => {
  assert.deepEqual(Object.fromEntries(Object.keys(E.oldDecision.map).map((k) => [k, old.map.spacing[k]])), E.oldDecision.map, 'simulation');
  for (const want of E.oldDecision.rows) {
    const r = old.table.families[want.family].rows.find((/** @type {any} */ x) => x.old === want.value && isMargin(x) && x.scope === want.scope);
    assert.ok(r, `${want.value} « ${want.scope} » absente`);
    assert.deepEqual(r.control?.after, want.after, `${want.value} « ${want.scope} » : espaces après décision`);
    assert.equal(r.control?.signal, want.signal, `${want.value} « ${want.scope} » : signal`);
  }
});
