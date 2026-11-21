// @ts-check
/**
 * Feuille CSS complète d'une marque, écrite par Terrazzo (@terrazzo/parser, @terrazzo/plugin-css) depuis son
 * marque.resolver.json, sans fichier de configuration (D36). Une seule fonction pour toutes les marques.
 *
 * Forme de la feuille :
 *   :root                                  clair et large, contextes par défaut du resolver, tous les jetons ;
 *   @media (prefers-color-scheme: dark)    les seuls jetons que le sombre change ;
 *   @media (width < <seuil>px)             les seuls jetons que l'étroit change ; seuil lu par seuilEtroit.
 * Pas de bloc pour sombre et étroit à la fois : si les deux changent un même jeton, la marque est refusée avec son motif.
 * Noms : chemin du jeton, points remplacés par des tirets, comme tokens.css de npm run apply. Couleur sans alias : le
 * hex du jeton ; alias : var() de sa cible ; style de texte : ses cinq sous-variables, sans raccourci font (il omet
 * l'interlettrage) ; description : commentaire au-dessus de la variable.
 *
 * Avant d'écrire, chaque combinaison est comparée au lecteur (src/tokens/resolver.js, alias résolus par resoudreAlias) :
 * un jeton présent d'un seul côté, ou une valeur différente, refuse la marque.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse, build, defineConfig } from '@terrazzo/parser';
import css, { FILE_PREFIX } from '@terrazzo/plugin-css';
import { lireJson } from '../lib/fichiers.js';
import { cssVar } from '../lib/nom-css.js';
import { RESOLVER, lireResolver, seuilEtroit } from './resolver.js';
import { flattenTokens, tokenTypes, resoudreAlias } from './roles.js';

/** Nom de la feuille dans le dossier de la marque. */
export const FEUILLE = 'jetons.css';

const CLAIR_LARGE = { mode: 'clair', largeur: 'large' };
const SOMBRE = { mode: 'sombre', largeur: 'large' };
const ETROIT = { mode: 'clair', largeur: 'etroit' };
const SOMBRE_ETROIT = { mode: 'sombre', largeur: 'etroit' };

/** Variable CSS d'un jeton Terrazzo : la règle de tokens.css de npm run apply. @param {{ id: string }} t */
const nomVar = (t) => cssVar(t.id);

/**
 * Valeur CSS d'un jeton : le hex du jeton pour une couleur sans alias ; sinon undefined, et Terrazzo écrit la sienne.
 * @param {any} t
 */
const transform = (t) => (t.$type === 'color' && !t.aliasOf ? t.originalValue?.$value?.hex : undefined);

/**
 * Valeur comparable d'une valeur DTCG résolue, de Terrazzo ou du lecteur.
 * @param {string | undefined} type @param {any} v @returns {string}
 */
function comparable(type, v) {
  if (type === 'color') return `${String(v?.hex).toLowerCase()}/${v?.alpha ?? 1}`;
  if (type === 'dimension') return `${v?.value}${v?.unit}`;
  if (type === 'fontFamily') return (Array.isArray(v) ? v : [v]).join(', ');
  if (type === 'typography') {
    const types = { fontFamily: 'fontFamily', fontSize: 'dimension', letterSpacing: 'dimension' };
    return Object.keys(v ?? {}).sort().map((k) => `${k}=${comparable(types[/** @type {keyof typeof types} */ (k)], v[k])}`).join(' ; ');
  }
  return JSON.stringify(v);
}

/**
 * Écarts entre Terrazzo et le lecteur dans une combinaison, une ligne par écart.
 * @param {Record<string, any>} tz jetons de Terrazzo @param {string} chemin resolver @param {Record<string, string>} c
 */
function ecarts(tz, chemin, c) {
  const jetons = lireResolver(chemin, c).jetons;
  const plats = flattenTokens(jetons);
  const types = tokenTypes(jetons);
  const ici = `${c.mode}/${c.largeur}`;
  const ids = [...plats.keys()].filter((k) => !k.endsWith('.$root'));
  /** @type {string[]} */
  const out = [];
  for (const id of ids) {
    if (!(id in tz)) {
      out.push(`${ici} ${id} : lu par le lecteur, absent chez Terrazzo`);
      continue;
    }
    const t = types.get(id);
    let v = resoudreAlias(plats, plats.get(id).$value, { depuis: id, chaine: [id] }).valeur;
    if (t === 'typography') v = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, resoudreAlias(plats, x, { depuis: id, chaine: [id] }).valeur]));
    const nous = `${t} ${comparable(t, v)}`;
    const eux = `${tz[id].$type} ${comparable(tz[id].$type, tz[id].$value)}`;
    if (nous !== eux) out.push(`${ici} ${id} : Terrazzo ${eux}, lecteur ${nous}`);
  }
  const lus = new Set(ids);
  for (const id of Object.keys(tz)) if (!lus.has(id)) out.push(`${ici} ${id} : lu par Terrazzo, absent chez le lecteur`);
  return out;
}

/**
 * Feuille d'une marque. `texte` est null si la marque est refusée ; `motifs` dit pourquoi.
 * @param {string} dossier dossier de la marque, avec son marque.resolver.json
 * @returns {Promise<{ texte: string | null, motifs: string[] }>}
 */
export async function feuilleCss(dossier) {
  const chemin = join(dossier, RESOLVER);
  const nom = String(lireJson(chemin).name ?? '');
  const source = readFileSync(chemin, 'utf8');
  const seuil = seuilEtroit(lireResolver(chemin)).sous;
  const entree = [{ src: source, filename: pathToFileURL(chemin) }];
  const cwd = pathToFileURL(dossier);

  const lecture = await parse(entree, { config: defineConfig({ plugins: [] }, { cwd }) });
  /**
   * Jetons d'une combinaison, et la valeur de chacun telle que le jeton l'écrit, alias compris : la variable CSS n'en
   * dépend que d'elle (un alias s'écrit var() de sa cible, que sa cible change ou non).
   * @param {Record<string, string>} c
   */
  const valeurs = (c) => {
    const set = lecture.resolver.apply(c);
    return { set, css: new Map(Object.values(set).map((t) => [t.id, JSON.stringify(t.originalValue?.$value ?? t.$value)])) };
  };
  const base = valeurs(CLAIR_LARGE);
  /** @param {Record<string, string>} c */
  const change = (c) => [...valeurs(c).css].filter(([id, v]) => base.css.get(id) !== v).map(([id]) => id);

  const motifs = [CLAIR_LARGE, SOMBRE, ETROIT, SOMBRE_ETROIT].flatMap((c) => ecarts(valeurs(c).set, chemin, c));
  if (motifs.length) return { texte: null, motifs };

  const sombre = change(SOMBRE);
  const etroit = change(ETROIT);
  const lesDeux = sombre.filter((id) => etroit.includes(id));
  // Ce que la combinaison change doit être ce que les deux blocs donnent à eux deux, sans recouvrement.
  const combine = change(SOMBRE_ETROIT).filter((id) => !(sombre.includes(id) || etroit.includes(id)));
  const ensemble = [...new Set([...lesDeux, ...combine])].sort();
  if (ensemble.length) return { texte: null, motifs: [`sombre et étroit changent les mêmes jetons : ${ensemble.join(', ')} ; la feuille n'a pas de bloc pour les deux à la fois`] };

  /** @type {any[]} */
  const permutations = [{ input: CLAIR_LARGE, prepare: (/** @type {string} */ c) => `:root {\n  ${c}\n}` }];
  if (sombre.length) permutations.push({ input: SOMBRE, include: sombre, prepare: (/** @type {string} */ c) => `@media (prefers-color-scheme: dark) {\n  :root {\n    ${c}\n  }\n}` });
  if (etroit.length) permutations.push({ input: ETROIT, include: etroit, prepare: (/** @type {string} */ c) => `@media (width < ${seuil}px) {\n  :root {\n    ${c}\n  }\n}` });
  const config = defineConfig(
    { plugins: [css({ filename: FEUILLE, variableName: nomVar, transform, omitTypographyShorthand: true, permutations })] },
    { cwd },
  );
  const { tokens, resolver, sources } = await parse(entree, { config });
  const sortie = (await build(tokens, { resolver, sources, config })).outputFiles.find((f) => f.filename === FEUILLE);
  if (!sortie || typeof sortie.contents !== 'string' || !sortie.contents.startsWith(FILE_PREFIX)) throw new Error(`${chemin} : feuille de Terrazzo sans son en-tête attendu`);
  const entete = `/* Jetons de ${nom}, écrits par npm run css depuis marque.resolver.json (Terrazzo). Ne pas modifier à la main. */`;
  return { texte: entete + sortie.contents.slice(FILE_PREFIX.length), motifs: [] };
}
