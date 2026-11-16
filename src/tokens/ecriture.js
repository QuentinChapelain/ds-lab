// @ts-check
/**
 * D31 : écriture des fichiers d'une marque par la saisie, sans état intermédiaire sur le disque.
 * Quatre temps :
 *   1. lire les fichiers en place (ceux à remplacer et ceux à supprimer) : une lecture qui tombe est une panne, rien n'est
 *      écrit ;
 *   2. écrire chaque fichier à côté, sous un nom temporaire (.<nom>.saisie-<pid>, dans le même dossier) ;
 *   3. contrôler les textes relus sur le disque (controler) ;
 *   4. renommer chaque temporaire à la place de son fichier, puis supprimer les fichiers à supprimer (une échelle générée
 *      devenue échelle nommée : echelles.tokens.json).
 * Une panne à l'un des temps 2 à 4 efface les temporaires et remet les fichiers d'origine, lus au temps 1 : une panne ou un
 * contrôle en échec ne laisse rien d'écrit. Si la remise en place tombe elle-même (disque plein), le message nomme les
 * fichiers laissés en l'état (KNOWN_ISSUES.md).
 */
import * as nodeFs from 'node:fs';
import { join } from 'node:path';
import { premiereLigne as premiere } from '../lib/fichiers.js';

/**
 * @typedef {{ readFileSync: typeof nodeFs.readFileSync, writeFileSync: typeof nodeFs.writeFileSync, renameSync: typeof nodeFs.renameSync,
 *   rmSync: typeof nodeFs.rmSync, existsSync: typeof nodeFs.existsSync }} Fs
 */

/**
 * @template T
 * @param {string} dossier
 * @param {[string, string][]} fichiers nom (dans le dossier) et texte, dans l'ordre d'écriture
 * @param {{ supprimer?: string[], controler?: (lus: Map<string, string>) => T, fs?: Partial<Fs> }} [opts] fichiers à supprimer au
 *   remplacement final s'ils existent ; contrôle des textes relus, dont la valeur est rendue ; opérations de fichier (essais)
 * @returns {T | undefined}
 */
export function remplacer(dossier, fichiers, { supprimer = [], controler, fs = {} } = {}) {
  /** @type {Fs} */
  const f = { ...nodeFs, ...fs };
  const chemin = (/** @type {string} */ nom) => join(dossier, nom);
  // 1. Fichiers en place, gardés en mémoire pour les remettre.
  /** @type {Map<string, Buffer | null>} */
  const origine = new Map();
  for (const nom of [...fichiers.map(([n]) => n), ...supprimer]) {
    try {
      origine.set(nom, f.existsSync(chemin(nom)) ? f.readFileSync(chemin(nom)) : null);
    } catch (e) {
      throw new Error(`${chemin(nom)} : lecture avant remplacement impossible (${premiere(e)}) ; rien n'est écrit`);
    }
  }
  const temporaire = (/** @type {string} */ nom) => chemin(`.${nom}.saisie-${process.pid}`);
  /** @type {string[]} */
  const ecrits = [];
  const effacerTemporaires = () => {
    for (const nom of ecrits) f.rmSync(temporaire(nom), { force: true });
  };
  /** @type {T | undefined} */
  let valeur;
  try {
    // 2. À côté.
    for (const [nom, texte] of fichiers) {
      ecrits.push(nom);
      f.writeFileSync(temporaire(nom), texte);
    }
    // 3. Contrôle sur les textes relus.
    const lus = new Map(fichiers.map(([nom]) => [nom, String(f.readFileSync(temporaire(nom), 'utf8'))]));
    valeur = controler?.(lus);
  } catch (e) {
    effacerTemporaires();
    throw e;
  }
  // 4. Remplacement.
  /** @type {string[]} */
  const faits = [];
  try {
    for (const [nom] of fichiers) {
      f.renameSync(temporaire(nom), chemin(nom));
      faits.push(nom);
    }
    for (const nom of supprimer)
      if (origine.get(nom)) {
        f.rmSync(chemin(nom));
        faits.push(nom);
      }
  } catch (e) {
    /** @type {string[]} */
    const laisses = [];
    for (const nom of faits.reverse()) {
      try {
        const o = origine.get(nom);
        if (o) f.writeFileSync(chemin(nom), o);
        else f.rmSync(chemin(nom), { force: true });
      } catch {
        laisses.push(chemin(nom));
      }
    }
    try {
      effacerTemporaires();
    } catch {
      laisses.push(...ecrits.map(temporaire));
    }
    if (laisses.length) throw new Error(`${premiere(e)} ; remise en place incomplète, fichiers laissés en l'état : ${laisses.join(', ')}`);
    throw new Error(`${premiere(e)} ; fichiers d'origine remis en place, rien n'est écrit`);
  }
  return valeur;
}
