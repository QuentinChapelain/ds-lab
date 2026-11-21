// @ts-check
/**
 * Thèmes Vuetify de chaque marque, écrits par npm run vuetify (src/tokens/vuetify.js) depuis la table commune
 * tokens/commun/vuetify.json, versionnés dans tokens/<marque>/vuetify.json (docs/attendus/atelier.md ; D41).
 *
 * Attendus écrits à la main avant le code (18/11/2026) :
 *   V1 la table nomme les 13 fonds que Vuetify 4.3.4 définit par défaut (genDefaults, lib/composables/theme.js de
 *      vuetify) : background, surface, surface-bright, surface-light, surface-variant, primary, primary-darken-1,
 *      secondary, secondary-darken-1, error, info, success, warning ; aucune clé en on- (le texte de chaque fond est
 *      écrit on-<clé>) ; chaque fond et son texte forment une paire de type texte de paires.json ; polices : font-body
 *      ← brand.font.body, font-heading ← brand.font.heading ; les lignes primary-darken-1, surface-variant,
 *      surface-bright et surface-light disent [H] ; secondary dit « Jamais une couleur de bouton (D05) » ;
 *   V2 chaque marque a deux thèmes, <dossier>-light (dark false) et <dossier>-dark (dark true), et son nom lu dans
 *      le resolver ; chaque thème a 26 couleurs (13 fonds, 13 textes) qui couvrent les 14 clés par défaut de Vuetify
 *      (les 13 fonds et on-surface-variant) : Vuetify n'a aucun texte à calculer ;
 *   V3 valeurs mesurées dans le navigateur par l'essai du 18/11/2026 (local/essai-storybook/rapport.md, Q2 et Q3,
 *      fond et texte du bouton ; background.app et background.surface lus dans themes.generated.json de l'essai) :
 *        orbe-cafe-light      primary #2b4c7e, on-primary #ffffff, background #fbfbfb, surface #ffffff,
 *                             on-background #363026, on-surface #363026 ;
 *        orbe-cafe-dark     primary #86b6fe, on-primary #0e1218, background #121212, surface #181818,
 *                             on-background #d8d5ce, on-surface #d8d5ce ;
 *        maison-alberto-light primary #836304 (pas 11, plein moyen), on-primary #ffffff ;
 *        maison-alberto-dark primary #ffd060, on-primary #121212 ;
 *      et, pour toutes les marques, chaque couleur égale la valeur du rôle que nomme la table, lue par le lecteur ;
 *   V4 chaque couleur et son texte : au moins 4,5:1 (culori wcagContrast, oracle indépendant), dans chaque thème ;
 *   V5 polices, au format des planches (nom entre guillemets s'il a une espace) :
 *        orbe-cafe      font-body "Orbe Sans", Arial, sans-serif ; font-heading Georgia, serif ;
 *        maison-alberto font-body system-ui, sans-serif (police du produit, D16) ; font-heading "National Park", sans-serif ;
 *      et, pour toutes les marques, la liste des noms égale celle de --brand-font-body et --brand-font-heading de
 *      sa feuille jetons.css, écrite par Terrazzo ;
 *   V6 tokens/<marque>/vuetify.json versionné égale une génération neuve ; deux générations sont identiques ;
 *   V7 une table fausse est une panne qui la nomme : rôle absent (« rôle absent : fond.inexistant »), paire hors de
 *      paires.json (« paire hors de paires.json : text.default sur background.interactive.strong »), clé en on-
 *      (« clé en on- : on-primary ») ;
 *   V8 npm run vuetify -- --marque <dossier> : sortie 0, « ✓ vuetify.json inchangé » ; sans l'option, un bloc par
 *      marque ; option inconnue : sortie 2.
 *
 * Ajouts pour l'enveloppe du bouton (18/11/2026, docs/attendus/bouton.md), écrits à la main avant le code :
 *   V1 après les 13 fonds, cinq couleurs nommées d'après nos rôles : error-strong-hover, component-hover,
 *      interactive-subtle, error-subtle, disabled, chacune en paire de paires.json ;
 *   V2 36 couleurs par thème (18 fonds, 18 textes) ;
 *   V4 seule disabled est sous 4,5:1, et sa paire porte une exception écrite (3,32 en clair, 3,92 en sombre) ;
 *   V9 variables ds- de chaque thème : arrondi 8px, hauteurs 40px et 32px, contour 1px, anneau 2px décalé de 2px, icônes 20px et 16px, écart
 *      icône-texte 8px, marge intérieure 16px, libellé 14px, graisse 600, interligne 1.4286, dans les dix thèmes ;
 *      ds-focus, ds-border et ds-border-disabled égaux à border.focus, border.strong et border.subtle lus par
 *      le lecteur ; chez Orbe Café #4c6994, #958f84, #d8d6d2 en clair et #86b6fe, #6a665c, #303030 en sombre ;
 *   V7 variable fausse, panne qui la nomme : sans le préfixe ds-, champ inconnu, couleur sans paire ni unpaired,
 *      unpaired sur un trait qui a sa paire, jeton absent.
 *
 * Ajouts pour la police du libellé (18/11/2026, D44, docs/attendus/finitions-bouton.md) :
 *   V9 une 17e variable, ds-label-font-family = system-ui, sans-serif dans les dix thèmes, alors que font-body garde la
 *      police du texte de la marque ;
 *   V5 la feuille jetons.css écrit la police du texte du commun en renvoi (var(--font-product)) : la comparaison
 *      suit le renvoi.
 *
 * Ajouts pour le champ de texte et la carte (19/11/2026, docs/attendus/champ-carte.md) :
 *   V9 20 variables de plus, 37 en tout ; leurs valeurs sont jugées par H3 (test/champ-carte-jetons.test.js).
 *
 * Ajouts pour l'avatar et l'étiquette (19/11/2026, docs/attendus/avatar-etiquette.md) :
 *   V1 deux couleurs après celles du bouton, marque-discret (background.brand.subtle, text.brand) et composant
 *      (background.component, text.default), chacune en paire de paires.json ;
 *   V2 40 couleurs par thème (20 fonds, 20 textes) ;
 *   V9 18 variables de plus, 55 en tout ; leurs valeurs sont jugées par A4 (test/avatar-etiquette.test.js).
 * Titre 4 de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : V9 quatre variables ds-heading-4-*, 59 en tout,
 *   16px, 700 et 1.5, dans la police du texte de la marque.
 * Fonds teintés (20/11/2026, docs/attendus/carte-membre-liste.md) : les deux couleurs deviennent brand-tint
 *   (background.brand.tint, text.brand) et tint (background.tint, text.default), à la même place ; toujours 40.
 * Écart entre blocs de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : V9 ds-gap-between-blocks, 8px, 60 en tout ;
 *   puis ds-width-column, 640px, la largeur maximale de MemberList, 61 en tout.
 * Fond de DsAvatar (D63) : V1 une couleur après les fonds teintés, avatar (background.avatar, text.brand), en paire
 *   de paires.json ; V2 42 couleurs par thème.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { themesVuetify, texteThemes, lireTable, THEMES } from '../src/tokens/vuetify.js';
import { dossiersDeMarque, nomDeMarque, COMMUN } from '../src/tokens/resolver.js';
import { loadRoles, resolveRoles } from '../src/tokens/roles.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = dossiersDeMarque();
const FONDS = ['background', 'surface', 'surface-bright', 'surface-light', 'surface-variant', 'primary', 'primary-darken-1', 'secondary', 'secondary-darken-1', 'error', 'info', 'success', 'warning'];
const DEFAUTS = [...FONDS, 'on-surface-variant'];
/** Couleurs de l'enveloppe du bouton, après les fonds de Vuetify. */
const BOUTON = ['error-strong-hover', 'component-hover', 'interactive-subtle', 'error-subtle', 'disabled'];
/** Couleurs de l'avatar et de l'étiquette (docs/attendus/avatar-etiquette.md), après celles du bouton. */
const AVATAR_ETIQUETTE = ['brand-tint', 'tint', 'avatar'];
const COULEURS = [...FONDS, ...BOUTON, ...AVATAR_ETIQUETTE];
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const brute = () => lire(join(COMMUN, 'vuetify.json'));
const dossier = (/** @type {string} */ m) => join(ROOT, 'tokens', m);
/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));

test('V1 table : les 13 fonds par défaut de Vuetify, puis ceux du bouton, un texte chacun, en paire de paires.json', () => {
  const t = brute();
  assert.deepEqual(Object.keys(t.colors).filter((k) => !k.startsWith('$')), COULEURS);
  const paires = lire(join(COMMUN, 'paires.json')).pairs.filter((/** @type {any} */ p) => p.type === 'text');
  for (const k of COULEURS) {
    const { background: fond, text: texte } = t.colors[k];
    assert.ok(paires.some((/** @type {any} */ p) => p.background === fond && p.foreground === texte), `${k} : ${texte} sur ${fond}`);
  }
  assert.deepEqual(Object.fromEntries(Object.entries(t.fonts).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, /** @type {any} */ (v).token])), { 'font-body': 'brand.font.body', 'font-heading': 'brand.font.heading' });
  for (const k of ['primary-darken-1', 'surface-variant', 'surface-bright', 'surface-light']) assert.match(t.colors[k].$description, /\[H\]/, k);
  for (const k of ['primary', 'background', 'surface', 'error', 'info', 'success', 'warning']) assert.doesNotMatch(t.colors[k].$description, /\[H\]/, k);
  assert.match(t.colors.secondary.$description, /Jamais une couleur de bouton \(D05\)/);
});

test('V2 deux thèmes nommés par marque, 42 couleurs qui couvrent les défauts de Vuetify', () => {
  assert.equal(MARQUES.length, 5);
  for (const d of MARQUES) {
    const r = themesVuetify(d);
    const slug = d.split('/').filter(Boolean).pop();
    assert.equal(r.nom, nomDeMarque(d));
    assert.deepEqual(Object.keys(r.themes), [`${slug}-light`, `${slug}-dark`]);
    assert.equal(r.themes[`${slug}-light`].dark, false);
    assert.equal(r.themes[`${slug}-dark`].dark, true);
    for (const [nom, th] of Object.entries(r.themes)) {
      assert.equal(Object.keys(th.colors).length, 42, nom);
      for (const k of DEFAUTS) assert.ok(k in th.colors, `${nom} : ${k}`);
      for (const k of FONDS) assert.ok(`on-${k}` in th.colors, `${nom} : on-${k}`);
    }
  }
});

test('V3 valeurs de l\'essai, et chaque couleur égale son rôle', () => {
  const orbe = themesVuetify(dossier('orbe-cafe')).themes;
  const alberto = themesVuetify(dossier('maison-alberto')).themes;
  const pris = (/** @type {any} */ c, /** @type {string[]} */ ks) => Object.fromEntries(ks.map((k) => [k, c[k]]));
  const SIX = ['primary', 'on-primary', 'background', 'surface', 'on-background', 'on-surface'];
  assert.deepEqual(pris(orbe['orbe-cafe-light'].colors, SIX), { primary: '#2b4c7e', 'on-primary': '#ffffff', background: '#fbfbfb', surface: '#ffffff', 'on-background': '#363026', 'on-surface': '#363026' });
  assert.deepEqual(pris(orbe['orbe-cafe-dark'].colors, SIX), { primary: '#86b6fe', 'on-primary': '#0e1218', background: '#121212', surface: '#181818', 'on-background': '#d8d5ce', 'on-surface': '#d8d5ce' });
  assert.deepEqual(pris(alberto['maison-alberto-light'].colors, ['primary', 'on-primary']), { primary: '#836304', 'on-primary': '#ffffff' });
  assert.deepEqual(pris(alberto['maison-alberto-dark'].colors, ['primary', 'on-primary']), { primary: '#ffd060', 'on-primary': '#121212' });
  const t = brute();
  for (const d of MARQUES) {
    const r = themesVuetify(d);
    for (const [mode, th] of [['light', Object.values(r.themes)[0]], ['dark', Object.values(r.themes)[1]]]) {
      const s = loadRoles(d, { mode: /** @type {string} */ (mode) });
      const roles = resolveRoles(s.semantique, s.primitives, s.marque);
      for (const k of COULEURS) {
        assert.equal(/** @type {any} */ (th).colors[k], roles.get(t.colors[k].background)?.hex, `${d} ${mode} ${k}`);
        assert.equal(/** @type {any} */ (th).colors[`on-${k}`], roles.get(t.colors[k].text)?.hex, `${d} ${mode} on-${k}`);
      }
    }
  }
});

test('V4 chaque couleur et son texte : au moins 4,5:1 (culori), sauf disabled, dont la paire porte son exception', () => {
  const t = brute();
  const exception = lire(join(COMMUN, 'paires.json')).pairs.find((/** @type {any} */ p) => p.background === t.colors.disabled.background && p.foreground === t.colors.disabled.text)?.exception;
  assert.ok(typeof exception === 'string' && exception.length > 10, 'exception écrite du désactivé');
  for (const d of MARQUES)
    for (const [nom, th] of Object.entries(themesVuetify(d).themes))
      for (const k of COULEURS) {
        const c = wcagContrast(th.colors[`on-${k}`], th.colors[k]);
        if (k === 'disabled') assert.ok(c < 4.5 && c >= 3.32, `${nom} ${k} : ${c}`);
        else assert.ok(c >= 4.5, `${nom} ${k} : ${c}`);
      }
});

test('V5 polices du texte et des titres, comme la feuille jetons.css de la marque', () => {
  const polices = (/** @type {Record<string, string>} */ x) => ({ 'font-body': x['font-body'], 'font-heading': x['font-heading'] });
  const v = (/** @type {string} */ m) => Object.values(themesVuetify(dossier(m)).themes).map((th) => polices(th.variables));
  for (const x of v('orbe-cafe')) assert.deepEqual(x, { 'font-body': '"Orbe Sans", Arial, sans-serif', 'font-heading': 'Georgia, serif' });
  for (const x of v('maison-alberto')) assert.deepEqual(x, { 'font-body': 'system-ui, sans-serif', 'font-heading': '"National Park", sans-serif' });
  for (const d of MARQUES) {
    const css = readFileSync(join(d, 'jetons.css'), 'utf8');
    /** Valeur d'une variable de la feuille, renvois var(--…) suivis. @param {string} nom @returns {string} */
    const decl = (nom) => {
      const v = /** @type {string} */ (css.match(new RegExp(`--${nom}: ([^;]+);`))?.[1]);
      const renvoi = /^var\(--([\w-]+)\)$/.exec(v);
      return renvoi ? decl(renvoi[1]) : v;
    };
    for (const th of Object.values(themesVuetify(d).themes)) {
      assert.deepEqual(noms(th.variables['font-body']), noms(decl('brand-font-body')), d);
      assert.deepEqual(noms(th.variables['font-heading']), noms(decl('brand-font-heading')), d);
    }
  }
});

test('V6 fichier versionné égal à une génération neuve ; deux générations identiques', () => {
  for (const d of MARQUES) {
    const neuf = texteThemes(d);
    assert.equal(texteThemes(d), neuf, d);
    assert.equal(readFileSync(join(d, THEMES), 'utf8'), neuf, `${d}${THEMES} : relancer npm run vuetify`);
  }
});

test('V7 table fausse : panne qui la nomme', () => {
  const avec = (/** @type {(t: any) => void} */ f) => {
    const t = brute();
    f(t);
    return t;
  };
  const paires = lire(join(COMMUN, 'paires.json'));
  const d = dossier('orbe-cafe');
  // Un rôle inconnu n'est dans aucune paire : la table est passée sans lireTable, pour atteindre la lecture des rôles.
  assert.throws(() => themesVuetify(d, { couleurs: { primary: { fond: 'fond.inexistant', texte: 'text.on-interactive' } }, polices: {} }), /rôle absent : fond\.inexistant/);
  assert.throws(() => lireTable(avec((t) => { t.colors.primary.text = 'text.default'; }), paires), /paire hors de paires\.json : text\.default sur background\.interactive\.strong/);
  assert.throws(() => lireTable(avec((t) => { t.colors['on-primary'] = { background: 'background.app', text: 'text.default' }; }), paires), /clé en on- : on-primary/);
  assert.throws(() => lireTable(avec((t) => { t.variables.focus = { token: 'border.focus' }; }), paires), /variable sans le préfixe ds- : focus/);
  assert.throws(() => lireTable(avec((t) => { t.variables['ds-label-font-size'].field = 'letterSpacing'; }), paires), /field inconnu : letterSpacing/);
  assert.throws(() => lireTable(avec((t) => { t.variables['ds-focus'].unpaired = 'essai'; }), paires), /unpaired sur un trait qui a sa paire : border\.focus/);
  assert.throws(() => themesVuetify(d, lireTable(avec((t) => { delete t.variables['ds-border-disabled'].unpaired; }), paires)), /couleur sans paire : border\.subtle/);
  assert.throws(() => themesVuetify(d, lireTable(avec((t) => { t.variables['ds-border-radius-control'].token = 'border-radius.inexistant'; }), paires)), /jeton absent : border-radius\.inexistant/);
});

test('V9 variables ds- du bouton : dimensions dans les dix thèmes, traits égaux à leurs rôles', () => {
  const DIMENSIONS = {
    'ds-border-radius-control': '8px', 'ds-height-control-medium': '40px', 'ds-height-control-small': '32px', 'ds-border-width-default': '1px', 'ds-border-width-focus': '2px', 'ds-offset-focus': '2px',
    'ds-icon-size-medium': '20px', 'ds-icon-size-small': '16px', 'ds-gap-icon-text': '8px', 'ds-padding-component': '16px', 'ds-gap-between-blocks': '8px', 'ds-width-column': '640px',
    'ds-label-font-size': '14px', 'ds-label-font-weight': '600', 'ds-label-line-height': '1.4286', 'ds-label-font-family': 'system-ui, sans-serif',
  };
  const TRAITS = { 'ds-focus': 'border.focus', 'ds-border': 'border.strong', 'ds-border-disabled': 'border.subtle' };
  const CHAMP_CARTE = [
    'ds-text-secondary', 'ds-text-error', 'ds-border-error', 'ds-card-border', 'ds-border-radius-surface', 'ds-gap-within-component', 'ds-gap-between-components',
    'ds-body-font-family', 'ds-body-font-size', 'ds-body-font-weight', 'ds-body-line-height', 'ds-supporting-text-font-family', 'ds-supporting-text-font-size', 'ds-supporting-text-font-weight', 'ds-supporting-text-line-height',
    'ds-card-title-font-family', 'ds-card-title-font-size', 'ds-card-title-font-weight', 'ds-card-title-line-height', 'ds-card-title-cap-height',
  ];
  const AVATAR_ETIQUETTE_VARIABLES = [
    'ds-border-radius-full', 'ds-avatar-size-medium', 'ds-avatar-size-large',
    ...['medium', 'large'].flatMap((t) => ['font-family', 'font-size', 'font-weight', 'line-height'].map((c) => `ds-initials-${t}-${c}`)),
    'ds-height-tag', 'ds-padding-tag', 'ds-gap-between-tags',
    ...['font-family', 'font-size', 'font-weight', 'line-height'].map((c) => `ds-body-small-${c}`),
  ];
  // Titre 4 de DsCard en taille small (docs/attendus/carte-membre-liste.md) : quatre variables, valeurs jugées ici.
  const TITRE_4 = ['font-family', 'font-size', 'font-weight', 'line-height'].map((c) => `ds-heading-4-${c}`);
  assert.equal(Object.keys(DIMENSIONS).length + Object.keys(TRAITS).length + CHAMP_CARTE.length + AVATAR_ETIQUETTE_VARIABLES.length + TITRE_4.length, 61);
  for (const d of MARQUES) {
    const themes = Object.values(themesVuetify(d).themes);
    for (const [i, mode] of /** @type {const} */ (['light', 'dark']).entries()) {
      const x = themes[i].variables;
      assert.deepEqual(Object.keys(x).filter((k) => k.startsWith('ds-')).sort(), [...Object.keys(DIMENSIONS), ...Object.keys(TRAITS), ...CHAMP_CARTE, ...AVATAR_ETIQUETTE_VARIABLES, ...TITRE_4].sort(), `${d} ${mode}`);
      assert.deepEqual(TITRE_4.slice(1).map((k) => x[k]), ['16px', '700', '1.5'], `${d} ${mode} titre 4`);
      assert.equal(x['ds-heading-4-font-family'], x['ds-body-small-font-family'], `${d} ${mode} titre 4, police du texte`);
      for (const [k, v] of Object.entries(DIMENSIONS)) assert.equal(x[k], v, `${d} ${mode} ${k}`);
      const s = loadRoles(d, { mode });
      const roles = resolveRoles(s.semantique, s.primitives, s.marque);
      for (const [k, r] of Object.entries(TRAITS)) assert.equal(x[k], roles.get(r)?.hex, `${d} ${mode} ${k}`);
    }
  }
  const orbe = themesVuetify(dossier('orbe-cafe')).themes;
  const traits = (/** @type {Record<string, string>} */ x) => [x['ds-focus'], x['ds-border'], x['ds-border-disabled']];
  assert.deepEqual(traits(orbe['orbe-cafe-light'].variables), ['#4c6994', '#958f84', '#d8d6d2']);
  assert.deepEqual(traits(orbe['orbe-cafe-dark'].variables), ['#86b6fe', '#6a665c', '#303030']);
});

test('V8 npm run vuetify : une marque, toutes, option inconnue', () => {
  const run = (/** @type {string[]} */ ...a) => spawnSync(process.execPath, ['src/cli/vuetify.js', ...a], { cwd: ROOT, encoding: 'utf8' });
  const une = run('--marque', 'tokens/orbe-cafe');
  assert.equal(une.status, 0, une.stderr);
  assert.equal(une.stdout, `✓ ${THEMES} inchangé\n`);
  const toutes = run();
  assert.equal(toutes.status, 0, toutes.stderr);
  assert.equal(toutes.stdout.match(/^marque /gm)?.length, 5);
  const faux = run('--mode', 'nuit');
  assert.equal(faux.status, 2);
  assert.match(faux.stderr, /^vuetify : /);
});
