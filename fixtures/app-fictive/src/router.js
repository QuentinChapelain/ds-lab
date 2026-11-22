import { createRouter, createWebHistory } from 'vue-router';
import Accueil from './pages/Accueil.vue';
import Evenements from './pages/Evenements.vue';
import Adhesion from './pages/Adhesion.vue';

export const routes = [
  { path: '/', name: 'accueil', component: Accueil, meta: { titre: 'Accueil' } },
  { path: '/evenements', name: 'evenements', component: Evenements, meta: { titre: 'Événements' } },
  { path: '/adhesion', name: 'adhesion', component: Adhesion, meta: { titre: 'Adhésion' } },
];

export const router = createRouter({ history: createWebHistory(), routes });
