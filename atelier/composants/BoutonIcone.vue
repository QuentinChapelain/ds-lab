<script>
// Enveloppe du bouton à icône seule (D52). Elle rend l'enveloppe du bouton (Bouton.vue) et non le bouton de Vuetify :
// couleurs, survol, focus, désactivé gardé dans l'ordre du focus, clic et envoi bloqués viennent du bouton, sans rien
// recopier. Son menu (BoutonIcone.menu.js) et la liste blanche d'attributs sont vérifiés par la fabrique commune
// (fabrique.js, D51). Le libellé devient l'aria-label du bouton ; l'icône, muette, prend la place du texte.
//
// La forme carrée est posée sur la boîte du bouton par une enveloppe en display: contents, qui ne compte pas dans la
// mise en page ; ses sélecteurs lisent les classes du bouton (ds-bouton, ds-bouton--<taille>, ds-bouton__texte) et
// passent devant ses règles de forme par leur spécificité. Renommer ces classes casse le bouton à icône : la preuve le
// voit (D52).
import { h } from 'vue';
import Bouton from './Bouton.vue';
import { definirEnveloppe } from './fabrique.js';
import MENU from './BoutonIcone.menu.js';

export default definirEnveloppe(MENU, (props, { attrs, emit }) => () =>
  h('span', { class: ['ds-bouton-icone', `ds-bouton-icone--${props.taille}`] }, [
    h(
      Bouton,
      {
        ...attrs,
        variante: props.variante,
        taille: props.taille,
        desactive: props.desactive,
        type: props.type,
        'aria-label': props.libelle,
        onClick: (/** @type {MouseEvent} */ e) => emit('click', e),
      },
      () => h('span', { class: 'ds-bouton-icone__icone', 'aria-hidden': 'true' }, [h(props.icone)]),
    ),
  ]),
);
</script>

<style>
/* L'enveloppe ne compte pas dans la mise en page : le bouton s'aligne dans sa ligne comme s'il était seul. */
.ds-bouton-icone {
  display: contents;
}
/* Carré : le côté est la hauteur du contrôle, sans marge intérieure ; trois classes passent devant les deux du bouton. */
.ds-bouton-icone--normale > .ds-bouton.ds-bouton--normale {
  width: var(--v-ds-hauteur-controle-normale);
  padding: 0;
}
.ds-bouton-icone--petite > .ds-bouton.ds-bouton--petite {
  width: var(--v-ds-hauteur-controle-petite);
  padding: 0;
}
/* L'icône prend la place du texte, centrée ; sa couleur est celle du texte du bouton (currentColor). */
.ds-bouton-icone .ds-bouton__texte {
  display: block;
}
.ds-bouton-icone__icone,
.ds-bouton-icone__icone > svg {
  display: block;
  width: var(--v-ds-taille-icone-normale);
  height: var(--v-ds-taille-icone-normale);
}
.ds-bouton-icone--petite .ds-bouton-icone__icone,
.ds-bouton-icone--petite .ds-bouton-icone__icone > svg {
  width: var(--v-ds-taille-icone-petite);
  height: var(--v-ds-taille-icone-petite);
}
</style>
