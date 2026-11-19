// @ts-check
/**
 * Fabrique commune des enveloppes de l'atelier (D51, docs/attendus/champ-carte.md) : liste blanche d'attributs, options
 * contre leurs valeurs admises, options obligatoires, règles propres, avec le même motif de message partout ; chaque
 * enveloppe ne déclare que son menu (atelier/composants/<Enveloppe>.menu.js). La fabrique et les menus sont du
 * JavaScript sans Vue : ces tests les lisent sans navigateur.
 *
 * Attendus écrits à la main avant le code (19/11/2026), recopiés du bouton tel qu'il était avant la fabrique (D43) :
 *   W1 liste blanche : id, aria-*, data-* et écouteurs passent ; class, style, color lèvent, nommés dans l'ordre des
 *      attributs ; un menu peut retirer les écouteurs et des attributs nommés ;
 *   W2 option hors de ses valeurs : « <composant> : <option> inconnu(e) : <valeur> (<valeurs>) », accordé au genre du
 *      nom, à égalité stricte ("3" n'est pas 3) ; le premier échec seul, dans l'ordre du menu, après les attributs ;
 *   W3 option obligatoire absente ou vide : « <composant> : <option> obligatoire » ;
 *   W4 règle propre : son message préfixé du composant ; elle reçoit props, attributs et emplacements ; une règle du
 *      rendu (lecture du contenu d'un emplacement) n'est vérifiée qu'au rendu ;
 *   W5 les refus rejoués sur chaque vrai menu : défauts acceptés, attribut inconnu, chaque valeur hors menu, chaque
 *      obligatoire absente, chaque règle ; les cinq messages du bouton à l'octet ;
 *   W6 props du menu du bouton = son ancien bloc props, recopié ici ;
 *   W7 definirEnveloppe : nom, inheritAttrs, emits tirés du menu ; un usage refusé lève au montage, avant le setup de
 *      l'enveloppe ; une prop devenue fausse lève au rendu suivant ; une règle du rendu ne court qu'au rendu ;
 *      les messages du champ, mot pour mot de l'attendu : libellé obligatoire, type inconnu, aria-describedby et
 *      aria-invalid posés à la main refusés ; ceux de la carte : titre obligatoire, niveau inconnu (5, et la chaîne "3"),
 *      texte alternatif obligatoire avec une image (vide admis), lien et actions ensemble, autre chose qu'un Bouton dans
 *      les actions (commentaires, blancs et fragments traversés), écouteur refusé ;
 *   Ajouts pour le bouton à icône seule (19/11/2026, D52, docs/attendus/bouton-icone.md) : W5 rejoue son menu ; ses
 *      messages mot pour mot : libellé et icône obligatoires, variante inconnue (le plein danger n'est pas au menu),
 *      taille et type inconnus, aria-label, aria-labelledby et color refusés, désactivé refusé sur type=submit ; id,
 *      aria-describedby, data-* et onClick passent ; la carte admet un BoutonIcone dans ses actions, et son message de
 *      refus devient « carte : actions : seuls Bouton et BoutonIcone sont admis » ;
 *   W8 chaque .vue de atelier/composants/ passe par la fabrique et son menu, sans déclarer lui-même props, inheritAttrs
 *      ni emits ; chaque menu est importé par un seul .vue.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { definirEnveloppe, propsDuMenu, verifierUsage } from '../atelier/composants/fabrique.js';
import BOUTON from '../atelier/composants/Bouton.menu.js';
import CHAMP from '../atelier/composants/ChampTexte.menu.js';
import CARTE from '../atelier/composants/Carte.menu.js';
import BOUTON_ICONE from '../atelier/composants/BoutonIcone.menu.js';
import { partiesVue } from './helpers/atelier.js';
import { lex } from './helpers/commentaires.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const COMPOSANTS = join(ROOT, 'atelier', 'composants');

/** Menus réels, par nom de fichier. */
const MENUS = { 'Bouton.menu.js': BOUTON, 'ChampTexte.menu.js': CHAMP, 'Carte.menu.js': CARTE, 'BoutonIcone.menu.js': BOUTON_ICONE };

/** Props avec les défauts du menu, comme Vue les donne quand rien n'est passé. @param {any} menu */
const defauts = (menu) => Object.fromEntries(Object.entries(menu.options).map(([k, o]) => [k, /** @type {any} */ (o).defaut]));
/** Message levé par verifierUsage, ou null. @param {any} menu @param {Record<string, any>} props @param {Record<string, any>} [attrs] @param {Record<string, any>} [slots] */
function leve(menu, props, attrs = {}, slots = {}) {
  try {
    verifierUsage(menu, props, attrs, slots);
    return null;
  } catch (e) {
    return /** @type {Error} */ (e).message;
  }
}

/** Menu d'essai, hors de l'atelier. */
const ESSAI = {
  nom: 'Essai',
  prefixe: 'essai',
  options: {
    forme: { type: String, defaut: 'ronde', valeurs: ['ronde', 'carree'], genre: 'f' },
    niveau: { type: Number, defaut: 3, valeurs: [2, 3, 4], genre: 'm' },
    titre: { type: String, obligatoire: true, nom: 'titre' },
  },
};

test('W1 liste blanche d\'attributs', () => {
  const p = { ...defauts(ESSAI), titre: 'T' };
  assert.equal(leve(ESSAI, p, { id: 'x', 'aria-label': 'y', 'data-x': '1', onClick: () => {}, onFocusin: () => {} }), null);
  assert.equal(leve(ESSAI, p, { style: 'a', class: 'b', color: 'c' }), 'essai : attribut refusé : style, class, color');
  const sansEcouteur = { ...ESSAI, ecouteurs: false, attributsRetires: ['aria-invalid'] };
  assert.equal(leve(sansEcouteur, p, { onClick: () => {} }), 'essai : attribut refusé : onClick');
  assert.equal(leve(sansEcouteur, p, { 'aria-invalid': 'true', 'aria-label': 'y' }), 'essai : attribut refusé : aria-invalid');
});

test('W2 option hors de ses valeurs', () => {
  const p = { ...defauts(ESSAI), titre: 'T' };
  assert.equal(leve(ESSAI, { ...p, forme: 'ovale' }), 'essai : forme inconnue : ovale (ronde, carree)');
  assert.equal(leve(ESSAI, { ...p, niveau: 5 }), 'essai : niveau inconnu : 5 (2, 3, 4)');
  assert.equal(leve(ESSAI, { ...p, niveau: '3' }), 'essai : niveau inconnu : 3 (2, 3, 4)');
  assert.equal(leve(ESSAI, { ...p, forme: 'ovale', niveau: 5 }), 'essai : forme inconnue : ovale (ronde, carree)', 'ordre du menu');
  assert.equal(leve(ESSAI, { ...p, forme: 'ovale' }, { color: 'c' }), 'essai : attribut refusé : color', 'attributs d\'abord');
});

test('W3 option obligatoire', () => {
  const p = defauts(ESSAI);
  assert.equal(leve(ESSAI, p), 'essai : titre obligatoire');
  assert.equal(leve(ESSAI, { ...p, titre: '' }), 'essai : titre obligatoire');
  assert.equal(leve(ESSAI, { ...p, titre: 'T' }), null);
});

test('W4 règle propre', () => {
  /** @type {any[]} */
  const vus = [];
  const menu = { ...ESSAI, regles: [(/** @type {any} */ p, /** @type {any} */ a, /** @type {any} */ s) => (vus.push([p.titre, Object.keys(a), Object.keys(s)]), p.forme === 'carree' ? 'carrée refusée ici' : null)] };
  const p = { ...defauts(ESSAI), titre: 'T' };
  assert.equal(leve(menu, p, { id: 'x' }, { actions: () => [] }), null);
  assert.deepEqual(vus, [['T', ['id'], ['actions']]]);
  assert.equal(leve(menu, { ...p, forme: 'carree' }), 'essai : carrée refusée ici');
  const auRendu = { ...ESSAI, reglesDuRendu: [(/** @type {any} */ _p, /** @type {any} */ _a, /** @type {any} */ s) => (s.contenu?.() === 'faux' ? 'contenu refusé' : null)] };
  assert.equal(leve(auRendu, p, {}, { contenu: () => 'faux' }), null, 'hors du rendu, la règle du rendu ne court pas');
  assert.throws(() => verifierUsage(auRendu, p, {}, { contenu: () => 'faux' }, { rendu: true }), /^Error: essai : contenu refusé$/);
});

test('W5 refus rejoués sur chaque menu réel', () => {
  for (const [fichier, menu] of Object.entries(MENUS)) {
    const obligatoires = Object.entries(menu.options).filter(([, o]) => /** @type {any} */ (o).obligatoire);
    const p = { ...defauts(menu), ...Object.fromEntries(obligatoires.map(([k]) => [k, 'x'])) };
    assert.equal(leve(menu, p), null, `${fichier} : défauts acceptés`);
    assert.match(String(leve(menu, p, { inconnu: 1 })), new RegExp(`^${menu.prefixe} : attribut refusé : inconnu$`), fichier);
    for (const [k, o] of Object.entries(menu.options)) {
      const opt = /** @type {any} */ (o);
      if (opt.valeurs) assert.match(String(leve(menu, { ...p, [k]: 'hors-menu' })), new RegExp(`^${menu.prefixe} : ${opt.nom ?? k} inconnue? : hors-menu \\(`), `${fichier} ${k}`);
      if (opt.obligatoire) assert.equal(leve(menu, { ...p, [k]: undefined }), `${menu.prefixe} : ${opt.nom ?? k} obligatoire`, `${fichier} ${k}`);
    }
  }
  const p = defauts(BOUTON);
  assert.equal(leve(BOUTON, p, { color: 'secondary' }), 'bouton : attribut refusé : color');
  assert.equal(leve(BOUTON, { ...p, variante: 'rose' }), 'bouton : variante inconnue : rose (principal, secondaire, discret, danger, danger-discret)');
  assert.equal(leve(BOUTON, { ...p, taille: 'grande' }), 'bouton : taille inconnue : grande (normale, petite)');
  assert.equal(leve(BOUTON, { ...p, type: 'image' }), 'bouton : type inconnu : image (button, submit, reset)');
  assert.equal(leve(BOUTON, { ...p, type: 'submit', desactive: true }), 'bouton : désactivé refusé sur type=submit');
  assert.equal(leve(BOUTON, { ...p, type: 'submit', chargement: true }), null);
  assert.equal(leve(BOUTON, p, { onClick: () => {}, id: 'b', 'aria-label': 'x', 'data-cas': 'y' }), null);
  const c = { ...defauts(CHAMP), libelle: 'Nom' };
  assert.equal(leve(CHAMP, { ...c, libelle: undefined }), 'champ : libellé obligatoire');
  assert.equal(leve(CHAMP, { ...c, type: 'tel' }), 'champ : type inconnu : tel (text, email, search, password)');
  assert.equal(leve(CHAMP, c, { variant: 'filled' }), 'champ : attribut refusé : variant');
  assert.equal(leve(CHAMP, c, { 'aria-describedby': 'ailleurs' }), 'champ : attribut refusé : aria-describedby');
  assert.equal(leve(CHAMP, c, { 'aria-invalid': 'true' }), 'champ : attribut refusé : aria-invalid');
  assert.equal(leve(CHAMP, c, { id: 'x', 'aria-label': 'y', onFocus: () => {}, 'data-cas': 'z' }), null);
  const k = { ...defauts(CARTE), titre: 'Club de lecture' };
  /** Règles de la carte, rendu compris. @param {Record<string, any>} props @param {Record<string, any>} [attrs] @param {Record<string, any>} [slots] */
  const carte = (props, attrs = {}, slots = {}) => {
    try {
      verifierUsage(CARTE, props, attrs, slots, { rendu: true });
      return null;
    } catch (e) {
      return /** @type {Error} */ (e).message;
    }
  };
  const bouton = { type: { name: 'Bouton' }, children: null };
  assert.equal(carte({ ...k, titre: undefined }), 'carte : titre obligatoire');
  assert.equal(carte({ ...k, niveau: 5 }), 'carte : niveau inconnu : 5 (2, 3, 4)');
  assert.equal(carte({ ...k, niveau: '3' }), 'carte : niveau inconnu : 3 (2, 3, 4)');
  assert.equal(carte({ ...k, media: 'x.png' }), 'carte : texte alternatif obligatoire avec une image');
  assert.equal(carte({ ...k, media: 'x.png', texteAlternatif: '' }), null, 'image décorative');
  assert.equal(carte({ ...k, lien: '#x' }, {}, { actions: () => [bouton] }), 'carte : lien et actions ensemble refusés');
  assert.equal(carte(k, {}, { actions: () => [{ type: 'a', children: 'Lire' }] }), 'carte : actions : seuls Bouton et BoutonIcone sont admis');
  assert.equal(carte(k, {}, { actions: () => [{ type: { name: 'Lien' } }] }), 'carte : actions : seuls Bouton et BoutonIcone sont admis');
  // Types de nœud de Vue 3.5 (runtime-core : Text, Fragment, Comment, Static).
  const texte = Symbol.for('v-txt');
  const fragment = Symbol.for('v-fgt');
  assert.equal(carte(k, {}, { actions: () => [bouton, { type: texte, children: '  ' }, { type: fragment, children: [bouton, { type: Symbol.for('v-cmt'), children: 'v-if' }] }] }), null, 'blancs, fragments et commentaires traversés');
  assert.equal(carte(k, {}, { actions: () => [{ type: Symbol.for('v-stc'), children: '<a>Lire</a>' }] }), 'carte : actions : seuls Bouton et BoutonIcone sont admis');
  assert.equal(carte(k, {}, { actions: () => [{ type: texte, children: 'Lire' }] }), 'carte : actions : seuls Bouton et BoutonIcone sont admis');
  assert.equal(carte(k, { onClick: () => {} }), 'carte : attribut refusé : onClick');
  assert.equal(carte(k, {}, { actions: () => [bouton, { type: { name: 'BoutonIcone' }, children: null }] }), null, 'bouton à icône admis dans les actions');
  const i = { ...defauts(BOUTON_ICONE), libelle: 'Fermer', icone: () => null };
  assert.equal(leve(BOUTON_ICONE, i), null);
  assert.equal(leve(BOUTON_ICONE, { ...i, libelle: undefined }), 'bouton à icône : libellé obligatoire');
  assert.equal(leve(BOUTON_ICONE, { ...i, libelle: '' }), 'bouton à icône : libellé obligatoire');
  assert.equal(leve(BOUTON_ICONE, { ...i, icone: undefined }), 'bouton à icône : icône obligatoire');
  assert.equal(leve(BOUTON_ICONE, { ...i, variante: 'danger' }), 'bouton à icône : variante inconnue : danger (discret, secondaire, principal, danger-discret)');
  assert.equal(leve(BOUTON_ICONE, { ...i, taille: 'grande' }), 'bouton à icône : taille inconnue : grande (normale, petite)');
  assert.equal(leve(BOUTON_ICONE, { ...i, type: 'image' }), 'bouton à icône : type inconnu : image (button, submit, reset)');
  assert.equal(leve(BOUTON_ICONE, i, { 'aria-label': 'Croix' }), 'bouton à icône : attribut refusé : aria-label');
  assert.equal(leve(BOUTON_ICONE, i, { 'aria-labelledby': 'ailleurs' }), 'bouton à icône : attribut refusé : aria-labelledby');
  assert.equal(leve(BOUTON_ICONE, i, { color: 'secondary' }), 'bouton à icône : attribut refusé : color');
  assert.equal(leve(BOUTON_ICONE, { ...i, type: 'submit', desactive: true }), 'bouton à icône : désactivé refusé sur type=submit');
  assert.equal(leve(BOUTON_ICONE, i, { id: 'b', 'aria-describedby': 'aide', 'data-cas': 'y', onClick: () => {} }), null);
  assert.equal(BOUTON_ICONE.options.variante.defaut, 'discret');
  assert.equal(carte(k, { id: 'c', 'aria-label': 'x', 'data-cas': 'y' }), null);
});

test('W6 props du bouton inchangées', () => {
  assert.deepEqual(propsDuMenu(BOUTON), {
    variante: { type: String, default: 'principal' },
    taille: { type: String, default: 'normale' },
    icone: { type: [Object, Function], default: null },
    pleineLargeur: { type: Boolean, default: false },
    desactive: { type: Boolean, default: false },
    chargement: { type: Boolean, default: false },
    type: { type: String, default: 'button' },
  });
  const c = definirEnveloppe(BOUTON, () => () => null);
  assert.equal(c.name, 'Bouton');
  assert.equal(c.inheritAttrs, false);
  assert.deepEqual(c.emits, ['click']);
});

test('W7 definirEnveloppe vérifie au montage puis à chaque rendu', () => {
  /** @type {string[]} */
  const journal = [];
  const c = definirEnveloppe(ESSAI, () => {
    journal.push('setup');
    return () => (journal.push('rendu'), 'ok');
  });
  const ctx = (/** @type {Record<string, any>} */ attrs) => ({ attrs, slots: {}, emit: () => {} });
  assert.throws(() => c.setup({ ...defauts(ESSAI), titre: 'T' }, ctx({ color: 'c' })), /^Error: essai : attribut refusé : color$/);
  assert.deepEqual(journal, [], 'rien avant la vérification');
  const props = { ...defauts(ESSAI), titre: 'T' };
  const rendre = c.setup(props, ctx({}));
  assert.equal(rendre(), 'ok');
  props.forme = 'ovale';
  assert.throws(() => rendre(), /essai : forme inconnue : ovale/);
  assert.deepEqual(journal, ['setup', 'rendu']);
  /** @type {string[]} */
  const lus = [];
  const auRendu = definirEnveloppe({ ...ESSAI, reglesDuRendu: [() => (lus.push('lu'), null)] }, () => () => 'ok');
  const r = auRendu.setup({ ...defauts(ESSAI), titre: 'T' }, ctx({}));
  assert.deepEqual(lus, [], 'pas au montage');
  r();
  assert.deepEqual(lus, ['lu'], 'au rendu');
});

test('W8 chaque enveloppe passe par la fabrique et son menu', () => {
  const vues = readdirSync(COMPOSANTS).filter((f) => f.endsWith('.vue')).sort();
  const menus = readdirSync(COMPOSANTS).filter((f) => f.endsWith('.menu.js')).sort();
  assert.deepEqual(menus, Object.keys(MENUS).sort(), 'chaque menu est rejoué par W5');
  /** @type {Record<string, string[]>} */
  const importeurs = Object.fromEntries(menus.map((m) => [m, []]));
  for (const v of vues) {
    const script = lex(partiesVue(readFileSync(join(COMPOSANTS, v), 'utf8')).script).code;
    assert.match(script, /from '\.\/fabrique\.js';/, `${v} importe la fabrique`);
    assert.match(script, /export default definirEnveloppe\(/, `${v} est rendu par definirEnveloppe`);
    assert.doesNotMatch(script, /\b(props|inheritAttrs|emits)\s*:/, `${v} ne déclare ni props, ni inheritAttrs, ni emits`);
    for (const m of menus) if (script.includes(`from './${m}'`)) importeurs[m].push(v);
  }
  for (const m of menus) assert.equal(importeurs[m].length, 1, `${m} importé par un seul .vue (${importeurs[m].join(', ')})`);
});
