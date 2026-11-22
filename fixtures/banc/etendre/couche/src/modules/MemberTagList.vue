<script setup>
// Ce à quoi une personne est ouverte : un intitulé écrit, puis une suite de DsTag. Le texte la détache, pas la couleur seule.
import { useId } from 'vue';
import DsTag from '../components/ds/DsTag.vue';

defineProps({ openTo: { type: Array, required: true } });
const id = useId();
</script>

<template>
  <div class="member-tag-list">
    <p :id="id" class="member-tag-list__label">À lui demander&nbsp;:</p>
    <ul class="member-tag-list__list" role="list" :aria-labelledby="id">
      <li v-for="o in openTo" :key="o" class="member-tag-list__item"><DsTag :text="o" tone="brand" /></li>
    </ul>
  </div>
</template>

<style scoped>
.member-tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--v-ds-gap-between-tags);
}
.member-tag-list__label {
  margin: 0;
  color: rgb(var(--v-ds-text-secondary));
  font-family: var(--v-ds-body-small-font-family);
  font-size: var(--v-ds-body-small-font-size);
  font-weight: var(--v-ds-body-small-font-weight);
  line-height: var(--v-ds-body-small-line-height);
}
.member-tag-list__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--v-ds-gap-between-tags);
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.member-tag-list__item {
  display: flex;
  min-width: 0;
  max-width: 100%;
}
</style>
