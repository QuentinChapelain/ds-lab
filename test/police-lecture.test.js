// @ts-check
/**
 * Lecture d'une police des titres (docs/attendus/etape-4c-police-des-titres.md).
 * Attendus écrits à la main avant le code, chiffres lus avec fontTools 4.60.2 (bibliothèque indépendante, hors du dépôt) :
 *   PYTHONPATH=local/outils/fonttools python3 -c "from fontTools.ttLib import TTFont; t = TTFont('<fichier>'); ..."
 *   (OS/2 : version, sCapHeight, sxHeight, usWeightClass, sTypoAscender, sTypoDescender ; hhea : ascent, descent, lineGap ;
 *   head.unitsPerEm ; fvar : axe wght ; name 1, 13, 14 ; len(getBestCmap()) ; flavor)
 *   L1 à L4 chaque fichier WOFF2 d'essai : format, unités par em, capitale, x, ascendante et descendante (hhea),
 *      graisses (axe wght ou usWeightClass), famille (name 1), licence (name 13, sinon 14), nombre de caractères couverts ;
 *   L5 un WOFF (wOFF) est reconnu comme tel et n'est pas lu plus loin ;
 *   L6 sans fichier, la police des titres est acceptée par ses noms, non contrôlée ; la couche marque ne change pas ;
 *   L7 avec fichiers ({ familles, fichiers }, chemins relatifs à l'entrée), la saisie lit chaque fichier ; la couche marque
 *      écrit les familles en $value et les chemins en $extensions["ds-lab.police"] ;
 *   L8 fichier introuvable ou forme inconnue : entrée invalide, avec motif ;
 *   L9 la commande affiche « non contrôlée » pour une marque sans fichier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lirePolice } from '../src/polices/lecture.js';
import { saisir } from '../src/tokens/saisie.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POLICES = join(ROOT, 'fixtures', 'polices');
const OFL = 'https://scripts.sil.org/OFL';

const ATTENDUS = [
  { f: 'oswald/oswald-latin-wght-normal.woff2', famille: 'Oswald', cap: 810, x: 578, asc: 1193, desc: -289, typo: [1193, -289], graisses: { min: 200, max: 700 }, variable: true, licence: OFL, couverts: 226 },
  { f: 'eb-garamond/eb-garamond-latin-wght-normal.woff2', famille: 'EB Garamond', cap: 650, x: 400, asc: 1007, desc: -298, typo: [1007, -298], graisses: { min: 400, max: 800 }, variable: true, licence: 'https://openfontlicense.org', couverts: 236 },
  { f: 'cinzel/cinzel-latin-wght-normal.woff2', famille: 'Cinzel', cap: 700, x: 500, asc: 976, desc: -372, typo: [976, -372], graisses: { min: 400, max: 900 }, variable: true, licence: OFL, couverts: 220 },
  { f: 'bebas-neue/bebas-neue-latin-400-normal.woff2', famille: 'Bebas Neue', cap: 700, x: 700, asc: 900, desc: -300, typo: [900, -300], graisses: { min: 400, max: 400 }, variable: false, licence: 'http://scripts.sil.org/OFL', couverts: 223 },
];

ATTENDUS.forEach((a, i) =>
  test(`L${i + 1} ${a.famille} : mesures et couverture lues dans le WOFF2`, () => {
    const p = lirePolice(readFileSync(join(POLICES, a.f)));
    assert.equal(p.format, 'WOFF2');
    assert.ok(p.lisible);
    assert.equal(p.famille, a.famille);
    assert.equal(p.unitesParEm, 1000);
    assert.equal(p.capitale, a.cap);
    assert.equal(p.x, a.x);
    assert.equal(p.ascendante, a.asc);
    assert.equal(p.descendante, a.desc);
    assert.deepEqual([p.typo.ascendante, p.typo.descendante], a.typo);
    assert.deepEqual(p.graisses, a.graisses);
    assert.equal(p.variable, a.variable);
    assert.equal(p.licence, a.licence);
    assert.equal(p.couverture.size, a.couverts);
    for (const c of 'Été à Évian, nos cafés du mois œŒæÆ«»’–') assert.ok(p.couverture.has(/** @type {number} */ (c.codePointAt(0))), c);
  }),
);

test('L5 un WOFF est reconnu et n\'est pas lu plus loin', () => {
  const p = lirePolice(readFileSync(join(POLICES, 'bebas-neue/bebas-neue-latin-400-normal.woff')));
  assert.equal(p.format, 'WOFF');
  assert.equal(p.lisible, false);
  assert.equal(lirePolice(Buffer.from('pas une police')).format, 'inconnu');
});

const entree = (/** @type {any} */ titre) => ({ nom: 'Essai', primaire: '#8a4fd8', polices: { titre } });

test('L6 sans fichier : acceptée par ses noms, non contrôlée, couche marque inchangée', () => {
  const r = saisir(entree(['Georgia', 'serif']), { dossier: '/ailleurs' });
  assert.deepEqual(r.motifs, []);
  assert.deepEqual(r.policeTitre, { familles: ['Georgia', 'serif'], controlee: false, fichiers: [] });
  assert.deepEqual(r.marque.brand.font.heading, { $value: ['Georgia', 'serif'], $description: 'Police des styles affichage et titre 1 à 3.' });
});

test('L7 avec fichiers : lus, familles en $value, chemins en $extensions', () => {
  const r = saisir(entree({ familles: ['Oswald', 'sans-serif'], fichiers: ['oswald/oswald-latin-wght-normal.woff2'] }), { dossier: POLICES });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.policeTitre.controlee, true);
  assert.equal(r.policeTitre.fichiers.length, 1);
  assert.equal(r.policeTitre.fichiers[0].chemin, 'oswald/oswald-latin-wght-normal.woff2');
  assert.equal(r.policeTitre.fichiers[0].police.capitale, 810);
  const t = r.marque.brand.font.heading;
  assert.deepEqual(t.$value, ['Oswald', 'sans-serif']);
  assert.deepEqual(t.$extensions, { 'ds-lab.police': { fichiers: ['oswald/oswald-latin-wght-normal.woff2'] } });
});

test('L8 fichier introuvable, forme inconnue : entrée invalide', () => {
  const m = (/** @type {any} */ titre) => saisir(entree(titre), { dossier: POLICES }).motifs;
  assert.deepEqual(m({ familles: ['Oswald'], fichiers: ['absent.woff2'] }), ['entrée invalide : polices.titre, fichier introuvable : absent.woff2']);
  assert.deepEqual(m({ familles: ['Oswald'], fichiers: [] }), ['entrée invalide : polices.titre.fichiers, liste de chemins attendue']);
  assert.deepEqual(m({ familles: ['Oswald'], fichier: 'x' }), ['entrée invalide : clé inconnue polices.titre.fichier', 'entrée invalide : polices.titre.fichiers, liste de chemins attendue']);
  assert.deepEqual(m({ fichiers: ['oswald/oswald-latin-wght-normal.woff2'] }), ['entrée invalide : polices.titre.familles, liste de noms de familles attendue']);
});

test('L9 la commande dit « non contrôlée » pour une police sans fichier', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'ds-lab-police-'));
  writeFileSync(join(dossier, 'entree.json'), JSON.stringify(entree(['Georgia', 'serif'])));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'saisie.js'), join(dossier, 'entree.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /police des titres : Georgia, serif, non contrôlée \(aucun fichier\)/);
});
