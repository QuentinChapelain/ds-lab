// Props de la carte (D50, D51, D56, D57) : leurs valeurs admises, ses règles propres. Lu par la fabrique (fabrique.js) ; tout
// usage hors de ce menu lève, et aucune carte n'est rendue. Pas d'attribut on… : une carte qui se clique a un lien (prop
// href) ; un écouteur de clic ferait de la carte de Vuetify un bloc cliquable sans rôle ni focus.
import BOUTON from './DsButton.menu.js';
import BOUTON_ICONE from './DsIconButton.menu.js';

/** Composants admis dans le slot actions : le bouton et le bouton à icône seule (D52). */
const ADMIS = [BOUTON.nom, BOUTON_ICONE.nom];

/** Types de nœud de Vue, partagés par Symbol.for (vue 3.5, runtime-core) : lus sans importer Vue. */
const TEXTE = Symbol.for('v-txt');
const COMMENTAIRE = Symbol.for('v-cmt');
const FRAGMENT = Symbol.for('v-fgt');

/**
 * Nœuds rendus d'un slot qui ne sont pas des boutons des composants admis ; commentaires, blancs et fragments sont
 * traversés. Un nœud de Vue a pour type un composant (objet), une balise (chaîne) ou un symbole (texte, commentaire,
 * fragment, contenu figé).
 * @param {any[]} noeuds
 * @returns {any[]}
 */
function autresQueBouton(noeuds) {
  return noeuds.flatMap((n) => {
    if (n === null || n === undefined || typeof n === 'boolean') return [];
    if (typeof n === 'string') return n.trim() ? [n] : [];
    if (Array.isArray(n)) return autresQueBouton(n);
    if (n.type === COMMENTAIRE) return [];
    if (n.type === FRAGMENT) return autresQueBouton(Array.isArray(n.children) ? n.children : []);
    if (n.type === TEXTE) return typeof n.children === 'string' && n.children.trim() ? [n] : [];
    return ADMIS.includes(n.type?.name) ? [] : [n];
  });
}

export default {
  nom: 'DsCard',
  options: {
    title: { type: String, obligatoire: true },
    headingLevel: { type: Number, defaut: 3, valeurs: [2, 3, 4] },
    image: { type: String },
    imageAlt: { type: String },
    href: { type: String },
  },
  ecouteurs: false,
  regles: [
    (/** @type {any} */ p) => (p.image && p.imageAlt === undefined ? 'imageAlt : obligatoire avec image' : null),
    (/** @type {any} */ p, /** @type {any} */ _a, /** @type {any} */ s) => (p.href && s.actions ? 'href : refusé avec le slot actions' : null),
  ],
  reglesDuRendu: [(/** @type {any} */ _p, /** @type {any} */ _a, /** @type {any} */ s) => (s.actions && autresQueBouton(s.actions()).length ? 'slot actions : seuls DsButton et DsIconButton sont admis' : null)],
};
