// @ts-check
/**
 * Graisses, polices de marque et onze styles de texte d'Orbe Café (marque fictive).
 *
 * Attendu écrit à la main avant le code, d'après le plan typo du 15/11/2026 :
 *   primitives : graisse 400, 600, 700 ($type fontWeight) ; aucune primitive d'interligne ;
 *     taille-texte reste en px : le passage en rem casse l'index de la migration (src/report/migration.js,
 *     dimensions en px seulement), signalé avant tout changement ;
 *   couche marque : brand.font.heading = Georgia, serif ; brand.font.body = "Orbe Sans", Arial, sans-serif
 *     ($type fontFamily) ; marqueTokens les produit (paramètre polices) ;
 *   couche sémantique : groupe typo, $type typography, onze jetons composites (treize avec les deux styles des
 *     initiales de l'avatar, docs/attendus/avatar-etiquette.md), une phrase d'usage chacun,
 *     sans couleur ; valeur DTCG 2025.10 à cinq propriétés (fontFamily, fontSize, fontWeight, letterSpacing,
 *     lineHeight ; letterSpacing est obligatoire dans la spécification, 0 px ici, valeur à décider [V]) ;
 *     fontSize → {taille-texte.N}, fontWeight → {graisse.W}, fontFamily → {brand.font.heading} pour
 *     affichage et titres 1 à 3, {brand.font.body} pour le reste ; lineHeight = rapport sans unité
 *     (hauteur visée ÷ taille), arrondi à 4 décimales ; la hauteur visée en px est écrite dans la description ;
 *     valeur en étroit sous la forme ds-lab.etroit, comme gap.section :
 *     { valeur: { fontSize, lineHeight }, sous: 600 px, seuil: "[H]" }, pour affichage et titres 1 à 3 ;
 *   la couche couleur ne change pas : resolveRoles rend toujours 42 rôles.
 *   Correction du 18/11/2026 (D44) : label prend {font.product}, la police du produit, que la couche marque ne
 *   remplace pas.
 * Table (taille / ligne en large ; en étroit ; graisse ; usage) :
 *   display.large 60/68 ; 36/40 ; 700 ; hero d'une page d'accueil
 *   display.medium 48/56 ; 30/36 ; 700 ; grand chiffre, bandeau
 *   heading.1 30/36 ; 24/32 ; 700 ; titre de page
 *   heading.2 24/32 ; 20/28 ; 700 ; titre de section
 *   heading.3 20/28 ; 18/24 ; 600 ; titre de carte
 *   heading.4 16/24 ; — ; 700 ; sous-groupe, écrans denses
 *   body.large 18/28 ; body.medium 16/24 ; body.small 14/20 (400) ; label 14/20 (600) ; supporting-text 12/16 (400,
 *   décision du 15/11/2026 prise sur la planche : {font-size.12}, rapport 1,3333 ; aucun autre jeton ne change).
 * Rapports attendus (hauteur ÷ taille, 4 décimales) : 68/60 1,1333 ; 40/36 1,1111 ; 56/48 1,1667 ; 36/30 1,2 ;
 *   32/24 1,3333 ; 28/20 1,4 ; 24/18 1,3333 ; 24/16 1,5 ; 28/18 1,5556 ; 20/14 1,4286.
 * D17 : lignes relevées pour que l'encre de deux lignes ne se touche pas,
 *   en gardant DS7 ; display.large 60/76 (76/60 = 1,26667 → 1,2667) et 36/48 (1,3333) ; display.medium 48/60
 *   (1,25) et 30/40 (1,3333) ; heading.1 30/40 (1,3333) en large, inchangé en étroit ; le reste inchangé.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveRoles } from '../src/tokens/roles.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';
import { N_ROLES } from './helpers/roles-ajoutes.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = charger;
const prims = load('primitives.tokens.json');
const marque = load('marque.tokens.json');
const sem = load('semantique.tokens.json');

/** style → [taille, ligne, taille étroit, ligne étroit, graisse, police, rapport, rapport étroit, usage (début de la description)] */
const STYLES = /** @type {Record<string, [number, number, number | null, number | null, number, 'heading' | 'body' | 'produit', number, number | null, string]>} */ ({
  'display.large': [60, 76, 36, 48, 700, 'heading', 1.2667, 1.3333, "Hero d'une page d'accueil"],
  'display.medium': [48, 60, 30, 40, 700, 'heading', 1.25, 1.3333, 'Grand chiffre ou bandeau'],
  'heading.1': [30, 40, 24, 32, 700, 'heading', 1.3333, 1.3333, 'Titre de page'],
  'heading.2': [24, 32, 20, 28, 700, 'heading', 1.3333, 1.4, 'Titre de section'],
  'heading.3': [20, 28, 18, 24, 600, 'heading', 1.4, 1.3333, 'Titre de carte'],
  'heading.4': [16, 24, null, null, 700, 'body', 1.5, null, 'Titre de sous-groupe'],
  'body.large': [18, 28, null, null, 400, 'body', 1.5556, null, 'Chapô'],
  'body.medium': [16, 24, null, null, 400, 'body', 1.5, null, 'Texte courant'],
  'body.small': [14, 20, null, null, 400, 'body', 1.4286, null, 'Texte de tableau'],
  label: [14, 20, null, null, 600, 'produit', 1.4286, null, 'Libellé de champ'],
  'supporting-text': [12, 16, null, null, 400, 'body', 1.3333, null, 'Aide'],
  // Initiales de l'avatar (docs/attendus/avatar-etiquette.md).
  'initials.medium': [16, 24, null, null, 600, 'body', 1.5, null, "Initiales de l'avatar normal"],
  'initials.large': [24, 32, null, null, 600, 'body', 1.3333, null, 'Initiales du grand avatar'],
});

/** @param {any} node @param {string} path */
const at = (node, path) => path.split('.').reduce((n, k) => n?.[k], node);

test('typo primitives : graisse 400, 600, 700, aucune primitive d\'interligne', () => {
  assert.equal(prims['font-weight'].$type, 'fontWeight');
  assert.deepEqual(Object.keys(prims['font-weight']).filter((k) => !k.startsWith('$')), ['400', '600', '700']);
  for (const w of ['400', '600', '700']) {
    assert.equal(prims['font-weight'][w].$value, Number(w), `font-weight.${w}`);
    assert.ok(prims['font-weight'][w].$description, `font-weight.${w} : description`);
  }
  assert.doesNotMatch(JSON.stringify(Object.keys(prims)), /interligne|line/i);
  assert.equal(prims['font-size'][16].$value.unit, 'px', 'font-size reste en px (migration)');
});

test('typo marque : brand.font.heading et brand.font.body', () => {
  const p = marque.brand.font;
  assert.equal(p.$type, 'fontFamily');
  assert.deepEqual(Object.keys(p).filter((k) => !k.startsWith('$')), ['heading', 'body']);
  assert.deepEqual(p.heading.$value, ['Georgia', 'serif']);
  assert.deepEqual(p.body.$value, ['Orbe Sans', 'Arial', 'sans-serif']);
  assert.ok(p.heading.$description && p.body.$description);
});

test('typo sémantique : treize styles composites, DTCG 2025.10, alias et rapports attendus', () => {
  assert.equal(sem.typography.$type, 'typography');
  const found = [];
  /** @param {any} n @param {string[]} path */
  const walk = (n, path) => {
    for (const [k, v] of Object.entries(n)) if (!k.startsWith('$')) ('$value' in v ? found.push([...path, k].join('.')) : walk(v, [...path, k]));
  };
  walk(sem.typography, []);
  assert.deepEqual(found.sort(), Object.keys(STYLES).sort());
  for (const [style, [taille, , , , graisse, police, rapport]] of Object.entries(STYLES)) {
    const v = at(sem.typography, style).$value;
    assert.deepEqual(v, {
      fontFamily: police === 'produit' ? '{font.product}' : `{brand.font.${police}}`,
      fontSize: `{font-size.${taille}}`,
      fontWeight: `{font-weight.${graisse}}`,
      letterSpacing: { value: 0, unit: 'px' },
      lineHeight: rapport,
    }, style);
    assert.ok(at(prims, `font-size.${taille}`)?.$value, `${style} : font-size.${taille} existe`);
  }
});

test('typo sémantique : rapport = hauteur visée ÷ taille, 4 décimales', () => {
  for (const [style, [t, l, te, le, , , r, re]] of Object.entries(STYLES)) {
    assert.equal(r, Math.round((l / t) * 10000) / 10000, `${style} large`);
    if (te !== null && le !== null) assert.equal(re, Math.round((le / te) * 10000) / 10000, `${style} étroit`);
  }
});

test('typo sémantique : valeur en étroit dans le contexte étroit pour affichage et titres 1 à 3, eux seuls, composite entier', () => {
  const etroit = charger('largeur.etroit.tokens.json');
  for (const [style, [, , te, , , , , re]] of Object.entries(STYLES)) {
    // La consigne de hauteur de capitale est le seul $extensions permis (police-consigne.test.js).
    assert.equal(at(sem.typography, style).$extensions?.['ds-lab.etroit'], undefined, style);
    const x = at(etroit.typography, style);
    if (te === null) assert.equal(x, undefined, style);
    else assert.deepEqual(x.$value, { ...at(sem.typography, style).$value, fontSize: `{font-size.${te}}`, lineHeight: re }, style);
  }
});

test('typo sémantique : une phrase d\'usage, hauteur visée en px, sans couleur', () => {
  for (const [style, [, l, , le, , , , , usage]] of Object.entries(STYLES)) {
    const d = at(sem.typography, style).$description;
    // La hauteur visée, mesure utile à l'équipe, est dans la description ou, pour un style cité par une fiche, dans la
    // note de l'équipe (DOC3, D57).
    const texte = `${d} ${at(sem.typography, style).$extensions?.['ds-lab.note'] ?? ''}`;
    assert.ok(d.startsWith(usage), `${style} : « ${d} »`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${style} : majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${style} : une seule phrase`);
    assert.ok(texte.includes(`ligne visée ${l} px`), `${style} : hauteur visée`);
    if (le !== null) assert.ok(texte.includes(`${le} px en étroit`), `${style} : hauteur visée en étroit`);
  }
  // Sans couleur : ni propriété de couleur ni alias vers une couleur dans les valeurs (la prose peut dire « sans couleur »).
  for (const style of Object.keys(STYLES)) {
    const t = at(sem.typography, style);
    assert.doesNotMatch(JSON.stringify([t.$value, t.$extensions ?? null]), /color|couleur|brand\.(primary|accent|error|success|warning|info)|#[0-9a-f]{3,8}\b/i, style);
  }
});

test('typo : la couche couleur ne change pas, 42 rôles plus les ajouts (helpers/roles-ajoutes.js)', () => {
  assert.equal(resolveRoles(sem, prims, load('statuts.tokens.json'), marque).size, N_ROLES);
});
