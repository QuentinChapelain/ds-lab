// Configuration de Storybook pour l'atelier des composants (D42, D43).
// Télémétrie coupée ici et par l'option --disable-telemetry des scripts ; le serveur de développement n'écoute que sur
// 127.0.0.1 (script dev). Les composants sont des fichiers .vue, compilés par @vitejs/plugin-vue, que Storybook
// n'ajoute pas de lui-même. La génération de documentation des composants reste coupée : elle demanderait typescript.
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

/** Racine du dépôt : les thèmes sont lus dans tokens/<marque>/vuetify.json, hors du dossier de l'atelier. */
const racine = fileURLToPath(new URL('../../', import.meta.url));

/** @type {import('@storybook/vue3-vite').StorybookConfig} */
export default {
  stories: ['../stories/**/*.stories.js'],
  addons: [],
  framework: { name: '@storybook/vue3-vite', options: { docgen: false } },
  // disableWhatsNewNotifications masque la notification des nouveautés ; il n'empêche pas le serveur de développement
  // de les demander à storybook.js.org à chaque ouverture de l'interface (KNOWN_ISSUES.md).
  core: { disableTelemetry: true, disableWhatsNewNotifications: true },
  // Vite ne sert en développement que les fichiers de sa liste ; on y met la racine du dépôt, nommée, plutôt que de
  // dépendre de la façon dont Vite la devine.
  viteFinal: (config) => ({
    ...config,
    plugins: [...(config.plugins ?? []), vue()],
    server: { ...config.server, fs: { ...config.server?.fs, allow: [racine] } },
  }),
};
