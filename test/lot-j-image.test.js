// @ts-check
/**
 * Lot J, J9 : fond recouvert par une image. Attendus écrits avant le code :
 * J9. Un fond recouvert par une image (img, ou background-image qui couvre l'élément) dont le texte
 *     est posé sur l'image n'est pas un « plein » : usage « fond », candidats de la tranche fond (1 à 5),
 *     et pas de paire de contraste contre ce fond (le texte sur image reste « à vérifier »).
 *     Une image qui ne couvre pas l'élément, ou un texte posé à côté d'elle, ne change rien.
 * Page fictive (cible-valise d'Orbe Café), forme relevée sur une carte d'actualité : bloc gris,
 * image en position absolue (object-fit: cover) qui le couvre, texte blanc dans un bandeau bleu
 * translucide posé sur l'image.
 *   #e5e5e5, img qui couvre, texte sur l'image       : fond ; tranche fond : neutre-5 #e3e2df (ΔE 1,01).
 *   #e7e7e7, enfant background-image cover, texte dessus : fond.
 *   #dcdcdc, sans image, texte blanc posé dessus       : plein (inchangé par J9 : blanc sur #dcdcdc 1,3713).
 *   #d9d9d9, img sur la moitié gauche, texte à droite  : plein (l'image ne couvre pas l'élément).
 * Écarts (culori 4.0.2) : node -e 'import("culori").then(({differenceEuclidean:d})=>console.log(100*d("oklab")("#e5e5e5","#e3e2df")))' → 1,01.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differenceEuclidean } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const IMG = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#5a4632"/><circle cx="90" cy="90" r="60" fill="#a88a5c"/></svg>')}`;
const BOX = 'position:absolute;left:20px;width:320px;height:180px';
const TAG = 'position:absolute;top:16px;right:16px;padding:4px 8px;font:700 14px/1.3 Arial,sans-serif;color:#ffffff;background-color:rgba(73,144,226,0.69)';
const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>J9</title>
<style>html,body{margin:0;background:#ffffff;font:16px/1.4 Arial,sans-serif;color:#363026}
.a{${BOX};top:20px;background-color:#e5e5e5}.b{${BOX};top:220px;background-color:#e7e7e7}
.c{${BOX};top:420px;background-color:#dcdcdc}.d{${BOX};top:620px;background-color:#d9d9d9}
.couvre{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.fond-image{position:absolute;inset:0;background:url("${IMG}") center / cover no-repeat}
.moitie{position:absolute;left:0;top:0;width:50%;height:100%;object-fit:cover}
.bandeau{${TAG}}
</style></head>
<body>
<div class="a"><img class="couvre" src="${IMG}" alt=""><span class="bandeau">Informations</span></div>
<div class="b"><div class="fond-image"></div><span class="bandeau">Avantages</span></div>
<div class="c"><span class="bandeau" style="background-color:transparent">Sans image</span></div>
<div class="d"><img class="moitie" src="${IMG}" alt=""><span class="bandeau" style="background-color:transparent">À côté</span></div>
</body></html>`;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let run;

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-j9-'));
  await mkdir(join(root, 'j'));
  await writeFile(join(root, 'j', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  [run] = await runReduce({
    addresses: [`${servers.origin}/j/p.html`],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname,
    viewport: { width: 400, height: 900 },
    waitMs: 100,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-j9-out-')),
  });
});

after(async () => servers?.close());

/** @param {string} old */
const usagesOf = (old) => run.table.families.colors.rows.filter((/** @type {any} */ r) => r.old === old).map((/** @type {any} */ r) => r.usage);

test('précondition culori : #e5e5e5 à ΔE 1,01 de neutre-5', () => {
  assert.equal(Math.round(100 * differenceEuclidean('oklab')('#e5e5e5', '#e3e2df') * 100) / 100, 1.01);
});

test('J9 : fond recouvert par une img, texte posé sur l’image : usage fond, tranche fond, neutre-5', () => {
  assert.deepEqual(usagesOf('#e5e5e5'), ['fond']);
  const r = run.table.families.colors.rows.find((/** @type {any} */ x) => x.old === '#e5e5e5');
  assert.equal(r.new, '#e3e2df');
  assert.ok(r.candidates.every((/** @type {any} */ c) => /^neutre-[1-5]$/.test(c.name)), JSON.stringify(r.candidates));
});

test('J9 : fond recouvert par un enfant en background-image cover, texte dessus : usage fond', () => {
  assert.deepEqual(usagesOf('#e7e7e7'), ['fond']);
});

test('J9 : sans image, ou image qui ne couvre pas l’élément : le plein reste un plein', () => {
  assert.deepEqual(usagesOf('#dcdcdc'), ['plein']);
  assert.deepEqual(usagesOf('#d9d9d9'), ['plein']);
});

test('J9 : pas de paire de contraste contre un fond recouvert ; le texte sur l’image reste à vérifier', () => {
  const pairs = run.rendered.usages.pairs.filter((/** @type {any} */ p) => p.text === '#ffffff');
  const covered = ['#e5e5e5', '#e7e7e7'];
  assert.ok(!pairs.some((/** @type {any} */ p) => covered.includes(p.bg) || p.bgUsage === 'plein' && !['#dcdcdc', '#d9d9d9'].includes(p.bg)), JSON.stringify(pairs));
  const onImage = run.rendered.contrast.pairs.filter((/** @type {any} */ p) => p.text === '#ffffff' && p.uncertain.reasons.image > 0);
  assert.equal(onImage.reduce((/** @type {number} */ t, /** @type {any} */ p) => t + p.uncertain.reasons.image, 0), 2, 'deux textes sur image, à vérifier');
  assert.ok(onImage.every((/** @type {any} */ p) => p.flag === '[V]'));
});

test('J9 : la simulation range le fond recouvert comme le relevé (fond, appliqué)', () => {
  const keys = new Set(run.pages.flatMap((/** @type {any} */ p) => p.changes.map((/** @type {any} */ c) => c.key ?? `${c.family}|${c.old}`)));
  assert.ok([...keys].some((k) => k.startsWith('colors|#e5e5e5|fond')), [...keys].join(', '));
  assert.ok(![...keys].some((k) => k.startsWith('colors|#e5e5e5|plein')));
});
