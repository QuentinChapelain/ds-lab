// Stories de la carte (D50) : la planche, que la preuve force état par état et enregistre ; la vitrine, toutes les marques
// en clair et en sombre côte à côte ; les niveaux de titre ; le clavier ; le bac à sable ; les refus. L'image d'essai est
// dessinée ici, au format 4:3, pour que le recadrage en 16:9 se voie.
import { h } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import DsCard from '../composants/DsCard.vue';
import DsButton from '../composants/DsButton.vue';
import { ENTETE, THEMES } from './commun.js';

/** Image d'essai, 4:3 : un ciel, deux collines, un soleil et un repère au centre. */
const IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#9cc3d5"/><circle cx="310" cy="80" r="36" fill="#f2d16b"/><path d="M0 220 Q100 140 200 210 T400 190 V300 H0z" fill="#6f9a5b"/><path d="M0 260 Q140 200 260 250 T400 240 V300 H0z" fill="#4e7a43"/><rect x="190" y="140" width="20" height="20" fill="#ffffff"/></svg>',
)}`;
const TEXTE = 'Chaque jeudi soir, une heure pour échanger autour d\'un livre choisi ensemble.';

/** États de la planche ; survol et focus y sont au repos, la preuve les force. */
const ETATS = [
  ['simple', {}, false],
  ['image', { image: IMAGE, imageAlt: 'Deux collines sous un soleil' }, false],
  ['image-décorative', { image: IMAGE, imageAlt: '' }, false],
  ['actions', {}, true],
  ['lien', { href: '#carte-lien' }, false],
  ['lien-survol', { href: '#carte-lien-survol' }, false],
  ['lien-focus', { href: '#carte-lien-focus', image: IMAGE, imageAlt: 'Deux collines sous un soleil' }, false],
];

/** Actions d'essai : deux DsButton. */
const actions = () => [h(DsButton, { variant: 'secondary' }, () => 'Plus tard'), h(DsButton, null, () => 'S\'inscrire')];

/** @param {string[]} [garder] états montrés, tous par défaut */
function planche(garder) {
  return h(
    'div',
    { style: 'display:grid;grid-template-columns:repeat(3,320px);gap:24px;padding:24px;align-items:start' },
    ETATS.filter(([etat]) => !garder || garder.includes(/** @type {string} */ (etat))).map(([etat, o, avecActions]) =>
      h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [
        h('span', { style: ENTETE }, /** @type {string} */ (etat)),
        h(DsCard, { title: 'Club de lecture', ...(/** @type {object} */ (o)), 'data-etat': etat }, { default: () => TEXTE, ...(avecActions ? { actions } : {}) }),
      ]),
    ),
  );
}

export default { title: 'Composants/DsCard' };

/** Planche d'un thème, celui de la barre : chaque état. */
export const Planche = {
  render: () => ({ setup: () => () => planche() }),
};

/** Les dix thèmes côte à côte : simple, avec image, avec actions, à lien. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre), planche(['simple', 'image', 'actions', 'lien'])]),
          ),
        ),
      ),
  }),
};

/** Niveaux de titre : 2, 3 (par défaut) et 4, la même apparence. */
export const Niveaux = {
  render: () => ({
    setup: () => () =>
      h('div', { style: 'display:grid;grid-template-columns:repeat(3,320px);gap:24px;padding:24px;align-items:start' }, [
        h(DsCard, { title: 'Titre de niveau 2', headingLevel: 2, 'data-cas': 'niveau-2' }, () => TEXTE),
        h(DsCard, { title: 'Titre de niveau 3', 'data-cas': 'niveau-3' }, () => TEXTE),
        h(DsCard, { title: 'Titre de niveau 4', headingLevel: 4, 'data-cas': 'niveau-4' }, () => TEXTE),
      ]),
  }),
};

/** Clavier : une carte à lien, une carte à actions, une carte à lien avec image. */
export const Clavier = {
  render: () => ({
    setup: () => () =>
      h('div', { style: 'display:grid;grid-template-columns:repeat(3,320px);gap:24px;padding:24px;align-items:start' }, [
        h(DsCard, { title: 'Club de lecture', href: '#lien-a', 'data-cas': 'lien-a' }, () => TEXTE),
        h(DsCard, { title: 'Sortie au jardin', 'data-cas': 'actions' }, { default: () => TEXTE, actions }),
        h(DsCard, { title: 'Réunion du mois', href: '#lien-c', image: IMAGE, imageAlt: 'Deux collines sous un soleil', 'data-cas': 'lien-c' }, () => TEXTE),
      ]),
  }),
};

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { title: 'Club de lecture', texte: TEXTE, headingLevel: 3, image: false, decorative: false, href: false, actions: false },
  argTypes: { headingLevel: { control: 'inline-radio', options: [2, 3, 4] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () =>
      h('div', { style: 'padding:24px;width:320px' }, [
        h(
          DsCard,
          {
            title: args.title,
            headingLevel: args.headingLevel,
            ...(args.image ? { image: IMAGE, imageAlt: args.decorative ? '' : 'Deux collines sous un soleil' } : {}),
            ...(args.href && !args.actions ? { href: '#bac-a-sable' } : {}),
          },
          { default: () => args.texte, ...(args.actions ? { actions } : {}) },
        ),
      ]),
  }),
};

/** Refus : sans titre ; la story montre l'erreur, aucune carte. */
export const RefusSansTitre = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, {}, () => TEXTE)]) }),
};

/** Refus : niveau de titre hors du menu. */
export const RefusNiveau = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, { title: 'Club de lecture', headingLevel: 5 }, () => TEXTE)]) }),
};

/** Refus : image sans texte de remplacement. */
export const RefusImage = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, { title: 'Club de lecture', image: IMAGE }, () => TEXTE)]) }),
};

/** Refus : lien et actions ensemble. */
export const RefusLienEtActions = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, { title: 'Club de lecture', href: '#x' }, { default: () => TEXTE, actions })]) }),
};

/** Refus : autre chose qu'un bouton de l'enveloppe dans les actions. */
export const RefusActions = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, { title: 'Club de lecture' }, { default: () => TEXTE, actions: () => [h('a', { href: '#x' }, 'Lire')] })]) }),
};

/** Refus : écouteur de clic ; une carte qui se clique a un lien. */
export const RefusEcouteur = {
  render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsCard, { title: 'Club de lecture', onClick: () => {} }, () => TEXTE)]) }),
};
