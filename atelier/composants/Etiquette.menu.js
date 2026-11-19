// Menu de l'étiquette (D55, D51) : ses options et leurs valeurs admises. Lu par la fabrique (fabrique.js) ; tout usage
// hors de ce menu lève, et aucune étiquette n'est rendue. Le texte est une option et non un emplacement : rien d'autre
// que du texte n'entre dans une étiquette, pièce muette et statique. Ni écouteurs, ni lien, ni fermeture, ni filtre :
// closable, filter, link, href, to et tabindex lèvent par la liste blanche ; aria-label et aria-labelledby, retirés,
// aussi, le texte se lisant déjà. Aucune limite de longueur : un texte trop long pour la place est coupé par « … ».
export default {
  nom: 'Etiquette',
  prefixe: 'étiquette',
  options: {
    texte: { type: String, obligatoire: true },
    ton: { type: String, defaut: 'neutre', valeurs: ['neutre', 'marque'], genre: 'm' },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label', 'aria-labelledby'],
};
