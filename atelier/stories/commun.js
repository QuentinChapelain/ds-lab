// Données communes aux stories des enveloppes : les thèmes dans l'ordre du sélecteur, lus dans les fichiers de thèmes
// comme dans l'aperçu (aucun nom de marque n'est écrit ici), et les icônes d'essai, tirées de Material Design Icons.
import { mdiMagnify, mdiPlus } from '@mdi/js';
import { icone } from '../composants/icone.js';

const fichiers = import.meta.glob(['../../tokens/*/vuetify.json', '!../../tokens/commun/vuetify.json'], { eager: true, import: 'default' });
/** Thèmes dans l'ordre du sélecteur : marques par dossier, puis clair et sombre. */
export const THEMES = Object.keys(fichiers)
  .sort()
  .flatMap((chemin) => Object.entries(fichiers[chemin].themes).map(([nom, t]) => ({ nom, titre: `${fichiers[chemin].nom}, ${t.dark ? 'sombre' : 'clair'}` })));

/** Icônes d'essai : une loupe, une croix d'ajout. */
export const Loupe = icone(mdiMagnify);
export const Plus = icone(mdiPlus);

/** Mise en page des planches de l'atelier, hors du design system. */
export const ENTETE = 'font-size:12px;opacity:0.7';
