<script>
// Enveloppe de la carte (D50) : seul endroit du dépôt où paraît la carte de Vuetify. Son menu (DsCard.menu.js) et la liste
// blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le reste lève, et aucune carte n'est
// rendue. Couleurs, dimensions et texte viennent des variables du thème de la marque (tokens/<marque>/vuetify.json,
// D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-card, lu dans vuetify 4.3.4 : avec href ou to, toute la carte devient un lien, nommé par tout son texte,
// boutons compris ; un écouteur de clic la rend cliquable sans rôle ni focus ; son titre est un div ; ses actions
// imposent leur variante aux boutons ; sa variante par défaut porte une ombre. L'enveloppe la prend donc en variante
// flat, sans lien ni écouteur, rend elle-même un vrai titre (h2, h3 ou h4), ses actions et son image ; la carte à lien
// porte le lien dans son titre, étendu à toute la carte par un pseudo-élément, avec l'anneau de focus autour de la carte.
// Avec le slot prepend (DsAvatar seul), la carte est horizontale : la pièce à gauche, le titre, le sous-titre, le texte et
// les actions dans une colonne à droite. La taille small donne au titre le style titre 4, pour les écrans denses.
// Avec un sous-titre, le titre et lui forment l'en-tête, et le contenu suit à l'écart entre blocs.
import { h } from 'vue';
import { VCard } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import MENU from './DsCard.menu.js';

export default definirEnveloppe(MENU, (props, { attrs, slots }) => () => {
  const titre = props.href ? h('a', { class: 'ds-card__link', href: props.href }, props.title) : props.title;
  const colonne = [
    h('div', { class: 'ds-card__body' }, [
      h(`h${props.headingLevel}`, { class: 'ds-card__title' }, [titre]),
      props.subtitle ? h('p', { class: 'ds-card__subtitle' }, props.subtitle) : null,
      slots.default ? h('div', { class: 'ds-card__text' }, slots.default()) : null,
    ]),
    slots.actions ? h('div', { class: 'ds-card__actions' }, slots.actions()) : null,
  ];
  return h(
    VCard,
    { ...attrs, class: ['ds-card', { 'ds-card--link': !!props.href, 'ds-card--small': props.size === 'small', 'ds-card--prepend': !!slots.prepend }], variant: 'flat', ripple: false },
    {
      default: () => [
        props.image ? h('img', { class: 'ds-card__media', src: props.image, alt: props.imageAlt }) : null,
        slots.prepend
          ? h('div', { class: 'ds-card__content' }, [h('div', { class: 'ds-card__prepend' }, slots.prepend()), h('div', { class: 'ds-card__column' }, colonne)])
          : h('div', { class: 'ds-card__content' }, colonne),
      ],
    },
  );
});
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-card.v-card {
  position: relative;
  display: flex;
  flex-direction: column;
  /* Rien n'est coupé : l'anneau de focus de la carte à lien dépasse la carte. */
  overflow: visible;
  border: var(--v-ds-epaisseur-contour) solid rgb(var(--v-ds-contour-carte));
  border-radius: var(--v-ds-arrondi-surface);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: none;
  transition: none;
}
/* Ni voile ni sous-couche de Vuetify. */
.ds-card.v-card > .v-card__overlay,
.ds-card.v-card > .v-card__underlay {
  display: none;
}

/* Image en haut, pleine largeur, au format 16:9, recadrée au centre ; coins hauts arrondis à l'intérieur du contour. */
.ds-card__media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: center;
  border-radius: calc(var(--v-ds-arrondi-surface) - var(--v-ds-epaisseur-contour)) calc(var(--v-ds-arrondi-surface) - var(--v-ds-epaisseur-contour)) 0 0;
}

/* Le contenu porte la marge intérieure et l'écart entre le bloc titre et texte et les actions (DS3). */
.ds-card__content {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-ecart-entre-composants);
  padding: var(--v-ds-marge-interieure-composant);
}
.ds-card__body {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-ecart-dans-composant);
}
.ds-card__title {
  margin: 0;
  font-family: var(--v-ds-titre-carte-police);
  font-size: var(--v-ds-titre-carte-taille);
  font-weight: var(--v-ds-titre-carte-graisse);
  line-height: var(--v-ds-titre-carte-interligne);
  font-size-adjust: cap-height var(--v-ds-titre-carte-hauteur-capitale);
  letter-spacing: 0;
  color: rgb(var(--v-theme-on-surface));
}
/* Taille small : le titre prend le style titre 4, dans la police du texte, sans consigne de hauteur de capitale. */
.ds-card--small .ds-card__title {
  font-family: var(--v-ds-titre-4-police);
  font-size: var(--v-ds-titre-4-taille);
  font-weight: var(--v-ds-titre-4-graisse);
  line-height: var(--v-ds-titre-4-interligne);
  font-size-adjust: none;
}
.ds-card__subtitle {
  margin: 0;
  font-family: var(--v-ds-corps-petit-police);
  font-size: var(--v-ds-corps-petit-taille);
  font-weight: var(--v-ds-corps-petit-graisse);
  line-height: var(--v-ds-corps-petit-interligne);
  letter-spacing: 0;
  color: rgb(var(--v-ds-texte-secondaire));
}
/* Le titre et le sous-titre forment l'en-tête ; le contenu qui le suit est un autre bloc d'information, à l'écart entre
   blocs (le corps porte déjà l'écart dans le composant). */
.ds-card__subtitle + .ds-card__text {
  margin-top: calc(var(--v-ds-ecart-entre-blocs) - var(--v-ds-ecart-dans-composant));
}
/* Carte horizontale : la pièce du slot prepend à gauche, alignée en haut, la colonne à droite, qui peut rétrécir. */
.ds-card--prepend .ds-card__content {
  flex-direction: row;
  align-items: flex-start;
}
.ds-card__prepend {
  display: flex;
  flex: none;
}
.ds-card__column {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--v-ds-ecart-entre-composants);
  min-width: 0;
}
.ds-card__text {
  font-family: var(--v-ds-corps-police);
  font-size: var(--v-ds-corps-taille);
  font-weight: var(--v-ds-corps-graisse);
  line-height: var(--v-ds-corps-interligne);
  color: rgb(var(--v-theme-on-surface));
}
.ds-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--v-ds-ecart-entre-composants);
}

/* Carte à lien : le lien du titre couvre toute la carte, contour compris. Son texte ne prend pas les clics : il ne
   contient ni lien ni bouton (D50), et une pièce positionnée qu'il porte, comme DsTag, passerait au-dessus du lien. */
.ds-card--link .ds-card__text {
  pointer-events: none;
}
.ds-card__link {
  color: inherit;
  text-decoration: none;
}
.ds-card__link::after {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--v-ds-epaisseur-contour));
  border-radius: var(--v-ds-arrondi-surface);
}
/* Survol et focus : le contour fonce et le titre se souligne ; au focus clavier, l'anneau entoure la carte (DS2). */
.ds-card--link.v-card:hover,
.ds-card--link.v-card:has(.ds-card__link:focus-visible) {
  border-color: rgb(var(--v-ds-contour));
}
.ds-card--link.v-card:hover .ds-card__link,
.ds-card__link:focus-visible {
  text-decoration: underline;
}
.ds-card__link:focus-visible {
  outline: none;
}
.ds-card__link:focus-visible::after {
  outline: var(--v-ds-epaisseur-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-decalage-focus);
}
</style>
