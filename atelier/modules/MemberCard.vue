<script>
// Module MemberCard : un membre d'annuaire. Il assemble DsCard (taille small, lien vers le profil, promo en sous-titre),
// DsAvatar (grand, décoratif : le nom est écrit à côté) dans le slot prepend, et une suite de DsTag. Il passe par la
// fabrique des enveloppes et son menu (MemberCard.menu.js) : tout usage hors du menu lève, et rien n'est rendu. Aucune
// pièce de Vuetify, aucune valeur visuelle : le style ne porte que la mise en page de la suite, par les variables du
// thème. La suite de DsTag est une liste (ul, role="list", que Safari retire à une liste sans puces), une DsTag par li ;
// sans DsTag, pas de liste.
import { h } from 'vue';
import DsCard from '../composants/DsCard.vue';
import DsAvatar from '../composants/DsAvatar.vue';
import DsTag from '../composants/DsTag.vue';
import { definirEnveloppe } from '../composants/fabrique.js';
import MENU from './MemberCard.menu.js';

export default definirEnveloppe(MENU, (props, { attrs }) => () => {
  const tags = props.tags ?? [];
  return h(
    DsCard,
    { ...attrs, title: props.name, href: props.href, size: 'small', headingLevel: props.headingLevel, ...(props.cohort ? { subtitle: props.cohort } : {}) },
    {
      prepend: () => [h(DsAvatar, { name: props.name, size: 'large', decorative: true, ...(props.image ? { image: props.image } : {}) })],
      ...(tags.length
        ? { default: () => [h('ul', { class: 'member-card__tags', role: 'list' }, tags.map((t) => h('li', { class: 'member-card__tag' }, [h(DsTag, { text: t.text, tone: t.tone ?? 'neutral' })])))] }
        : {}),
    },
  );
});
</script>

<style>
/* Suite de DsTag : en ligne, avec retour à la ligne, l'écart des DsTag ; un DsTag trop long est coupé par « … ». */
.member-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--v-ds-gap-between-tags);
  margin: 0;
  padding: 0;
  list-style: none;
}
.member-card__tag {
  display: flex;
  min-width: 0;
  max-width: 100%;
}
</style>
