// @ts-check
/**
 * Étape 4b, lot 1 : fichiers de jetons d'Orbe Café pour les tests, depuis leur nouvelle place.
 * Rôles, paires, statuts, contexte étroit et aplat sont dans tokens/commun/ ; primitives.tokens.json est la fusion des
 * primitives communes et des échelles propres d'Orbe Café (bleu, terre, sable), dans cet ordre ; marque.tokens.json
 * reçoit les emplacements communs de l'aplat plein ; le reste est dans tokens/orbe-cafe/.
 * Revue de code du 15/11, lot 0 : les contrôles lisent les jetons par le resolver (largeurs, loadRoles) ; cette aide sert
 * aux jeux modifiés exprès. Le contexte étroit et son seuil (etroite, 600 px écrits en dur) sont retirés.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMMUN, TOKENS, fusionner } from '../../src/tokens/resolver.js';

/** Dossier d'Orbe Café : les tests le nomment ; src/ ne nomme aucune marque (revue de code, lot 5). */
export const ORBE = join(TOKENS, 'orbe-cafe') + '/';
export { COMMUN };
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
