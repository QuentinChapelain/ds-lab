// @ts-check
/**
 * Lot M (marque d'abord), étape 1 : pièges PM0 à PM8 sur la page
 * fixtures/marque-demo/marque/marque.html de la marque fictive, avec
 * fixtures/marque-demo/cible-marque.json (bloc brand), comparés à
 * fixtures/marque-demo/expected-marque.json, écrit avant le code et jamais recalé.
 *   construction   la page est bien celle décrite (couleurs, fonds, contrastes et
 *                  variables du back-office mesurés ici, sans l'outil) : passe dès que la page existe ;
 *   aujourd'hui    ce que l'outil d'avant le lot M produit (le piège reproduit le défaut) ;
 *                  ignoré une fois le lot M fait (AFTER_M) ;
 *   PM0 à PM8      ce que la lecture rapide et la table doivent produire après le lot M ;
 *   garde-fou      Orbe Café sans bloc brand : 12 décisions, inchangé.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatHex, parse, wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { gotoAndSettle } from '../src/browser/navigate.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-marque.json', import.meta.url), 'utf8'));
const CSS = (await readFile(new URL('../fixtures/marque-demo/marque/styles/marque.css', import.meta.url), 'utf8')).split('\n');
const TOL = 0.001;
// Lot M fait (étape 2, 13/11/2026) : les tests « aujourd'hui » décrivent l'outil d'avant, gardés mais ignorés.
const AFTER_M = true;

/**
 * Exécutée dans la page : couleur du texte, fond opaque le plus proche (ancêtres
 * compris) et attribut style de <html>, sans l'outil.
 * @param {string[]} selectors
 */
function probeInPage(selectors) {
  const opaqueBg = (/** @type {Element | null} */ e) => {
    for (let x = e; x; x = x.parentElement) {
      const bg = getComputedStyle(x).backgroundColor;
      const m = /rgba?\(([^)]+)\)/.exec(bg);
      const a = m ? m[1].split(',').map((s) => s.trim()) : [];
      if (a.length === 3 || (a.length === 4 && Number(a[3]) === 1)) return bg;
    }
    return 'rgb(255, 255, 255)';
  };
  return {
    htmlStyle: document.documentElement.getAttribute('style'),
    elements: selectors.map((s) => {
      const e = document.querySelector(s);
      return e ? { selector: s, color: getComputedStyle(e).color, bg: opaqueBg(e) } : { selector: s, missing: true };
    }),
  };
}

/** @param {string} css */
const hex = (css) => formatHex(parse(css));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let probe;
/** @type {any} */
let table;
/** @type {any} */
let guardTable;
/** Cas décidé (decisions.json) : migration et consigne. @type {{ migration: any, markdown: string }} */
const decided = { migration: null, markdown: '' };
/** @type {any} */
let read = null;
/** @type {string | null} */
let readMissing = null;

before(async () => {
  servers = await startFixtureServers();
  const url = servers.origin + E.conditions.page;
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: E.conditions.viewport });
    const page = await context.newPage();
    await gotoAndSettle(page, url, { waitMs: 100 });
    probe = await page.evaluate(probeInPage, E.traps.flatMap((/** @type {any} */ t) => (t.elements ?? []).map((/** @type {any} */ x) => x.selector)));
    await context.close();
  } finally {
    await browser.close();
  }
  const [r] = await runReduce({
    addresses: [url],
    targetPath: `${FIXTURE_DIR}cible-marque.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-marque-')),
    now: new Date(2026, 10, 13, 12, 0),
  });
  table = r.table;
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-marque-decide-'));
  const decisionsPath = join(dir, 'decisions.json');
  await writeFile(decisionsPath, JSON.stringify(E.decided.decisions));
  const [dd] = await runReduce({
    addresses: [url],
    targetPath: `${FIXTURE_DIR}cible-marque.json`,
    decisionsPath,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: dir,
    now: new Date(2026, 10, 13, 12, 15),
  });
  decided.migration = dd.migration;
  decided.markdown = await readFile(dd.files[2], 'utf8');
  const [first, ...rest] = E.guard.pages;
  const [g] = await runReduce({
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.guard.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-marque-garde-')),
    now: new Date(2026, 10, 13, 12, 30),
  });
  guardTable = g.table;
  try {
    const { readBrand } = await import('../src/brand/read.js');
    read = await readBrand({ addresses: [url], viewport: E.conditions.viewport, waitMs: 100, prefix: E.conditions.prefix });
  } catch (e) {
    readMissing = /** @type {Error} */ (e).message;
  }
});

after(async () => servers?.close());

/** @param {string} value @param {string} usage */
const rowOf = (value, usage) => table.families.colors.rows.find((/** @type {any} */ r) => r.old === value && r.usage === usage);

test('construction : variables du back-office, couleurs, fonds et contrastes conformes aux attendus (sans l’outil)', () => {
  const style = probe.htmlStyle ?? '';
  for (const v of E.traps[0].read.variables) {
    const m = new RegExp(`${v.name}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(style);
    assert.ok(m, `<html style> sans ${v.name}`);
    assert.equal(m[1].toLowerCase(), v.value, `${v.name}`);
  }
  assert.match(style, /--orbe-largeur/, 'variable sans rapport absente de <html style>');
  const want = E.traps.flatMap((/** @type {any} */ t) => (t.elements ?? []).map((/** @type {any} */ x) => ({ ...x, id: t.id })));
  want.forEach((w, i) => {
    const g = probe.elements[i];
    assert.equal(g.missing, undefined, `${w.id} : ${w.selector} absent de la page`);
    assert.equal(hex(g.color), w.color, `${w.id} ${w.selector} : couleur`);
    assert.equal(hex(g.bg), w.bg, `${w.id} ${w.selector} : fond`);
    const c = wcagContrast(w.color, w.bg);
    assert.ok(Math.abs(c - w.contrast) <= TOL, `${w.id} ${w.selector} : contraste ${c}, attendu ${w.contrast}`);
  });
  for (const where of E.traps[0].read.contradictions[0].where) {
    const line = Number(where.split(':')[1]);
    assert.match(CSS[line - 1], /#dd3f2b/, `marque.css:${line} ne porte pas #dd3f2b`);
  }
});

for (const trap of E.traps.filter((/** @type {any} */ t) => t.rows))
  test(`aujourd’hui ${trap.id} : le piège reproduit le défaut`, { skip: AFTER_M && 'lot M fait' }, () => {
    for (const row of trap.rows) {
      const r = rowOf(row.value, row.usage);
      assert.ok(r, `${row.value} ${row.usage} : pas de ligne`);
      assert.equal(r.class, row.today.class, `${row.value} ${row.usage} : classe`);
      assert.equal(r.name, row.today.name, `${row.value} ${row.usage} : pas`);
    }
  });

/** @param {any} trap */
function checkRows(trap) {
  for (const row of trap.rows ?? []) {
    const what = `${trap.id} ${row.value} ${row.usage}`;
    const r = rowOf(row.value, row.usage);
    assert.ok(r, `${what} : pas de ligne`);
    const w = row.want;
    assert.equal(r.class, w.class, `${what} : classe`);
    if ('name' in w) assert.equal(r.name, w.name, `${what} : pas`);
    if ('new' in w) assert.equal(r.new, w.new, `${what} : cible`);
    if ('slot' in w) assert.equal(r.slot, w.slot, `${what} : emplacement`);
    if ('reason' in w) assert.equal(r.reason ?? null, w.reason, `${what} : motif`);
    if ('alternatives' in w) assert.deepEqual(r.alternatives ?? [], w.alternatives, `${what} : secondes versions (M6)`);
    if ('exception' in w) assert.deepEqual(r.exception ?? null, w.exception, `${what} : exception (M6)`);
    // Vignettes de version : la paire la plus défavorable de la ligne, toutes pages (fonds actuels).
    if (row.tiles)
      assert.deepEqual(
        (r.capture?.versions ?? []).map((/** @type {any} */ v) => ({ value: v.value, ratio: v.contrast?.ratio, threshold: v.contrast?.threshold, bg: v.contrast?.bg, ...(v.contrast?.bgToday ? { bgToday: v.contrast.bgToday } : {}) })),
        row.tiles,
        `${what} : contraste des vignettes de version`,
      );
  }
}

/** @param {any} trap */
function checkBrand(trap) {
  const b = trap.tableBrand;
  if (!b) return;
  assert.ok(table.brand, `${trap.id} : table sans bloc brand`);
  if (b.slots) assert.deepEqual(table.brand.slots, b.slots, `${trap.id} : emplacements`);
  if (b.contradictions) assert.deepEqual(table.brand.contradictions, b.contradictions, `${trap.id} : contradictions tranchées par la cible (M7)`);
}

/** @param {any} trap */
function checkRead(trap) {
  const want = trap.read;
  if (!want) return;
  assert.ok(read, `${trap.id} : lecture rapide absente, src/brand/read.js (M0) : ${readMissing}`);
  assert.deepEqual(read.variables, want.variables, `${trap.id} : variables ${E.conditions.prefix}* de <html>`);
  const strong = read.strong.map((/** @type {any} */ s) => s.value);
  for (const v of want.strongIncludes) assert.ok(strong.includes(v), `${trap.id} : couleur forte manquante ${v}`);
  for (const v of want.strongExcludes) assert.ok(!strong.includes(v), `${trap.id} : ${v} n’est pas une couleur forte`);
  assert.deepEqual(read.contradictions, want.contradictions, `${trap.id} : contradictions`);
}

for (const trap of E.traps)
  test(`${trap.id} : ${trap.title}`, () => {
    checkRead(trap);
    checkBrand(trap);
    checkRows(trap);
  });

test(E.decided.title, () => {
  const want = E.decided.row;
  const row = decided.migration.rows.find((/** @type {any} */ r) => r.value === want.value && r.usage === want.usage);
  assert.ok(row, `${want.value} ${want.usage} : pas de ligne dans la migration`);
  assert.equal(row.status, want.status, 'statut');
  assert.equal(row.new, want.new, 'valeur décidée');
  const brief = decided.markdown.slice(decided.markdown.indexOf('REMPLACEMENTS'));
  const line = brief.split('\n').find((l) => l.includes(`remplace ${want.value} par`));
  assert.ok(line, `consigne : aucune ligne de remplacement pour ${want.value}`);
  for (const part of E.decided.agentLine) assert.ok(line.includes(part), `consigne : « ${part} » absent de\n${line}`);
});

test(`garde-fou : ${E.guard.title}`, () => {
  const n = Object.values(guardTable.families).reduce((t, f) => t + /** @type {any} */ (f).rows.filter((/** @type {any} */ r) => r.class === 'décision').length, 0);
  assert.equal(n, E.guard.decisions, 'décisions d’Orbe Café');
  assert.equal(guardTable.brand ?? null, null, 'sans bloc brand dans la cible, pas de bloc brand dans la table');
});
