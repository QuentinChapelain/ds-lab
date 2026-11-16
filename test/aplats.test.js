// @ts-check
/**
 * aplats et titres de marque (docs/attendus/etape-4-contrat-de-marque.md, complément).
 *
 * Attendus écrits à la main avant le code (15/11/2026). Valeurs lues dans les jetons ; contrastes culori wcagContrast,
 * commande : node --input-type=module -e (wcagContrast du pas 9, 10, 11 du primaire sur fond.app #fbfbfb,
 * fond.surface #ffffff, fond.discret #f8f8f7 et le pas 3 du primaire).
 *   Rôles ajoutés (9), et leur valeur chez Orbe Café :
 *     fond.marque.discret → marque.primaire.3 (#f1f3f7) ; fond.accent.discret → marque.accent.3 (#fcf1ef) ;
 *     fond.marque.fort → marque.primaire.plein (#2b4c7e) ; texte.sur-marque → marque.primaire.sur-plein (#ffffff) ;
 *     texte.marque.grand → marque.primaire.texte-grand (#2b4c7e, pas 9 : 7,7544 au plus bas) ;
 *     fond.interactif.inverse → marque.primaire.sur-plein (#ffffff) ;
 *     texte.sur-interactif.inverse → marque.primaire.plein (#2b4c7e) ;
 *     texte.sur-interactif.inverse.survol → marque.primaire.plein-survol (#3c5a88) ;
 *     bordure.focus.inverse → marque.primaire.sur-plein (#ffffff).
 *   texte-grand : Orbe Café pas 9 ; Atelier Lavandine pas 9 (4,5091) ; Écume et Sel pas 11 (9 : 1,4007,
 *     10 : 1,6485, 11 : 5,0277) ; Grenat Papeterie pas 9 (9,0322).
 *   Orbe Café : marque.tokens.json, l'emplacement texte-grand retiré, redevient identique octet par octet
 *     (empreinte 2abaca33…, test/saisie.test.js).
 *   Paires : les 48 d'origine, inchangées et en tête, puis 18 ajoutées (66) ; seuil grand-texte 3 ; 4 interdites
 *     ajoutées sur fond.marque.fort (8). Les quatre marques fictives : 0 paire en échec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadRoles, resolveRoles, contratRoles } from '../src/tokens/roles.js';
import { serialiser } from '../src/tokens/saisie.js';
import { AJOUTS, PAIRES_AJOUTEES, INTERDITES_AJOUTEES } from './helpers/roles-ajoutes.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ d, /** @type {string} */ f) => JSON.parse(readFileSync(join(d, f), 'utf8'));

test('Orbe Café : les 9 rôles ajoutés, en alias vers la couche marque, et leurs valeurs', () => {
  const set = loadRoles(DIR);
  const roles = resolveRoles(set.semantique, set.primitives, set.marque);
  for (const [role, [slot, hex]] of Object.entries(AJOUTS)) {
    assert.equal(roles.get(role)?.alias, `{${slot}}`, role);
    assert.equal(roles.get(role)?.hex, hex, role);
  }
  assert.equal(roles.size, 51);
});

test('fond.accent.fort : petites surfaces, comme une étiquette', () => {
  assert.match(charger('semantique.tokens.json').fond.accent.fort.$description, /[Pp]etites surfaces, comme une étiquette/);
});

test('texte-grand choisi à la saisie : pas 9, 10 ou 11', () => {
  const pas = { 'orbe-cafe': '{couleur.bleu.9}', 'atelier-lavandine': '{couleur.primaire.9}', 'ecume-et-sel': '{couleur.primaire.11}', 'grenat-papeterie': '{couleur.primaire.9}' };
  for (const [slug, ref] of Object.entries(pas)) assert.equal(load(join(ROOT, 'tokens', slug), 'marque.tokens.json').marque.primaire['texte-grand'].$value, ref, slug);
});

test('Orbe Café : sans l\'emplacement texte-grand, la couche marque redevient identique octet par octet', () => {
  const m = load(DIR, 'marque.tokens.json');
  delete m.marque.primaire['texte-grand'];
  assert.equal(createHash('sha256').update(serialiser(m)).digest('hex'), '2abaca339a3b57ac84a9bf999bee8814e9c1c2bb9b556a401b855353ca0d0a73');
});

test('paires.json : 48 paires d\'origine en tête, 18 ajoutées, 4 interdites ajoutées', () => {
  const p = charger('paires.json');
  assert.equal(p.seuils['grand-texte'], 3);
  assert.equal(p.paires.length, 70, '+ 4 bordures de statut sur fond.surface');
  assert.deepEqual(p.paires.slice(48, 66).map((/** @type {any} */ x) => [x.devant, x.fond, x.type]), PAIRES_AJOUTEES);
  assert.equal(p.interdites.length, 8);
  assert.deepEqual(p.interdites.slice(4).map((/** @type {any} */ x) => [x.devant, x.fond]), INTERDITES_AJOUTEES.map((d) => [d, 'fond.marque.fort']));
  for (const x of p.interdites.slice(4)) assert.ok(x.regle.length > 10, x.devant);
});

test('les quatre marques fictives : 0 paire en échec, 70 paires, 8 interdites', () => {
  for (const slug of ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie']) {
    const d = join(ROOT, 'tokens', slug);
    // Le jeu de chaque marque, lu par son resolver (avant : rôles et primitives d'Orbe Café
    // pour les quatre, couche marque et échelles fusionnées à la main).
    const c = contratRoles(loadRoles(d));
    assert.equal(c.pairs.length, 70, slug);
    assert.deepEqual(c.fails, [], slug);
    assert.equal(c.interdites.length, 8, slug);
  }
});
