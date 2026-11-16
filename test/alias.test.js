// @ts-check
/**
 * Revue de code du 15/11, lot 4 (docs/attendus/revue-lot-4-copies.md, point 2) : une seule résolution d'alias, lue par les
 * rôles de couleur (resolveRoles), les espacements et la typo. Réponse de Quentin du 16/11/2026 : la fonction rend la valeur
 * finale ; « en boucle » cite la chaîne depuis le point de départ ; « depuis » nomme le jeton ou le champ de départ ; chaque
 * appelant garde son message de type.
 *
 * Attendus écrits à la main avant le code (16/11/2026), sur des jeux fabriqués. Départ : le rôle fond.app (couleurs), le rôle
 * ecart.dans-composant (espacements), le style typo.libelle et son champ libelle.fontSize (typo) :
 *   cible absente           : « alias sans cible : {X.999} (depuis <départ>) » ;
 *   absente au 2e maillon   : même message, le départ reste le premier jeton (ou le champ) ;
 *   boucle a → b1 → b2 → b1 : « alias en boucle : <jeton de départ> → b1 → b2 → b1 » (typo aujourd'hui : sans typo.libelle) ;
 *   renvoi à soi-même       : « alias en boucle : <jeton de départ> → <jeton de départ> » (typo aujourd'hui :
 *                             « taille illisible (px ou rem attendu) : libelle.fontSize ») ;
 *   alias vers un groupe    : « alias sans cible : {groupe} (depuis <départ>) ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRoles } from '../src/tokens/roles.js';
import { espacements } from '../src/tokens/espacements.js';
import { typo } from '../src/tokens/typo.js';

/** Message exact de l'erreur levée. @param {string} s */
const exact = (s) => (/** @type {unknown} */ e) => {
  assert.equal(/** @type {Error} */ (e).message, s);
  return true;
};

/** Les cinq cas, pour un groupe de départ `g`, son premier rôle `r` et le groupe de primitives `p`. */
const CAS = /** @param {string} g @param {string} r @param {string} p */ (g, r, p) => ({
  absente: { [r]: `{${p}.999}` },
  'absente au 2e maillon': { [r]: `{${g}.b1}`, b1: `{${p}.999}` },
  boucle: { [r]: `{${g}.b1}`, b1: `{${g}.b2}`, b2: `{${g}.b1}` },
  'renvoi à soi-même': { [r]: `{${g}.${r}}` },
  groupe: { [r]: `{${p}}` },
});
/** @param {Record<string, string>} c @param {string} type */
const groupe = (c, type) => ({ $type: type, ...Object.fromEntries(Object.entries(c).map(([k, v]) => [k, { $value: v }])) });

{
  const prims = { couleur: { $type: 'color', blanc: { $value: '#ffffff' } } };
  const c = CAS('fond', 'app', 'couleur');
  const attendu = {
    absente: 'alias sans cible : {couleur.999} (depuis fond.app)',
    'absente au 2e maillon': 'alias sans cible : {couleur.999} (depuis fond.app)',
    boucle: 'alias en boucle : fond.app → fond.b1 → fond.b2 → fond.b1',
    'renvoi à soi-même': 'alias en boucle : fond.app → fond.app',
    groupe: 'alias sans cible : {couleur} (depuis fond.app)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A1 rôles de couleur : ${k}`, () => assert.throws(() => resolveRoles({ fond: groupe(c[/** @type {'boucle'} */ (k)], 'color') }, prims), exact(msg)));
}

{
  const prims = { espace: { $type: 'dimension', 4: { $value: { value: 4, unit: 'px' } } } };
  const c = CAS('ecart', 'dans-composant', 'espace');
  const attendu = {
    absente: 'alias sans cible : {espace.999} (depuis ecart.dans-composant)',
    'absente au 2e maillon': 'alias sans cible : {espace.999} (depuis ecart.dans-composant)',
    boucle: 'alias en boucle : ecart.dans-composant → ecart.b1 → ecart.b2 → ecart.b1',
    'renvoi à soi-même': 'alias en boucle : ecart.dans-composant → ecart.dans-composant',
    groupe: 'alias sans cible : {espace} (depuis ecart.dans-composant)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A2 espacements : ${k}`, () => {
      const sem = { ecart: groupe(c[/** @type {'boucle'} */ (k)], 'dimension') };
      assert.throws(() => espacements(sem, prims, { semantique: sem, sous: 600, seuil: '[H]' }), exact(msg));
    });
}

{
  const prims = { taille: { $type: 'dimension', 16: { $value: { value: 16, unit: 'px' } } } };
  /** @type {Record<string, [string, Record<string, string>]>} */
  const cas = {
    absente: ['{taille.999}', {}],
    'absente au 2e maillon': ['{renvoi.b1}', { b1: '{taille.999}' }],
    boucle: ['{renvoi.b1}', { b1: '{renvoi.b2}', b2: '{renvoi.b1}' }],
    'renvoi à soi-même': ['{typo.libelle}', {}],
    groupe: ['{taille}', {}],
  };
  const attendu = {
    absente: 'alias sans cible : {taille.999} (depuis libelle.fontSize)',
    'absente au 2e maillon': 'alias sans cible : {taille.999} (depuis libelle.fontSize)',
    boucle: 'alias en boucle : typo.libelle → renvoi.b1 → renvoi.b2 → renvoi.b1',
    'renvoi à soi-même': 'alias en boucle : typo.libelle → typo.libelle',
    groupe: 'alias sans cible : {taille} (depuis libelle.fontSize)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A3 typo, depuis le champ du style : ${k}`, () => {
      const [fontSize, renvoi] = cas[k];
      const sem = {
        typo: { $type: 'typography', libelle: { $value: { fontFamily: 'serif', fontSize, lineHeight: 1.5, fontWeight: 400 } } },
        renvoi: groupe(renvoi, 'dimension'),
      };
      assert.throws(() => typo(sem, prims, {}, { semantique: sem, sous: 600, seuil: '[H]' }), exact(msg));
    });
}
