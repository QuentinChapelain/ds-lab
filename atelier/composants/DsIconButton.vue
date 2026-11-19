<script>
// Enveloppe du bouton à icône seule (D52). Elle rend l'enveloppe du bouton (DsButton.vue) et non le bouton de Vuetify :
// couleurs, survol, focus, désactivé gardé dans l'ordre du focus, clic et envoi bloqués viennent du bouton, sans rien
// recopier. Son menu (DsIconButton.menu.js) et la liste blanche d'attributs sont vérifiés par la fabrique commune
// (fabrique.js, D51). Le libellé devient l'aria-label du bouton ; l'icône, muette, prend la place du texte.
//
// La forme carrée est posée sur la boîte du bouton par une enveloppe en display: contents, qui ne compte pas dans la
// mise en page ; ses sélecteurs lisent les classes du bouton (ds-button, ds-button--<taille>, ds-button__text) et
// passent devant ses règles de forme par leur spécificité. Renommer ces classes casse le bouton à icône : la preuve le
// voit (D52).
import { h } from 'vue';
import DsButton from './DsButton.vue';
import { definirEnveloppe } from './fabrique.js';
import MENU from './DsIconButton.menu.js';

export default definirEnveloppe(MENU, (props, { attrs, emit }) => () =>
  h('span', { class: ['ds-icon-button', `ds-icon-button--${props.size}`] }, [
    h(
      DsButton,
      {
        ...attrs,
        variant: props.variant,
        size: props.size,
        disabled: props.disabled,
        type: props.type,
        'aria-label': props.label,
        onClick: (/** @type {MouseEvent} */ e) => emit('click', e),
      },
      () => h('span', { class: 'ds-icon-button__icon', 'aria-hidden': 'true' }, [h(props.icon)]),
    ),
  ]),
);
</script>

<style>
/* L'enveloppe ne compte pas dans la mise en page : le bouton s'aligne dans sa ligne comme s'il était seul. */
.ds-icon-button {
  display: contents;
}
/* Carré : le côté est la hauteur du contrôle, sans marge intérieure ; trois classes passent devant les deux du bouton. */
.ds-icon-button--medium > .ds-button.ds-button--medium {
  width: var(--v-ds-hauteur-controle-normale);
  padding: 0;
}
.ds-icon-button--small > .ds-button.ds-button--small {
  width: var(--v-ds-hauteur-controle-petite);
  padding: 0;
}
/* L'icône prend la place du texte, centrée ; sa couleur est celle du texte du bouton (currentColor). */
.ds-icon-button .ds-button__text {
  display: block;
}
.ds-icon-button__icon,
.ds-icon-button__icon > svg {
  display: block;
  width: var(--v-ds-taille-icone-normale);
  height: var(--v-ds-taille-icone-normale);
}
.ds-icon-button--small .ds-icon-button__icon,
.ds-icon-button--small .ds-icon-button__icon > svg {
  width: var(--v-ds-taille-icone-petite);
  height: var(--v-ds-taille-icone-petite);
}
</style>
