// @ts-check
/**
 * Séance 3a, T1 : couche sémantique de couleur d'Orbe Café (marque fictive),
 * tokens/orbe-cafe/semantique.tokens.json, DTCG 2025.10.
 *
 * Attendu écrit à la main avant le code, d'après l'attendu de la séance 3a et ses retouches du 14/11/2026 :
 *   nommage <propriété>.<sens>.<emphase>.<état>, texte sur plein en texte.sur-<sens> ;
 *   aucun nom ne cite une teinte (neutre, bleu, terre, sable) ni un pas ;
 *   primaire = bleu, accent = terre ; statuts = erreur, succes, avertissement, info ;
 *   bordure.<statut> → pas 8 (3:1), pas le pas 7 ; sa description dit « sur un fond de statut, décorative :
 *     le texte porte le sens ; un champ en erreur garde fond.app » (décision du 14/11/2026) ;
 *   bordure.discrete et bordure.defaut décoratives : « jamais seule pour repérer un champ ou un état » ;
 *   décisions du 14/11/2026 : bordure.focus → primaire 9 ; fond.accent.fort, fond.succes.fort et
 *     fond.info.fort → pas 10, avec texte blanc (texte.sur-accent, .sur-succes, .sur-info → couleur.blanc) ;
 *     avertissement inchangé ;
 *   décisions après T5 (14/11/2026) : fond.surface → couleur.blanc (cartes et champs) ;
 *     fond.inverse → neutre 12 et texte.sur-inverse → couleur.blanc ;
 *   étape 4b, réponse 1 : fond.surface → couleur.surface et texte.sur-inverse → couleur.sur-inverse, deux primitives
 *     blanches en clair, noires en sombre ;
 *   un rôle qui a des états (fond.composant, fond.interactif.fort) porte sa valeur de base en $root (DTCG 2025.10) ;
 *   alias seulement, aucune valeur en dur ; $description d'une phrase.
 *   séance 3b (15/11/2026), règle des pleins en trois cas, déclarée dans la couche marque : les pleins et
 *     leur texte passent par marque.<emplacement>.plein / .plein-survol / .sur-plein ; Orbe Café :
 *     primaire sombre (bleu 9, survol = bleu 9 + voile blanc 8 %, texte blanc), accent, erreur, succès et
 *     info moyens (pas 11, survol pas 12, texte blanc), avertissement clair (pas 9, survol pas 10, texte pas 12).
 *   décision du 15/11/2026 : bordure.focus → marque.primaire.11 pour toutes les marques ;
 *   séance 3c (15/11/2026) : le fichier porte aussi des rôles d'espacement (type dimension) ; les tests
 *     ci-dessous portent sur les rôles de type color, toujours 42.
 * Les alias sont résolus ici par un résolveur propre au test, indépendant du code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { AJOUTS } from './helpers/lot5.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = charger;

const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
/** Rôle → primitive visée (échelle.pas), ou « voile:<échelle.pas> » pour un survol calculé. 19 fonds, 15 textes, 8 bordures = 42. */
const EXPECTED = /** @type {Record<string, string>} */ ({
  'fond.app': 'neutre.1',
  'fond.discret': 'neutre.2',
  'fond.surface': 'surface',
  'fond.inverse': 'neutre.12',
  'fond.composant': 'neutre.3',
  'fond.composant.survol': 'neutre.4',
  'fond.composant.appui': 'neutre.5',
  'fond.interactif.discret': 'bleu.3',
  'fond.interactif.fort': 'bleu.9',
  'fond.interactif.fort.survol': 'voile:bleu.9',
  'fond.accent.fort': 'terre.11',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`fond.${s}.discret`, `${s}.3`], [`fond.${s}.fort`, s === 'avertissement' ? `${s}.9` : `${s}.11`]])),
  'texte.principal': 'neutre.12',
  'texte.secondaire': 'neutre.11',
  'texte.interactif': 'bleu.11',
  'texte.accent': 'terre.11',
  ...Object.fromEntries(STATUTS.map((s) => [`texte.${s}`, `${s}.11`])),
  'texte.sur-interactif': 'blanc',
  'texte.sur-accent': 'blanc',
  'texte.sur-inverse': 'sur-inverse',
  ...Object.fromEntries(STATUTS.map((s) => [`texte.sur-${s}`, s === 'avertissement' ? `${s}.12` : 'blanc'])),
  'bordure.discrete': 'neutre.6',
  'bordure.defaut': 'neutre.7',
  'bordure.forte': 'neutre.8',
  'bordure.focus': 'bleu.11',
  ...Object.fromEntries(STATUTS.map((s) => [`bordure.${s}`, `${s}.8`])),
});
const DECORATIVE = 'jamais seule pour repérer un champ ou un état';
const STATUT_BORDER = 'sur un fond de statut, décorative : le texte porte le sens ; un champ en erreur garde fond.app';

/** Aplatit un fichier DTCG : chemin logique (sans $root) → jeton. @param {any} node @param {string[]} path @param {Map<string, any>} out */
function flatten(node, path = [], out = new Map()) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') && k !== '$root') continue;
    if (v && typeof v === 'object' && '$value' in v) out.set((k === '$root' ? path : [...path, k]).join('.'), v);
    else if (v && typeof v === 'object') flatten(v, [...path, k], out);
  }
  return out;
}
/** Types hérités : chemin logique → $type du groupe le plus proche. @param {any} node */
function typesOf(node, path = /** @type {string[]} */ ([]), type = /** @type {string | undefined} */ (undefined), out = new Map()) {
  const t = node.$type ?? type;
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$') && k !== '$root') continue;
    if (v && typeof v === 'object' && '$value' in v) out.set((k === '$root' ? path : [...path, k]).join('.'), v.$type ?? t);
    else if (v && typeof v === 'object') typesOf(v, [...path, k], t, out);
  }
  return out;
}

const sem = load('semantique.tokens.json');
/** Rôles de couleur seulement (séance 3c : les rôles d'espacement sont de type dimension). */
const roles = new Map([...flatten(sem)].filter(([k]) => typesOf(sem).get(k) === 'color'));
const prims = new Map([...flatten(load('primitives.tokens.json')), ...flatten(load('statuts.tokens.json'))]);
/** Séance 3b, M0 : les rôles de marque passent par marque.tokens.json (primaire → bleu, accent → terre). */
const marque = flatten(load('marque.tokens.json'));
const VIA_MARQUE = /** @type {Record<string, string>} */ ({
  'fond.interactif.discret': 'marque.primaire.3',
  'fond.interactif.fort': 'marque.primaire.plein',
  'fond.interactif.fort.survol': 'marque.primaire.plein-survol',
  'fond.accent.fort': 'marque.accent.plein',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`fond.${s}.fort`, `marque.${s}.plein`], [`texte.sur-${s}`, `marque.${s}.sur-plein`]])),
  'texte.interactif': 'marque.primaire.11',
  'texte.accent': 'marque.accent.11',
  'texte.sur-interactif': 'marque.primaire.sur-plein',
  'texte.sur-accent': 'marque.accent.sur-plein',
  'bordure.focus': 'marque.primaire.11',
});

test('T1 description racine et DTCG 2025.10', () => {
  assert.ok(typeof sem.$description === 'string' && /DTCG 2025\.10/.test(sem.$description));
});

test('T1 liste exacte des 42 rôles, plus les 9 du lot 5 (étape 4a)', () => {
  assert.equal(Object.keys(EXPECTED).length, 42);
  assert.deepEqual([...roles.keys()].sort(), [...Object.keys(EXPECTED), ...Object.keys(AJOUTS)].sort());
});

test('T1 chaque rôle est un alias vers la primitive attendue (directement ou par la marque), sans valeur en dur', () => {
  for (const [role, target] of Object.entries(EXPECTED)) {
    const v = roles.get(role)?.$value;
    const slot = VIA_MARQUE[role];
    if (target.startsWith('voile:')) {
      assert.equal(v, `{${slot}}`, `${role} : par la marque`);
      const x = marque.get(slot)?.$extensions?.['ds-lab.voile'];
      assert.deepEqual(x && { base: x.base, blanc: x.blanc }, { base: `{couleur.${target.slice(6)}}`, blanc: 0.08 }, `${role} : voile`);
      continue;
    }
    if (slot) {
      assert.equal(v, `{${slot}}`, `${role} : par la marque`);
      assert.equal(marque.get(slot)?.$value, `{couleur.${target}}`, `${role} : ${slot} → {couleur.${target}}`);
    } else assert.equal(v, `{couleur.${target}}`, role);
    assert.ok(prims.has(`couleur.${target}`), `${role} : {couleur.${target}} se résout dans primitives ou statuts`);
  }
  assert.doesNotMatch(JSON.stringify(sem), /#[0-9a-fA-F]{3,8}\b|"components"/, 'aucune couleur en dur');
});

test('T1 un rôle à états porte sa base en $root', () => {
  assert.ok(sem.fond.composant.$root, 'fond.composant.$root');
  assert.ok(sem.fond.interactif.fort.$root, 'fond.interactif.fort.$root');
});

test('T1 type color pour chaque rôle', () => {
  const types = typesOf(sem);
  for (const role of Object.keys(EXPECTED)) assert.equal(types.get(role), 'color', role);
});

test('T1 aucun nom ne cite une teinte ni un pas', () => {
  for (const role of roles.keys())
    for (const seg of role.split('.')) {
      assert.ok(!['neutre', 'bleu', 'terre', 'sable', 'marine', 'or'].includes(seg), `${role} : teinte « ${seg} »`);
      assert.doesNotMatch(seg, /\d/, `${role} : pas`);
    }
});

test('T1 $description d\'une phrase pour chaque rôle', () => {
  for (const [role, t] of roles) {
    const d = t.$description;
    assert.ok(typeof d === 'string' && d.length > 10, `${role} : description`);
    assert.match(d, /^[A-ZÀ-Ý«][^]*[.]$/u, `${role} : une phrase, majuscule et point final`);
    assert.doesNotMatch(d.slice(0, -1), /[.!?] /, `${role} : une seule phrase`);
  }
});

test('T1 bordures décoratives : discrete et defaut le disent', () => {
  for (const role of ['bordure.discrete', 'bordure.defaut']) assert.ok(roles.get(role).$description.includes(DECORATIVE), role);
  for (const role of ['bordure.forte', 'bordure.focus', ...STATUTS.map((s) => `bordure.${s}`)])
    assert.ok(!roles.get(role).$description.includes(DECORATIVE), role);
});

test('T1 bordure.<statut> : décorative sur un fond de statut, le texte porte le sens', () => {
  for (const s of STATUTS) assert.ok(roles.get(`bordure.${s}`).$description.includes(STATUT_BORDER), `bordure.${s}`);
});

test('T1 un plein à texte blanc ne dit plus « texte foncé »', () => {
  for (const role of ['fond.accent.fort', 'fond.succes.fort', 'fond.info.fort']) assert.doesNotMatch(roles.get(role).$description, /foncé/, role);
});
