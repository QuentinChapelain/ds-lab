// Props du champ de texte (D49, D51) : leurs valeurs admises, son événement. Lu par la fabrique (fabrique.js) ;
// tout usage hors de ce menu lève, et aucun champ n'est rendu. aria-describedby et aria-invalid sont posés par le
// composant d'après le hint et l'errorMessage : donnés à la main, ils lèvent.
export default {
  nom: 'DsTextInput',
  options: {
    label: { type: String, obligatoire: true },
    hint: { type: String },
    errorMessage: { type: String },
    required: { type: Boolean, defaut: false },
    disabled: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'text', valeurs: ['text', 'email', 'search', 'password'] },
    prependInnerIcon: { type: [Object, Function], defaut: null },
    modelValue: { type: String, defaut: '' },
    name: { type: String },
    autocomplete: { type: String },
    placeholder: { type: String },
  },
  evenements: ['update:modelValue'],
  attributsRetires: ['aria-describedby', 'aria-invalid'],
};
