// @ts-check
/**
 * Styles de texte de la couche sémantique (groupe typography, composites DTCG),
 * résolus vers font-size.*, font-weight.* et brand.font.*. Tailles lues en px ou en rem (16 px = 1 rem).
 * Interligne sans unité ; ligne = taille × interligne. La valeur en étroit est le style du contexte étroit
 * (largeur.etroit.tokens.json, lu par le resolver) quand il diffère du large ; seuil sur le modificateur largeur.
 * Affichage et titres 1 à 3 portent la consigne commune de hauteur de capitale ($extensions["ds-lab.hauteur-capitale"],
 * alias vers font.heading.cap-height), lue en large et en étroit.
 * Neuf règles (échec, code 1) ; le rapport de chaque style et les primitives sans rôle sont affichés sans seuil.
 */
import { flattenTokens, tokenTypes, primitivesSansRole, resoudreAlias } from './roles.js';
import { fr } from '../lib/format.js';

const REM = 16;
const PAS = 4;
const TOLERANCE = 0.01;
const MIN_PX = 12;
/** Affichage et titres, du plus grand au plus petit. */
const ORDRE = ['display.large', 'display.medium', 'heading.1', 'heading.2', 'heading.3', 'heading.4'];
/** Styles sur brand.font.heading ; le libellé sur la police du produit (D44) ; tous les autres sur brand.font.body. */
export const SUR_POLICE_TITRE = ['display.large', 'display.medium', 'heading.1', 'heading.2', 'heading.3'];
const SUR_POLICE_PRODUIT = ['label'];
/** Alias de police attendu d'un style. @param {string} style */
const policeAttendue = (style) => (SUR_POLICE_TITRE.includes(style) ? '{brand.font.heading}' : SUR_POLICE_PRODUIT.includes(style) ? '{font.product}' : '{brand.font.body}');
/** Clé de la consigne commune de hauteur de capitale, dans $extensions d'un style de titre. */
export const CONSIGNE = 'ds-lab.hauteur-capitale';
/** Interlignes minimaux. */
const INTERLIGNES_MIN = [
  { id: 'corps-1-5', styles: ['body.large', 'body.medium'], min: 1.5 },
  { id: 'petits-1-3', styles: ['body.small', 'label', 'supporting-text'], min: 1.3 },
];

/**
 * @typedef {{ taille: number, interligne: number, ligne: number, hauteurCapitale: number | null }} Mesure
 * @typedef {{ style: string, police: string, graisse: number, large: Mesure, etroit: Mesure | null, sous: number | null, seuil: string, description: string, hauteurCapitale: number | null }} Style
 * @typedef {{ id: string, titre: string, ok: boolean, details: string[] }} Regle
 */

/** Nombres de la typo : 4 décimales au plus. */
const D4 = { decimales: 4 };
/** @param {number} n */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * @typedef {{ semantique: any, sous: number, seuil: string }} Etroite rôles résolus en étroit, seuil de l'étroit
 */

/**
 * @param {any} semantique @param {any} primitives @param {any} marque @param {Etroite} largeurEtroite contexte étroit (obligatoire)
 * @returns {{ styles: Style[], regles: Regle[], fails: Regle[], sansRole: string[] }}
 */
export function typo(semantique, primitives, marque, largeurEtroite) {
  // Sans contexte étroit, les règles en étroit passeraient sans rien contrôler.
  if (!largeurEtroite) throw new Error('contexte étroit absent : les règles en étroit ne peuvent pas être contrôlées');
  const semEtroit = largeurEtroite ? flattenTokens(largeurEtroite.semantique) : null;
  const all = new Map();
  for (const f of [primitives, marque]) for (const [k, v] of flattenTokens(f)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);

  /**
   * Valeur finale d'un champ de style : la chaîne part du jeton du style (`jeton`), « depuis » nomme le champ.
   * @param {any} v @param {string} depuis @param {string} jeton
   */
  const valeur = (v, depuis, jeton) => resoudreAlias(all, v, { depuis, chaine: [jeton] }).valeur;
  /** @param {any} v @param {string} depuis @param {string} jeton */
  const px = (v, depuis, jeton) => {
    const d = valeur(v, depuis, jeton);
    if (d?.unit === 'px' && typeof d.value === 'number') return d.value;
    if (d?.unit === 'rem' && typeof d.value === 'number') return d.value * REM;
    throw new Error(`taille illisible (px ou rem attendu) : ${depuis}`);
  };
  /** @param {any} v @param {string} depuis @param {string} jeton */
  const nombre = (v, depuis, jeton) => {
    const n = valeur(v, depuis, jeton);
    if (typeof n !== 'number') throw new Error(`nombre attendu : ${depuis}`);
    return n;
  };
  /** Consigne de hauteur de capitale d'un jeton, résolue ; null sans consigne. @param {any} tok @param {string} depuis @param {string} jeton */
  const consigne = (tok, depuis, jeton) => {
    const c = tok.$extensions?.[CONSIGNE];
    return c === undefined ? null : nombre(c, `${depuis} (consigne)`, jeton);
  };
  /** @param {number} taille @param {number} interligne @param {number | null} hauteurCapitale @returns {Mesure} */
  const mesure = (taille, interligne, hauteurCapitale) => ({ taille, interligne, ligne: taille * interligne, hauteurCapitale });

  const types = tokenTypes(semantique);
  /** @type {Style[]} */
  const styles = [];
  for (const [path, t] of sem) {
    if (path.endsWith('.$root') || types.get(path) !== 'typography') continue;
    const style = path.replace(/^typography\./, '');
    const v = t.$value;
    const large = mesure(px(v.fontSize, `${style}.fontSize`, path), nombre(v.lineHeight, `${style}.lineHeight`, path), consigne(t, style, path));
    const te = semEtroit?.get(path);
    const x = te && JSON.stringify(te.$value) !== JSON.stringify(v) ? te.$value : null;
    const etroit = x && te ? mesure(px(x.fontSize, `${style} (étroit)`, path), nombre(x.lineHeight, `${style} (étroit)`, path), consigne(te, `${style} (étroit)`, path)) : null;
    const sous = x && largeurEtroite ? largeurEtroite.sous : null;
    styles.push({ style, police: v.fontFamily, graisse: nombre(v.fontWeight, `${style}.fontWeight`, path), large, etroit, sous, seuil: x && largeurEtroite ? largeurEtroite.seuil : '', description: t.$description ?? '', hauteurCapitale: large.hauteurCapitale });
  }
  const byName = new Map(styles.map((s) => [s.style, s]));
  /** @param {string} name */
  const get = (name) => {
    const s = byName.get(name);
    if (!s) throw new Error(`style absent : ${name}`);
    return s;
  };
  /** Variantes d'un style : large, et étroit s'il y en a une. @param {Style} s @returns {[string, Mesure][]} */
  const variantes = (s) => (s.etroit ? [['large', s.large], ['étroit', s.etroit]] : [['large', s.large]]);

  /** @type {Regle[]} */
  const regles = [];
  /** @param {string} id @param {string} titre @param {string[]} details */
  const regle = (id, titre, details) => regles.push({ id, titre, ok: details.length === 0, details });

  regle(
    'multiple-4',
    `taille × interligne multiple de ${PAS} px (tolérance ${fr(TOLERANCE, D4)} px), en large et en étroit`,
    styles.flatMap((s) =>
      variantes(s)
        .filter(([, m]) => Math.abs(m.ligne - Math.round(m.ligne / PAS) * PAS) > TOLERANCE)
        .map(([n, m]) => `${s.style} en ${n} : ${fr(m.taille, D4)} px × ${fr(m.interligne, D4)} = ${fr(r2(m.ligne), D4)} px`),
    ),
  );
  regle(
    'decroissants',
    'affichage et titres strictement décroissants, en large et en étroit',
    ['large', 'étroit'].flatMap((n) => {
      const suite = ORDRE.map((name) => {
        const s = get(name);
        return { name, taille: (n === 'étroit' ? (s.etroit ?? s.large) : s.large).taille };
      });
      return suite.slice(1).flatMap((b, i) => (b.taille < suite[i].taille ? [] : [`en ${n} : ${suite[i].name} ${fr(suite[i].taille, D4)} px, ${b.name} ${fr(b.taille, D4)} px`]));
    }),
  );
  regle(
    'etroit-large',
    'étroit inférieur ou égal au large (taille et ligne)',
    styles
      .filter((s) => s.etroit && (s.etroit.taille > s.large.taille || s.etroit.ligne > s.large.ligne + TOLERANCE))
      .map((s) => {
        const e = /** @type {Mesure} */ (s.etroit);
        return `${s.style} : étroit ${fr(e.taille, D4)} / ${fr(r2(e.ligne), D4)} px, large ${fr(s.large.taille, D4)} / ${fr(r2(s.large.ligne), D4)} px`;
      }),
  );
  for (const g of INTERLIGNES_MIN)
    regle(
      g.id,
      `${g.styles.join(', ')} : interligne au moins ${fr(g.min, D4)}`,
      g.styles.flatMap((name) => variantes(get(name)).filter(([, m]) => m.interligne < g.min).map(([n, m]) => `${name} en ${n} : ${fr(m.interligne, D4)} < ${fr(g.min, D4)}`)),
    );
  regle(
    'corps-1rem',
    `body.medium au moins 1 rem (${REM} px)`,
    variantes(get('body.medium')).filter(([, m]) => m.taille < REM).map(([n, m]) => `body.medium en ${n} : ${fr(m.taille, D4)} px < ${REM} px (1 rem)`),
  );
  regle(
    'min-12',
    `aucune taille sous ${MIN_PX} px, en large et en étroit`,
    styles.flatMap((s) => variantes(s).filter(([, m]) => m.taille < MIN_PX).map(([n, m]) => `${s.style} en ${n} : ${fr(m.taille, D4)} px < ${MIN_PX} px`)),
  );
  regle(
    'police',
    'police par rôle : affichage et titres 1 à 3 sur brand.font.heading, libellé sur font.product, le reste sur brand.font.body',
    styles.flatMap((s) => {
      const attendu = policeAttendue(s.style);
      return s.police === attendu ? [] : [`${s.style} : ${s.police}, attendu ${attendu}`];
    }),
  );

  const valeurs = new Set(styles.flatMap((s) => variantes(s).map(([, m]) => m.hauteurCapitale)).filter((c) => c !== null));
  regle(
    'hauteur-capitale',
    'consigne de hauteur de capitale sur affichage et titres 1 à 3, la même, entre 0 et 1, en large et en étroit ; sur aucun autre style',
    [
      ...styles.flatMap((s) =>
        variantes(s).flatMap(([n, m]) => {
          const titre = SUR_POLICE_TITRE.includes(s.style);
          if (titre && m.hauteurCapitale === null) return [`${s.style} en ${n} : consigne absente`];
          if (!titre && m.hauteurCapitale !== null) return [`${s.style} en ${n} : consigne hors des styles de titre`];
          if (m.hauteurCapitale !== null && !(m.hauteurCapitale > 0 && m.hauteurCapitale < 1)) return [`${s.style} en ${n} : consigne ${fr(m.hauteurCapitale, D4)} hors de ]0, 1[`];
          return [];
        }),
      ),
      ...(valeurs.size > 1 ? [`consignes différentes : ${[...valeurs].map((v) => fr(v, D4)).join(', ')}`] : []),
    ],
  );

  return { styles, regles, fails: regles.filter((g) => !g.ok), sansRole: primitivesSansRole([semantique, largeurEtroite?.semantique ?? {}], [primitives], ['font-size', 'font-weight']) };
}
