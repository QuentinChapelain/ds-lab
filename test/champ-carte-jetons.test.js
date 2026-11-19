// @ts-check
/**
 * Jetons du champ de texte et de la carte dans les dix thèmes (cinq marques fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (19/11/2026, docs/attendus/champ-carte.md) ; couleurs lues dans les jetons
 * par un résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   H1 rôle ajouté : arrondi.surface → {rayon.12}, 12 px dans les dix thèmes ; aucun rôle de couleur ajouté ;
 *   H2 rapports du tableau de l'attendu, recopiés ci-dessous : neutres et statuts, les mêmes dans les cinq marques par
 *      mode ; anneau de focus par thème ; le contour du champ (bordure.forte) et celui de l'erreur tiennent 3:1 sur la
 *      page et sur la surface, bordure.defaut reste sous 3 (jamais pour un champ), les textes tiennent 4,5:1 ;
 *   H3 variables ds- ajoutées à la table Vuetify : couleurs égales à leurs rôles, dimensions, styles de texte (corps
 *      moyen, mention, titre de carte) et consigne de hauteur de capitale, dans les dix thèmes ; le contour de la carte
 *      est sans paire, décoratif ;
 *   H4 descriptions corrigées de bordure.defaut et fond.composant, mot pour mot (bordure.defaut garde la formule que
 *      T1 de test/roles-semantique.test.js exige, « jamais seule pour repérer un champ ou un état » : correction de
 *      l'attendu).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from '../src/tokens/roles.js';
import { themesVuetify, lireTable } from '../src/tokens/vuetify.js';
import { charger } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto', 'orbe-cafe'];
const MODES = /** @type {const} */ (['clair', 'sombre']);

/** Paires communes : [devant, fond, clair : devant, fond, rapport, sombre : devant, fond, rapport]. */
const PAIRES = [
  ['bordure.forte', 'fond.surface', '#958f84', '#ffffff', 3.21, '#6a665c', '#181818', 3.1],
  ['bordure.forte', 'fond.app', '#958f84', '#fbfbfb', 3.1, '#6a665c', '#121212', 3.27],
  ['bordure.defaut', 'fond.surface', '#bfbbb5', '#ffffff', 1.91, '#45423b', '#181818', 1.77],
  ['bordure.defaut', 'fond.app', '#bfbbb5', '#fbfbfb', 1.85, '#45423b', '#121212', 1.87],
  ['bordure.erreur', 'fond.surface', '#e76862', '#ffffff', 3.2, '#c6232c', '#181818', 3.11],
  ['bordure.erreur', 'fond.app', '#e76862', '#fbfbfb', 3.1, '#c6232c', '#121212', 3.28],
  ['texte.secondaire', 'fond.surface', '#6d675b', '#ffffff', 5.61, '#8f8b81', '#181818', 5.22],
  ['texte.secondaire', 'fond.app', '#6d675b', '#fbfbfb', 5.42, '#8f8b81', '#121212', 5.51],
  ['texte.erreur', 'fond.surface', '#cb1d2a', '#ffffff', 5.6, '#ff978f', '#181818', 8.52],
  ['texte.erreur', 'fond.app', '#cb1d2a', '#fbfbfb', 5.41, '#ff978f', '#121212', 8.99],
  ['texte.principal', 'fond.surface', '#363026', '#ffffff', 13.06, '#d8d5ce', '#181818', 12.12],
  ['texte.principal', 'fond.app', '#363026', '#fbfbfb', 12.62, '#d8d5ce', '#121212', 12.78],
  ['texte.desactive', 'fond.desactive', '#8a8478', '#f3f2f1', 3.32, '#7d786c', '#1b1b1b', 3.92],
  ['bordure.discrete', 'fond.app', '#d8d6d2', '#fbfbfb', 1.4, '#303030', '#121212', 1.42],
  ['fond.surface', 'fond.app', '#ffffff', '#fbfbfb', 1.03, '#181818', '#121212', 1.06],
  ['bordure.defaut', 'bordure.forte', '#bfbbb5', '#958f84', 1.68, '#45423b', '#6a665c', 1.75],
];
/** Seuils de l'attendu : [devant, fond, seuil, passe]. */
const SEUILS = [
  ['bordure.forte', 'fond.surface', 3, true], ['bordure.forte', 'fond.app', 3, true],
  ['bordure.erreur', 'fond.surface', 3, true], ['bordure.erreur', 'fond.app', 3, true],
  ['bordure.defaut', 'fond.surface', 3, false], ['bordure.defaut', 'fond.app', 3, false],
  ['texte.secondaire', 'fond.surface', 4.5, true], ['texte.secondaire', 'fond.app', 4.5, true],
  ['texte.erreur', 'fond.surface', 4.5, true], ['texte.erreur', 'fond.app', 4.5, true],
  ['texte.principal', 'fond.surface', 4.5, true], ['texte.principal', 'fond.app', 4.5, true],
];
/** Anneau de focus par thème : [couleur, sur fond.surface, sur fond.app]. */
const FOCUS = {
  'atelier-lavandine-clair': ['#8247ce', 5.61, 5.42],
  'atelier-lavandine-sombre': ['#c4a4fe', 8.53, 9.0],
  'ecume-et-sel-clair': ['#21708b', 5.59, 5.4],
  'ecume-et-sel-sombre': ['#c9efff', 14.61, 15.41],
  'grenat-papeterie-clair': ['#4f0020', 15.52, 15.0],
  'grenat-papeterie-sombre': ['#fc96ae', 8.55, 9.02],
  'maison-alberto-clair': ['#836304', 5.6, 5.41],
  'maison-alberto-sombre': ['#ffd060', 12.21, 12.88],
  'orbe-cafe-clair': ['#4c6994', 5.59, 5.4],
  'orbe-cafe-sombre': ['#86b6fe', 8.57, 9.04],
};
/** Variables ajoutées, hors couleurs et polices, les mêmes dans les dix thèmes. */
const VALEURS = {
  'ds-arrondi-surface': '12px',
  'ds-ecart-dans-composant': '4px',
  'ds-ecart-entre-composants': '16px',
  'ds-corps-taille': '16px',
  'ds-corps-graisse': '400',
  'ds-corps-interligne': '1.5',
  'ds-mention-taille': '12px',
  'ds-mention-graisse': '400',
  'ds-mention-interligne': '1.3333',
  'ds-titre-carte-taille': '20px',
  'ds-titre-carte-graisse': '600',
  'ds-titre-carte-interligne': '1.4',
  'ds-titre-carte-hauteur-capitale': '0.7',
};
/** Variables de couleur ajoutées → leur rôle. */
const COULEURS = { 'ds-texte-secondaire': 'texte.secondaire', 'ds-texte-erreur': 'texte.erreur', 'ds-contour-erreur': 'bordure.erreur', 'ds-contour-carte': 'bordure.defaut' };
/** Variables de police ajoutées → la police du thème qu'elles reprennent. */
const POLICES = { 'ds-corps-police': 'font-body', 'ds-mention-police': 'font-body', 'ds-titre-carte-police': 'font-heading' };

/** Rapport culori à deux décimales. @param {string} a @param {string} b */
const r2 = (a, b) => Math.round(wcagContrast(a, b) * 100) / 100;
/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));

/** Rôles et jetons d'un thème. @param {string} marque @param {'clair' | 'sombre'} mode */
function theme(marque, mode) {
  const set = loadRoles(join(ROOT, 'tokens', marque), { mode });
  const roles = resolveRoles(set.semantique, set.primitives, set.marque);
  const hex = (/** @type {string} */ r) => {
    const v = roles.get(r)?.hex;
    assert.ok(v, `${marque}-${mode} : rôle absent ${r}`);
    return /** @type {string} */ (v);
  };
  const jetons = new Map([...flattenTokens(set.primitives), ...flattenTokens(set.marque), ...flattenTokens(set.semantique)]);
  return { hex, jetons, roles };
}

test('H1 arrondi de surface : {rayon.12}, 12 px dans les dix thèmes', () => {
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.arrondi.surface.$value, '{rayon.12}');
  for (const m of MARQUES) for (const mode of MODES) {
    const { jetons } = theme(m, mode);
    const { valeur } = resoudreAlias(jetons, '{rayon.12}', { depuis: 'arrondi.surface', chaine: ['arrondi.surface'] });
    assert.deepEqual(valeur, { value: 12, unit: 'px' }, `${m}-${mode}`);
    assert.equal(jetons.get('arrondi.surface')?.$value, '{rayon.12}', `${m}-${mode}`);
  }
});

test('H2 rapports du champ et de la carte, dans les dix thèmes', () => {
  for (const m of MARQUES) for (const [i, mode] of MODES.entries()) {
    const nom = `${m}-${mode}`;
    const { hex } = theme(m, mode);
    for (const p of PAIRES) {
      const [devant, fond] = /** @type {[string, string]} */ (p);
      const [d, f, r] = p.slice(2 + i * 3, 5 + i * 3);
      assert.deepEqual([hex(devant), hex(fond), r2(hex(devant), hex(fond))], [d, f, r], `${nom} : ${devant} sur ${fond}`);
    }
    for (const [devant, fond, seuil, passe] of SEUILS) {
      const r = wcagContrast(hex(/** @type {string} */ (devant)), hex(/** @type {string} */ (fond)));
      assert.equal(r >= /** @type {number} */ (seuil), passe, `${nom} : ${devant} sur ${fond} ${r.toFixed(2)} contre ${seuil}`);
    }
    const [c, surface, app] = FOCUS[/** @type {keyof typeof FOCUS} */ (nom)];
    assert.deepEqual([hex('bordure.focus'), r2(hex('bordure.focus'), hex('fond.surface')), r2(hex('bordure.focus'), hex('fond.app'))], [c, surface, app], `${nom} : focus`);
  }
});

test('H3 variables ds- du champ et de la carte, dans les dix thèmes', () => {
  const table = lireTable();
  assert.equal(table.variables['ds-contour-carte'].jeton, 'bordure.defaut');
  assert.match(String(table.variables['ds-contour-carte'].sansPaire), /décorative/);
  assert.equal(table.variables['ds-titre-carte-hauteur-capitale'].jeton, 'police.titre.hauteur-capitale');
  for (const m of MARQUES) {
    const themes = Object.values(themesVuetify(join(ROOT, 'tokens', m)).themes);
    for (const [i, mode] of MODES.entries()) {
      const x = themes[i].variables;
      const { hex } = theme(m, mode);
      for (const [k, v] of Object.entries(VALEURS)) assert.equal(x[k], v, `${m}-${mode} ${k}`);
      for (const [k, r] of Object.entries(COULEURS)) assert.equal(x[k], hex(r), `${m}-${mode} ${k}`);
      for (const [k, p] of Object.entries(POLICES)) assert.deepEqual(noms(x[k]), noms(x[p]), `${m}-${mode} ${k}`);
    }
  }
});

test('H4 descriptions corrigées', () => {
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.bordure.defaut.$description, 'Contour ordinaire d\'une carte ou d\'un séparateur, décoratif, jamais seule pour repérer un champ ou un état (sous 3:1 : un champ prend bordure.forte).');
  assert.equal(sem.fond.composant.$root.$description, 'Fond d\'un composant au repos, plus soutenu que la surface ; un champ, une carte et le bouton secondaire se posent sur fond.surface.');
});
