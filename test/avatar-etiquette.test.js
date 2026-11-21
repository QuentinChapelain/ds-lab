// @ts-check
/**
 * Règle des initiales de l'avatar, et jetons de l'avatar et de l'étiquette dans les dix thèmes (cinq marques
 * fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (19/11/2026, docs/attendus/avatar-etiquette.md) ; couleurs lues dans les
 * jetons par un résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   A1 la règle des initiales (atelier/composants/initiales.js), sur les quinze cas de l'attendu, noms fictifs : une ou
 *      deux capitales, ou rien pour un nom sans lettre ; le nom lu, débarrassé de ses espaces en trop ;
 *   A2 primitives size.24 et size.56 ; neuf rôles ajoutés, leurs alias et leurs valeurs, les mêmes dans les dix
 *      thèmes sauf text.brand (pas 12 du primaire) ; deux styles des initiales ; la paire text.brand sur
 *      background.brand.subtle en fin de paires.json ;
 *   A3 rapports des deux tableaux de couleurs de l'attendu, à deux décimales : étiquette neutre (text.default sur
 *      background.component) et pastel neutre contre la carte et la page, les mêmes dans les cinq marques par mode ;
 *      initiales et étiquette « marque » (text.brand sur background.brand.subtle) et pastel de marque, par thème ; chaque
 *      texte tient 4,5:1 ;
 *   A4 table Vuetify : les couleurs marque-teinte et teinte égales à leurs rôles, et les 18 variables ds- de l'avatar
 *      et de l'étiquette, dans les dix thèmes.
 *
 * Fonds teintés de DsTag et DsAvatar (20/11/2026, docs/attendus/carte-membre-liste.md), attendus écrits à la main avant
 * le code, valeurs lues dans les jetons d'avant par un résolveur écrit à part, rapports par culori 4.0.2 :
 *   A5 emplacements color.tint (pas 3 du neutre en clair, pas 5 en sombre) et brand.primary.tint (pas 3 du
 *      primaire en clair, pas 5 en sombre) ; rôles background.tint et background.brand.tint, alias de ces emplacements ;
 *      background.component et background.brand.subtle inchangés ; les deux paires en fin de paires.json ;
 *   A6 valeurs et rapports de l'attendu, à deux décimales, dans les dix thèmes : chaque texte au-dessus de 10:1, et,
 *      en sombre, chaque fond teinté à 1,19:1 au moins contre la surface.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from '../src/tokens/roles.js';
import { themesVuetify } from '../src/tokens/vuetify.js';
import { charger } from './helpers/jetons.js';
import { initiales, nomLu } from '../atelier/composants/initiales.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto', 'orbe-cafe'];
const MODES = /** @type {const} */ (['light', 'dark']);

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
  'border-radius.full': ['{radius.full}', 9999],
  'avatar-size.medium': ['{size.40}', 40],
  'avatar-size.large': ['{size.56}', 56],
  'height.tag': ['{size.24}', 24],
  'padding.tag': ['{space.12}', 12],
  'gap.between-tags': ['{space.8}', 8],
};
/** Styles des initiales. */
const STYLES = {
  'initials.medium': { fontFamily: '{brand.font.body}', fontSize: '{font-size.16}', fontWeight: '{font-weight.600}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1.5 },
  'initials.large': { fontFamily: '{brand.font.body}', fontSize: '{font-size.24}', fontWeight: '{font-weight.600}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1.3333 },
};

/** Paires communes : [devant, fond, clair : devant, fond, rapport, sombre : devant, fond, rapport]. */
const COMMUNES = [
  ['text.default', 'background.component', '#363026', '#f3f2f1', 11.68, '#d8d5ce', '#1b1b1b', 11.75],
  ['background.component', 'background.surface', '#f3f2f1', '#ffffff', 1.12, '#1b1b1b', '#181818', 1.03],
  ['background.component', 'background.app', '#f3f2f1', '#fbfbfb', 1.08, '#1b1b1b', '#121212', 1.09],
];
/** Rôles de la marque, par thème : [text.brand, background.brand.subtle, rapport, pastel contre background.surface, contre background.app]. */
const MARQUE = {
  'atelier-lavandine-light': ['#470c7e', '#f5f1fe', 11.65, 1.11, 1.07],
  'atelier-lavandine-dark': ['#ddcefd', '#1d1925', 11.76, 1.03, 1.09],
  'ecume-et-sel-light': ['#003647', '#e3f6fe', 11.66, 1.11, 1.07],
  'ecume-et-sel-dark': ['#ebf9ff', '#1b1b1b', 16.02, 1.03, 1.09],
  'grenat-papeterie-light': ['#2d000f', '#fcf0f2', 16.88, 1.11, 1.07],
  'grenat-papeterie-dark': ['#fec7d2', '#2f1119', 11.78, 1.03, 1.08],
  'maison-alberto-light': ['#402e00', '#fbf3e1', 11.82, 1.1, 1.07],
  'maison-alberto-dark': ['#feeecb', '#1d1b17', 14.99, 1.03, 1.09],
  'orbe-cafe-light': ['#103060', '#f1f3f7', 11.71, 1.11, 1.07],
  'orbe-cafe-dark': ['#bdd7fe', '#111b2a', 11.79, 1.03, 1.08],
};
/** Variables ajoutées, hors polices, les mêmes dans les dix thèmes. */
const VALEURS = {
  'ds-border-radius-full': '9999px',
  'ds-avatar-size-medium': '40px',
  'ds-avatar-size-large': '56px',
  'ds-initials-medium-font-size': '16px',
  'ds-initials-medium-font-weight': '600',
  'ds-initials-medium-line-height': '1.5',
  'ds-initials-large-font-size': '24px',
  'ds-initials-large-font-weight': '600',
  'ds-initials-large-line-height': '1.3333',
  'ds-height-tag': '24px',
  'ds-padding-tag': '12px',
  'ds-gap-between-tags': '8px',
  'ds-body-small-font-size': '14px',
  'ds-body-small-font-weight': '400',
  'ds-body-small-line-height': '1.4286',
};
/** Variables de police ajoutées : toutes reprennent la police du texte de la marque (font-body). */
const POLICES = ['ds-initials-medium-font-family', 'ds-initials-large-font-family', 'ds-body-small-font-family'];

/** Rapport culori à deux décimales. @param {string} a @param {string} b */
const r2 = (a, b) => Math.round(wcagContrast(a, b) * 100) / 100;
/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));

/** Rôles et jetons d'un thème. @param {string} marque @param {'light' | 'dark'} mode */
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
  assert.deepEqual(prims.size['24'].$value, { value: 24, unit: 'px' });
  assert.deepEqual(prims.size['56'].$value, { value: 56, unit: 'px' });
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.text.brand.$root.$value, '{brand.primary.12}');
  const at = (/** @type {string} */ p) => p.split('.').reduce((/** @type {any} */ n, k) => n?.[k], sem);
  for (const [style, v] of Object.entries(STYLES)) assert.deepEqual(at(`typography.${style}`).$value, v, style);
  for (const m of MARQUES) for (const mode of MODES) {
    const { jetons } = theme(m, mode);
    for (const [role, [alias, px]] of Object.entries(DIMENSIONS)) {
      assert.equal(jetons.get(role)?.$value, alias, `${m}-${mode} ${role}`);
      const { valeur } = resoudreAlias(jetons, /** @type {string} */ (alias), { depuis: role, chaine: [role] });
      assert.deepEqual(valeur, { value: px, unit: 'px' }, `${m}-${mode} ${role}`);
    }
  }
  const paires = charger('paires.json').pairs;
  // Suivie des deux paires des fonds teintés (A5).
  assert.deepEqual(paires.at(-3), { foreground: 'text.brand', background: 'background.brand.subtle', type: 'text' });
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
      [hex('text.brand'), hex('background.brand.subtle'), r2(hex('text.brand'), hex('background.brand.subtle')), r2(hex('background.brand.subtle'), hex('background.surface')), r2(hex('background.brand.subtle'), hex('background.app'))],
      [t, f, r, surface, app],
      `${nom} : marque`,
    );
    for (const [devant, fond] of [['text.brand', 'background.brand.subtle'], ['text.default', 'background.component']]) assert.ok(wcagContrast(hex(devant), hex(fond)) >= 4.5, `${nom} : ${devant} sur ${fond}`);
  }
});

test('A4 couleurs et variables ds- de l\'avatar et de l\'étiquette, dans les dix thèmes', () => {
  for (const m of MARQUES) {
    const themes = Object.values(themesVuetify(join(ROOT, 'tokens', m)).themes);
    for (const [i, mode] of MODES.entries()) {
      const { colors, variables: x } = themes[i];
      const { hex } = theme(m, mode);
      // DsTag et DsAvatar lisent les fonds teintés (A5) : les deux couleurs prennent leur nom.
      assert.deepEqual([colors['brand-tint'], colors['on-brand-tint']], [hex('background.brand.tint'), hex('text.brand')], `${m}-${mode} brand-tint`);
      assert.deepEqual([colors.tint, colors['on-tint']], [hex('background.tint'), hex('text.default')], `${m}-${mode} tint`);
      for (const k of ['marque-discret', 'composant']) assert.equal(colors[k], undefined, `${m}-${mode} ${k}`);
      for (const [k, v] of Object.entries(VALEURS)) assert.equal(x[k], v, `${m}-${mode} ${k}`);
      for (const k of POLICES) assert.deepEqual(noms(x[k]), noms(x['font-body']), `${m}-${mode} ${k}`);
    }
  }
});

/** Fonds teintés, par thème : [background.tint, rapport de text.default dessus, contre background.surface, contre background.app,
 * background.brand.tint, rapport de text.brand dessus, contre background.surface, contre background.app]. */
const TEINTES = {
  'atelier-lavandine-light': ['#f3f2f1', 11.68, 1.12, 1.08, '#f5f1fe', 11.65, 1.11, 1.07],
  'atelier-lavandine-dark': ['#282828', 10.06, 1.2, 1.27, '#2c243b', 10.07, 1.2, 1.27],
  'ecume-et-sel-light': ['#f3f2f1', 11.68, 1.12, 1.08, '#e3f6fe', 11.66, 1.11, 1.07],
  'ecume-et-sel-dark': ['#282828', 10.06, 1.2, 1.27, '#22292c', 13.74, 1.2, 1.27],
  'grenat-papeterie-light': ['#f3f2f1', 11.68, 1.12, 1.08, '#fcf0f2', 16.88, 1.11, 1.07],
  'grenat-papeterie-dark': ['#282828', 10.06, 1.2, 1.27, '#461825', 10.1, 1.2, 1.26],
  'maison-alberto-light': ['#f3f2f1', 11.68, 1.12, 1.08, '#fbf3e1', 11.82, 1.1, 1.07],
  'maison-alberto-dark': ['#282828', 10.06, 1.2, 1.27, '#2b271e', 12.97, 1.19, 1.26],
  'orbe-cafe-light': ['#f3f2f1', 11.68, 1.12, 1.08, '#f1f3f7', 11.71, 1.11, 1.07],
  'orbe-cafe-dark': ['#282828', 10.06, 1.2, 1.27, '#19283f', 10.11, 1.2, 1.26],
};

test('A5 emplacements et rôles des fonds teintés ; background.component et background.brand.subtle inchangés', () => {
  assert.equal(charger('primitives.tokens.json').color.tint.$value, '{color.neutral.3}');
  assert.equal(charger('aplat.tokens.json').brand.primary.tint.$value, '{brand.primary.3}');
  const sombre = JSON.parse(readFileSync(join(ROOT, 'tokens', 'commun', 'mode.sombre.tokens.json'), 'utf8'));
  assert.equal(sombre.color.tint.$value, '{color.neutral.5}');
  assert.equal(sombre.brand.primary.tint.$value, '{brand.primary.5}');
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.background.tint.$value, '{color.tint}');
  assert.equal(sem.background.brand.tint.$value, '{brand.primary.tint}');
  assert.equal(sem.background.component.$root.$value, '{color.neutral.3}');
  assert.equal(sem.background.brand.subtle.$value, '{brand.primary.3}');
  assert.deepEqual(charger('paires.json').pairs.slice(-2), [
    { foreground: 'text.default', background: 'background.tint', type: 'text' },
    { foreground: 'text.brand', background: 'background.brand.tint', type: 'text' },
  ]);
});

test('A6 valeurs et rapports des fonds teintés, dans les dix thèmes', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const nom = `${m}-${mode}`;
    const { hex } = theme(m, mode);
    const [n, nt, ns, na, b, bt, bs, ba] = TEINTES[/** @type {keyof typeof TEINTES} */ (nom)];
    const t = hex('background.tint');
    const mt = hex('background.brand.tint');
    assert.deepEqual(
      [t, r2(hex('text.default'), t), r2(t, hex('background.surface')), r2(t, hex('background.app')), mt, r2(hex('text.brand'), mt), r2(mt, hex('background.surface')), r2(mt, hex('background.app'))],
      [n, nt, ns, na, b, bt, bs, ba],
      nom,
    );
    assert.ok(nt >= 10 && bt >= 10, `${nom} : texte au-dessus de 10:1`);
    if (mode === 'dark') assert.ok(ns >= 1.19 && bs >= 1.19, `${nom} : détaché de la surface`);
  }
});
