// @ts-check
/**
 * Lot E2 : audit puis reduce sur la page des pièges de la marque fictive
 * (pieges/pieges.html), avec la valise (cible-valise.json), comparés à
 * fixtures/marque-demo/expected-pieges.json, écrit avant la page et jamais
 * recalé. Chaque piège a deux tests :
 *   today   ce que l'outil actuel produit (classes, cibles, et ce qui se voit
 *           après simulation) : il prouve que le piège reproduit le défaut ;
 *   afterB  le critère de fin du lot B, en attente (todo) d'ici là.
 * La simulation est relue ici avec scanInPage, comme reduce la pose : table
 * proposée, appliquée telle quelle, relevé avant puis après.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runAudit } from '../src/audit/run.js';
import { runReduce } from '../src/cli/reduce.js';
import { gotoAndSettle } from '../src/browser/navigate.js';
import { scanInPage, showInPage } from '../src/browser/simulate.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-pieges.json', import.meta.url), 'utf8'));
const TOL = 0.01;
const PX = 0.5;
const TODO = 'lot B';
const [WIDE, NARROW] = E.conditions.viewports.map((/** @type {any} */ v) => v.width);
/** @type {Record<string, any>} */
const T = Object.fromEntries(E.traps.map((/** @type {any} */ t) => [t.id, t]));

/** Éléments relevés avant et après simulation. */
const PROBES = {
  page: '.page',
  loupe: '.loupe',
  champ: '.recherche-champ',
  visuel: '.visuel',
  bandeau: '.une-bandeau',
  titreP3: '.tuile--description .tuile-titre',
  descP3: '.tuile--description .tuile-desc',
  tuileP3b: '.tuile--seule',
  titreP3b: '.tuile--seule .tuile-titre',
  avatar: '.avatar',
  carte: '.carte-equipe',
  pied: '.pied',
  tiers: '.tiers-cookies',
};

/**
 * Exécutée dans la page : rectangles (coordonnées de page), rayon, couleurs,
 * et style calculé de chaque élément du pied de page et du bandeau tiers.
 * @param {Record<string, string>} probes
 */
function probeInPage(probes) {
  const vw = document.documentElement.clientWidth;
  const PROPS = ['background-color', 'color', 'border-top-color', 'border-top-width', 'padding-top', 'padding-left', 'margin-top', 'margin-left', 'border-top-left-radius', 'font-size'];
  /** @param {Element} el */
  const style = (el) => {
    const cs = getComputedStyle(el);
    return PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
  };
  /** @param {string} sel */
  const subtree = (sel) => {
    const root = document.querySelector(sel);
    return root ? [root, ...root.querySelectorAll('*')].map(style) : null;
  };
  /** @type {Record<string, any>} */
  const out = {};
  for (const [k, sel] of Object.entries(probes)) {
    const el = document.querySelector(sel);
    if (!el) {
      out[k] = null;
      continue;
    }
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    out[k] = {
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      width: r.width,
      height: r.height,
      leftGap: r.left,
      rightGap: vw - r.right,
      radius: parseFloat(cs.borderTopLeftRadius),
      bg: cs.backgroundColor,
    };
  }
  out.piedStyle = subtree('.pied');
  out.tiersStyle = subtree('.tiers-cookies');
  return out;
}

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let audit;
/** @type {Record<number, { table: any, map: Record<string, Record<string, string>>, before: any, after: any }>} */
const at = {};

before(async () => {
  servers = await startFixtureServers();
  const url = servers.origin + E.conditions.page;
  const common = { addresses: [url], sourcesPath: `${FIXTURE_DIR}sources.json`, waitMs: 100, now: new Date(2026, 10, 12, 10, 0) };
  const auditRun = await runAudit({ ...common, viewport: { width: WIDE, height: 900 }, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-pieges-audit-')) });
  audit = JSON.parse(await readFile(join(auditRun[0].dir, 'audit.json'), 'utf8'));
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    for (const v of E.conditions.viewports) {
      const [r] = await runReduce({ ...common, viewport: v, targetPath: `${FIXTURE_DIR}cible-valise.json`, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-pieges-reduce-')) });
      const context = await browser.newContext({ viewport: v });
      const page = await context.newPage();
      await gotoAndSettle(page, url, { waitMs: 100 });
      await page.evaluate(scanInPage, r.map);
      const beforeSim = await page.evaluate(probeInPage, PROBES);
      await page.evaluate(showInPage, { on: true });
      const afterSim = await page.evaluate(probeInPage, PROBES);
      await context.close();
      at[v.width] = { table: r.table, map: r.map, before: beforeSim, after: afterSim };
    }
  } finally {
    await browser.close();
  }
});

after(async () => servers?.close());

/** @param {number} w @param {string} family @param {string} old */
const rowsOf = (w, family, old) => at[w].table.families[family].rows.filter((/** @type {any} */ r) => r.old === old);
/** @param {number} w @param {string} family @param {string} old */
const applied = (w, family, old) => at[w].map[family]?.[old];
/** @param {{ x: number, y: number, width: number, height: number }} a @param {{ x: number, y: number, width: number, height: number }} b */
const overlap = (a, b) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0 && Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0;
/**
 * Déplacement d'un élément par rapport à son repère (le bloc qui le porte) :
 * un piège voisin peut décaler toute la page sans que l'élément bouge dans son bloc.
 * @param {number} w @param {string} k @param {string} ref
 */
const moved = (w, k, ref) => {
  const { before: b, after: a } = at[w];
  return { dx: a[k].x - a[ref].x - (b[k].x - b[ref].x), dy: a[k].y - a[ref].y - (b[k].y - b[ref].y) };
};
/** @param {number} w */
const marginGap = (w) => Math.abs(at[w].after.page.leftGap - at[w].after.page.rightGap);
/** @param {number} n @param {number} want @param {string} msg */
const near = (n, want, msg) => assert.ok(Math.abs(n - want) <= PX, `${msg} : ${n}, attendu ${want}`);

/**
 * Lignes « today » : classe, cible, ΔE, égalité, application dans la simulation.
 * @param {any} trap
 */
function checkTodayRows(trap) {
  for (const want of trap.today.rows ?? []) {
    const family = want.family ?? 'colors';
    const got = rowsOf(WIDE, family, want.value);
    assert.equal(got.length, 1, `${trap.id} ${want.value} : ${got.length} ligne(s)`);
    const [r] = got;
    assert.equal(r.class, want.class, `${trap.id} ${want.value} : classe « ${r.class} », attendu « ${want.class} »`);
    assert.equal(r.new, want.new, `${trap.id} ${want.value} : vers ${r.new}, attendu ${want.new}`);
    if (want.deltaE !== undefined) assert.ok(Math.abs(r.delta - want.deltaE) <= TOL, `${trap.id} ${want.value} : ΔE ${r.delta}, attendu ${want.deltaE}`);
    if (want.tie) {
      const [a, b] = r.candidates;
      assert.equal(a.delta, b.delta, `${trap.id} ${want.value} : pas d'égalité (${a.value} ${a.delta}, ${b.value} ${b.delta})`);
      assert.deepEqual([a.value, b.value].sort(), [...want.tie].sort());
    }
    assert.equal(applied(WIDE, family, want.value), want.applied ? want.new : undefined, `${trap.id} ${want.value} : application dans la simulation`);
  }
}

/**
 * Lignes « afterB » : classe, cible, éléments, usages, tranche, application.
 * @param {any} trap
 * @param {number} [w]
 */
function checkAfterBRows(trap, w = WIDE) {
  for (const want of trap.afterB.rows ?? []) {
    const family = want.family ?? 'colors';
    const got = rowsOf(w, family, want.value).filter((/** @type {any} */ r) => !want.element || r.selectors.some((/** @type {string} */ s) => s.includes(want.element)));
    const r = got.find((/** @type {any} */ x) => x.class === want.class);
    assert.ok(r, `${trap.id} ${want.value}${want.element ? ` (${want.element})` : ''} : classe ${got.map((/** @type {any} */ x) => `« ${x.class} »`).join(', ') || 'absente'}, attendu « ${want.class} »`);
    if ('new' in want) assert.equal(r.new, want.new);
    if (want.elements !== undefined) assert.equal(r.count, want.elements, `${trap.id} : ${r.count} élément(s)`);
    if (want.usages) assert.deepEqual([...(r.usages ?? [])].sort(), [...want.usages].sort(), `${trap.id} : usages`);
    if (want.slice) assert.equal(r.slice, want.slice, `${trap.id} : tranche`);
    if (!want.element) assert.equal(applied(w, family, want.value), want.applied ? want.new : undefined, `${trap.id} ${want.value} : application`);
  }
}

test('la page est mesurée, le tiers écarté, la cible lue', () => {
  assert.equal(audit.pages.filter((/** @type {any} */ p) => !p.error).length, 1);
  assert.deepEqual(audit.rendered.thirdParty.invalid, []);
  assert.equal(audit.rendered.thirdParty.selectors['div.tiers-cookies'], 1);
  for (const w of [WIDE, NARROW]) for (const f of ['radii', 'spacing', 'fontSizes', 'colors']) assert.ok(at[w].table.families[f].rows.length > 0, `${w} ${f}`);
});

// P1 : marge auto.
test(`P1 today : ${T.P1.today.text}`, () => {
  checkTodayRows(T.P1);
  assert.ok(marginGap(WIDE) > T.P1.today.marginGapPx.greaterThan, `écart des marges après simulation à ${WIDE} : ${marginGap(WIDE)} px`);
});
test(`P1 afterB : ${T.P1.afterB.text}`, { todo: TODO }, () => {
  for (const w of [WIDE, NARROW]) {
    assert.equal(rowsOf(w, 'spacing', '40px').length, 0, `${w} : ligne 40px`);
    assert.ok(marginGap(w) <= T.P1.afterB.marginGapPx.atMost, `${w} : écart des marges ${marginGap(w)} px`);
  }
});

// P2 : marges négatives.
test(`P2 today : ${T.P2.today.text}`, () => {
  checkTodayRows(T.P2);
  near(Math.abs(moved(WIDE, 'loupe', 'champ').dx), T.P2.today.movesPx.loupe, 'déplacement de la loupe');
  near(Math.abs(moved(WIDE, 'bandeau', 'visuel').dy), T.P2.today.movesPx.bandeau, 'déplacement du bandeau');
});
test(`P2 afterB : ${T.P2.afterB.text}`, { todo: TODO }, () => {
  checkAfterBRows(T.P2);
  near(Math.abs(moved(WIDE, 'loupe', 'champ').dx), 0, 'déplacement de la loupe');
  near(Math.abs(moved(WIDE, 'bandeau', 'visuel').dy), 0, 'déplacement du bandeau');
});

// P3 : titre placé par une grande marge.
test(`P3 today : ${T.P3.today.text}`, () => {
  checkTodayRows(T.P3);
  assert.equal(overlap(at[WIDE].before.titreP3, at[WIDE].before.descP3), false, 'superposition avant simulation');
  assert.equal(overlap(at[WIDE].after.titreP3, at[WIDE].after.descP3), true, 'superposition après simulation');
});
test(`P3 afterB : ${T.P3.afterB.text}`, { todo: TODO }, () => {
  checkAfterBRows(T.P3);
  assert.equal(overlap(at[WIDE].after.titreP3, at[WIDE].after.descP3), false, 'superposition après simulation');
});

// P3b : contrôle, identique avant et après le lot B.
test(`P3b today : ${T.P3b.today.text}`, () => {
  checkTodayRows(T.P3b);
  near(Math.abs(moved(WIDE, 'titreP3b', 'tuileP3b').dy), T.P3b.today.movesPx.titre, 'déplacement du titre');
});
test(`P3b afterB : ${T.P3b.afterB.text}`, { todo: TODO }, () => {
  checkTodayRows({ id: 'P3b', today: T.P3b.afterB });
  near(Math.abs(moved(WIDE, 'titreP3b', 'tuileP3b').dy), T.P3b.afterB.movesPx.titre, 'déplacement du titre');
});

// P4 : avatar rond.
test(`P4 today : ${T.P4.today.text}`, () => {
  checkTodayRows(T.P4);
  near(at[WIDE].before.avatar.radius, 20, 'rayon de l’avatar avant');
  near(at[WIDE].after.avatar.radius, T.P4.today.avatarRadiusPx, 'rayon de l’avatar après');
});
test(`P4 afterB : ${T.P4.afterB.text}`, { todo: TODO }, () => {
  checkAfterBRows(T.P4);
  assert.ok(at[WIDE].after.avatar.radius >= T.P4.afterB.avatarRadiusPx.atLeast, `rayon de l’avatar après : ${at[WIDE].after.avatar.radius}`);
  near(at[WIDE].after.carte.radius, 20, 'rayon de la carte après');
});

// P5 : pied de page sombre.
test(`P5 today : ${T.P5.today.text}`, () => {
  checkTodayRows(T.P5);
  for (const v of T.P5.values.filter((/** @type {any} */ x) => x.contrast)) {
    const p = audit.rendered.contrast.pairs.find((/** @type {any} */ x) => x.text === v.contrast.text && x.bg === v.contrast.bg);
    assert.ok(p, `paire ${v.contrast.text} / ${v.contrast.bg} absente de l'audit`);
    assert.ok(Math.abs(p.ratio - v.contrast.ratio) <= TOL, `contraste ${p.ratio}, attendu ${v.contrast.ratio}`);
  }
  assert.notDeepEqual(at[WIDE].after.piedStyle, at[WIDE].before.piedStyle, 'le pied de page change à la simulation');
  assert.equal(at[WIDE].after.pied.bg, 'rgb(54, 48, 38)', 'fond du pied de page après');
});
test(`P5 afterB : ${T.P5.afterB.text}`, { todo: TODO }, () => {
  checkAfterBRows(T.P5);
  assert.deepEqual(at[WIDE].after.piedStyle, at[WIDE].before.piedStyle);
});

// P6 : tiers repeint.
test(`P6 today : ${T.P6.today.text}`, () => {
  checkTodayRows(T.P6);
  assert.equal(audit.rendered.families.colors.values['#555555'], undefined, '#555555 (texte du bandeau) mesuré');
  assert.equal(at[WIDE].before.tiers.bg, 'rgb(238, 238, 238)', 'fond du bandeau avant');
  assert.equal(at[WIDE].after.tiers.bg, 'rgb(236, 235, 233)', 'fond du bandeau après');
});
test(`P6 afterB : ${T.P6.afterB.text}`, { todo: TODO }, () => {
  assert.deepEqual(at[WIDE].after.tiersStyle, at[WIDE].before.tiersStyle);
});

// P7 : couleur de marque non déclarée.
test(`P7 today : ${T.P7.today.text}`, () => {
  checkTodayRows(T.P7);
  const [v] = T.P7.values;
  assert.equal(rowsOf(WIDE, 'colors', v.value)[0].count, v.elements, 'éléments violets');
  const p = audit.rendered.contrast.pairs.find((/** @type {any} */ x) => x.text === v.contrast.text && x.bg === v.contrast.bg);
  assert.ok(p, 'paire blanc sur violet absente de l’audit');
  assert.ok(Math.abs(p.ratio - v.contrast.ratio) <= TOL, `contraste ${p.ratio}, attendu ${v.contrast.ratio}`);
  assert.ok(p.belowAA > 0, 'blanc sur violet signalé sous AA');
});
test(`P7 afterB : ${T.P7.afterB.text}`, { todo: TODO }, () => {
  checkAfterBRows(T.P7);
  const w = T.P7.afterB.auditBelowAA;
  const p = audit.rendered.contrast.pairs.find((/** @type {any} */ x) => x.text === w.text && x.bg === w.bg);
  assert.ok(p?.belowAA > 0);
  assert.equal(p.fix ?? null, null, 'aucune correction proposée');
});

// P8 et P8b : bleu isolé, et son contrôle.
for (const id of ['P8', 'P8b']) {
  test(`${id} today : ${T[id].today.text}`, () => {
    checkTodayRows(T[id]);
    assert.equal(rowsOf(WIDE, 'colors', T[id].values[0].value)[0].count, T[id].values[0].elements, 'éléments');
  });
  test(`${id} afterB : ${T[id].afterB.text}`, { todo: TODO }, () => checkAfterBRows(T[id]));
}

test('aucune valeur hors pièges : chaque ligne qui n’est pas « inchangé » appartient à un piège', () => {
  /** @type {Set<string>} */
  const listed = new Set();
  for (const t of E.traps) {
    for (const v of t.values) listed.add(`${v.family ?? 'colors'}|${v.value}`);
    for (const r of t.today.rows ?? []) listed.add(`${r.family ?? 'colors'}|${r.value}`);
  }
  for (const w of [WIDE, NARROW]) {
    /** @type {string[]} */
    const surprises = [];
    for (const [f, fam] of Object.entries(at[w].table.families))
      for (const r of /** @type {any} */ (fam).rows) if (r.class !== 'inchangé' && !listed.has(`${f}|${r.old}`)) surprises.push(`${f} ${r.old} (${r.class})`);
    assert.deepEqual(surprises, [], `à ${w}`);
  }
});
