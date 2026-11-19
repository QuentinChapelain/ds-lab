// Props de l'étiquette (D55, D51, D56, D57) : leurs valeurs admises. Lu par la fabrique (fabrique.js) ; tout usage hors de
// ce menu lève, et aucune étiquette n'est rendue. Le texte est une prop et non un slot : rien d'autre que du texte
// n'entre dans une étiquette, pièce muette et statique. Ni attribut on…, ni lien, ni fermeture, ni filtre : closable,
// filter, link, href, to et tabindex lèvent par la liste blanche ; aria-label et aria-labelledby, retirés, aussi, le
// texte se lisant déjà. Aucune limite de longueur : un texte trop long pour la place est coupé par « … ».
export default {
  nom: 'DsTag',
  options: {
    text: { type: String, obligatoire: true },
    tone: { type: String, defaut: 'neutral', valeurs: ['neutral', 'brand'] },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label', 'aria-labelledby'],
};
