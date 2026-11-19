// Données communes aux stories des enveloppes : les thèmes dans l'ordre du sélecteur, lus dans les fichiers de thèmes
// comme dans l'aperçu (aucun nom de marque n'est écrit ici), et des icônes d'essai dessinées ici.
import { h } from 'vue';

const fichiers = import.meta.glob(['../../tokens/*/vuetify.json', '!../../tokens/commun/vuetify.json'], { eager: true, import: 'default' });
/** Thèmes dans l'ordre du sélecteur : marques par dossier, puis clair et sombre. */
export const THEMES = Object.keys(fichiers)
  .sort()
  .flatMap((chemin) => Object.entries(fichiers[chemin].themes).map(([nom, t]) => ({ nom, titre: `${fichiers[chemin].nom}, ${t.dark ? 'sombre' : 'clair'}` })));

/** Icône d'essai : une loupe. */
export const Loupe = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', focusable: 'false' }, [
    h('path', { d: 'M10 4a6 6 0 0 1 4.8 9.6l4.8 4.8-1.4 1.4-4.8-4.8A6 6 0 1 1 10 4zm0 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' }),
  ]);

/** Mise en page des planches de l'atelier, hors du design system. */
export const ENTETE = 'font-size:12px;opacity:0.7';
