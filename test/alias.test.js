// @ts-check
/**
 * docs/attendus/revue-lot-4-copies.md, point 2 : une seule résolution d'alias, lue par les
 * rôles de couleur (resolveRoles), les espacements et la typo. Réponse de Quentin du 16/11/2026 : la fonction rend la valeur
 * finale ; « en boucle » cite la chaîne depuis le point de départ ; « depuis » nomme le jeton ou le champ de départ ; chaque
 * appelant garde son message de type.
 *
 * Attendus écrits à la main avant le code (16/11/2026), sur des jeux fabriqués. Départ : le rôle background.app (couleurs), le rôle
 * gap.within-component (espacements), le style typography.label et son champ libelle.fontSize (typo) :
 *   cible absente           : « alias sans cible : {X.999} (depuis <départ>) » ;
 *   absente au 2e maillon   : même message, le départ reste le premier jeton (ou le champ) ;
 *   boucle a → b1 → b2 → b1 : « alias en boucle : <jeton de départ> → b1 → b2 → b1 » (typo aujourd'hui : sans typography.label) ;
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
  const prims = { color: { $type: 'color', white: { $value: '#ffffff' } } };
  const c = CAS('background', 'app', 'color');
  const attendu = {
    absente: 'alias sans cible : {color.999} (depuis background.app)',
    'absente au 2e maillon': 'alias sans cible : {color.999} (depuis background.app)',
    boucle: 'alias en boucle : background.app → background.b1 → background.b2 → background.b1',
    'renvoi à soi-même': 'alias en boucle : background.app → background.app',
    groupe: 'alias sans cible : {color} (depuis background.app)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A1 rôles de couleur : ${k}`, () => assert.throws(() => resolveRoles({ background: groupe(c[/** @type {'boucle'} */ (k)], 'color') }, prims), exact(msg)));
}

{
  const prims = { space: { $type: 'dimension', 4: { $value: { value: 4, unit: 'px' } } } };
  const c = CAS('gap', 'within-component', 'space');
  const attendu = {
    absente: 'alias sans cible : {space.999} (depuis gap.within-component)',
    'absente au 2e maillon': 'alias sans cible : {space.999} (depuis gap.within-component)',
    boucle: 'alias en boucle : gap.within-component → gap.b1 → gap.b2 → gap.b1',
    'renvoi à soi-même': 'alias en boucle : gap.within-component → gap.within-component',
    groupe: 'alias sans cible : {space} (depuis gap.within-component)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A2 espacements : ${k}`, () => {
      const sem = { gap: groupe(c[/** @type {'boucle'} */ (k)], 'dimension') };
      assert.throws(() => espacements(sem, prims, { semantique: sem, sous: 600, seuil: '[H]' }), exact(msg));
    });
}

{
  const prims = { size: { $type: 'dimension', 16: { $value: { value: 16, unit: 'px' } } } };
  /** @type {Record<string, [string, Record<string, string>]>} */
  const cas = {
    absente: ['{size.999}', {}],
    'absente au 2e maillon': ['{renvoi.b1}', { b1: '{size.999}' }],
    boucle: ['{renvoi.b1}', { b1: '{renvoi.b2}', b2: '{renvoi.b1}' }],
    'renvoi à soi-même': ['{typography.label}', {}],
    groupe: ['{size}', {}],
  };
  const attendu = {
    absente: 'alias sans cible : {size.999} (depuis label.fontSize)',
    'absente au 2e maillon': 'alias sans cible : {size.999} (depuis label.fontSize)',
    boucle: 'alias en boucle : typography.label → renvoi.b1 → renvoi.b2 → renvoi.b1',
    'renvoi à soi-même': 'alias en boucle : typography.label → typography.label',
    groupe: 'alias sans cible : {size} (depuis label.fontSize)',
  };
  for (const [k, msg] of Object.entries(attendu))
    test(`A3 typo, depuis le champ du style : ${k}`, () => {
      const [fontSize, renvoi] = cas[k];
      const sem = {
        typography: { $type: 'typography', label: { $value: { fontFamily: 'serif', fontSize, lineHeight: 1.5, fontWeight: 400 } } },
        renvoi: groupe(renvoi, 'dimension'),
      };
      assert.throws(() => typo(sem, prims, {}, { semantique: sem, sous: 600, seuil: '[H]' }), exact(msg));
    });
}
