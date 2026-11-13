// @ts-check
/**
 * Lot V, étape 6. Attendus écrits avant le code.
 * D3. Une ligne RATTACHE dont la déclaration source est en unité relative (rem, em, %) n'est pas
 *     rattachée : la consigne dit de la laisser et de poser
 *     /* ds-lab : unité relative, non rattachée (<valeur>, <date>) *\/.
 *     Une ligne REMPLACEMENTS en unité relative reste, avec « à vérifier sur les pages témoins ».
 *     « aucun changement visible » devient « aucun changement visible sur les pages mesurées ».
 *     L'outil lit l'unité dans la source (valeur écrite de la déclaration gagnante, héritage compris).
 * D4. Une même déclaration (feuille, ligne, propriété) dans deux lignes aux valeurs cibles
 *     différentes est un conflit, pages témoins comprises : section CONFLITS, ne remplace pas,
 *     commentaire, signale. La simulation complète (et les références) n'applique pas ces lignes
 *     aux éléments qui tiennent leur valeur de cette déclaration ; la revue les marque.
 * Pages fictives, feuille commune s.css, racine à 14 px (87,5 %) :
 *   P (table)  : label + .champ (suivi d'un label : entre composants) ; label + .champ relié par
 *                aria-describedby à p.msg (dans le composant) ; p.msg suivi d'un label (entre
 *                composants) ; .champ ; p.note suivi d'un label (entre composants) ; p.x 1.2rem.
 *   W (témoin) : label + .champ + p.msg suivi de p.aide (dans le composant, déduit de la position).
 * Décisions : 10px marge entre composants → 12px ; dans le composant → 4px.
 * Attendus :
 *   14px (taille) : inchangé ; déclarations body (1rem, héritée, relative) et .champ (14px).
 *   16.8px : 1.2rem, vers 16px (auto) : REMPLACEMENTS, « à vérifier sur les pages témoins ».
 *   Conflits : .champ margin-bottom (entre 12 / dans 4, P) ; .msg margin-bottom (entre 12 sur P,
 *   dans 4 sur W). Ligne « entre composants » : .note applicable, .champ et .msg en conflit (en
 *   partie) ; ligne « dans le composant » : tout en conflit (non applicable), hors REMPLACEMENTS.
 *   Simulation : #a, #b, p.msg gardent 10px ; p.note passe à 12px. Sur W, p.msg garde 10px.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { unitOf } from '../src/browser/trace.js';
import { splitOf } from '../src/reduce/propose.js';
import { simulatePage } from '../src/browser/simulate.js';
import { gotoAndSettle } from '../src/browser/navigate.js';

const TARGET = `${FIXTURE_DIR}cible-valise.json`;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const CSS = [
  'html { font-size: 87.5%; }',
  'body { margin: 0; font-family: Arial, sans-serif; font-size: 1rem; color: #103060; background-color: #ffffff; }',
  'p { margin: 0; }',
  'label { display: block; margin: 0; }',
  'input { color: inherit; }',
  '.champ { display: block; margin: 0 0 10px; padding: 0; border: 0; font-size: 14px; background-color: transparent; }',
  '.msg { margin: 0 0 10px; }',
  '.note { margin: 0 0 10px; border-bottom: 1px solid #d8d6d2; }',
  '.x { font-size: 1.2rem; }',
  '',
].join('\n');
const LINE = (/** @type {string} */ sel) => CSS.split('\n').findIndex((l) => l.startsWith(`${sel} {`)) + 1;
const head = (/** @type {string} */ t) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${t}</title><link rel="stylesheet" href="/t/s.css"></head>`;
const PAGE_P = `${head('P')}<body>
<label for="a">Nom</label><input id="a" class="champ" value="Ada">
<label for="b">Courriel</label><input id="b" class="champ" value="ada@" aria-describedby="m"><p id="m" class="msg">Domaine manquant</p>
<label for="c">Téléphone</label><input id="c" class="champ" value="06">
<p class="note">Note</p>
<label for="d">Ville</label><input id="d" class="champ" value="Lyon">
<p class="x">Grand texte</p>
</body></html>`;
const PAGE_W = `${head('W')}<body>
<label for="b">Courriel</label><input id="b" class="champ" value="ada@"><p class="msg">Domaine manquant</p><p class="aide">Aide</p>
</body></html>`;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-conflits-'));
  await mkdir(join(root, 't'));
  await writeFile(join(root, 't', 's.css'), CSS);
  await writeFile(join(root, 't', 'P.html'), PAGE_P);
  await writeFile(join(root, 't', 'W.html'), PAGE_W);
  const decisions = join(root, 'decisions.json');
  await writeFile(decisions, JSON.stringify({ 'spacing|10px|marge|entre composants': '12px', 'spacing|10px|marge|dans le composant': '4px' }));
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/t/P.html`],
    temoins: ['/t/W.html'],
    targetPath: TARGET,
    tokensPath: TOKENS,
    decisionsPath: decisions,
    viewport: { width: 600, height: 400 },
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-conflits-out-')),
  });
});

after(async () => servers?.close());

/** @param {string} family @param {string} old @param {string} [scope] */
const rowOf = (family, old, scope) => run.table.families[family].rows.find((/** @type {any} */ r) => r.old === old && (!scope || r.scope === scope));
const agent = () => /** @type {string[]} */ (run.migration.agent.lines);
/** @param {string} title */
const section = (title) => {
  const a = agent();
  const i = a.findIndex((l) => l.startsWith(title));
  const j = a.findIndex((l, k) => k > i && l === '');
  return a.slice(i, j < 0 ? undefined : j);
};

test('D3 : unité de la valeur écrite', () => {
  for (const v of ['1rem', '.75rem', '1.2em', '50%', '87.5%']) assert.equal(unitOf(v), 'relative', v);
  for (const v of ['14px', '0', '-2px']) assert.equal(unitOf(v), 'absolue', v);
  for (const v of ['var(--a, 1rem)', 'calc(1rem + 2px)', 'inherit']) assert.equal(unitOf(v), 'inconnue', v);
  for (const v of ['#103060', 'transparent']) assert.equal(unitOf(v), 'sans unité', v);
});

test('D3 : chaque ligne porte ses déclarations, valeur écrite et héritage compris', () => {
  const r = rowOf('fontSizes', '14px');
  assert.ok(r?.declarations?.length, 'déclarations absentes');
  const body = r.declarations.find((/** @type {any} */ d) => d.selector === 'body');
  const champ = r.declarations.find((/** @type {any} */ d) => d.selector === '.champ');
  assert.deepEqual([body?.file, body?.line, body?.written, body?.inherited, body?.unit], ['s.css', LINE('body'), '1rem', true, 'relative']);
  assert.deepEqual([champ?.file, champ?.line, champ?.written, champ?.unit], ['s.css', LINE('.champ'), '14px', 'absolue']);
  const x = rowOf('fontSizes', '16.8px');
  assert.deepEqual(x.declarations.map((/** @type {any} */ d) => `${d.selector}|${d.written}|${d.unit}`), ['.x|1.2rem|relative']);
});

test('D4 : conflits, pages témoins comprises', () => {
  const c = run.migration.conflicts;
  assert.deepEqual(
    c.map((/** @type {any} */ x) => `${x.file}:${x.line} ${x.selector} ${x.property}`).sort(),
    [`s.css:${LINE('.champ')} .champ margin-bottom`, `s.css:${LINE('.msg')} .msg margin-bottom`].sort(),
  );
  const between = rowOf('spacing', '10px', 'entre composants');
  const inside = rowOf('spacing', '10px', 'dans le composant');
  for (const x of c) assert.deepEqual(x.rows.map((/** @type {any} */ y) => y.id).sort(), [between.id, inside.id].sort(), x.selector);
  const msg = c.find((/** @type {any} */ x) => x.selector === '.msg');
  assert.deepEqual(msg.pages.sort(), ['/t/P.html', '/t/W.html']);
  assert.equal(between.conflict, 'partiel');
  assert.equal(inside.conflict, 'total');
});

test('consigne : CONFLITS, D3 et D4 dans les lignes', () => {
  const ctx = section('CONTEXTE').join('\n');
  assert.match(ctx, /unité relative \(rem, em, %\)/);
  const conf = section('CONFLITS (');
  assert.equal(conf[0], 'CONFLITS (2)');
  const champ = conf.find((l) => l.includes(`s.css:${LINE('.champ')}`));
  assert.ok(champ, 'conflit .champ');
  assert.match(champ, /ne remplace pas/i);
  assert.match(champ, /\/\* ds-lab : conflit, /);
  assert.match(champ, /signale/);
  const date = String(run.migration.meta.stamp).slice(0, 10);
  const attach = section('RATTACHE (').find((l) => l.includes(`${rowOf('fontSizes', '14px').id} `));
  assert.ok(attach, 'ligne RATTACHE de 14px');
  assert.match(attach, /aucun changement visible sur les pages mesurées/);
  assert.ok(attach.includes(`/* ds-lab : unité relative, non rattachée (1rem, ${date}) */`), attach);
  assert.ok(attach.includes(`s.css:${LINE('.champ')}`), 'déclaration en px à rattacher');
  const repl = section('REMPLACEMENTS (');
  const big = repl.find((l) => l.includes(`${rowOf('fontSizes', '16.8px').id} `));
  assert.ok(big, 'ligne 16.8px');
  assert.match(big, /1\.2rem/);
  assert.match(big, /à vérifier sur les pages témoins/);
  const between = repl.find((l) => l.includes(`${rowOf('spacing', '10px', 'entre composants').id} `));
  assert.ok(between, 'ligne entre composants');
  assert.ok(between.includes(`s.css:${LINE('.note')}`), '.note à remplacer');
  assert.match(between, /hors : .*conflit/);
  assert.ok(!repl.some((l) => l.includes(`${rowOf('spacing', '10px', 'dans le composant').id} `)), 'ligne tout en conflit hors REMPLACEMENTS');
});

test('simulation complète : les déclarations en conflit ne bougent pas, le reste de la ligne si', async () => {
  const { chromium } = await import('playwright-core');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 400 } });
    /** @param {string} path */
    const margins = async (path) => {
      await gotoAndSettle(page, `${servers.origin}${path}`, { waitMs: 50 });
      await simulatePage(page, { ...run.map, split: splitOf(run.table) }, { maxCropped: 0, fullPage: false });
      return page.evaluate(() => Object.fromEntries([...document.querySelectorAll('input, p')].map((e) => [`${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}.${e.className}`, getComputedStyle(e).marginBottom])));
    };
    const p = await margins('/t/P.html');
    assert.equal(p['input#a.champ'], '10px');
    assert.equal(p['input#b.champ'], '10px');
    assert.equal(p['p#m.msg'], '10px');
    assert.equal(p['p.note'], '12px');
    const w = await margins('/t/W.html');
    assert.equal(w['p.msg'], '10px');
  } finally {
    await browser.close();
  }
});

test('revue : lignes en conflit marquées, déclaration à l’appui', async () => {
  const html = await readFile(run.files[1], 'utf8');
  const inside = rowOf('spacing', '10px', 'dans le composant');
  const i = html.indexOf(`data-key="spacing|10px|marge|dans le composant"`);
  assert.ok(i >= 0, 'carte absente');
  const card = html.slice(i, html.indexOf('</article>', i));
  assert.match(card, /décidé, non applicable sans changer la structure/);
  assert.ok(card.includes(`même déclaration : s.css:${LINE('.champ')}`), 'déclaration citée');
  assert.ok(card.includes(rowOf('spacing', '10px', 'entre composants').id), 'autre ligne citée');
  assert.ok(inside.id);
});

test('déclarations : couleur écrite dans un raccourci (border-bottom: 1px solid #d8d6d2) lue telle quelle', () => {
  const r = rowOf('colors', '#d8d6d2');
  assert.ok(r?.declarations?.length, 'ligne de la bordure');
  assert.deepEqual(r.declarations.map((/** @type {any} */ d) => `${d.selector}|${d.written}`), ['.note|#d8d6d2']);
});
