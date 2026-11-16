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
import { premiereLigne } from '../lib/fichiers.js';
import { relative } from 'node:path';
import { dossiersDeMarque, nomDeMarque } from '../tokens/resolver.js';

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
 * Revue de code, lot 5 (D26) : un contrôle sur la marque de --marque <dossier>, ou, sans l'option, sur chaque marque de
 * tokens/ (dossiersDeMarque), sans en nommer aucune. Sans l'option, chaque bloc est précédé de « marque <nom> (<dossier>) »
 * et les blocs sont séparés par une ligne vide ; le code le plus haut l'emporte (1 si une marque échoue).
 * @param {string | undefined} option @param {(dossier: string) => number} controler
 */
export function parMarque(option, controler) {
  if (option) return controler(option);
  let code = 0;
  dossiersDeMarque().forEach((d, i) => {
    if (i) console.log('');
    console.log(`marque ${nomDeMarque(d)} (${relative(process.cwd(), d)}/)`);
    code = Math.max(code, controler(d));
  });
  return code;
}
