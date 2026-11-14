// @ts-check
/**
 * Lot K, retouche K6 (trouvée sur un vrai site). Attendus écrits avant le code :
 * K6. Une carte de plein ne couvre que les lignes de fond certaines : inchangé, auto, proche,
 *     correction, ou déjà décidées. Une ligne de fond de classe « décision » non tranchée garde sa
 *     propre carte avec ses candidats ; ses éléments n'entrent pas dans la carte de plein tant
 *     qu'elle n'est pas tranchée. Une échelle sans aucune ligne certaine n'a pas de carte.
 * Page fictive (cible-valise d'Orbe Café) : blanc sur #c8553d (terre-9, déjà sur la cible :
 * inchangé) et blanc sur #e2683f (ΔE OKLab × 100 : 6,82 de terre-9, au-delà du seuil « proche » de 5 : décision).
 * Contrastes et écarts (culori 4.0.2) :
 *   node -e 'import("culori").then(({wcagContrast:w,differenceEuclidean:d})=>{console.log(w("#ffffff","#c8553d").toFixed(4),w("#ffffff","#e2683f").toFixed(4),(100*d("oklab")("#e2683f","#c8553d")).toFixed(2))})'
 *   → 4,3544 ; 3,3409 ; 6,82.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast, differenceEuclidean } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { pleinGroups } from '../src/reduce/pleins.js';

const TARGET = `${FIXTURE_DIR}cible-valise.json`;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const BOX = 'position:absolute;left:40px;width:200px;height:60px;padding:0 8px;font:700 14px/60px Arial,sans-serif;color:#ffffff';
const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>K6</title>
<style>html,body{margin:0;background:#ffffff}.certain{${BOX};top:40px;background-color:#c8553d}.vague{${BOX};top:140px;background-color:#e2683f}</style></head>
<body><span class="certain">Certain</span><span class="vague">Vague</span></body></html>`;
const VAGUE = 'colors|#e2683f|plein';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, { run: any, html: string }>} */
const R = {};

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-k6-'));
  await mkdir(join(root, 'k'));
  await writeFile(join(root, 'k', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  for (const [name, decisions] of /** @type {const} */ ([['attente', {}], ['tranchee', { [VAGUE]: '#c8553d' }]])) {
    const file = join(root, `decisions-${name}.json`);
    await writeFile(file, JSON.stringify(decisions));
    const [run] = await runReduce({
      addresses: [`${servers.origin}/k/p.html`],
      targetPath: TARGET,
      tokensPath: TOKENS,
      decisionsPath: file,
      viewport: { width: 400, height: 260 },
      waitMs: 50,
      outRoot: await mkdtemp(join(tmpdir(), `ds-lab-lot-k6-out-${name}-`)),
    });
    R[name] = { run, html: await readFile(run.files[1], 'utf8') };
  }
});

after(async () => servers?.close());

/** @param {string} name */
const terre = (name) => (R[name].run.table.pleins ?? []).find((/** @type {any} */ g) => g.scale === 'terre');
/** Article de la revue dont data-key vaut key. @param {string} html @param {string} key */
const article = (html, key) => {
  const i = html.indexOf(`data-key="${key}"`);
  if (i < 0) return '';
  const start = html.lastIndexOf('<article', i);
  return html.slice(start, html.indexOf('</article>', i));
};

test('précondition culori : #e2683f échoue en blanc et est au-delà du seuil « proche » de terre-9', () => {
  assert.equal(Math.round(wcagContrast('#ffffff', '#e2683f') * 10000) / 10000, 3.3409);
  assert.equal(Math.round(100 * differenceEuclidean('oklab')('#e2683f', '#c8553d') * 100) / 100, 6.82);
});

test('K6 : la ligne de fond #e2683f est une décision non tranchée (précondition de la page)', () => {
  const r = R.attente.run.table.families.colors.rows.find((/** @type {any} */ x) => x.old === '#e2683f' && x.usage === 'plein');
  assert.equal(r?.class, 'décision');
  assert.equal(r?.new, '#c8553d');
});

test('K6 : la carte terre ne couvre que le fond certain et ses éléments', () => {
  const g = terre('attente');
  assert.ok(g, 'carte terre');
  assert.deepEqual(g.rows.map((/** @type {any} */ r) => r.old), ['#c8553d']);
  assert.deepEqual(g.elements.map((/** @type {any} */ e) => e.selector), ['span.certain']);
  assert.deepEqual(g.pairs.map((/** @type {any} */ p) => p.bg), ['#c8553d']);
});

test('K6 : la ligne non tranchée garde sa propre carte, avec ses candidats, sans suivre la carte de plein', () => {
  const a = article(R.attente.html, VAGUE);
  assert.ok(a, 'carte de ligne #e2683f');
  assert.ok(a.includes('class="v"'), 'versions propres');
  assert.doesNotMatch(a, /suit la carte Texte sur plein/);
  const r = R.attente.run.migration.rows.find((/** @type {any} */ x) => x.family === 'colors' && x.value === '#e2683f' && x.usage === 'plein');
  assert.ok(r, 'ligne #e2683f dans migration.md');
  assert.ok(!r.plein, 'ne suit pas la carte');
});

test('K6 : une fois tranchée, la ligne entre dans la carte (sa décision suit la carte)', () => {
  const g = terre('tranchee');
  assert.deepEqual(g.rows.map((/** @type {any} */ r) => r.old).sort(), ['#c8553d', '#e2683f']);
  assert.deepEqual(g.elements.map((/** @type {any} */ e) => e.selector).sort(), ['span.certain', 'span.vague']);
  assert.deepEqual(g.ignored.map((/** @type {any} */ x) => x.key), [VAGUE]);
});

test('K6 : une échelle sans aucune ligne certaine n’a pas de carte', async () => {
  const target = JSON.parse(await readFile(TARGET, 'utf8'));
  /** @param {Record<string, string | false>} decisions */
  const scales = (decisions) => {
    const table = { families: { colors: { rows: [{ id: 'coul-1', old: '#e2683f', usage: 'plein', class: 'décision', new: '#c8553d' }] } } };
    const rendered = { usages: { pairs: [{ text: '#ffffff', bg: '#e2683f', bgUsage: 'plein', threshold: 4.5, n: 1 }] } };
    return pleinGroups({ table, rendered, target, decisions }).map((g) => g.scale);
  };
  assert.deepEqual(scales({}), [], 'décision non tranchée seule');
  assert.deepEqual(scales({ [VAGUE]: '#c8553d' }), ['terre'], 'décision tranchée');
});
