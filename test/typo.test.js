// @ts-check
/**
 * Séance 3c, typo, lot 2 : npm run typo (src/tokens/typo.js, src/cli/typo.js).
 *
 * Attendu écrit à la main avant le code, d'après le plan typo du 15/11/2026. Règles en échec (code 1) :
 *   R1 taille × interligne multiple de 4 px (tolérance 0,01 px), en large et en étroit ;
 *   R2 affichage et titres (affichage.grand, affichage.moyen, titre.1 à titre.4) strictement décroissants
 *      en taille, en large et en étroit (un style sans valeur en étroit garde sa valeur large) ;
 *   R3 étroit inférieur ou égal au large (taille et hauteur de ligne) ;
 *   R4 corps.grand et corps.moyen : interligne au moins 1,5 ;
 *   R5 corps.petit, libelle, mention : interligne au moins 1,3 ;
 *   R6 corps.moyen au moins 1 rem (16 px) ;
 *   R7 aucune taille sous 12 px, en large et en étroit ;
 *   R8 bonne police par rôle : affichage et titres 1 à 3 sur {marque.police.titre}, le reste sur
 *      {marque.police.texte}.
 * Affiché sans seuil : le rapport de chaque style (4 décimales, virgule) ; les primitives sans rôle
 *   (taille-texte et graisse ; Orbe Café : taille-texte.12 seulement).
 * Orbe Café : 8 règles, aucune en échec, code 0 ; ligne affichée = taille × rapport arrondie au centième
 *   (60 × 1,1333 = 67,998 → 68).
 * Rouges, chacun ne fait tomber que sa règle :
 *   R1 titre.2 interligne 1,3 → 24 × 1,3 = 31,2 px ;
 *   R2 titre.3 → {taille-texte.24}, interligne 1,3333 (32 px) : 30, 24, 24 en large ;
 *   R3 corps.grand reçoit une valeur en étroit {taille-texte.20}, interligne 1,6 (32 px) : 20 > 18 ;
 *   R4 corps.moyen interligne 1,25 (20 px) ;
 *   R5 libelle interligne 1,1429 (16 px) ;
 *   R6 corps.moyen → {taille-texte.14}, interligne 1,7143 (24 px) ;
 *   R7 primitive d'essai taille-texte.10 (10 px), mention → {taille-texte.10}, interligne 1,6 (16 px) ;
 *   R8 titre.2 → {marque.police.texte}.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { typo } from '../src/tokens/typo.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const marque = load('marque.tokens.json');
const REGLES = ['multiple-4', 'decroissants', 'etroit-large', 'corps-1-5', 'petits-1-3', 'corps-1rem', 'min-12', 'police'];

/** Lance la commande (fichiers temporaires hors dépôt). @param {any} [sem] @param {any} [prims] */
function run(sem, prims) {
  const args = [join(ROOT, 'src', 'cli', 'typo.js')];
  const tmp = mkdtempSync(join(tmpdir(), 'ds-lab-typo-'));
  for (const [opt, data] of /** @type {const} */ ([['--semantique', sem], ['--primitives', prims]])) {
    if (!data) continue;
    const f = join(tmp, `${opt.slice(2)}.tokens.json`);
    writeFileSync(f, JSON.stringify(data));
    args.push(opt, f);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}
/** @param {(s: any) => void} edit */
const variant = (edit) => {
  const s = load('semantique.tokens.json');
  edit(s);
  return s;
};
/** Règles en échec. @param {ReturnType<typeof typo>} r */
const failing = (r) => r.regles.filter((g) => !g.ok).map((g) => g.id);

/**
 * Un rouge : une seule règle tombe, code 1, ligne ✗ et détail attendus.
 * @param {any} sem @param {any} prims @param {string} id @param {string} detail
 */
function rouge(sem, prims, id, detail) {
  const r = typo(sem, prims ?? load('primitives.tokens.json'), marque);
  assert.deepEqual(failing(r), [id]);
  const p = run(sem, prims);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, new RegExp(`  ✗ .*\\n {6}${detail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`), p.stdout);
  assert.match(p.stdout, /8 règles, 1 en échec\./);
}

test('typo vert : Orbe Café, 8 règles tenues, rapports affichés, primitives sans rôle, code 0', () => {
  const r = typo(load('semantique.tokens.json'), load('primitives.tokens.json'), marque);
  assert.deepEqual(r.regles.map((g) => g.id), REGLES);
  assert.deepEqual(failing(r), []);
  assert.deepEqual(r.sansRole, ['taille-texte.12']);
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.doesNotMatch(p.stdout, /✗/);
  for (const l of [
    /affichage\.grand +60 \/ 68 px +rapport 1,1333 +étroit 36 \/ 40 px +rapport 1,1111 +700 +police\.titre\n/,
    /titre\.3 +20 \/ 28 px +rapport 1,4 +étroit 18 \/ 24 px +rapport 1,3333 +600 +police\.titre\n/,
    /titre\.4 +16 \/ 24 px +rapport 1,5 +700 +police\.texte\n/,
    /corps\.grand +18 \/ 28 px +rapport 1,5556 +400 +police\.texte\n/,
    /mention +14 \/ 20 px +rapport 1,4286 +400 +police\.texte\n/,
    /primitives sans rôle \(affiché, non contrôlé\)\n {2}taille-texte\.12\n/,
    /8 règles, aucune en échec\./,
  ]) assert.match(p.stdout, l);
});

test('typo rouge R1 : titre.2 interligne 1,3, 31,2 px', () => {
  rouge(variant((s) => { s.typo.titre[2].$value.lineHeight = 1.3; }), undefined, 'multiple-4', 'titre.2 en large : 24 px × 1,3 = 31,2 px');
});

test('typo rouge R2 : titre.3 à 24 px, égal à titre.2', () => {
  rouge(variant((s) => { Object.assign(s.typo.titre[3].$value, { fontSize: '{taille-texte.24}', lineHeight: 1.3333 }); }), undefined, 'decroissants', 'en large : titre.2 24 px, titre.3 24 px');
});

test('typo rouge R3 : corps.grand plus grand en étroit qu\'en large', () => {
  const sem = variant((s) => {
    s.typo.corps.grand.$extensions = { 'ds-lab.etroit': { valeur: { fontSize: '{taille-texte.20}', lineHeight: 1.6 }, sous: { value: 600, unit: 'px' }, seuil: '[H]' } };
  });
  rouge(sem, undefined, 'etroit-large', 'corps.grand : étroit 20 / 32 px, large 18 / 28 px');
});

test('typo rouge R4 : corps.moyen interligne 1,25', () => {
  rouge(variant((s) => { s.typo.corps.moyen.$value.lineHeight = 1.25; }), undefined, 'corps-1-5', 'corps.moyen en large : 1,25 < 1,5');
});

test('typo rouge R5 : libelle interligne 1,1429', () => {
  rouge(variant((s) => { s.typo.libelle.$value.lineHeight = 1.1429; }), undefined, 'petits-1-3', 'libelle en large : 1,1429 < 1,3');
});

test('typo rouge R6 : corps.moyen à 14 px', () => {
  rouge(variant((s) => { Object.assign(s.typo.corps.moyen.$value, { fontSize: '{taille-texte.14}', lineHeight: 1.7143 }); }), undefined, 'corps-1rem', 'corps.moyen en large : 14 px < 16 px (1 rem)');
});

test('typo rouge R7 : mention à 10 px', () => {
  const prims = load('primitives.tokens.json');
  prims['taille-texte']['10'] = { $value: { value: 10, unit: 'px' } };
  const sem = variant((s) => { Object.assign(s.typo.mention.$value, { fontSize: '{taille-texte.10}', lineHeight: 1.6 }); });
  rouge(sem, prims, 'min-12', 'mention en large : 10 px < 12 px');
});

test('typo rouge R8 : titre.2 sur police.texte', () => {
  rouge(variant((s) => { s.typo.titre[2].$value.fontFamily = '{marque.police.texte}'; }), undefined, 'police', 'titre.2 : {marque.police.texte}, attendu {marque.police.titre}');
});
