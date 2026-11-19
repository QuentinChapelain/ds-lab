// Stories de l'avatar (D54) : la planche, que la preuve mesure et enregistre ; les cas de la règle des initiales ; la
// vitrine, toutes les marques en clair et en sombre côte à côte, sur la page et sur une surface ; l'accessibilité ; le bac
// à sable ; les refus. Le portrait d'essai et l'image en échec viennent de commun.js.
import { h } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import Avatar from '../composants/Avatar.vue';
import Bouton from '../composants/Bouton.vue';
import { ECHEC, ENTETE, PORTRAIT, THEMES } from './commun.js';

const NOM = 'Camille Ferrand';

/** États de la planche → options de l'avatar. */
const ETATS = /** @type {const} */ ([
  ['photo', { image: PORTRAIT }],
  ['initiales', {}],
  ['echec', { image: ECHEC }],
  ['decoratif', { decoratif: true }],
]);
/** Intitulés des états, dans la planche. */
const LIBELLES = { photo: 'photo', initiales: 'initiales', echec: 'image en échec', decoratif: 'décoratif' };
/** Cas de la règle des initiales, noms fictifs. */
const CAS = [
  ['deux-mots', 'Camille Ferrand'],
  ['trait-union', 'Jean-Baptiste Morel'],
  ['un-mot-trait-union', 'Marie-Lou'],
  ['un-mot', 'Noé'],
  ['particule', 'Hugo de Lassalle'],
  ['particule-tete', 'de Lassalle'],
  ['elision', 'Inès d’Aubrac'],
  ['accent', 'Émile Brun'],
];

/** @param {string} titre @param {any} contenu */
const cellule = (titre, contenu) => h('div', { style: 'display:flex;flex-direction:column;align-items:flex-start;gap:8px' }, [h('span', { style: ENTETE }, titre), contenu]);

/** @param {boolean} [avecCas] */
function planche(avecCas = true) {
  return h('div', { style: 'display:flex;flex-direction:column;gap:24px;padding:24px' }, [
    ...['normale', 'grande'].map((taille) =>
      h(
        'div',
        { style: 'display:flex;gap:32px;align-items:flex-end' },
        ETATS.map(([etat, o]) => cellule(`${taille}, ${LIBELLES[etat]}`, h(Avatar, { nom: NOM, taille, ...o, 'data-etat': `${taille}-${etat}` }))),
      ),
    ),
    avecCas
      ? h(
          'div',
          { style: 'display:flex;gap:32px;flex-wrap:wrap' },
          CAS.map(([cas, nom]) => cellule(nom, h(Avatar, { nom, 'data-cas': cas }))),
        )
      : null,
  ]);
}

export default { title: 'Composants/Avatar' };

/** Planche d'un thème, celui de la barre : chaque état aux deux tailles, puis les cas de la règle des initiales. */
export const Planche = {
  render: () => ({ setup: () => () => planche() }),
};

/** Les dix thèmes côte à côte, sur la page puis sur une surface. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [
              h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre),
              planche(false),
              h('div', { style: 'margin:0 24px 24px;background:rgb(var(--v-theme-surface));border-radius:12px' }, [planche(false)]),
            ]),
          ),
        ),
      ),
  }),
};

/** Accessibilité : un avatar par cas, entre deux boutons, pour l'arbre d'accessibilité et la tabulation. */
export const Accessibilite = {
  name: 'Accessibilité',
  render: () => ({
    setup: () => () =>
      h('div', { style: 'display:flex;gap:16px;align-items:center;padding:24px' }, [
        h(Bouton, { variante: 'secondaire', 'data-cas': 'avant' }, () => 'Avant'),
        ...ETATS.map(([etat, o]) => h('span', { 'data-cas': etat }, [h(Avatar, { nom: '  Camille   Ferrand ', ...o })])),
        h(Bouton, { variante: 'secondaire', 'data-cas': 'apres' }, () => 'Après'),
      ]),
  }),
};

/** Bac à sable : chaque option du menu, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { nom: NOM, photo: false, echec: false, decoratif: false, taille: 'normale' },
  argTypes: { taille: { control: 'inline-radio', options: ['normale', 'grande'] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () =>
      h('div', { style: 'padding:24px' }, [
        h(Avatar, { nom: args.nom, taille: args.taille, decoratif: args.decoratif, ...(args.photo ? { image: args.echec ? ECHEC : PORTRAIT } : {}) }),
      ]),
  }),
};

/** @param {Record<string, any>} o */
const refus = (o) => ({ render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(Avatar, o)]) }) });

/** Refus : sans nom ; la story montre l'erreur, aucun avatar. */
export const RefusSansNom = refus({});
/** Refus : un nom fait d'espaces. */
export const RefusNomVide = refus({ nom: '   ' });
/** Refus : un nom sans lettre. */
export const RefusSansLettre = refus({ nom: '123' });
/** Refus : taille hors du menu. */
export const RefusTaille = refus({ nom: NOM, taille: 'petite' });
/** Refus : nom accessible posé à la main. */
export const RefusNomALaMain = refus({ nom: NOM, 'aria-label': 'Photo' });
