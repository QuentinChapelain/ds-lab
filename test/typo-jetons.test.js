// @ts-check
/**
 * Séance 3c, typo, lot 1 : graisses, polices de marque et onze styles de texte d'Orbe Café (marque fictive).
 *
 * Attendu écrit à la main avant le code, d'après le plan typo du 15/11/2026 :
 *   primitives : graisse 400, 600, 700 ($type fontWeight) ; aucune primitive d'interligne ;
 *     taille-texte reste en px : le passage en rem casse l'index de la migration (src/report/migration.js,
 *     dimensions en px seulement), signalé avant tout changement ;
 *   couche marque : marque.police.titre = Georgia, serif ; marque.police.texte = "Orbe Sans", Arial, sans-serif
 *     ($type fontFamily) ; marqueTokens les produit (paramètre polices) ;
 *   couche sémantique : groupe typo, $type typography, onze jetons composites, une phrase d'usage chacun,
 *     sans couleur ; valeur DTCG 2025.10 à cinq propriétés (fontFamily, fontSize, fontWeight, letterSpacing,
 *     lineHeight ; letterSpacing est obligatoire dans la spécification, 0 px ici, valeur à décider [V]) ;
 *     fontSize → {taille-texte.N}, fontWeight → {graisse.W}, fontFamily → {marque.police.titre} pour
 *     affichage et titres 1 à 3, {marque.police.texte} pour le reste ; lineHeight = rapport sans unité
 *     (hauteur visée ÷ taille), arrondi à 4 décimales ; la hauteur visée en px est écrite dans la description ;
 *     valeur en étroit sous la forme ds-lab.etroit, comme ecart.section :
 *     { valeur: { fontSize, lineHeight }, sous: 600 px, seuil: "[H]" }, pour affichage et titres 1 à 3 ;
 *   la couche couleur ne change pas : resolveRoles rend toujours 42 rôles.
 * Table (taille / ligne en large ; en étroit ; graisse ; usage) :
 *   affichage.grand 60/68 ; 36/40 ; 700 ; hero d'une page d'accueil
 *   affichage.moyen 48/56 ; 30/36 ; 700 ; grand chiffre, bandeau
 *   titre.1 30/36 ; 24/32 ; 700 ; titre de page
 *   titre.2 24/32 ; 20/28 ; 700 ; titre de section
 *   titre.3 20/28 ; 18/24 ; 600 ; titre de carte
 *   titre.4 16/24 ; — ; 700 ; sous-groupe, écrans denses
 *   corps.grand 18/28 ; corps.moyen 16/24 ; corps.petit 14/20 (400) ; libelle 14/20 (600) ; mention 14/20 (400).
 * Rapports attendus (hauteur ÷ taille, 4 décimales) : 68/60 1,1333 ; 40/36 1,1111 ; 56/48 1,1667 ; 36/30 1,2 ;
 *   32/24 1,3333 ; 28/20 1,4 ; 24/18 1,3333 ; 24/16 1,5 ; 28/18 1,5556 ; 20/14 1,4286.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveRoles } from '../src/tokens/roles.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const prims = load('primitives.tokens.json');
const marque = load('marque.tokens.json');
const sem = load('semantique.tokens.json');

/** style → [taille, ligne, taille étroit, ligne étroit, graisse, police, rapport, rapport étroit, usage (début de la description)] */
const STYLES = /** @type {Record<string, [number, number, number | null, number | null, number, 'titre' | 'texte', number, number | null, string]>} */ ({
  'affichage.grand': [60, 68, 36, 40, 700, 'titre', 1.1333, 1.1111, "Hero d'une page d'accueil"],
  'affichage.moyen': [48, 56, 30, 36, 700, 'titre', 1.1667, 1.2, 'Grand chiffre ou bandeau'],
  'titre.1': [30, 36, 24, 32, 700, 'titre', 1.2, 1.3333, 'Titre de page'],
  'titre.2': [24, 32, 20, 28, 700, 'titre', 1.3333, 1.4, 'Titre de section'],
  'titre.3': [20, 28, 18, 24, 600, 'titre', 1.4, 1.3333, 'Titre de carte'],
  'titre.4': [16, 24, null, null, 700, 'texte', 1.5, null, 'Titre de sous-groupe'],
  'corps.grand': [18, 28, null, null, 400, 'texte', 1.5556, null, 'Chapô'],
  'corps.moyen': [16, 24, null, null, 400, 'texte', 1.5, null, 'Texte courant'],
  'corps.petit': [14, 20, null, null, 400, 'texte', 1.4286, null, 'Texte de tableau'],
  libelle: [14, 20, null, null, 600, 'texte', 1.4286, null, 'Libellé de champ'],
  mention: [14, 20, null, null, 400, 'texte', 1.4286, null, 'Aide'],
});

/** @param {any} node @param {string} path */
const at = (node, path) => path.split('.').reduce((n, k) => n?.[k], node);

test('typo primitives : graisse 400, 600, 700, aucune primitive d\'interligne', () => {
  assert.equal(prims.graisse.$type, 'fontWeight');
  assert.deepEqual(Object.keys(prims.graisse).filter((k) => !k.startsWith('$')), ['400', '600', '700']);
  for (const w of ['400', '600', '700']) {
    assert.equal(prims.graisse[w].$value, Number(w), `graisse.${w}`);
    assert.ok(prims.graisse[w].$description, `graisse.${w} : description`);
  }
  assert.doesNotMatch(JSON.stringify(Object.keys(prims)), /interligne|line/i);
  assert.equal(prims['taille-texte'][16].$value.unit, 'px', 'taille-texte reste en px (migration)');
});

test('typo marque : police.titre et police.texte', () => {
  const p = marque.marque.police;
  assert.equal(p.$type, 'fontFamily');
  assert.deepEqual(Object.keys(p).filter((k) => !k.startsWith('$')), ['titre', 'texte']);
  assert.deepEqual(p.titre.$value, ['Georgia', 'serif']);
  assert.deepEqual(p.texte.$value, ['Orbe Sans', 'Arial', 'sans-serif']);
  assert.ok(p.titre.$description && p.texte.$description);
});

test('typo sémantique : onze styles composites, DTCG 2025.10, alias et rapports attendus', () => {
  assert.equal(sem.typo.$type, 'typography');
  const found = [];
  /** @param {any} n @param {string[]} path */
  const walk = (n, path) => {
    for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) ('$value' in v ? found.push([...path, k].join('.')) : walk(v, [...path, k]));
  };
  walk(sem.typo, []);
  assert.deepEqual(found.sort(), Object.keys(STYLES).sort());
  for (const [style, [taille, , , , graisse, police, rapport]] of Object.entries(STYLES)) {
    const v = at(sem.typo, style).$value;
    assert.deepEqual(v, {
      fontFamily: `{marque.police.${police}}`,
      fontSize: `{taille-texte.${taille}}`,
      fontWeight: `{graisse.${graisse}}`,
      letterSpacing: { value: 0, unit: 'px' },
      lineHeight: rapport,
    }, style);
    assert.ok(at(prims, `taille-texte.${taille}`)?.$value, `${style} : taille-texte.${taille} existe`);
  }
});

test('typo sémantique : rapport = hauteur visée ÷ taille, 4 décimales', () => {
  for (const [style, [t, l, te, le, , , r, re]] of Object.entries(STYLES)) {
    assert.equal(r, Math.round((l / t) * 10000) / 10000, `${style} large`);
    if (te !== null && le !== null) assert.equal(re, Math.round((le / te) * 10000) / 10000, `${style} étroit`);
  }
});

test('typo sémantique : valeur en étroit ds-lab.etroit pour affichage et titres 1 à 3, eux seuls', () => {
  for (const [style, [, , te, , , , , re]] of Object.entries(STYLES)) {
    const x = at(sem.typo, style).$extensions;
    if (te === null) assert.equal(x, undefined, style);
    else assert.deepEqual(x, { 'ds-lab.etroit': { valeur: { fontSize: `{taille-texte.${te}}`, lineHeight: re }, sous: { value: 600, unit: 'px' }, seuil: '[H]' } }, style);
  }
});

test('typo sémantique : une phrase d\'usage, hauteur visée en px, sans couleur', () => {
  for (const [style, [, l, , le, , , , , usage]] of Object.entries(STYLES)) {
    const d = at(sem.typo, style).$description;
    assert.ok(d.startsWith(usage), `${style} : « ${d} »`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${style} : majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${style} : une seule phrase`);
    assert.ok(d.includes(`ligne visée ${l} px`), `${style} : hauteur visée`);
    if (le !== null) assert.ok(d.includes(`${le} px en étroit`), `${style} : hauteur visée en étroit`);
  }
  // Sans couleur : ni propriété de couleur ni alias vers une couleur dans les valeurs (la prose peut dire « sans couleur »).
  for (const style of Object.keys(STYLES)) {
    const t = at(sem.typo, style);
    assert.doesNotMatch(JSON.stringify([t.$value, t.$extensions ?? null]), /color|couleur|marque\.(primaire|accent|erreur|succes|avertissement|info)|#[0-9a-f]{3,8}\b/i, style);
  }
});

test('typo : la couche couleur ne change pas, 42 rôles', () => {
  assert.equal(resolveRoles(sem, prims, load('statuts.tokens.json'), marque).size, 42);
});
