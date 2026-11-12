// @ts-check
/**
 * Lot R : la carte de décision dans revue.html (réduction des pages en désordre sur la valise).
 * Sélecteur de versions (clic, ←/→), une seule image, « Choisir cette version » (ou Entrée).
 * Afficher une version ne change pas l'export ; une décision pas encore choisie en est absente,
 * l'actuelle choisie y vaut false. Contrastes des versions recalculés avec culori.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { rowKey } from '../src/reduce/propose.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let browser;
/** @type {string} */
let revue;
/** @type {Map<string, { key: string, row: any, family: string }>} */
const byId = new Map();

before(async () => {
  servers = await startFixtureServers();
  const [first, ...rest] = E.conditions.pages;
  const [r] = await runReduce({
    addresses: [servers.origin + first, ...rest],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-revue-')),
    now: new Date(2026, 10, 12, 17, 0),
  });
  revue = pathToFileURL(r.files[1]).href;
  for (const [family, f] of Object.entries(r.table.families)) for (const row of f.rows) byId.set(row.id, { key: rowKey(family, row), row, family });
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** Page de revue neuve (stockage local vide). */
async function open() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  await page.goto(revue);
  return { context, page };
}
/** @param {any} page @returns {Promise<Record<string, string | false>>} */
async function exported(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  return JSON.parse(await readFile(await download.path(), 'utf8'));
}
/** @param {any} page @param {string} id */
const card = (page, id) => page.locator(`article.row[data-key="${/** @type {any} */ (byId.get(id)).key}"]`);

test('revue : chaque décision est « Pas encore choisie », une image affichée, un bouton par version', async () => {
  const { context, page } = await open();
  try {
    const decisions = [...byId.values()].filter((x) => x.row.class === 'décision');
    assert.equal(await page.locator('article.row.decision').count(), decisions.length);
    for (const { row } of decisions) {
      const c = card(page, row.id);
      assert.ok(await c.evaluate((el) => el.classList.contains('a-trancher')), `${row.id} : à trancher`);
      assert.equal(await c.locator('.choix').textContent(), 'Pas encore choisie');
      const n = row.capture.elements;
      assert.equal(await c.locator('.portee').textContent(), `Ce choix s’applique à ${n} ${n === 1 ? 'élément' : 'éléments'}`);
      const more = n - 1 - row.capture.others.length;
      assert.equal(await c.locator('.encore').count(), more > 0 ? 1 : 0, `${row.id} : « et n autres »`);
      assert.equal(await c.locator('.versions .v[data-v="0"] .nom').textContent().then((t) => t?.includes('la choisir garde la valeur')), true, `${row.id} : aide de l’actuelle`);
      assert.equal(await c.locator('.versions .v').count(), row.capture.versions.length, `${row.id} : versions`);
      assert.equal(await c.locator('.vue .ver:not([hidden])').count(), 1, `${row.id} : une seule image affichée`);
      assert.equal(await c.locator('.versions .v.retenue').count(), 0, `${row.id} : rien de retenu`);
      // Taille CSS du cadre, 2× sous 200 px de large, dans la largeur de la carte.
      const w = row.capture.clip.width;
      const [shown, room] = await c.locator('.vue').evaluate((el) => {
        const p = /** @type {HTMLElement} */ (el.parentElement);
        const cs = getComputedStyle(p);
        return [el.getBoundingClientRect().width, p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)];
      });
      assert.ok(Math.abs(shown - Math.min(w < 200 ? 2 * w : w, room)) <= 2, `${row.id} : image de ${shown} px pour ${w} px de cadre`);
    }
  } finally {
    await context.close();
  }
});

test('revue : parcourir les versions sans choisir laisse l’export vide', async () => {
  const { context, page } = await open();
  try {
    for (const { row } of [...byId.values()].filter((x) => x.row.class === 'décision')) {
      const c = card(page, row.id);
      const n = row.capture.versions.length;
      for (let i = n - 1; i >= 0; i--) await c.locator(`.versions .v[data-v="${i}"]`).click();
      await c.focus();
      for (let i = 0; i < n; i++) await page.keyboard.press('ArrowRight');
      assert.equal(await c.getAttribute('data-vue'), String(n - 1), `${row.id} : ← → parcourent les versions`);
      assert.equal(await c.locator(`.vue .ver[data-v="${n - 1}"]`).isVisible(), true);
      // Les vignettes suivent la version affichée.
      const vigs = row.capture.others.length;
      assert.equal(await c.locator('.vig').count(), vigs, `${row.id} : vignettes`);
      assert.equal(await c.locator(`.vig .ver[data-v="${n - 1}"]:not([hidden])`).count(), vigs, `${row.id} : vignettes à la version affichée`);
      assert.equal(await c.locator('.vig .ver:not([hidden])').count(), vigs);
      for (const w of await c.locator('.vig').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width))) assert.ok(w <= 240.5, `${row.id} : vignette de ${w} px`);
      await page.keyboard.press('ArrowLeft');
    }
    assert.deepEqual(await exported(page), {});
  } finally {
    await context.close();
  }
});

test('revue : choisir l’actuelle exporte false, « Gardée : 10 px »', async () => {
  const { context, page } = await open();
  try {
    const { key } = /** @type {any} */ (byId.get('esp-17'));
    const c = card(page, 'esp-17');
    await c.locator('.versions .v[data-v="2"]').click();
    await c.focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    assert.equal(await c.locator('.choix').textContent(), 'Gardée : 10 px');
    assert.equal(await c.evaluate((el) => el.classList.contains('a-trancher')), false);
    assert.deepEqual(await exported(page), { [key]: false });
  } finally {
    await context.close();
  }
});

test('revue : choisir 8 px exporte « 8px » ; afficher ensuite une autre version ne change pas l’export', async () => {
  const { context, page } = await open();
  try {
    const { key } = /** @type {any} */ (byId.get('esp-17'));
    const c = card(page, 'esp-17');
    await c.locator('.versions .v[data-value="8px"]').click();
    await c.locator('.retenir').click();
    assert.equal(await c.locator('.retenir').textContent(), 'Choisir cette version');
    assert.equal(await c.locator('.choix').textContent(), 'Choisie : 8 px');
    await c.locator('.versions .v[data-v="0"]').click();
    assert.deepEqual(await exported(page), { [key]: '8px' });
  } finally {
    await context.close();
  }
});

test('revue : sous chaque version de couleur, le contraste le plus faible et son seuil (recalculé avec culori)', async () => {
  const { context, page } = await open();
  try {
    const colors = [...byId.values()].filter((x) => x.row.class === 'décision' && x.family === 'colors');
    assert.ok(colors.length > 0);
    for (const { row } of colors) {
      const c = card(page, row.id);
      for (const [i, v] of row.capture.versions.entries()) {
        assert.ok(v.contrast, `${row.id} ${v.label} : contraste`);
        assert.ok(Math.abs(wcagContrast(v.contrast.text, v.contrast.bg) - v.contrast.ratio) < 5e-4, `${row.id} ${v.label} : ${v.contrast.ratio}`);
        const smalls = await c.locator(`.versions .v[data-v="${i}"] small`).allTextContents();
        const fr = (/** @type {number} */ n) => String(Math.round(n * 100) / 100).replace('.', ',');
        const pass = v.contrast.ratio >= v.contrast.threshold;
        assert.ok(smalls.includes(`${fr(v.contrast.ratio)} · ${pass ? 'passe' : 'sous'} le seuil de ${fr(v.contrast.threshold)}`), `${row.id} ${v.label} : ${smalls.join(' | ')}`);
        const other = row.usage === 'texte' || row.usage === 'bordure' ? `sur le fond actuel ${v.contrast.bg}` : `avec le texte actuel ${v.contrast.text}`;
        assert.ok(smalls.includes(other), `${row.id} ${v.label} : ${smalls.join(' | ')}`);
      }
    }
  } finally {
    await context.close();
  }
});
