// @ts-check
/**
 * Feuilles ajoutées sur la réduction des pages en désordre, cible sans valise et décisions du passage 2c
 * (docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026). Attendus écrits avant le code : P1, P3, P4
 * et P7 dans test/helpers/ajout-desordre.js ; l'écart à la référence reste celui d'apply (lignes hors de
 * modifications.json, KNOWN_ISSUES.md), sans test P2 ;
 *   P6 verdict par ligne décidée (docs/attendus/verdict-par-decision.md) : les neuf lignes sans jeton dans la marque
 *      (hors de modifications.json) non arrivées, coul-26 (vue seulement au survol) non vérifiable (état), sortie 1 ;
 *   P7 les neuf lignes sans jeton finissent par « cause : jeton absent » (docs/attendus/verify-se-reconnait.md).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIXTURE_DIR } from './helpers/serveur.js';
import { pasArrivees } from './helpers/ajout.js';
import { reductionDesordre } from './helpers/ajout-desordre.js';

reductionDesordre('passage', { targetPath: `${FIXTURE_DIR}cible.json`, decisionsPath: `${FIXTURE_DIR}decisions-passage-2c.json` }, (resultat) => {
  test('P6 passage : lignes sans jeton non arrivées, survol non vérifiable ; sortie 1', () => {
    const r = resultat();
    const sansJeton = ['coul-08', 'coul-12', 'coul-13', 'coul-15', 'coul-18', 'coul-30', 'coul-31', 'coul-35', 'coul-37'];
    assert.deepEqual(pasArrivees(r), { ...Object.fromEntries(sansJeton.map((id) => [id, 'non arrivée'])), 'coul-26': 'non vérifiable (état)' });
    assert.equal(r.verdict.sortie, 1);
    for (const id of sansJeton) {
      const l = /** @type {any} */ (r.verdict.lignes.find((x) => x.id === id));
      assert.ok(l.texte.endsWith(' ; cause : jeton absent'), l.texte);
    }
  });
});
