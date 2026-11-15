// @ts-check
/**
 * Séance 3a, T2 et T3 : rôles de couleur (semantique.tokens.json) résolus vers les primitives,
 * et contrat de rôles : paires déclarées dans paires.json, mesurées en WCAG 2.1 (culori).
 * Le contrat de rôles s'ajoute au contrat par échelle (contractOf) sans le remplacer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { wcagContrast, formatHex } from 'culori';
import { contractOf } from '../valise/generate.js';
import { valiseFromTokens } from './primitives.js';
import { lireResolver, partager, COMMUN, ORBE, RESOLVER } from './resolver.js';

/** @param {number} n */
const r4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Jetons d'un fichier DTCG à plat : chemin logique → jeton. Un $root prend le chemin de son groupe
 * et reste joignable en « groupe.$root ».
 * @param {any} node @param {string[]} [path] @param {Map<string, any>} [out]
 */
export function flattenTokens(node, path = [], out = new Map()) {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') && k !== '$root') continue;
    if (!v || typeof v !== 'object') continue;
    if ('$value' in v) {
      out.set((k === '$root' ? path : [...path, k]).join('.'), v);
      if (k === '$root') out.set([...path, '$root'].join('.'), v);
    } else flattenTokens(v, [...path, k], out);
  }
  return out;
}

/**
 * Type DTCG de chaque jeton : celui du jeton, sinon celui du groupe le plus proche (undefined si aucun).
 * Clés comme flattenTokens, sans « groupe.$root ».
 * @param {any} node @param {string[]} [path] @param {string} [type] @param {Map<string, string | undefined>} [out]
 */
export function tokenTypes(node, path = [], type = undefined, out = new Map()) {
  const t = node?.$type ?? type;
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$') && k !== '$root') continue;
    if (!v || typeof v !== 'object') continue;
    if ('$value' in v) out.set((k === '$root' ? path : [...path, k]).join('.'), v.$type ?? t);
    else tokenTypes(v, [...path, k], t, out);
  }
  return out;
}

/**
 * Primitives sans rôle (séance 3c) : jetons des groupes donnés qu'aucun alias de la couche sémantique ne cite,
 * valeurs, composites et $extensions compris (une valeur en étroit compte comme un usage). Ordre du fichier.
 * @param {any} semantique @param {any[]} primitives fichiers de primitives @param {string[]} groupes
 * @returns {string[]}
 */
export function primitivesSansRole(semantique, primitives, groupes) {
  const cites = new Set([...JSON.stringify(semantique).matchAll(/\{([^{}"]+)\}/g)].map((m) => m[1]));
  const out = [];
  for (const f of primitives)
    for (const g of groupes)
      for (const k of Object.keys(f?.[g] ?? {})) if (!k.startsWith('$') && !cites.has(`${g}.${k}`)) out.push(`${g}.${k}`);
  return out;
}

/** Hex d'une valeur de couleur DTCG (objet 2025.10 ou chaîne). @param {any} v */
function hexOf(v) {
  if (typeof v === 'string') return formatHex(v);
  if (v?.hex) return v.hex.toLowerCase();
  return undefined;
}

/**
 * Rôles de la couche sémantique, résolus : rôle → { alias, cible, hex, description }.
 * Seuls les jetons de type color (ou sans type) sont des rôles de couleur ; les autres (séance 3c :
 * espacements, type dimension) sont ignorés ici. Les alias peuvent s'enchaîner ; une boucle ou une cible absente lève une erreur.
 * @param {any} semantique @param {...any} primitives
 * @returns {Map<string, { alias: string, cible: string, hex: string, description: string }>}
 */
export function resolveRoles(semantique, ...primitives) {
  const all = new Map();
  for (const f of primitives) for (const [k, v] of flattenTokens(f)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);
  /** @param {string} path @param {string[]} seen @returns {{ cible: string, hex: string }} */
  const resolve = (path, seen) => {
    if (seen.includes(path)) throw new Error(`alias en boucle : ${[...seen, path].join(' → ')}`);
    const t = all.get(path);
    if (!t) throw new Error(`alias sans cible : {${path}}${seen.length ? ` (depuis ${seen[0]})` : ''}`);
    const m = typeof t.$value === 'string' ? /^\{([^}]+)\}$/.exec(t.$value) : null;
    if (m) return resolve(m[1], [...seen, path]);
    const hex = hexOf(t.$value);
    if (!hex) throw new Error(`couleur illisible : ${path}`);
    return { cible: path, hex };
  };
  /** @type {Map<string, { alias: string, cible: string, hex: string, description: string }>} */
  const out = new Map();
  const types = tokenTypes(semantique);
  for (const [role, t] of sem) {
    if (role.endsWith('.$root')) continue;
    const type = types.get(role);
    if (type !== undefined && type !== 'color') continue; // séance 3c : espacements (dimension) hors des rôles de couleur
    out.set(role, { alias: t.$value, ...resolve(role, []), description: t.$description ?? '' });
  }
  return out;
}

/**
 * @typedef {{ primitives: any, statuts: any, semantique: any, paires: any, marque?: any, echelles?: any[] }} RoleSet
 */

/**
 * Jeu de rôles d'une marque, lu par son resolver (tokens/<marque>/marque.resolver.json) dans un contexte :
 * primitives communes et échelles de la marque fusionnées dans `primitives`, rôles dans `semantique`, couche marque
 * dans `marque`, paires communes (tokens/commun/paires.json, ou `paires`).
 * @param {string} [dossier] tokens/<marque>/, Orbe Café par défaut
 * @param {{ paires?: string, mode?: string, largeur?: string }} [opts]
 * @returns {RoleSet}
 */
export function loadRoles(dossier = ORBE, opts = {}) {
  /** @type {Record<string, string>} */
  const entrees = {};
  if (opts.mode) entrees.mode = opts.mode;
  if (opts.largeur) entrees.largeur = opts.largeur;
  const { semantique, primitives, marque } = partager(lireResolver(join(dossier, RESOLVER), entrees));
  return {
    primitives,
    statuts: {},
    semantique,
    paires: JSON.parse(readFileSync(opts.paires ?? join(COMMUN, 'paires.json'), 'utf8')),
    marque,
    echelles: [],
  };
}

/**
 * Contrat de rôles. Une paire sous son seuil échoue, sauf si elle porte une exception écrite
 * (phrase non vide) : elle va alors dans `exceptions`. Une paire interdite (`interdites`, avec sa
 * règle) ne se pose pas : mesurée pour mémoire, elle ne compte pas en échec et ne peut pas être
 * déclarée en même temps comme paire.
 * @param {RoleSet} set
 */
export function contratRoles(set) {
  const roles = resolveRoles(set.semantique, set.primitives, set.statuts, set.marque ?? {}, ...(set.echelles ?? []));
  const seuils = set.paires.seuils ?? {};
  /** @param {any} p */
  const known = (p) => {
    for (const r of [p.devant, p.fond]) if (!roles.has(r)) throw new Error(`paire ${p.devant} sur ${p.fond} : rôle inconnu ${r}`);
  };
  /** @param {string} devant @param {string} fond */
  const measure = (devant, fond) => {
    const hexDevant = /** @type {any} */ (roles.get(devant)).hex;
    const hexFond = /** @type {any} */ (roles.get(fond)).hex;
    return { hexDevant, hexFond, raw: wcagContrast(hexDevant, hexFond) };
  };
  const forbidden = new Set();
  const interdites = (set.paires.interdites ?? []).map((/** @type {any} */ p) => {
    known(p);
    if (!(typeof p.regle === 'string' && p.regle.trim())) throw new Error(`paire interdite ${p.devant} sur ${p.fond} : règle vide`);
    forbidden.add(`${p.devant}|${p.fond}`);
    const { hexDevant, hexFond, raw } = measure(p.devant, p.fond);
    return { devant: p.devant, fond: p.fond, regle: p.regle, hexDevant, hexFond, ratio: r4(raw) };
  });
  const pairs = (set.paires.paires ?? []).map((/** @type {any} */ p) => {
    known(p);
    if (forbidden.has(`${p.devant}|${p.fond}`)) throw new Error(`paire ${p.devant} sur ${p.fond} : déclarée et interdite`);
    const min = seuils[p.type];
    if (typeof min !== 'number') throw new Error(`paire ${p.devant} sur ${p.fond} : type inconnu ${p.type}`);
    if ('exception' in p && !(typeof p.exception === 'string' && p.exception.trim()))
      throw new Error(`paire ${p.devant} sur ${p.fond} : exception vide`);
    const { hexDevant, hexFond, raw: ratio } = measure(p.devant, p.fond);
    return {
      devant: p.devant,
      fond: p.fond,
      type: p.type,
      min,
      hexDevant,
      hexFond,
      ratio: r4(ratio),
      ok: ratio >= min,
      ...(p.exception ? { exception: p.exception } : {}),
    };
  });
  return {
    pairs,
    fails: pairs.filter((/** @type {any} */ p) => !p.ok && !p.exception),
    exceptions: pairs.filter((/** @type {any} */ p) => !p.ok && p.exception),
    interdites,
  };
}

/**
 * Contrat complet : par échelle (contractOf, inchangé) et par rôle.
 * @param {RoleSet} set
 */
export function contrat(set) {
  return { echelles: contractOf(valiseFromTokens({ couleur: ordreEchelles(set.primitives, set.statuts) })), roles: contratRoles(set) };
}

/** Statuts, dans l'ordre d'affichage. */
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];

/**
 * Échelles du contrat par échelle, dans l'ordre d'avant l'étape 4b : neutre, échelles de la marque, statuts.
 * @param {...any} fichiers
 */
export function ordreEchelles(...fichiers) {
  /** @type {Record<string, any>} */
  const toutes = {};
  for (const f of fichiers) for (const [k, v] of Object.entries(f?.couleur ?? {})) if (!k.startsWith('$')) toutes[k] = v;
  const noms = Object.keys(toutes);
  const ordre = [...noms.filter((n) => n === 'neutre'), ...noms.filter((n) => n !== 'neutre' && !STATUTS.includes(n)), ...STATUTS.filter((n) => noms.includes(n))];
  return Object.fromEntries(ordre.map((n) => [n, toutes[n]]));
}
