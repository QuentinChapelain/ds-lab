<script setup>
// Une section du contenu d'une page : son titre, une phrase facultative, et l'écart jusqu'au contenu (docs/gabarit.md).
import { useId } from 'vue';

defineProps({ titre: { type: String, required: true }, chapo: { type: String, default: '' } });
const id = useId();
</script>

<template>
  <section class="section" :aria-labelledby="id">
    <div class="section__entete">
      <h2 :id="id" class="section__titre">{{ titre }}</h2>
      <p v-if="chapo" class="section__chapo">{{ chapo }}</p>
    </div>
    <slot />
  </section>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- gap.between-groups : jeton que le thème ne porte pas. */
  gap: 24px;
}
.section__entete {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-within-component);
}
.section__titre {
  margin: 0;
  color: rgb(var(--v-theme-on-background));
  font-family: var(--v-ds-card-title-font-family);
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.2 : style que le thème ne porte pas. */
  font-size: 24px;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.2 : style que le thème ne porte pas. */
  font-weight: 700;
  /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.2 : style que le thème ne porte pas. */
  line-height: 1.3333;
  font-size-adjust: cap-height var(--v-ds-card-title-cap-height);
  overflow-wrap: anywhere;
}
.section__chapo {
  margin: 0;
  color: rgb(var(--v-ds-text-secondary));
  font-family: var(--v-ds-body-font-family);
  font-size: var(--v-ds-body-font-size);
  font-weight: var(--v-ds-body-font-weight);
  line-height: var(--v-ds-body-line-height);
}
@media (width < 600px) {
  .section__titre {
    /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.2, en étroit : style que le thème ne porte pas. */
    font-size: 20px;
    /* stylelint-disable-next-line declaration-property-value-allowed-list -- typography.heading.2, en étroit : style que le thème ne porte pas. */
    line-height: 1.4;
  }
}
</style>
