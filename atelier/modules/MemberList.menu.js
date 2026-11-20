// Props de MemberList : leurs valeurs admises, ses règles propres. Lu par la fabrique des enveloppes
// (../composants/fabrique.js) ; tout usage hors de ce menu lève, et rien n'est rendu. Un module assemble des composants
// du design system et d'autres modules, ici MemberCard, et ne possède que la mise en page. Chaque élément de members
// porte les props de MemberCard et est vérifié par son menu, avec son rang ; headingLevel est celui de la liste, donné
// à chaque MemberCard, et un élément qui porte le sien lève. La liste se nomme par aria-labelledby, vers le titre de la
// page ; aria-label donné à la main lève. Pas d'attribut on…, aucun slot. Sans membre, rien n'est rendu.
import { verifierUsage } from '../composants/fabrique.js';
import CARTE from './MemberCard.menu.js';

/**
 * Premier élément de members refusé par le menu de MemberCard, rang compté à partir de 1 : « members : <rang> : <motif> ».
 * Les clés d'un élément hors des props de MemberCard sont ses attributs, vérifiés comme tels.
 * @param {unknown} members @param {number} headingLevel
 * @returns {string | null}
 */
function refusDesMembres(members, headingLevel) {
  if (!Array.isArray(members)) return 'members : liste attendue';
  for (const [i, m] of members.entries()) {
    const item = m && typeof m === 'object' ? m : {};
    if ('headingLevel' in item) return `members : ${i + 1} : headingLevel : donné par la liste`;
    const props = Object.fromEntries(Object.entries(item).filter(([k]) => k in CARTE.options));
    const attrs = Object.fromEntries(Object.entries(item).filter(([k]) => !(k in CARTE.options)));
    try {
      verifierUsage(CARTE, { ...props, headingLevel }, attrs);
    } catch (e) {
      return `members : ${i + 1} : ${/** @type {Error} */ (e).message.replace(`${CARTE.nom} : `, '')}`;
    }
  }
  return null;
}

export default {
  nom: 'MemberList',
  options: {
    members: { type: Array, obligatoire: true },
    headingLevel: { type: Number, defaut: 3, valeurs: [2, 3, 4] },
  },
  ecouteurs: false,
  attributsRetires: ['aria-label'],
  regles: [
    (/** @type {any} */ p) => refusDesMembres(p.members, p.headingLevel),
    (/** @type {any} */ _p, /** @type {any} */ _a, /** @type {any} */ s) => (Object.keys(s ?? {}).length ? `slot refusé : ${Object.keys(s).join(', ')}` : null),
  ],
};
