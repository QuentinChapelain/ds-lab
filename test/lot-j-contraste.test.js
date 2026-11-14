// @ts-check
/**
 * Lot J, bloc 2 (J1, J2) : candidats qui échouent au contraste. Attendus écrits avant le code :
 * J1. Un candidat qui échoue au contraste (texte porté, ou fond le moins favorable ; bordure contre
 *     son fond, seuil 3) alors que l'actuelle passe n'est jamais « le plus proche » ni le défaut :
 *     grisé dans la revue, avec sa raison, toujours cliquable (mécanisme du lot C). Le défaut est le
 *     premier candidat qui passe.
 * J2. Si aucun candidat de la tranche ne passe : la carte dit « la cible ne couvre pas ce cas » et
 *     propose, en plus, les pas de la même échelle hors tranche qui passent ; migration.md les liste
 *     dans « Trous de la cible ».
 * Page fictive (cible-valise d'Orbe Café), contrastes et écarts calculés avec culori 4.0.2 :
 *   node -e 'import("culori").then(({wcagContrast:w,differenceEuclidean:d})=>{const e=(a,b)=>(100*d("oklab")(a,b)).toFixed(2);
 *     console.log(w("#333333","#ffffff"),w("#958f84","#ffffff"),w("#bfbbb5","#ffffff"),w("#d8d6d2","#ffffff"));
 *     console.log(w("#6d675b","#e6e7e2"),w("#6d675b","#e3e2df"),w("#6d675b","#ecebe9"),e("#e6e7e2","#e3e2df"),e("#e6e7e2","#ecebe9"));
 *     console.log(w("#ffffff","#6a655a"),w("#ffffff","#7d776c"),w("#ffffff","#8a8478"),w("#ffffff","#6d675b"),w("#ffffff","#363026"),e("#6a655a","#6d675b"),e("#6a655a","#7d776c"))})'
 *   bordure #333333 sur blanc : 12,6347 ; candidats neutre-8 #958f84 3,2110 (passe), neutre-7 #bfbbb5
 *     1,9107 et neutre-6 #d8d6d2 1,4514 (grisés) ; défaut neutre-8, inchangé.
 *   fond #e6e7e2 sous le texte neutre-11 #6d675b : 4,5152 ; neutre-5 #e3e2df (ΔE 1,35, le plus
 *     proche aujourd'hui) 4,3327 : grisé ; neutre-4 #ecebe9 (ΔE 1,52) 4,7112 : nouveau défaut.
 *   plein #6a655a sous le blanc : 5,7980 ; tranche 9-10 : neutre-10 #7d776c 4,4423 et neutre-9
 *     #8a8478 3,7153, tous deux sous 4,5 : trou. Hors tranche qui passent : neutre-11 #6d675b
 *     5,6129 (ΔE 0,79, défaut) et neutre-12 #363026 13,0628.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast, differenceEuclidean } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J1 J2</title>
<style>html,body{margin:0;background:#ffffff;font:700 16px/1.4 Arial,sans-serif;color:#363026}
.cadre{position:absolute;top:20px;left:20px;width:200px;padding:8px;border:2px solid #333333}
.encart{position:absolute;top:100px;left:20px;width:216px;padding:8px;background-color:#e6e7e2;color:#6d675b}
.bouton{position:absolute;top:180px;left:20px;width:216px;padding:8px;background-color:#6a655a;color:#ffffff}
</style></head>
<body><div class="cadre">Cadre</div><div class="encart">Encart</div><div class="bouton">Bouton</div></body></html>`;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;
let html = '';
let md = '';

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j2-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/j/p.html`],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
    viewport: { width: 400, height: 600 },
    waitMs: 50,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-j2-out-')),
  });
  html = await readFile(run.files[1], 'utf8');
  md = await readFile(run.files[2], 'utf8');
});

after(async () => servers?.close());

/** @param {string} old @param {string} usage */
const row = (old, usage) => run.table.families.colors.rows.find((/** @type {any} */ r) => r.old === old && r.usage === usage);
/** @param {string} key */
const article = (key) => {
  const i = html.indexOf(`data-key="${key}"`);
  if (i < 0) return '';
  return html.slice(html.lastIndexOf('<article', i), html.indexOf('</article>', i));
};
/** Bouton de version d'une carte, par valeur. @param {string} a @param {string} value */
const button = (a, value) => {
  const i = a.indexOf(`data-value="${value}"`);
  return i < 0 ? '' : a.slice(a.lastIndexOf('<button', i), a.indexOf('</button>', i));
};
const r4 = (/** @type {number} */ x) => Math.round(x * 10000) / 10000;
const dE = (/** @type {string} */ a, /** @type {string} */ b) => Math.round(100 * differenceEuclidean('oklab')(a, b) * 100) / 100;

test('précondition culori : contrastes et écarts de la page', () => {
  assert.deepEqual([r4(wcagContrast('#958f84', '#ffffff')), r4(wcagContrast('#bfbbb5', '#ffffff')), r4(wcagContrast('#d8d6d2', '#ffffff'))], [3.211, 1.9107, 1.4514]);
  assert.deepEqual([r4(wcagContrast('#6d675b', '#e6e7e2')), r4(wcagContrast('#6d675b', '#e3e2df')), r4(wcagContrast('#6d675b', '#ecebe9'))], [4.5152, 4.3327, 4.7112]);
  assert.deepEqual([dE('#e6e7e2', '#e3e2df'), dE('#e6e7e2', '#ecebe9')], [1.35, 1.52]);
  assert.deepEqual([r4(wcagContrast('#ffffff', '#6a655a')), r4(wcagContrast('#ffffff', '#7d776c')), r4(wcagContrast('#ffffff', '#8a8478'))], [5.798, 4.4423, 3.7153]);
  assert.deepEqual([r4(wcagContrast('#ffffff', '#6d675b')), r4(wcagContrast('#ffffff', '#363026')), dE('#6a655a', '#6d675b')], [5.6129, 13.0628, 0.79]);
});

test('J1 : bordure #333333 : neutre-7 et neutre-6 échouent (seuil 3) et sont grisés avec leur raison ; défaut neutre-8', () => {
  const r = row('#333333', 'bordure');
  assert.equal(r.new, '#958f84');
  assert.deepEqual(r.candidates.filter((/** @type {any} */ c) => c.fails).map((/** @type {any} */ c) => c.value), ['#bfbbb5', '#d8d6d2']);
  const a = article('colors|#333333|bordure');
  for (const v of ['#bfbbb5', '#d8d6d2']) {
    const b = button(a, v);
    assert.match(b, /class="v grise"/, v);
    assert.match(b, /l’actuelle passe/, v);
    assert.doesNotMatch(b, /le plus proche/, v);
  }
  assert.doesNotMatch(button(a, '#958f84'), /grise/);
  assert.match(button(a, '#958f84'), /le plus proche/);
});

test('J1 : fond #e6e7e2 : neutre-5, le plus proche, fait échouer le texte : grisé ; défaut et « le plus proche » vont à neutre-4', () => {
  const r = row('#e6e7e2', 'fond');
  assert.equal(r.class, 'décision');
  assert.equal(r.new, '#ecebe9');
  const five = r.candidates.find((/** @type {any} */ c) => c.value === '#e3e2df');
  assert.ok(five?.fails, 'neutre-5 échoue');
  assert.equal(five.fails.ratio, 4.3327);
  assert.equal(five.fails.threshold, 4.5);
  const a = article('colors|#e6e7e2|fond');
  assert.match(button(a, '#e3e2df'), /class="v grise"/);
  assert.doesNotMatch(button(a, '#e3e2df'), /le plus proche/);
  assert.match(button(a, '#ecebe9'), /le plus proche/);
  const line = md.split('\n').find((l) => l.startsWith('| ') && l.includes('`#e6e7e2`') && l.includes('candidats') === false && l.includes('#ecebe9'));
  assert.ok(line, 'ligne de décision dans migration.md');
  assert.match(line, /\(`#ecebe9`\)/, 'proposé : neutre-4');
  assert.match(line, /`#e3e2df` \(1,35, échoue au contraste : 4,3327 sous 4,5\)/);
});

test('J2 : plein #6a655a : aucun pas de la tranche ne passe : la cible ne couvre pas ce cas ; neutre-11 et neutre-12 proposés', () => {
  const r = row('#6a655a', 'plein');
  assert.equal(r.class, 'décision');
  assert.deepEqual(r.candidates.map((/** @type {any} */ c) => `${c.value}${c.fails ? ' échoue' : ''}${c.outOfSlice ? ' hors tranche' : ''}`), ['#7d776c échoue', '#8a8478 échoue', '#6d675b hors tranche', '#363026 hors tranche']);
  assert.equal(r.new, '#6d675b');
  assert.deepEqual(r.hole, { scale: 'neutre', slice: 'plein' });
  const a = article('colors|#6a655a|plein');
  assert.match(a, /la cible ne couvre pas ce cas/);
  for (const v of ['#6d675b', '#363026']) assert.ok(button(a, v) && !/grise/.test(button(a, v)), `${v} proposé`);
  assert.equal(r.capture.versions.length, 5, 'actuelle, deux pas de la tranche, deux pas hors tranche');
  const i = md.indexOf('### Trous de la cible : 1');
  assert.ok(i >= 0, 'section Trous de la cible');
  const sec = md.slice(i, md.indexOf('\n### ', i + 5));
  assert.match(sec, /`#6a655a` \(plein\)/);
  assert.match(sec, /`#7d776c` neutre-10 4,4423, `#8a8478` neutre-9 3,7153/);
  assert.match(sec, /`#6d675b` neutre-11 5,6129, `#363026` neutre-12 13,0628/);
});

/**
 * J1, règle 2 (attendu écrit avant le code) : le nouveau défaut ne sort jamais de l'échelle du
 * candidat le plus proche ; sans échelles dans la cible, de sa teinte (deux gris, chroma OKLCH < 0,02
 * comme G8, ou deux couleurs dont les teintes OKLCH diffèrent de 30° au plus). Si aucun candidat de
 * cette échelle ne passe : pas de défaut, la ligne est « décision », l'ancien plus proche reste
 * affiché, grisé avec sa raison, et aucun candidat n'est « le plus proche ».
 * Page fictive, cible.json (sans échelles) : blanc sur #c4513a (4,5799) ; candidats terre #c8553d
 * (4,3544, même teinte : 33,4° contre 33,1°), gris #767676 (4,5422, gris), bleu #2b4c7e (8,6144,
 * 258,5°) : aucun de même teinte ne passe.
 */
test('J1, règle 2 : sans échelles, aucun candidat de même teinte ne passe : pas de défaut, terre grisé, rien n’est « le plus proche »', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j2b-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J1 b</title>
<style>html,body{margin:0;background:#ffffff;font:700 16px/1.4 Arial,sans-serif;color:#1f2a44}.etiquette{position:absolute;top:20px;left:20px;padding:8px;background-color:#c4513a;color:#ffffff}</style></head>
<body><span class="etiquette">Nouveau</span></body></html>`);
  const s = await startFixtureServers({ root });
  try {
    const [b] = await runReduce({ addresses: [`${s.origin}/j/p.html`], targetPath: `${FIXTURE_DIR}cible.json`, viewport: { width: 400, height: 300 }, waitMs: 50, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-j2b-out-')) });
    const r = b.table.families.colors.rows.find((/** @type {any} */ x) => x.old === '#c4513a');
    assert.equal(r.class, 'décision');
    assert.equal(r.new, null, 'pas de défaut');
    assert.deepEqual(r.candidates.map((/** @type {any} */ c) => `${c.value}${c.fails ? ` ${c.fails.ratio}` : ''}`), ['#c8553d 4.3544', '#767676', '#2b4c7e']);
    const h = await readFile(b.files[1], 'utf8');
    const i = h.indexOf('data-key="colors|#c4513a|plein"');
    const a = h.slice(h.lastIndexOf('<article', i), h.indexOf('</article>', i));
    assert.match(button(a, '#c8553d'), /class="v grise"/);
    assert.doesNotMatch(a, /le plus proche/);
    const m = await readFile(b.files[2], 'utf8');
    const line = m.split('\n').find((l) => l.startsWith('| ') && l.includes('`#c4513a`') && l.includes('aucun défaut'));
    assert.ok(line, 'migration.md : proposé « aucun défaut »');
  } finally {
    await s.close();
  }
});
