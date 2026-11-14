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
 *   un rôle qui a des états (fond.composant, fond.interactif.fort) porte sa valeur de base en $root (DTCG 2025.10) ;
 *   alias seulement, aucune valeur en dur ; $description d'une phrase.
 * Les alias sont résolus ici par un résolveur propre au test, indépendant du code.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));

const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
/** Rôle → primitive visée (échelle.pas). 19 fonds, 15 textes, 8 bordures = 42. */
const EXPECTED = /** @type {Record<string, string>} */ ({
  'fond.app': 'neutre.1',
  'fond.discret': 'neutre.2',
  'fond.surface': 'blanc',
  'fond.inverse': 'neutre.12',
  'fond.composant': 'neutre.3',
  'fond.composant.survol': 'neutre.4',
  'fond.composant.appui': 'neutre.5',
  'fond.interactif.discret': 'bleu.3',
  'fond.interactif.fort': 'bleu.9',
  'fond.interactif.fort.survol': 'bleu.10',
  'fond.accent.fort': 'terre.10',
  ...Object.fromEntries(STATUTS.flatMap((s) => [[`fond.${s}.discret`, `${s}.3`], [`fond.${s}.fort`, ['succes', 'info'].includes(s) ? `${s}.10` : `${s}.9`]])),
  'texte.principal': 'neutre.12',
  'texte.secondaire': 'neutre.11',
  'texte.interactif': 'bleu.11',
  'texte.accent': 'terre.11',
  ...Object.fromEntries(STATUTS.map((s) => [`texte.${s}`, `${s}.11`])),
  'texte.sur-interactif': 'bleu.sur-plein',
  'texte.sur-accent': 'blanc',
  'texte.sur-inverse': 'blanc',
  ...Object.fromEntries(STATUTS.map((s) => [`texte.sur-${s}`, ['succes', 'info'].includes(s) ? 'blanc' : `${s}.sur-plein`])),
  'bordure.discrete': 'neutre.6',
  'bordure.defaut': 'neutre.7',
  'bordure.forte': 'neutre.8',
  'bordure.focus': 'bleu.9',
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
const roles = flatten(sem);
const prims = new Map([...flatten(load('primitives.tokens.json')), ...flatten(load('statuts.tokens.json'))]);

test('T1 description racine et DTCG 2025.10', () => {
  assert.ok(typeof sem.$description === 'string' && /DTCG 2025\.10/.test(sem.$description));
});

test('T1 liste exacte des 42 rôles', () => {
  assert.equal(Object.keys(EXPECTED).length, 42);
  assert.deepEqual([...roles.keys()].sort(), Object.keys(EXPECTED).sort());
});

test('T1 chaque rôle est un alias vers la primitive attendue, sans valeur en dur', () => {
  for (const [role, target] of Object.entries(EXPECTED)) {
    const v = roles.get(role)?.$value;
    assert.equal(v, `{couleur.${target}}`, role);
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
