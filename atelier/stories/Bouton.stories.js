// Stories du bouton (D43) : la planche, que la preuve force état par état et enregistre ; la vitrine, toutes les marques
// en clair et en sombre côte à côte ; le bac à sable, réglable. Les marques sont lues dans leurs fichiers de thèmes,
// comme dans l'aperçu : aucun nom n'est écrit ici.
import { h } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import Bouton from '../composants/Bouton.vue';

const fichiers = import.meta.glob(['../../tokens/*/vuetify.json', '!../../tokens/commun/vuetify.json'], { eager: true, import: 'default' });
/** Thèmes dans l'ordre du sélecteur : marques par dossier, puis clair et sombre. */
const THEMES = Object.keys(fichiers)
  .sort()
  .flatMap((chemin) => Object.entries(fichiers[chemin].themes).map(([nom, t]) => ({ nom, titre: `${fichiers[chemin].nom}, ${t.dark ? 'sombre' : 'clair'}` })));

const VARIANTES = ['principal', 'secondaire', 'discret', 'danger', 'danger-discret'];
const TAILLES = ['normale', 'petite'];
/** États de la planche ; survol et focus y sont au repos, la preuve les force. */
const ETATS = ['repos', 'survol', 'focus', 'désactivé', 'chargement'];

/** Icône d'essai, dessinée ici : une croix d'ajout. */
const Plus = () => h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', focusable: 'false' }, [h('path', { d: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z' })]);

/** Mise en page des planches de l'atelier, hors du design system. */
const GRILLE = 'display:grid;grid-template-columns:repeat(6,max-content);gap:16px 24px;align-items:center;padding:24px';
const ENTETE = 'font-size:12px;opacity:0.7';

/**
 * Une rangée par variante et taille, une colonne par état.
 * @param {string[]} etats @param {{ icone?: boolean, sansIcone?: boolean }} [o]
 */
function grille(etats, o = {}) {
  const lignes = VARIANTES.flatMap((variante) => TAILLES.map((taille) => ({ variante, taille })));
  return h('div', { style: GRILLE.replace('repeat(6', `repeat(${etats.length + 1}`) }, [
    h('span'),
    ...etats.map((e) => h('span', { style: ENTETE }, e)),
    ...lignes.flatMap(({ variante, taille }) => [
      h('span', { style: ENTETE }, `${variante}, ${taille}`),
      ...etats.map((etat) =>
        h(
          Bouton,
          {
            variante,
            taille,
            icone: o.sansIcone ? null : Plus,
            desactive: etat === 'désactivé',
            chargement: etat === 'chargement',
            'data-etat': etat,
            'data-variante': variante,
            'data-taille': taille,
          },
          () => 'Ajouter',
        ),
      ),
    ]),
  ]);
}

export default { title: 'Composants/Bouton' };

/** Planche d'un thème, celui de la barre : chaque variante et taille dans chaque état, avec icône. */
export const Planche = {
  render: () => ({ setup: () => () => grille(ETATS) }),
};

/** Les dix thèmes côte à côte, au repos, désactivé et en chargement, avec et sans icône. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [
              h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre),
              grille(['repos', 'désactivé', 'chargement']),
              grille(['repos', 'désactivé', 'chargement'], { sansIcone: true }),
            ]),
          ),
        ),
      ),
  }),
};

/** Bac à sable : chaque option du menu, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { texte: 'Commander', variante: 'principal', taille: 'normale', icone: false, pleineLargeur: false, desactive: false, chargement: false },
  argTypes: {
    variante: { control: 'select', options: VARIANTES },
    taille: { control: 'inline-radio', options: TAILLES },
  },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () =>
      h('div', { style: 'padding:24px' }, [
        h(Bouton, { variante: args.variante, taille: args.taille, icone: args.icone ? Plus : null, pleineLargeur: args.pleineLargeur, desactive: args.desactive, chargement: args.chargement }, () => args.texte),
      ]),
  }),
};
