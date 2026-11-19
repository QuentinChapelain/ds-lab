<script>
// Enveloppe de la carte (D50) : seul endroit du dépôt où paraît la carte de Vuetify. Son menu (Carte.menu.js) et la liste
// blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le reste lève, et aucune carte n'est
// rendue. Couleurs, dimensions et texte viennent des variables du thème de la marque (tokens/<marque>/vuetify.json,
// D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-card, lu dans vuetify 4.3.4 : avec href ou to, toute la carte devient un lien, nommé par tout son texte,
// boutons compris ; un écouteur de clic la rend cliquable sans rôle ni focus ; son titre est un div ; ses actions
// imposent leur variante aux boutons ; sa variante par défaut porte une ombre. L'enveloppe la prend donc en variante
// flat, sans lien ni écouteur, rend elle-même un vrai titre (h2, h3 ou h4), ses actions et son image ; la carte à lien
// porte le lien dans son titre, étendu à toute la carte par un pseudo-élément, avec l'anneau de focus autour de la carte.
import { h } from 'vue';
import { VCard } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import MENU from './Carte.menu.js';

export default definirEnveloppe(MENU, (props, { attrs, slots }) => () => {
  const titre = props.lien ? h('a', { class: 'ds-carte__lien', href: props.lien }, props.titre) : props.titre;
  return h(
    VCard,
    { ...attrs, class: ['ds-carte', { 'ds-carte--lien': !!props.lien }], variant: 'flat', ripple: false },
    {
      default: () => [
        props.media ? h('img', { class: 'ds-carte__media', src: props.media, alt: props.texteAlternatif }) : null,
        h('div', { class: 'ds-carte__contenu' }, [
          h('div', { class: 'ds-carte__corps' }, [
            h(`h${props.niveau}`, { class: 'ds-carte__titre' }, [titre]),
            slots.default ? h('div', { class: 'ds-carte__texte' }, slots.default()) : null,
          ]),
          slots.actions ? h('div', { class: 'ds-carte__actions' }, slots.actions()) : null,
        ]),
      ],
    },
  );
});
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-carte.v-card {
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
.ds-carte.v-card > .v-card__overlay,
.ds-carte.v-card > .v-card__underlay {
  display: none;
}

/* Image en haut, pleine largeur, au format 16:9, recadrée au centre ; coins hauts arrondis à l'intérieur du contour. */
.ds-carte__media {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  object-position: center;
  border-radius: calc(var(--v-ds-arrondi-surface) - var(--v-ds-epaisseur-contour)) calc(var(--v-ds-arrondi-surface) - var(--v-ds-epaisseur-contour)) 0 0;
}

/* Le contenu porte la marge intérieure et l'écart entre le bloc titre et texte et les actions (DS3). */
.ds-carte__contenu {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-ecart-entre-composants);
  padding: var(--v-ds-marge-interieure-composant);
}
.ds-carte__corps {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-ecart-dans-composant);
}
.ds-carte__titre {
  margin: 0;
  font-family: var(--v-ds-titre-carte-police);
  font-size: var(--v-ds-titre-carte-taille);
  font-weight: var(--v-ds-titre-carte-graisse);
  line-height: var(--v-ds-titre-carte-interligne);
  font-size-adjust: cap-height var(--v-ds-titre-carte-hauteur-capitale);
  letter-spacing: 0;
  color: rgb(var(--v-theme-on-surface));
}
.ds-carte__texte {
  font-family: var(--v-ds-corps-police);
  font-size: var(--v-ds-corps-taille);
  font-weight: var(--v-ds-corps-graisse);
  line-height: var(--v-ds-corps-interligne);
  color: rgb(var(--v-theme-on-surface));
}
.ds-carte__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--v-ds-ecart-entre-composants);
}

/* Carte à lien : le lien du titre couvre toute la carte, contour compris. */
.ds-carte__lien {
  color: inherit;
  text-decoration: none;
}
.ds-carte__lien::after {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--v-ds-epaisseur-contour));
  border-radius: var(--v-ds-arrondi-surface);
}
/* Survol et focus : le contour fonce et le titre se souligne ; au focus clavier, l'anneau entoure la carte (DS2). */
.ds-carte--lien.v-card:hover,
.ds-carte--lien.v-card:has(.ds-carte__lien:focus-visible) {
  border-color: rgb(var(--v-ds-contour));
}
.ds-carte--lien.v-card:hover .ds-carte__lien,
.ds-carte__lien:focus-visible {
  text-decoration: underline;
}
.ds-carte__lien:focus-visible {
  outline: none;
}
.ds-carte__lien:focus-visible::after {
  outline: var(--v-ds-epaisseur-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-decalage-focus);
}
</style>
