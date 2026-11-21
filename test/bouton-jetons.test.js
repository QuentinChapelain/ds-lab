// @ts-check
/**
 * Jetons du bouton dans les dix thèmes (cinq marques fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (18/11/2026, docs/attendus/bouton.md) ; couleurs lues dans les jetons par un
 * résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   B1 rôles de couleur ajoutés : background.error.strong.hover → {brand.error.solid-hover}, background.disabled →
 *      {color.neutral.3}, text.disabled → {color.neutral.9} ;
 *   B2 dimensions : border-radius.control 8 px ({radius.8}), height.control.medium 40 px et .petite 32 px ({size.40},
 *      {size.32}), border-width.focus 2 px ({stroke.2}), icon-size.medium 20 px et .petite 16 px ({size.20},
 *      {size.16}), gap.icon-text 8 px ({space.8}), offset.focus 2 px ({stroke.2}, DS2) et border-width.default
 *      1 px ({stroke.1}), ajoutés par correction de l'attendu ; les mêmes dans les dix thèmes ;
 *   B3 couleurs de chaque variante, au repos et au survol, dans chaque thème, et leurs rapports (2 décimales) :
 *      tableaux de l'attendu, recopiés ci-dessous ; chaque texte actif tient 4,5:1, le contour et l'anneau 3:1 sur la
 *      page ; le désactivé reste entre 3,32 et 4,26, sous 4,5, avec son exception écrite ;
 *   Correction du 18/11/2026 (D45, docs/attendus/finitions-bouton.md) : survol du principal et du danger = clarté
 *      OKLCH du plein − 0,05 en clair, + 0,05 en sombre ; valeurs et rapports du tableau de cet attendu ;
 *   B4 aucun groupe de rôles ne porte le nom d'un groupe de primitives : le lecteur range un groupe entier dans la
 *      couche des rôles dès que son nom y paraît (partager, src/tokens/resolver.js ; correction de l'attendu).
 *
 * Ajout pour le bouton à icône seule (19/11/2026, D52, docs/attendus/bouton-icone.md) :
 *   B5 l'icône, élément non textuel, contre ce qui l'entoure (la page ou une surface pour les discrets au repos, le fond
 *      du bouton sinon), au repos et au survol, dans les dix thèmes : couleurs et rapports des deux tableaux de
 *      l'attendu, recopiés ci-dessous ; chaque icône active tient 3:1 ; le désactivé reste dans son exception.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias, contratRoles } from '../src/tokens/roles.js';
import { charger } from './helpers/jetons.js';
import { dossiersDeMarque } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = dossiersDeMarque().map((d) => basename(d));
const MODES = /** @type {const} */ (['light', 'dark']);

/** Variante → [fond au repos, texte, fond au survol]. Le discret et le danger discret sont posés sur la page. */
const VARIANTES = {
  principal: ['background.interactive.strong', 'text.on-interactive', 'background.interactive.strong.hover'],
  secondaire: ['background.surface', 'text.default', 'background.component.hover'],
  discret: ['background.app', 'text.interactive', 'background.interactive.subtle'],
  danger: ['background.error.strong', 'text.on-error', 'background.error.strong.hover'],
  'danger-discret': ['background.app', 'text.error', 'background.error.subtle'],
};

/** Ce qui varie avec la marque : principal [fond, texte, repos, survol, rapport survol], discret [texte, rapport, survol, rapport], focus [couleur, rapport]. */
const PAR_THEME = {
  'atelier-lavandine-light': { principal: ['#8a4fd8', '#ffffff', 5.01, '#7b3ec7', 6.26], discret: ['#8247ce', 5.42, '#f5f1fe', 5.05], focus: ['#8247ce', 5.42] },
  'atelier-lavandine-dark': { principal: ['#c4a4fe', '#131019', 9.04, '#d4b5ff', 10.62], discret: ['#c4a4fe', 9.0, '#1d1925', 8.28], focus: ['#c4a4fe', 9.0] },
  'ecume-et-sel-light': { principal: ['#7fdbff', '#003647', 8.33, '#6fcbee', 7.08], discret: ['#21708b', 5.4, '#e3f6fe', 5.03], focus: ['#21708b', 5.4] },
  'ecume-et-sel-dark': { principal: ['#c9efff', '#121212', 15.41, '#ddffff', 17.68], discret: ['#c9efff', 15.41, '#1b1b1b', 14.17], focus: ['#c9efff', 15.41] },
  'grenat-papeterie-light': { principal: ['#7a1f3d', '#ffffff', 10.04, '#6a0d30', 12.26], discret: ['#4f0020', 15.0, '#fcf0f2', 13.95], focus: ['#4f0020', 15.0] },
  'grenat-papeterie-dark': { principal: ['#fc96ae', '#1e0d11', 9.02, '#ffa7be', 10.28], discret: ['#fc96ae', 9.02, '#2f1119', 8.32], focus: ['#fc96ae', 9.02] },
  'maison-alberto-light': { principal: ['#836304', '#ffffff', 5.6, '#745500', 6.9], discret: ['#836304', 5.41, '#fbf3e1', 5.07], focus: ['#836304', 5.41] },
  'maison-alberto-dark': { principal: ['#ffd060', '#121212', 12.88, '#ffe17e', 14.56], discret: ['#ffd060', 12.88, '#1d1b17', 11.83], focus: ['#ffd060', 12.88] },
  'orbe-cafe-light': { principal: ['#2b4c7e', '#ffffff', 8.61, '#1e3e6f', 10.64], discret: ['#4c6994', 5.4, '#f1f3f7', 5.03], focus: ['#4c6994', 5.4] },
  'orbe-cafe-dark': { principal: ['#86b6fe', '#0e1218', 9.06, '#97c6ff', 10.58], discret: ['#86b6fe', 9.04, '#111b2a', 8.35], focus: ['#86b6fe', 9.04] },
};

/** Ce qui ne dépend que du mode, identique dans les cinq marques. */
const PAR_MODE = {
  light: {
    page: '#fbfbfb',
    secondaire: ['#ffffff', '#363026', 13.06, '#ecebe9', 10.96],
    contour: ['#958f84', 3.1],
    danger: ['#cb1d2a', '#ffffff', 5.6, '#b9001a', 6.82],
    'danger-discret': ['#cb1d2a', 5.41, '#fff0ee', 5.06],
    desactive: ['#f3f2f1', '#8a8478', 3.32, 3.59, '#d8d6d2'],
  },
  dark: {
    page: '#121212',
    secondaire: ['#181818', '#d8d5ce', 12.12, '#212121', 10.99],
    contour: ['#6a665c', 3.27],
    danger: ['#ff978f', '#1a0f0e', 9.01, '#ffaaa2', 10.3],
    'danger-discret': ['#ff978f', 8.99, '#231918', 8.23],
    desactive: ['#1b1b1b', '#7d786c', 3.92, 4.26, '#303030'],
  },
};

const DIMENSIONS = {
  'border-radius.control': ['{radius.8}', 8],
  'height.control.medium': ['{size.40}', 40],
  'height.control.small': ['{size.32}', 32],
  'border-width.default': ['{stroke.1}', 1],
  'border-width.focus': ['{stroke.2}', 2],
  'offset.focus': ['{stroke.2}', 2],
  'icon-size.medium': ['{size.20}', 20],
  'icon-size.small': ['{size.16}', 16],
  'gap.icon-text': ['{space.8}', 8],
};

/** Rapport culori à deux décimales. @param {string} a @param {string} b */
const r2 = (a, b) => Math.round(wcagContrast(a, b) * 100) / 100;

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
  return { set, roles, hex, jetons };
}

test('B1 rôles de couleur du bouton, en alias, dans les dix thèmes', () => {
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.background.error.strong.hover.$value, '{brand.error.solid-hover}');
  assert.equal(sem.background.disabled.$value, '{color.neutral.3}');
  assert.equal(sem.text.disabled.$value, '{color.neutral.9}');
  for (const m of MARQUES) for (const mode of MODES) {
    const { roles } = theme(m, mode);
    for (const r of ['background.error.strong.hover', 'background.disabled', 'text.disabled']) assert.ok(roles.has(r), `${m}-${mode} : ${r}`);
  }
});

test('B2 dimensions du bouton : alias et valeur en px, les mêmes dans les dix thèmes', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const { jetons } = theme(m, mode);
    for (const [role, [alias, px]] of Object.entries(DIMENSIONS)) {
      assert.equal(jetons.get(role)?.$value, alias, `${m}-${mode} : ${role}`);
      const { valeur } = resoudreAlias(jetons, alias, { depuis: role, chaine: [role] });
      assert.deepEqual(valeur, { value: px, unit: 'px' }, `${m}-${mode} : ${role}`);
    }
  }
});

test('B3 couleurs et rapports de chaque variante, dans les dix thèmes', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const nom = `${m}-${mode}`;
    const { hex } = theme(m, mode);
    const t = PAR_THEME[/** @type {keyof typeof PAR_THEME} */ (nom)];
    const c = PAR_MODE[mode];
    assert.equal(hex('background.app'), c.page, `${nom} : page`);
    /** @param {keyof typeof VARIANTES} v @param {string} fond @param {string} texte @param {number} repos @param {string} survol @param {number} rSurvol */
    const variante = (v, fond, texte, repos, survol, rSurvol) => {
      const [f, x, s] = VARIANTES[v];
      assert.deepEqual([hex(f), hex(x), r2(hex(x), hex(f)), hex(s), r2(hex(x), hex(s))], [fond, texte, repos, survol, rSurvol], `${nom} : ${v}`);
      assert.ok(repos >= 4.5 && rSurvol >= 4.5, `${nom} : ${v} sous 4,5:1`);
    };
    variante('principal', ...t.principal);
    variante('secondaire', ...c.secondaire);
    variante('discret', c.page, t.discret[0], t.discret[1], t.discret[2], t.discret[3]);
    variante('danger', ...c.danger);
    variante('danger-discret', c.page, c['danger-discret'][0], c['danger-discret'][1], c['danger-discret'][2], c['danger-discret'][3]);
    assert.deepEqual([hex('border.strong'), r2(hex('border.strong'), c.page)], c.contour, `${nom} : contour`);
    assert.deepEqual([hex('border.focus'), r2(hex('border.focus'), c.page)], t.focus, `${nom} : anneau`);
    assert.ok(c.contour[1] >= 3 && t.focus[1] >= 3, `${nom} : trait sous 3:1`);
    const [fd, td, rd, rp, bd] = c.desactive;
    assert.deepEqual([hex('background.disabled'), hex('text.disabled'), r2(td, fd), r2(td, c.page), hex('border.subtle')], [fd, td, rd, rp, bd], `${nom} : désactivé`);
    assert.ok(rd >= 3.32 && rd < 4.5 && rp <= 4.26 && rp < 4.5, `${nom} : désactivé hors de la plage de l'attendu`);
  }
});

test('B3 paires du bouton : le survol d\'erreur passe, le désactivé est listé en exception, jamais en échec', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const c = contratRoles(loadRoles(join(ROOT, 'tokens', m), { mode }));
    const cle = (/** @type {any} */ p) => `${p.devant} sur ${p.fond}`;
    assert.ok(c.pairs.some((p) => cle(p) === 'text.on-error sur background.error.strong.hover' && p.ok), `${m}-${mode}`);
    assert.deepEqual(c.exceptions.map(cle), ['text.disabled sur background.disabled', 'text.disabled sur background.app'], `${m}-${mode}`);
    assert.deepEqual(c.fails, [], `${m}-${mode}`);
  }
});

test('B4 aucun groupe de rôles ne porte le nom d\'un groupe de primitives', () => {
  const groupes = (/** @type {any} */ doc) => Object.keys(doc).filter((k) => !k.startsWith('$'));
  const roles = groupes(charger('semantique.tokens.json'));
  const primitives = [...groupes(charger('primitives.tokens.json')), ...groupes(charger('statuts.tokens.json'))];
  assert.deepEqual(roles.filter((g) => primitives.includes(g)), []);
});

/** Icône du bouton à icône, par paire [icône, fond] : couleurs et rapport de l'attendu, par thème (rôles de la marque). */
const ICONE_PAR_THEME = {
  'atelier-lavandine-light': [['#8247ce', '#fbfbfb', 5.42], ['#8247ce', '#ffffff', 5.61], ['#8247ce', '#f5f1fe', 5.05], ['#ffffff', '#8a4fd8', 5.01], ['#ffffff', '#7b3ec7', 6.26]],
  'atelier-lavandine-dark': [['#c4a4fe', '#121212', 9.0], ['#c4a4fe', '#181818', 8.53], ['#c4a4fe', '#1d1925', 8.28], ['#131019', '#c4a4fe', 9.04], ['#131019', '#d4b5ff', 10.62]],
  'ecume-et-sel-light': [['#21708b', '#fbfbfb', 5.4], ['#21708b', '#ffffff', 5.59], ['#21708b', '#e3f6fe', 5.03], ['#003647', '#7fdbff', 8.33], ['#003647', '#6fcbee', 7.08]],
  'ecume-et-sel-dark': [['#c9efff', '#121212', 15.41], ['#c9efff', '#181818', 14.61], ['#c9efff', '#1b1b1b', 14.17], ['#121212', '#c9efff', 15.41], ['#121212', '#ddffff', 17.68]],
  'grenat-papeterie-light': [['#4f0020', '#fbfbfb', 15.0], ['#4f0020', '#ffffff', 15.52], ['#4f0020', '#fcf0f2', 13.95], ['#ffffff', '#7a1f3d', 10.04], ['#ffffff', '#6a0d30', 12.26]],
  'grenat-papeterie-dark': [['#fc96ae', '#121212', 9.02], ['#fc96ae', '#181818', 8.55], ['#fc96ae', '#2f1119', 8.32], ['#1e0d11', '#fc96ae', 9.02], ['#1e0d11', '#ffa7be', 10.28]],
  'maison-alberto-light': [['#836304', '#fbfbfb', 5.41], ['#836304', '#ffffff', 5.6], ['#836304', '#fbf3e1', 5.07], ['#ffffff', '#836304', 5.6], ['#ffffff', '#745500', 6.9]],
  'maison-alberto-dark': [['#ffd060', '#121212', 12.88], ['#ffd060', '#181818', 12.21], ['#ffd060', '#1d1b17', 11.83], ['#121212', '#ffd060', 12.88], ['#121212', '#ffe17e', 14.56]],
  'orbe-cafe-light': [['#4c6994', '#fbfbfb', 5.4], ['#4c6994', '#ffffff', 5.59], ['#4c6994', '#f1f3f7', 5.03], ['#ffffff', '#2b4c7e', 8.61], ['#ffffff', '#1e3e6f', 10.64]],
  'orbe-cafe-dark': [['#86b6fe', '#121212', 9.04], ['#86b6fe', '#181818', 8.57], ['#86b6fe', '#111b2a', 8.35], ['#0e1218', '#86b6fe', 9.06], ['#0e1218', '#97c6ff', 10.58]],
};
/** Rôles des cinq paires de ICONE_PAR_THEME : discret sur la page, sur une surface, au survol ; principal au repos, au survol. */
const ICONE_ROLES_THEME = [
  ['text.interactive', 'background.app'],
  ['text.interactive', 'background.surface'],
  ['text.interactive', 'background.interactive.subtle'],
  ['text.on-interactive', 'background.interactive.strong'],
  ['text.on-interactive', 'background.interactive.strong.hover'],
];
/** Paires communes aux cinq marques, par mode : [icône, fond, clair, sombre], chaque valeur [icône, fond, rapport]. */
const ICONE_PAR_MODE = [
  ['text.error', 'background.app', ['#cb1d2a', '#fbfbfb', 5.41], ['#ff978f', '#121212', 8.99]],
  ['text.error', 'background.surface', ['#cb1d2a', '#ffffff', 5.6], ['#ff978f', '#181818', 8.52]],
  ['text.error', 'background.error.subtle', ['#cb1d2a', '#fff0ee', 5.06], ['#ff978f', '#231918', 8.23]],
  ['text.default', 'background.surface', ['#363026', '#ffffff', 13.06], ['#d8d5ce', '#181818', 12.12]],
  ['text.default', 'background.component.hover', ['#363026', '#ecebe9', 10.96], ['#d8d5ce', '#212121', 10.99]],
  ['border.strong', 'background.app', ['#958f84', '#fbfbfb', 3.1], ['#6a665c', '#121212', 3.27]],
  ['border.strong', 'background.surface', ['#958f84', '#ffffff', 3.21], ['#6a665c', '#181818', 3.1]],
];
/** Désactivé, en exception écrite (WCAG 1.4.3 et 1.4.11) : [icône, fond, clair, sombre]. */
const ICONE_DESACTIVE = [
  ['text.disabled', 'background.disabled', ['#8a8478', '#f3f2f1', 3.32], ['#7d786c', '#1b1b1b', 3.92]],
  ['text.disabled', 'background.app', ['#8a8478', '#fbfbfb', 3.59], ['#7d786c', '#121212', 4.26]],
  ['text.disabled', 'background.surface', ['#8a8478', '#ffffff', 3.72], ['#7d786c', '#181818', 4.04]],
];

test('B5 icône du bouton à icône contre ce qui l\'entoure, dans les dix thèmes', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const nom = `${m}-${mode}`;
    const { hex } = theme(m, mode);
    const paire = (/** @type {string} */ a, /** @type {string} */ b) => [hex(a), hex(b), r2(hex(a), hex(b))];
    ICONE_ROLES_THEME.forEach(([a, b], i) => {
      const attendu = ICONE_PAR_THEME[/** @type {keyof typeof ICONE_PAR_THEME} */ (nom)][i];
      assert.deepEqual(paire(a, b), attendu, `${nom} : ${a} / ${b}`);
      assert.ok(/** @type {number} */ (attendu[2]) >= 3, `${nom} : ${a} / ${b} sous 3:1`);
    });
    for (const [a, b, clair, sombre] of ICONE_PAR_MODE) {
      const attendu = /** @type {[string, string, number]} */ (mode === 'light' ? clair : sombre);
      assert.deepEqual(paire(/** @type {string} */ (a), /** @type {string} */ (b)), attendu, `${nom} : ${a} / ${b}`);
      assert.ok(attendu[2] >= 3, `${nom} : ${a} / ${b} sous 3:1`);
    }
    for (const [a, b, clair, sombre] of ICONE_DESACTIVE) {
      const attendu = /** @type {[string, string, number]} */ (mode === 'light' ? clair : sombre);
      assert.deepEqual(paire(/** @type {string} */ (a), /** @type {string} */ (b)), attendu, `${nom} : désactivé ${a} / ${b}`);
      assert.ok(attendu[2] < 4.5, `${nom} : désactivé hors de son exception`);
    }
  }
});
