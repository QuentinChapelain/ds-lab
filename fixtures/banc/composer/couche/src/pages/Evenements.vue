<script setup>
import { computed, ref } from 'vue';
import GabaritPage from '../gabarit/GabaritPage.vue';
import { EVENEMENTS } from '../data/evenements.js';

const villes = ['Toutes', ...new Set(EVENEMENTS.map((e) => e.lieu))];
const ville = ref('Toutes');
const lignes = computed(() => EVENEMENTS.filter((e) => ville.value === 'Toutes' || e.lieu === ville.value));
const colonnes = [
  { title: 'Date', key: 'date' },
  { title: 'Événement', key: 'titre' },
  { title: 'Lieu', key: 'lieu' },
  { title: 'Places', key: 'places', align: 'end' },
  { title: 'État', key: 'etat' },
];
</script>

<template>
  <GabaritPage titre="Événements" chapo="Ce qui se prépare dans le réseau, ville par ville.">
    <div class="liste">
      <v-select v-model="ville" :items="villes" label="Ville" class="filtre" variant="outlined" density="comfortable" hide-details />
      <v-data-table :headers="colonnes" :items="lignes" item-value="titre" class="tableau" hide-default-footer>
        <!-- Un statut : aucun composant du design system n'en porte, la puce de Vuetify prend les pleins des statuts. -->
        <template #item.etat="{ item }">
          <v-chip :color="item.places === 0 ? 'error' : 'success'" variant="flat" size="small" label>{{ item.places === 0 ? 'Complet' : 'Ouvert' }}</v-chip>
        </template>
      </v-data-table>
    </div>
  </GabaritPage>
</template>

<style scoped>
.liste {
  display: flex;
  flex-direction: column;
  gap: var(--v-ds-gap-between-components);
}
.filtre {
  width: 100%;
  max-width: calc(var(--v-ds-width-column) / 2);
}
.tableau {
  border: var(--v-ds-border-width-default) solid rgb(var(--v-ds-card-border));
  border-radius: var(--v-ds-border-radius-surface);
}
</style>
