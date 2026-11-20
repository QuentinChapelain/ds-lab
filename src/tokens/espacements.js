// @ts-check
/**
 * Espacements par relation de la couche sémantique (semantique.tokens.json, type dimension),
 * résolus vers espace.* (primitives.tokens.json).
 * Les quatre ecart, du plus proche au plus lointain, doivent être strictement croissants ; le rapport
 * entre voisins est calculé pour information, jamais contrôlé. marge-interieure.*, ecart.icone-texte,
 * ecart.entre-etiquettes et ecart.entre-blocs (écarts internes d'un contrôle, d'une suite d'étiquettes ou d'un
 * composant, hors de l'échelle des relations) sont hors contrôle.
 * Un ecart peut avoir une valeur en étroit (le rôle du contexte étroit, largeur.etroit.tokens.json,
 * quand il diffère du large ; seuil sur le modificateur largeur) ; elle doit rester strictement supérieure à l'ecart
 * précédent (sa valeur en étroit s'il en a une) et inférieure ou égale à sa propre valeur large.
 * Règle de proximité : ecart.entre-composants vaut au moins le double de ecart.dans-composant, pour qu'on
 * voie à quel champ appartient un libellé ou un message ; régularité observée dans les systèmes lus, pas
 * une norme. Les autres rapports entre voisins n'ont pas de seuil.
 */
import { flattenTokens, primitivesSansRole, resoudreAlias } from './roles.js';

/** Ordre des relations, du plus proche au plus lointain. */
const ORDRE = ['ecart.dans-composant', 'ecart.entre-composants', 'ecart.entre-groupes', 'ecart.section'];
/** Rôles affichés sans contrôle d'ordre. */
const HORS_CONTROLE = ['ecart.icone-texte', 'ecart.entre-etiquettes', 'ecart.entre-blocs', 'marge-interieure.composant', 'marge-interieure.etiquette'];

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
const REGLES = [
  {
    de: 'ecart.dans-composant',
    vers: 'ecart.entre-composants',
    min: 2,
    raison: "pour qu'on voie à quel champ appartient un libellé ou un message",
    statut: 'régularité observée dans les systèmes lus, pas une norme',
  },
];

/**
 * @param {any} semantique @param {any} primitives
 * @param {{ semantique: any, sous: number, seuil: string }} largeurEtroite rôles résolus en étroit, seuil de l'étroit (obligatoire)
 * @returns {{ ecarts: Espace[], horsControle: Espace[], voisins: Voisin[], fails: Voisin[], etroits: Etroit[], etroitsFails: Etroit[], regles: Regle[], reglesFails: Regle[], sansRole: string[] }}
 */
export function espacements(semantique, primitives, largeurEtroite) {
  // Sans contexte étroit, les règles en étroit passeraient sans rien contrôler.
  if (!largeurEtroite) throw new Error('contexte étroit absent : les règles en étroit ne peuvent pas être contrôlées');
  const all = new Map();
  for (const [k, v] of flattenTokens(primitives)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);

  /** Valeur en px d'une valeur ou d'un alias. @param {any} valeur @param {string} depuis @param {string[]} chaine @returns {{ cible: string, px: number }} */
  const dimension = (valeur, depuis, chaine) => {
    const { valeur: v, cible } = resoudreAlias(all, valeur, { depuis, chaine });
    if (!v || typeof v.value !== 'number' || v.unit !== 'px') throw new Error(`dimension illisible (px attendu) : ${cible}`);
    return { cible, px: v.value };
  };
  /** @param {string} path */
  const resolve = (path) => dimension(all.get(path).$value, path, [path]);
  /** @param {string} alias @param {string} depuis */
  const resolveAlias = (alias, depuis) => {
    const m = typeof alias === 'string' ? /^\{([^}]+)\}$/.exec(alias) : null;
    if (!m) throw new Error(`alias attendu : ${depuis}`);
    return dimension(alias, depuis, [depuis]);
  };
  /** @param {string} role @returns {Espace} */
  const espace = (role) => {
    const t = sem.get(role);
    if (!t) throw new Error(`rôle d'espacement absent : ${role}`);
    return { role, alias: t.$value, ...resolve(role), description: t.$description ?? '' };
  };

  const ecarts = ORDRE.map(espace);
  const horsControle = HORS_CONTROLE.map(espace);
  const voisins = ecarts.slice(1).map((e, i) => {
    const p = ecarts[i];
    return { de: p.role, vers: e.role, a: p.px, b: e.px, rapport: p.px ? Math.round((e.px / p.px) * 100) / 100 : null, ok: e.px > p.px };
  });
  /** @type {Etroit[]} */
  const etroits = [];
  const semEtroit = largeurEtroite ? flattenTokens(largeurEtroite.semantique) : null;
  ecarts.forEach((e, i) => {
    const te = semEtroit?.get(e.role);
    if (!te || !largeurEtroite || JSON.stringify(te.$value) === JSON.stringify(sem.get(e.role)?.$value)) return;
    const x = { valeur: te.$value, seuil: largeurEtroite.seuil };
    const sous = { value: largeurEtroite.sous };
    const { cible, px } = resolveAlias(x.valeur, `${e.role} (étroit)`);
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
    sansRole: primitivesSansRole([semantique, largeurEtroite?.semantique ?? {}], [primitives], ['espace']),
  };
}
