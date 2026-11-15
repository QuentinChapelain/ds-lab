// @ts-check
/**
 * Étape 4b, lot 1 : fichiers de jetons d'Orbe Café pour les tests, depuis leur nouvelle place.
 * Rôles, paires, statuts, contexte étroit et aplat sont dans tokens/commun/ ; primitives.tokens.json est la fusion des
 * primitives communes et des échelles propres d'Orbe Café (bleu, terre, sable), dans cet ordre ; marque.tokens.json
 * reçoit les emplacements communs de l'aplat plein ; le reste est dans tokens/orbe-cafe/.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMMUN, ORBE, fusionner, enEtroit } from '../../src/tokens/resolver.js';

export { COMMUN, ORBE };
const COMMUNS = ['semantique.tokens.json', 'paires.json', 'statuts.tokens.json', 'largeur.etroit.tokens.json', 'aplat.tokens.json'];
/** @param {string} d @param {string} f */
const lire = (d, f) => JSON.parse(readFileSync(join(d, f), 'utf8'));

/** Un fichier de jetons d'Orbe Café, lu à sa place. @param {string} f */
export function charger(f) {
  if (COMMUNS.includes(f)) return lire(COMMUN, f);
  if (f === 'primitives.tokens.json') return fusionner(fusionner({}, lire(COMMUN, f)), lire(ORBE, f));
  // Étape 4c : avec le groupe police de police.tokens.json (consigne de hauteur de capitale des titres), lu dans le jeu
  // marque du resolver.
  if (f === 'marque.tokens.json') return fusionner(avecAplat(lire(ORBE, f)), { police: lire(COMMUN, 'police.tokens.json').police });
  return lire(ORBE, f);
}

/** Une couche marque avec les emplacements communs de l'aplat plein (étape 4b, lot 2 bis), comme le resolver la lit. @param {any} marque */
export function avecAplat(marque) {
  return fusionner(fusionner({}, lire(COMMUN, 'aplat.tokens.json')), marque);
}

/** Contexte étroit d'un jeu de rôles (seuil d'Orbe Café : 600 px, [H]). @param {any} semantique @param {any} [etroit] */
export function etroite(semantique, etroit = lire(COMMUN, 'largeur.etroit.tokens.json')) {
  return { semantique: enEtroit(semantique, [etroit]), sous: 600, seuil: '[H]' };
}
