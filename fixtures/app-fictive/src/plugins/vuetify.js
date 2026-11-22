import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';

// Couleurs reprises des maquettes de chaque marque (2024), retouchées à l'œil pour le sombre.
const themes = {
  ecume: { dark: false, colors: { primary: '#5cc8f0', secondary: '#e05a33', background: '#f4fbfe', surface: '#ffffff', error: '#d32f2f', success: '#2e7d32' } },
  ecumeNuit: { dark: true, colors: { primary: '#7fdbff', secondary: '#ff7a52', background: '#0d1b22', surface: '#15262e', error: '#ef5350', success: '#66bb6a' } },
  grenat: { dark: false, colors: { primary: '#7d2342', secondary: '#c9a227', background: '#fbf7f5', surface: '#ffffff', error: '#c62828', success: '#2e7d32' } },
  grenatNuit: { dark: true, colors: { primary: '#d45d84', secondary: '#e0bd4a', background: '#1c1014', surface: '#26171c', error: '#ef5350', success: '#66bb6a' } },
  alberto: { dark: false, colors: { primary: '#b8954a', secondary: '#b04f92', background: '#fdfaf3', surface: '#ffffff', error: '#c62828', success: '#388e3c' } },
  albertoNuit: { dark: true, colors: { primary: '#d9b66a', secondary: '#d77bb8', background: '#1b1812', surface: '#25211a', error: '#ef5350', success: '#81c784' } },
};

export const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: { defaultTheme: 'ecume', themes },
});
