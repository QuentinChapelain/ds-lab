// @ts-check
/**
 * Séance 3a, T4 : planche tokens/orbe-cafe/roles.html, une ligne par paire de rôles
 * (fond, mot écrit, ratio, seuil, verdict), groupée par propriété de l'élément devant.
 *
 * Attendu écrit à la main avant le code de src/report/roles.js :
 *   deux groupes dans cet ordre : texte (30 paires), bordure (14 paires, focus compris) ;
 *   ratio affiché tronqué à 2 décimales, virgule décimale, « :1 » (jamais arrondi vers le seuil) ;
 *   seuil « 4,5:1 » ou « 3:1 » ; verdict « conforme », « échec » ou « exception » ;
 *   7 échecs, ceux de test/roles-paires.test.js (ratios culori de ce test) ;
 *   page autonome : aucune ressource externe ; le fichier versionné est à jour.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { loadRoles, contratRoles } from '../src/tokens/roles.js';
import { rolesHtml } from '../src/report/roles.js';

const DIR = join(fileURLToPath(new URL('..', import.meta.url)), 'tokens', 'orbe-cafe');
const html = readFileSync(join(DIR, 'roles.html'), 'utf8');
const paires = JSON.parse(readFileSync(join(DIR, 'paires.json'), 'utf8')).paires;

/** Lignes et paires sous le seuil, reprises à la main de test/roles-paires.test.js. */
const FAILS = new Map([
  ['texte.secondaire|fond.composant.appui', 4.3327],
  ['bordure.forte|fond.composant', 2.8718],
  ['bordure.erreur|fond.erreur.discret', 2.8913],
  ['bordure.succes|fond.succes.discret', 2.8502],
  ['bordure.avertissement|fond.avertissement.discret', 2.8689],
  ['bordure.info|fond.info.discret', 2.8866],
  ['bordure.focus|fond.composant', 2.874],
]);
const trunc = (/** @type {number} */ n) => (Math.floor(n * 100) / 100).toFixed(2).replace('.', ',');

/** @param {string} s */
const rows = (s) => [...s.matchAll(/<tr data-devant="([^"]+)" data-fond="([^"]+)"[^>]*>([^]*?)<\/tr>/g)].map((m) => ({ devant: m[1], fond: m[2], body: m[3] }));
/** @param {string} body */
const cells = (body) => [...body.matchAll(/<td[^>]*>([^]*?)<\/td>/g)].map((m) => m[1]);
/** @param {string} s */
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

test('T4 la planche versionnée est à jour', () => {
  assert.equal(html, rolesHtml(contratRoles(loadRoles(DIR))));
});

test('T4 page autonome, en français, titrée', () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /<title>[^<]+<\/title>/);
  assert.doesNotMatch(html, /(src|href)="https?:/);
});

test('T4 groupes par propriété : texte (30) puis bordure (14)', () => {
  const sections = [...html.matchAll(/<section data-propriete="([^"]+)">([^]*?)<\/section>/g)];
  assert.deepEqual(sections.map((s) => s[1]), ['texte', 'bordure']);
  assert.equal(rows(sections[0][2]).length, 30);
  assert.equal(rows(sections[1][2]).length, 14);
  for (const r of rows(sections[0][2])) assert.match(r.devant, /^texte\./);
  for (const r of rows(sections[1][2])) assert.match(r.devant, /^bordure\./);
});

test('T4 une ligne par paire, dans l\'ordre de paires.json', () => {
  assert.deepEqual(rows(html).map((r) => [r.devant, r.fond]), paires.map((/** @type {any} */ p) => [p.devant, p.fond]));
});

test('T4 colonnes : fond, mot écrit, ratio, seuil, verdict', () => {
  const head = [...html.matchAll(/<thead>([^]*?)<\/thead>/g)].map((m) => [...m[1].matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((x) => x[1]));
  assert.equal(head.length, 2);
  for (const h of head) assert.deepEqual(h, ['Fond', 'Mot écrit', 'Ratio', 'Seuil', 'Verdict']);
  const c = contratRoles(loadRoles(DIR));
  rows(html).forEach((r, i) => {
    const p = c.pairs[i];
    const [fond, mot, ratio, seuil, verdict] = cells(r.body);
    assert.ok(text(fond).includes(p.fond) && fond.includes(p.hexFond), `${r.devant} sur ${r.fond} : fond`);
    assert.ok(text(mot).includes(p.devant), `${r.devant} : rôle devant nommé`);
    assert.ok(mot.includes(`background:${p.hexFond}`), `${r.devant} : échantillon sur son fond`);
    assert.ok(mot.includes(r.devant.startsWith('texte.') ? `color:${p.hexDevant}` : `border-color:${p.hexDevant}`), `${r.devant} : couleur devant`);
    assert.equal(text(ratio), `${trunc(p.ratio)}:1`);
    assert.equal(text(seuil), r.devant.startsWith('texte.') ? '4,5:1' : '3:1');
    const key = `${r.devant}|${r.fond}`;
    assert.equal(text(verdict), FAILS.has(key) ? 'échec' : 'conforme', key);
  });
});

test('T4 les 7 échecs, avec leur ratio culori', () => {
  const failed = rows(html).filter((r) => text(cells(r.body)[4]) === 'échec');
  assert.deepEqual(failed.map((r) => `${r.devant}|${r.fond}`), [...FAILS.keys()]);
  for (const r of failed) assert.equal(text(cells(r.body)[2]), `${trunc(/** @type {number} */ (FAILS.get(`${r.devant}|${r.fond}`)))}:1`);
});

test('T4 une exception écrite s\'affiche avec son texte et le verdict « exception »', () => {
  const set = structuredClone(loadRoles(DIR));
  const p = set.paires.paires.find((/** @type {any} */ x) => x.devant === 'bordure.forte' && x.fond === 'fond.composant');
  p.exception = 'Champ toujours doublé de son libellé.';
  const out = rolesHtml(contratRoles(set));
  const r = rows(out).find((x) => x.devant === 'bordure.forte' && x.fond === 'fond.composant');
  assert.ok(r);
  assert.match(text(cells(r.body)[4]), /^exception Champ toujours doublé de son libellé\.$/);
});
