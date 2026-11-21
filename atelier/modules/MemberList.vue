<script>
// Module MemberList : une liste d'annuaire, une colonne de MemberCard. Il passe par la fabrique des enveloppes et son
// menu (MemberList.menu.js) : tout usage hors du menu lève, et rien n'est rendu. Aucune pièce de Vuetify, aucune
// valeur visuelle : le style ne porte que la mise en page de la colonne, par les variables du thème. La liste est un
// ul (role="list", que Safari retire à une liste sans puces), une MemberCard par li, dans l'ordre des données ; sans
// membre, rien n'est rendu : la page porte son message.
import { h } from 'vue';
import MemberCard from './MemberCard.vue';
import { definirEnveloppe } from '../composants/fabrique.js';
import MENU from './MemberList.menu.js';

export default definirEnveloppe(MENU, (props, { attrs }) => () => {
  if (!props.members.length) return null;
  return h(
    'ul',
    { ...attrs, class: 'member-list', role: 'list' },
    props.members.map((m) => h('li', { class: 'member-list__item' }, [h(MemberCard, { ...m, headingLevel: props.headingLevel })])),
  );
});
</script>

<style>
/* Une colonne de MemberCard, à l'écart entre composants ; toute la largeur du parent, jusqu'à la largeur de colonne. */
.member-list {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-between-components);
  width: 100%;
  max-width: var(--v-ds-width-column);
  margin: 0;
  padding: 0;
  list-style: none;
}
.member-list__item {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>
