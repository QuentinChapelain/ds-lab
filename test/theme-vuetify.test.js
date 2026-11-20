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
 *      ← marque.police.texte, font-heading ← marque.police.titre ; les lignes primary-darken-1, surface-variant,
 *      surface-bright et surface-light disent [H] ; secondary dit « Jamais une couleur de bouton (D05) » ;
 *   V2 chaque marque a deux thèmes, <dossier>-clair (dark false) et <dossier>-sombre (dark true), et son nom lu dans
 *      le resolver ; chaque thème a 26 couleurs (13 fonds, 13 textes) qui couvrent les 14 clés par défaut de Vuetify
 *      (les 13 fonds et on-surface-variant) : Vuetify n'a aucun texte à calculer ;
 *   V3 valeurs mesurées dans le navigateur par l'essai du 18/11/2026 (local/essai-storybook/rapport.md, Q2 et Q3,
 *      fond et texte du bouton ; fond.app et fond.surface lus dans themes.generated.json de l'essai) :
 *        orbe-cafe-clair      primary #2b4c7e, on-primary #ffffff, background #fbfbfb, surface #ffffff,
 *                             on-background #363026, on-surface #363026 ;
 *        orbe-cafe-sombre     primary #86b6fe, on-primary #0e1218, background #121212, surface #181818,
 *                             on-background #d8d5ce, on-surface #d8d5ce ;
 *        maison-alberto-clair primary #836304 (pas 11, plein moyen), on-primary #ffffff ;
 *        maison-alberto-sombre primary #ffd060, on-primary #121212 ;
 *      et, pour toutes les marques, chaque couleur égale la valeur du rôle que nomme la table, lue par le lecteur ;
 *   V4 chaque couleur et son texte : au moins 4,5:1 (culori wcagContrast, oracle indépendant), dans chaque thème ;
 *   V5 polices, au format des planches (nom entre guillemets s'il a une espace) :
 *        orbe-cafe      font-body "Orbe Sans", Arial, sans-serif ; font-heading Georgia, serif ;
 *        maison-alberto font-body system-ui, sans-serif (police du produit, D16) ; font-heading "National Park", sans-serif ;
 *      et, pour toutes les marques, la liste des noms égale celle de --marque-police-texte et --marque-police-titre de
 *      sa feuille jetons.css, écrite par Terrazzo ;
 *   V6 tokens/<marque>/vuetify.json versionné égale une génération neuve ; deux générations sont identiques ;
 *   V7 une table fausse est une panne qui la nomme : rôle absent (« rôle absent : fond.inexistant »), paire hors de
 *      paires.json (« paire hors de paires.json : texte.principal sur fond.interactif.fort »), clé en on-
 *      (« clé en on- : on-primary ») ;
 *   V8 npm run vuetify -- --marque <dossier> : sortie 0, « ✓ vuetify.json inchangé » ; sans l'option, un bloc par
 *      marque ; option inconnue : sortie 2.
 *
 * Ajouts pour l'enveloppe du bouton (18/11/2026, docs/attendus/bouton.md), écrits à la main avant le code :
 *   V1 après les 13 fonds, cinq couleurs nommées d'après nos rôles : erreur-fort-survol, composant-survol,
 *      interactif-discret, erreur-discret, desactive, chacune en paire de paires.json ;
 *   V2 36 couleurs par thème (18 fonds, 18 textes) ;
 *   V4 seule desactive est sous 4,5:1, et sa paire porte une exception écrite (3,32 en clair, 3,92 en sombre) ;
 *   V9 variables ds- de chaque thème : arrondi 8px, hauteurs 40px et 32px, contour 1px, anneau 2px décalé de 2px, icônes 20px et 16px, écart
 *      icône-texte 8px, marge intérieure 16px, libellé 14px, graisse 600, interligne 1.4286, dans les dix thèmes ;
 *      ds-focus, ds-contour et ds-contour-desactive égaux à bordure.focus, bordure.forte et bordure.discrete lus par
 *      le lecteur ; chez Orbe Café #4c6994, #958f84, #d8d6d2 en clair et #86b6fe, #6a665c, #303030 en sombre ;
 *   V7 variable fausse, panne qui la nomme : sans le préfixe ds-, champ inconnu, couleur sans paire ni sansPaire,
 *      sansPaire sur un trait qui a sa paire, jeton absent.
 *
 * Ajouts pour la police du libellé (18/11/2026, D44, docs/attendus/finitions-bouton.md) :
 *   V9 une 17e variable, ds-libelle-police = system-ui, sans-serif dans les dix thèmes, alors que font-body garde la
 *      police du texte de la marque ;
 *   V5 la feuille jetons.css écrit la police du texte du commun en renvoi (var(--police-produit)) : la comparaison
 *      suit le renvoi.
 *
 * Ajouts pour le champ de texte et la carte (19/11/2026, docs/attendus/champ-carte.md) :
 *   V9 20 variables de plus, 37 en tout ; leurs valeurs sont jugées par H3 (test/champ-carte-jetons.test.js).
 *
 * Ajouts pour l'avatar et l'étiquette (19/11/2026, docs/attendus/avatar-etiquette.md) :
 *   V1 deux couleurs après celles du bouton, marque-discret (fond.marque.discret, texte.marque) et composant
 *      (fond.composant, texte.principal), chacune en paire de paires.json ;
 *   V2 40 couleurs par thème (20 fonds, 20 textes) ;
 *   V9 18 variables de plus, 55 en tout ; leurs valeurs sont jugées par A4 (test/avatar-etiquette.test.js).
 * Titre 4 de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : V9 quatre variables ds-titre-4-*, 59 en tout,
 *   16px, 700 et 1.5, dans la police du texte de la marque.
 * Fonds teintés (20/11/2026, docs/attendus/carte-membre-liste.md) : les deux couleurs deviennent marque-teinte
 *   (fond.marque.teinte, texte.marque) et teinte (fond.teinte, texte.principal), à la même place ; toujours 40.
 * Écart entre blocs de DsCard (20/11/2026, docs/attendus/carte-membre-liste.md) : V9 ds-ecart-entre-blocs, 8px, 60 en tout ;
 *   puis ds-largeur-colonne, 640px, la largeur maximale de MemberList, 61 en tout.
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
const BOUTON = ['erreur-fort-survol', 'composant-survol', 'interactif-discret', 'erreur-discret', 'desactive'];
/** Couleurs de l'avatar et de l'étiquette (docs/attendus/avatar-etiquette.md), après celles du bouton. */
const AVATAR_ETIQUETTE = ['marque-teinte', 'teinte'];
const COULEURS = [...FONDS, ...BOUTON, ...AVATAR_ETIQUETTE];
/** @param {string} p */
const lire = (p) => JSON.parse(readFileSync(p, 'utf8'));
const brute = () => lire(join(COMMUN, 'vuetify.json'));
const dossier = (/** @type {string} */ m) => join(ROOT, 'tokens', m);
/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));

test('V1 table : les 13 fonds par défaut de Vuetify, puis ceux du bouton, un texte chacun, en paire de paires.json', () => {
  const t = brute();
  assert.deepEqual(Object.keys(t.couleurs).filter((k) => !k.startsWith('$')), COULEURS);
  const paires = lire(join(COMMUN, 'paires.json')).paires.filter((/** @type {any} */ p) => p.type === 'texte');
  for (const k of COULEURS) {
    const { fond, texte } = t.couleurs[k];
    assert.ok(paires.some((/** @type {any} */ p) => p.fond === fond && p.devant === texte), `${k} : ${texte} sur ${fond}`);
  }
  assert.deepEqual(Object.fromEntries(Object.entries(t.polices).filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, /** @type {any} */ (v).jeton])), { 'font-body': 'marque.police.texte', 'font-heading': 'marque.police.titre' });
  for (const k of ['primary-darken-1', 'surface-variant', 'surface-bright', 'surface-light']) assert.match(t.couleurs[k].$description, /\[H\]/, k);
  for (const k of ['primary', 'background', 'surface', 'error', 'info', 'success', 'warning']) assert.doesNotMatch(t.couleurs[k].$description, /\[H\]/, k);
  assert.match(t.couleurs.secondary.$description, /Jamais une couleur de bouton \(D05\)/);
});

test('V2 deux thèmes nommés par marque, 40 couleurs qui couvrent les défauts de Vuetify', () => {
  assert.equal(MARQUES.length, 5);
  for (const d of MARQUES) {
    const r = themesVuetify(d);
    const slug = d.split('/').filter(Boolean).pop();
    assert.equal(r.nom, nomDeMarque(d));
    assert.deepEqual(Object.keys(r.themes), [`${slug}-clair`, `${slug}-sombre`]);
    assert.equal(r.themes[`${slug}-clair`].dark, false);
    assert.equal(r.themes[`${slug}-sombre`].dark, true);
    for (const [nom, th] of Object.entries(r.themes)) {
      assert.equal(Object.keys(th.colors).length, 40, nom);
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
  assert.deepEqual(pris(orbe['orbe-cafe-clair'].colors, SIX), { primary: '#2b4c7e', 'on-primary': '#ffffff', background: '#fbfbfb', surface: '#ffffff', 'on-background': '#363026', 'on-surface': '#363026' });
  assert.deepEqual(pris(orbe['orbe-cafe-sombre'].colors, SIX), { primary: '#86b6fe', 'on-primary': '#0e1218', background: '#121212', surface: '#181818', 'on-background': '#d8d5ce', 'on-surface': '#d8d5ce' });
  assert.deepEqual(pris(alberto['maison-alberto-clair'].colors, ['primary', 'on-primary']), { primary: '#836304', 'on-primary': '#ffffff' });
  assert.deepEqual(pris(alberto['maison-alberto-sombre'].colors, ['primary', 'on-primary']), { primary: '#ffd060', 'on-primary': '#121212' });
  const t = brute();
  for (const d of MARQUES) {
    const r = themesVuetify(d);
    for (const [mode, th] of [['clair', Object.values(r.themes)[0]], ['sombre', Object.values(r.themes)[1]]]) {
      const s = loadRoles(d, { mode: /** @type {string} */ (mode) });
      const roles = resolveRoles(s.semantique, s.primitives, s.marque);
      for (const k of COULEURS) {
        assert.equal(/** @type {any} */ (th).colors[k], roles.get(t.couleurs[k].fond)?.hex, `${d} ${mode} ${k}`);
        assert.equal(/** @type {any} */ (th).colors[`on-${k}`], roles.get(t.couleurs[k].texte)?.hex, `${d} ${mode} on-${k}`);
      }
    }
  }
});

test('V4 chaque couleur et son texte : au moins 4,5:1 (culori), sauf desactive, dont la paire porte son exception', () => {
  const t = brute();
  const exception = lire(join(COMMUN, 'paires.json')).paires.find((/** @type {any} */ p) => p.fond === t.couleurs.desactive.fond && p.devant === t.couleurs.desactive.texte)?.exception;
  assert.ok(typeof exception === 'string' && exception.length > 10, 'exception écrite du désactivé');
  for (const d of MARQUES)
    for (const [nom, th] of Object.entries(themesVuetify(d).themes))
      for (const k of COULEURS) {
        const c = wcagContrast(th.colors[`on-${k}`], th.colors[k]);
        if (k === 'desactive') assert.ok(c < 4.5 && c >= 3.32, `${nom} ${k} : ${c}`);
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
      assert.deepEqual(noms(th.variables['font-body']), noms(decl('marque-police-texte')), d);
      assert.deepEqual(noms(th.variables['font-heading']), noms(decl('marque-police-titre')), d);
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
  assert.throws(() => themesVuetify(d, { couleurs: { primary: { fond: 'fond.inexistant', texte: 'texte.sur-interactif' } }, polices: {} }), /rôle absent : fond\.inexistant/);
  assert.throws(() => lireTable(avec((t) => { t.couleurs.primary.texte = 'texte.principal'; }), paires), /paire hors de paires\.json : texte\.principal sur fond\.interactif\.fort/);
  assert.throws(() => lireTable(avec((t) => { t.couleurs['on-primary'] = { fond: 'fond.app', texte: 'texte.principal' }; }), paires), /clé en on- : on-primary/);
  assert.throws(() => lireTable(avec((t) => { t.variables.focus = { jeton: 'bordure.focus' }; }), paires), /variable sans le préfixe ds- : focus/);
  assert.throws(() => lireTable(avec((t) => { t.variables['ds-libelle-taille'].champ = 'letterSpacing'; }), paires), /champ inconnu : letterSpacing/);
  assert.throws(() => lireTable(avec((t) => { t.variables['ds-focus'].sansPaire = 'essai'; }), paires), /sansPaire sur un trait qui a sa paire : bordure\.focus/);
  assert.throws(() => themesVuetify(d, lireTable(avec((t) => { delete t.variables['ds-contour-desactive'].sansPaire; }), paires)), /couleur sans paire : bordure\.discrete/);
  assert.throws(() => themesVuetify(d, lireTable(avec((t) => { t.variables['ds-arrondi-controle'].jeton = 'arrondi.inexistant'; }), paires)), /jeton absent : arrondi\.inexistant/);
});

test('V9 variables ds- du bouton : dimensions dans les dix thèmes, traits égaux à leurs rôles', () => {
  const DIMENSIONS = {
    'ds-arrondi-controle': '8px', 'ds-hauteur-controle-normale': '40px', 'ds-hauteur-controle-petite': '32px', 'ds-epaisseur-contour': '1px', 'ds-epaisseur-focus': '2px', 'ds-decalage-focus': '2px',
    'ds-taille-icone-normale': '20px', 'ds-taille-icone-petite': '16px', 'ds-ecart-icone-texte': '8px', 'ds-marge-interieure-composant': '16px', 'ds-ecart-entre-blocs': '8px', 'ds-largeur-colonne': '640px',
    'ds-libelle-taille': '14px', 'ds-libelle-graisse': '600', 'ds-libelle-interligne': '1.4286', 'ds-libelle-police': 'system-ui, sans-serif',
  };
  const TRAITS = { 'ds-focus': 'bordure.focus', 'ds-contour': 'bordure.forte', 'ds-contour-desactive': 'bordure.discrete' };
  const CHAMP_CARTE = [
    'ds-texte-secondaire', 'ds-texte-erreur', 'ds-contour-erreur', 'ds-contour-carte', 'ds-arrondi-surface', 'ds-ecart-dans-composant', 'ds-ecart-entre-composants',
    'ds-corps-police', 'ds-corps-taille', 'ds-corps-graisse', 'ds-corps-interligne', 'ds-mention-police', 'ds-mention-taille', 'ds-mention-graisse', 'ds-mention-interligne',
    'ds-titre-carte-police', 'ds-titre-carte-taille', 'ds-titre-carte-graisse', 'ds-titre-carte-interligne', 'ds-titre-carte-hauteur-capitale',
  ];
  const AVATAR_ETIQUETTE_VARIABLES = [
    'ds-arrondi-pilule', 'ds-taille-avatar-normale', 'ds-taille-avatar-grande',
    ...['normale', 'grande'].flatMap((t) => ['police', 'taille', 'graisse', 'interligne'].map((c) => `ds-initiales-${t}-${c}`)),
    'ds-hauteur-etiquette', 'ds-marge-interieure-etiquette', 'ds-ecart-entre-etiquettes',
    ...['police', 'taille', 'graisse', 'interligne'].map((c) => `ds-corps-petit-${c}`),
  ];
  // Titre 4 de DsCard en taille small (docs/attendus/carte-membre-liste.md) : quatre variables, valeurs jugées ici.
  const TITRE_4 = ['police', 'taille', 'graisse', 'interligne'].map((c) => `ds-titre-4-${c}`);
  assert.equal(Object.keys(DIMENSIONS).length + Object.keys(TRAITS).length + CHAMP_CARTE.length + AVATAR_ETIQUETTE_VARIABLES.length + TITRE_4.length, 61);
  for (const d of MARQUES) {
    const themes = Object.values(themesVuetify(d).themes);
    for (const [i, mode] of /** @type {const} */ (['clair', 'sombre']).entries()) {
      const x = themes[i].variables;
      assert.deepEqual(Object.keys(x).filter((k) => k.startsWith('ds-')).sort(), [...Object.keys(DIMENSIONS), ...Object.keys(TRAITS), ...CHAMP_CARTE, ...AVATAR_ETIQUETTE_VARIABLES, ...TITRE_4].sort(), `${d} ${mode}`);
      assert.deepEqual(TITRE_4.slice(1).map((k) => x[k]), ['16px', '700', '1.5'], `${d} ${mode} titre 4`);
      assert.equal(x['ds-titre-4-police'], x['ds-corps-petit-police'], `${d} ${mode} titre 4, police du texte`);
      for (const [k, v] of Object.entries(DIMENSIONS)) assert.equal(x[k], v, `${d} ${mode} ${k}`);
      const s = loadRoles(d, { mode });
      const roles = resolveRoles(s.semantique, s.primitives, s.marque);
      for (const [k, r] of Object.entries(TRAITS)) assert.equal(x[k], roles.get(r)?.hex, `${d} ${mode} ${k}`);
    }
  }
  const orbe = themesVuetify(dossier('orbe-cafe')).themes;
  const traits = (/** @type {Record<string, string>} */ x) => [x['ds-focus'], x['ds-contour'], x['ds-contour-desactive']];
  assert.deepEqual(traits(orbe['orbe-cafe-clair'].variables), ['#4c6994', '#958f84', '#d8d6d2']);
  assert.deepEqual(traits(orbe['orbe-cafe-sombre'].variables), ['#86b6fe', '#6a665c', '#303030']);
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
