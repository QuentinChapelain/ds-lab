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
import { renderReview } from '../src/report/review.js';
import { writeFile } from 'node:fs/promises';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre-valise.json', import.meta.url), 'utf8'));

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let browser;
/** @type {string} */
let revue;
/** Clé de la mémoire de cette réduction. @type {string} */
let memoryKey;
/** Revue de la même table avec decisions-passage-2c.json. @type {string} */
let revueFichier;
/** @type {Record<string, string | false>} */
let fileDecisions;
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
  const saved = JSON.parse(await readFile(r.files[0], 'utf8'));
  memoryKey = `ds-lab-revue:${saved.host}:${saved.stamp}`;
  // Même table, relue avec les décisions du passage 2c (comme --decisions).
  const decisions = JSON.parse(await readFile(`${FIXTURE_DIR}decisions-passage-2c.json`, 'utf8'));
  const withFile = join(await mkdtemp(join(tmpdir(), 'ds-lab-revue-fichier-')), 'revue.html');
  await writeFile(withFile, renderReview(r.table, [], { host: saved.host, stamp: saved.stamp, target: 'cible-valise.json', decisions }));
  revueFichier = pathToFileURL(withFile).href;
  fileDecisions = decisions;
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

test('revue : dans une vignette, la cote est réduite et posée au bout de la bande, à droite', async () => {
  const { context, page } = await open();
  try {
    const c = card(page, 'esp-17');
    const pairs = await c.locator('.vig .ver:not([hidden])').evaluateAll((vers) =>
      vers.map((v) => {
        const z = /** @type {Element} */ (v.querySelector('.zone')).getBoundingClientRect();
        const k = /** @type {Element} */ (v.querySelector('.cote'));
        const r = k.getBoundingClientRect();
        return { zoneRight: z.right, coteRight: r.right, zoneMid: z.top + z.height / 2, coteMid: r.top + r.height / 2, size: parseFloat(getComputedStyle(k).fontSize) };
      }),
    );
    assert.ok(pairs.length > 0);
    for (const p of pairs) {
      assert.ok(Math.abs(p.coteRight - p.zoneRight) <= 1, `cote à ${p.coteRight}, bande jusqu’à ${p.zoneRight}`);
      assert.ok(Math.abs(p.coteMid - p.zoneMid) <= 1, 'cote centrée sur la bande');
      assert.ok(p.size < 11, `cote de ${p.size} px`);
    }
  } finally {
    await context.close();
  }
});

/** @param {any} page */
const bilan = (page) => page.locator('#bilan').textContent();
/** @param {any} page */
const stored = (page) => page.evaluate((/** @type {string} */ k) => localStorage.getItem(k), memoryKey);

test('revue : le compteur « n / 11 choisies » suit les choix ; « Suivante à choisir » donne le focus à la carte suivante', async () => {
  const { context, page } = await open();
  try {
    const total = [...byId.values()].filter((x) => x.row.class === 'décision').length;
    assert.equal(await bilan(page), `0 / ${total} choisies`);
    await page.click('#suivante');
    const first = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
    assert.equal(first, await page.locator('article.row.a-trancher').first().getAttribute('data-key'), 'focus sur la première carte à choisir');
    await page.keyboard.press('Enter');
    assert.equal(await bilan(page), `1 / ${total} choisies`);
    await page.click('#suivante');
    const second = await page.evaluate(() => document.activeElement?.getAttribute('data-key'));
    assert.notEqual(second, first);
    assert.equal(second, await page.locator('article.row.a-trancher').first().getAttribute('data-key'));
    const c = card(page, 'esp-17');
    await c.locator('.versions .v[data-value="8px"]').click();
    await c.locator('.retenir').click();
    assert.equal(await bilan(page), `2 / ${total} choisies`);
    await c.locator('.versions .v[data-v="0"]').click();
    await c.locator('.retenir').click();
    assert.equal(await bilan(page), `2 / ${total} choisies`, 'changer d’avis ne compte pas deux fois');
  } finally {
    await context.close();
  }
});

test('revue : mémoire propre à la réduction ; « Tout remettre à zéro » demande un second clic et vide la mémoire', async () => {
  const { context, page } = await open();
  try {
    const total = [...byId.values()].filter((x) => x.row.class === 'décision').length;
    assert.equal(await stored(page), null, 'rien d’écrit au chargement');
    const c = card(page, 'esp-17');
    await c.locator('.versions .v[data-value="8px"]').click();
    await c.locator('.retenir').click();
    assert.deepEqual(JSON.parse(/** @type {string} */ (await stored(page))), { [/** @type {any} */ (byId.get('esp-17')).key]: '8px' });
    await page.reload();
    assert.equal(await bilan(page), `1 / ${total} choisies`, 'choix relu de la mémoire');
    await page.click('#raz');
    assert.equal(await bilan(page), `1 / ${total} choisies`, 'un seul clic ne remet rien à zéro');
    assert.notEqual(await stored(page), null);
    await page.click('#raz');
    assert.equal(await bilan(page), `0 / ${total} choisies`);
    assert.equal(await stored(page), null, 'mémoire vidée');
    assert.equal(await card(page, 'esp-17').locator('.choix').textContent(), 'Pas encore choisie');
    await page.reload();
    assert.equal(await bilan(page), `0 / ${total} choisies`);
    assert.deepEqual(await exported(page), {});
  } finally {
    await context.close();
  }
});

test('revue : détail fermé par défaut sur toutes les cartes ; aucune opacité inférieure à 1, un refus affiche « Refusé »', async () => {
  const { context, page } = await open();
  try {
    const cards = await page.locator('article.row').count();
    assert.ok(cards > 0);
    assert.equal(await page.locator('article.row > details.detail').count(), cards, 'un détail par carte');
    assert.equal(await page.locator('article.row > details.detail[open]').count(), 0, 'détail fermé');
    const near = page.locator('article.row.c-proche').first();
    await near.locator('input[type=checkbox]').uncheck();
    assert.equal(await near.locator('.choix').textContent(), 'Refusé');
    assert.equal(await near.evaluate((el) => el.classList.contains('refuse')), true);
    const faded = await page.evaluate(() =>
      [...document.querySelectorAll('main *, .barre, .barre *')].filter((el) => parseFloat(getComputedStyle(el).opacity) < 1).map((el) => el.tagName + '.' + el.className),
    );
    assert.deepEqual(faded, []);
  } finally {
    await context.close();
  }
});

test('revue : détail en bas de la carte ; contraste « avec la valeur la plus proche » pour une décision, « proposée » pour une correction ; écart ΔE', async () => {
  const { context, page } = await open();
  try {
    const cards = await page.locator('article.row').count();
    assert.equal(await page.locator('article.row > details.detail:last-child').count(), cards, 'détail en dernier');
    const coul = await card(page, 'coul-24').locator('details.detail').textContent();
    assert.ok(coul?.includes('avec la valeur la plus proche'), coul ?? '');
    assert.ok(coul?.includes('écart ΔE 1,59'), coul ?? '');
    const corr = await page.locator('article.row.c-correction details.detail').first().textContent();
    assert.ok(corr?.includes('avec la valeur proposée'), corr ?? '');
  } finally {
    await context.close();
  }
});

test('revue : une seule étiquette d’usage quand deux disent la même chose', async () => {
  const { context, page } = await open();
  try {
    const doubles = await page.locator('article.row header').evaluateAll((hs) =>
      hs.flatMap((h) => {
        const tags = [...h.querySelectorAll('.usage, .quoi')].map((x) => (x.textContent ?? '').trim());
        return tags.filter((a) => tags.some((b) => b !== a && b.startsWith(`${a} `))).map((a) => `${a} (${tags.join(', ')})`);
      }),
    );
    assert.deepEqual(doubles, []);
  } finally {
    await context.close();
  }
});

test('revue : la remise à zéro écarte aussi les décisions venues de --decisions, et la barre l’indique', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  try {
    const page = await context.newPage();
    await page.goto(revueFichier);
    const total = [...byId.values()].filter((x) => x.row.class === 'décision').length;
    const fromFile = Object.keys(fileDecisions).filter((k) => [...byId.values()].some((x) => x.key === k && x.row.class === 'décision')).length;
    assert.ok(fromFile > 0);
    assert.equal(await bilan(page), `${fromFile} / ${total} choisies`, 'décisions du fichier relues');
    assert.equal(await page.locator('#ecartees').isVisible(), false);
    await page.click('#raz');
    await page.click('#raz');
    assert.equal(await bilan(page), `0 / ${total} choisies`);
    assert.equal(await page.locator('#ecartees').textContent(), 'décisions du fichier écartées');
    assert.equal(await page.locator('#ecartees').isVisible(), true);
    await page.reload();
    assert.equal(await bilan(page), `0 / ${total} choisies`, 'toujours écartées après rechargement');
    assert.equal(await page.locator('#ecartees').isVisible(), true);
    assert.deepEqual(await exported(page), {});
  } finally {
    await context.close();
  }
});
