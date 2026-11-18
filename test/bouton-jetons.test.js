// @ts-check
/**
 * Jetons du bouton dans les dix thèmes (cinq marques fictives, clair et sombre).
 *
 * Attendus écrits à la main avant le code (18/11/2026, docs/attendus/bouton.md) ; couleurs lues dans les jetons par un
 * résolveur écrit à part, rapports par culori 4.0.2 (wcagContrast) ; script et commande dans l'attendu :
 *   B1 rôles de couleur ajoutés : fond.erreur.fort.survol → {marque.erreur.plein-survol}, fond.desactive →
 *      {couleur.neutre.3}, texte.desactive → {couleur.neutre.9} ;
 *   B2 dimensions : arrondi.controle 8 px ({rayon.8}), hauteur.controle.normale 40 px et .petite 32 px ({taille.40},
 *      {taille.32}), epaisseur.focus 2 px ({trait.2}), taille-icone.normale 20 px et .petite 16 px ({taille.20},
 *      {taille.16}), ecart.icone-texte 8 px ({espace.8}), decalage.focus 2 px ({trait.2}, DS2 ; correction de
 *      l'attendu) ; les mêmes dans les dix thèmes ;
 *   B3 couleurs de chaque variante, au repos et au survol, dans chaque thème, et leurs rapports (2 décimales) :
 *      tableaux de l'attendu, recopiés ci-dessous ; chaque texte actif tient 4,5:1, le contour et l'anneau 3:1 sur la
 *      page ; le désactivé reste entre 3,32 et 4,26, sous 4,5, avec son exception écrite ;
 *   B4 aucun groupe de rôles ne porte le nom d'un groupe de primitives : le lecteur range un groupe entier dans la
 *      couche des rôles dès que son nom y paraît (partager, src/tokens/resolver.js ; correction de l'attendu).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { wcagContrast } from 'culori';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias, contratRoles } from '../src/tokens/roles.js';
import { charger } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto', 'orbe-cafe'];
const MODES = /** @type {const} */ (['clair', 'sombre']);

/** Variante → [fond au repos, texte, fond au survol]. Le discret et le danger discret sont posés sur la page. */
const VARIANTES = {
  principal: ['fond.interactif.fort', 'texte.sur-interactif', 'fond.interactif.fort.survol'],
  secondaire: ['fond.surface', 'texte.principal', 'fond.composant.survol'],
  discret: ['fond.app', 'texte.interactif', 'fond.interactif.discret'],
  danger: ['fond.erreur.fort', 'texte.sur-erreur', 'fond.erreur.fort.survol'],
  'danger-discret': ['fond.app', 'texte.erreur', 'fond.erreur.discret'],
};

/** Ce qui varie avec la marque : principal [fond, texte, repos, survol, rapport survol], discret [texte, rapport, survol, rapport], focus [couleur, rapport]. */
const PAR_THEME = {
  'atelier-lavandine-clair': { principal: ['#8a4fd8', '#ffffff', 5.01, '#7543b8', 6.46], discret: ['#8247ce', 5.42, '#f5f1fe', 5.05], focus: ['#8247ce', 5.42] },
  'atelier-lavandine-sombre': { principal: ['#c4a4fe', '#131019', 9.04, '#ddcefd', 12.83], discret: ['#c4a4fe', 9.0, '#1d1925', 8.28], focus: ['#c4a4fe', 9.0] },
  'ecume-et-sel-clair': { principal: ['#7fdbff', '#003647', 8.33, '#6fcbee', 7.08], discret: ['#21708b', 5.4, '#e3f6fe', 5.03], focus: ['#21708b', 5.4] },
  'ecume-et-sel-sombre': { principal: ['#c9efff', '#121212', 15.41, '#ebf9ff', 17.42], discret: ['#c9efff', 15.41, '#1b1b1b', 14.17], focus: ['#c9efff', 15.41] },
  'grenat-papeterie-clair': { principal: ['#7a1f3d', '#ffffff', 10.04, '#85314d', 8.26], discret: ['#4f0020', 15.0, '#fcf0f2', 13.95], focus: ['#4f0020', 15.0] },
  'grenat-papeterie-sombre': { principal: ['#fc96ae', '#1e0d11', 9.02, '#fec7d2', 12.77], discret: ['#fc96ae', 9.02, '#2f1119', 8.32], focus: ['#fc96ae', 9.02] },
  'maison-alberto-clair': { principal: ['#836304', '#ffffff', 5.6, '#402e00', 13.05], discret: ['#836304', 5.41, '#fbf3e1', 5.07], focus: ['#836304', 5.41] },
  'maison-alberto-sombre': { principal: ['#ffd060', '#121212', 12.88, '#feeecb', 16.33], discret: ['#ffd060', 12.88, '#1d1b17', 11.83], focus: ['#ffd060', 12.88] },
  'orbe-cafe-clair': { principal: ['#2b4c7e', '#ffffff', 8.61, '#3c5a88', 6.98], discret: ['#4c6994', 5.4, '#f1f3f7', 5.03], focus: ['#4c6994', 5.4] },
  'orbe-cafe-sombre': { principal: ['#86b6fe', '#0e1218', 9.06, '#bdd7fe', 12.8], discret: ['#86b6fe', 9.04, '#111b2a', 8.35], focus: ['#86b6fe', 9.04] },
};

/** Ce qui ne dépend que du mode, identique dans les cinq marques. */
const PAR_MODE = {
  clair: {
    page: '#fbfbfb',
    secondaire: ['#ffffff', '#363026', 13.06, '#ecebe9', 10.96],
    contour: ['#958f84', 3.1],
    danger: ['#cb1d2a', '#ffffff', 5.6, '#6a0000', 13.02],
    'danger-discret': ['#cb1d2a', 5.41, '#fff0ee', 5.06],
    desactive: ['#f3f2f1', '#8a8478', 3.32, 3.59, '#d8d6d2'],
  },
  sombre: {
    page: '#121212',
    secondaire: ['#181818', '#d8d5ce', 12.12, '#212121', 10.99],
    contour: ['#6a665c', 3.27],
    danger: ['#ff978f', '#1a0f0e', 9.01, '#fcc9c4', 12.78],
    'danger-discret': ['#ff978f', 8.99, '#231918', 8.23],
    desactive: ['#1b1b1b', '#7d786c', 3.92, 4.26, '#303030'],
  },
};

const DIMENSIONS = {
  'arrondi.controle': ['{rayon.8}', 8],
  'hauteur.controle.normale': ['{taille.40}', 40],
  'hauteur.controle.petite': ['{taille.32}', 32],
  'epaisseur.focus': ['{trait.2}', 2],
  'decalage.focus': ['{trait.2}', 2],
  'taille-icone.normale': ['{taille.20}', 20],
  'taille-icone.petite': ['{taille.16}', 16],
  'ecart.icone-texte': ['{espace.8}', 8],
};

/** Rapport culori à deux décimales. @param {string} a @param {string} b */
const r2 = (a, b) => Math.round(wcagContrast(a, b) * 100) / 100;

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
  return { set, roles, hex, jetons };
}

test('B1 rôles de couleur du bouton, en alias, dans les dix thèmes', () => {
  const sem = charger('semantique.tokens.json');
  assert.equal(sem.fond.erreur.fort.survol.$value, '{marque.erreur.plein-survol}');
  assert.equal(sem.fond.desactive.$value, '{couleur.neutre.3}');
  assert.equal(sem.texte.desactive.$value, '{couleur.neutre.9}');
  for (const m of MARQUES) for (const mode of MODES) {
    const { roles } = theme(m, mode);
    for (const r of ['fond.erreur.fort.survol', 'fond.desactive', 'texte.desactive']) assert.ok(roles.has(r), `${m}-${mode} : ${r}`);
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
    assert.equal(hex('fond.app'), c.page, `${nom} : page`);
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
    assert.deepEqual([hex('bordure.forte'), r2(hex('bordure.forte'), c.page)], c.contour, `${nom} : contour`);
    assert.deepEqual([hex('bordure.focus'), r2(hex('bordure.focus'), c.page)], t.focus, `${nom} : anneau`);
    assert.ok(c.contour[1] >= 3 && t.focus[1] >= 3, `${nom} : trait sous 3:1`);
    const [fd, td, rd, rp, bd] = c.desactive;
    assert.deepEqual([hex('fond.desactive'), hex('texte.desactive'), r2(td, fd), r2(td, c.page), hex('bordure.discrete')], [fd, td, rd, rp, bd], `${nom} : désactivé`);
    assert.ok(rd >= 3.32 && rd < 4.5 && rp <= 4.26 && rp < 4.5, `${nom} : désactivé hors de la plage de l'attendu`);
  }
});

test('B3 paires du bouton : le survol d\'erreur passe, le désactivé est listé en exception, jamais en échec', () => {
  for (const m of MARQUES) for (const mode of MODES) {
    const c = contratRoles(loadRoles(join(ROOT, 'tokens', m), { mode }));
    const cle = (/** @type {any} */ p) => `${p.devant} sur ${p.fond}`;
    assert.ok(c.pairs.some((p) => cle(p) === 'texte.sur-erreur sur fond.erreur.fort.survol' && p.ok), `${m}-${mode}`);
    assert.deepEqual(c.exceptions.map(cle), ['texte.desactive sur fond.desactive', 'texte.desactive sur fond.app'], `${m}-${mode}`);
    assert.deepEqual(c.fails, [], `${m}-${mode}`);
  }
});

test('B4 aucun groupe de rôles ne porte le nom d\'un groupe de primitives', () => {
  const groupes = (/** @type {any} */ doc) => Object.keys(doc).filter((k) => !k.startsWith('$'));
  const roles = groupes(charger('semantique.tokens.json'));
  const primitives = [...groupes(charger('primitives.tokens.json')), ...groupes(charger('statuts.tokens.json'))];
  assert.deepEqual(roles.filter((g) => primitives.includes(g)), []);
});
