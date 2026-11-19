// Props du bouton à icône seule (D52, D51, D56, D57) : leurs valeurs admises, son événement, sa règle propre. Lu par la
// fabrique (fabrique.js) ; tout usage hors de ce menu lève, et aucun bouton n'est rendu. Le label devient le nom
// accessible (aria-label) : aria-label et aria-labelledby donnés à la main lèvent.
export default {
  nom: 'DsIconButton',
  options: {
    label: { type: String, obligatoire: true },
    icon: { type: [Object, Function], obligatoire: true },
    variant: { type: String, defaut: 'ghost', valeurs: ['ghost', 'secondary', 'primary', 'danger-ghost'] },
    size: { type: String, defaut: 'medium', valeurs: ['medium', 'small'] },
    disabled: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'button', valeurs: ['button', 'submit', 'reset'] },
  },
  evenements: ['click'],
  attributsRetires: ['aria-label', 'aria-labelledby'],
  regles: [(/** @type {any} */ p) => (p.disabled && p.type === 'submit' ? 'disabled : refusé avec type=submit' : null)],
};
