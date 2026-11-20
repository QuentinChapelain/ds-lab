// Stories de l'étiquette (D55) : la planche, que la preuve mesure et enregistre ; la ligne « en situation » (grand avatar,
// nom, promo et étiquettes, sans carte) ; la vitrine, toutes les marques en clair et en sombre côte à côte, sur la page
// et sur une surface ; le bac à sable ; les refus. Une suite d'étiquettes est une liste (ul, une étiquette par li), en
// flex, avec retour à la ligne et l'écart des étiquettes (D55).
import { h } from 'vue';
import { VThemeProvider } from 'vuetify/components';
import DsTag from '../composants/DsTag.vue';
import DsAvatar from '../composants/DsAvatar.vue';
import DsButton from '../composants/DsButton.vue';
import { ENTETE, PORTRAIT, THEMES } from './commun.js';

/** Texte d'essai trop long pour sa place : coupé par « … ». */
const LONGUE = 'Ingénierie des systèmes embarqués et temps réel';
/** Rangée d'essai, qui passe à la ligne dans 280 px. */
const RANGEE = /** @type {const} */ ([
  ['Lyon', 'neutral'],
  ['Finance', 'neutral'],
  ['Mentor', 'brand'],
  ['Bordeaux', 'neutral'],
  ['Santé', 'neutral'],
  ['Promo 2015', 'neutral'],
  ['Bénévole', 'brand'],
  ['Conseil', 'neutral'],
]);

/**
 * Suite d'étiquettes : une liste, en flex, avec retour à la ligne ; le parent porte l'écart, l'étiquette n'a pas de
 * marge (DS3).
 * @param {readonly (readonly [string, string])[]} items @param {Record<string, any>} [o]
 */
const suite = (items, o = {}) =>
  h(
    'ul',
    { ...o, style: `display:flex;flex-wrap:wrap;gap:var(--v-ds-ecart-entre-etiquettes);margin:0;padding:0;list-style:none;${o.style ?? ''}` },
    items.map(([texte, ton]) => h('li', { style: 'display:flex;min-width:0;max-width:100%' }, [h(DsTag, { text: texte, tone: ton })])),
  );

/** @param {string} titre @param {any} contenu */
const cellule = (titre, contenu) => h('div', { style: 'display:flex;flex-direction:column;align-items:flex-start;gap:8px' }, [h('span', { style: ENTETE }, titre), contenu]);

/** @param {boolean} [mesures] avec les états que la preuve force et mesure */
function planche(mesures = true) {
  return h('div', { style: 'display:flex;flex-direction:column;gap:24px;padding:24px' }, [
    h('div', { style: 'display:flex;gap:32px;align-items:flex-end' }, [
      cellule('neutre', h(DsTag, { text: 'Lyon', 'data-etat': 'neutre' })),
      cellule('marque', h(DsTag, { text: 'Mentor', tone: 'brand', 'data-etat': 'marque' })),
      ...(mesures
        ? [cellule('neutre, survol', h(DsTag, { text: 'Lyon', 'data-etat': 'neutre-survol' })), cellule('marque, survol', h(DsTag, { text: 'Mentor', tone: 'brand', 'data-etat': 'marque-survol' }))]
        : []),
    ]),
    cellule('rangée de huit, dans 280 px', h('div', { style: 'width:280px' }, [suite(RANGEE, { 'data-cas': 'rangee' })])),
    cellule('texte long, dans 160 px', h('div', { style: 'width:160px', 'data-cas': 'longue' }, [h(DsTag, { text: LONGUE })])),
  ]);
}

/**
 * Ligne « en situation » : grand avatar décoratif, puisque le nom est écrit à côté (D54), nom, promo, puis la suite
 * d'étiquettes, dont une longue coupée. Le nom prend le titre 4, par les variables du thème (celles de DsCard en taille
 * small) ; seule la mise en page est écrite ici.
 */
const situation = () =>
  h('div', { style: 'display:flex;gap:16px;align-items:flex-start;width:420px', 'data-cas': 'situation' }, [
    h(DsAvatar, { name: 'Camille Ferrand', image: PORTRAIT, size: 'large', decorative: true }),
    h('div', { style: 'display:flex;flex-direction:column;gap:var(--v-ds-ecart-dans-composant);min-width:0;flex:1' }, [
      h('p', { style: 'margin:0;font-family:var(--v-ds-titre-4-police);font-size:var(--v-ds-titre-4-taille);font-weight:var(--v-ds-titre-4-graisse);line-height:var(--v-ds-titre-4-interligne);color:rgb(var(--v-theme-on-surface))' }, 'Camille Ferrand'),
      h('p', { style: 'margin:0;font-family:var(--v-ds-corps-petit-police);font-size:var(--v-ds-corps-petit-taille);line-height:var(--v-ds-corps-petit-interligne);color:rgb(var(--v-ds-texte-secondaire))' }, 'Promo 2015'),
      suite(
        [
          ['Lyon', 'neutral'],
          ['Finance', 'neutral'],
          ['Mentor', 'brand'],
          [LONGUE, 'neutral'],
        ],
        { style: 'margin-top:var(--v-ds-ecart-dans-composant)' },
      ),
    ]),
  ]);

export default { title: 'Composants/DsTag' };

/** Planche d'un thème, celui de la barre : les deux tons, au repos et survolés, la rangée, le texte long. */
export const Planche = {
  render: () => ({ setup: () => () => planche() }),
};

/** En situation, dans le thème de la barre : sur la page, puis sur une surface, entre deux boutons pour la tabulation. */
export const EnSituation = {
  name: 'En situation',
  render: () => ({
    setup: () => () =>
      h('div', { style: 'display:flex;flex-direction:column;gap:24px;padding:24px;align-items:flex-start' }, [
        h(DsButton, { variant: 'secondary', 'data-cas': 'avant' }, () => 'Avant'),
        situation(),
        h('div', { style: 'padding:16px;background:rgb(var(--v-theme-surface));border-radius:12px' }, [situation()]),
        h(DsButton, { variant: 'secondary', 'data-cas': 'apres' }, () => 'Après'),
      ]),
  }),
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

/** Bac à sable : chaque prop, dans le thème de la barre. */
export const BacASable = {
  name: 'Bac à sable',
  args: { text: 'Mentor', tone: 'neutral' },
  argTypes: { tone: { control: 'inline-radio', options: ['neutral', 'brand'] } },
  render: (/** @type {Record<string, any>} */ args) => ({
    setup: () => () => h('div', { style: 'padding:24px;width:320px' }, [h(DsTag, { text: args.text, tone: args.tone })]),
  }),
};

/** @param {Record<string, any>} o */
const refus = (o) => ({ render: () => ({ setup: () => () => h('div', { style: 'padding:24px' }, [h(DsTag, o)]) }) });

/** Refus : sans texte ; la story montre l'erreur, aucune étiquette. */
export const RefusSansTexte = refus({});
/** Refus : ton hors du menu ; pas de couleur par catégorie. */
export const RefusTon = refus({ text: 'Lyon', tone: 'accent' });
/** Refus : étiquette supprimable ; c'est une autre pièce. */
export const RefusFermeture = refus({ text: 'Lyon', closable: true });
/** Refus : étiquette à lien ; l'étiquette est statique. */
export const RefusLien = refus({ text: 'Lyon', href: '#lyon' });
