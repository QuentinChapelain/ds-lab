<script>
// Enveloppe de l'étiquette (D55) : seul endroit du dépôt où paraît la puce de Vuetify. Son menu (DsTag.menu.js) et
// la liste blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le reste lève, et aucune
// étiquette n'est rendue. Couleurs, dimensions et texte viennent des variables du thème de la marque
// (tokens/<marque>/vuetify.json, D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-chip, lu dans vuetify 4.3.4 : un lien, un écouteur de clic ou un groupe parent le rendent cliquable
// (tabindex, clavier, ondulation, voile au survol) ; sa variante par défaut tire son fond de la couleur du texte ; son
// texte est dans un div, enfant de sa balise span, en inline-flex, où « … » ne coupe rien. L'enveloppe le prend donc
// sans lien possible (link: false), sans ondulation, en variante text, pose elle-même le fond des jetons, et porte le
// texte dans une span qui le coupe par « … » quand la place manque ; le texte entier reste dans la page.
import { h } from 'vue';
import { VChip } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import MENU from './DsTag.menu.js';

export default definirEnveloppe(MENU, (props, { attrs }) => () =>
  h(
    VChip,
    { ...attrs, tag: 'span', link: false, ripple: false, variant: 'text', class: ['ds-tag', `ds-tag--${props.tone}`] },
    () => h('span', { class: 'ds-tag__text' }, props.text),
  ),
);
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-tag.v-chip {
  height: var(--v-ds-hauteur-etiquette);
  max-width: 100%;
  padding: 0 var(--v-ds-marge-interieure-etiquette);
  border-radius: var(--v-ds-arrondi-pilule);
  font-family: var(--v-ds-corps-petit-police);
  font-size: var(--v-ds-corps-petit-taille);
  font-weight: var(--v-ds-corps-petit-graisse);
  line-height: var(--v-ds-corps-petit-interligne);
  letter-spacing: 0;
  box-shadow: none;
  transition: none;
}
.ds-tag--neutral.v-chip {
  background: rgb(var(--v-theme-composant));
  color: rgb(var(--v-theme-on-composant));
}
.ds-tag--brand.v-chip {
  background: rgb(var(--v-theme-marque-discret));
  color: rgb(var(--v-theme-on-marque-discret));
}
/* Ni sous-couche ni voile de Vuetify : rien ne change au survol. */
.ds-tag.v-chip > .v-chip__underlay,
.ds-tag.v-chip > .v-chip__overlay {
  display: none;
}
/* Le texte reste sur une ligne, coupé par « … » à la largeur du parent. */
.ds-tag.v-chip > .v-chip__content {
  min-width: 0;
  max-width: 100%;
}
.ds-tag__text {
  display: block;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
