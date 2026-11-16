// @ts-check
/**
 * Revue de code du 15/11, lot 1a : lancement commun des commandes (D18, docs/decisions.md).
 * Trois issues pour toute commande :
 *   0 tout passe ;
 *   1 l'entrée a été lue et jugée : une règle échoue, ou la marque est refusée avec son motif ;
 *   2 l'entrée n'a pas pu être jugée : fichier absent ou illisible, option inconnue, panne de l'outil.
 * Une commande rend 0 ou 1 ; une exception est une panne : message d'une ligne préfixé par le nom de la commande, sans
 * pile, et sortie 2. Un refus n'est jamais une exception : la commande l'affiche avec ses motifs et rend 1.
 */
import { readFileSync } from 'node:fs';

/**
 * Première ligne du message d'une erreur ; option inconnue de parseArgs dite en français.
 * @param {unknown} e
 */
export function premiereLigne(e) {
  const err = /** @type {any} */ (e);
  const message = String(err?.message ?? err).split('\n')[0];
  if (err?.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION') return `option inconnue ${/'([^']+)'/.exec(message)?.[1] ?? message}`;
  return message;
}

/**
 * Lance une commande. `main` rend son code (0 ou 1 ; rien vaut 0) ; une exception sort en 2.
 * Le code est posé dans process.exitCode : la sortie déjà écrite n'est pas coupée.
 * @param {string} nom nom de la commande, en tête du message de panne
 * @param {() => number | void | Promise<number | void>} main
 */
export async function lancer(nom, main) {
  try {
    process.exitCode = /** @type {number} */ ((await main()) ?? 0);
  } catch (e) {
    console.error(`${nom} : ${premiereLigne(e)}`);
    process.exitCode = 2;
  }
}

/**
 * Fichier JSON lu ; une erreur nomme le fichier : absent, dossier, illisible, JSON illisible.
 * @param {string} chemin
 */
export function lireJson(chemin) {
  let texte;
  try {
    texte = readFileSync(chemin, 'utf8');
  } catch (e) {
    const code = /** @type {any} */ (e).code;
    if (code === 'ENOENT') throw new Error(`${chemin} : fichier absent`);
    if (code === 'EISDIR') throw new Error(`${chemin} : dossier donné, fichier attendu`);
    throw new Error(`${chemin} : fichier illisible (${premiereLigne(e)})`);
  }
  try {
    return JSON.parse(texte);
  } catch (e) {
    throw new Error(`${chemin} : JSON illisible (${premiereLigne(e)})`);
  }
}
