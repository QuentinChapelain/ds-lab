<script setup>
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTheme } from 'vuetify';
import { mdiWeatherNight, mdiWeatherSunny } from '@mdi/js';
import { MARQUES } from './marques.js';
import { routes } from './router.js';

const route = useRoute();
const router = useRouter();
const theme = useTheme();

const marque = computed(() => MARQUES.find((m) => m.dossier === route.query.marque) ?? MARQUES[0]);
const sombre = computed(() => route.query.mode === 'sombre');
const liens = routes.map((r) => ({ to: r.path, titre: r.meta.titre }));

watch([marque, sombre], () => theme.change(sombre.value ? marque.value.sombre : marque.value.clair), { immediate: true });

function changer(query) {
  router.replace({ query: { ...route.query, ...query } });
}
</script>

<template>
  <v-app :class="`marque-${marque.dossier}`">
    <v-app-bar color="primary" flat>
      <v-app-bar-title class="titre-app">{{ marque.nom }}</v-app-bar-title>
      <nav class="liens">
        <v-btn v-for="l in liens" :key="l.to" :to="{ path: l.to, query: route.query }" variant="text">{{ l.titre }}</v-btn>
      </nav>
      <v-spacer />
      <v-select
        class="choix-marque"
        :model-value="marque.dossier"
        :items="MARQUES"
        item-title="nom"
        item-value="dossier"
        density="compact"
        hide-details
        variant="solo-filled"
        label="Marque"
        @update:model-value="(m) => changer({ marque: m })"
      />
      <v-btn :icon="sombre ? mdiWeatherSunny : mdiWeatherNight" :aria-label="sombre ? 'Passer en clair' : 'Passer en sombre'" @click="changer({ mode: sombre ? 'clair' : 'sombre' })" />
    </v-app-bar>
    <v-main>
      <router-view />
    </v-main>
    <footer class="pied">
      <span>Quai Nord · Association des anciens</span>
      <a href="/mentions">Mentions légales</a>
    </footer>
  </v-app>
</template>

<style scoped>
.liens {
  display: flex;
  gap: 4px;
  margin-left: 24px;
}
.choix-marque {
  max-width: 220px;
  margin-right: 8px;
}
.pied {
  display: flex;
  justify-content: space-between;
  padding: 16px 32px;
  font-size: 13px;
  color: #6b6b6b;
  border-top: 1px solid #e0e0e0;
}
.pied a {
  color: #6b6b6b;
}
</style>
