// @ts-check
/**
 * Étape 4, séance a, lot 2 : trois marques fictives ajoutées par fichier (docs/attendus/etape-4-contrat-de-marque.md).
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
 * Les trois sont acceptées (aucun motif) ; leurs fichiers versionnés sont ceux que produit la saisie ;
 * npm run contraste -- --marque <dossier> sort 0.
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
  'atelier-lavandine': ['Atelier Lavandine', '#8a4fd8', '#f2b705', ['normale', 'plein clair'], ['moyen', 'clair']],
  'ecume-et-sel': ['Écume et Sel', '#7fdbff', '#e4572e', ['plein clair', 'normale'], ['moyen', 'moyen']],
  'grenat-papeterie': ['Grenat Papeterie', '#7a1f3d', null, ['foncée', null], ['sombre', 'moyen']],
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

  test(`${nom} : npm run contraste -- --marque sort 0`, () => {
    assert.ok(existsSync(join(dir, 'entree.json')));
    const r = spawnSync(process.execPath, ['src/cli/contraste.js', '--marque', dir], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /0 paire en échec/);
  });
}
