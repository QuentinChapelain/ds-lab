// @ts-check
/**
 * Règle des initiales de l'avatar, et jetons de l'avatar et de l'étiquette dans les dix thèmes (cinq marques
 * fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (19/11/2026, docs/attendus/avatar-etiquette.md) ; couleurs lues dans les
 * jetons par un résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   A1 la règle des initiales (atelier/composants/initiales.js), sur les quinze cas de l'attendu, noms fictifs : une ou
 *      deux capitales, ou rien pour un nom sans lettre ; le nom lu, débarrassé de ses espaces en trop ;
 *   A2 primitives taille.24 et taille.56 ; neuf rôles ajoutés, leurs alias et leurs valeurs, les mêmes dans les dix
 *      thèmes sauf texte.marque (pas 12 du primaire) ; deux styles des initiales ; la paire texte.marque sur
 *      fond.marque.discret en fin de paires.json ;
 *   A3 rapports des deux tableaux de couleurs de l'attendu, à deux décimales : étiquette neutre (texte.principal sur
 *      fond.composant) et pastel neutre contre la carte et la page, les mêmes dans les cinq marques par mode ;
 *      initiales et étiquette « marque » (texte.marque sur fond.marque.discret) et pastel de marque, par thème ; chaque
 *      texte tient 4,5:1 ;
 *   A4 table Vuetify : les couleurs marque-discret et composant égales à leurs rôles, et les 18 variables ds- de l'avatar
 *      et de l'étiquette, dans les dix thèmes.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from '../src/tokens/roles.js';
import { themesVuetify } from '../src/tokens/vuetify.js';
import { charger } from './helpers/jetons.js';
import { initiales, nomLu } from '../atelier/composants/initiales.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto', 'orbe-cafe'];
const MODES = /** @type {const} */ (['clair', 'sombre']);

/** Les quinze cas de la règle des initiales → lettres attendues ; « » pour un nom vide ou sans lettre, refusé par le menu. */
const INITIALES = [
  ['Camille Ferrand', 'CF'],
  ['Jean-Baptiste Morel', 'JM'],
  ['Marie-Lou', 'ML'],
  ['Noé', 'N'],
  ['Hugo de Lassalle', 'HL'],
  ['de Lassalle', 'L'],
  ["Inès d'Aubrac", 'IA'],
  ['Inès d’Aubrac', 'IA'],
  ['Émile Brun', 'ÉB'],
  ['élodie brun', 'ÉB'],
  ['  Camille   Ferrand ', 'CF'],
  ['Ana María Ruiz Soler', 'AS'],
  ['李小龙', '李'],
  ['', ''],
  ['   ', ''],
  ['123', ''],
  ['—', ''],
];

/** Rôles de dimension ajoutés → [alias, valeur], les mêmes dans les dix thèmes. */
const DIMENSIONS = {
  'arrondi.pilule': ['{rayon.pilule}', 9999],
  'taille-avatar.normale': ['{taille.40}', 40],
  'taille-avatar.grande': ['{taille.56}', 56],
  'hauteur.etiquette': ['{taille.24}', 24],
  'marge-interieure.etiquette': ['{espace.12}', 12],
  'ecart.entre-etiquettes': ['{espace.8}', 8],
};
/** Styles des initiales. */
const STYLES = {
  'initiales.normale': { fontFamily: '{marque.police.texte}', fontSize: '{taille-texte.16}', fontWeight: '{graisse.600}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1.5 },
  'initiales.grande': { fontFamily: '{marque.police.texte}', fontSize: '{taille-texte.24}', fontWeight: '{graisse.600}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1.3333 },
};

/** Paires communes : [devant, fond, clair : devant, fond, rapport, sombre : devant, fond, rapport]. */
const COMMUNES = [
  ['texte.principal', 'fond.composant', '#363026', '#f3f2f1', 11.68, '#d8d5ce', '#1b1b1b', 11.75],
  ['fond.composant', 'fond.surface', '#f3f2f1', '#ffffff', 1.12, '#1b1b1b', '#181818', 1.03],
  ['fond.composant', 'fond.app', '#f3f2f1', '#fbfbfb', 1.08, '#1b1b1b', '#121212', 1.09],
];
/** Rôles de la marque, par thème : [texte.marque, fond.marque.discret, rapport, pastel contre fond.surface, contre fond.app]. */
const MARQUE = {
  'atelier-lavandine-clair': ['#470c7e', '#f5f1fe', 11.65, 1.11, 1.07],
  'atelier-lavandine-sombre': ['#ddcefd', '#1d1925', 11.76, 1.03, 1.09],
  'ecume-et-sel-clair': ['#003647', '#e3f6fe', 11.66, 1.11, 1.07],
  'ecume-et-sel-sombre': ['#ebf9ff', '#1b1b1b', 16.02, 1.03, 1.09],
  'grenat-papeterie-clair': ['#2d000f', '#fcf0f2', 16.88, 1.11, 1.07],
  'grenat-papeterie-sombre': ['#fec7d2', '#2f1119', 11.78, 1.03, 1.08],
  'maison-alberto-clair': ['#402e00', '#fbf3e1', 11.82, 1.1, 1.07],
  'maison-alberto-sombre': ['#feeecb', '#1d1b17', 14.99, 1.03, 1.09],
  'orbe-cafe-clair': ['#103060', '#f1f3f7', 11.71, 1.11, 1.07],
  'orbe-cafe-sombre': ['#bdd7fe', '#111b2a', 11.79, 1.03, 1.08],
};
/** Variables ajoutées, hors polices, les mêmes dans les dix thèmes. */
const VALEURS = {
  'ds-arrondi-pilule': '9999px',
  'ds-taille-avatar-normale': '40px',
  'ds-taille-avatar-grande': '56px',
  'ds-initiales-normale-taille': '16px',
  'ds-initiales-normale-graisse': '600',
  'ds-initiales-normale-interligne': '1.5',
  'ds-initiales-grande-taille': '24px',
  'ds-initiales-grande-graisse': '600',
  'ds-initiales-grande-interligne': '1.3333',
  'ds-hauteur-etiquette': '24px',
  'ds-marge-interieure-etiquette': '12px',
  'ds-ecart-entre-etiquettes': '8px',
  'ds-corps-petit-taille': '14px',
  'ds-corps-petit-graisse': '400',
  'ds-corps-petit-interligne': '1.4286',
};
/** Variables de police ajoutées : toutes reprennent la police du texte de la marque (font-body). */
const POLICES = ['ds-initiales-normale-police', 'ds-initiales-grande-police', 'ds-corps-petit-police'];

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
  return { hex, jetons };
}

test('A1 règle des initiales : les quinze cas de l\'attendu', () => {
  for (const [nom, lettres] of INITIALES) assert.equal(initiales(nom), lettres, JSON.stringify(nom));
  assert.equal(nomLu('  Camille   Ferrand '), 'Camille Ferrand');
  assert.equal(nomLu('Inès d’Aubrac'), 'Inès d’Aubrac');
});

test('A2 primitives, rôles, styles et paire de l\'avatar et de l\'étiquette', () => {
  const prims = charger('primitives.tokens.json');
  assert.deepEqual(prims.taille['24'].$value, { value: 24, unit: 'px' });
  assert.deepEqual(prims.taille['56'].$value, { value: 56, unit: 'px' });
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.texte.marque.$root.$value, '{marque.primaire.12}');
  const at = (/** @type {string} */ p) => p.split('.').reduce((/** @type {any} */ n, k) => n?.[k], sem);
  for (const [style, v] of Object.entries(STYLES)) assert.deepEqual(at(`typo.${style}`).$value, v, style);
  for (const m of MARQUES) for (const mode of MODES) {
    const { jetons } = theme(m, mode);
    for (const [role, [alias, px]] of Object.entries(DIMENSIONS)) {
      assert.equal(jetons.get(role)?.$value, alias, `${m}-${mode} ${role}`);
      const { valeur } = resoudreAlias(jetons, /** @type {string} */ (alias), { depuis: role, chaine: [role] });
      assert.deepEqual(valeur, { value: px, unit: 'px' }, `${m}-${mode} ${role}`);
    }
  }
  const paires = charger('paires.json').paires;
  assert.deepEqual(paires.at(-1), { devant: 'texte.marque', fond: 'fond.marque.discret', type: 'texte' });
});

test('A3 rapports de l\'avatar et de l\'étiquette, dans les dix thèmes', () => {
  for (const m of MARQUES) for (const [i, mode] of MODES.entries()) {
    const nom = `${m}-${mode}`;
    const { hex } = theme(m, mode);
    for (const p of COMMUNES) {
      const [devant, fond] = /** @type {[string, string]} */ (p);
      const [d, f, r] = p.slice(2 + i * 3, 5 + i * 3);
      assert.deepEqual([hex(devant), hex(fond), r2(hex(devant), hex(fond))], [d, f, r], `${nom} : ${devant} sur ${fond}`);
    }
    const [t, f, r, surface, app] = MARQUE[/** @type {keyof typeof MARQUE} */ (nom)];
    assert.deepEqual(
      [hex('texte.marque'), hex('fond.marque.discret'), r2(hex('texte.marque'), hex('fond.marque.discret')), r2(hex('fond.marque.discret'), hex('fond.surface')), r2(hex('fond.marque.discret'), hex('fond.app'))],
      [t, f, r, surface, app],
      `${nom} : marque`,
    );
    for (const [devant, fond] of [['texte.marque', 'fond.marque.discret'], ['texte.principal', 'fond.composant']]) assert.ok(wcagContrast(hex(devant), hex(fond)) >= 4.5, `${nom} : ${devant} sur ${fond}`);
  }
});

test('A4 couleurs et variables ds- de l\'avatar et de l\'étiquette, dans les dix thèmes', () => {
  for (const m of MARQUES) {
    const themes = Object.values(themesVuetify(join(ROOT, 'tokens', m)).themes);
    for (const [i, mode] of MODES.entries()) {
      const { colors, variables: x } = themes[i];
      const { hex } = theme(m, mode);
      assert.deepEqual([colors['marque-discret'], colors['on-marque-discret']], [hex('fond.marque.discret'), hex('texte.marque')], `${m}-${mode} marque-discret`);
      assert.deepEqual([colors.composant, colors['on-composant']], [hex('fond.composant'), hex('texte.principal')], `${m}-${mode} composant`);
      for (const [k, v] of Object.entries(VALEURS)) assert.equal(x[k], v, `${m}-${mode} ${k}`);
      for (const k of POLICES) assert.deepEqual(noms(x[k]), noms(x['font-body']), `${m}-${mode} ${k}`);
    }
  }
});
