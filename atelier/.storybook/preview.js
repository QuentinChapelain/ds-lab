// Aperçu de l'atelier : Vuetify 4 avec les thèmes de chaque marque, écrits par npm run vuetify (D41, D42).
// Le thème est toujours passé par son nom : defaultTheme est le premier de la liste et le décorateur appelle
// theme.change(nom) ; le défaut « system » de Vuetify ne sert jamais. Un nom absent de notre liste lève, même s'il est
// connu de Vuetify (ses thèmes light et dark restent dans sa liste).
import { setup } from '@storybook/vue3-vite';
import { h, watch } from 'vue';
import 'vuetify/styles';
import { createVuetify, useTheme } from 'vuetify';
import { VApp } from 'vuetify/components';

/**
 * Thèmes de chaque marque, un fichier par dossier de tokens/, rangés par chemin. tokens/commun/vuetify.json porte le
 * même nom mais c'est la table de correspondance, pas des thèmes : il est exclu.
 */
const fichiers = import.meta.glob(['../../tokens/*/vuetify.json', '!../../tokens/commun/vuetify.json'], { eager: true, import: 'default' });
const marques = Object.keys(fichiers).sort().map((chemin) => fichiers[chemin]);
const THEMES = Object.fromEntries(marques.flatMap((m) => Object.entries(m.themes)));
const NOMS = Object.keys(THEMES);
if (!NOMS.length) throw new Error('aucun thème : lancer npm run vuetify à la racine du dépôt');

const vuetify = createVuetify({ theme: { defaultTheme: NOMS[0], themes: THEMES } });

setup((app) => {
  app.use(vuetify);
});

export const globalTypes = {
  theme: {
    description: 'Thème Vuetify : marque et mode',
    toolbar: {
      title: 'Thème',
      icon: 'paintbrush',
      dynamicTitle: true,
      items: marques.flatMap((m) => Object.entries(m.themes).map(([nom, t]) => ({ value: nom, title: `${m.nom}, ${t.dark ? 'sombre' : 'clair'}` }))),
    },
  },
};
export const initialGlobals = { theme: NOMS[0] };

/** @param {string} nom */
const verifier = (nom) => {
  if (!Object.hasOwn(THEMES, nom)) throw new Error(`thème inconnu : ${nom}`);
};

// Vérifié avant le rendu, hors de Vue : l'erreur remplace la story à l'écran. Levée dans Vue seulement, elle irait à
// la console, et la story s'afficherait dans le thème par défaut.
export const beforeEach = (context) => {
  verifier(context.globals.theme);
};

export const decorators = [
  (story, context) => ({
    setup() {
      const theme = useTheme();
      // Storybook ne remonte pas la story quand un global change : il met à jour context.globals en place.
      // setup() ne tourne qu'une fois, d'où l'observation du global.
      watch(
        () => context.globals.theme,
        (nom) => {
          verifier(nom);
          theme.change(nom);
        },
        { immediate: true },
      );
      // Le contenu de v-app est une colonne flexible qui étire ses enfants : la story est posée dans un bloc, où un
      // composant en ligne garde sa largeur.
      return () => h(VApp, null, { default: () => h('div', null, [h(story())]) });
    },
  }),
];
