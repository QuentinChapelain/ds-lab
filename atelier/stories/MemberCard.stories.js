// Stories de MemberCard, module de l'annuaire : la planche, chaque membre fictif dans une colonne de 400 px, que le test
// de rendu mesure et enregistre ; la vitrine, toutes les marques en clair et en sombre ; le clavier, trois membres entre
// deux boutons ; le bac à sable ; les refus. Seule la mise en page des planches est écrite ici.
import { h } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import MemberCard from '../modules/MemberCard.vue';
import DsButton from '../composants/DsButton.vue';
import { ENTETE, THEMES } from './commun.js';
import { MEMBRES, props } from './membres.js';

/** @param {typeof MEMBRES} membres */
const planche = (membres) =>
  h(
    'div',
    { style: 'display:grid;grid-template-columns:repeat(2,400px);gap:24px;padding:24px;align-items:start' },
    membres.map((m) => h('div', { style: 'display:flex;flex-direction:column;gap:8px' }, [h('span', { style: ENTETE }, m.cas), h(MemberCard, { ...props(m), 'data-cas': m.cas })])),
  );

export default { title: 'Modules/MemberCard' };

/** Planche d'un thème, celui de la barre : les dix membres, un cas chacun. */
export const Planche = {
  render: () => ({ setup: () => () => planche(MEMBRES) }),
};

/** Les dix thèmes côte à côte : trois membres, sur la page. */
export const Vitrine = {
  render: () => ({
    setup: () => () =>
      h(
        'div',
        THEMES.map((t) =>
          h(VThemeProvider, { theme: t.nom, withBackground: true }, () =>
            h('section', { 'data-theme': t.nom }, [h('h2', { style: 'font-size:16px;margin:0;padding:24px 24px 0' }, t.titre), planche(MEMBRES.slice(0, 3))]),
          ),
        ),
      ),
  }),
};

/** Clavier : trois membres entre deux boutons, pour la tabulation, l'arbre d'accessibilité et le clic. */
export const Clavier = {
  render: () => ({
    setup: () => () =>
      h('div', { style: 'display:flex;flex-direction:column;align-items:flex-start;gap:24px;padding:24px;width:400px' }, [
        h(DsButton, { variant: 'secondary', 'data-cas': 'avant' }, () => 'Avant'),
        ...MEMBRES.slice(0, 3).map((m) => h('div', { style: 'align-self:stretch' }, [h(MemberCard, { ...props(m), 'data-cas': m.cas })])),
        h(DsButton, { variant: 'secondary', 'data-cas': 'apres' }, () => 'Après'),
      ]),
  }),
};

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { membre: 0, headingLevel: 3 },
  argTypes: { membre: { control: { type: 'range', min: 0, max: MEMBRES.length - 1 } }, headingLevel: { control: 'inline-radio', options: [2, 3, 4] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () => h('div', { style: 'padding:24px;width:400px' }, [h(MemberCard, { ...props(MEMBRES[args.membre]), headingLevel: args.headingLevel })]),
  }),
};

const M = props(MEMBRES[0]);
/** @param {Record<string, any>} o @param {Record<string, any>} [slots] */
const refus = (o, slots) => ({ render: () => ({ setup: () => () => h('div', { style: 'padding:24px;width:400px' }, [h(MemberCard, o, slots)]) }) });

/** Refus : sans nom ; la story montre l'erreur, aucun membre. */
export const RefusSansNom = refus({ ...M, name: undefined });
/** Refus : un nom fait d'espaces. */
export const RefusNomVide = refus({ ...M, name: '   ' });
/** Refus : un nom sans lettre. */
export const RefusSansLettre = refus({ ...M, name: '123' });
/** Refus : sans lien vers le profil. */
export const RefusSansLien = refus({ ...M, href: undefined });
/** Refus : un DsTag de ton inconnu, au rang 2. */
export const RefusTon = refus({ ...M, tags: [{ text: 'Lyon' }, { text: 'Mentor', tone: 'accent' }] });
/** Refus : un DsTag sans texte, au rang 1. */
export const RefusTagSansTexte = refus({ ...M, tags: [{ tone: 'brand' }] });
/** Refus : le nom donné à la main ; name nomme déjà le lien. */
export const RefusNomALaMain = refus({ ...M, 'aria-label': 'Profil' });
/** Refus : écouteur de clic ; le membre se suit par son lien. */
export const RefusEcouteur = refus({ ...M, onClick: () => {} });
/** Refus : un slot ; le contenu vient des props. */
export const RefusSlot = refus(M, { default: () => 'Texte' });
