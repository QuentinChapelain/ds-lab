// @ts-check
/**
 * Séance 3c, lot 1 : rôles d'espacement par relation dans la couche sémantique d'Orbe Café
 * (tokens/orbe-cafe/semantique.tokens.json, DTCG 2025.10), et filtre de type dans resolveRoles.
 *
 * Attendu écrit à la main avant le code, d'après la séance 3c du 15/11/2026 :
 *   cinq rôles, $type dimension, alias seulement vers espace.* (primitives.tokens.json) :
 *     ecart.dans-composant → {espace.4}, ecart.entre-composants → {espace.16},
 *     ecart.entre-groupes → {espace.24}, ecart.section → {espace.48},
 *     marge-interieure.composant → {espace.16} ;
 *   chaque cible existe dans primitives.tokens.json et y est de type dimension ;
 *   une phrase d'usage chacun (majuscule, point final, une seule phrase) ;
 *   la description racine du fichier parle des espacements et garde « DTCG 2025.10 » ;
 *   resolveRoles ne garde que les jetons de type color (type hérité du groupe le plus proche) :
 *     un rôle de type dimension dans semantique.tokens.json ne le casse pas, et le compte reste
 *     à 42 rôles de couleur, aucun sous ecart.* ni marge-interieure.* ;
 *   un jeton sans aucun $type reste traité comme avant (couleur attendue, erreur si illisible) ;
 *   lot 4 (décision du 15/11/2026) : ecart.section garde 48 px et porte sa valeur en étroit dans
 *     $extensions["ds-lab.etroit"] = { valeur: "{espace.32}", sous: 600 px, seuil: "[H]" } ;
 *     aucun autre rôle n'en porte ; ecart.dans-composant reste à {espace.4}.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { resolveRoles } from '../src/tokens/roles.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

const EXPECTED = /** @type {Record<string, string>} */ ({
  'ecart.dans-composant': '{espace.4}',
  'ecart.entre-composants': '{espace.16}',
  'ecart.entre-groupes': '{espace.24}',
  'ecart.section': '{espace.48}',
  'marge-interieure.composant': '{espace.16}',
});

const sem = load('semantique.tokens.json');
const prims = load('primitives.tokens.json');
/** @param {any} node @param {string} path */
const at = (node, path) => path.split('.').reduce((n, k) => n?.[k], node);

test('3c cinq rôles d\'espacement, alias vers espace.*, type dimension', () => {
  assert.deepEqual(Object.keys(sem.ecart).filter((k) => !k.startsWith('$')).sort(), ['dans-composant', 'entre-composants', 'entre-groupes', 'section']);
  assert.deepEqual(Object.keys(sem['marge-interieure']).filter((k) => !k.startsWith('$')), ['composant']);
  for (const [role, alias] of Object.entries(EXPECTED)) {
    const t = at(sem, role);
    assert.equal(t.$value, alias, role);
    const group = sem[role.split('.')[0]];
    assert.equal(t.$type ?? group.$type, 'dimension', `${role} : type`);
    const cible = alias.slice(1, -1);
    assert.ok(at(prims, cible)?.$value, `${role} : ${cible} existe dans primitives`);
    assert.equal(prims.espace.$type, 'dimension', `${cible} : type dimension`);
  }
});

test('3c une phrase d\'usage par rôle d\'espacement', () => {
  for (const role of Object.keys(EXPECTED)) {
    const d = at(sem, role).$description;
    assert.ok(typeof d === 'string' && d.length > 10, `${role} : description`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${role} : majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${role} : une seule phrase`);
  }
});

test('3c lot 4 : ecart.section porte sa valeur en étroit (32 px sous 600 px, seuil [H]), lui seul', () => {
  assert.deepEqual(sem.ecart.section.$extensions, {
    'ds-lab.etroit': { valeur: '{espace.32}', sous: { value: 600, unit: 'px' }, seuil: '[H]' },
  });
  assert.equal(sem.ecart.section.$value, '{espace.48}');
  assert.ok(prims.espace['32']?.$value, 'espace.32 existe');
  for (const role of Object.keys(EXPECTED)) if (role !== 'ecart.section') assert.equal(at(sem, role).$extensions, undefined, role);
});

test('3c description racine : espacements, DTCG 2025.10', () => {
  assert.match(sem.$description, /DTCG 2025\.10/);
  assert.match(sem.$description, /espacement/i);
});

test('3c resolveRoles : un rôle de type dimension ne le casse pas, 51 rôles de couleur (étape 4a, lot 5 : 42 + 9 rôles ajoutés)', () => {
  const roles = resolveRoles(sem, prims, load('statuts.tokens.json'), load('marque.tokens.json'));
  assert.equal(roles.size, 51);
  for (const r of roles.keys()) assert.match(r, /^(fond|texte|bordure)\./, r);
});

test('3c resolveRoles : type porté par le jeton ou hérité du groupe, jeton sans type inchangé', () => {
  const base = { couleur: { $type: 'color', blanc: { $value: '#ffffff' } }, espace: { $type: 'dimension', 4: { $value: { value: 4, unit: 'px' } } } };
  const s = {
    fond: { $type: 'color', app: { $value: '{couleur.blanc}' } },
    ecart: { $type: 'dimension', petit: { $value: '{espace.4}' } },
    divers: { large: { $type: 'dimension', $value: { value: 8, unit: 'px' } } },
  };
  assert.deepEqual([...resolveRoles(s, base).keys()], ['fond.app']);
  assert.throws(() => resolveRoles({ x: { $value: '{espace.4}' } }, base), /couleur illisible : espace\.4/);
});
