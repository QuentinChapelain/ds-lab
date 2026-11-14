// @ts-check
/**
 * Lot J, bloc 3 (J3, J4). Attendus écrits avant le code :
 * J3. Un texte posé seulement sur un plein d'échelle S (pas 9 ou 10 de S, après la table), et qui y
 *     passe aujourd'hui, a pour premier candidat l'onSolid de S, pas la tranche 11-12. Un texte qui y
 *     échoue reste à la carte du plein (lot K) : J3 ne le corrige pas.
 * J4. Carte de plein : une version en plus, « même teinte, plus claire / plus foncée » : chaque texte
 *     prend le pas de sa propre échelle le plus proche (ΔE) qui passe sur le pas 9 du plein ; un texte
 *     qui y passe déjà reste tel quel. La version n'existe que si chaque texte a un tel pas. Choisie,
 *     elle descend dans la simulation et dans COUPLAGES, comme l'onSolid.
 * Page fictive (cible-valise d'Orbe Café), texte 16 px normal (seuil 4,5), deux blocs bleu-9 #2b4c7e :
 *   #f4f3f1 (le plus proche : neutre-3, ΔE 0,30) : 7,7682 sur bleu-9 ; tranche 11-12 : neutre-11 1,5348,
 *     neutre-12 1,5164 (grisés, J1) ; onSolid bleu #ffffff (ΔE 3,58) en premier, défaut, « proche ».
 *   #c8553d (terre-9) : 1,9783 sur bleu-9 : carte « Texte sur plein bleu ». Pas de terre le plus
 *     proche qui passe : terre-8 2,6839 et terre-7 4,4999 échouent (4,4999 < 4,5), terre-6 #f4cec5
 *     5,9404 (ΔE 30,78) passe : version « teinte », « Même teinte, plus claire », 5,9404.
 * culori 4.0.2 : node -e 'import("culori").then(({wcagContrast:w,differenceEuclidean:d})=>{const e=(a,b)=>100*d("oklab")(a,b);
 *   console.log(w("#f4f3f1","#2b4c7e"),w("#6d675b","#2b4c7e"),w("#363026","#2b4c7e"),e("#f4f3f1","#ffffff"),e("#f4f3f1","#f3f2f1"));
 *   console.log(w("#c8553d","#2b4c7e"),w("#d57560","#2b4c7e"),w("#eaad9e","#2b4c7e"),w("#f4cec5","#2b4c7e"),e("#c8553d","#f4cec5"))})'
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast, differenceEuclidean } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const BOX = 'position:absolute;left:20px;width:240px;padding:12px;font:400 16px/1.4 Arial,sans-serif;background-color:#2b4c7e';
const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J3 J4</title>
<style>html,body{margin:0;background:#ffffff;font:16px/1.4 Arial,sans-serif;color:#363026}
.clair{${BOX};top:20px;color:#f4f3f1}.terre{${BOX};top:100px;color:#c8553d}</style></head>
<body><p class="clair">Texte clair</p><p class="terre">Texte terre</p></body></html>`;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, { run: any, md: string, html: string }>} */
const R = {};

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j3-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  for (const [name, decisions] of /** @type {const} */ ([['attente', {}], ['teinte', { 'plein|bleu': 'teinte' }]])) {
    const file = join(root, `decisions-${name}.json`);
    await writeFile(file, JSON.stringify(decisions));
    const [run] = await runReduce({
      addresses: [`${servers.origin}/j/p.html`],
      targetPath: `${FIXTURE_DIR}cible-valise.json`,
      tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
      decisionsPath: file,
      viewport: { width: 400, height: 300 },
      waitMs: 50,
      outRoot: await mkdtemp(join(tmpdir(), `ds-lab-lot-j3-out-${name}-`)),
    });
    R[name] = { run, md: await readFile(run.files[2], 'utf8'), html: await readFile(run.files[1], 'utf8') };
  }
});

after(async () => servers?.close());

const r4 = (/** @type {number} */ x) => Math.round(x * 10000) / 10000;
const dE = (/** @type {string} */ a, /** @type {string} */ b) => Math.round(100 * differenceEuclidean('oklab')(a, b) * 100) / 100;
/** @param {string} name @param {string} old */
const textRow = (name, old) => R[name].run.table.families.colors.rows.find((/** @type {any} */ r) => r.old === old && r.usage === 'texte');
/** @param {string} name */
const bleu = (name) => (R[name].run.table.pleins ?? []).find((/** @type {any} */ g) => g.scale === 'bleu');

test('précondition culori : contrastes et écarts', () => {
  assert.deepEqual([r4(wcagContrast('#f4f3f1', '#2b4c7e')), r4(wcagContrast('#6d675b', '#2b4c7e')), r4(wcagContrast('#363026', '#2b4c7e'))], [7.7682, 1.5348, 1.5164]);
  assert.deepEqual([dE('#f4f3f1', '#ffffff'), dE('#f4f3f1', '#f3f2f1')], [3.58, 0.3]);
  assert.deepEqual([r4(wcagContrast('#c8553d', '#2b4c7e')), r4(wcagContrast('#d57560', '#2b4c7e')), r4(wcagContrast('#eaad9e', '#2b4c7e')), r4(wcagContrast('#f4cec5', '#2b4c7e'))], [1.9783, 2.6839, 4.4999, 5.9404]);
  assert.equal(dE('#c8553d', '#f4cec5'), 30.78);
});

test('J3 : texte posé seulement sur bleu-9, qui y passe : premier candidat l’onSolid #ffffff, défaut, « proche »', () => {
  const r = textRow('attente', '#f4f3f1');
  assert.equal(r.candidates[0].value, '#ffffff');
  assert.equal(r.candidates[0].name, 'bleu-sur-plein');
  assert.equal(r.new, '#ffffff');
  assert.equal(r.class, 'proche');
  assert.deepEqual(r.candidates.slice(1).map((/** @type {any} */ c) => `${c.value}${c.fails ? ' échoue' : ''}`), ['#6d675b échoue', '#363026 échoue']);
});

test('J3 : un texte qui échoue sur son plein n’est pas corrigé par J3 (il reste à la carte du plein)', () => {
  const r = textRow('attente', '#c8553d');
  assert.equal(r.class, 'inchangé');
  assert.ok(!r.candidates.some((/** @type {any} */ c) => c.value === '#ffffff'));
});

test('J4 : la carte bleu propose « Même teinte, plus claire » : terre-9 → terre-6 (5,9404), le texte qui passe reste tel quel', () => {
  const g = bleu('attente');
  assert.ok(g, 'carte bleu');
  const v = g.versions.find((/** @type {any} */ x) => x.choice === 'teinte');
  assert.ok(v, JSON.stringify(g.versions.map((/** @type {any} */ x) => x.choice)));
  assert.equal(v.label, 'Même teinte, plus claire');
  assert.equal(v.text, '#f4cec5');
  assert.equal(v.ratio, 5.9404);
  assert.equal(v.pass, true);
  assert.deepEqual(g.tints, { '#c8553d': '#f4cec5', '#ffffff': '#ffffff' });
  assert.deepEqual(g.versions.map((/** @type {any} */ x) => x.choice), ['onSolid', 'teinte', 'garder']);
  assert.match(R.attente.html, /Même teinte, plus claire/);
});

test('J4 : choisie, la version « teinte » descend dans la simulation et dans COUPLAGES', () => {
  const g = bleu('teinte');
  assert.equal(g.choice, 'teinte');
  assert.deepEqual(R.teinte.run.map.couplings.map((/** @type {any} */ c) => `${c.text}|${c.bg}|${c.onSolid}`), ['#c8553d|#2b4c7e|#f4cec5']);
  const lines = R.teinte.run.migration.agent.lines;
  const i = lines.findIndex((/** @type {string} */ l) => l.startsWith('COUPLAGES ('));
  assert.ok(lines.slice(i, i + 4).some((/** @type {string} */ l) => l.includes('devient #f4cec5') && l.includes('même teinte') && l.includes('terre-6')), lines.slice(i, i + 4).join('\n'));
});
