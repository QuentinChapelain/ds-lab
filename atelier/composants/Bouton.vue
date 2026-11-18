<script>
// Enveloppe du bouton (D43) : seul endroit du dépôt où paraît le bouton de Vuetify. Elle n'accepte que son menu
// (variante, taille, icône, pleine largeur, désactivé, chargement, type) et une liste blanche d'attributs ; tout le reste
// lève, et aucun bouton n'est rendu. Couleurs, dimensions et texte viennent des variables du thème de la marque
// (tokens/<marque>/vuetify.json, D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-btn, lu dans vuetify 4.3.4 : disabled pose l'attribut natif (bouton hors du focus) ; loading pose
// tabindex=-1 et une roue role=progressbar sans nom, sans bloquer l'activation au clavier. L'enveloppe ne lui passe donc
// ni l'un ni l'autre : désactivé et chargement posent aria-disabled, gardent le bouton dans l'ordre du focus, et
// bloquent le clic et l'action par défaut (envoi d'un formulaire), à la souris comme au clavier.
// La roue de chargement est dessinée ici, pas prise à Vuetify : sa roue indéterminée (VProgressCircular 4.3.4) fige la
// page quand le thème change sur place, même seule dans une story (KNOWN_ISSUES.md).
import { h } from 'vue';
import { VBtn } from 'vuetify/components';

const VARIANTES = ['principal', 'secondaire', 'discret', 'danger', 'danger-discret'];
const TAILLES = ['normale', 'petite'];
const TYPES = ['button', 'submit', 'reset'];
/** Annonce de la zone de statut pendant le chargement. */
const ANNONCE = 'Chargement en cours';

/** Roue de chargement : un arc de cercle, dessiné comme une icône, à la couleur du texte. */
const roue = () =>
  h('svg', { viewBox: '0 0 24 24', focusable: 'false' }, [
    h('circle', { cx: 12, cy: 12, r: 9, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': '42 100' }),
  ]);

/** Attribut admis en plus des props : id, aria-*, data-*, écouteurs. @param {string} cle */
const admis = (cle) => cle === 'id' || /^aria-/.test(cle) || /^data-/.test(cle) || /^on[A-Z]/.test(cle);

/**
 * Refus d'un usage hors du menu : une erreur qui le nomme.
 * @param {Record<string, any>} props @param {Record<string, unknown>} attrs
 */
function verifier(props, attrs) {
  const refuses = Object.keys(attrs).filter((k) => !admis(k));
  if (refuses.length) throw new Error(`bouton : attribut refusé : ${refuses.join(', ')}`);
  if (!VARIANTES.includes(props.variante)) throw new Error(`bouton : variante inconnue : ${props.variante} (${VARIANTES.join(', ')})`);
  if (!TAILLES.includes(props.taille)) throw new Error(`bouton : taille inconnue : ${props.taille} (${TAILLES.join(', ')})`);
  if (!TYPES.includes(props.type)) throw new Error(`bouton : type inconnu : ${props.type} (${TYPES.join(', ')})`);
  if (props.desactive && props.type === 'submit') throw new Error('bouton : désactivé refusé sur type=submit');
}

export default {
  name: 'Bouton',
  inheritAttrs: false,
  props: {
    variante: { type: String, default: 'principal' },
    taille: { type: String, default: 'normale' },
    icone: { type: [Object, Function], default: null },
    pleineLargeur: { type: Boolean, default: false },
    desactive: { type: Boolean, default: false },
    chargement: { type: Boolean, default: false },
    type: { type: String, default: 'button' },
  },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    verifier(props, attrs);
    /** @param {MouseEvent} e */
    const clic = (e) => {
      if (props.desactive || props.chargement) {
        e.preventDefault();
        return;
      }
      emit('click', e);
    };
    return () => {
      verifier(props, attrs);
      const inactif = props.desactive || props.chargement;
      const bouton = h(
        VBtn,
        {
          ...attrs,
          class: [
            'ds-bouton',
            `ds-bouton--${props.variante}`,
            `ds-bouton--${props.taille}`,
            { 'ds-bouton--pleine': props.pleineLargeur, 'ds-bouton--desactive': props.desactive, 'ds-bouton--chargement': props.chargement, 'ds-bouton--inactif': inactif },
          ],
          type: props.type,
          variant: 'flat',
          ripple: false,
          block: props.pleineLargeur,
          'aria-disabled': inactif ? 'true' : undefined,
          'aria-busy': props.chargement ? 'true' : undefined,
          onClick: clic,
        },
        {
          ...(props.icone ? { prepend: () => h('span', { class: 'ds-bouton__icone', 'aria-hidden': 'true' }, [h(props.icone)]) } : {}),
          default: () => [
            h('span', { class: 'ds-bouton__texte' }, slots.default?.()),
            props.chargement ? h('span', { class: 'ds-bouton__roue', 'aria-hidden': 'true' }, [roue()]) : null,
          ],
        },
      );
      const statut = h('span', { class: 'ds-bouton__statut', role: 'status' }, props.chargement ? ANNONCE : '');
      return [bouton, statut];
    };
  },
};
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-bouton.v-btn {
  height: var(--v-ds-hauteur-controle-normale);
  min-width: 0;
  padding: 0 var(--v-ds-marge-interieure-composant);
  border-radius: var(--v-ds-arrondi-controle);
  font-family: var(--v-ds-libelle-police);
  font-size: var(--v-ds-libelle-taille);
  font-weight: var(--v-ds-libelle-graisse);
  line-height: var(--v-ds-libelle-interligne);
  letter-spacing: 0;
  text-indent: 0;
  text-transform: none;
  box-shadow: none;
  transition: none;
}
.ds-bouton.v-btn.ds-bouton--petite {
  height: var(--v-ds-hauteur-controle-petite);
}
/* Pleine largeur : la largeur minimale nulle ci-dessus annulerait celle que Vuetify donne au bouton block. */
.ds-bouton.v-btn.ds-bouton--pleine {
  min-width: 100%;
}
/* Ni voile ni trait de focus de Vuetify : le survol est un jeton (D04), l'anneau aussi (DS2). */
.ds-bouton.v-btn > .v-btn__overlay,
.ds-bouton.v-btn > .v-btn__underlay,
.ds-bouton.v-btn::after {
  display: none;
}
.ds-bouton.v-btn:focus-visible {
  outline: var(--v-ds-epaisseur-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-decalage-focus);
}

/* Icône avant le texte. */
.ds-bouton.v-btn .v-btn__prepend {
  margin-inline: 0 var(--v-ds-ecart-icone-texte);
}
.ds-bouton__icone,
.ds-bouton__icone > svg {
  display: block;
  width: var(--v-ds-taille-icone-normale);
  height: var(--v-ds-taille-icone-normale);
}
.ds-bouton--petite .ds-bouton__icone,
.ds-bouton--petite .ds-bouton__icone > svg {
  width: var(--v-ds-taille-icone-petite);
  height: var(--v-ds-taille-icone-petite);
}

/* Variantes, au repos et au survol ; un bouton inactif ne change pas au survol. */
.ds-bouton--principal.v-btn {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.ds-bouton--principal.v-btn:not(.ds-bouton--inactif):hover {
  background: rgb(var(--v-theme-primary-darken-1));
  color: rgb(var(--v-theme-on-primary-darken-1));
}
.ds-bouton--secondaire.v-btn {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: var(--v-ds-epaisseur-contour) solid rgb(var(--v-ds-contour));
}
.ds-bouton--secondaire.v-btn:not(.ds-bouton--inactif):hover {
  background: rgb(var(--v-theme-composant-survol));
  color: rgb(var(--v-theme-on-composant-survol));
}
.ds-bouton--discret.v-btn {
  background: transparent;
  color: rgb(var(--v-theme-on-interactif-discret));
}
.ds-bouton--discret.v-btn:not(.ds-bouton--inactif):hover {
  background: rgb(var(--v-theme-interactif-discret));
}
.ds-bouton--danger.v-btn {
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
}
.ds-bouton--danger.v-btn:not(.ds-bouton--inactif):hover {
  background: rgb(var(--v-theme-erreur-fort-survol));
  color: rgb(var(--v-theme-on-erreur-fort-survol));
}
.ds-bouton--danger-discret.v-btn {
  background: transparent;
  color: rgb(var(--v-theme-on-erreur-discret));
}
.ds-bouton--danger-discret.v-btn:not(.ds-bouton--inactif):hover {
  background: rgb(var(--v-theme-erreur-discret));
}

/* Désactivé : la même apparence pour toutes les variantes ; les discrets gardent la page pour fond. */
.ds-bouton--desactive.v-btn {
  background: rgb(var(--v-theme-desactive));
  color: rgb(var(--v-theme-on-desactive));
}
.ds-bouton--desactive.ds-bouton--secondaire.v-btn {
  border-color: rgb(var(--v-ds-contour-desactive));
}
.ds-bouton--desactive.ds-bouton--discret.v-btn,
.ds-bouton--desactive.ds-bouton--danger-discret.v-btn {
  background: transparent;
}
.ds-bouton--inactif.v-btn {
  cursor: default;
}

/* Chargement : texte et icône invisibles mais lus (opacité), largeur gardée ; la roue prend leur place. */
.ds-bouton--chargement .ds-bouton__texte,
.ds-bouton--chargement .v-btn__prepend {
  opacity: 0;
}
.ds-bouton__roue {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ds-bouton__roue > svg {
  width: var(--v-ds-taille-icone-normale);
  height: var(--v-ds-taille-icone-normale);
  /* Durée sans jeton : le dépôt n'a pas encore de jeton de durée (KNOWN_ISSUES.md). */
  animation: ds-bouton-roue 1s linear infinite;
}
.ds-bouton--petite .ds-bouton__roue > svg {
  width: var(--v-ds-taille-icone-petite);
  height: var(--v-ds-taille-icone-petite);
}
@keyframes ds-bouton-roue {
  to {
    transform: rotate(360deg);
  }
}
/* Mouvement réduit : l'arc reste immobile ; la zone de statut dit le chargement. */
@media (prefers-reduced-motion: reduce) {
  .ds-bouton__roue > svg {
    animation: none;
  }
}

/* Zone de statut lue par les lecteurs d'écran, hors de la vue et du flux. */
.ds-bouton__statut {
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
