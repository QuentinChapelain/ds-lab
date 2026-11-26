// Stories de l'écran « Tes composants, à ta marque » du parcours (D101) : chaque composant de Diapason tel que l'écran
// le montre, une story par composant. Le parcours les capture dans le Chromium du clone (atelier/captures.js), avec le
// thème de la marque du projet : il le pose avant le chargement dans `globalThis.dsLabTheme`, la story l'enregistre
// dans Vuetify comme les autres thèmes et rend le composant dedans. Sans thème posé, le thème de la barre.
// Aucun nom de marque n'est écrit ici.
import { h } from 'vue';
import { useTheme } from 'vuetify';
import { VThemeProvider } from 'vuetify/components';
import DsButton from '../composants/DsButton.vue';
import DsTextInput from '../composants/DsTextInput.vue';
import DsIconButton from '../composants/DsIconButton.vue';
import DsTag from '../composants/DsTag.vue';
import DsAvatar from '../composants/DsAvatar.vue';
import DsCard from '../composants/DsCard.vue';
import { Plus } from './commun.js';

/** Le nom du thème de la marque, enregistré à côté de ceux de l'atelier. */
const THEME = 'a-ta-marque';
/** Mise en page de la capture, hors du design system. */
const RANGEE = 'display:inline-flex;flex-wrap:wrap;align-items:center;gap:16px;padding:16px';

/**
 * Le contenu, dans le thème de la marque s'il est posé ; la rangée porte `data-a-ta-marque`, ce que la capture prend.
 * @param {() => any[]} contenu
 */
const aTaMarque = (contenu) => ({
  render: () => ({
    setup() {
      const theme = useTheme();
      const pose = /** @type {any} */ (globalThis).dsLabTheme;
      if (pose) theme.themes.value[THEME] = pose;
      const rangee = () => h('div', { 'data-a-ta-marque': '', style: RANGEE }, contenu());
      return () => (pose ? h(VThemeProvider, { theme: THEME, withBackground: true }, rangee) : rangee());
    },
  }),
});

export default { title: 'Parcours/À ta marque', id: 'a-ta-marque' };

/** Le bouton : quatre intentions, puis la petite taille. */
export const Button = aTaMarque(() => [
  h(DsButton, { variant: 'primary' }, () => 'Enregistrer'),
  h(DsButton, { variant: 'secondary' }, () => 'Annuler'),
  h(DsButton, { variant: 'ghost' }, () => 'Voir'),
  h(DsButton, { variant: 'danger' }, () => 'Supprimer'),
  h(DsButton, { variant: 'primary', size: 'small' }, () => 'Petit'),
]);

/** Le champ de texte : son nom au-dessus, une aide, puis un message d'erreur. */
export const TextInput = aTaMarque(() => [
  h('div', { style: 'width:280px' }, [h(DsTextInput, { label: 'Nom', modelValue: 'Ada Lovelace', hint: 'Tel qu’il figure sur ta commande.' })]),
  h('div', { style: 'width:280px' }, [h(DsTextInput, { label: 'E-mail', type: 'email', modelValue: 'ada@exemple', errorMessage: 'Adresse incomplète : il manque le domaine.' })]),
]);

/** Le bouton à icône seule. */
export const IconButton = aTaMarque(() => [h(DsIconButton, { label: 'Ajouter', icon: Plus, variant: 'secondary' })]);

/** L'étiquette, neutre et de marque. */
export const Tag = aTaMarque(() => [h(DsTag, { text: 'Payée' }), h(DsTag, { text: 'Nouveau', tone: 'brand' })]);

/** L'avatar, aux deux tailles. */
export const Avatar = aTaMarque(() => [h(DsAvatar, { name: 'Ada Lovelace' }), h(DsAvatar, { name: 'Ada Lovelace', size: 'large' })]);

/** La carte, avec son avatar à gauche. */
export const Card = aTaMarque(() => [
  h('div', { style: 'width:320px' }, [
    h(DsCard, { title: 'Espresso ×2, cookie', subtitle: 'Mardi 10 novembre, 8 h 42', size: 'small' }, { prepend: () => [h(DsAvatar, { name: 'Ada Lovelace', decorative: true })] }),
  ]),
]);
