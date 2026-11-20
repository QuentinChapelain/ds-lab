// @ts-check
/**
 * Feuilles ajoutées sur la réduction des pages en désordre, cible de la valise sans décisions
 * (docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026). Attendus écrits avant le code : P1, P3, P4
 * et P7 dans test/helpers/ajout-desordre.js ;
 *   P2 0 px contre la référence de la réduction ;
 *   P6 verdict par ligne décidée (docs/attendus/verdict-par-decision.md) : chaque ligne décidée arrivée, sortie 0.
 * Les deux autres réductions sont dans e2e-ajout-valise.test.js et e2e-ajout-passage.test.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIXTURE_DIR } from './helpers/serveur.js';
import { pasArrivees } from './helpers/ajout.js';
import { reductionDesordre } from './helpers/ajout-desordre.js';

reductionDesordre('desordre', { targetPath: `${FIXTURE_DIR}cible-valise.json` }, (resultat) => {
  test('P2 desordre : 0 px et même arbre contre la référence', () => {
    for (const x of resultat().resultats) assert.deepEqual({ page: x.page, ...x.reference }, { page: x.page, px: 0, aria: true });
  });
  test('P6 desordre : chaque ligne décidée arrivée, sortie 0', () => {
    const r = resultat();
    assert.ok(r.verdict.lignes.length > 0);
    assert.deepEqual([pasArrivees(r), r.verdict.sortie], [{}, 0]);
  });
});
