// Données communes aux stories des enveloppes : les thèmes dans l'ordre du sélecteur, lus dans les fichiers de thèmes
// comme dans l'aperçu (aucun nom de marque n'est écrit ici), les icônes d'essai, tirées de Material Design Icons, et
// les images d'essai de l'avatar : un portrait dessiné, sans personne réelle, et une image PNG invalide, en data:, pour
// que l'échec ne dépende pas du réseau.
import { mdiClose, mdiDelete, mdiMagnify, mdiPencil, mdiPlus } from '@mdi/js';
import { icone } from '../composants/icone.js';

const fichiers = import.meta.glob(['../../tokens/*/vuetify.json', '!../../tokens/commun/vuetify.json'], { eager: true, import: 'default' });
/** Thèmes dans l'ordre du sélecteur : marques par dossier, puis clair et sombre. */
export const THEMES = Object.keys(fichiers)
  .sort()
  .flatMap((chemin) => Object.entries(fichiers[chemin].themes).map(([nom, t]) => ({ nom, titre: `${fichiers[chemin].nom}, ${t.dark ? 'sombre' : 'clair'}` })));

/** Icônes d'essai, nommées par leur dessin ; le libellé d'un bouton nomme l'action, jamais l'icône (D52). */
export const Loupe = icone(mdiMagnify);
export const Plus = icone(mdiPlus);
export const Croix = icone(mdiClose);
export const Corbeille = icone(mdiDelete);
export const Crayon = icone(mdiPencil);

/** Portrait d'essai : une silhouette dessinée sur un fond uni. */
export const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#7a9e9f"/><circle cx="60" cy="48" r="22" fill="#f1d9c4"/><path d="M18 120 Q22 80 60 78 Q98 80 102 120z" fill="#3d5a6c"/><path d="M38 44 Q40 22 60 22 Q82 22 82 46 Q74 34 60 34 Q46 34 38 44z" fill="#5b3a29"/></svg>',
)}`;
/** Image qui échoue toujours : un PNG invalide. */
export const ECHEC = 'data:image/png;base64,AAAA';

/** Mise en page des planches de l'atelier, hors du design system. */
export const ENTETE = 'font-size:12px;opacity:0.7';
