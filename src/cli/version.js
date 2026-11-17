// @ts-check
/**
 * Garde de version (D40) : .node-version est la seule source de la version de Node. Une commande de l'outil lancée
 * sous une autre version majeure sort en 2, avant de lire son entrée, avec un message d'une ligne. lancer
 * (src/cli/garde.js) la pose pour chaque commande ; une commande qui ne passe pas par lancer appelle garderVersion.
 */
import { readFileSync } from 'node:fs';

/**
 * Refus, en une ligne, si la version qui tourne n'a pas la majeure de la version attendue ; null sinon.
 * @param {string} actuelle @param {string} attendue  versions complètes (24.22.3), telles que .node-version les écrit
 * @returns {string | null}
 */
export function refusDeVersion(actuelle, attendue) {
  const a = attendue.trim();
  const majeure = (/** @type {string} */ v) => v.replace(/^v/, '').split('.')[0];
  return majeure(actuelle) === majeure(a) ? null : `Node ${actuelle}, ds-lab demande Node ${majeure(a)} (.node-version : ${a})`;
}

/** Refus pour le Node qui tourne, ou null ; .node-version illisible est un refus. @returns {string | null} */
export function refus() {
  let attendue;
  try {
    attendue = readFileSync(new URL('../../.node-version', import.meta.url), 'utf8');
  } catch {
    return '.node-version illisible : la version de Node demandée est inconnue';
  }
  return refusDeVersion(process.versions.node, attendue);
}

/** Pour une commande qui ne passe pas par lancer : sortie 2 sur un refus. @param {string} nom */
export function garderVersion(nom) {
  const r = refus();
  if (!r) return;
  console.error(`${nom} : ${r}`);
  process.exit(2);
}
