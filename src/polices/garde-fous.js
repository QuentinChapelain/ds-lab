// @ts-check
/**
 * Étape 4c, lot 2 : garde-fous de la police des titres, chacun avec son motif de refus.
 *   format WOFF2 ; licence déclarée (name 13 ou 14 non vide : une licence est déclarée, le droit d'usage web reste à la
 *   charge du client) ; signes français présents ; hauteur de capitale déclarée (la consigne commune s'appuie dessus) ;
 *   graisses demandées par les styles de titre couvertes par les fichiers, statiques ou à axe de graisse.
 * Un fichier non lu (autre format) n'est contrôlé que sur son format.
 */

/** Signes français exigés : minuscules accentuées et liées, leurs capitales, guillemets, apostrophe, tiret moyen. */
export const SIGNES = 'éèêëàâîïôùûüçœæ' + 'éèêëàâîïôùûüçœæ'.toUpperCase() + '«»’–';

/** @param {{ min: number, max: number }} g */
const plage = (g) => (g.min === g.max ? String(g.min) : `${g.min} à ${g.max}`);

/**
 * @param {import('../tokens/saisie.js').FichierPolice[]} fichiers
 * @param {number[]} demandees graisses des styles de titre
 * @returns {string[]} motifs, vides si la police passe
 */
export function gardeFous(fichiers, demandees) {
  /** @type {string[]} */
  const motifs = [];
  /** @type {{ min: number, max: number }[]} */
  const presentes = [];
  for (const { chemin, police: p } of fichiers) {
    if (!p.lisible) {
      motifs.push(`${chemin} : format ${p.format}, WOFF2 attendu`);
      continue;
    }
    if (!p.licence) motifs.push(`${chemin} : licence non déclarée (name 13 et 14 vides)`);
    const absents = [...SIGNES].filter((c) => !p.couverture.has(/** @type {number} */ (c.codePointAt(0))));
    if (absents.length) motifs.push(`${chemin} : signes absents : ${absents.join(' ')}`);
    if (p.capitale === null) motifs.push(`${chemin} : hauteur de capitale absente du fichier`);
    presentes.push(p.graisses);
  }
  if (presentes.length) {
    const absentes = demandees.filter((g) => !presentes.some((p) => p.min <= g && g <= p.max));
    if (absentes.length) motifs.push(`graisses absentes : ${absentes.join(', ')} (présentes : ${presentes.map(plage).join(', ')})`);
  }
  return motifs;
}
