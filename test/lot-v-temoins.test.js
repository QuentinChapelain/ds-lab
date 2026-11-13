// @ts-check
/**
 * Lot V, étape 5 : pages témoins. Attendus écrits avant le code :
 * 1. reduce --temoins <adresses> (option répétable, adresses séparées par des virgules, relatives
 *    à la première adresse) : ces pages n'entrent pas dans la table.
 * 2. La table une fois faite, elle est simulée sur chaque témoin (couplages compris) ; avec
 *    --references : <page>.reference.png (après simulation) et .aria.yml (avant simulation).
 * 3. migration.md, section « Pages témoins » : par page, éléments changés (et opérations par
 *    famille) ; valeurs du témoin que la table ne couvre pas (valeur × usage sans ligne).
 * Pages fictives :
 *   A (table)   : blanc sur #d0563f (décidé → #c8553d, couplé → #220000) ; #1f2a44 (décidé → #103060).
 *   W (témoin)  : les deux mêmes, plus #2d2d2d, absent de A.
 * Attendu sur W : 2 éléments changés, 3 opérations (fond, couplage, texte), toutes en couleurs ;
 * non couvert : #2d2d2d en texte, 1 élément.
 * Contrastes (culori 4.0.2) : node -e 'import("culori").then(({wcagContrast:w})=>console.log(w("#ffffff","#d0563f"),w("#220000","#c8553d")))'
 *   → 4,1299 (sous 4,5 : couplage) ; 4,5155.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce, parseReduceArgs } from '../src/cli/reduce.js';
import { referenceFiles } from '../src/verify/reference.js';

const TARGET = `${FIXTURE_DIR}cible-valise.json`;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const BOX = 'position:absolute;left:40px;width:200px;height:60px;padding:0 8px;font:700 14px/60px Arial,sans-serif';
const STYLE = `html,body{margin:0;background:#ffffff}.a{${BOX};top:40px;color:#ffffff;background-color:#d0563f}.b{${BOX};top:140px;color:#1f2a44}`;
const PAGE_A = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>A</title><style>${STYLE}</style></head>
<body><span class="a">Nouveau</span><span class="b">Texte</span></body></html>`;
const PAGE_W = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>W</title><style>${STYLE}.c{${BOX};top:240px;color:#2d2d2d}</style></head>
<body><span class="a">Nouveau</span><span class="b">Texte</span><span class="c">Seul ici</span></body></html>`;
const ZONE = { a: { x: 40, y: 40, w: 216, h: 60 }, b: { x: 40, y: 140, w: 216, h: 60 }, c: { x: 40, y: 240, w: 216, h: 60 } };

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {string} */
let refs;
/** @type {any} */
let withW;
/** @type {any} */
let withoutW;

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-temoins-'));
  await mkdir(join(root, 't'));
  await writeFile(join(root, 't', 'A.html'), PAGE_A);
  await writeFile(join(root, 't', 'W.html'), PAGE_W);
  const decisions = join(root, 'decisions.json');
  // Lot K : le couplage est la version « onSolid » de la carte du plein terre.
  await writeFile(decisions, JSON.stringify({ 'colors|#d0563f|plein': '#c8553d', 'colors|#1f2a44|texte': '#103060', 'plein|terre': 'onSolid' }));
  refs = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-temoins-refs-'));
  servers = await startFixtureServers({ root });
  const common = { targetPath: TARGET, tokensPath: TOKENS, decisionsPath: decisions, viewport: { width: 400, height: 360 }, waitMs: 50 };
  [withW] = await runReduce({
    ...common,
    addresses: [`${servers.origin}/t/A.html`],
    temoins: ['/t/W.html'],
    referencesPath: refs,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-temoins-out-')),
  });
  [withoutW] = await runReduce({ ...common, addresses: [`${servers.origin}/t/A.html`], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-temoins-out2-')) });
});

after(async () => servers?.close());

/** @param {PNG} png @param {string} hex @param {{ x: number, y: number, w: number, h: number }} r */
function countHex(png, hex, r) {
  const [R, G, B] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let n = 0;
  for (let y = r.y; y < Math.min(png.height, r.y + r.h); y++)
    for (let x = r.x; x < Math.min(png.width, r.x + r.w); x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i] === R && png.data[i + 1] === G && png.data[i + 2] === B) n++;
    }
  return n;
}

test('précondition culori : blanc sous 4,5 sur #d0563f, #220000 au-dessus sur #c8553d', () => {
  assert.ok(wcagContrast('#ffffff', '#d0563f') < 4.5);
  assert.ok(wcagContrast('#220000', '#c8553d') >= 4.5);
});

test('--temoins : répétable, virgules acceptées', () => {
  const p = parseReduceArgs(['http://x.test/a.html', '--target', 't.json', '--temoins', '/w.html', '--temoins', '/v.html,/u.html']);
  assert.deepEqual(p.options?.temoins, ['/w.html', '/v.html', '/u.html']);
  assert.deepEqual(parseReduceArgs(['http://x.test/a.html', '--target', 't.json']).options?.temoins, []);
});

test('la table ne bouge pas avec un témoin ; la valeur propre au témoin n’y entre pas', () => {
  const key = (/** @type {any} */ r) => `${r.family}|${r.value}|${r.usage}|${r.status}|${r.new}|${r.token}`;
  assert.deepEqual(withW.migration.rows.map(key), withoutW.migration.rows.map(key));
  assert.ok(!withW.migration.rows.some((/** @type {any} */ r) => r.value === '#2d2d2d'), '#2d2d2d dans la table');
  assert.deepEqual(withW.migration.meta.pages, ['/t/A.html']);
  assert.ok(!String(withW.migration.meta.command).includes('W.html'), 'témoin dans la commande de relance');
});

test('références du témoin : simulation complète, couplage compris ; arbre avant simulation', async () => {
  const f = referenceFiles(refs, `${servers.origin}/t/W.html`);
  await access(f.aria);
  const aria = await readFile(f.aria, 'utf8');
  assert.match(aria, /Seul ici/);
  const png = PNG.sync.read(await readFile(f.png));
  assert.ok(countHex(png, '#c8553d', ZONE.a) > 0, 'fond a : terre-9');
  assert.ok(countHex(png, '#220000', ZONE.a) > 0, 'texte a : couplé');
  assert.equal(countHex(png, '#ffffff', ZONE.a), 0, 'texte a : encore blanc');
  assert.ok(countHex(png, '#103060', ZONE.b) > 0, 'texte b : décidé');
  assert.equal(countHex(png, '#1f2a44', ZONE.b), 0, 'texte b : ancienne valeur');
  assert.ok(countHex(png, '#2d2d2d', ZONE.c) > 0, 'texte c : inchangé');
  assert.ok(withW.references.includes(f.png) && withW.references.includes(f.aria), 'références listées');
});

test('migration.md : section « Pages témoins », éléments changés et valeurs non couvertes', () => {
  const w = withW.migration.witnesses;
  assert.equal(w?.length, 1);
  assert.equal(w[0].page, '/t/W.html');
  assert.equal(w[0].changed, 2, 'éléments changés');
  assert.equal(w[0].operations, 3, 'opérations');
  assert.deepEqual(w[0].byFamily, { colors: 3 });
  assert.deepEqual(
    w[0].uncovered.map((/** @type {any} */ u) => `${u.family}|${u.value}|${u.usage}|${u.count}`),
    ['colors|#2d2d2d|texte|1'],
  );
  assert.ok(w[0].uncovered[0].selectors.some((/** @type {string} */ s) => s.includes('span.c')), 'exemple de sélecteur');
  assert.equal(withoutW.migration.witnesses.length, 0);
});

test('migration.md : texte de la section', async () => {
  const md = await readFile(withW.files[2], 'utf8');
  const i = md.indexOf('## Pages témoins');
  assert.ok(i >= 0, 'section absente');
  const sec = md.slice(i, md.indexOf('\n## ', i + 1) > 0 ? md.indexOf('\n## ', i + 1) : undefined);
  assert.match(sec, /\/t\/W\.html/);
  assert.match(sec, /2 élément\(s\) changé\(s\)/);
  assert.match(sec, /`#2d2d2d`/);
  const md2 = await readFile(withoutW.files[2], 'utf8');
  assert.ok(!md2.includes('## Pages témoins'), 'section sans témoin');
});

test('valeurs non couvertes : une marge « usage|relation » est couverte par sa ligne (relation égale, ou ligne sans relation)', async () => {
  const { uncoveredValues } = await import('../src/reduce/propose.js');
  const m = (/** @type {string} */ scope) => ({ count: 2, content: 0, usage: 'marge', scope, properties: ['margin-bottom'], selectors: ['p'], pages: {} });
  const rendered = {
    usages: {
      spacing: {
        '16px': { 'marge|entre composants': m('entre composants') },
        '10px': { 'marge|entre composants': m('entre composants'), 'marge|dans le composant': m('dans le composant') },
        '4px': { 'marge|inconnue': m('inconnue') },
      },
    },
  };
  const table = {
    families: {
      spacing: {
        rows: [
          { old: '16px', usage: 'marge' },
          { old: '10px', usage: 'marge', scope: 'entre composants' },
          { old: '4px', usage: 'marge', scope: 'dans le composant' },
        ],
      },
    },
  };
  assert.deepEqual(
    uncoveredValues(rendered, /** @type {any} */ (table)).map((u) => `${u.value}|${u.usage}`),
    ['10px|marge (dans le composant)', '4px|marge (inconnue)'],
  );
});
