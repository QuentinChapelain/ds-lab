// @ts-check
/**
 * Décisions du designer (D46) : un fichier JSON facultatif, écrit à la main, relu à chaque audit.
 *   garder : [{ type, version }]  la version à garder d'un type, par son nom stable « <type> / <origine> / <nom> » ;
 *   blocs  : [{ bloc, sort, type? }]  le sort d'un bloc non identifié, par sa classe : « laisser » (tel quel) ou
 *            « rattacher » à un type, existant ou nouveau ; le bloc devient alors une version de ce type, rattachée à la main.
 * Un fichier mal formé est une panne (sortie 2) : son message nomme la ligne. Une ligne qui vise une cible absente de
 * l'audit n'est pas une panne : elle n'est pas appliquée, et le constat la liste (src/composants/constat.js).
 */
import { lireJson } from '../lib/fichiers.js';

/**
 * @typedef {{ type: string, version: string }} Garder
 * @typedef {{ bloc: string, sort: 'laisser' | 'rattacher', type?: string }} SortDeBloc
 * @typedef {{ garder: Garder[], blocs: SortDeBloc[] }} Decisions
 */

const CLES = new Set(['$comment', 'garder', 'blocs']);

/** @param {unknown} s */
const texte = (s) => typeof s === 'string' && s.trim() !== '';

/**
 * Décisions validées ; une erreur d'une ligne nomme le fichier et la ligne fautive.
 * @param {unknown} brut @param {string} [nom] nom du fichier, en tête des messages
 * @returns {Decisions}
 */
export function validerDecisions(brut, nom = 'décisions') {
  const err = (/** @type {string} */ m) => new Error(`${nom} : ${m}`);
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw err('un objet est attendu, avec « garder » et « blocs »');
  const d = /** @type {Record<string, unknown>} */ (brut);
  for (const k of Object.keys(d)) if (!CLES.has(k)) throw err(`clé inconnue « ${k} » (garder, blocs)`);
  const garder = d.garder ?? [];
  const blocs = d.blocs ?? [];
  if (!Array.isArray(garder)) throw err('« garder » doit être une liste');
  if (!Array.isArray(blocs)) throw err('« blocs » doit être une liste');
  /** @type {Set<string>} */
  const types = new Set();
  garder.forEach((/** @type {any} */ g, i) => {
    const ligne = `garder, ligne ${i + 1}`;
    if (!g || !texte(g.type) || !texte(g.version)) throw err(`${ligne} : « type » et « version » sont attendus`);
    if (!g.version.startsWith(`${g.type} / `)) throw err(`${ligne} : la version « ${g.version} » n'est pas du type « ${g.type} »`);
    if (types.has(g.type)) throw err(`${ligne} : deux versions à garder pour le type « ${g.type} »`);
    types.add(g.type);
  });
  /** @type {Set<string>} */
  const vus = new Set();
  blocs.forEach((/** @type {any} */ b, i) => {
    const ligne = `blocs, ligne ${i + 1}`;
    if (!b || !texte(b.bloc)) throw err(`${ligne} : « bloc » est attendu`);
    if (b.sort !== 'laisser' && b.sort !== 'rattacher') throw err(`${ligne} : sort « ${b.sort} » inconnu (laisser, rattacher)`);
    if (b.sort === 'rattacher' && !texte(b.type)) throw err(`${ligne} : un bloc rattaché nomme son type`);
    if (vus.has(b.bloc)) throw err(`${ligne} : deux sorts pour le bloc « ${b.bloc} »`);
    vus.add(b.bloc);
  });
  return {
    garder: garder.map((/** @type {any} */ g) => ({ type: g.type, version: g.version })),
    blocs: blocs.map((/** @type {any} */ b) => ({ bloc: b.bloc, sort: b.sort, ...(b.sort === 'rattacher' ? { type: b.type } : {}) })),
  };
}

/** @param {string} chemin @returns {Decisions} */
export function lireDecisions(chemin) {
  return validerDecisions(lireJson(chemin), chemin);
}
