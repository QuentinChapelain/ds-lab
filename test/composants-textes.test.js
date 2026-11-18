// @ts-check
/**
 * Textes affichés du constat des composants (D46, D47) : src/report/constat.textes.json ne contient que des textes, et ce
 * sont ceux des attendus, mot pour mot. Le fichier échappe à la garde des noms de marque, qui ne lit que le code
 * (test/marque-en-dur.test.js) : ce test le borne.
 *
 * Attendus écrits à la main avant le code (18/11/2026), puis corrigés pour la forme du constat (même jour,
 * docs/attendus/forme-constat.md) :
 *   X1 chaque feuille du fichier est une chaîne ; ses clés sont origines, etats, scores, definitions, guidage, limites ;
 *   X2 les explications des quatre scores et les cinq définitions sont les textes des (i) de docs/attendus/audit-composants.md,
 *      à l'identique ; deux titres de score sont renommés par l'attendu de la forme (« Versions à garder choisies » →
 *      « Versions choisies », « Fiabilité de l'audit » → « Éléments identifiés ») ; le texte de l'effort n'est plus une
 *      explication : la phrase de l'effort le remplace ;
 *   X3 les limites : chaque réserve du premier attendu commence une limite (première lettre en capitale), les trois
 *      limites ajoutées par ses réponses y sont à l'identique, et la date s'y ajoute (onze limites) ;
 *   X4 les deux étiquettes d'origine sont celles du premier attendu : « Fait maison », « Sans style » ;
 *   X5 les textes du guidage sont ceux de l'attendu de la forme, leurs nombres écrits par ses lettres (N, T, D, E, nom).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const T = JSON.parse(readFileSync(`${ROOT}src/report/constat.textes.json`, 'utf8'));
const ATTENDU = readFileSync(`${ROOT}docs/attendus/audit-composants.md`, 'utf8');
const FORME = readFileSync(`${ROOT}docs/attendus/forme-constat.md`, 'utf8');
const RENOMMES = /** @type {Record<string, string>} */ ({ 'Versions à garder choisies': 'Versions choisies', "Fiabilité de l'audit": 'Éléments identifiés' });
const SCORES = ['Source unique', 'Accessibilité de base', 'Versions à garder choisies', "Fiabilité de l'audit"];

/** Feuilles d'une valeur JSON. @param {unknown} v @returns {unknown[]} */
const feuilles = (v) => (v && typeof v === 'object' ? Object.values(v).flatMap(feuilles) : [v]);

test('X1 rien que des textes', () => {
  assert.deepEqual(Object.keys(T).sort(), ['definitions', 'etats', 'guidage', 'limites', 'origines', 'scores']);
  assert.ok(feuilles(T).every((x) => typeof x === 'string' && x.trim() !== ''));
});

test('X2 explications des scores et définitions, mot pour mot les (i) du premier attendu', () => {
  const section = ATTENDU.split('## Textes des (i)')[1].split('Réserves à écrire')[0];
  const lignes = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Mot affiché'));
  const attendu = Object.fromEntries(lignes.map((l) => l.slice(2, -2).split(' | ')));
  assert.equal(Object.keys(attendu).length, 10);
  assert.deepEqual(T.scores, Object.fromEntries(SCORES.map((m) => [RENOMMES[m] ?? m, attendu[m]])));
  const definitions = Object.keys(attendu).filter((m) => !SCORES.includes(m) && m !== 'Effort');
  assert.deepEqual(T.definitions, Object.fromEntries(definitions.map((m) => [m, attendu[m]])));
  for (const nouveau of Object.values(RENOMMES)) assert.match(FORME, new RegExp(`« ${nouveau} »`));
});

test('X3 limites : les réserves du premier attendu, les trois limites ajoutées, la date', () => {
  const reserves = /Réserves à écrire dans « Limites de cet audit » : (.*)\.\n/.exec(ATTENDU)?.[1].split(' ; ') ?? [];
  assert.equal(reserves.length, 7);
  for (const r of reserves) assert.ok(T.limites.some((/** @type {string} */ l) => l.startsWith(r.charAt(0).toUpperCase() + r.slice(1))), r);
  const ajoutees = [...ATTENDU.split('### Limites ajoutées')[1].matchAll(/^- « (.*) »$/gm)].map((m) => m[1]);
  assert.equal(ajoutees.length, 3);
  for (const a of ajoutees) assert.ok(T.limites.includes(a), a);
  assert.ok(T.limites.includes('Pages vues le {date}.'));
  assert.match(FORME, /« À faire » d'un bloc, limite de date \| Tes textes, tels que proposés/);
  assert.equal(T.limites.length, 11);
});

test('X4 étiquettes d’origine', () => {
  assert.deepEqual(T.origines, { equipe: 'Fait maison', nu: 'Sans style' });
  assert.match(ATTENDU, /sinon « Fait maison », nommé par sa classe ; sinon « Sans style »/);
});

test('X5 textes du guidage, mot pour mot l’attendu de la forme', () => {
  const G = T.guidage;
  const sans = (/** @type {string} */ s) => s.replace(/^\{n\} /, '');
  const textes = [
    `${G.phraseCourte.replace('{elements}', 'N éléments').replace('{types}', 'T types')} ${G.plusieurs[1].replace('{n}', 'D')}`,
    G.uneSeule,
    sans(G.aFaire.doublons[1]),
    sans(G.aFaire.confirmer[1]),
    sans(G.aFaire.blocs[1]),
    G.aFaire.rien,
    G.aFaire.titre,
    G.effort[1].replace('{n}', 'E'),
    G.type.choisir[1].replace('{n}', 'E'),
    G.type.garde[1].replace('{nom}', 'nom').replace('{n}', 'E'),
    G.type.confirmer,
    G.type.gardeSeule.replace('{nom}', 'nom'),
    G.type.plusRepandue,
    G.type.egalite,
    G.defauts.nom,
    G.defauts.clavier,
    G.defauts.zone,
    G.sections.doublons,
    G.sections.uneVersion,
    G.sections.lire,
    G.sections.limites,
    ...Object.keys(T.scores),
  ];
  for (const t of textes) assert.ok(FORME.includes(t), t);
  // Singuliers, « À faire » d'un bloc : réponses au plan.
  for (const t of ['« 1 type à doublons »', '« 1 bloc non identifié : le rattacher ou le laisser »', '« 1 endroit sera à remplacer »'])
    assert.ok(FORME.includes(t), t);
  assert.deepEqual([G.aFaire.doublons[0], G.aFaire.blocs[0], G.type.choisir[0].split('. ')[1]], ['{n} type à doublons : choisir la version à garder', '{n} bloc non identifié : le rattacher ou le laisser', "Si c'est la plus répandue, {n} endroit sera à remplacer."]);
});
