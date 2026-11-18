// Menu du bouton (D43, D51) : ses options et leurs valeurs admises, son événement, sa règle propre. Lu par la fabrique
// (fabrique.js) ; tout usage hors de ce menu lève, et aucun bouton n'est rendu.
export default {
  nom: 'Bouton',
  prefixe: 'bouton',
  options: {
    variante: { type: String, defaut: 'principal', valeurs: ['principal', 'secondaire', 'discret', 'danger', 'danger-discret'], genre: 'f' },
    taille: { type: String, defaut: 'normale', valeurs: ['normale', 'petite'], genre: 'f' },
    icone: { type: [Object, Function], defaut: null },
    pleineLargeur: { type: Boolean, defaut: false },
    desactive: { type: Boolean, defaut: false },
    chargement: { type: Boolean, defaut: false },
    type: { type: String, defaut: 'button', valeurs: ['button', 'submit', 'reset'], genre: 'm' },
  },
  evenements: ['click'],
  regles: [(/** @type {any} */ p) => (p.desactive && p.type === 'submit' ? 'désactivé refusé sur type=submit' : null)],
};
