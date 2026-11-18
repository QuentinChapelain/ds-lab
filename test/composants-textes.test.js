// @ts-check
/**
 * Textes affichés du constat des composants (D46) : src/report/constat.textes.json ne contient que des textes, et ce sont
 * ceux de l'attendu (docs/attendus/audit-composants.md), mot pour mot. Le fichier échappe à la garde des noms de marque,
 * qui ne lit que le code (test/marque-en-dur.test.js) : ce test le borne.
 *
 * Attendus écrits à la main avant le code (18/11/2026) :
 *   X1 chaque feuille du fichier est une chaîne ; ses clés sont origines, info, limites ;
 *   X2 les textes des (i) : les dix mots et leurs textes du tableau de l'attendu, à l'identique ;
 *   X3 les limites : chaque réserve de l'attendu commence une limite (première lettre en capitale), et les trois limites
 *      ajoutées par les réponses au plan y sont à l'identique ;
 *   X4 les deux étiquettes d'origine sont celles de l'attendu : « Fait maison », « Sans style ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const T = JSON.parse(readFileSync(`${ROOT}src/report/constat.textes.json`, 'utf8'));
const ATTENDU = readFileSync(`${ROOT}docs/attendus/audit-composants.md`, 'utf8');

/** Feuilles d'une valeur JSON. @param {unknown} v @returns {unknown[]} */
const feuilles = (v) => (v && typeof v === 'object' ? Object.values(v).flatMap(feuilles) : [v]);

test('X1 rien que des textes', () => {
  assert.deepEqual(Object.keys(T).sort(), ['info', 'limites', 'origines']);
  assert.ok(feuilles(T).every((x) => typeof x === 'string' && x.trim() !== ''));
});

test('X2 textes des (i), mot pour mot', () => {
  const section = ATTENDU.split('## Textes des (i)')[1].split('Réserves à écrire')[0];
  const lignes = section.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Mot affiché'));
  const attendu = Object.fromEntries(lignes.map((l) => l.slice(2, -2).split(' | ')));
  assert.equal(Object.keys(attendu).length, 10);
  assert.deepEqual(T.info, attendu);
});

test('X3 limites : les réserves de l’attendu, puis les trois limites ajoutées', () => {
  const reserves = /Réserves à écrire dans « Limites de cet audit » : (.*)\.\n/.exec(ATTENDU)?.[1].split(' ; ') ?? [];
  assert.equal(reserves.length, 7);
  for (const r of reserves) assert.ok(T.limites.some((/** @type {string} */ l) => l.startsWith(r.charAt(0).toUpperCase() + r.slice(1))), r);
  const ajoutees = [...ATTENDU.split('### Limites ajoutées')[1].matchAll(/^- « (.*) »$/gm)].map((m) => m[1]);
  assert.equal(ajoutees.length, 3);
  for (const a of ajoutees) assert.ok(T.limites.includes(a), a);
  assert.equal(T.limites.length, 10);
});

test('X4 étiquettes d’origine', () => {
  assert.deepEqual(T.origines, { equipe: 'Fait maison', nu: 'Sans style' });
  assert.match(ATTENDU, /sinon « Fait maison », nommé par sa classe ; sinon « Sans style »/);
});
