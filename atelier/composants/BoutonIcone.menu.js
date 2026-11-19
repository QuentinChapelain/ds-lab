// Menu du bouton à icône seule (D52, D51) : ses options et leurs valeurs admises, son événement, sa règle propre. Lu par
// la fabrique (fabrique.js) ; tout usage hors de ce menu lève, et aucun bouton n'est rendu. Le libellé devient le nom
// accessible (aria-label) : aria-label et aria-labelledby donnés à la main lèvent.
export default {
  nom: 'BoutonIcone',
  prefixe: 'bouton à icône',
  options: {
    libelle: { type: String, obligatoire: true, nom: 'libellé' },
    icone: { type: [Object, Function], obligatoire: true, nom: 'icône' },
    variante: { type: String, defaut: 'discret', valeurs: ['discret', 'secondaire', 'principal', 'danger-discret'], genre: 'f' },
    taille: { type: String, defaut: 'normale', valeurs: ['normale', 'petite'], genre: 'f' },
    desactive: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'button', valeurs: ['button', 'submit', 'reset'], genre: 'm' },
  },
  evenements: ['click'],
  attributsRetires: ['aria-label', 'aria-labelledby'],
  regles: [(/** @type {any} */ p) => (p.desactive && p.type === 'submit' ? 'désactivé refusé sur type=submit' : null)],
};
