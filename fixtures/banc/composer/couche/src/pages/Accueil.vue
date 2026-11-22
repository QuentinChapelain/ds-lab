<script setup>
import GabaritPage from '../gabarit/GabaritPage.vue';
import SectionPage from '../gabarit/SectionPage.vue';
import DsCard from '../components/ds/DsCard.vue';

const actualites = [
  { titre: 'Les rencontres de printemps', date: '12 mars', texte: 'Trois soirées dans trois villes pour retrouver sa promo et rencontrer les nouvelles.' },
  { titre: 'Le mentorat ouvre ses inscriptions', date: '2 mars', texte: 'Quarante anciens proposent une heure par mois aux diplômés de l’année.' },
  { titre: 'Bilan de l’assemblée générale', date: '18 février', texte: 'Le compte rendu, les comptes et le nouveau bureau.' },
];
</script>

<template>
  <GabaritPage titre="Bienvenue sur Quai Nord" chapo="Le réseau des anciens : des nouvelles, des rencontres, et des gens à qui écrire.">
    <template #bandeau>
      <p class="action"><router-link class="adherer" to="/adhesion">Adhérer</router-link></p>
    </template>
    <SectionPage titre="Actualités">
      <div class="actualites">
        <DsCard v-for="a in actualites" :key="a.titre" :title="a.titre" :subtitle="a.date">{{ a.texte }}</DsCard>
      </div>
    </SectionPage>
  </GabaritPage>
</template>

<style scoped>
.action {
  margin: 0;
}
/* Sur l'aplat de marque, un lien prend le texte de l'aplat et reste souligné. */
.adherer {
  color: rgb(var(--v-theme-on-brand-strong));
  font-family: var(--v-ds-label-font-family);
  font-size: var(--v-ds-label-font-size);
  font-weight: var(--v-ds-label-font-weight);
  line-height: var(--v-ds-label-line-height);
  text-decoration: underline;
}
.adherer:focus-visible {
  outline: var(--v-ds-border-width-focus) solid rgb(var(--v-theme-on-brand-strong));
  outline-offset: var(--v-ds-offset-focus);
}
.actualites {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--v-ds-width-column) / 2.5)), 1fr));
  gap: var(--v-ds-gap-between-components);
}
</style>
