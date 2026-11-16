// @ts-check
/**
 * Revue de code du 15/11, lot 4 (docs/attendus/revue-lot-4-copies.md, point 1) : une seule définition de `fr`, `esc` et
 * `r4`, dans src/lib/format.js. Chaque appelant garde son format, nommé par ses options (réponse de Quentin du 16/11/2026) ;
 * deux défauts corrigés : la troncature se fait sur la valeur arrondie à 4 décimales, et l'arrondi suit l'écriture
 * décimale du nombre (une valeur en ,xx5 monte).
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   fr(n) : le nombre tel quel, virgule décimale : 4.5 → « 4,5 », 12.6234 → « 12,6234 », 4 → « 4 » ;
 *   decimales 2 : arrondi, zéros retirés : 4.5152 → « 4,52 », 4.5 → « 4,5 », 11.655 → « 11,66 », 1.545 → « 1,55 »,
 *     1.005 → « 1,01 » (en flottant, 1.005 × 100 = 100,4999…) ;
 *   decimales 2, zeros : 4.5 → « 4,50 », 12.6234 → « 12,62 », 11.655 → « 11,66 », 1.545 → « 1,55 » ;
 *   decimales 4 : 1.266666 → « 1,2667 », 0.7 → « 0,7 » ; decimales 1, zeros : 0.6 → « 0,6 », 5 → « 5,0 » ;
 *   tronque (decimales 2, zeros) : sur la valeur arrondie à 4 décimales : 5.02 → « 5,02 » (5,02 × 100 = 501,999…),
 *     5.4393 → « 5,43 », 4.49987 → « 4,49 » (arrondie 4,4999) ;
 *   null et undefined : « — » avec { vide: '—' } ; sans vide, une erreur qui nomme la valeur (« nombre attendu ») ;
 *   esc : & < > " échappés, null et undefined → chaîne vide (réponse Q2) ; r4(4.51519) = 4.5152 ;
 *   sorties : tokens/orbe-cafe/roles.html, texte.secondaire sur fond.composant (ratio 5,02 par contrat) : « 5,02:1 »
 *     (avant : 5,01:1) ; console de npm run contraste, Écume et Sel en sombre, texte.accent sur fond.discret (ratio
 *     11,655) : « 11,66:1 » (avant : 11,65:1) ;
 *   une définition : dans src/, aucune autre définition de fr, esc, r4, round4, ratioFr ni seuilFr, ni de virgule
 *     décimale écrite à la main, hors des deux copies laissées hors du lot (script de page de src/report/review.js,
 *     fr1 de src/polices/encre.js).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** Module importé à la volée : son absence fait échouer les tests un par un, pas le fichier. */
const format = () => import('../src/lib/format.js');

test('F1 fr : le nombre tel quel, virgule décimale', async () => {
  const { fr } = await format();
  assert.deepEqual([fr(4.5), fr(12.6234), fr(4)], ['4,5', '12,6234', '4']);
});

test('F2 fr : arrondi sur l’écriture décimale, zéros retirés ou gardés', async () => {
  const { fr } = await format();
  const d2 = (/** @type {number} */ n) => fr(n, { decimales: 2 });
  const z2 = (/** @type {number} */ n) => fr(n, { decimales: 2, zeros: true });
  assert.deepEqual([4.5152, 4.5, 11.655, 1.545, 1.005].map(d2), ['4,52', '4,5', '11,66', '1,55', '1,01']);
  assert.deepEqual([4.5, 12.6234, 11.655, 1.545].map(z2), ['4,50', '12,62', '11,66', '1,55']);
  assert.deepEqual([fr(1.266666, { decimales: 4 }), fr(0.7, { decimales: 4 })], ['1,2667', '0,7']);
  assert.deepEqual([fr(0.6, { decimales: 1, zeros: true }), fr(5, { decimales: 1, zeros: true })], ['0,6', '5,0']);
});

test('F3 fr : troncature sur la valeur arrondie à 4 décimales', async () => {
  const { fr } = await format();
  const t = (/** @type {number} */ n) => fr(n, { decimales: 2, zeros: true, tronque: true });
  assert.deepEqual([5.02, 5.4393, 4.49987].map(t), ['5,02', '5,43', '4,49']);
});

test('F4 fr : null et undefined, « — » si demandé, sinon une erreur qui nomme la valeur', async () => {
  const { fr } = await format();
  assert.equal(fr(null, { vide: '—' }), '—');
  assert.equal(fr(undefined, { vide: '—' }), '—');
  assert.throws(() => fr(null), /nombre attendu.*null/);
  assert.throws(() => fr(/** @type {any} */ ('4.5')), /nombre attendu.*4\.5/);
});

test('F5 esc : & < > " échappés, null et undefined donnent la chaîne vide', async () => {
  const { esc } = await format();
  assert.equal(esc('<a href="x">&</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  assert.deepEqual([esc(null), esc(undefined), esc(4.5)], ['', '', '4.5']);
});

test('F6 r4 : arrondi à 4 décimales', async () => {
  const { r4 } = await format();
  assert.deepEqual([r4(4.51519), r4(5.02), r4(1)], [4.5152, 5.02, 1]);
});

test('F7 roles.html : le ratio 5,02 tronqué reste 5,02', () => {
  const html = readFileSync(join(ROOT, 'tokens/orbe-cafe/roles.html'), 'utf8');
  const row = /<tr data-devant="texte\.secondaire" data-fond="fond\.composant"[^>]*>([^]*?)<\/tr>/.exec(html)?.[1] ?? '';
  assert.match(row, /<td data-label="Ratio" class="num">5,02:1<\/td>/);
});

test('F8 console de contraste : 11,655 s’écrit 11,66', () => {
  const r = spawnSync(process.execPath, ['src/cli/contraste.js', '--marque', 'tokens/ecume-et-sel', '--mode', 'sombre'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /✓ texte\.accent sur fond\.discret : 11,66:1, seuil 4,50:1/);
});

/** Fichiers .js de src/, chemins relatifs à la racine. @param {string} d @returns {string[]} */
const sources = (d = join(ROOT, 'src')) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? sources(join(d, e.name)) : e.name.endsWith('.js') ? [relative(ROOT, join(d, e.name))] : []));
/** Les deux copies laissées hors du lot, à la ligne près. */
const HORS_LOT = ["  function fr(n) { return String(n).replace('.', ','); }", "const fr1 = (n) => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',').replace(/^-0,0$/, '0,0');"];

test('F9 une définition : fr, esc et r4 vivent seulement dans src/lib/format.js', () => {
  const found = [];
  for (const f of sources()) {
    if (f === join('src', 'lib', 'format.js')) continue;
    readFileSync(join(ROOT, f), 'utf8')
      .split('\n')
      .forEach((line, i) => {
        if (HORS_LOT.includes(line)) return;
        if (/\b(const|let|function)\s+(fr|esc|r4|round4|ratioFr|seuilFr)\b/.test(line) || line.includes(".replace('.', ',')")) found.push(`${f}:${i + 1}`);
      });
  }
  assert.deepEqual(found, []);
});
