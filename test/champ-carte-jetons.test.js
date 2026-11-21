// @ts-check
/**
 * Jetons du champ de texte et de la carte dans les dix thèmes (cinq marques fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (19/11/2026, docs/attendus/champ-carte.md) ; couleurs lues dans les jetons
 * par un résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   H1 rôle ajouté : border-radius.surface → {radius.12}, 12 px dans les dix thèmes ; aucun rôle de couleur ajouté ;
 *   H2 rapports du tableau de l'attendu, recopiés ci-dessous : neutres et statuts, les mêmes dans les cinq marques par
 *      mode ; anneau de focus par thème ; le contour du champ (border.strong) et celui de l'erreur tiennent 3:1 sur la
 *      page et sur la surface, border.default reste sous 3 (jamais pour un champ), les textes tiennent 4,5:1 ;
 *   H3 variables ds- ajoutées à la table Vuetify : couleurs égales à leurs rôles, dimensions, styles de texte (corps
 *      moyen, mention, titre de carte) et consigne de hauteur de capitale, dans les dix thèmes ; le contour de la carte
 *      est sans paire, décoratif ;
 *   H4 descriptions corrigées de border.default et background.component, mot pour mot (border.default garde la formule que
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
  ['border.strong', 'background.surface', '#958f84', '#ffffff', 3.21, '#6a665c', '#181818', 3.1],
  ['border.strong', 'background.app', '#958f84', '#fbfbfb', 3.1, '#6a665c', '#121212', 3.27],
  ['border.default', 'background.surface', '#bfbbb5', '#ffffff', 1.91, '#45423b', '#181818', 1.77],
  ['border.default', 'background.app', '#bfbbb5', '#fbfbfb', 1.85, '#45423b', '#121212', 1.87],
  ['border.error', 'background.surface', '#e76862', '#ffffff', 3.2, '#c6232c', '#181818', 3.11],
  ['border.error', 'background.app', '#e76862', '#fbfbfb', 3.1, '#c6232c', '#121212', 3.28],
  ['text.secondary', 'background.surface', '#6d675b', '#ffffff', 5.61, '#8f8b81', '#181818', 5.22],
  ['text.secondary', 'background.app', '#6d675b', '#fbfbfb', 5.42, '#8f8b81', '#121212', 5.51],
  ['text.error', 'background.surface', '#cb1d2a', '#ffffff', 5.6, '#ff978f', '#181818', 8.52],
  ['text.error', 'background.app', '#cb1d2a', '#fbfbfb', 5.41, '#ff978f', '#121212', 8.99],
  ['text.default', 'background.surface', '#363026', '#ffffff', 13.06, '#d8d5ce', '#181818', 12.12],
  ['text.default', 'background.app', '#363026', '#fbfbfb', 12.62, '#d8d5ce', '#121212', 12.78],
  ['text.disabled', 'background.disabled', '#8a8478', '#f3f2f1', 3.32, '#7d786c', '#1b1b1b', 3.92],
  ['border.subtle', 'background.app', '#d8d6d2', '#fbfbfb', 1.4, '#303030', '#121212', 1.42],
  ['background.surface', 'background.app', '#ffffff', '#fbfbfb', 1.03, '#181818', '#121212', 1.06],
  ['border.default', 'border.strong', '#bfbbb5', '#958f84', 1.68, '#45423b', '#6a665c', 1.75],
];
/** Seuils de l'attendu : [devant, fond, seuil, passe]. */
const SEUILS = [
  ['border.strong', 'background.surface', 3, true], ['border.strong', 'background.app', 3, true],
  ['border.error', 'background.surface', 3, true], ['border.error', 'background.app', 3, true],
  ['border.default', 'background.surface', 3, false], ['border.default', 'background.app', 3, false],
  ['text.secondary', 'background.surface', 4.5, true], ['text.secondary', 'background.app', 4.5, true],
  ['text.error', 'background.surface', 4.5, true], ['text.error', 'background.app', 4.5, true],
  ['text.default', 'background.surface', 4.5, true], ['text.default', 'background.app', 4.5, true],
];
/** Anneau de focus par thème : [couleur, sur background.surface, sur background.app]. */
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
  'ds-border-radius-surface': '12px',
  'ds-gap-within-component': '4px',
  'ds-gap-between-components': '16px',
  'ds-body-font-size': '16px',
  'ds-body-font-weight': '400',
  'ds-body-line-height': '1.5',
  'ds-supporting-text-font-size': '12px',
  'ds-supporting-text-font-weight': '400',
  'ds-supporting-text-line-height': '1.3333',
  'ds-card-title-font-size': '20px',
  'ds-card-title-font-weight': '600',
  'ds-card-title-line-height': '1.4',
  'ds-card-title-cap-height': '0.7',
};
/** Variables de couleur ajoutées → leur rôle. */
const COULEURS = { 'ds-text-secondary': 'text.secondary', 'ds-text-error': 'text.error', 'ds-border-error': 'border.error', 'ds-card-border': 'border.default' };
/** Variables de police ajoutées → la police du thème qu'elles reprennent. */
const POLICES = { 'ds-body-font-family': 'font-body', 'ds-supporting-text-font-family': 'font-body', 'ds-card-title-font-family': 'font-heading' };

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

test('H1 arrondi de surface : {radius.12}, 12 px dans les dix thèmes', () => {
  const sem = charger('semantique.tokens.json');
  assert.equal(sem['border-radius'].surface.$value, '{radius.12}');
  for (const m of MARQUES) for (const mode of MODES) {
    const { jetons } = theme(m, mode);
    const { valeur } = resoudreAlias(jetons, '{radius.12}', { depuis: 'border-radius.surface', chaine: ['border-radius.surface'] });
    assert.deepEqual(valeur, { value: 12, unit: 'px' }, `${m}-${mode}`);
    assert.equal(jetons.get('border-radius.surface')?.$value, '{radius.12}', `${m}-${mode}`);
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
    assert.deepEqual([hex('border.focus'), r2(hex('border.focus'), hex('background.surface')), r2(hex('border.focus'), hex('background.app'))], [c, surface, app], `${nom} : focus`);
  }
});

test('H3 variables ds- du champ et de la carte, dans les dix thèmes', () => {
  const table = lireTable();
  assert.equal(table.variables['ds-card-border'].jeton, 'border.default');
  assert.match(String(table.variables['ds-card-border'].sansPaire), /décorative/);
  assert.equal(table.variables['ds-card-title-cap-height'].jeton, 'font.heading.cap-height');
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
  // Réécrites pour le lecteur des fiches (DOC3, D57) ; le texte d'avant reste dans la note de l'équipe, mot pour mot.
  assert.equal(sem.border.default.$description, 'Contour ordinaire d\'une carte ou d\'un séparateur, décoratif, jamais seule pour repérer un champ ou un état.');
  assert.equal(sem.border.default.$extensions['ds-lab.note'], 'Contour ordinaire d\'une carte ou d\'un séparateur, décoratif, jamais seule pour repérer un champ ou un état (sous 3:1 : un champ prend border.strong).');
  // DsTag ne lit plus background.component (background.tint, docs/attendus/carte-membre-liste.md) : l'exemple d'usage est retiré.
  assert.equal(sem.background.component.$root.$description, 'Fond d\'un composant au repos, plus soutenu que la surface.');
  assert.equal(sem.background.component.$root.$extensions['ds-lab.note'], 'Fond d\'un composant au repos, plus soutenu que la surface ; un champ, une carte et le bouton secondaire se posent sur background.surface.');
});
