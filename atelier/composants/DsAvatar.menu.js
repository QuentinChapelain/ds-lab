// Props de l'avatar (D54, D51) : leurs valeurs admises, ses règles propres. Lu par la fabrique (fabrique.js) ;
// tout usage hors de ce menu lève, et aucun avatar n'est rendu. Le name est seul maître du nom accessible et decorative,
// seul maître du silence : aria-label, aria-labelledby et aria-hidden donnés à la main lèvent. Pas d'attribut on… : un
// avatar ne se clique pas ; le lien vers un profil appartient à la pièce qui l'entoure.
import { initiales } from './initiales.js';

export default {
  nom: 'DsAvatar',
  options: {
    name: { type: String, obligatoire: true },
    image: { type: String },
    decorative: { type: Boolean, defaut: false },
    size: { type: String, defaut: 'medium', valeurs: ['medium', 'large'] },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label', 'aria-labelledby', 'aria-hidden'],
  regles: [
    (/** @type {any} */ p) => (String(p.name).trim() === '' ? 'name : obligatoire' : null),
    (/** @type {any} */ p) => (initiales(String(p.name)) === '' ? 'name : sans lettre' : null),
  ],
};
