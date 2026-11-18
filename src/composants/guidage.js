// @ts-check
/**
 * Guidage du constat des composants (D47), sans navigateur : ce qu'il reste à faire, et ce qui distingue les versions
 * d'un type. Rien ne change dans les chiffres : ces champs se lisent dans les versions, les types et les blocs.
 *   phrase courte : éléments, types, types à plusieurs versions ;
 *   à faire : types à plusieurs versions sans version à garder, types à une version sans version à garder (un type à une
 *     version n'est pas choisi d'office), blocs non identifiés pas encore décidés (un bloc laissé tel quel est décidé) ;
 *   éléments à remplacer d'un type : hors de la version à garder, sinon hors de la plus répandue (le même nombre pour
 *     chacune des ex aequo) ;
 *   défauts d'une version : un critère d'accessibilité de base par ligne, « k sur x : » s'il ne touche pas tous ses
 *     éléments ;
 *   différences : dans un type à plusieurs versions, les familles de mesures (hauteur, bordure, arrondi, marge
 *     intérieure, taille du texte, graisse) dont la valeur n'est pas la même pour toutes les versions ; la valeur d'une
 *     version est celle de ses apparences, par nombre d'éléments puis dans l'ordre où elles paraissent, jointes par
 *     « ou » ; aucune couleur.
 * Les textes sont ceux de src/report/constat.textes.json.
 */
import { fr } from '../lib/format.js';
import { TEXTES } from '../report/textes.js';

const G = TEXTES.guidage;

/** Forme au singulier ou au pluriel, {n} remplacé. @param {string[]} formes @param {number} n @param {Record<string, string>} [autres] */
export function accorde(formes, n, autres = {}) {
  let s = formes[n < 2 ? 0 : 1].replace('{n}', String(n));
  for (const [k, v] of Object.entries(autres)) s = s.replace(`{${k}}`, v);
  return s;
}

/** @param {number} n */
export const px = (n) => `${fr(n)} px`;
/** Quatre côtés écrits comme en CSS : une, deux ou quatre valeurs. @param {number[]} v */
export const cotes = (v) => {
  if (v.every((x) => x === v[0])) return px(v[0]);
  if (v[0] === v[2] && v[1] === v[3]) return `${fr(v[0])} ${px(v[1])}`;
  return `${v.slice(0, 3).map((x) => fr(x)).join(' ')} ${px(v[3])}`;
};

/**
 * Familles de mesures, dans l'ordre d'écriture : la valeur d'une apparence, et son mot quand elle est nulle.
 * @type {{ cle: string, libelle: string, valeur: (m: import('../browser/composants.js').Mesures) => string, nulle?: (m: import('../browser/composants.js').Mesures) => boolean, sans?: string }[]}
 */
const FAMILLES = [
  { cle: 'hauteur', libelle: G.differences.hauteur, valeur: (m) => px(m.hauteur) },
  { cle: 'bordure', libelle: G.differences.bordure, valeur: (m) => cotes(m.bordures), nulle: (m) => m.bordures.every((x) => x === 0), sans: G.differences.sansBordure },
  { cle: 'arrondi', libelle: G.differences.arrondi, valeur: (m) => cotes(m.rayons), nulle: (m) => m.rayons.every((x) => x === 0), sans: G.differences.sansArrondi },
  { cle: 'marge', libelle: G.differences.marge, valeur: (m) => cotes(m.marges), nulle: (m) => m.marges.every((x) => x === 0), sans: G.differences.sansMarge },
  { cle: 'texte', libelle: G.differences.texte, valeur: (m) => px(m.taille) },
  { cle: 'graisse', libelle: G.differences.graisse, valeur: (m) => String(m.graisse) },
];

/**
 * Valeur d'une famille pour une version : ses apparences par nombre d'éléments, puis dans l'ordre où elles paraissent ;
 * une valeur répétée n'est écrite qu'une fois. Rend la clé de comparaison (valeurs triées) et le texte.
 * @param {(typeof FAMILLES)[number]} f @param {{ fois: number, mesures: import('../browser/composants.js').Mesures }[]} apparences
 */
function valeurDe(f, apparences) {
  const rangees = apparences.map((a, i) => ({ ...a, i })).sort((a, b) => b.fois - a.fois || a.i - b.i);
  /** @type {{ texte: string, nulle: boolean }[]} */
  const valeurs = [];
  for (const a of rangees) {
    const nulle = !!f.nulle?.(a.mesures);
    const texte = nulle ? /** @type {string} */ (f.sans) : f.valeur(a.mesures);
    if (!valeurs.some((v) => v.texte === texte)) valeurs.push({ texte, nulle });
  }
  const cle = valeurs.map((v) => v.texte).sort().join('|');
  if (valeurs.length === 1) return { cle, texte: valeurs[0].nulle ? valeurs[0].texte : `${f.libelle} ${valeurs[0].texte}` };
  if (valeurs.some((v) => v.nulle)) return { cle, texte: valeurs.map((v) => (v.nulle ? v.texte : `${f.libelle} ${v.texte}`)).join(' ou ') };
  const enPx = valeurs.every((v) => v.texte.endsWith(' px'));
  const nus = valeurs.map((v) => (enPx ? v.texte.slice(0, -3) : v.texte));
  return { cle, texte: `${f.libelle} ${nus.join(' ou ')}${enPx ? ' px' : ''}` };
}

/**
 * Différences de chaque version d'un type, dans l'ordre des versions ; vide pour un type à une version.
 * @param {{ apparences: { fois: number, mesures: import('../browser/composants.js').Mesures }[] }[]} versions
 * @returns {string[]}
 */
export function differences(versions) {
  if (versions.length < 2) return versions.map(() => '');
  const parFamille = FAMILLES.map((f) => versions.map((v) => valeurDe(f, v.apparences)));
  const differentes = parFamille.filter((vs) => new Set(vs.map((v) => v.cle)).size > 1);
  return versions.map((_, i) => differentes.map((vs) => vs[i].texte).join(' · '));
}

/**
 * Défauts d'accessibilité de base d'une version, en mots simples, dans l'ordre nom, clavier, zone de clic.
 * @param {import('./pieces.js').Occurrence[]} occ
 * @returns {string[]}
 */
export function defauts(occ) {
  const commandes = occ.filter((o) => o.acces);
  /** @type {string[]} */
  const out = [];
  for (const critere of /** @type {const} */ (['nom', 'clavier', 'zone'])) {
    const k = commandes.filter((o) => !o.acces?.[critere]).length;
    if (!k) continue;
    const defaut = G.defauts[critere];
    out.push(k < commandes.length ? G.defauts.part.replace('{k}', String(k)).replace('{x}', String(commandes.length)).replace('{defaut}', defaut) : defaut);
  }
  return out;
}

/**
 * Nom court d'une version gardée : son nom dans le code, plus son origine si une autre version du type porte le même.
 * @param {{ nom: string, nomCode: string, origine: string }[]} versions @param {string} nomStable
 */
function nomCourt(versions, nomStable) {
  const v = versions.find((x) => x.nom === nomStable);
  if (!v) return nomStable;
  return versions.some((x) => x !== v && x.nomCode === v.nomCode) ? `${v.nomCode} (${v.origine})` : v.nomCode;
}

/**
 * Éléments à remplacer et texte « À faire » d'un type.
 * @param {{ fois: number, versions: { nom: string, nomCode: string, origine: string, fois: number }[], garder: string | null }} t
 */
export function aFaireDuType(t) {
  const plusieurs = t.versions.length > 1;
  const plusGrand = t.versions[0]?.fois ?? 0;
  const garde = t.garder ? (t.versions.find((v) => v.nom === t.garder)?.fois ?? 0) : null;
  const remplacer = t.fois - (garde ?? plusGrand);
  const nom = t.garder ? nomCourt(t.versions, t.garder) : '';
  const texte = plusieurs
    ? t.garder
      ? accorde(G.type.garde, remplacer, { nom })
      : accorde(G.type.choisir, remplacer)
    : t.garder
      ? G.type.gardeSeule.replace('{nom}', nom)
      : G.type.confirmer;
  return { plusieurs, remplacer, aFaire: texte };
}

/**
 * Mention d'une version dans un type à plusieurs versions : la plus répandue, ou à égalité ; null sinon.
 * @param {{ fois: number }[]} versions @param {number} i
 */
export function mention(versions, i) {
  if (versions.length < 2) return null;
  const plusGrand = versions[0].fois;
  if (versions[i].fois !== plusGrand) return null;
  return versions.filter((v) => v.fois === plusGrand).length > 1 ? G.type.egalite : G.type.plusRepandue;
}

/**
 * Phrase courte et nombres « à faire » du constat.
 * @param {{ fois: number, plusieurs: boolean, garder: string | null }[]} types types comptés
 * @param {number} elements @param {{ etat: string }[]} nonIdentifies
 */
export function guidageGlobal(types, elements, nonIdentifies) {
  const d = types.filter((t) => t.plusieurs).length;
  const phraseCourte = `${G.phraseCourte.replace('{elements}', accorde(G.elements, elements)).replace('{types}', accorde(G.types, types.length))} ${d ? accorde(G.plusieurs, d) : G.uneSeule}`;
  const aFaire = {
    doublons: types.filter((t) => t.plusieurs && !t.garder).length,
    confirmer: types.filter((t) => !t.plusieurs && !t.garder).length,
    blocs: nonIdentifies.filter((b) => b.etat === TEXTES.etats.aDecider).length,
  };
  return { phraseCourte, aFaire };
}
