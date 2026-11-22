import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { avecAplat } from './aplat.js';

// Les thèmes de chaque marque, écrits par ds-lab dans tokens/<marque>/vuetify.json : <marque>-light et <marque>-dark.
const fichiers = import.meta.glob('../../tokens/*/vuetify.json', { eager: true, import: 'default' });
const themes = Object.assign({}, ...Object.values(fichiers).map((f) => avecAplat(f.themes)));

export const vuetify = createVuetify({
  components,
  directives,
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: { defaultTheme: Object.keys(themes)[0], themes },
});
