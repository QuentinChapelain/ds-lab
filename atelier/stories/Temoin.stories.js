// Témoin : un v-btn nu, sans enveloppe, pour voir les thèmes de chaque marque appliqués par Vuetify.
// À retirer quand la première enveloppe arrivera (D42).
import { VBtn } from 'vuetify/components';

export default { title: 'Témoin/Bouton' };

export const Plein = {
  render: () => ({
    components: { VBtn },
    template: '<v-btn color="primary" variant="flat">Commander</v-btn>',
  }),
};
