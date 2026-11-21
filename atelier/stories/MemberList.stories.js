// Stories de MemberList, module de l'annuaire : la liste des dix membres fictifs sous le titre de la page qui la nomme,
// que le test de rendu mesure et enregistre à 1 280 et à 360 px de large ; la liste vide, qui ne rend rien ; le clavier,
// la liste entre deux boutons ; le bac à sable ; les refus. Seule la mise en page de la page est écrite ici.
import { h } from 'vue';
import MemberList from '../modules/MemberList.vue';
import DsButton from '../composants/DsButton.vue';
import { MEMBRES, props } from './membres.js';

/** Les dix membres, leur cas en data-cas pour le test de rendu. */
const MEMBRES_LISTE = MEMBRES.map((m) => ({ ...props(m), 'data-cas': m.cas }));
const TITRE = 'font-family:var(--v-ds-card-title-font-family);font-size:var(--v-ds-card-title-font-size);font-weight:var(--v-ds-card-title-font-weight);color:rgb(var(--v-theme-on-background));margin:0';

/**
 * Page d'annuaire : le titre qui nomme la liste, puis la liste, sur toute la largeur de la page.
 * @param {Record<string, any>} [o] props de la liste @param {unknown[]} [avant] @param {unknown[]} [apres]
 */
const page = (o = {}, avant = [], apres = []) =>
  h('main', { style: 'display:flex;flex-direction:column;gap:24px;padding:24px' }, [
    h('h1', { id: 'titre-annuaire', style: TITRE }, 'Annuaire'),
    ...avant,
    h(MemberList, { members: MEMBRES_LISTE, 'aria-labelledby': 'titre-annuaire', 'data-cas': 'liste', ...o }),
    ...apres,
  ]);

// Plein cadre : la page de l'annuaire occupe toute la largeur de l'aperçu, comme sur un écran de 360 px.
export default { title: 'Modules/MemberList', parameters: { layout: 'fullscreen' } };

/** La liste des dix membres, dans le thème de la barre. */
export const Liste = {
  render: () => ({ setup: () => () => page() }),
};

/** Sans membre : rien n'est rendu, ni liste ni élément ; la page porte son message. */
export const Vide = {
  render: () => ({ setup: () => () => page({ members: [] }) }),
};

/** Clavier : la liste entre deux boutons, pour la tabulation. */
export const Clavier = {
  render: () => ({
    setup: () => () =>
      page({}, [h('div', [h(DsButton, { variant: 'secondary', 'data-cas': 'avant' }, () => 'Avant')])], [h('div', [h(DsButton, { variant: 'secondary', 'data-cas': 'apres' }, () => 'Après')])]),
  }),
};

/** Bac à sable : nombre de membres et niveau de titre, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { nombre: MEMBRES.length, headingLevel: 3 },
  argTypes: { nombre: { control: { type: 'range', min: 0, max: MEMBRES.length } }, headingLevel: { control: 'inline-radio', options: [2, 3, 4] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () => page({ members: MEMBRES_LISTE.slice(0, args.nombre), headingLevel: args.headingLevel }),
  }),
};

const M = MEMBRES.slice(0, 3).map(props);
/** @param {Record<string, any>} o @param {Record<string, any>} [slots] */
const refus = (o, slots) => ({ render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(MemberList, o, slots)]) }) });

/** Refus : sans liste de membres ; la story montre l'erreur, aucun membre. */
export const RefusSansMembres = refus({});
/** Refus : le troisième membre sans nom. */
export const RefusMembreSansNom = refus({ members: [M[0], M[1], { ...M[2], name: undefined }] });
/** Refus : un DsTag de ton inconnu chez le deuxième membre. */
export const RefusTonDuMembre = refus({ members: [M[0], { ...M[1], tags: [{ text: 'Lyon', tone: 'accent' }] }] });
/** Refus : un membre qui porte son niveau de titre ; la liste le donne. */
export const RefusNiveauDuMembre = refus({ members: [M[0], { ...M[1], headingLevel: 2 }] });
/** Refus : un niveau de titre hors de 2, 3 et 4. */
export const RefusNiveau = refus({ members: M, headingLevel: 5 });
/** Refus : la liste nommée à la main ; elle se nomme par le titre de la page. */
export const RefusNomALaMain = refus({ members: M, 'aria-label': 'Annuaire' });
/** Refus : écouteur de clic ; chaque membre se suit par son lien. */
export const RefusEcouteur = refus({ members: M, onClick: () => {} });
/** Refus : un slot ; le contenu vient des props. */
export const RefusSlot = refus({ members: M }, { default: () => 'Texte' });
