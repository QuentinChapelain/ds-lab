// @ts-check
/**
 * Feuilles ajoutées sur les réductions des pièges, de la proximité et de la page de marque
 * (docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026). Attendus écrits avant le code :
 *   P1 rendu avec les feuilles ajoutées identique au pixel à celui de la copie passée par apply, même arbre ;
 *   P2 0 px et même arbre contre la référence pour les pièges et la proximité ; la page de marque garde l'écart
 *      d'apply (valeurs en var(), KNOWN_ISSUES.md) ;
 *   P3 système en sombre : rendu identique au rendu en clair ;
 *   P4 chaque ligne décidée et non écrite, et chaque ligne du reste, est dans le fichier des pertes ; sur la page
 *      de marque, coul-06 (marque.css:41, border-bottom-color, simplement rattachée) est un rattachement non fait ;
 *   P5 proximité : seulement des lignes rattachées, aucune feuille ajoutée ; .message (proximite.css:67) n'est pas
 *      reprise, et ne passe plus devant .message-loin.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { preuve, lignesPerdues } from './helpers/ajout.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, Awaited<ReturnType<typeof preuve>>>} */
const R = {};

before(async () => {
  servers = await startFixtureServers();
  const P = JSON.parse(await readFile(`${FIXTURE_DIR}expected-proximite.json`, 'utf8'));
  const M = JSON.parse(await readFile(`${FIXTURE_DIR}expected-marque.json`, 'utf8'));
  R.pieges = await preuve(servers, { addresses: [`${servers.origin}/pieges/pieges.html`], targetPath: `${FIXTURE_DIR}cible-valise.json` });
  R.proximite = await preuve(servers, { addresses: [servers.origin + P.conditions.page], targetPath: `${FIXTURE_DIR}cible-valise.json` });
  R.marque = await preuve(servers, { addresses: [servers.origin + M.conditions.page], targetPath: `${FIXTURE_DIR}cible-marque.json` });
});

after(async () => servers?.close());

for (const nom of ['pieges', 'proximite', 'marque']) {
  test(`P1, P3 ${nom} : feuilles ajoutées = copie appliquée, au pixel ; sombre = clair`, () => {
    for (const x of R[nom].resultats) {
      assert.deepEqual({ page: x.page, px: x.ajout.px, aria: x.ajout.aria, sombre: x.sombre }, { page: x.page, px: 0, aria: true, sombre: 0 });
    }
  });
  test(`P4 ${nom} : chaque ligne décidée est écrite ou dans le fichier des pertes`, () => {
    assert.deepEqual(lignesPerdues(R[nom].mods, R[nom].ajout), []);
  });
}

for (const nom of ['pieges', 'proximite']) {
  test(`P2 ${nom} : 0 px et même arbre contre la référence`, () => {
    for (const x of R[nom].resultats) assert.deepEqual({ page: x.page, ...x.reference }, { page: x.page, px: 0, aria: true });
  });
}

test('P4 marque : coul-06, simplement rattachée, est un rattachement non fait', () => {
  const t = R.marque.ajout.pertes;
  const rattachements = t.slice(t.indexOf('RATTACHEMENTS NON FAITS'), t.indexOf('HORS DE MODIFICATIONS.JSON')).split('\n');
  assert.ok(rattachements.includes('- coul-06 : /marque/styles/marque.css:41 .onglet-actif { border-bottom-color } : var(--couleur-bleu-9, currentcolor). À faire : rattacher dans la source quand le composant sera refait.'), t);
});

test('P5 proximité : aucune feuille ajoutée, .message rattachement non fait', () => {
  assert.deepEqual(R.proximite.ajout.feuilles, []);
  assert.ok(R.proximite.ajout.pertes.split('\n').some((l) => l.startsWith('- esp-03 : /proximite/styles/proximite.css:67 .message { margin-top } : ')), R.proximite.ajout.pertes);
});
