// @ts-check
/**
 * Feuilles ajoutées sur les trois réductions des pages en désordre (docs/attendus/feuille-ajoutee.md, décisions de
 * Quentin du 17/11/2026). Attendus écrits avant le code :
 *   P1 sur chaque page, le rendu avec les feuilles ajoutées (site intact, tokens.css en tête, chaque feuille ajoutée
 *      juste après la sienne) est identique au pixel au rendu de la copie passée par apply, même arbre d'accessibilité ;
 *   P2 0 px contre la référence de la réduction (désordre sur la valise, décisions de la valise) ; avec la cible
 *      sans valise et les décisions du passage 2c, l'écart à la référence reste celui d'apply (lignes hors de
 *      modifications.json, KNOWN_ISSUES.md) ;
 *   P3 système en sombre : rendu identique au rendu en clair ;
 *   P6 preuve par décision (docs/attendus/feuille-ajoutee-reel.md) : chaque ligne écrite est arrivée sur chaque page
 *      où la réduction l'a tracée ;
 *   P4 chaque ligne décidée et non écrite, et chaque ligne du reste, est dans le fichier des pertes.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { preuve, lignesPerdues, nonArrivees } from './helpers/ajout.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, Awaited<ReturnType<typeof preuve>>>} */
const R = {};

before(async () => {
  servers = await startFixtureServers();
  const E = JSON.parse(await readFile(`${FIXTURE_DIR}expected-desordre.json`, 'utf8'));
  const [first, ...rest] = E.conditions.pages;
  const addresses = [servers.origin + first, ...rest];
  R.desordre = await preuve(servers, { addresses, targetPath: `${FIXTURE_DIR}cible-valise.json` });
  R.valise = await preuve(servers, { addresses, targetPath: `${FIXTURE_DIR}cible-valise.json`, decisionsPath: `${FIXTURE_DIR}decisions-valise.json` });
  R.passage = await preuve(servers, { addresses, targetPath: `${FIXTURE_DIR}cible.json`, decisionsPath: `${FIXTURE_DIR}decisions-passage-2c.json` });
});

after(async () => servers?.close());

for (const nom of ['desordre', 'valise', 'passage']) {
  test(`P1, P3 ${nom} : feuilles ajoutées = copie appliquée, au pixel ; sombre = clair`, () => {
    assert.ok(R[nom].ajout.feuilles.length > 0);
    for (const x of R[nom].resultats) {
      assert.deepEqual({ page: x.page, px: x.ajout.px, aria: x.ajout.aria, sombre: x.sombre }, { page: x.page, px: 0, aria: true, sombre: 0 });
    }
  });
  test(`P4 ${nom} : chaque ligne décidée est écrite ou dans le fichier des pertes`, () => {
    assert.deepEqual(lignesPerdues(R[nom].mods, R[nom].ajout), []);
  });
}

for (const nom of ['desordre', 'valise']) {
  test(`P2 ${nom} : 0 px et même arbre contre la référence`, () => {
    for (const x of R[nom].resultats) assert.deepEqual({ page: x.page, ...x.reference }, { page: x.page, px: 0, aria: true });
  });
}

for (const nom of ['desordre', 'valise', 'passage']) {
  test(`P6 ${nom} : chaque ligne écrite est arrivée sur ses pages`, () => {
    assert.ok(R[nom].resultats.some((x) => x.decisions.length > 0) || R[nom].ajout.compte.ecrites === 0);
    assert.deepEqual(nonArrivees(R[nom]), []);
  });
}
