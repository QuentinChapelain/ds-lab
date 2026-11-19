// Props du bouton (D43, D51, D56, D57) : leurs valeurs admises, son événement, sa règle propre. Lu par la fabrique
// (fabrique.js) ; tout usage hors de ce menu lève, et aucun bouton n'est rendu.
export default {
  nom: 'DsButton',
  options: {
    variant: { type: String, defaut: 'primary', valeurs: ['primary', 'secondary', 'ghost', 'danger', 'danger-ghost'] },
    size: { type: String, defaut: 'medium', valeurs: ['medium', 'small'] },
    prependIcon: { type: [Object, Function], defaut: null },
    block: { type: Boolean, defaut: false },
    disabled: { type: Boolean, defaut: false },
    loading: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'button', valeurs: ['button', 'submit', 'reset'] },
  },
  evenements: ['click'],
  regles: [(/** @type {any} */ p) => (p.disabled && p.type === 'submit' ? 'disabled : refusé avec type=submit' : null)],
};
