<script>
// Enveloppe de l'avatar (D54) : seul endroit du dépôt où paraît l'avatar de Vuetify. Son menu (DsAvatar.menu.js) et la
// liste blanche d'attributs sont vérifiés par la fabrique commune (fabrique.js, D51) : tout le reste lève, et aucun
// avatar n'est rendu. Couleurs, dimensions et texte viennent des variables du thème de la marque
// (tokens/<marque>/vuetify.json, D41) : aucune valeur n'est écrite ici.
//
// Ce que fait v-avatar, lu dans vuetify 4.3.4 : avec image, il rend un VImg, caché jusqu'au chargement, qui laisse
// l'avatar vide en cas d'échec et nomme l'image deux fois avec un texte de remplacement ; sa taille change par une
// transition. L'enveloppe le prend donc en balise span, sans image ni texte de Vuetify : les initiales, muettes, sont
// toujours rendues, et une image simple les couvre tant qu'elle n'a pas échoué. La racine porte le nom (role="img"),
// ou se tait (aria-hidden) si l'avatar est décoratif : une seule lecture, avec ou sans photo.
import { h, ref, watch } from 'vue';
import { VAvatar } from 'vuetify/components';
import { definirEnveloppe } from './fabrique.js';
import { initiales, nomLu } from './initiales.js';
import MENU from './DsAvatar.menu.js';

export default definirEnveloppe(MENU, (props, { attrs }) => {
  const echec = ref(false);
  watch(
    () => props.image,
    () => {
      echec.value = false;
    },
  );
  return () =>
    h(
      VAvatar,
      {
        ...attrs,
        tag: 'span',
        variant: 'flat',
        class: ['ds-avatar', `ds-avatar--${props.size}`],
        ...(props.decorative ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': nomLu(props.name) }),
      },
      () => [
        h('span', { class: 'ds-avatar__initials', 'aria-hidden': 'true' }, initiales(props.name)),
        props.image && !echec.value
          ? h('img', {
              class: 'ds-avatar__image',
              src: props.image,
              alt: '',
              onError: () => {
                echec.value = true;
              },
            })
          : null,
      ],
    );
});
</script>

<style>
/* Règles hors couche : elles passent devant celles de Vuetify, rangées dans ses couches, sans !important. */
.ds-avatar.v-avatar {
  position: relative;
  width: var(--v-ds-taille-avatar-normale);
  height: var(--v-ds-taille-avatar-normale);
  border-radius: var(--v-ds-arrondi-pilule);
  background: rgb(var(--v-theme-marque-discret));
  color: rgb(var(--v-theme-on-marque-discret));
  box-shadow: none;
  transition: none;
}
.ds-avatar.v-avatar.ds-avatar--large {
  width: var(--v-ds-taille-avatar-grande);
  height: var(--v-ds-taille-avatar-grande);
}
/* Ni sous-couche ni voile de Vuetify. */
.ds-avatar.v-avatar > .v-avatar__underlay {
  display: none;
}
.ds-avatar__initials {
  font-family: var(--v-ds-initiales-normale-police);
  font-size: var(--v-ds-initiales-normale-taille);
  font-weight: var(--v-ds-initiales-normale-graisse);
  line-height: var(--v-ds-initiales-normale-interligne);
  letter-spacing: 0;
  user-select: none;
}
.ds-avatar--large .ds-avatar__initials {
  font-family: var(--v-ds-initiales-grande-police);
  font-size: var(--v-ds-initiales-grande-taille);
  font-weight: var(--v-ds-initiales-grande-graisse);
  line-height: var(--v-ds-initiales-grande-interligne);
}
/* La photo couvre le rond, par-dessus les initiales, recadrée au centre. */
.ds-avatar__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}
</style>
