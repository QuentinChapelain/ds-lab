<script setup>
import { computed, ref } from 'vue';
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
  <div class="page">
    <h1>Événements</h1>
    <p class="chapo">Ce qui se prépare dans le réseau, ville par ville.</p>
    <v-select v-model="ville" :items="villes" label="Ville" class="filtre" variant="outlined" density="comfortable" />
    <v-data-table :headers="colonnes" :items="lignes" item-value="titre" class="tableau" hide-default-footer>
      <template #item.etat="{ item }">
        <v-chip :color="item.places === 0 ? 'error' : 'success'" size="small" label>{{ item.places === 0 ? 'Complet' : 'Ouvert' }}</v-chip>
      </template>
    </v-data-table>
  </div>
</template>

<style scoped>
.filtre {
  max-width: 280px;
  margin-bottom: 12px;
}
.tableau {
  border: 1px solid #ddd;
  border-radius: 8px;
}
</style>
