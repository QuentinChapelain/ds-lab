<script setup>
// Une ligne de l'annuaire : la photo, le nom qui mène au profil, le métier, l'entreprise et la ville, la promo, ce à quoi
// la personne est ouverte, et un bouton pour lui écrire. Une DsCard ne peut pas porter un lien sur son titre et un bouton.
import { useRoute } from 'vue-router';
import DsAvatar from '../components/ds/DsAvatar.vue';
import DsButton from '../components/ds/DsButton.vue';
import MemberTagList from './MemberTagList.vue';

defineProps({ member: { type: Object, required: true } });
defineEmits(['write']);
const route = useRoute();
</script>

<template>
  <div class="member-row">
    <DsAvatar :name="member.nom" :image="member.photo" size="large" decorative />
    <div class="member-row__body">
      <h3 class="member-row__name"><router-link class="member-row__link" :to="{ path: member.profil, query: route.query }">{{ member.nom }}</router-link></h3>
      <p class="member-row__text">{{ member.poste }}</p>
      <p class="member-row__text">
        <router-link class="member-row__link member-row__link--company" :to="{ path: member.entreprise.lien, query: route.query }">{{ member.entreprise.nom }}</router-link>, {{ member.ville }}
      </p>
      <p v-if="member.promo" class="member-row__text member-row__text--secondary">{{ member.promo }}</p>
      <MemberTagList v-if="member.ouvertures" :open-to="member.ouvertures" />
    </div>
    <div class="member-row__action">
      <DsButton variant="secondary" :aria-label="`Écrire à ${member.nom}`" @click="$emit('write', member)">Écrire</DsButton>
    </div>
  </div>
</template>

<style scoped>
.member-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--v-ds-gap-between-components);
  padding-block: var(--v-ds-padding-component);
}
.member-row__body {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-within-component);
  color: rgb(var(--v-theme-on-background));
}
.member-row__name {
  margin: 0;
  font-family: var(--v-ds-heading-4-font-family);
  font-size: var(--v-ds-heading-4-font-size);
  font-weight: var(--v-ds-heading-4-font-weight);
  line-height: var(--v-ds-heading-4-line-height);
  overflow-wrap: anywhere;
}
.member-row__text {
  margin: 0;
  font-family: var(--v-ds-body-small-font-family);
  font-size: var(--v-ds-body-small-font-size);
  font-weight: var(--v-ds-body-small-font-weight);
  line-height: var(--v-ds-body-small-line-height);
  overflow-wrap: anywhere;
}
.member-row__text--secondary {
  color: rgb(var(--v-ds-text-secondary));
}
.member-row__link {
  border-radius: var(--v-ds-border-radius-control);
  color: inherit;
  text-decoration: underline;
}
.member-row__link--company {
  color: rgb(var(--v-theme-on-interactive-subtle));
}
.member-row__link:focus-visible {
  outline: var(--v-ds-border-width-focus) solid rgb(var(--v-ds-focus));
  outline-offset: var(--v-ds-offset-focus);
}
.member-row__action {
  display: flex;
}
/* Sur téléphone, le bouton passe sous le texte. */
@media (width < 600px) {
  .member-row {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .member-row__action {
    grid-column: 2;
  }
}
</style>
