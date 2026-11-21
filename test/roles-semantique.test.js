// @ts-check
/**
 * T1 : couche sémantique de couleur d'Orbe Café (marque fictive),
 * tokens/orbe-cafe/semantique.tokens.json, DTCG 2025.10.
 *
 * Attendu écrit à la main avant le code, d'après l'attendu des rôles de couleur et ses retouches du 14/11/2026 :
 *   nommage <propriété>.<sens>.<emphase>.<état>, texte sur plein en texte.sur-<sens> ;
 *   aucun nom ne cite une teinte (neutre, bleu, terre, sable) ni un pas ;
 *   primaire = bleu, accent = terre ; statuts = erreur, succes, avertissement, info ;
 *   border.<statut> → pas 8 (3:1), pas le pas 7 ; sa description dit « sur un fond de statut, décorative :
 *     le texte porte le sens ; un champ en erreur garde background.app » (décision du 14/11/2026) ;
 *   border.subtle et border.default décoratives : « jamais seule pour repérer un champ ou un état » ;
 *   décisions du 14/11/2026 : border.focus → primaire 9 ; background.accent.strong, background.success.strong et
 *     background.info.strong → pas 10, avec texte blanc (text.on-accent, .sur-succes, .sur-info → color.white) ;
 *     avertissement inchangé ;
 *   décisions après T5 (14/11/2026) : background.surface → color.white (cartes et champs) ;
 *     background.inverse → neutre 12 et text.on-inverse → color.white ;
 *   contextes, réponse 1 : background.surface → color.surface et text.on-inverse → color.on-inverse, deux primitives
 *     blanches en clair, noires en sombre ;
 *   un rôle qui a des états (background.component, background.interactive.strong) porte sa valeur de base en $root (DTCG 2025.10) ;
 *   alias seulement, aucune valeur en dur ; $description d'une phrase.
 *   règle des pleins en trois cas (15/11/2026), déclarée dans la couche marque : les pleins et
 *     leur texte passent par brand.<emplacement>.solid / .solid-hover / .on-solid ; Orbe Café :
 *     primaire sombre (bleu 9, survol = bleu 9 + voile blanc 8 %, texte blanc), accent, erreur, succès et
 *     info moyens (pas 11, survol pas 12, texte blanc), avertissement clair (pas 9, survol pas 10, texte pas 12).
 *   décision du 15/11/2026 : border.focus → brand.primary.11 pour toutes les marques ;
 *   D45 (18/11/2026) : le survol du plein est la clarté OKLCH du plein − 0,05, formule en $extensions["ds-lab.survol"]
 *     (base bleu 9, clarte −0,05) ;
 *   Le fichier porte aussi des rôles d'espacement (type dimension) ; les tests
 *     ci-dessous portent sur les rôles de type color, toujours 42.
 * Les alias sont résolus ici par un résolveur propre au test, indépendant du code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { AJOUTS, AJOUTS_BOUTON, AJOUTS_AVATAR } from './helpers/roles-ajoutes.js';
import { charger, COMMUN, ORBE } from './helpers/jetons.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = charger;

const STATUTS = ['error', 'success', 'warning', 'info'];
/** Rôle → primitive visée (échelle.pas), ou « survol:<échelle.pas> » pour un survol calculé (D45). 19 fonds, 15 textes, 8 bordures = 42. */
const EXPECTED = /** @type {Record<string, string>} */ ({
  'background.app': 'neutral.1',
  'background.subtle': 'neutral.2',
  'background.surface': 'surface',
  'background.inverse': 'neutral.12',
  'background.component': 'neutral.3',
  'background.component.hover': 'neutral.4',
  'background.component.pressed': 'neutral.5',
  'background.interactive.subtle': 'blue.3',
  'background.interactive.strong': 'blue.9',
  'background.interactive.strong.hover': 'survol:blue.9',
  'background.accent.strong': 'earth.11',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`background.${s}.subtle`, `${s}.3`], [`background.${s}.strong`, s === 'warning' ? `${s}.9` : `${s}.11`]])),
  'text.default': 'neutral.12',
  'text.secondary': 'neutral.11',
  'text.interactive': 'blue.11',
  'text.accent': 'earth.11',
  ...Object.fromEntries(STATUTS.map((s) => [`text.${s}`, `${s}.11`])),
  'text.on-interactive': 'white',
  'text.on-accent': 'white',
  'text.on-inverse': 'on-inverse',
  ...Object.fromEntries(STATUTS.map((s) => [`text.on-${s}`, s === 'warning' ? `${s}.12` : 'white'])),
  'border.subtle': 'neutral.6',
  'border.default': 'neutral.7',
  'border.strong': 'neutral.8',
  'border.focus': 'blue.11',
  ...Object.fromEntries(STATUTS.map((s) => [`border.${s}`, `${s}.8`])),
});
const DECORATIVE = 'jamais seule pour repérer un champ ou un état';
const STATUT_BORDER = 'sur un fond de statut, décorative : le texte porte le sens ; un champ en erreur garde background.app';

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
/** Rôles de couleur seulement (les rôles d'espacement sont de type dimension). */
const roles = new Map([...flatten(sem)].filter(([k]) => typesOf(sem).get(k) === 'color'));
const prims = new Map([...flatten(load('primitives.tokens.json')), ...flatten(load('statuts.tokens.json'))]);
/** M0 : les rôles de marque passent par marque.tokens.json (primary → blue, accent → earth). */
const marque = flatten(load('marque.tokens.json'));
const VIA_MARQUE = /** @type {Record<string, string>} */ ({
  'background.interactive.subtle': 'brand.primary.3',
  'background.interactive.strong': 'brand.primary.solid',
  'background.interactive.strong.hover': 'brand.primary.solid-hover',
  'background.accent.strong': 'brand.accent.solid',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`background.${s}.strong`, `brand.${s}.solid`], [`text.on-${s}`, `brand.${s}.on-solid`]])),
  'text.interactive': 'brand.primary.11',
  'text.accent': 'brand.accent.11',
  'text.on-interactive': 'brand.primary.on-solid',
  'text.on-accent': 'brand.accent.on-solid',
  'border.focus': 'brand.primary.11',
});

test('T1 description racine et DTCG 2025.10', () => {
  assert.ok(typeof sem.$description === 'string' && /DTCG 2025\.10/.test(sem.$description));
});

test('T1 liste exacte des 42 rôles, plus les ajouts (helpers/roles-ajoutes.js)', () => {
  assert.equal(Object.keys(EXPECTED).length, 42);
  assert.deepEqual([...roles.keys()].sort(), [...Object.keys(EXPECTED), ...Object.keys(AJOUTS), ...Object.keys(AJOUTS_BOUTON), ...Object.keys(AJOUTS_AVATAR)].sort());
});

test('T1 chaque rôle est un alias vers la primitive attendue (directement ou par la marque), sans valeur en dur', () => {
  for (const [role, target] of Object.entries(EXPECTED)) {
    const v = roles.get(role)?.$value;
    const slot = VIA_MARQUE[role];
    if (target.startsWith('survol:')) {
      assert.equal(v, `{${slot}}`, `${role} : par la marque`);
      const x = marque.get(slot)?.$extensions?.['ds-lab.survol'];
      assert.deepEqual(x && { base: x.base, clarte: x.clarte }, { base: `{color.${target.slice(7)}}`, clarte: -0.05 }, `${role} : survol`);
      continue;
    }
    if (slot) {
      assert.equal(v, `{${slot}}`, `${role} : par la marque`);
      assert.equal(marque.get(slot)?.$value, `{color.${target}}`, `${role} : ${slot} → {color.${target}}`);
    } else assert.equal(v, `{color.${target}}`, role);
    assert.ok(prims.has(`color.${target}`), `${role} : {color.${target}} se résout dans primitives ou statuts`);
  }
  assert.doesNotMatch(JSON.stringify(sem), /#[0-9a-fA-F]{3,8}\b|"components"/, 'aucune couleur en dur');
});

test('T1 un rôle à états porte sa base en $root', () => {
  assert.ok(sem.background.component.$root, 'background.component.$root');
  assert.ok(sem.background.interactive.strong.$root, 'background.interactive.strong.$root');
});

test('T1 type color pour chaque rôle', () => {
  const types = typesOf(sem);
  for (const role of Object.keys(EXPECTED)) assert.equal(types.get(role), 'color', role);
});

test('T1 aucun nom ne cite une teinte ni un pas', () => {
  for (const role of roles.keys())
    for (const seg of role.split('.')) {
      assert.ok(!['neutral', 'blue', 'earth', 'sand', 'navy', 'gold'].includes(seg), `${role} : teinte « ${seg} »`);
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

test('T1 bordures décoratives : subtle et default le disent', () => {
  for (const role of ['border.subtle', 'border.default']) assert.ok(roles.get(role).$description.includes(DECORATIVE), role);
  for (const role of ['border.strong', 'border.focus', ...STATUTS.map((s) => `border.${s}`)])
    assert.ok(!roles.get(role).$description.includes(DECORATIVE), role);
});

test('T1 border.<statut> : décorative sur un fond de statut, le texte porte le sens', () => {
  // Une description citée par une fiche ne nomme aucun token (DOC3, D57) : la fin de la formule passe dans la note.
  for (const s of STATUTS) {
    const t = roles.get(`border.${s}`);
    assert.ok(`${t.$description} ${t.$extensions?.['ds-lab.note'] ?? ''}`.includes(STATUT_BORDER), `border.${s}`);
    assert.ok(t.$description.includes(STATUT_BORDER.split(' ; un champ')[0]), `border.${s} : la description garde le sens`);
  }
});

test('T1 un plein à texte blanc ne dit plus « texte foncé »', () => {
  for (const role of ['background.accent.strong', 'background.success.strong', 'background.info.strong']) assert.doesNotMatch(roles.get(role).$description, /foncé/, role);
});
