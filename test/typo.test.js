// @ts-check
/**
 * npm run typo (src/tokens/typo.js, src/cli/typo.js).
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
 *   (taille-texte et graisse ; Orbe Café : aucune depuis que mention cite taille-texte.12, décision du 15/11/2026).
 * Orbe Café : 9 règles (8, plus la consigne de hauteur de capitale, DS11), aucune en échec, code 0 ; ligne affichée = taille × rapport arrondie au centième
 *   (60 × 1,2667 = 76,002 → 76 ; lignes des titres relevées, D17).
 * Rouges, chacun ne fait tomber que sa règle :
 *   R1 titre.2 interligne 1,3 → 24 × 1,3 = 31,2 px ;
 *   R2 titre.3 → {taille-texte.24}, interligne 1,3333 (32 px) : 30, 24, 24 en large ;
 *   R3 corps.grand reçoit une valeur en étroit {taille-texte.20}, interligne 1,6 (32 px) : 20 > 18 ;
 *   R4 corps.moyen interligne 1,25 (20 px) ;
 *   R5 libelle interligne 1,1429 (16 px) ;
 *   R6 corps.moyen → {taille-texte.14}, interligne 1,7143 (24 px) ;
 *   R7 primitive d'essai taille-texte.10 (10 px), mention → {taille-texte.10}, interligne 1,6 (16 px) ;
 *   R8 titre.2 → {marque.police.texte}.
 * Correction du 18/11/2026 (D44) : R8 met le libellé sur {police.produit}, police du produit que la couche marque ne
 *   remplace pas ; rouge : libelle → {marque.police.texte}.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { typo } from '../src/tokens/typo.js';
import { largeurs, enEtroit } from '../src/tokens/resolver.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = charger;
// Jetons lus par le resolver (largeurs), seuil de l'étroit compris ; l'aide ne sert plus
// qu'aux jeux modifiés exprès.
const l = largeurs(DIR);
const marque = l.large.marque;
/** Contexte étroit d'une couche donnée, seuil lu dans les jetons. @param {any} sem @param {any} [etroit] contexte modifié */
const etroitDe = (sem, etroit) => ({ ...l.etroit, semantique: enEtroit(sem, etroit ? [etroit] : l.contexte) });
const REGLES = ['multiple-4', 'decroissants', 'etroit-large', 'corps-1-5', 'petits-1-3', 'corps-1rem', 'min-12', 'police', 'hauteur-capitale'];

/** Lance la commande (fichiers temporaires hors dépôt). @param {any} [sem] @param {any} [prims] @param {any} [etroit] */
function run(sem, prims, etroit) {
  const args = [join(ROOT, 'src', 'cli', 'typo.js')];
  const tmp = mkdtempSync(join(tmpdir(), 'ds-lab-typo-'));
  for (const [opt, data] of /** @type {const} */ ([['--semantique', sem], ['--primitives', prims], ['--etroit', etroit]])) {
    if (!data) continue;
    const f = join(tmp, `${opt.slice(2)}.tokens.json`);
    writeFileSync(f, JSON.stringify(data));
    args.push(opt, f);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}
/** @param {(s: any) => void} edit */
const variant = (edit) => {
  const s = structuredClone(l.large.semantique);
  edit(s);
  return s;
};
/** Règles en échec. @param {ReturnType<typeof typo>} r */
const failing = (r) => r.regles.filter((g) => !g.ok).map((g) => g.id);

/**
 * Un rouge : une seule règle tombe, code 1, ligne ✗ et détail attendus.
 * @param {any} sem @param {any} prims @param {string} id @param {string} detail @param {any} [etroit] contexte étroit
 */
function rouge(sem, prims, id, detail, etroit) {
  const r = typo(sem, prims ?? l.large.primitives, marque, etroitDe(sem, etroit));
  assert.deepEqual(failing(r), [id]);
  const p = run(sem, prims, etroit);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, new RegExp(`  ✗ .*\\n {6}${detail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`), p.stdout);
  assert.match(p.stdout, /9 règles, 1 en échec\./);
}

test('typo vert : Orbe Café, 9 règles tenues (DS11 : consigne de hauteur de capitale), rapports affichés, primitives sans rôle, code 0', () => {
  const r = typo(l.large.semantique, l.large.primitives, marque, l.etroit);
  assert.deepEqual(r.regles.map((g) => g.id), REGLES);
  assert.deepEqual(failing(r), []);
  assert.deepEqual(r.sansRole, []);
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.doesNotMatch(p.stdout, /✗/);
  for (const l of [
    /affichage\.grand +60 \/ 76 px +rapport 1,2667 +étroit 36 \/ 48 px +rapport 1,3333 +700 +police\.titre +capitale 0,7 × taille\n/,
    /titre\.3 +20 \/ 28 px +rapport 1,4 +étroit 18 \/ 24 px +rapport 1,3333 +600 +police\.titre +capitale 0,7 × taille\n/,
    /titre\.4 +16 \/ 24 px +rapport 1,5 +700 +police\.texte\n/,
    /corps\.grand +18 \/ 28 px +rapport 1,5556 +400 +police\.texte\n/,
    /mention +12 \/ 16 px +rapport 1,3333 +400 +police\.texte\n/,
    /primitives sans rôle \(affiché, non contrôlé\)\n {2}aucune\n/,
    /9 règles, aucune en échec\./,
  ]) assert.match(p.stdout, l);
});

test('typo rouge R1 : titre.2 interligne 1,3, 31,2 px', () => {
  rouge(variant((s) => { s.typo.titre[2].$value.lineHeight = 1.3; }), undefined, 'multiple-4', 'titre.2 en large : 24 px × 1,3 = 31,2 px');
});

test('typo rouge R2 : titre.3 à 24 px, égal à titre.2', () => {
  rouge(variant((s) => { Object.assign(s.typo.titre[3].$value, { fontSize: '{taille-texte.24}', lineHeight: 1.3333 }); }), undefined, 'decroissants', 'en large : titre.2 24 px, titre.3 24 px');
});

test('typo rouge R3 : corps.grand plus grand en étroit qu\'en large', () => {
  const sem = structuredClone(l.large.semantique);
  const etroit = load('largeur.etroit.tokens.json');
  etroit.typo.corps = { grand: { $value: { ...sem.typo.corps.grand.$value, fontSize: '{taille-texte.20}', lineHeight: 1.6 } } };
  rouge(sem, undefined, 'etroit-large', 'corps.grand : étroit 20 / 32 px, large 18 / 28 px', etroit);
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
  const prims = structuredClone(l.large.primitives);
  prims['taille-texte']['10'] = { $value: { value: 10, unit: 'px' } };
  const sem = variant((s) => { Object.assign(s.typo.mention.$value, { fontSize: '{taille-texte.10}', lineHeight: 1.6 }); });
  rouge(sem, prims, 'min-12', 'mention en large : 10 px < 12 px');
});

test('typo rouge R8 : libellé sur police.texte', () => {
  rouge(variant((s) => { s.typo.libelle.$value.fontFamily = '{marque.police.texte}'; }), undefined, 'police', 'libelle : {marque.police.texte}, attendu {police.produit}');
});

test('typo rouge R8 : titre.2 sur police.texte', () => {
  rouge(variant((s) => { s.typo.titre[2].$value.fontFamily = '{marque.police.texte}'; }), undefined, 'police', 'titre.2 : {marque.police.texte}, attendu {marque.police.titre}');
});
