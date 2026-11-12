// @ts-check
/**
 * Lot B : reduce sur les trois pages en désordre de la marque fictive
 * (desordre/carte, compte, gestion) avec la valise (cible-valise.json),
 * comparé à fixtures/marque-demo/expected-desordre-valise.json, écrit avant
 * le code du lot B et jamais recalé. La simulation est relue ici avec
 * scanInPage, comme reduce la pose : relevé du rendu avant puis après, pour
 * les critères globaux (contraste, bandeau tiers).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differenceEuclidean, wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { scanInPage, showInPage } from '../src/browser/simulate.js';
import { collectRendered } from '../src/browser/rendered.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
import { OUT } from '../src/reduce/propose.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));
const LOT_E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre.json', import.meta.url), 'utf8'));
const VALISE = JSON.parse(await readFile(new URL('../fixtures/marque-demo/cible-valise.json', import.meta.url), 'utf8'));
const HEX = Object.fromEntries(VALISE.colors.map((/** @type {any} */ c) => [c.name, c.value]));
const TOL = 0.01;
const APPLIED_CLASSES = new Set(['correction', 'proche', 'auto']);

/** Style calculé de chaque élément du bandeau tiers. */
function tiersInPage() {
  const PROPS = ['background-color', 'color', 'border-top-color', 'padding-top', 'padding-left', 'margin-top', 'border-top-left-radius', 'font-size', 'column-gap'];
  const root = document.querySelector('.tiers-cookies');
  if (!root) return null;
  return [root, ...root.querySelectorAll('*')].map((el) => {
    const cs = getComputedStyle(el);
    return PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
  });
}

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let table;
/** @type {Record<string, any>} */
let map;
/** @type {{ before: any[], after: any[] }} */
const pairs = { before: [], after: [] };
/** @type {{ page: string, before: any, after: any }[]} */
const tiers = [];

before(async () => {
  servers = await startFixtureServers();
  const urls = E.conditions.pages.map((/** @type {string} */ p) => servers.origin + p);
  const [first, ...rest] = E.conditions.pages;
  const [r] = await runReduce({
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-desordre-valise-')),
    now: new Date(2026, 10, 12, 12, 0),
  });
  table = r.table;
  map = r.map;
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  const agg = { before: createRenderedAggregator(), after: createRenderedAggregator() };
  try {
    for (const url of urls) {
      const context = await browser.newContext({ viewport: E.conditions.viewport });
      const page = await context.newPage();
      await gotoAndSettle(page, url, { waitMs: 100 });
      await page.evaluate(scanInPage, map);
      const t = { page: url, before: await page.evaluate(tiersInPage), after: null };
      agg.before.addPage(await collectRendered(page, { thirdParty: E.conditions.thirdParty }));
      await page.evaluate(showInPage, { on: true });
      t.after = await page.evaluate(tiersInPage);
      agg.after.addPage(await collectRendered(page, { thirdParty: E.conditions.thirdParty }));
      tiers.push(t);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  pairs.before = agg.before.result().contrast.pairs;
  pairs.after = agg.after.result().contrast.pairs;
});

after(async () => servers?.close());

/** @param {string} old */
const rowsOf = (old) => table.families.colors.rows.filter((/** @type {any} */ r) => r.old === old);
/** @param {any} r */
const appliedOf = (r) => (r.usage ? map.colors[`${r.old}|${r.usage}`] ?? map.colors[r.old] : map.colors[r.old]);
/** Paires de texte (hors icônes) sous 4,5:1. @param {any[]} list */
const below = (list) => list.filter((p) => p.ratio < 4.5 && p.n > p.nIcon);
/** @param {any} p */
const pairLabel = (p) => `${p.text} sur ${p.bg} (${p.ratio})`;

test('expected-desordre-valise.json : ΔE et contrastes recalculés avec culori', () => {
  const dOklab = differenceEuclidean('oklab');
  let checked = 0;
  /** @param {number} got @param {number} want @param {string} msg */
  const same = (got, want, msg) => {
    assert.ok(Math.abs(got - want) < 5e-4, `${msg} : ${got}, attendu ${want}`);
    checked++;
  };
  for (const e of E.colors)
    for (const r of e.rows ?? []) {
      const id = `${e.id} ${r.value}`;
      if (r.new && r.deltaE !== undefined) same(100 * dOklab(r.value, r.new), r.deltaE, `${id} ΔE`);
      if (r.nearest) same(100 * dOklab(r.value, HEX[r.nearest.name]), r.nearest.deltaE, `${id} ΔE au plus proche`);
      const c = r.contrast ?? r.contrastGraphic;
      if (c?.worstPair) {
        same(wcagContrast(r.value, c.worstPair.before.bg), c.worstPair.before.ratio, `${id} contraste avant`);
        same(wcagContrast(r.new, c.worstPair.after.bg), c.worstPair.after.ratio, `${id} contraste après`);
      } else if (c?.text) {
        same(wcagContrast(c.text, r.value), c.before, `${id} contraste avant`);
        if (c.after !== undefined) same(wcagContrast(c.text, r.new ?? r.value), c.after, `${id} contraste après`);
      } else if (c?.bg) {
        same(wcagContrast(r.value, c.bg), c.before, `${id} contraste avant`);
        // Après : sur le même fond, ou sur le fond rangé lui aussi ({ text, bg, ratio }).
        if (typeof c.after === 'object') same(wcagContrast(c.after.text, c.after.bg), c.after.ratio, `${id} contraste après`);
        else if (c.after !== undefined) same(wcagContrast(r.new ?? r.value, c.bg), c.after, `${id} contraste après`);
      }
    }
  assert.ok(checked > 40, `${checked} chiffres vérifiés`);
});

for (const e of E.colors.filter((/** @type {any} */ x) => x.rows)) {
  test(`${e.id} : ${e.rows.map((/** @type {any} */ r) => `${r.value} ${r.usage} → ${r.target ?? '—'}, ${r.class}`).join(' ; ')}`, () => {
    for (const want of e.rows) {
      const id = `${e.id} ${want.value} (${want.usage})`;
      const all = rowsOf(want.value);
      if (want.class === 'absent') {
        assert.deepEqual(all.map((/** @type {any} */ r) => r.class), [], `${id} : doit être absente de la table (${want.known})`);
        continue;
      }
      const wantClass = want.class === 'hors table' && want.reason?.startsWith('aucune échelle') ? OUT.scale : want.class;
      const r = all.find((/** @type {any} */ x) => (want.target ? x.name === want.target : x.class === wantClass));
      assert.ok(r, `${id} : ${all.map((/** @type {any} */ x) => `${x.name ?? '—'} « ${x.class} »`).join(', ') || 'absente'}, attendu ${want.target ?? '—'} « ${wantClass} »`);
      assert.equal(r.class, wantClass, `${id} : classe « ${r.class} », attendu « ${wantClass} »`);
      if (want.new) assert.equal(r.new, want.new, `${id} : vers ${r.new}`);
      const delta = want.target === null ? want.nearest?.deltaE : want.deltaE;
      if (delta !== undefined) assert.ok(Math.abs(r.delta - delta) <= TOL, `${id} : ΔE ${r.delta}, attendu ${delta}`);
      const applied = want.applied ?? APPLIED_CLASSES.has(wantClass);
      assert.equal(appliedOf(r), applied ? want.new : undefined, `${id} : application dans la simulation`);
      const c = want.contrast ?? want.contrastGraphic;
      /** @param {number} got @param {number} w @param {string} what */
      const close = (got, w, what) => assert.ok(Math.abs(got - w) <= TOL, `${id} : ${what} ${got}, attendu ${w}`);
      if (c?.worstPair || want.contrastGraphic) {
        // Paire la plus défavorable de la ligne (bordure de champ : contre le fond qui l'entoure).
        assert.ok(r.contrast, `${id} : contraste absent de la ligne`);
        close(r.contrast.before, c.worstPair ? c.worstPair.before.ratio : c.before, 'contraste avant (paire la plus défavorable)');
        close(r.contrast.after, c.worstPair ? c.worstPair.after.ratio : c.after, 'contraste après (paire la plus défavorable)');
      } else if (c) {
        // Paire nommée par l'attendu (texte sur fond), relevée dans le rendu avant, puis après si la ligne est appliquée.
        const text = c.text ?? want.value;
        const bg = c.text ? want.value : c.bg;
        const p = pairs.before.find((x) => x.text === text && x.bg === bg);
        assert.ok(p, `${id} : paire ${text} sur ${bg} absente du rendu avant`);
        close(p.ratio, c.before, `contraste avant (${text} sur ${bg})`);
        if (typeof c.after === 'object') {
          // Décision non appliquée : contraste avec la cible proposée, fond rangé (paire la plus défavorable de la ligne).
          assert.ok(r.contrast, `${id} : contraste absent de la ligne`);
          close(r.contrast.after, c.after.ratio, `contraste après (${c.after.text} sur ${c.after.bg})`);
        } else if (c.after !== undefined && applied) {
          const [ta, ba] = c.text ? [c.text, want.new] : [want.new, c.bg];
          const q = pairs.after.find((x) => x.text === ta && x.bg === ba);
          assert.ok(q, `${id} : paire ${ta} sur ${ba} absente du rendu après`);
          close(q.ratio, c.after, `contraste après (${ta} sur ${ba})`);
        }
      }
    }
  });
}

for (const e of E.radii ?? []) {
  test(`${e.id} rayons : ${e.rows.map((/** @type {any} */ r) => `${r.value} ${r.usage} → ${r.target}, ${r.class}`).join(' ; ')}`, () => {
    for (const want of e.rows) {
      const r = table.families.radii.rows.find((/** @type {any} */ x) => x.old === want.value && x.usage === want.usage);
      assert.ok(r, `${want.value} (${want.usage}) absente des rayons`);
      assert.equal(r.class, want.class, `${want.value} : classe « ${r.class} »`);
      assert.equal(r.new, want.new, `${want.value} : vers ${r.new}`);
      const m = map.radii[`${want.value}|${want.usage}`] ?? map.radii[want.value];
      assert.equal(m, APPLIED_CLASSES.has(want.class) ? want.new : undefined, `${want.value} : application`);
    }
  });
}

test('C20 et C21 : contenu et tiers absents de la table, comme au lot E', () => {
  const c20 = LOT_E.colors.find((/** @type {any} */ x) => x.id === 'C20');
  const c21 = LOT_E.colors.find((/** @type {any} */ x) => x.id === 'C21');
  for (const v of c20.values) assert.deepEqual(rowsOf(v.value), [], `${v.value} (contenu)`);
  for (const hex of c21.values) assert.deepEqual(rowsOf(hex), [], `${hex} (tiers)`);
});

test(`critère (a) : ${E.criteria.a.text}`, (t) => {
  const a = E.criteria.a;
  const before = below(pairs.before);
  const after = below(pairs.after);
  t.diagnostic(`avant simulation : ${before.length} paire(s) sous 4,5:1 ; après : ${after.length}`);
  for (const p of after) t.diagnostic(`reste : ${pairLabel(p)}`);
  assert.equal(before.length, a.before, 'paires sous 4,5:1 avant simulation');
  assert.deepEqual(
    after.map((p) => `${p.text}|${p.bg}`).sort(),
    a.remaining.map((/** @type {any} */ p) => `${p.text}|${p.bg}`).sort(),
    'paires restantes après simulation',
  );
  for (const want of a.remaining) {
    const p = after.find((x) => x.text === want.text && x.bg === want.bg);
    assert.ok(p && Math.abs(p.ratio - want.ratio) <= TOL, `${want.text} sur ${want.bg} : ${p?.ratio}, attendu ${want.ratio}`);
  }
});

test(`critère (b) : ${E.criteria.b}`, () => {
  for (const t of tiers) {
    assert.ok(t.before, `${t.page} : bandeau absent`);
    assert.deepEqual(t.after, t.before, t.page);
  }
});

test(`critère (c) : ${E.criteria.c}`, () => {
  for (const r of table.families.spacing.rows) {
    const n = /^(-?\d+(?:\.\d+)?)px$/.exec(r.old);
    if (!n || (Number(n[1]) >= 0 && Number(n[1]) <= 64)) continue;
    assert.equal(r.class, OUT.layout, `${r.old} (${r.usage})`);
    assert.equal(map.spacing[r.old] ?? map.spacing[`${r.old}|${r.usage}`], undefined, `${r.old} appliqué`);
  }
});

test(`critère (d) : ${E.criteria.d} (couleurs, seule famille de l'attendu)`, () => {
  const listed = new Set(E.colors.flatMap((/** @type {any} */ e) => (e.rows ?? []).map((/** @type {any} */ r) => r.value)));
  const surprises = table.families.colors.rows
    .filter((/** @type {any} */ r) => r.class !== 'inchangé' && !listed.has(r.old))
    .map((/** @type {any} */ r) => `${r.old} ${r.usage ?? ''} (${r.class})`);
  assert.deepEqual(surprises, []);
});
