// @ts-check
/**
 * Blocs non identifiés (D46). Un bloc du relevé n'a ni rôle relevé ni signature ; il porte une classe et une surface
 * visible, hors de toute pièce. Il est candidat si :
 *   - il n'est pas du gabarit (même première classe, même apparence, même chemin sur chaque page vue) ;
 *   - sa première classe paraît au moins deux fois sur les pages vues : « répété », c'est au moins deux ;
 *   - il est le plus extérieur : un bloc contenu dans un candidat n'en est pas un.
 * Un candidat est nommé par sa première classe ; les candidats sont rangés par nombre, puis par nom.
 */
import { apparenceDe, gabarit, idDe } from './pieces.js';

/**
 * @param {import('./pieces.js').Ligne[]} blocs lignes du relevé de sorte « bloc »
 * @param {number} pages nombre de pages vues
 * @returns {{ nom: string, lignes: import('./pieces.js').Ligne[] }[]}
 */
export function candidats(blocs, pages) {
  const duGabarit = gabarit(blocs, pages, (l) => JSON.stringify([l.classes[0], apparenceDe(l.mesures), l.chemin]));
  const reste = blocs.filter((l) => !duGabarit.has(l.id));
  /** @param {import('./pieces.js').Ligne[]} ls */
  const comptes = (ls) => {
    /** @type {Map<string, number>} */
    const c = new Map();
    for (const l of ls) c.set(l.classes[0], (c.get(l.classes[0]) ?? 0) + 1);
    return c;
  };
  const repetes = comptes(reste);
  const candidat = (/** @type {import('./pieces.js').Ligne} */ l) => (repetes.get(l.classes[0]) ?? 0) >= 2;
  /** @type {Map<string, import('./pieces.js').Ligne>} */
  const parId = new Map(reste.map((l) => [l.id, l]));
  const exterieurs = reste.filter((l) => candidat(l) && !(l.ancetres ?? []).some((i) => {
    const a = parId.get(idDe(l.page, i));
    return !!a && candidat(a);
  }));
  const finaux = comptes(exterieurs);
  /** @type {Map<string, import('./pieces.js').Ligne[]>} */
  const groupes = new Map();
  for (const l of exterieurs) if ((finaux.get(l.classes[0]) ?? 0) >= 2) groupes.set(l.classes[0], [...(groupes.get(l.classes[0]) ?? []), l]);
  return [...groupes].map(([nom, lignes]) => ({ nom, lignes })).sort((a, b) => b.lignes.length - a.lignes.length || a.nom.localeCompare(b.nom, 'fr'));
}
