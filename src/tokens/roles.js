// @ts-check
/**
 * T2 et T3 : rôles de couleur (semantique.tokens.json) résolus vers les primitives,
 * et contrat de rôles : paires déclarées dans paires.json, mesurées en WCAG 2.1 (culori).
 * Le contrat de rôles s'ajoute au contrat par échelle (contractOf) sans le remplacer.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatHex } from 'culori';
import { contrastRatio } from '../lib/color.js';
import { contractOf } from '../valise/generate.js';
import { valiseFromTokens } from './primitives.js';
import { resoudre, partager, COMMUN, RESOLVER } from './resolver.js';
import { r4 } from '../lib/format.js';


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
 * Valeur finale d'une valeur DTCG, alias suivis (seule résolution d'alias des contrôles).
 * `chaine` : les jetons déjà traversés, en commençant par le jeton de départ ; `depuis` : le jeton ou le champ de départ,
 * nommé quand une cible manque. Rend la valeur finale et le dernier jeton traversé (`cible`) ; l'appelant juge le type.
 * Une boucle lève « alias en boucle : départ → … », une cible absente (ou un groupe sans $root) « alias sans cible ».
 * @param {Map<string, any>} jetons @param {any} valeur @param {{ depuis: string, chaine: string[] }} depart
 * @returns {{ valeur: any, cible: string }}
 */
export function resoudreAlias(jetons, valeur, { depuis, chaine }) {
  const vus = [...chaine];
  let v = valeur;
  for (;;) {
    const m = typeof v === 'string' ? /^\{([^}]+)\}$/.exec(v) : null;
    if (!m) return { valeur: v, cible: /** @type {string} */ (vus.at(-1)) };
    if (vus.includes(m[1])) throw new Error(`alias en boucle : ${[...vus, m[1]].join(' → ')}`);
    const t = jetons.get(m[1]);
    if (!t) throw new Error(`alias sans cible : ${v} (depuis ${depuis})`);
    vus.push(m[1]);
    v = t.$value;
  }
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
 * Primitives sans rôle : jetons des groupes donnés qu'aucun alias de la couche sémantique ne cite,
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
 * Seuls les jetons de type color (ou sans type) sont des rôles de couleur ; les autres (espacements,
 * type dimension) sont ignorés ici. Les alias peuvent s'enchaîner ; une boucle ou une cible absente lève une erreur.
 * @param {any} semantique @param {...any} primitives
 * @returns {Map<string, { alias: string, cible: string, hex: string, description: string }>}
 */
export function resolveRoles(semantique, ...primitives) {
  const all = new Map();
  for (const f of primitives) for (const [k, v] of flattenTokens(f)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);
  /** @param {string} role @returns {{ cible: string, hex: string }} */
  const resolve = (role) => {
    const { valeur, cible } = resoudreAlias(all, all.get(role).$value, { depuis: role, chaine: [role] });
    const hex = hexOf(valeur);
    if (!hex) throw new Error(`couleur illisible : ${cible}`);
    return { cible, hex };
  };
  /** @type {Map<string, { alias: string, cible: string, hex: string, description: string }>} */
  const out = new Map();
  const types = tokenTypes(semantique);
  for (const [role, t] of sem) {
    if (role.endsWith('.$root')) continue;
    const type = types.get(role);
    if (type !== undefined && type !== 'color') continue; // Espacements (dimension) hors des rôles de couleur
    out.set(role, { alias: t.$value, ...resolve(role), description: t.$description ?? '' });
  }
  return out;
}

/**
 * @typedef {{ primitives: any, semantique: any, paires: any, marque?: any, echelles?: any[] }} RoleSet
 */

/**
 * Jeu de rôles d'une marque, lu par son resolver (tokens/<marque>/marque.resolver.json) dans un contexte :
 * primitives communes et échelles de la marque fusionnées dans `primitives`, rôles dans `semantique`, couche marque
 * dans `marque`, paires communes (tokens/commun/paires.json, ou `paires`).
 * @param {string} dossier tokens/<marque>/, obligatoire (D26 : aucune marque par défaut)
 * @param {{ paires?: string, mode?: string, largeur?: string }} [opts]
 * @returns {RoleSet}
 */
export function loadRoles(dossier, opts = {}) {
  if (!dossier) throw new Error('loadRoles : dossier de marque attendu');
  /** @type {Record<string, string>} */
  const entrees = {};
  if (opts.mode) entrees.mode = opts.mode;
  if (opts.largeur) entrees.largeur = opts.largeur;
  return rolesDuResolver(JSON.parse(readFileSync(join(dossier, RESOLVER), 'utf8')), dossier, entrees, JSON.parse(readFileSync(opts.paires ?? join(COMMUN, 'paires.json'), 'utf8')));
}

/**
 * D31 : jeu de rôles d'un resolver déjà lu, dans un contexte. Seule fusion de contexte de marque :
 * lue par loadRoles (les contrôles, les planches) et par la saisie (resolver aux fichiers de la marque donnés en ligne,
 * enLigne, src/tokens/resolver.js).
 * @param {any} resolver @param {string} base dossier depuis lequel se lisent ses $ref
 * @param {Record<string, string>} entrees contexte choisi par modificateur @param {any} paires
 * @returns {RoleSet}
 */
export function rolesDuResolver(resolver, base, entrees, paires) {
  const { semantique, primitives, marque } = partager(resoudre(resolver, base, entrees));
  return { primitives, semantique, paires, marque, echelles: [] };
}

/**
 * Contrat de rôles. Une paire sous son seuil échoue, sauf si elle porte une exception écrite
 * (phrase non vide) : elle va alors dans `exceptions`. Une paire interdite (`interdites`, avec sa
 * règle) ne se pose pas : mesurée pour mémoire, elle ne compte pas en échec et ne peut pas être
 * déclarée en même temps comme paire.
 * @param {RoleSet} set
 */
export function contratRoles(set) {
  const roles = resolveRoles(set.semantique, set.primitives, set.marque ?? {}, ...(set.echelles ?? []));
  const seuils = set.paires.seuils ?? {};
  /** @param {any} p */
  const known = (p) => {
    for (const r of [p.devant, p.fond]) if (!roles.has(r)) throw new Error(`paire ${p.devant} sur ${p.fond} : rôle inconnu ${r}`);
  };
  /** @param {string} devant @param {string} fond */
  const measure = (devant, fond) => {
    const hexDevant = /** @type {any} */ (roles.get(devant)).hex;
    const hexFond = /** @type {any} */ (roles.get(fond)).hex;
    return { hexDevant, hexFond, raw: contrastRatio(hexDevant, hexFond) };
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
  return { echelles: contractOf(valiseFromTokens({ couleur: ordreEchelles(set.primitives) })), roles: contratRoles(set) };
}

/** Statuts, dans l'ordre d'affichage. */
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];

/**
 * Échelles du contrat par échelle, dans l'ordre d'origine : neutre, échelles de la marque, statuts.
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
