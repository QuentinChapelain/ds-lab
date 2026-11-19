// Menu de l'avatar (D54, D51) : ses options et leurs valeurs admises, ses règles propres. Lu par la fabrique
// (fabrique.js) ; tout usage hors de ce menu lève, et aucun avatar n'est rendu. Le nom est seul maître du nom accessible
// et l'option décoratif, seule maîtresse du silence : aria-label, aria-labelledby et aria-hidden donnés à la main lèvent.
// Pas d'écouteurs : un avatar ne se clique pas ; le lien vers un profil appartient à la pièce qui l'entoure.
import { initiales } from './initiales.js';

export default {
  nom: 'Avatar',
  prefixe: 'avatar',
  options: {
    nom: { type: String, obligatoire: true },
    image: { type: String },
    decoratif: { type: Boolean, defaut: false, nom: 'décoratif' },
    taille: { type: String, defaut: 'normale', valeurs: ['normale', 'grande'], genre: 'f' },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label', 'aria-labelledby', 'aria-hidden'],
  regles: [
    (/** @type {any} */ p) => (String(p.nom).trim() === '' ? 'nom obligatoire' : null),
    (/** @type {any} */ p) => (initiales(String(p.nom)) === '' ? 'nom sans lettre' : null),
  ],
};
