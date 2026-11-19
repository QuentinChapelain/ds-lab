// Règle des initiales de l'avatar (D54), en JavaScript sans Vue : lue par le menu (refus d'un nom sans lettre), par
// l'enveloppe et par les tests de la racine (test/avatar-etiquette.test.js), sans navigateur.
//
// Le nom est coupé en mots sur les espaces ; une élision en tête d'un mot (d' ou l', apostrophe droite ou courbe) est
// sautée ; un mot sans lettre est ignoré ; les mots en minuscules en tête sont des particules, sautées sauf si tous les
// mots sont en minuscules. Puis : première lettre du premier et du dernier mot ; un seul mot, sa première lettre ; un
// seul mot à trait d'union, la première lettre de sa première et de sa dernière partie. Capitales, accents gardés.

const LETTRE = /\p{L}/u;
const ELISION = /^[dl]['’]/iu;

/** Le mot sans son élision de tête. @param {string} mot */
const sansElision = (mot) => mot.replace(ELISION, '');
/** Première lettre d'un texte, ou chaîne vide. @param {string} s */
const premiere = (s) => s.match(LETTRE)?.[0] ?? '';
/** Le mot commence-t-il par une minuscule ? @param {string} mot */
const enMinuscules = (mot) => /\p{Ll}/u.test(premiere(mot));

/** Nom nettoyé de ses espaces en trop : celui que l'avatar lit (aria-label). @param {string} nom */
export const nomLu = (nom) => nom.trim().split(/\s+/u).join(' ');

/**
 * Une ou deux lettres, ou une chaîne vide si le nom n'a aucune lettre.
 * @param {string} nom
 */
export function initiales(nom) {
  const mots = nom
    .trim()
    .split(/\s+/u)
    .map(sansElision)
    .filter((m) => LETTRE.test(m));
  if (!mots.length) return '';
  const tous = mots.every(enMinuscules);
  let debut = 0;
  if (!tous) while (enMinuscules(mots[debut])) debut++;
  const gardes = mots.slice(debut);
  const parties = gardes.length === 1 ? gardes[0].split('-').filter((p) => LETTRE.test(p)) : [gardes[0], gardes[gardes.length - 1]];
  const lettres = parties.length > 1 ? [premiere(parties[0]), premiere(parties[parties.length - 1])] : [premiere(parties[0])];
  return lettres.map((l) => l.toLocaleUpperCase('fr')).join('');
}
