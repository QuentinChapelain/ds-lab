// @ts-check
/**
 * Séance 3c : espacements par relation de la couche sémantique (semantique.tokens.json, type dimension),
 * résolus vers espace.* (primitives.tokens.json).
 * Les quatre ecart, du plus proche au plus lointain, doivent être strictement croissants ; le rapport
 * entre voisins est calculé pour information, jamais contrôlé. marge-interieure.* est hors contrôle.
 * Lot 4 : un ecart peut porter une valeur en étroit dans $extensions["ds-lab.etroit"]
 * ({ valeur: alias, sous: dimension px, seuil }) ; elle doit rester strictement supérieure à l'ecart
 * précédent (sa valeur en étroit s'il en a une) et inférieure ou égale à sa propre valeur large.
 * Règle de proximité : ecart.entre-composants vaut au moins le double de ecart.dans-composant, pour qu'on
 * voie à quel champ appartient un libellé ou un message ; régularité observée dans les systèmes lus, pas
 * une norme. Les autres rapports entre voisins n'ont pas de seuil.
 */
import { flattenTokens, primitivesSansRole } from './roles.js';

/** Ordre des relations, du plus proche au plus lointain. */
export const ORDRE = ['ecart.dans-composant', 'ecart.entre-composants', 'ecart.entre-groupes', 'ecart.section'];
/** Rôles affichés sans contrôle d'ordre. */
export const HORS_CONTROLE = ['marge-interieure.composant'];

/**
 * @typedef {{ role: string, alias: string, cible: string, px: number, description: string }} Espace
 * @typedef {{ de: string, vers: string, a: number, b: number, rapport: number | null, ok: boolean }} Voisin
 * @typedef {{ role: string, alias: string, cible: string, px: number, sous: number, seuil: string,
 *   de: string | null, precedent: number | null, large: number, superieur: boolean, auPlusLarge: boolean, ok: boolean }} Etroit
 * @typedef {{ de: string, vers: string, min: number, raison: string, statut: string, a: number, b: number, rapport: number | null, ok: boolean }} Regle
 */

/**
 * Règles de rapport minimal entre deux ecart (b ≥ min × a), avec leur raison et leur statut.
 * @type {{ de: string, vers: string, min: number, raison: string, statut: string }[]}
 */
export const REGLES = [
  {
    de: 'ecart.dans-composant',
    vers: 'ecart.entre-composants',
    min: 2,
    raison: "pour qu'on voie à quel champ appartient un libellé ou un message",
    statut: 'régularité observée dans les systèmes lus, pas une norme',
  },
];

/** Clé d'extension de la valeur en étroit. */
export const ETROIT = 'ds-lab.etroit';

/**
 * @param {any} semantique @param {...any} primitives
 * @returns {{ ecarts: Espace[], horsControle: Espace[], voisins: Voisin[], fails: Voisin[], etroits: Etroit[], etroitsFails: Etroit[], regles: Regle[], reglesFails: Regle[], sansRole: string[] }}
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
  /** @param {string} alias @param {string} depuis */
  const resolveAlias = (alias, depuis) => {
    const m = typeof alias === 'string' ? /^\{([^}]+)\}$/.exec(alias) : null;
    if (!m) throw new Error(`alias attendu : ${depuis}`);
    return resolve(m[1], [depuis]);
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
  /** @type {Etroit[]} */
  const etroits = [];
  ecarts.forEach((e, i) => {
    const x = sem.get(e.role)?.$extensions?.[ETROIT];
    if (!x) return;
    const sous = x.sous;
    if (!sous || typeof sous.value !== 'number' || sous.unit !== 'px') throw new Error(`seuil illisible (px attendu) : ${e.role}`);
    const { cible, px } = resolveAlias(x.valeur, `${e.role} (${ETROIT})`);
    const prev = i > 0 ? ecarts[i - 1] : null;
    const prevEtroit = prev ? etroits.find((t) => t.role === prev.role) : undefined;
    const precedent = prev ? (prevEtroit?.px ?? prev.px) : null;
    const superieur = precedent === null || px > precedent;
    const auPlusLarge = px <= e.px;
    etroits.push({ role: e.role, alias: x.valeur, cible, px, sous: sous.value, seuil: x.seuil ?? '', de: prev?.role ?? null, precedent, large: e.px, superieur, auPlusLarge, ok: superieur && auPlusLarge });
  });
  const pxOf = (/** @type {string} */ role) => /** @type {Espace} */ (ecarts.find((e) => e.role === role)).px;
  /** @type {Regle[]} */
  const regles = REGLES.map((g) => {
    const a = pxOf(g.de);
    const b = pxOf(g.vers);
    return { ...g, a, b, rapport: a ? Math.round((b / a) * 100) / 100 : null, ok: b >= g.min * a };
  });
  return {
    ecarts, horsControle, voisins, fails: voisins.filter((v) => !v.ok),
    etroits, etroitsFails: etroits.filter((t) => !t.ok),
    regles, reglesFails: regles.filter((g) => !g.ok),
    sansRole: primitivesSansRole(semantique, primitives, ['espace']),
  };
}
