// @ts-check
/**
 * Étape 4, séance a, lot 3 : calibrage (docs/attendus/etape-4-contrat-de-marque.md).
 * Table des marques (une colonne par marque) et balayage des teintes près des seuils du cas clair.
 * Aucun seuil ne change : la table et les planches servent la décision, sur image.
 *
 * Attendus écrits à la main avant le code (15/11/2026), pour les quatre marques versionnées.
 * École du générateur (generateScale, recalculée sur le pas 9), classe de plein (classePlein), couleur exacte sur le
 * bouton (plein = pas 9 en sombre et en clair, pas 11 en moyen) :
 *   Orbe Café          école foncée,      plein sombre, couleur exacte sur le bouton : oui (pas 9) ;
 *   Atelier Lavandine  école normale,     plein moyen,  non (pas 11) ;
 *   Écume et Sel       école plein clair, plein moyen,  non (pas 11) ;
 *   Grenat Papeterie   école foncée,      plein sombre, oui (pas 9).
 * Indicateurs montrés, jamais des refus (D13). ΔE OKLab × 100 entre pas 9, culori differenceEuclidean('oklab') ;
 * chroma OKLCH, culori oklch ; commande : node --input-type=module -e (differenceEuclidean, oklch sur les pas 9) :
 *   Orbe Café          C 0,093 ; statut le plus proche info, ΔE 18,0 ; accent à ΔE 28,7 du primaire ;
 *   Atelier Lavandine  C 0,201 ; info, ΔE 17,5 ; accent à ΔE 42,8 ;
 *   Écume et Sel       C 0,101 ; info, ΔE 26,5 ; accent à ΔE 35,3 ;
 *   Grenat Papeterie   C 0,127 ; erreur, ΔE 20,8 ; sans accent.
 *   Aucune n'est grise (C < 0,02, seuil gris du lot M).
 * Balayage : teintes 30° à 140° par pas de 5° (23), clartés 0,60 à 0,92 par pas de 0,04 (9), deux chromas
 * (la plus forte dans le gamut sRGB, et 0,10 ramenée au gamut) : 2 × 207 cases. Dans chaque case, la classe est
 * celle de classePlein sur le pas 9 de l'échelle générée ; à L 0,80 et chroma forte : h 85° clair, h 50° et h 120° moyen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { colonne, balayage, calibrageHtml, calibrageMd } from '../src/report/calibrage.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const entree = (/** @type {string} */ slug) => {
  const dossier = join(ROOT, 'tokens', slug);
  return { dossier, entree: JSON.parse(readFileSync(join(dossier, 'entree.json'), 'utf8')) };
};

/** slug → [école, classe, exacte, pas du bouton, chroma, statut proche, ΔE statut, ΔE accent ou null] */
const ATTENDU = {
  'orbe-cafe': ['foncée', 'sombre', true, 9, 0.093, 'info', 18.0, 28.7],
  'atelier-lavandine': ['normale', 'moyen', false, 11, 0.201, 'info', 17.5, 42.8],
  'ecume-et-sel': ['plein clair', 'moyen', false, 11, 0.101, 'info', 26.5, 35.3],
  'grenat-papeterie': ['foncée', 'sombre', true, 9, 0.127, 'erreur', 20.8, null],
};

const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
const r3 = (/** @type {number} */ n) => Math.round(n * 1000) / 1000;

for (const [slug, [ecole, classe, exacte, pas, c, statut, dStatut, dAccent]] of Object.entries(ATTENDU)) {
  test(`colonne ${slug} : classes, bouton, indicateurs`, () => {
    const col = colonne(entree(slug));
    assert.deepEqual(col.motifs, []);
    assert.equal(col.primaire.ecole, ecole);
    assert.equal(col.primaire.classe, classe);
    assert.equal(col.primaire.exacte, exacte);
    assert.equal(col.primaire.pasBouton, pas);
    assert.equal(r3(col.primaire.chroma), c);
    assert.equal(col.grise, false);
    assert.equal(col.statutProche.nom, statut);
    assert.equal(r1(col.statutProche.dE), dStatut);
    assert.equal(col.accentProche === null ? null : r1(col.accentProche), dAccent);
  });
}

test('colonne d\'une marque refusée : motif, pas de classe', () => {
  const col = colonne({ dossier: join(ROOT, 'tokens', 'essai'), entree: { nom: 'Essai', primaire: '#cc9900', polices: { titre: ['a'], texte: ['b'] } } });
  assert.deepEqual(col.motifs, ['contraste : texte.sur-interactif sur fond.interactif.fort.survol, 4,27:1 < 4,5:1']);
  assert.equal(col.primaire.classe, 'clair', 'la classe reste montrée');
});

test('balayage : 2 × 207 cases, classes aux points témoins', () => {
  const b = balayage();
  assert.equal(b.length, 2);
  for (const planche of b) assert.equal(planche.cases.length, 207);
  const at = (/** @type {number} */ l, /** @type {number} */ h) => b[0].cases.find((x) => Math.abs(x.l - l) < 1e-9 && x.h === h);
  assert.equal(at(0.8, 85)?.classe, 'clair');
  assert.equal(at(0.8, 50)?.classe, 'moyen');
  assert.equal(at(0.8, 120)?.classe, 'moyen');
});

test('sorties : HTML autonome, Markdown étiqueté', () => {
  const cols = Object.keys(ATTENDU).map((s) => colonne(entree(s)));
  const html = calibrageHtml(cols, balayage());
  assert.match(html, /^<!doctype html>/);
  assert.doesNotMatch(html, /<script|<link|https?:\/\//);
  const md = calibrageMd(cols);
  assert.match(md, /\| Orbe Café \| Atelier Lavandine \| Écume et Sel \| Grenat Papeterie \|/);
  assert.match(md, /\[F\]/);
});
