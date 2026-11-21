// @ts-check
/**
 * aplats et titres de marque (docs/attendus/etape-4-contrat-de-marque.md, complément).
 *
 * Attendus écrits à la main avant le code (15/11/2026). Valeurs lues dans les jetons ; contrastes culori wcagContrast,
 * commande : node --input-type=module -e (wcagContrast du pas 9, 10, 11 du primaire sur background.app #fbfbfb,
 * background.surface #ffffff, background.subtle #f8f8f7 et le pas 3 du primaire).
 *   Rôles ajoutés (9), et leur valeur chez Orbe Café :
 *     background.brand.subtle → brand.primary.3 (#f1f3f7) ; background.accent.subtle → brand.accent.3 (#fcf1ef) ;
 *     background.brand.strong → brand.primary.solid (#2b4c7e) ; text.on-brand → brand.primary.on-solid (#ffffff) ;
 *     text.brand.large → brand.primary.text-large (#2b4c7e, pas 9 : 7,7544 au plus bas) ;
 *     background.interactive.inverse → brand.primary.on-solid (#ffffff) ;
 *     text.on-interactive.inverse → brand.primary.solid (#2b4c7e) ;
 *     text.on-interactive.inverse.hover → brand.primary.solid-hover (#3c5a88) ;
 *     border.focus.inverse → brand.primary.on-solid (#ffffff).
 *   texte-grand : Orbe Café pas 9 ; Atelier Lavandine pas 9 (4,5091) ; Écume et Sel pas 11 (9 : 1,4007,
 *     10 : 1,6485, 11 : 5,0277) ; Grenat Papeterie pas 9 (9,0322) ; Maison Alberto (18/11/2026, même commande) pas 11
 *     (9 : 2,4733 ; 10 : 2,798 ; 11 : 5,0671, au plus bas des quatre fonds).
 *   Orbe Café : marque.tokens.json, l'emplacement texte-grand retiré, redevient identique octet par octet
 *     (empreinte 2abaca33…, test/saisie.test.js).
 *   Paires : les 48 d'origine, inchangées et en tête, puis 18 ajoutées (66) ; seuil grand-texte 3 ; 4 interdites
 *     ajoutées sur background.brand.strong (8). Les cinq marques fictives : 0 paire en échec.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadRoles, resolveRoles, contratRoles } from '../src/tokens/roles.js';
import { serialiser } from '../src/tokens/saisie.js';
import { AJOUTS, PAIRES_AJOUTEES, INTERDITES_AJOUTEES, PAIRES_BOUTON, PAIRES_AVATAR, N_ROLES, N_PAIRES } from './helpers/roles-ajoutes.js';
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
  assert.equal(roles.size, N_ROLES, 'plus les rôles du bouton (helpers/roles-ajoutes.js)');
});

test('background.accent.strong : petites surfaces, comme une étiquette', () => {
  assert.match(charger('semantique.tokens.json').background.accent.strong.$description, /[Pp]etites surfaces, comme une étiquette/);
});

test('text-large choisi à la saisie : pas 9, 10 ou 11', () => {
  const pas = { 'orbe-cafe': '{color.blue.9}', 'atelier-lavandine': '{color.primary.9}', 'ecume-et-sel': '{color.primary.11}', 'grenat-papeterie': '{color.primary.9}', 'maison-alberto': '{color.primary.11}' };
  for (const [slug, ref] of Object.entries(pas)) assert.equal(load(join(ROOT, 'tokens', slug), 'marque.tokens.json').brand.primary['text-large'].$value, ref, slug);
});

test('Orbe Café : sans l\'emplacement text-large, la couche marque redevient identique octet par octet', () => {
  const m = load(DIR, 'marque.tokens.json');
  delete m.brand.primary['text-large'];
  assert.equal(createHash('sha256').update(serialiser(m)).digest('hex'), 'fe878df65c88545d1c193e8a520071ee4ddbed409cdb8a80ea407a01cec7f8c9');
});

test('paires.json : 48 paires d\'origine en tête, 18 ajoutées, 4 interdites ajoutées', () => {
  const p = charger('paires.json');
  assert.equal(p.thresholds['large-text'], 3);
  assert.equal(p.pairs.length, N_PAIRES, '+ 4 bordures de statut sur background.surface, + les paires du bouton, de l\'avatar et de l\'étiquette');
  assert.deepEqual(p.pairs.slice(70, 73).map((/** @type {any} */ x) => [x.foreground, x.background, x.type]), PAIRES_BOUTON);
  assert.deepEqual(p.pairs.slice(73).map((/** @type {any} */ x) => [x.foreground, x.background, x.type]), PAIRES_AVATAR);
  assert.deepEqual(p.pairs.slice(48, 66).map((/** @type {any} */ x) => [x.foreground, x.background, x.type]), PAIRES_AJOUTEES);
  assert.equal(p.forbidden.length, 8);
  assert.deepEqual(p.forbidden.slice(4).map((/** @type {any} */ x) => [x.foreground, x.background]), INTERDITES_AJOUTEES.map((d) => [d, 'background.brand.strong']));
  for (const x of p.forbidden.slice(4)) assert.ok(x.rule.length > 10, x.foreground);
});

test('les cinq marques fictives : 0 paire en échec, toutes les paires, 8 interdites', () => {
  for (const slug of ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto']) {
    const d = join(ROOT, 'tokens', slug);
    // Le jeu de chaque marque, lu par son resolver (avant : rôles et primitives d'Orbe Café
    // pour chacune, couche marque et échelles fusionnées à la main).
    const c = contratRoles(loadRoles(d));
    assert.equal(c.pairs.length, N_PAIRES, slug);
    assert.deepEqual(c.fails, [], slug);
    assert.equal(c.interdites.length, 8, slug);
  }
});
