// Props de MemberCard : leurs valeurs admises, ses règles propres. Lu par la fabrique des enveloppes
// (../composants/fabrique.js) ; tout usage hors de ce menu lève, et rien n'est rendu. Un module assemble des composants
// du design system (DsCard, DsAvatar, DsTag) et ne possède que la mise en page : aucune pièce de Vuetify, aucune valeur
// visuelle propre. Le name nomme le lien du profil et le DsAvatar, décoratif à côté du nom écrit : aria-label et
// aria-labelledby donnés à la main lèvent. Pas d'attribut on… : le membre se suit par son lien. Aucun slot : le contenu
// vient des props. Chaque élément de tags est vérifié par le menu de DsTag, avec son rang.
import { initiales } from '../composants/initiales.js';
import { verifierUsage } from '../composants/fabrique.js';
import TAG from '../composants/DsTag.menu.js';

/** Défauts des props de DsTag (tone neutral), posés sur un élément de tags avant sa vérification. */
const DEFAUTS_TAG = Object.fromEntries(Object.entries(TAG.options).flatMap(([k, o]) => ('defaut' in o ? [[k, o.defaut]] : [])));

/**
 * Premier élément de tags refusé par le menu de DsTag, rang compté à partir de 1 : « tags : <rang> : <motif> ».
 * @param {unknown} tags
 * @returns {string | null}
 */
function refusDesTags(tags) {
  if (tags === undefined || tags === null) return null;
  if (!Array.isArray(tags)) return 'tags : liste attendue';
  for (const [i, t] of tags.entries()) {
    const item = t && typeof t === 'object' ? t : {};
    try {
      verifierUsage(TAG, { ...DEFAUTS_TAG, ...item }, {});
    } catch (e) {
      return `tags : ${i + 1} : ${/** @type {Error} */ (e).message.replace(`${TAG.nom} : `, '')}`;
    }
  }
  return null;
}

export default {
  nom: 'MemberCard',
  options: {
    name: { type: String, obligatoire: true },
    href: { type: String, obligatoire: true },
    image: { type: String },
    cohort: { type: String },
    tags: { type: Array },
    headingLevel: { type: Number, defaut: 3, valeurs: [2, 3, 4] },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label', 'aria-labelledby'],
  regles: [
    (/** @type {any} */ p) => (String(p.name).trim() === '' ? 'name : obligatoire' : null),
    (/** @type {any} */ p) => (initiales(String(p.name)) === '' ? 'name : sans lettre' : null),
    (/** @type {any} */ p) => refusDesTags(p.tags),
    (/** @type {any} */ _p, /** @type {any} */ _a, /** @type {any} */ s) => (Object.keys(s ?? {}).length ? `slot refusé : ${Object.keys(s).join(', ')}` : null),
  ],
};
