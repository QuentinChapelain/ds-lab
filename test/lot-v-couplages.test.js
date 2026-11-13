// @ts-check
/**
 * Lot V, étape 4. Attendus écrits avant le code :
 * 1. La simulation (pages entières, références, captures par version) applique les COUPLAGES :
 *    un texte posé sur un plein, sous son seuil après la table, prend l'onSolid de l'échelle.
 *    A. Aussi quand le fond est déjà sur la cible (inchangé) : aucune opération de fond à
 *       laquelle se lier, le texte change quand même dans la simulation complète.
 * 2. Une couleur onSolid de la cible, en texte sur le pas 9 ou 10 de son échelle, est « inchangé »,
 *    nom <échelle>-sur-plein, jeton couleur.<échelle>.sur-plein ; pas « hors table ».
 * B. Un fond de pas 9 ou 10 dont le texte est l'onSolid de la même échelle a l'usage « plein » :
 *    pas de signalement hors tranche. Les autres cas ne changent pas (sable-9 sous bleu-12 : fond).
 * Contrastes (culori 4.0.2) :
 *   node -e 'import("culori").then(({wcagContrast:w})=>console.log(w("#220000","#c8553d"),w("#ffffff","#c8553d"),w("#ffffff","#d0563f")))'
 *   → 4,5155 ; 4,3544 ; 4,1299. Blanc échoue sur #c8553d et #d0563f (seuil 4,5, texte 14 px gras).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { propose, solidPairs } from '../src/reduce/propose.js';
import { pickColorToken } from '../src/report/migration.js';
import { referenceFiles } from '../src/verify/reference.js';

const TARGET = `${FIXTURE_DIR}cible-valise.json`;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
/** @type {any} */
let target;

const BOX = 'position:absolute;left:40px;width:200px;height:60px;line-height:60px;padding:0 8px;font:700 14px/60px Arial,sans-serif';
// Avant migration : blanc sur un plein terre qui change (#d0563f, décidé vers terre-9) et sur terre-9 déjà sur la cible.
const AVANT = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>avant</title>
<style>html,body{margin:0;background:#ffffff}.nouveau{${BOX};top:40px;color:#ffffff;background-color:#d0563f}.annulee{${BOX};top:140px;color:#ffffff;background-color:#c8553d}</style></head>
<body><span class="nouveau">Nouveau</span><span class="annulee">Annulée</span></body></html>`;
// Après migration : onSolid terre sur terre-9 ; bleu-12 sur sable-9 (pas l'onSolid de sable).
const APRES = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>apres</title>
<style>html,body{margin:0;background:#ffffff}.annulee{${BOX};top:40px;color:#220000;background-color:#c8553d}.promo{${BOX};top:140px;color:#103060;background-color:#f0c987}</style></head>
<body><span class="annulee">Annulée</span><span class="promo">Promo</span></body></html>`;

/** @type {string} */
let refs;
/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof runReduce>>[number]} */
let run;

before(async () => {
  target = JSON.parse(await readFile(TARGET, 'utf8'));
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-couplages-'));
  await mkdir(join(root, 'couplage'));
  await writeFile(join(root, 'couplage', 'avant.html'), AVANT);
  await writeFile(join(root, 'couplage', 'apres.html'), APRES);
  const decisions = join(root, 'decisions.json');
  await writeFile(decisions, JSON.stringify({ 'colors|#d0563f|plein': '#c8553d' }));
  refs = await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-couplages-refs-'));
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/couplage/avant.html`, '/couplage/apres.html'],
    targetPath: TARGET,
    tokensPath: TOKENS,
    decisionsPath: decisions,
    referencesPath: refs,
    viewport: { width: 400, height: 300 },
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-v-couplages-reduce-')),
  });
});

after(async () => servers?.close());

/** Pixels d'une couleur exacte dans un rectangle. @param {PNG} png @param {string} hex @param {{ x: number, y: number, w: number, h: number }} r */
function countHex(png, hex, r = { x: 0, y: 0, w: png.width, h: png.height }) {
  const [R, G, B] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let n = 0;
  for (let y = r.y; y < Math.min(png.height, r.y + r.h); y++)
    for (let x = r.x; x < Math.min(png.width, r.x + r.w); x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i] === R && png.data[i + 1] === G && png.data[i + 2] === B) n++;
    }
  return n;
}
const NOUVEAU = { x: 40, y: 40, w: 216, h: 60 };
const ANNULEE = { x: 40, y: 140, w: 216, h: 60 };

/** Relevé minimal : #220000 en texte sur les fonds donnés. @param {string[]} bgs */
const rendered = (bgs) => ({
  usages: {
    colors: {
      '#220000': { texte: { count: bgs.length, content: 0, properties: ['color'], selectors: ['span'], pages: {} } },
      ...Object.fromEntries(bgs.map((bg) => [bg, { plein: { count: 1, content: 0, properties: ['background-color'], selectors: ['span'], pages: {} } }])),
    },
    pairs: bgs.map((bg) => ({ text: '#220000', bg, bgUsage: 'plein', threshold: 4.5, n: 1 })),
    borderPairs: [],
  },
});
/** Cible réduite aux couleurs et à onSolid (relevé minimal sans dimensions). */
const colorsOnly = () => ({ colors: target.colors, onSolid: target.onSolid });
/** @param {any} table @param {string} old */
const colorRow = (table, old) => table.families.colors.rows.find((/** @type {any} */ r) => r.old === old);

test('précondition culori : blanc sous 4,5 sur terre-9 et #d0563f ; #220000 au-dessus sur terre-9', () => {
  assert.equal(Math.round(wcagContrast('#220000', '#c8553d') * 10000) / 10000, 4.5155);
  assert.equal(Math.round(wcagContrast('#ffffff', '#c8553d') * 10000) / 10000, 4.3544);
  assert.equal(Math.round(wcagContrast('#ffffff', '#d0563f') * 10000) / 10000, 4.1299);
});

test('2 : onSolid terre en texte sur terre-9 → inchangé, terre-sur-plein', () => {
  const r = colorRow(propose(rendered(['#c8553d']), colorsOnly()), '#220000');
  assert.equal(r.class, 'inchangé');
  assert.equal(r.name, 'terre-sur-plein');
  assert.equal(r.new, '#220000');
});

test('2 : onSolid terre sur un fond qui n’est pas un pas 9-10 de terre → reste hors table', () => {
  assert.equal(colorRow(propose(rendered(['#ffffff']), colorsOnly()), '#220000').class, 'hors table, aucune échelle');
  assert.equal(colorRow(propose(rendered(['#c8553d', '#ffffff']), colorsOnly()), '#220000').class, 'hors table, aucune échelle');
});

test('2 : jeton sur-plein choisi par son nom de ligne', () => {
  assert.equal(pickColorToken(['couleur.terre.sur-plein'], { name: 'terre-sur-plein' }), 'couleur.terre.sur-plein');
});

test('B : paires plein de la cible = pas 9 et 10 de chaque échelle avec son onSolid, rien d’autre', () => {
  const s = solidPairs(target);
  assert.ok(s.has('#c8553d|#220000'), 'terre-9');
  assert.ok(s.has('#ba4834|#220000'), 'terre-10');
  assert.ok(s.has('#f0c987|#4a2900'), 'sable-9');
  assert.ok(!s.has('#f0c987|#103060'), 'bleu-12 sur sable-9 : pas un onSolid');
});

test('2 et B (réduction) : #220000 sur terre-9 inchangé, jeton couleur.terre.sur-plein ; terre-9 en plein, sable-9 toujours en fond', () => {
  const m = run.migration;
  const row = m.rows.find((/** @type {any} */ r) => r.value === '#220000');
  assert.ok(row, 'ligne #220000');
  assert.equal(row.status, 'inchangé');
  assert.equal(row.token, 'couleur.terre.sur-plein');
  assert.deepEqual(m.rows.filter((/** @type {any} */ r) => r.status === 'hors table').map((/** @type {any} */ r) => r.value), []);
  const oos = m.exceptions.outOfSlice.map((/** @type {any} */ o) => `${o.value}|${o.usage}`);
  assert.ok(!oos.includes('#c8553d|fond'), `terre-9 en fond signalé : ${oos}`);
  assert.ok(oos.includes('#f0c987|fond'), `sable-9 en fond non signalé : ${oos}`);
  assert.ok(run.table.families.colors.rows.some((/** @type {any} */ r) => r.old === '#c8553d' && r.usage === 'plein'));
  assert.ok(!run.table.families.colors.rows.some((/** @type {any} */ r) => r.old === '#c8553d' && r.usage === 'fond'));
});

test('1 : la consigne pose deux couplages (fond changé, fond inchangé)', () => {
  const pairs = run.migration.exceptions.onSolid.flatMap((/** @type {any} */ o) => o.befores.map((/** @type {any} */ b) => `${b.text}|${b.bg}→${o.onSolid}`)).sort();
  assert.deepEqual(pairs, ['#ffffff|#c8553d→#220000', '#ffffff|#d0563f→#220000']);
});

test('1 et A : référence (simulation complète) : le texte passe à #220000 sur les deux pleins', async () => {
  const png = PNG.sync.read(await readFile(referenceFiles(refs, `${servers.origin}/couplage/avant.html`).png));
  for (const [name, r] of /** @type {const} */ ([['fond changé', NOUVEAU], ['fond inchangé (A)', ANNULEE]])) {
    assert.ok(countHex(png, '#c8553d', r) > 0, `${name} : fond terre-9`);
    assert.ok(countHex(png, '#220000', r) > 0, `${name} : texte #220000 absent`);
    assert.equal(countHex(png, '#ffffff', r), 0, `${name} : texte encore blanc`);
  }
});

test('1 : revue, pages entières : l’après porte le couplage, l’avant non', () => {
  const p = run.pages?.find((/** @type {any} */ x) => x.url.endsWith('/couplage/avant.html'));
  assert.ok(p?.after && p.before, 'captures avant et après');
  const a = PNG.sync.read(Buffer.from(p.after, 'base64'));
  const b = PNG.sync.read(Buffer.from(p.before, 'base64'));
  assert.ok(countHex(a, '#220000', ANNULEE) > 0 && countHex(a, '#220000', NOUVEAU) > 0, 'après');
  assert.equal(countHex(b, '#220000'), 0, 'avant');
});

test('1 : capture par version de la ligne du plein : #220000 avec terre-9, blanc avec la valeur actuelle', () => {
  const r = run.table.families.colors.rows.find((/** @type {any} */ x) => x.old === '#d0563f' && x.usage === 'plein');
  assert.ok(r?.capture?.versions?.length, 'captures de la ligne');
  const now = r.capture.versions.find((/** @type {any} */ v) => v.value === '#d0563f');
  const terre = r.capture.versions.find((/** @type {any} */ v) => v.value === '#c8553d');
  assert.ok(now && terre, 'versions actuelle et terre-9');
  const png = (/** @type {any} */ v) => PNG.sync.read(Buffer.from(v.shot.png, 'base64'));
  assert.equal(countHex(png(now), '#220000'), 0, 'actuelle : pas de couplage');
  assert.ok(countHex(png(terre), '#220000') > 0, 'terre-9 : texte #220000');
});
