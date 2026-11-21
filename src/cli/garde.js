// @ts-check
/**
 * Lancement commun des commandes (D18, docs/decisions.md).
 * Trois issues pour toute commande :
 *   0 tout passe ;
 *   1 l'entrée a été lue et jugée : une règle échoue, ou la marque est refusée avec son motif ;
 *   2 l'entrée n'a pas pu être jugée : fichier absent ou illisible, option inconnue, panne de l'outil.
 * Une commande rend 0 ou 1 ; une exception est une panne : message d'une ligne préfixé par le nom de la commande, sans
 * pile, et sortie 2. Un refus n'est jamais une exception : la commande l'affiche avec ses motifs et rend 1.
 * Sous une version majeure de Node autre que celle de .node-version, la commande ne lit rien et sort en 2 (D40,
 * src/cli/version.js).
 */
import { premiereLigne } from '../lib/fichiers.js';
import { refus } from './version.js';
import { relative } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { dossiersDeMarque, nomDeMarque, RESOLVER } from '../tokens/resolver.js';

/**
 * Lance une commande. `main` rend son code (0 ou 1 ; rien vaut 0) ; une exception sort en 2.
 * Le code est posé dans process.exitCode : la sortie déjà écrite n'est pas coupée.
 * @param {string} nom nom de la commande, en tête du message de panne
 * @param {() => number | void | Promise<number | void>} main
 */
export async function lancer(nom, main) {
  const version = refus();
  if (version) {
    console.error(`${nom} : ${version}`);
    process.exitCode = 2;
    return;
  }
  try {
    process.exitCode = /** @type {number} */ ((await main()) ?? 0);
  } catch (e) {
    console.error(`${nom} : ${premiereLigne(e)}`);
    process.exitCode = 2;
  }
}

/**
 * D66 : les marques d'un dossier donné par --marques <dossier>, ou celles de tokens/ sans l'option. Une panne dit quoi
 * faire : les deux options ensemble, un dossier absent, un dossier sans marque.
 * @param {string | undefined} marque @param {string | undefined} marques @returns {string[]}
 */
export function marquesDe(marque, marques) {
  if (marque && marques) throw new Error("l'un ou l'autre : --marque <dossier> pour une marque, --marques <dossier> pour toutes celles d'un dossier");
  if (marques === undefined) return dossiersDeMarque();
  if (!existsSync(marques) || !statSync(marques).isDirectory()) throw new Error(`--marques ${marques} : dossier introuvable ; nommer le dossier qui contient un sous-dossier par marque`);
  const d = dossiersDeMarque(marques);
  if (!d.length) throw new Error(`aucune marque dans ${marques} (un sous-dossier avec ${RESOLVER}) : lancer d'abord la saisie`);
  return d;
}

/**
 * D26 : un contrôle sur la marque de --marque <dossier>, ou, sans l'option, sur chaque marque de
 * tokens/ (dossiersDeMarque), sans en nommer aucune ; D66 : sur chaque marque du dossier de --marques <dossier>.
 * Sans --marque, chaque bloc est précédé de « marque <nom> (<dossier>) »
 * et les blocs sont séparés par une ligne vide ; le code le plus haut l'emporte (1 si une marque échoue).
 * Le contrôle peut rendre une promesse (npm run css) ; les marques passent l'une après l'autre.
 * @param {string | undefined} option @param {(dossier: string) => number | Promise<number>} controler
 * @param {string} [marques] dossier des marques (--marques)
 * @returns {Promise<number>}
 */
export async function parMarque(option, controler, marques) {
  const dossiers = marquesDe(option, marques);
  if (option) return controler(option);
  let code = 0;
  for (const [i, d] of dossiers.entries()) {
    if (i) console.log('');
    console.log(`marque ${nomDeMarque(d)} (${relative(process.cwd(), d)}/)`);
    code = Math.max(code, await controler(d));
  }
  return code;
}
