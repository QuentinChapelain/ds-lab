// @ts-check
/**
 * Rôles d'espacement par relation dans la couche sémantique d'Orbe Café
 * (tokens/orbe-cafe/semantique.tokens.json, DTCG 2025.10), et filtre de type dans resolveRoles.
 *
 * Attendu écrit à la main avant le code, du 15/11/2026 :
 *   cinq rôles, $type dimension, alias seulement vers espace.* (primitives.tokens.json) :
 *     ecart.dans-composant → {espace.4}, ecart.entre-composants → {espace.16},
 *     ecart.entre-groupes → {espace.24}, ecart.section → {espace.48},
 *     marge-interieure.composant → {espace.16} ;
 *   puis un sixième, du bouton (18/11/2026, docs/attendus/bouton.md) : ecart.icone-texte → {espace.8} ;
 *   puis deux de l'étiquette (19/11/2026, docs/attendus/avatar-etiquette.md) : ecart.entre-etiquettes → {espace.8},
 *     marge-interieure.etiquette → {espace.12}, hors contrôle d'ordre ;
 *   puis un de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : ecart.entre-blocs → {espace.8}, hors contrôle
 *     d'ordre ;
 *   chaque cible existe dans primitives.tokens.json et y est de type dimension ;
 *   une phrase d'usage chacun (majuscule, point final, une seule phrase) ;
 *   la description racine du fichier parle des espacements et garde « DTCG 2025.10 » ;
 *   resolveRoles ne garde que les jetons de type color (type hérité du groupe le plus proche) :
 *     un rôle de type dimension dans semantique.tokens.json ne le casse pas, et le compte reste
 *     à 42 rôles de couleur (plus les ajouts de helpers/roles-ajoutes.js), aucun sous ecart.* ni marge-interieure.* ;
 *   un jeton sans aucun $type reste traité comme avant (couleur attendue, erreur si illisible) ;
 *   ecart.section garde 48 px et porte sa valeur en étroit dans
 *     $extensions["ds-lab.etroit"] = { valeur: "{espace.32}", sous: 600 px, seuil: "[H]" } ;
 *     aucun autre rôle n'en porte ; ecart.dans-composant reste à {espace.4}.
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
  'ecart.dans-composant': '{espace.4}',
  'ecart.entre-composants': '{espace.16}',
  'ecart.entre-groupes': '{espace.24}',
  'ecart.section': '{espace.48}',
  'ecart.icone-texte': '{espace.8}',
  'marge-interieure.composant': '{espace.16}',
  // Écart et marge de l'étiquette (docs/attendus/avatar-etiquette.md), hors contrôle d'ordre.
  'ecart.entre-etiquettes': '{espace.8}',
  'marge-interieure.etiquette': '{espace.12}',
  // Écart entre l'en-tête d'une DsCard à sous-titre et son contenu (docs/attendus/carte-membre-liste.md), hors contrôle d'ordre.
  'ecart.entre-blocs': '{espace.8}',
});

const sem = load('semantique.tokens.json');
const prims = load('primitives.tokens.json');
/** @param {any} node @param {string} path */
const at = (node, path) => path.split('.').reduce((n, k) => n?.[k], node);

test('neuf rôles d\'espacement, alias vers espace.*, type dimension', () => {
  assert.deepEqual(Object.keys(sem.ecart).filter((k) => !k.startsWith('$')).sort(), ['dans-composant', 'entre-blocs', 'entre-composants', 'entre-etiquettes', 'entre-groupes', 'icone-texte', 'section']);
  assert.deepEqual(Object.keys(sem['marge-interieure']).filter((k) => !k.startsWith('$')), ['composant', 'etiquette']);
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

test('une phrase d\'usage par rôle d\'espacement', () => {
  for (const role of Object.keys(EXPECTED)) {
    const d = at(sem, role).$description;
    assert.ok(typeof d === 'string' && d.length > 10, `${role} : description`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${role} : majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${role} : une seule phrase`);
  }
});

test('ecart.section a sa valeur en étroit (32 px) dans le contexte étroit, lui seul ; aucune extension dans les rôles', () => {
  const etroit = charger('largeur.etroit.tokens.json');
  assert.equal(etroit.ecart.section.$value, '{espace.32}');
  assert.deepEqual(Object.keys(etroit.ecart).filter((k) => !k.startsWith('$')), ['section']);
  assert.equal(etroit['marge-interieure'], undefined);
  assert.equal(sem.ecart.section.$value, '{espace.48}');
  assert.ok(prims.espace['32']?.$value, 'espace.32 existe');
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
  for (const r of roles.keys()) assert.match(r, /^(fond|texte|bordure)\./, r);
});

test('resolveRoles : type porté par le jeton ou hérité du groupe, jeton sans type inchangé', () => {
  const base = { couleur: { $type: 'color', blanc: { $value: '#ffffff' } }, espace: { $type: 'dimension', 4: { $value: { value: 4, unit: 'px' } } } };
  const s = {
    fond: { $type: 'color', app: { $value: '{couleur.blanc}' } },
    ecart: { $type: 'dimension', petit: { $value: '{espace.4}' } },
    divers: { large: { $type: 'dimension', $value: { value: 8, unit: 'px' } } },
  };
  assert.deepEqual([...resolveRoles(s, base).keys()], ['fond.app']);
  assert.throws(() => resolveRoles({ x: { $value: '{espace.4}' } }, base), /couleur illisible : espace\.4/);
});
