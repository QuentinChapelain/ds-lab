// @ts-check
/**
 * Lot J, bloc 4 (J5, J7). Attendus écrits avant le code :
 * J5. Les éléments tiers déclarés (sources.json, thirdParty, ex. bandeau de cookies) sont masqués
 *     (visibility: hidden) le temps des captures des cartes : aucun de leurs pixels dans une capture.
 * J7. Dans la revue, un panneau fixe à droite montre la page telle qu'elle existe (l'image « avant »
 *     déjà dans revue.html, pas de nouvelle capture), visible au défilement. Quand une carte devient
 *     active (clic, ou « Suivante à choisir »), il affiche la page de cette carte et défile jusqu'à la
 *     position de son premier élément. Pas de repère ni d'encadré. Sur écran étroit, il passe sous la carte.
 * Page fictive (cible-valise d'Orbe Café), 400 × 700 : texte #201d17 recouvert en partie par un
 * bandeau tiers .tiers-cookies #1b1b1b ; bordure #333333 d'un cadre à 1500 px du haut.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J5 J7</title>
<style>html,body{margin:0;background:#ffffff;font:16px/1.4 Arial,sans-serif;color:#363026}body{height:2000px;position:relative}
.cible{position:absolute;top:300px;left:20px;width:300px;margin:0;color:#201d17}
.tiers-cookies{position:absolute;top:290px;left:0;width:400px;height:40px;background-color:#1b1b1b;color:#f5f5f5;font-size:12px}
.cadre{position:absolute;top:1500px;left:20px;width:200px;padding:8px;border:2px solid #333333}
</style></head>
<body><p class="cible">Texte de la page, sous le bandeau</p><div class="tiers-cookies">Cookies</div><div class="cadre">Cadre</div></body></html>`;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;
/** @type {any} */
let browser;

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j4-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/j/p.html`],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: { width: 400, height: 700 },
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-j4-out-')),
  });
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** @param {string} old @param {string} usage */
const row = (old, usage) => run.table.families.colors.rows.find((/** @type {any} */ r) => r.old === old && r.usage === usage);
/** Pixels d'une couleur exacte dans une capture. @param {string} b64 @param {string} hex */
const count = (b64, hex) => {
  const png = PNG.sync.read(Buffer.from(b64, 'base64'));
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) if (png.data[i] === r && png.data[i + 1] === g && png.data[i + 2] === b) n++;
  return n;
};

test('J5 : le bandeau tiers n’apparaît dans aucune capture de la carte du texte qu’il recouvre', () => {
  const r = row('#201d17', 'texte');
  assert.ok(r?.capture?.versions?.length >= 2, 'carte capturée');
  for (const v of r.capture.versions) assert.equal(count(v.shot.png, '#1b1b1b'), 0, `${v.label} : pixels du bandeau`);
  assert.ok(count(r.capture.versions[0].shot.png, '#201d17') > 0, 'le texte, lui, est visible');
});

test('J7 : chaque carte porte sa page et la position de son premier élément ; le panneau existe, sans repère', async () => {
  const p = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const card = p.locator('article[data-key="colors|#333333|bordure"]');
    assert.equal(await card.getAttribute('data-page'), '0');
    const y = Number(await card.getAttribute('data-y'));
    assert.ok(Math.abs(y - 1500) <= 1, `data-y ${y}`);
    const panel = p.locator('#apercu');
    assert.equal(await panel.count(), 1);
    assert.equal(await panel.locator('.apercu-vue > *').count(), 1, 'une seule image, ni repère ni encadré');
  } finally {
    await p.close();
  }
});

test('J7 : carte active (clic) : le panneau montre l’image « avant » de sa page, défilée jusqu’à son premier élément, et reste visible au défilement', async () => {
  const p = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const card = p.locator('article[data-key="colors|#333333|bordure"]');
    await card.locator('button.v').nth(1).click();
    await p.waitForFunction(() => {
      const i = /** @type {HTMLImageElement | null} */ (document.querySelector('#apercu img'));
      return !!i && i.complete && i.naturalWidth > 0 && /** @type {HTMLElement} */ (document.querySelector('#apercu .apercu-vue')).scrollTop > 0;
    });
    const got = await p.evaluate(() => {
      const i = /** @type {HTMLImageElement} */ (document.querySelector('#apercu img'));
      const vue = /** @type {HTMLElement} */ (document.querySelector('#apercu .apercu-vue'));
      const avant = /** @type {HTMLImageElement} */ (document.querySelector('[data-avant="0"] img'));
      return { same: i.src === avant.src, top: vue.scrollTop, max: vue.scrollHeight - vue.clientHeight, scale: i.clientWidth / i.naturalWidth, pos: getComputedStyle(document.getElementById('apercu') ?? document.body).position };
    });
    assert.ok(got.same, 'image « avant » de la page');
    assert.equal(got.pos, 'fixed');
    // Défilé jusqu'au premier élément (24 px au-dessus), ou au bas de l'image si elle s'arrête avant.
    const want = Math.min(Math.max(0, 1500 * got.scale - 24), got.max);
    assert.ok(Math.abs(got.top - want) <= 2, `défilement ${got.top}, attendu ${want}`);
    await p.mouse.wheel(0, 2000);
    assert.ok(await p.locator('#apercu').isVisible(), 'visible au défilement');
  } finally {
    await p.close();
  }
});

test('J7 : sur écran étroit, le panneau passe sous la carte active', async () => {
  const p = await browser.newPage({ viewport: { width: 700, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const card = p.locator('article[data-key="colors|#333333|bordure"]');
    await card.locator('button.v').nth(1).click();
    const got = await p.evaluate(() => {
      const a = document.getElementById('apercu');
      return { after: a?.previousElementSibling?.getAttribute('data-key'), pos: a ? getComputedStyle(a).position : '' };
    });
    assert.equal(got.after, 'colors|#333333|bordure');
    assert.equal(got.pos, 'static');
  } finally {
    await p.close();
  }
});

test('J7 : une carte plus haut dans la page (texte à 300 px) : défilement exact, sans butée', async () => {
  const p = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const card = p.locator('article[data-key="colors|#201d17|texte"]');
    const y = Number(await card.getAttribute('data-y'));
    assert.ok(Math.abs(y - 300) <= 1, `data-y ${y}`);
    await card.locator('button.v').nth(1).click();
    const got = await p.evaluate(() => {
      const i = /** @type {HTMLImageElement} */ (document.querySelector('#apercu img'));
      const vue = /** @type {HTMLElement} */ (document.querySelector('#apercu .apercu-vue'));
      return { top: vue.scrollTop, scale: i.clientWidth / i.naturalWidth };
    });
    assert.ok(Math.abs(got.top - (y * got.scale - 24)) <= 2, `défilement ${got.top}, attendu ${y * got.scale - 24}`);
  } finally {
    await p.close();
  }
});
