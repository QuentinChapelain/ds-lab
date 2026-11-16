// @ts-check
/**
 * Lecteur de resolver DTCG 2025.10 et resolvers des marques (docs/attendus/etape-4b-contextes.md).
 * Attendus écrits à la main avant le code :
 *   R1 chaque marque fictive a tokens/<marque>/marque.resolver.json, version "2025.10" ; jeux primitives, marque, roles ;
 *      modificateurs mode (clair, sombre ; défaut clair) et largeur (large, etroit ; défaut large) ; seuil de l'étroit
 *      600 px [H] dans $extensions["ds-lab.largeur"] ; ordre primitives, marque, roles, mode, largeur ;
 *   R2 le resolver écrit est celui que la saisie produit (pas de dérive) ;
 *   R3 Orbe Café en large : les rôles résolus sont tokens/commun/semantique.tokens.json tel quel ; en étroit,
 *      ecart.section = {espace.32}, titre.1 = taille-texte.24 et interligne 1,3333, le reste égal au large ;
 *   R4 fusion : le dernier jeton gagne en entier (un composite n'est pas fusionné champ par champ), un groupe garde
 *      l'ordre de première apparition ;
 *   R5 refus : version autre que 2025.10, modificateur ou contexte inconnu, modificateur sans entrée ni défaut.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lireResolver, resoudre, fusionner, partager, RESOLVER, COMMUN } from '../src/tokens/resolver.js';
import { saisir, serialiser } from '../src/tokens/saisie.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie'];
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const ref = (/** @type {string} */ r) => ({ $ref: r });

test('R1 resolver de chaque marque fictive : version, jeux, modificateurs, seuil, ordre', () => {
  for (const m of MARQUES) {
    const r = lire(join(ROOT, 'tokens', m, RESOLVER));
    assert.equal(r.version, '2025.10', m);
    assert.deepEqual(Object.keys(r.sets), ['primitives', 'marque', 'roles'], m);
    assert.deepEqual(r.sets.primitives.sources, [ref('../commun/primitives.tokens.json'), ref('../commun/statuts.tokens.json')], m);
    assert.deepEqual(r.sets.roles.sources, [ref('../commun/semantique.tokens.json')], m);
    assert.deepEqual(r.sets.marque.sources, [ref('../commun/aplat.tokens.json'), ref('../commun/police.tokens.json'), ref(m === 'orbe-cafe' ? 'primitives.tokens.json' : 'echelles.tokens.json'), ref('marque.tokens.json')], m);
    assert.deepEqual(r.modifiers.mode.contexts, { clair: [], sombre: [ref('../commun/mode.sombre.tokens.json'), ref('echelles.sombre.tokens.json'), ref('marque.sombre.tokens.json')] }, m);
    assert.equal(r.modifiers.mode.default, 'clair', m);
    assert.deepEqual(r.modifiers.largeur.contexts, { large: [], etroit: [ref('../commun/largeur.etroit.tokens.json')] }, m);
    assert.equal(r.modifiers.largeur.default, 'large', m);
    assert.deepEqual(r.modifiers.largeur.$extensions, { 'ds-lab.largeur': { etroit: { sous: { value: 600, unit: 'px' }, seuil: '[H]' } } }, m);
    assert.deepEqual(r.resolutionOrder, ['#/sets/primitives', '#/sets/marque', '#/sets/roles', '#/modifiers/mode', '#/modifiers/largeur'].map(ref), m);
  }
});

test('R2 resolver écrit = resolver produit par la saisie', () => {
  for (const m of MARQUES) {
    const dossier = join(ROOT, 'tokens', m);
    const r = saisir(lire(join(dossier, 'entree.json')), { dossier });
    assert.deepEqual(r.motifs, [], m);
    assert.equal(serialiser(r.resolver), readFileSync(join(dossier, RESOLVER), 'utf8'), m);
  }
});

test('R3 Orbe Café : rôles en large = semantique.tokens.json ; en étroit, section et grands textes seulement', () => {
  const chemin = join(ROOT, 'tokens', 'orbe-cafe', RESOLVER);
  const sem = lire(join(COMMUN, 'semantique.tokens.json'));
  const large = partager(lireResolver(chemin));
  const { $description, ...rolesFichier } = sem;
  assert.deepEqual(large.semantique, rolesFichier);
  assert.deepEqual(partager(lireResolver(chemin, { largeur: 'large', mode: 'clair' })).semantique, rolesFichier);
  const etroit = partager(lireResolver(chemin, { largeur: 'etroit' })).semantique;
  assert.equal(etroit.ecart.section.$value, '{espace.32}');
  assert.equal(etroit.typo.titre['1'].$value.fontSize, '{taille-texte.24}');
  assert.equal(etroit.typo.titre['1'].$value.lineHeight, 1.3333);
  assert.equal(etroit.typo.titre['1'].$value.fontFamily, '{marque.police.titre}');
  const changes = [];
  for (const g of Object.keys(sem)) if (!g.startsWith('$')) for (const [k, v] of Object.entries(sem[g])) {
    if (k.startsWith('$')) continue;
    const walk = (/** @type {any} */ a, /** @type {any} */ b, /** @type {string} */ p) => {
      if ('$value' in a) { if (JSON.stringify(a) !== JSON.stringify(b)) changes.push(p); return; }
      for (const c of Object.keys(a)) if (!c.startsWith('$')) walk(a[c], b[c], `${p}.${c}`);
    };
    walk(v, etroit[g][k], `${g}.${k}`);
  }
  assert.deepEqual(changes, ['ecart.section', 'typo.affichage.grand', 'typo.affichage.moyen', 'typo.titre.1', 'typo.titre.2', 'typo.titre.3']);
});

test('R4 fusion : jeton remplacé en entier, groupe fusionné dans l\'ordre de première apparition', () => {
  const a = { g: { $type: 'typography', x: { $value: { fontSize: '1', lineHeight: 1 } }, y: { $value: '{a}' } } };
  const b = { g: { x: { $value: { fontSize: '2' } }, z: { $value: '{b}' } } };
  const r = fusionner(fusionner({}, a), b);
  assert.deepEqual(r.g.x, { $value: { fontSize: '2' } });
  assert.deepEqual(Object.keys(r.g), ['$type', 'x', 'y', 'z']);
  assert.deepEqual(a.g.x.$value, { fontSize: '1', lineHeight: 1 }, 'les sources ne sont pas modifiées');
});

test('R5 refus : version, modificateur ou contexte inconnu, modificateur sans entrée ni défaut', () => {
  const base = { version: '2025.10', sets: { s: { sources: [{ a: { $value: 1 } }] } }, modifiers: { m: { contexts: { un: [], deux: [{ a: { $value: 2 } }] }, default: 'un' } }, resolutionOrder: [ref('#/sets/s'), ref('#/modifiers/m')] };
  assert.equal(resoudre(base, ROOT).jetons.a.$value, 1);
  assert.equal(resoudre(base, ROOT, { m: 'deux' }).jetons.a.$value, 2);
  assert.throws(() => resoudre({ ...base, version: '2025.07' }, ROOT), /version 2025\.10 attendue/);
  assert.throws(() => resoudre(base, ROOT, { x: 'un' }), /modificateur inconnu x/);
  assert.throws(() => resoudre(base, ROOT, { m: 'trois' }), /contexte inconnu m=trois/);
  const sansDefaut = structuredClone(base);
  delete sansDefaut.modifiers.m.default;
  assert.throws(() => resoudre(sansDefaut, ROOT), /sans entrée ni défaut/);
});
