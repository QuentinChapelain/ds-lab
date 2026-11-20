// @ts-check
/**
 * Feuilles ajoutées sur une réduction des pages en désordre (docs/attendus/feuille-ajoutee.md) : un fichier de test
 * par réduction, pour que les trois réductions tournent en parallèle. Déclare la preuve dans un `before` et les tests
 * communs à toute réduction :
 *   P1 sur chaque page, le rendu avec les feuilles ajoutées est identique au pixel au rendu de la copie passée par
 *      apply, même arbre d'accessibilité ; P3 système en sombre : rendu identique au rendu en clair ;
 *   P4 chaque ligne décidée et non écrite, et chaque ligne du reste, est dans le fichier des pertes ;
 *   P7 une seule cause par déclaration, la même dans la ligne de verdict, le détail et le fichier des pertes.
 * Les tests propres à la réduction (P2, P6) sont déclarés par `propres`, entre P4 et P7.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers, FIXTURE_DIR } from './serveur.js';
import { preuve, lignesPerdues, desaccords } from './ajout.js';

/** @typedef {Awaited<ReturnType<typeof preuve>>} Preuve */

/**
 * @param {string} nom  nom de la réduction dans les titres des tests
 * @param {{ targetPath: string, decisionsPath?: string }} opts  cible et décisions de la réduction
 * @param {(resultat: () => Preuve) => void} propres  déclare les tests propres à la réduction
 */
export function reductionDesordre(nom, opts, propres) {
  /** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
  let servers;
  /** @type {Preuve} */
  let r;

  before(async () => {
    servers = await startFixtureServers();
    const E = JSON.parse(await readFile(`${FIXTURE_DIR}expected-desordre.json`, 'utf8'));
    const [first, ...rest] = E.conditions.pages;
    r = await preuve(servers, { addresses: [servers.origin + first, ...rest], ...opts });
  });

  after(async () => servers?.close());

  test(`P1, P3 ${nom} : feuilles ajoutées = copie appliquée, au pixel ; sombre = clair`, () => {
    assert.ok(r.ajout.feuilles.length > 0);
    for (const x of r.resultats) {
      assert.deepEqual({ page: x.page, px: x.ajout.px, aria: x.ajout.aria, sombre: x.sombre }, { page: x.page, px: 0, aria: true, sombre: 0 });
    }
  });
  test(`P4 ${nom} : chaque ligne décidée est écrite ou dans le fichier des pertes`, () => {
    assert.deepEqual(lignesPerdues(r.mods, r.ajout), []);
  });

  propres(() => r);

  test(`P7 ${nom} : une cause par déclaration, la même dans le verdict, le détail et le fichier des pertes`, () => {
    assert.deepEqual(desaccords(r.verdict, r.ajout.pertes), []);
  });
}
