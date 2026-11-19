// Menu de la carte (D50, D51) : ses options et leurs valeurs admises, ses règles propres. Lu par la fabrique
// (fabrique.js) ; tout usage hors de ce menu lève, et aucune carte n'est rendue. Pas d'écouteurs : une carte qui se clique
// a un lien (option lien) ; un écouteur de clic ferait de la carte de Vuetify un bloc cliquable sans rôle ni focus.
import BOUTON from './Bouton.menu.js';

/** Types de nœud de Vue, partagés par Symbol.for (vue 3.5, runtime-core) : lus sans importer Vue. */
const TEXTE = Symbol.for('v-txt');
const COMMENTAIRE = Symbol.for('v-cmt');
const FRAGMENT = Symbol.for('v-fgt');

/**
 * Nœuds rendus d'un emplacement qui ne sont pas des boutons de l'enveloppe ; commentaires, blancs et fragments sont
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
    return n.type?.name === BOUTON.nom ? [] : [n];
  });
}

export default {
  nom: 'Carte',
  prefixe: 'carte',
  options: {
    titre: { type: String, obligatoire: true },
    niveau: { type: Number, defaut: 3, valeurs: [2, 3, 4], genre: 'm' },
    media: { type: String },
    texteAlternatif: { type: String },
    lien: { type: String },
  },
  ecouteurs: false,
  regles: [
    (/** @type {any} */ p) => (p.media && p.texteAlternatif === undefined ? 'texte alternatif obligatoire avec une image' : null),
    (/** @type {any} */ p, /** @type {any} */ _a, /** @type {any} */ s) => (p.lien && s.actions ? 'lien et actions ensemble refusés' : null),
  ],
  reglesDuRendu: [(/** @type {any} */ _p, /** @type {any} */ _a, /** @type {any} */ s) => (s.actions && autresQueBouton(s.actions()).length ? 'actions : seul Bouton est admis' : null)],
};
