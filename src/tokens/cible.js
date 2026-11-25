// @ts-check
/**
 * La cible d'une réduction prise dans la marque saisie (D76). Les couleurs de la cible sont les échelles des jetons de
 * la marque, en clair : ses échelles (primaire, accent), le neutre et les statuts communs, le blanc, avec le texte posé
 * sur chaque plein (onSolid). La revue ne propose donc que des nuances qui existent dans la marque, et chaque couleur
 * retenue a son jeton. Les dimensions (rayons, espacements, tailles de texte) restent celles de la cible donnée.
 */
import { valiseFromTokens } from './primitives.js';

/** Le nom d'une échelle des jetons dans la cible : le neutre garde le nom que lit la réduction pour ranger les gris. */
const NOMS = /** @type {Record<string, string>} */ ({ neutral: 'neutre' });

/** Statuts hors de la cible : ils disent un sens (attention, information), jamais une couleur du site à ranger. */
const HORS = new Set(['warning', 'info']);

/** Échelles communes : le neutre et les statuts. Les autres échelles sont celles de la marque. */
const COMMUNES = new Set(['neutral', 'error', 'success', 'warning', 'info']);

/** @param {string} n */
const nomDans = (n) => NOMS[n] ?? n;

/**
 * @param {Record<string, any>} base  la cible donnée (dimensions)
 * @param {Record<string, any>} jetons  l'arbre des jetons de la marque, résolu en clair
 * @param {{ marque?: string }} [o]  nom de la marque, pour la description
 * @returns {Record<string, any>}
 */
export function cibleDeLaMarque(base, jetons, { marque } = {}) {
  const color = Object.fromEntries(Object.entries(jetons.color ?? {}).filter(([k]) => !HORS.has(k)));
  const v = valiseFromTokens({ color });
  if (!v.colors.length) throw new Error('couleurs de la marque : aucune échelle de 12 pas dans les jetons');
  const blanc = jetons.color?.white?.$value?.hex;
  const colors = [
    ...(blanc ? [{ name: 'blanc', value: String(blanc).toLowerCase() }] : []),
    ...v.colors.map((/** @type {{ name: string, value: string }} */ c) => {
      const m = /** @type {RegExpExecArray} */ (/^(.+)-(\d+)$/.exec(c.name));
      return { name: `${nomDans(m[1])}-${m[2]}`, value: c.value.toLowerCase() };
    }),
  ];
  const onSolid = Object.fromEntries(Object.entries(v.onSolid).map(([k, x]) => [nomDans(k), String(x).toLowerCase()]));
  const { $comment, colors: _c, onSolid: _o, brand: _b, ...dimensions } = base;
  return {
    $comment: `Cible prise dans la marque${marque ? ` ${marque}` : ''} : couleurs lues dans ses jetons, en clair ; dimensions de la cible donnée.`,
    ...dimensions,
    // M8 : une couleur du site qui n'a la teinte d'aucune échelle de la marque va au neutre, même si elle a celle d'un
    // statut : l'erreur et le succès disent un sens, ils n'accueillent pas une couleur du site.
    otherHues: nomDans('neutral'),
    brandScales: [...new Set(v.colors.map((/** @type {{ name: string }} */ c) => c.name.replace(/-\d+$/, '')))].filter((n) => !COMMUNES.has(n)),
    onSolid,
    colors,
  };
}
