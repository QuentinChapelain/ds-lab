// @ts-check
/**
 * Lecture d'un fichier JSON, message d'erreur d'une ligne. Rangé dans src/lib/ pour être lu par les
 * commandes (src/cli/) et par l'orchestration de reduce (src/reduce/run.js), qui n'importe rien de src/cli/ (D30).
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
