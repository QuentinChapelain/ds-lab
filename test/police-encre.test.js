// @ts-check
/**
 * Contrôle d'encre de la police des titres (docs/attendus/etape-4c-police-des-titres.md, réponse 3).
 * Attendus écrits à la main avant le code :
 *   E1 styles sur la police des titres, lus dans les jetons communs (D17) : taille / ligne / graisse, consigne 0,7 ;
 *      affichage.grand 60/76 et 36/48 ; affichage.moyen 48/60 et 30/40 ; titre.1 30/40 et 24/32 ; titre.2 24/32 et
 *      20/28 (700) ; titre.3 20/28 et 18/24 (600) ;
 *   E2 calcul sur des mesures écrites à la main (haut 1, bas 0,25, facteur 1) : encre de deux lignes 1,25 × 60 = 75 px ;
 *      ligne 76 → écart 1, accepté ; ligne 75 → écart 0, refusé ; ligne 72 → écart −3, refusé ; capitale obtenue
 *      0,7 × 60 = 42 ; dépassement montré (hhea 1 000 et −300 sur 1 000) 1,3 × 60 − 76 = 2 px ;
 *   E3 mesures dans Chromium, lues dans les pixels du tracé (D32), contre fontTools 4.60.2 (local/outils/fonttools),
 *      en em, à 0,002 près. La référence est le contour exact, BoundsPen, sur une instance de l'axe wght
 *      (instantiateVariableFont) ; plus haut et plus bas sur le jeu de caractères, H pour la capitale :
 *        Oswald      600 haut 1,0710 bas 0,2681 H 0,8100 ; 700 haut 1,0750 bas 0,2770 H 0,8100
 *        EB Garamond 600 haut 0,8453 bas 0,2895 H 0,6541 ; 700 haut 0,8490 bas 0,2892 H 0,6546
 *        Cinzel      600 haut 0,9243 bas 0,2648 H 0,7000 ; 700 haut 0,9354 bas 0,2783 H 0,7000
 *      Facteur calculé depuis le fichier, sans navigateur (D32) : 0,7 × unités par em ÷ sCapHeight d'OS/2, exact :
 *      Oswald 700/810, EB Garamond 700/650, Cinzel 700/700 ;
 *   E4 avec les lignes de D17, les trois polices passent (écart le plus petit : EB Garamond, affichage.moyen en large,
 *      60 − (0,8490 + 0,2892) × 1,0769 × 48 = 1,16 px sur le contour de fontTools ; 1,07 px mesuré sur macOS, 1,12 px
 *      sous Linux, au pixel près de la lecture) ; avec les lignes d'avant D17 (68/40, 56/36, 36 en large pour titre.1),
 *      refus : Oswald affichage.grand large et étroit, affichage.moyen large (56 − 56,08) ; EB Garamond et Cinzel,
 *      les mêmes plus affichage.moyen étroit et titre.1 large ;
 *   E5 la commande accepte Oswald et affiche dix lignes d'encre ; elle refuse Bebas Neue sur ses graisses sans
 *      contrôle d'encre (G7) ;
 *   E6 une encre qui touche le bord du cadre de mesure est une panne, pas une mesure : avec un cadre réduit à 0,5 em
 *      de part et d'autre de la ligne de base, Oswald (haut 1,07 em) le touche ; l'erreur n'est pas un refus.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lirePolice } from '../src/polices/lecture.js';
import { mesurerEncre, lignesEncre, motifsEncre, PoliceRefusee } from '../src/polices/encre.js';
import { chargerCommun, stylesTitres, controlerEncre } from '../src/tokens/saisie.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POLICES = join(ROOT, 'fixtures', 'polices');
const FICHIERS = {
  Oswald: 'oswald/oswald-latin-wght-normal.woff2',
  'EB Garamond': 'eb-garamond/eb-garamond-latin-wght-normal.woff2',
  Cinzel: 'cinzel/cinzel-latin-wght-normal.woff2',
};
/** @param {string} f */
const policeTitre = (f) => ({ familles: ['Essai'], controlee: true, fichiers: [{ chemin: f, police: lirePolice(readFileSync(join(POLICES, f))) }] });

/** @param {string} style @param {'large' | 'étroit'} largeur @param {number} taille @param {number} ligne @param {number} [graisse] */
const st = (style, largeur, taille, ligne, graisse = 700) => ({ style, largeur, taille, ligne, graisse, consigne: 0.7 });

test('E1 styles sur la police des titres, en large et en étroit', () => {
  assert.deepEqual(stylesTitres(chargerCommun()), [
    st('affichage.grand', 'large', 60, 76), st('affichage.grand', 'étroit', 36, 48),
    st('affichage.moyen', 'large', 48, 60), st('affichage.moyen', 'étroit', 30, 40),
    st('titre.1', 'large', 30, 40), st('titre.1', 'étroit', 24, 32),
    st('titre.2', 'large', 24, 32), st('titre.2', 'étroit', 20, 28),
    st('titre.3', 'large', 20, 28, 600), st('titre.3', 'étroit', 18, 24, 600),
  ]);
});

test('E2 encre de deux lignes : écart nul ou négatif refusé', () => {
  const m = { 700: { haut: 1, hautCar: 'É', bas: 0.25, basCar: 'g', capitale: 0.7, facteur: 1 } };
  const l = lignesEncre(m, [st('affichage.grand', 'large', 60, 76), st('affichage.grand', 'large', 60, 75), st('affichage.grand', 'étroit', 60, 72)], { ascendante: 1000, descendante: -300, unitesParEm: 1000 });
  assert.deepEqual(l.map((x) => [x.encre, x.ecart, x.touche, x.capitale, x.visee]), [[75, 1, false, 42, 42], [75, 0, true, 42, 42], [75, -3, true, 42, 42]]);
  assert.ok(Math.abs(/** @type {number} */ (l[0].depassement) - 2) < 1e-9);
  assert.deepEqual(motifsEncre(l), [
    'encre de deux lignes qui se touche : affichage.grand en large (ligne 75,0 px, encre 75,0 px, É sur g)',
    'encre de deux lignes qui se touche : affichage.grand en étroit (ligne 72,0 px, encre 75,0 px, É sur g)',
  ]);
});

test('E3 mesures dans Chromium, contre fontTools', async () => {
  /** @type {Record<string, Record<number, [number, number, number]>>} haut, bas, H du contour, par graisse */
  const attendu = {
    Oswald: { 600: [1.071, 0.2681, 0.81], 700: [1.075, 0.277, 0.81] },
    'EB Garamond': { 600: [0.8453, 0.2895, 0.6541], 700: [0.849, 0.2892, 0.6546] },
    Cinzel: { 600: [0.9243, 0.2648, 0.7], 700: [0.9354, 0.2783, 0.7] },
  };
  /** @type {Record<string, number>} sCapHeight sur 1 000 unités par em */
  const capitale = { Oswald: 810, 'EB Garamond': 650, Cinzel: 700 };
  // Toutes les valeurs dans le message : une seule mesure fausse ne cache pas les autres.
  const lignes = [];
  let fautes = 0;
  for (const [nom, f] of Object.entries(FICHIERS)) {
    const p = /** @type {import('../src/polices/lecture.js').Police} */ (lirePolice(readFileSync(join(POLICES, f))));
    const m = await mesurerEncre([{ octets: readFileSync(join(POLICES, f)), graisses: p.graisses }], [600, 700], 0.7);
    for (const g of [600, 700]) {
      const [h, b, H] = attendu[nom][g];
      for (const [obtenu, voulu, quoi] of /** @type {[number, number, string][]} */ ([[m[g].haut, h, 'haut'], [m[g].bas, b, 'bas'], [m[g].capitale, H, 'H']])) {
        const ok = Math.abs(obtenu - voulu) <= 0.002;
        if (!ok) fautes++;
        lignes.push(`${nom} ${g} ${quoi} : ${obtenu} pour ${voulu}${ok ? '' : ' ✗'}`);
      }
      const facteur = (0.7 * 1000) / capitale[nom];
      const ok = Math.abs(m[g].facteur - facteur) < 1e-9;
      if (!ok) fautes++;
      lignes.push(`${nom} ${g} facteur : ${m[g].facteur} pour ${facteur}${ok ? '' : ' ✗'}`);
    }
  }
  assert.equal(fautes, 0, `${fautes} mesure(s) hors tolérance :\n${lignes.join('\n')}`);
});

test('E4 lignes de D17 : les trois passent ; lignes d\'avant D17 : refus', async () => {
  const etape3 = stylesTitres(chargerCommun()).map((s) => {
    const avant = /** @type {Record<string, number>} */ ({ 'affichage.grand large': 68, 'affichage.grand étroit': 40, 'affichage.moyen large': 56, 'affichage.moyen étroit': 36, 'titre.1 large': 36 })[`${s.style} ${s.largeur}`];
    return avant ? { ...s, ligne: avant } : s;
  });
  const touches = (/** @type {string[]} */ motifs) => motifs.map((m) => /se touche : (\S+ en \S+)/.exec(m)?.[1]);
  const trois = ['affichage.grand en large', 'affichage.grand en étroit', 'affichage.moyen en large'];
  const cinq = [...trois, 'affichage.moyen en étroit', 'titre.1 en large'];
  for (const [nom, f] of Object.entries(FICHIERS)) {
    const ok = await controlerEncre(policeTitre(f), { dossier: POLICES });
    assert.deepEqual(ok.motifs, [], nom);
    assert.equal(ok.lignes.length, 10, nom);
    if (nom === 'EB Garamond') {
      const min = Math.min(...ok.lignes.map((l) => l.ecart));
      assert.equal(ok.lignes.find((l) => l.ecart === min)?.style, 'affichage.moyen');
      assert.ok(min > 0.9 && min < 1.2, `écart le plus petit ${min}`);
    }
    const refus = await controlerEncre(policeTitre(f), { dossier: POLICES, styles: etape3 });
    assert.deepEqual(touches(refus.motifs), nom === 'Oswald' ? trois : cinq, nom);
    assert.ok(refus.motifs.every((m) => m.startsWith('police des titres : encre de deux lignes qui se touche : ')));
  }
});

test('E5 la commande accepte Oswald et affiche l\'encre de deux lignes', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'ds-lab-encre-'));
  writeFileSync(join(dossier, 'entree.json'), JSON.stringify({ nom: 'Essai', primaire: '#8a4fd8', polices: { titre: { familles: ['Oswald'], fichiers: [join(POLICES, FICHIERS.Oswald)] } } }));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'saisie.js'), join(dossier, 'entree.json')], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr + r.stdout);
  assert.match(r.stdout, /police des titres : Oswald, contrôlée\n/);
  assert.match(r.stdout, /encre de deux lignes, consigne de hauteur de capitale 0,7 \(aucun écart nul ou négatif\) :\n/);
  assert.equal(r.stdout.match(/^ {2}(affichage|titre)\.\S+ +(large|étroit) +taille .* écart \d+,\d px/gm)?.length, 10);
});

test('E6 une encre qui touche le bord du cadre de mesure est une panne', async () => {
  const octets = readFileSync(join(POLICES, FICHIERS.Oswald));
  const p = /** @type {import('../src/polices/lecture.js').Police} */ (lirePolice(octets));
  await assert.rejects(
    mesurerEncre([{ octets, graisses: p.graisses }], [700], 0.7, { cadre: 0.5 }),
    (/** @type {any} */ e) => !(e instanceof PoliceRefusee) && /bord du cadre de mesure/.test(e.message),
  );
});
