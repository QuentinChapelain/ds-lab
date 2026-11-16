// @ts-check
/**
 * Mise en forme commune des sorties (D22) : nombres à la française, texte échappé pour le HTML,
 * arrondi à 4 décimales des nombres écrits dans les fichiers. Une seule définition de chaque règle ; chaque appelant nomme
 * son format par les options de `fr` (docs/decisions.md, D22).
 */

/**
 * Nombre décalé de `d` puissances de dix sur son écriture décimale : 1.005 décalé de 2 vaut 100,5, quand 1.005 × 100 vaut
 * 100,4999… en flottant.
 * @param {number} n @param {number} d
 */
const decale = (n, d) => {
  const [m, e = '0'] = String(n).split('e');
  return Number(`${m}e${Number(e) + d}`);
};

/** Arrondi à 4 décimales, pour les nombres écrits dans les fichiers et lus par les tests. @param {number} n */
export const r4 = (n) => Math.round(n * 10000) / 10000;

/**
 * Nombre à la française, virgule décimale.
 * Sans `decimales`, le nombre tel quel. Avec `decimales`, arrondi sur l'écriture décimale (une valeur en ,xx5 monte) ;
 * `zeros` garde les zéros finaux (4,50) ; `tronque` coupe vers le bas au lieu d'arrondir, sur la valeur arrondie à 4
 * décimales (5,02 reste 5,02, jamais 5,01). `null` et `undefined` donnent `vide` s'il est donné ; sinon, comme toute
 * valeur qui n'est pas un nombre fini, une erreur qui la nomme.
 * @param {number | null | undefined} n
 * @param {{ decimales?: number, zeros?: boolean, tronque?: boolean, vide?: string }} [options]
 */
export function fr(n, { decimales, zeros = false, tronque = false, vide } = {}) {
  if ((n === null || n === undefined) && vide !== undefined) return vide;
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error(`fr : nombre attendu, reçu ${typeof n === 'string' ? `« ${n} »` : String(n)}`);
  if (decimales === undefined) return String(n).replace('.', ',');
  const v = decale((tronque ? Math.floor : Math.round)(decale(tronque ? r4(n) : n, decimales)), -decimales);
  return (zeros ? v.toFixed(decimales) : String(v)).replace('.', ',');
}

/**
 * Texte échappé pour le HTML (& < > "), contenu ou valeur d'attribut entre guillemets ; `null` et `undefined` donnent la
 * chaîne vide.
 * @param {unknown} s
 */
export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
