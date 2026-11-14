// @ts-check
/**
 * Lot J, retouches de la revue après le second passage. Attendus écrits avant le code :
 * 1. J5 étendu : les éléments tiers déclarés (sources.json, thirdParty) sont masqués (visibility:
 *    hidden) aussi dans les captures de page entière : « avant » et « après » de la revue (donc le
 *    panneau, qui reprend l'« avant »), références de reduce --references, et capture de verify
 *    quand on lui donne les sources (--sources). Sans sources, verify capture la page telle quelle.
 * 2. Panneau de page : il ne recouvre plus la barre fixe du bas (son bas s'arrête au haut de la
 *    barre ; au milieu de la barre, c'est la barre qu'on touche). Deux vraies colonnes : les cartes
 *    à gauche, sans marge vide entre elles et le panneau (même sur grand écran), la page à droite.
 * 3. Carte de plein : la version « Garder » est marquée « actuelle », placée en premier et affichée
 *    à l'ouverture, comme l'actuelle des cartes de ligne. Son export reste « garder ».
 * Page fictive (cible-valise d'Orbe Café), 400 × 700 : bandeau tiers .tiers-cookies #1b1b1b en haut,
 * bloc bleu-9 #2b4c7e portant un texte #c8553d (1,9783 : carte « Texte sur plein bleu », lot K),
 * texte #201d17 plus bas, page de 1600 px.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { capturePage } from '../src/verify/capture.js';
import { verifyPage, referenceFiles } from '../src/verify/reference.js';
import { parseVerifyArgs } from '../src/cli/verify.js';

const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Revue 2</title>
<style>html,body{margin:0;background:#ffffff;font:16px/1.4 Arial,sans-serif;color:#363026}body{height:1600px;position:relative}
.tiers-cookies{position:absolute;top:0;left:0;width:400px;height:48px;background-color:#1b1b1b;color:#f5f5f5;font-size:12px}
.plein{position:absolute;top:120px;left:20px;width:240px;padding:12px;background-color:#2b4c7e;color:#c8553d}
.cible{position:absolute;top:900px;left:20px;width:300px;margin:0;color:#201d17}
</style></head>
<body><div class="tiers-cookies">Cookies</div><p class="plein">Texte terre sur bleu</p><p class="cible">Texte de la page</p></body></html>`;
const VIEWPORT = { width: 400, height: 700 };
const THIRD = ['.tiers-cookies'];

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;
/** @type {any} */
let browser;
/** @type {string} */
let refs;
/** @type {string} */
let url;

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-revue-2-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  url = `${servers.origin}/j/p.html`;
  refs = await mkdtemp(join(tmpdir(), 'ds-lab-revue-2-refs-'));
  [run] = await runReduce({
    addresses: [url],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    referencesPath: refs,
    viewport: VIEWPORT,
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-revue-2-out-')),
  });
  const { chromium } = await import('playwright-core');
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  await servers?.close();
});

/** Pixels d'une couleur exacte. @param {Buffer | string} png @param {string} hex */
const count = (png, hex) => {
  const p = PNG.sync.read(typeof png === 'string' ? Buffer.from(png, 'base64') : png);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let n = 0;
  for (let i = 0; i < p.data.length; i += 4) if (p.data[i] === r && p.data[i + 1] === g && p.data[i + 2] === b) n++;
  return n;
};

test('1. précondition : sans masque, le bandeau tiers est dans la capture de la page', async () => {
  const shot = await capturePage({ url, viewport: VIEWPORT, waitMs: 50 });
  assert.ok(count(shot.png, '#1b1b1b') > 1000, 'bandeau visible');
});

test('1. pages entières de la revue (avant, après) : aucun pixel du bandeau tiers', () => {
  const p = run.pages[0];
  assert.ok(p.before && p.after);
  assert.equal(count(p.before, '#1b1b1b'), 0, 'avant');
  assert.equal(count(p.after, '#1b1b1b'), 0, 'après');
  assert.ok(count(p.before, '#2b4c7e') > 0, 'le reste de la page est là');
});

test('1. référence de reduce --references : aucun pixel du bandeau tiers', async () => {
  assert.equal(count(await readFile(referenceFiles(refs, url).png), '#1b1b1b'), 0);
});

test('1. verify : avec les sources, le bandeau est masqué ; l’option --sources est lue', async () => {
  const shot = await capturePage({ url, viewport: VIEWPORT, waitMs: 50, thirdParty: THIRD });
  assert.equal(count(shot.png, '#1b1b1b'), 0);
  const r = await verifyPage({ url, referenceDir: refs, viewport: VIEWPORT, waitMs: 50, thirdParty: THIRD });
  assert.equal(count(r.shot.png, '#1b1b1b'), 0);
  assert.equal(r.aria.identical, true);
  assert.equal(parseVerifyArgs(['http://x/', '--reference', 'd', '--sources', 's.json']).sources, 's.json');
  assert.equal(parseVerifyArgs(['http://x/', '--reference', 'd']).sources, undefined);
});

/** Géométrie de la revue : panneau, barre, colonne des cartes. @param {any} p */
const layout = (p) =>
  p.evaluate(() => {
    const box = (/** @type {Element | null} */ e) => {
      const r = /** @type {Element} */ (e).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height };
    };
    const panel = box(document.getElementById('apercu'));
    const barre = box(document.querySelector('.barre'));
    const hit = document.elementFromPoint(panel.left + 20, barre.top + barre.height / 2);
    return { panel, barre, main: box(document.querySelector('main')), inBar: !!hit?.closest('.barre'), hidden: /** @type {HTMLElement} */ (document.getElementById('apercu')).hidden };
  });

for (const width of [1400, 1920]) {
  test(`2. panneau à ${width} px : ne recouvre pas la barre ; deux colonnes sans marge vide`, async () => {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    try {
      await p.goto(pathToFileURL(run.files[1]).href);
      for (const scroll of [0, 3000]) {
        await p.evaluate((y) => window.scrollTo(0, y), scroll);
        const g = await layout(p);
        assert.equal(g.hidden, false, 'panneau affiché');
        assert.ok(g.panel.bottom <= g.barre.top + 0.5, `défilement ${scroll} : bas du panneau ${g.panel.bottom}, haut de la barre ${g.barre.top}`);
        assert.ok(g.inBar, `défilement ${scroll} : la barre est au-dessus`);
        assert.ok(g.panel.top >= -0.5 && g.panel.top <= 0.5, `défilement ${scroll} : panneau en haut (${g.panel.top})`);
        assert.ok(Math.abs(g.panel.right - width) <= 1, 'panneau à droite');
        assert.ok(g.main.left <= 0.5, `cartes à gauche (${g.main.left})`);
        assert.ok(Math.abs(g.main.right - g.panel.left) <= 1, `pas de marge vide : cartes jusqu’à ${g.main.right}, panneau à ${g.panel.left}`);
      }
    } finally {
      await p.close();
    }
  });
}

test('3. carte de plein : « Garder » marquée « actuelle », en premier, affichée à l’ouverture', async () => {
  const g = (run.table.pleins ?? []).find((/** @type {any} */ x) => x.scale === 'bleu');
  assert.ok(g, 'carte bleu');
  const keep = g.capture.versions.find((/** @type {any} */ v) => v.choice === 'garder');
  const p = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const got = await p.evaluate((key) => {
      const card = /** @type {HTMLElement} */ (document.querySelector(`article[data-key="${key}"]`));
      const bs = [...card.querySelectorAll('.versions .v')];
      const shown = [...card.querySelectorAll('.vue .ver')].filter((x) => !(/** @type {HTMLElement} */ (x).hidden));
      return {
        values: bs.map((b) => b.getAttribute('data-value')),
        first: bs[0].textContent,
        pressed: bs.map((b) => b.getAttribute('aria-pressed')),
        shown: shown.map((x) => /** @type {HTMLImageElement} */ (x.querySelector('img')).src),
      };
    }, g.key);
    assert.equal(got.values[0], 'garder');
    assert.deepEqual([...got.values].sort(), g.versions.map((/** @type {any} */ v) => v.choice).sort(), 'toutes les versions, une fois');
    assert.match(got.first ?? '', /actuelle/);
    assert.deepEqual(got.pressed, got.values.map((_, i) => String(i === 0)));
    assert.equal(got.shown.length, 1);
    assert.ok(got.shown[0].endsWith(keep.shot.png), 'image de « Garder » affichée');
  } finally {
    await p.close();
  }
});

test('3. carte de plein : choisir l’« actuelle » exporte « garder »', async () => {
  const g = (run.table.pleins ?? []).find((/** @type {any} */ x) => x.scale === 'bleu');
  const p = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  try {
    await p.goto(pathToFileURL(run.files[1]).href);
    const card = p.locator(`article[data-key="${g.key}"]`);
    await card.locator('.versions .v').first().click();
    await card.locator('button.retenir').click();
    const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('#export').click()]);
    const out = JSON.parse(await readFile(/** @type {string} */ (await dl.path()), 'utf8'));
    assert.equal(out[g.key], 'garder');
  } finally {
    await p.close();
  }
});
