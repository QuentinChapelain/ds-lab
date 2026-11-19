// Menu du champ de texte (D49, D51) : ses options et leurs valeurs admises, son événement. Lu par la fabrique
// (fabrique.js) ; tout usage hors de ce menu lève, et aucun champ n'est rendu. aria-describedby et aria-invalid sont
// posés par l'enveloppe d'après l'aide et l'erreur : donnés à la main, ils lèvent.
export default {
  nom: 'ChampTexte',
  prefixe: 'champ',
  options: {
    libelle: { type: String, obligatoire: true, nom: 'libellé' },
    aide: { type: String },
    erreur: { type: String },
    obligatoire: { type: Boolean, defaut: false },
    desactive: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'text', valeurs: ['text', 'email', 'search', 'password'], genre: 'm' },
    icone: { type: [Object, Function], defaut: null },
    modelValue: { type: String, defaut: '' },
    nom: { type: String },
    autocomplete: { type: String },
    exemple: { type: String },
  },
  evenements: ['update:modelValue'],
  attributsRetires: ['aria-describedby', 'aria-invalid'],
};
