// @ts-check
/**
 * Une règle des échelles existantes pour toutes les marques
 * (docs/attendus/revue-lot-5-marque.md, Q3). Une entrée nomme une échelle ({ "echelle": nom }) seulement si elle est
 * écrite à la main dans le dossier de sa marque, primitives.tokens.json ; la différence entre marques vit dans ce fichier.
 *
 * Attendus écrits à la main avant le code (16/11/2026) :
 *   E1 echellesPropres(dossier) : le contenu de primitives.tokens.json du dossier, ou null ; Orbe Café donne bleu, terre,
 *      sable ; les trois autres marques n'en ont pas ;
 *   E2 sans ce fichier, nommer une échelle est refusé : « entrée invalide : primaire, échelle existante : aucune échelle
 *      écrite à la main dans le dossier de la marque (primitives.tokens.json) » ;
 *   E3 une marque quelconque qui a son fichier (dossier temporaire, échelle « olive » de 12 pas) nomme son échelle :
 *      acceptée, resolver du jeu marque = aplat, police, primitives.tokens.json, marque.tokens.json ;
 *   E4 une échelle commune (neutre) ne se nomme plus, même dans un dossier qui a son fichier : « échelle inconnue neutre » ;
 *   E5 défaut corrigé : une couleur et une échelle nommée, mêlées, ne sont plus une panne ; les deux fichiers d'échelles
 *      claires entrent au resolver, primitives.tokens.json puis echelles.tokens.json, et au contrôle de contraste ;
 *   E6 Orbe Café : couche marque et resolver réécrits à l'identique, octet par octet ;
 *   E7 calibrage : une échelle nommée est lue dans le dossier de sa marque ; « terre » n'existe pas pour une autre marque
 *      (accent absent de la colonne, motif de la saisie).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir, serialiser, echellesPropres } from '../src/tokens/saisie.js';
import { colonne } from '../src/report/calibrage.js';
import { generateScale } from '../src/valise/generate.js';
import { scaleToDtcg } from '../src/tokens/primitives.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const dossier = (/** @type {string} */ m) => join(ROOT, 'tokens', m);
const ORBE = dossier('orbe-cafe');
const POLICES = { titre: ['Georgia', 'serif'] };
const SANS_FICHIER = 'échelle existante : aucune échelle écrite à la main dans le dossier de la marque (primitives.tokens.json)';
const lire = (/** @type {string} */ d, /** @type {string} */ f) => readFileSync(join(d, f), 'utf8');

/** Dossier temporaire d'une marque qui écrit à la main une échelle « olive ». */
function avecOlive() {
  const d = mkdtempSync(join(tmpdir(), 'ds-lab-propres-'));
  const olive = scaleToDtcg(generateScale('olive', '#6b7a2a'), 'Olive, écrite à la main');
  writeFileSync(join(d, 'primitives.tokens.json'), JSON.stringify({ couleur: { $type: 'color', olive } }));
  return d;
}

test('E1 echellesPropres : le fichier du dossier, ou null', () => {
  const o = echellesPropres(ORBE);
  assert.deepEqual(Object.keys(o?.couleur ?? {}).filter((k) => !k.startsWith('$')), ['bleu', 'terre', 'sable']);
  for (const m of ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie']) assert.equal(echellesPropres(dossier(m)), null, m);
});

test('E2 sans fichier d\'échelles écrites à la main, nommer une échelle est refusé', () => {
  for (const m of ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie']) {
    const r = saisir({ nom: 'Essai', primaire: { echelle: 'bleu' }, polices: POLICES }, { dossier: dossier(m) });
    assert.deepEqual(r.motifs, [`entrée invalide : primaire, ${SANS_FICHIER}`], m);
  }
});

test('E3 une marque qui a son fichier nomme son échelle', () => {
  const d = avecOlive();
  const r = saisir({ nom: 'Essai', primaire: { echelle: 'olive' }, polices: POLICES }, { dossier: d });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.echelles, null);
  assert.deepEqual(r.resolver.sets.marque.sources.map((/** @type {any} */ s) => s.$ref.split('/').pop()), ['aplat.tokens.json', 'police.tokens.json', 'primitives.tokens.json', 'marque.tokens.json']);
  assert.equal(r.marque.marque.primaire['9'].$value, '{couleur.olive.9}');
});

test('E4 une échelle commune ne se nomme plus', () => {
  for (const d of [ORBE, avecOlive()]) {
    const r = saisir({ nom: 'Essai', primaire: { echelle: 'bleu' }, accent: { echelle: 'neutre' }, polices: POLICES }, { dossier: d });
    assert.ok(r.motifs.includes('entrée invalide : accent, échelle inconnue neutre'), r.motifs.join('\n'));
  }
});

test('E5 une couleur et une échelle nommée, mêlées : ni panne, ni fichier oublié', () => {
  const r = saisir({ nom: 'Essai', primaire: '#8a4fd8', accent: { echelle: 'terre' }, polices: POLICES }, { dossier: ORBE });
  assert.deepEqual(r.motifs, []);
  assert.deepEqual(r.resolver.sets.marque.sources.map((/** @type {any} */ s) => s.$ref.split('/').pop()), ['aplat.tokens.json', 'police.tokens.json', 'primitives.tokens.json', 'echelles.tokens.json', 'marque.tokens.json']);
});

test('E6 Orbe Café : couche marque et resolver identiques, octet par octet', () => {
  const r = saisir(JSON.parse(lire(ORBE, 'entree.json')), { dossier: ORBE });
  assert.deepEqual(r.motifs, []);
  assert.equal(serialiser(r.marque), lire(ORBE, 'marque.tokens.json'));
  assert.equal(serialiser(r.resolver), lire(ORBE, 'marque.resolver.json'));
});

test('E7 calibrage : l\'échelle nommée se lit dans le dossier de sa marque', () => {
  const d = dossier('atelier-lavandine');
  const c = colonne({ dossier: d, entree: { ...JSON.parse(lire(d, 'entree.json')), accent: { echelle: 'terre' } } });
  assert.equal(c.accent, null);
  assert.deepEqual(c.motifs, [`entrée invalide : accent, ${SANS_FICHIER}`]);
  const o = colonne({ dossier: ORBE, entree: JSON.parse(lire(ORBE, 'entree.json')) });
  assert.equal(o.primaire?.hex, '#2b4c7e');
  assert.ok(o.accent);
});
