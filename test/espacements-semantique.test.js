// @ts-check
/**
 * Rôles d'espacement par relation dans la couche sémantique d'Orbe Café
 * (tokens/orbe-cafe/semantique.tokens.json, DTCG 2025.10), et filtre de type dans resolveRoles.
 *
 * Attendu écrit à la main avant le code, du 15/11/2026 :
 *   cinq rôles, $type dimension, alias seulement vers space.* (primitives.tokens.json) :
 *     gap.within-component → {space.4}, gap.between-components → {space.16},
 *     gap.between-groups → {space.24}, gap.section → {space.48},
 *     padding.component → {space.16} ;
 *   puis un sixième, du bouton (18/11/2026, docs/attendus/bouton.md) : gap.icon-text → {space.8} ;
 *   puis deux de l'étiquette (19/11/2026, docs/attendus/avatar-etiquette.md) : gap.between-tags → {space.8},
 *     padding.tag → {space.12}, hors contrôle d'ordre ;
 *   puis un de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : gap.between-blocks → {space.8}, hors contrôle
 *     d'ordre ;
 *   chaque cible existe dans primitives.tokens.json et y est de type dimension ;
 *   une phrase d'usage chacun (majuscule, point final, une seule phrase) ;
 *   la description racine du fichier parle des espacements et garde « DTCG 2025.10 » ;
 *   resolveRoles ne garde que les jetons de type color (type hérité du groupe le plus proche) :
 *     un rôle de type dimension dans semantique.tokens.json ne le casse pas, et le compte reste
 *     à 42 rôles de couleur (plus les ajouts de helpers/roles-ajoutes.js), aucun sous gap.* ni padding.* ;
 *   un jeton sans aucun $type reste traité comme avant (couleur attendue, erreur si illisible) ;
 *   gap.section garde 48 px et porte sa valeur en étroit dans
 *     $extensions["ds-lab.etroit"] = { valeur: "{space.32}", sous: 600 px, seuil: "[H]" } ;
 *     aucun autre rôle n'en porte ; gap.within-component reste à {space.4}.
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

const EXPECTED = /** @type {Record<string, string>} */ ({
  'gap.within-component': '{space.4}',
  'gap.between-components': '{space.16}',
  'gap.between-groups': '{space.24}',
  'gap.section': '{space.48}',
  'gap.icon-text': '{space.8}',
  'padding.component': '{space.16}',
  // Écart et marge de l'étiquette (docs/attendus/avatar-etiquette.md), hors contrôle d'ordre.
  'gap.between-tags': '{space.8}',
  'padding.tag': '{space.12}',
  // Écart entre l'en-tête d'une DsCard à sous-titre et son contenu (docs/attendus/carte-membre-liste.md), hors contrôle d'ordre.
  'gap.between-blocks': '{space.8}',
});

const sem = load('semantique.tokens.json');
const prims = load('primitives.tokens.json');
/** @param {any} node @param {string} path */
const at = (node, path) => path.split('.').reduce((n, k) => n?.[k], node);

test('neuf rôles d\'espacement, alias vers space.*, type dimension', () => {
  assert.deepEqual(Object.keys(sem.gap).filter((k) => !k.startsWith('$')).sort(), ['between-blocks', 'between-components', 'between-groups', 'between-tags', 'icon-text', 'section', 'within-component']);
  assert.deepEqual(Object.keys(sem.padding).filter((k) => !k.startsWith('$')), ['component', 'tag']);
  for (const [role, alias] of Object.entries(EXPECTED)) {
    const t = at(sem, role);
    assert.equal(t.$value, alias, role);
    const group = sem[role.split('.')[0]];
    assert.equal(t.$type ?? group.$type, 'dimension', `${role} : type`);
    const cible = alias.slice(1, -1);
    assert.ok(at(prims, cible)?.$value, `${role} : ${cible} existe dans primitives`);
    assert.equal(prims.space.$type, 'dimension', `${cible} : type dimension`);
  }
});

test('une phrase d\'usage par rôle d\'espacement', () => {
  for (const role of Object.keys(EXPECTED)) {
    const d = at(sem, role).$description;
    assert.ok(typeof d === 'string' && d.length > 10, `${role} : description`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${role} : majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${role} : une seule phrase`);
  }
});

test('gap.section a sa valeur en étroit (32 px) dans le contexte étroit, lui seul ; aucune extension dans les rôles', () => {
  const etroit = charger('largeur.etroit.tokens.json');
  assert.equal(etroit.gap.section.$value, '{space.32}');
  assert.deepEqual(Object.keys(etroit.gap).filter((k) => !k.startsWith('$')), ['section']);
  assert.equal(etroit.padding, undefined);
  assert.equal(sem.gap.section.$value, '{space.48}');
  assert.ok(prims.space['32']?.$value, 'space.32 existe');
  // Seule la note de l'équipe (ds-lab.note, DOC3, D57) est admise : aucune valeur en extension.
  for (const role of Object.keys(EXPECTED)) assert.deepEqual(Object.keys(at(sem, role).$extensions ?? {}).filter((k) => k !== 'ds-lab.note'), [], role);
});

test('description racine : espacements, DTCG 2025.10', () => {
  assert.match(sem.$description, /DTCG 2025\.10/);
  assert.match(sem.$description, /espacement/i);
});

test('resolveRoles : un rôle de type dimension ne le casse pas, rôles de couleur comptés par helpers/roles-ajoutes.js', () => {
  const roles = resolveRoles(sem, prims, load('statuts.tokens.json'), load('marque.tokens.json'));
  assert.equal(roles.size, N_ROLES);
  for (const r of roles.keys()) assert.match(r, /^(background|text|border)\./, r);
});

test('resolveRoles : type porté par le jeton ou hérité du groupe, jeton sans type inchangé', () => {
  const base = { color: { $type: 'color', white: { $value: '#ffffff' } }, space: { $type: 'dimension', 4: { $value: { value: 4, unit: 'px' } } } };
  const s = {
    background: { $type: 'color', app: { $value: '{color.white}' } },
    gap: { $type: 'dimension', small: { $value: '{space.4}' } },
    divers: { large: { $type: 'dimension', $value: { value: 8, unit: 'px' } } },
  };
  assert.deepEqual([...resolveRoles(s, base).keys()], ['background.app']);
  assert.throws(() => resolveRoles({ x: { $value: '{space.4}' } }, base), /couleur illisible : space\.4/);
});
