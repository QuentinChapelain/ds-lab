<script setup>
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from 'vuetify';
import { estSombre, marqueDe } from './marques.js';

const route = useRoute();
const theme = useTheme();

watch(
  () => `${marqueDe(route.query).dossier}-${estSombre(route.query) ? 'dark' : 'light'}`,
  (nom) => theme.change(nom),
  { immediate: true },
);
</script>

<template>
  <v-app>
    <router-view />
  </v-app>
</template>
