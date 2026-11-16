// @ts-check
/**
 * Garde-fous de la police des titres, chacun avec son motif de refus
 * (docs/attendus/etape-4c-police-des-titres.md). Attendus écrits à la main avant le code :
 *   G1 graisses demandées par les styles de titre, lues dans les rôles : 600 et 700 ;
 *   G2 Oswald, EB Garamond et Cinzel passent tous les garde-fous (mesures de fontTools, fixtures/polices/LISEZMOI.md) ;
 *   G3 Bebas Neue (400 seulement) : « graisses absentes : 600, 700 (présentes : 400) » ;
 *   G4 un WOFF : « format WOFF, WOFF2 attendu », et rien d'autre (un fichier non lu ne dit rien de ses graisses) ;
 *   G5 licence vide, signes manquants, hauteur de capitale absente : un motif chacun, sur une description modifiée à la main ;
 *   G6 fichiers statiques : 600 et 700 couvrent ; 700 seul laisse 600 absente ;
 *   G7 la commande refuse Bebas Neue, sort en 1 et n'écrit rien.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lirePolice } from '../src/polices/lecture.js';
import { gardeFous, SIGNES } from '../src/polices/garde-fous.js';
import { saisir, chargerCommun, graissesTitres } from '../src/tokens/saisie.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POLICES = join(ROOT, 'fixtures', 'polices');
const OSWALD = 'oswald/oswald-latin-wght-normal.woff2';
const BEBAS = 'bebas-neue/bebas-neue-latin-400-normal.woff2';
const lire = (/** @type {string} */ f) => ({ chemin: f, police: lirePolice(readFileSync(join(POLICES, f))) });

test('G1 graisses demandées par les styles de titre : 600 et 700', () => {
  assert.deepEqual(graissesTitres(chargerCommun()), [600, 700]);
});

test('G2 Oswald, EB Garamond, Cinzel : acceptées', () => {
  for (const f of [OSWALD, 'eb-garamond/eb-garamond-latin-wght-normal.woff2', 'cinzel/cinzel-latin-wght-normal.woff2'])
    assert.deepEqual(gardeFous([lire(f)], [600, 700]), [], f);
});

test('G3 Bebas Neue : graisses absentes', () => {
  assert.deepEqual(gardeFous([lire(BEBAS)], [600, 700]), ['graisses absentes : 600, 700 (présentes : 400)']);
});

test('G4 WOFF : format refusé, rien d\'autre', () => {
  const f = 'bebas-neue/bebas-neue-latin-400-normal.woff';
  assert.deepEqual(gardeFous([lire(f)], [600, 700]), [`${f} : format WOFF, WOFF2 attendu`]);
});

test('G5 licence, signes, hauteur de capitale', () => {
  const o = lire(OSWALD);
  const p = /** @type {import('../src/polices/lecture.js').Police} */ (o.police);
  const couverture = new Set(p.couverture);
  for (const c of 'œÇ«') couverture.delete(/** @type {number} */ (c.codePointAt(0)));
  const modifiee = { chemin: o.chemin, police: { ...p, licence: null, capitale: null, couverture } };
  assert.deepEqual(gardeFous([modifiee], [600, 700]), [
    `${OSWALD} : licence non déclarée (name 13 et 14 vides)`,
    `${OSWALD} : signes absents : œ Ç «`,
    `${OSWALD} : hauteur de capitale absente du fichier`,
  ]);
  assert.equal(SIGNES, 'éèêëàâîïôùûüçœæÉÈÊËÀÂÎÏÔÙÛÜÇŒÆ«»’–');
});

test('G6 fichiers statiques : les graisses s\'additionnent', () => {
  const p = /** @type {import('../src/polices/lecture.js').Police} */ (lire(OSWALD).police);
  const statique = (/** @type {number} */ g) => ({ chemin: `${g}.woff2`, police: { ...p, variable: false, graisses: { min: g, max: g } } });
  assert.deepEqual(gardeFous([statique(600), statique(700)], [600, 700]), []);
  assert.deepEqual(gardeFous([statique(700)], [600, 700]), ['graisses absentes : 600 (présentes : 700)']);
});

test('G7 la commande refuse Bebas Neue et n\'écrit rien', () => {
  const dossier = mkdtempSync(join(tmpdir(), 'ds-lab-police-'));
  writeFileSync(join(dossier, 'entree.json'), JSON.stringify({ nom: 'Essai', primaire: '#8a4fd8', polices: { titre: { familles: ['Bebas Neue'], fichiers: [join(POLICES, BEBAS)] } } }));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'saisie.js'), join(dossier, 'entree.json')], { encoding: 'utf8' });
  assert.equal(r.status, 1, r.stderr + r.stdout);
  assert.match(r.stderr, /police des titres : graisses absentes : 600, 700 \(présentes : 400\)/);
  assert.deepEqual(readdirSync(dossier), ['entree.json']);
  assert.deepEqual(saisir({ nom: 'Essai', primaire: '#8a4fd8', polices: { titre: { familles: ['Bebas Neue'], fichiers: [BEBAS] } } }, { dossier: POLICES }).motifs, [
    'police des titres : graisses absentes : 600, 700 (présentes : 400)',
  ]);
});
