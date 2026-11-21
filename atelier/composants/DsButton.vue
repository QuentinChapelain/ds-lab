<script>
// Enveloppe du bouton (D43) : seul endroit du dépôt où paraît le bouton de Vuetify. Son menu (DsButton.menu.js) et la
// liste blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le reste lève, et aucun
// bouton n'est rendu. Couleurs, dimensions et texte viennent des variables du thème de la marque
// (tokens/<marque>/vuetify.json, D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-btn, lu dans vuetify 4.3.4 : disabled pose l'attribut natif (bouton hors du focus) ; loading pose
// tabindex=-1 et une roue role=progressbar sans nom, sans bloquer l'activation au clavier. L'enveloppe ne lui passe donc
// ni l'un ni l'autre : désactivé et chargement posent aria-disabled, gardent le bouton dans l'ordre du focus, et
// bloquent le clic et l'action par défaut (envoi d'un formulaire), à la souris comme au clavier.
// La roue de chargement est dessinée ici, pas prise à Vuetify : sa roue indéterminée (VProgressCircular 4.3.4) fige la
// page quand le thème change sur place, même seule dans une story (D43).
import { h } from 'vue';
import { VBtn } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import MENU from './DsButton.menu.js';

/** Annonce de la zone de statut pendant le chargement. */
const ANNONCE = 'Chargement en cours';

/** Roue de chargement : un arc de cercle, dessiné comme une icône, à la couleur du texte. */
const roue = () =>
  h('svg', { viewBox: '0 0 24 24', focusable: 'false' }, [
    h('circle', { cx: 12, cy: 12, r: 9, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': '42 100' }),
  ]);

export default definirEnveloppe(MENU, (props, { attrs, emit, slots }) => {
  /** @param {MouseEvent} e */
  const clic = (e) => {
    if (props.disabled || props.loading) {
      e.preventDefault();
      return;
    }
    emit('click', e);
  };
  return () => {
    const inactif = props.disabled || props.loading;
    const bouton = h(
      VBtn,
      {
        ...attrs,
        class: [
          'ds-button',
          `ds-button--${props.variant}`,
          `ds-button--${props.size}`,
          { 'ds-button--block': props.block, 'ds-button--disabled': props.disabled, 'ds-button--loading': props.loading, 'ds-button--inactive': inactif },
        ],
        type: props.type,
        variant: 'flat',
        ripple: false,
        block: props.block,
        'aria-disabled': inactif ? 'true' : undefined,
        'aria-busy': props.loading ? 'true' : undefined,
        onClick: clic,
      },
      {
        ...(props.prependIcon ? { prepend: () => h('span', { class: 'ds-button__icon', 'aria-hidden': 'true' }, [h(props.prependIcon)]) } : {}),
        default: () => [
          h('span', { class: 'ds-button__text' }, slots.default?.()),
          props.loading ? h('span', { class: 'ds-button__spinner', 'aria-hidden': 'true' }, [roue()]) : null,
        ],
      },
    );
    const statut = h('span', { class: 'ds-button__status', role: 'status' }, props.loading ? ANNONCE : '');
    return [bouton, statut];
  };
});
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-button.v-btn {
  height: var(--v-ds-height-control-medium);
  min-width: 0;
  padding: 0 var(--v-ds-padding-component);
  border-radius: var(--v-ds-border-radius-control);
  font-family: var(--v-ds-label-font-family);
  font-size: var(--v-ds-label-font-size);
  font-weight: var(--v-ds-label-font-weight);
  line-height: var(--v-ds-label-line-height);
  letter-spacing: 0;
  text-indent: 0;
  text-transform: none;
  box-shadow: none;
  transition: none;
}
.ds-button.v-btn.ds-button--small {
  height: var(--v-ds-height-control-small);
}
/* Pleine largeur : la largeur minimale nulle ci-dessus annulerait celle que Vuetify donne au bouton block. */
.ds-button.v-btn.ds-button--block {
  min-width: 100%;
}
/* Ni voile ni trait de focus de Vuetify : le survol est un jeton (D04), l'anneau aussi (DS2). */
.ds-button.v-btn > .v-btn__overlay,
.ds-button.v-btn > .v-btn__underlay,
.ds-button.v-btn::after {
  display: none;
}
.ds-button.v-btn:focus-visible {
  outline: var(--v-ds-border-width-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-offset-focus);
}

/* Icône avant le texte. */
.ds-button.v-btn .v-btn__prepend {
  margin-inline: 0 var(--v-ds-gap-icon-text);
}
.ds-button__icon,
.ds-button__icon > svg {
  display: block;
  width: var(--v-ds-icon-size-medium);
  height: var(--v-ds-icon-size-medium);
}
.ds-button--small .ds-button__icon,
.ds-button--small .ds-button__icon > svg {
  width: var(--v-ds-icon-size-small);
  height: var(--v-ds-icon-size-small);
}

/* Variantes, au repos et au survol ; un bouton inactif ne change pas au survol. */
.ds-button--primary.v-btn {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.ds-button--primary.v-btn:not(.ds-button--inactive):hover {
  background: rgb(var(--v-theme-primary-darken-1));
  color: rgb(var(--v-theme-on-primary-darken-1));
}
.ds-button--secondary.v-btn {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: var(--v-ds-border-width-default) solid rgb(var(--v-ds-border));
}
.ds-button--secondary.v-btn:not(.ds-button--inactive):hover {
  background: rgb(var(--v-theme-component-hover));
  color: rgb(var(--v-theme-on-component-hover));
}
.ds-button--ghost.v-btn {
  background: transparent;
  color: rgb(var(--v-theme-on-interactive-subtle));
}
.ds-button--ghost.v-btn:not(.ds-button--inactive):hover {
  background: rgb(var(--v-theme-interactive-subtle));
}
.ds-button--danger.v-btn {
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}
.ds-button--danger.v-btn:not(.ds-button--inactive):hover {
  background: rgb(var(--v-theme-error-strong-hover));
  color: rgb(var(--v-theme-on-error-strong-hover));
}
.ds-button--danger-ghost.v-btn {
  background: transparent;
  color: rgb(var(--v-theme-on-error-subtle));
}
.ds-button--danger-ghost.v-btn:not(.ds-button--inactive):hover {
  background: rgb(var(--v-theme-error-subtle));
}

/* Désactivé : la même apparence pour toutes les variantes ; les discrets gardent la page pour fond. */
.ds-button--disabled.v-btn {
  background: rgb(var(--v-theme-disabled));
  color: rgb(var(--v-theme-on-disabled));
}
.ds-button--disabled.ds-button--secondary.v-btn {
  border-color: rgb(var(--v-ds-border-disabled));
}
.ds-button--disabled.ds-button--ghost.v-btn,
.ds-button--disabled.ds-button--danger-ghost.v-btn {
  background: transparent;
}
.ds-button--inactive.v-btn {
  cursor: default;
}

/* Chargement : texte et icône invisibles mais lus (opacité), largeur gardée ; la roue prend leur place. */
.ds-button--loading .ds-button__text,
.ds-button--loading .v-btn__prepend {
  opacity: 0;
}
.ds-button__spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ds-button__spinner > svg {
  width: var(--v-ds-icon-size-medium);
  height: var(--v-ds-icon-size-medium);
  /* Durée sans jeton : le dépôt n'a pas encore de jeton de durée (B2, docs/feuille-de-route.md). */
  animation: ds-button-spinner 1s linear infinite;
}
.ds-button--small .ds-button__spinner > svg {
  width: var(--v-ds-icon-size-small);
  height: var(--v-ds-icon-size-small);
}
@keyframes ds-button-spinner {
  to {
    transform: rotate(360deg);
  }
}
/* Mouvement réduit : l'arc reste immobile ; la zone de statut dit le chargement. */
@media (prefers-reduced-motion: reduce) {
  .ds-button__spinner > svg {
    animation: none;
  }
}

/* Zone de statut lue par les lecteurs d'écran, hors de la vue et du flux. */
.ds-button__status {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
