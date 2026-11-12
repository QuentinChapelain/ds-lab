// @ts-check
/**
 * Lot R, R-3 : une capture par version de chaque décision (actuelle, puis chaque candidat),
 * sur la réduction des trois pages en désordre avec la valise. Chaque version ne change que
 * sa ligne ; la valeur calculée de l'élément est celle de la version ; toutes les versions
 * d'une décision ont le même cadre et la même taille d'image ; ce cadre contient le contexte
 * de la règle R-9 (voisin du côté de la marge, libellé d'un champ, enfants d'une gouttière) ;
 * images en densité 2 et zone d'espace de chaque version à la mesure de sa valeur (R-8).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { scanInPage, showInPage } from '../src/browser/simulate.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any[]} */
let decisions = [];
/** @type {any} */
let saved;

before(async () => {
  servers = await startFixtureServers();
  const [first, ...rest] = E.conditions.pages;
  const [r] = await runReduce({
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-versions-')),
    now: new Date(2026, 10, 12, 16, 0),
  });
  decisions = Object.values(r.table.families).flatMap((/** @type {any} */ f) => f.rows.filter((/** @type {any} */ x) => x.class === 'décision'));
  saved = JSON.parse(await readFile(r.files[0], 'utf8'));
});

after(async () => servers?.close());

/** Largeur et hauteur lues dans l'en-tête IHDR d'un PNG. @param {string} b64 */
const pngSize = (b64) => {
  const b = Buffer.from(b64, 'base64');
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
};

test('R-3 : chaque décision a une version actuelle, puis une par candidat', () => {
  assert.ok(decisions.length > 0);
  for (const r of decisions) {
    assert.ok(r.capture, `${r.id} sans capture`);
    const want = [{ label: 'actuelle', value: r.old }, ...r.candidates.map((/** @type {any} */ c, /** @type {number} */ n) => ({ label: `candidat ${n + 1}`, value: c.value }))];
    assert.deepEqual(r.capture.versions.map((/** @type {any} */ v) => ({ label: v.label, value: v.value })), want, r.id);
  }
});

test('R-3 : pour chaque version, la valeur calculée de l’élément est celle de la version', () => {
  for (const r of decisions)
    for (const v of r.capture.versions) {
      const measured = Object.entries(v.measured);
      assert.ok(measured.length > 0, `${r.id} ${v.label} : aucune propriété mesurée`);
      for (const [prop, value] of measured) assert.equal(value, v.value, `${r.id} ${v.label} : ${prop}`);
    }
});

test('R-3 : les versions d’une même décision ont le même cadre et la même taille d’image', () => {
  for (const r of decisions) {
    const { clip } = r.capture;
    for (const v of r.capture.versions) {
      assert.deepEqual([v.shot.width, v.shot.height], [clip.width, clip.height], `${r.id} ${v.label} : cadre`);
      assert.equal(v.shot.scale, 2, `${r.id} ${v.label} : densité`);
      assert.deepEqual(pngSize(v.shot.png), { width: clip.width * 2, height: clip.height * 2 }, `${r.id} ${v.label} : image en densité 2`);
    }
  }
});

test('R-3 : les captures sont rangées avec leur ligne dans table.json', () => {
  const byId = new Map(Object.values(saved.table.families).flatMap((/** @type {any} */ f) => f.rows.map((/** @type {any} */ x) => [x.id, x])));
  for (const r of decisions) assert.deepEqual(byId.get(r.id)?.capture, r.capture, r.id);
});

test('R-9 : sous chaque version, le cadre contient le rectangle du voisin (libellé, enfants, bord du parent)', () => {
  /** @param {any} c @param {any} r */
  const inside = (c, r) => r.x >= c.x - 0.5 && r.y >= c.y - 0.5 && r.x + r.width <= c.x + c.width + 0.5 && r.y + r.height <= c.y + c.height + 0.5;
  /** @type {Set<string>} */
  const kinds = new Set();
  for (const r of decisions) {
    const { clip } = r.capture;
    assert.ok(clip.height <= 400, `${r.id} : hauteur ${clip.height}`);
    for (const v of r.capture.versions)
      for (const a of v.around) {
        kinds.add(a.kind);
        assert.ok(inside(clip, a.rect), `${r.id} ${v.label} : ${a.kind}${a.side ? ` (${a.side})` : ''} hors du cadre`);
      }
  }
  assert.ok(kinds.has('voisin') && kinds.has('enfant') && kinds.has('libellé'), `contextes vus : ${[...kinds].join(', ')}`);
});

test('R-8 : la zone d’espace a la largeur ou la hauteur de la valeur de la version, à 1 px près', () => {
  const spacing = decisions.filter((r) => r.id.startsWith('esp-'));
  assert.ok(spacing.length > 0);
  for (const r of spacing)
    for (const v of r.capture.versions) {
      assert.ok(v.space.length > 0, `${r.id} ${v.label} : aucune zone`);
      const want = parseFloat(v.value);
      for (const z of v.space) {
        const ok = Math.abs(z.rect.width - want) <= 1 || Math.abs(z.rect.height - want) <= 1;
        assert.ok(ok, `${r.id} ${v.label} ${z.side ?? z.axis} : ${z.rect.width} × ${z.rect.height}, attendu ${want} px`);
        assert.ok(Math.abs(z.px - want) <= 1, `${r.id} ${v.label} : cote ${z.px}`);
      }
    }
});

test('R-3 : pour chaque version, la valeur calculée de chaque élément en vignette est celle de la version', () => {
  let seen = 0;
  for (const r of decisions) {
    const { others, elements } = r.capture;
    assert.ok(others.length <= 3, `${r.id} : ${others.length} vignettes`);
    assert.ok(elements >= 1 + others.length, `${r.id} : ${elements} éléments pour ${others.length} vignettes`);
    assert.equal(others.length, Math.min(3, elements - 1), `${r.id} : vignettes`);
    for (const o of others) {
      assert.notEqual(o.element.index === r.capture.element.index && o.page === r.capture.page, true, `${r.id} : vignette de l’élément principal`);
      assert.deepEqual(o.versions.map((/** @type {any} */ v) => v.value), r.capture.versions.map((/** @type {any} */ v) => v.value), `${r.id} : mêmes versions`);
      // Cadre réduit : l'élément et son voisin direct, sans libellé ni champ du voisin.
      const c = o.clip;
      const box = o.versions[0].shot.box;
      for (const v of o.versions)
        for (const a of v.around.filter((/** @type {any} */ x) => x.kind === 'voisin' || x.kind === 'enfant'))
          assert.ok(a.rect.x >= c.x - 0.5 && a.rect.y >= c.y - 0.5 && a.rect.x + a.rect.width <= c.x + c.width + 0.5 && a.rect.y + a.rect.height <= c.y + c.height + 0.5 || c.height === 400, `${r.id} vignette : voisin hors cadre`);
      assert.ok(box.x >= 0 && box.y >= 0, `${r.id} vignette : élément dans le cadre`);
      for (const v of o.versions) {
        const measured = Object.entries(v.measured);
        assert.ok(measured.length > 0, `${r.id} vignette ${v.label} : aucune propriété mesurée`);
        for (const [prop, value] of measured) assert.equal(value, v.value, `${r.id} vignette ${o.element.tag} ${v.label} : ${prop}`);
        seen++;
      }
    }
  }
  assert.ok(seen > 0);
});

test('simulation : la valeur d’un champ rempli est recolorée, coul-02 s’applique à 51 éléments comme son titre', () => {
  const r = decisions.find((x) => x.id === 'coul-02');
  assert.ok(r, 'coul-02 absente');
  const m = /et (\d+) autres/.exec(r.title);
  const announced = m ? Number(m[1]) + 1 : 1;
  assert.equal(announced, 51, `titre : ${r.title}`);
  assert.equal(r.capture.elements, announced, `capture : ${r.capture.elements} éléments touchés`);
  const fields = r.capture.touched.filter((/** @type {any} */ t) => /^(input|textarea|select)\b/.test(t.selector)).map((/** @type {any} */ t) => t.selector);
  assert.deepEqual(fields.sort(), ['input#courriel', 'input#nom', 'input#telephone']);
});

test('simulation : la taille du texte d’un champ rempli change aussi, comme sa couleur', async () => {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent('<!doctype html><html><body><label for="m">E-mail</label> <input id="m" style="font-size:15px;color:#595959"></body></html>');
    await page.fill('#m', 'X');
    await page.evaluate(scanInPage, { fontSizes: { '15px': '16px' }, colors: { '#595959|texte': '#363026' } });
    await page.evaluate(showInPage, { on: true });
    const cs = await page.evaluate(() => {
      const s = getComputedStyle(/** @type {Element} */ (document.querySelector('#m')));
      return { size: s.fontSize, color: s.color };
    });
    assert.equal(cs.color, 'rgb(54, 48, 38)', 'couleur');
    assert.equal(cs.size, '16px', 'taille du texte');
  } finally {
    await browser.close();
  }
});
