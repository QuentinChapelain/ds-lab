// @ts-check
/**
 * Pièces relevées, sans navigateur (D46) : type par le rôle calculé (ou par la signature d'une pièce sans rôle), origine,
 * version, apparence, accessibilité de base, gabarit.
 *   origine : le framework de la signature trouvée ; sinon la pièce a une classe : l'équipe, nommée par sa première classe ;
 *             sinon le navigateur sans habillage, nommé par sa balise. Lue dans le code, pas dans le rendu ;
 *   version : type, origine, nom, écrits « <type> / <origine> / <nom> » : le nom stable du fichier de décisions ;
 *   apparence : un jeu de mesures distinct dans une version ;
 *   accessibilité de base : un nom calculé, atteint au clavier, une zone de clic d'au moins 24 px de côté ;
 *   gabarit : avec au moins deux pages vues, un élément présent sur chaque page, une fois, avec la même identité.
 */
import { TEXTES } from '../report/textes.js';

/** Identifiant d'une ligne du relevé : page (à partir de 1) et rang dans le relevé de la page. @param {number} page @param {number} index */
export const idDe = (page, index) => `p${page + 1}-e${index}`;

/** Type par rôle calculé ; le bouton se départage par son texte visible. */
const TYPES_PAR_ROLE = /** @type {Record<string, string>} */ ({
  link: 'lien',
  textbox: 'champ de texte',
  searchbox: 'champ de texte',
  combobox: 'liste déroulante',
  listbox: 'liste déroulante',
  checkbox: 'case à cocher',
  radio: 'radio',
  switch: 'interrupteur',
  tab: 'onglet',
  menu: 'menu',
  menubar: 'menu',
  dialog: 'fenêtre',
  alertdialog: 'fenêtre',
});
/** Rôles relevés qui ne sont pas des commandes : ils n'entrent pas dans l'accessibilité de base. */
const NON_INTERACTIFS = new Set(['menu', 'menubar', 'dialog', 'alertdialog']);
/** Plus petit côté d'une zone de clic. */
const ZONE_MIN = 24;

/**
 * @typedef {import('../browser/composants.js').Releve & { page: number, id: string }} Ligne
 *   une ligne de releve.json : un élément relevé, sa page (rang dans les pages vues) et son identifiant (p<page>-e<rang>)
 * @typedef {{ cle: 'framework' | 'equipe' | 'nu', libelle: string, nom: string }} Origine
 * @typedef {object} Occurrence
 * @property {string} id
 * @property {number} page
 * @property {string} type
 * @property {Origine} origine
 * @property {string} version      « <type> / <origine> / <nom> »
 * @property {string} apparence    clé des mesures
 * @property {import('../browser/composants.js').Mesures} mesures
 * @property {boolean} interactif
 * @property {{ nom: boolean, clavier: boolean, zone: boolean } | null} acces  null pour une pièce qui n'est pas une commande
 * @property {boolean} rattache    bloc rattaché à la main
 * @property {string} nom          nom calculé (vide pour une pièce sans rôle)
 * @property {Ligne} ligne
 */

/** @param {Ligne} l */
function typeDe(l) {
  if (l.sorte === 'role') return l.role === 'button' ? (l.texte ? 'bouton avec texte' : 'bouton à icône seule') : TYPES_PAR_ROLE[/** @type {string} */ (l.role)];
  return /** @type {string} */ (l.piece?.type);
}

/** @param {Ligne} l @returns {Origine} */
function origineDe(l) {
  if (l.piece) return { cle: 'framework', libelle: l.piece.framework, nom: l.piece.nom };
  if (l.classes.length) return { cle: 'equipe', libelle: TEXTES.origines.equipe, nom: l.classes[0] };
  return { cle: 'nu', libelle: TEXTES.origines.nu, nom: l.balise };
}

/** @param {string} type @param {Origine} o */
export const nomDeVersion = (type, o) => `${type} / ${o.libelle} / ${o.nom}`;

/** @param {import('../browser/composants.js').Mesures} m */
export const apparenceDe = (m) => JSON.stringify([m.hauteur, m.rayons, m.bordures, m.marges, m.taille, m.graisse]);

/**
 * Occurrence d'un élément d'un rôle relevé ou d'une pièce sans rôle.
 * @param {Ligne} l @returns {Occurrence}
 */
export function occurrence(l) {
  const type = typeDe(l);
  const origine = origineDe(l);
  const interactif = l.sorte === 'role' && !NON_INTERACTIFS.has(/** @type {string} */ (l.role));
  const zone = l.zone ?? [0, 0];
  return {
    id: l.id,
    page: l.page,
    type,
    origine,
    version: nomDeVersion(type, origine),
    apparence: apparenceDe(l.mesures),
    mesures: l.mesures,
    interactif,
    acces: interactif ? { nom: (l.nom ?? '').trim() !== '', clavier: !!l.clavier, zone: zone[0] >= ZONE_MIN && zone[1] >= ZONE_MIN } : null,
    rattache: false,
    nom: l.nom ?? '',
    ligne: l,
  };
}

/**
 * Identifiants des éléments du gabarit : avec au moins deux pages vues, ceux dont l'identité paraît une fois sur chaque page.
 * @template {{ id: string, page: number }} T
 * @param {T[]} items @param {number} pages nombre de pages vues @param {(x: T) => string} identite
 * @returns {Set<string>}
 */
export function gabarit(items, pages, identite) {
  /** @type {Set<string>} */
  const out = new Set();
  if (pages < 2) return out;
  /** @type {Map<string, T[]>} */
  const groupes = new Map();
  for (const x of items) {
    const k = identite(x);
    groupes.set(k, [...(groupes.get(k) ?? []), x]);
  }
  for (const g of groupes.values()) if (g.length === pages && new Set(g.map((x) => x.page)).size === pages) for (const x of g) out.add(x.id);
  return out;
}

/** Identité d'un élément pour le gabarit : version, apparence, nom calculé, chemin. @param {Occurrence} o */
export const identiteElement = (o) => JSON.stringify([o.version, o.apparence, o.nom, o.ligne.chemin]);
