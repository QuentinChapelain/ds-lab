// @ts-check
/**
 * Séance 3c : espacements par relation de la couche sémantique (semantique.tokens.json, type dimension),
 * résolus vers espace.* (primitives.tokens.json).
 * Les quatre ecart, du plus proche au plus lointain, doivent être strictement croissants ; le rapport
 * entre voisins est calculé pour information, jamais contrôlé. marge-interieure.* est hors contrôle.
 */
import { flattenTokens } from './roles.js';

/** Ordre des relations, du plus proche au plus lointain. */
export const ORDRE = ['ecart.dans-composant', 'ecart.entre-composants', 'ecart.entre-groupes', 'ecart.section'];
/** Rôles affichés sans contrôle d'ordre. */
export const HORS_CONTROLE = ['marge-interieure.composant'];

/**
 * @typedef {{ role: string, alias: string, cible: string, px: number, description: string }} Espace
 * @typedef {{ de: string, vers: string, a: number, b: number, rapport: number | null, ok: boolean }} Voisin
 */

/**
 * @param {any} semantique @param {...any} primitives
 * @returns {{ ecarts: Espace[], horsControle: Espace[], voisins: Voisin[], fails: Voisin[] }}
 */
export function espacements(semantique, ...primitives) {
  const all = new Map();
  for (const f of primitives) for (const [k, v] of flattenTokens(f)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);

  /** @param {string} path @param {string[]} seen @returns {{ cible: string, px: number }} */
  const resolve = (path, seen) => {
    if (seen.includes(path)) throw new Error(`alias en boucle : ${[...seen, path].join(' → ')}`);
    const t = all.get(path);
    if (!t) throw new Error(`alias sans cible : {${path}}${seen.length ? ` (depuis ${seen[0]})` : ''}`);
    const m = typeof t.$value === 'string' ? /^\{([^}]+)\}$/.exec(t.$value) : null;
    if (m) return resolve(m[1], [...seen, path]);
    const v = t.$value;
    if (!v || typeof v.value !== 'number' || v.unit !== 'px') throw new Error(`dimension illisible (px attendu) : ${path}`);
    return { cible: path, px: v.value };
  };
  /** @param {string} role @returns {Espace} */
  const espace = (role) => {
    const t = sem.get(role);
    if (!t) throw new Error(`rôle d'espacement absent : ${role}`);
    return { role, alias: t.$value, ...resolve(role, []), description: t.$description ?? '' };
  };

  const ecarts = ORDRE.map(espace);
  const horsControle = HORS_CONTROLE.map(espace);
  const voisins = ecarts.slice(1).map((e, i) => {
    const p = ecarts[i];
    return { de: p.role, vers: e.role, a: p.px, b: e.px, rapport: p.px ? Math.round((e.px / p.px) * 100) / 100 : null, ok: e.px > p.px };
  });
  return { ecarts, horsControle, voisins, fails: voisins.filter((v) => !v.ok) };
}
