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
 *   P6 verdict par ligne décidée (docs/attendus/verdict-par-decision.md) : désordre et valise, chaque ligne décidée
 *      arrivée, sortie 0 ; passage 2c, les neuf lignes sans jeton dans la marque (hors de modifications.json) non
 *      arrivées, coul-26 (vue seulement au survol) non vérifiable (état), sortie 1 ;
 *   P4 chaque ligne décidée et non écrite, et chaque ligne du reste, est dans le fichier des pertes.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { preuve, lignesPerdues, pasArrivees } from './helpers/ajout.js';

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

for (const nom of ['desordre', 'valise']) {
  test(`P6 ${nom} : chaque ligne décidée arrivée, sortie 0`, () => {
    assert.ok(R[nom].verdict.lignes.length > 0);
    assert.deepEqual([pasArrivees(R[nom]), R[nom].verdict.sortie], [{}, 0]);
  });
}

test('P6 passage : lignes sans jeton non arrivées, survol non vérifiable ; sortie 1', () => {
  const sansJeton = ['coul-08', 'coul-12', 'coul-13', 'coul-15', 'coul-18', 'coul-30', 'coul-31', 'coul-35', 'coul-37'];
  assert.deepEqual(pasArrivees(R.passage), { ...Object.fromEntries(sansJeton.map((id) => [id, 'non arrivée'])), 'coul-26': 'non vérifiable (état)' });
  assert.equal(R.passage.verdict.sortie, 1);
  for (const id of sansJeton) {
    const l = /** @type {any} */ (R.passage.verdict.lignes.find((x) => x.id === id));
    assert.ok(l.texte.endsWith(' ; hors de modifications.json : jeton absent'), l.texte);
  }
});
