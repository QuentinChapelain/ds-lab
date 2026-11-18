// @ts-check
/**
 * Marques fictives ajoutées par fichier (docs/attendus/etape-4-contrat-de-marque.md ; Maison Alberto :
 * docs/attendus/atelier.md).
 *
 * Attendus écrits à la main avant les fichiers (15/11/2026). Contraste du blanc sur la couleur saisie, OKLCH
 * (culori : wcagContrast, oklch), école du générateur (generateScale) et classe de plein (classePlein) ;
 * commande d'essai : node --input-type=module -e (generateScale, classePlein, wcagContrast, oklch sur chaque couleur).
 *   Atelier Lavandine, une moyenne : primaire #8a4fd8 (blanc 5,01 ; L 0,565 ; h 299,7) école normale, plein moyen ;
 *     accent #f2b705 (blanc 1,82 ; L 0,811 ; h 85,0) école plein clair, plein clair.
 *   Écume et Sel, une claire (cyan clair) : primaire #7fdbff (blanc 1,56 ; L 0,847 ; h 225,4) école plein clair,
 *     plein moyen ; accent #e4572e (blanc 3,68 ; L 0,637 ; h 36,5) école normale, plein moyen.
 *   Grenat Papeterie, sans accent : primaire #7a1f3d (blanc 10,04 ; L 0,396 ; h 5,2) école foncée, plein sombre ;
 *     accent replié sur le neutre (D05), plein moyen.
 * Règle des pleins (D04 ; culori, wcagContrast sur les échelles générées) : Lavandine primaire soutenu
 *   (blanc 5,01 sur le pas 9, 5,30 sur le pas 10), accent clair (pas 12 : 7,18 sur le pas 9, 6,10 sur le pas 10) ;
 *   Écume primaire clair (8,33 et 7,08), accent moyen (blanc 3,68, pas 12 : 3,52) ; Grenat inchangé.
 * Maison Alberto, attendus écrits à la main le 18/11/2026, mêmes règles, culori seul (wcagContrast, oklch sur la couleur
 *   saisie ; wcagContrast sur l'échelle générée de echelles.tokens.json) ; commande :
 *   node --input-type=module -e (wcagContrast(blanc, source), oklch(source), puis D04 sur les pas 9, 10 et 12) :
 *   primaire #bf9b45 (blanc 2,63 ; L 0,706 ; h 86,3) école plein clair, plein moyen (blanc 2,63 ; pas 12 : 4,97 sur
 *     le pas 9, 4,22 sur le pas 10) ; accent #ba4c99 (blanc 4,58 ; L 0,585 ; h 340,9) école normale, plein soutenu ;
 *   sans polices.texte : la police du produit (D16).
 * Les quatre sont acceptées (aucun motif) ; leurs fichiers versionnés sont ceux que produit la saisie ;
 * npm run contraste -- --marque <dossier> sort 0.
 * Survol de la classe soutenu (décision du 15/11/2026, 13 h 58) : couleur exacte sous un voile noir de 15 %, valeur
 *   calculée, formule en $extensions. Lavandine : culori, formatHex(interpolate(['#8a4fd8', '#000000'], 'rgb')(0.15))
 *   = #7543b8 ; blanc dessus 6,46:1 ; ΔE OKLab × 100 avec le repos 6,68 (le pas 10 était à 1,33).
 * Les quatre statuts ont le même bouton que chez Orbe Café (statuts figés, D04).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { saisir, serialiser } from '../src/tokens/saisie.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** dossier → [nom, primaire, accent ou null, [école primaire, école accent ou null], [plein primaire, plein accent]] */
const MARQUES = {
  'atelier-lavandine': ['Atelier Lavandine', '#8a4fd8', '#f2b705', ['normale', 'plein clair'], ['soutenu', 'clair']],
  'ecume-et-sel': ['Écume et Sel', '#7fdbff', '#e4572e', ['plein clair', 'normale'], ['clair', 'moyen']],
  'grenat-papeterie': ['Grenat Papeterie', '#7a1f3d', null, ['foncée', null], ['sombre', 'moyen']],
  'maison-alberto': ['Maison Alberto', '#bf9b45', '#ba4c99', ['plein clair', 'normale'], ['moyen', 'soutenu']],
};

for (const [slug, [nom, primaire, accent, ecoles, pleins]] of Object.entries(MARQUES)) {
  const dir = join(ROOT, 'tokens', slug);
  const read = (/** @type {string} */ f) => readFileSync(join(dir, f), 'utf8');

  test(`${nom} : entrée, acceptée, fichiers produits par la saisie`, () => {
    const entree = JSON.parse(read('entree.json'));
    assert.equal(entree.nom, nom);
    assert.equal(entree.primaire, primaire);
    assert.equal(entree.accent, accent ?? undefined);
    const r = saisir(entree, { dossier: dir });
    assert.deepEqual(r.motifs, []);
    assert.equal(read('marque.tokens.json'), serialiser(r.marque));
    assert.equal(read('echelles.tokens.json'), serialiser(r.echelles));
  });

  test(`${nom} : écoles du générateur et classes de plein`, () => {
    const echelles = JSON.parse(read('echelles.tokens.json')).couleur;
    const marque = JSON.parse(read('marque.tokens.json')).marque;
    assert.equal(echelles.primaire.$extensions['ds-lab.valise'].ecole, ecoles[0]);
    if (ecoles[1]) assert.equal(echelles.accent.$extensions['ds-lab.valise'].ecole, ecoles[1]);
    else assert.equal(echelles.accent, undefined);
    assert.equal(marque.primaire.$extensions['ds-lab.plein'].classe, pleins[0]);
    assert.equal(marque.accent.$extensions['ds-lab.plein'].classe, pleins[1]);
    assert.equal(marque.primaire['9'].$value, '{couleur.primaire.9}');
    assert.equal(marque.accent['9'].$value, accent ? '{couleur.accent.9}' : '{couleur.neutre.9}');
  });

  if (slug === 'atelier-lavandine')
    test('Atelier Lavandine : survol soutenu, voile noir de 15 %', () => {
      const t = JSON.parse(read('marque.tokens.json')).marque.primaire['plein-survol'];
      assert.equal(t.$value.hex, '#7543b8');
      assert.deepEqual(t.$extensions['ds-lab.voile'], { base: '{couleur.primaire.9}', noir: 0.15, composition: 'noir posé sur la base, source-over en sRGB' });
    });

  test(`${nom} : statuts identiques à ceux d'Orbe Café`, () => {
    const orbe = JSON.parse(readFileSync(join(ROOT, 'tokens', 'orbe-cafe', 'marque.tokens.json'), 'utf8')).marque;
    const marque = JSON.parse(read('marque.tokens.json')).marque;
    for (const s of ['erreur', 'succes', 'avertissement', 'info']) assert.deepEqual(marque[s], orbe[s], s);
  });

  test(`${nom} : npm run contraste -- --marque sort 0`, () => {
    assert.ok(existsSync(join(dir, 'entree.json')));
    const r = spawnSync(process.execPath, ['src/cli/contraste.js', '--marque', dir], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /0 paire en échec/);
  });
}
