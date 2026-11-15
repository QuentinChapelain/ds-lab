// @ts-check
/**
 * Séance 3c, typo : styles de texte de la couche sémantique (groupe typo, composites DTCG typography),
 * résolus vers taille-texte.*, graisse.* et marque.police.*. Tailles lues en px ou en rem (16 px = 1 rem).
 * Interligne sans unité ; ligne = taille × interligne. Étape 4b : la valeur en étroit est le style du contexte étroit
 * (largeur.etroit.tokens.json, lu par le resolver) quand il diffère du large ; seuil sur le modificateur largeur.
 * Étape 4c : affichage et titres 1 à 3 portent la consigne commune de hauteur de capitale ($extensions["ds-lab.hauteur-capitale"],
 * alias vers police.titre.hauteur-capitale), lue en large et en étroit.
 * Neuf règles (échec, code 1) ; le rapport de chaque style et les primitives sans rôle sont affichés sans seuil.
 */
import { flattenTokens, tokenTypes, primitivesSansRole } from './roles.js';

export const REM = 16;
export const PAS = 4;
export const TOLERANCE = 0.01;
export const MIN_PX = 12;
/** Affichage et titres, du plus grand au plus petit. */
export const ORDRE = ['affichage.grand', 'affichage.moyen', 'titre.1', 'titre.2', 'titre.3', 'titre.4'];
/** Styles sur police.titre ; tous les autres sur police.texte. */
export const SUR_POLICE_TITRE = ['affichage.grand', 'affichage.moyen', 'titre.1', 'titre.2', 'titre.3'];
/** Clé de la consigne commune de hauteur de capitale (étape 4c), dans $extensions d'un style de titre. */
export const CONSIGNE = 'ds-lab.hauteur-capitale';
/** Interlignes minimaux. */
export const INTERLIGNES_MIN = [
  { id: 'corps-1-5', styles: ['corps.grand', 'corps.moyen'], min: 1.5 },
  { id: 'petits-1-3', styles: ['corps.petit', 'libelle', 'mention'], min: 1.3 },
];

/**
 * @typedef {{ taille: number, interligne: number, ligne: number, hauteurCapitale: number | null }} Mesure
 * @typedef {{ style: string, police: string, graisse: number, large: Mesure, etroit: Mesure | null, sous: number | null, seuil: string, description: string, hauteurCapitale: number | null }} Style
 * @typedef {{ id: string, titre: string, ok: boolean, details: string[] }} Regle
 */

/** Nombre à la française, 4 décimales au plus. @param {number} n */
export const fr = (n) => String(Math.round(n * 10000) / 10000).replace('.', ',');
/** @param {number} n */
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * @typedef {{ semantique: any, sous: number, seuil: string }} Etroite rôles résolus en étroit, seuil de l'étroit
 */

/**
 * @param {any} semantique @param {any} primitives @param {any} marque @param {Etroite} [largeurEtroite]
 * @returns {{ styles: Style[], regles: Regle[], fails: Regle[], sansRole: string[] }}
 */
export function typo(semantique, primitives, marque, largeurEtroite) {
  const semEtroit = largeurEtroite ? flattenTokens(largeurEtroite.semantique) : null;
  const all = new Map();
  for (const f of [primitives, marque]) for (const [k, v] of flattenTokens(f)) all.set(k, v);
  const sem = flattenTokens(semantique);
  for (const [k, v] of sem) all.set(k, v);

  /** Valeur finale d'une valeur ou d'un alias. @param {any} v @param {string} depuis @param {string[]} [seen] @returns {any} */
  const valeur = (v, depuis, seen = []) => {
    const m = typeof v === 'string' ? /^\{([^}]+)\}$/.exec(v) : null;
    if (!m) return v;
    if (seen.includes(m[1])) throw new Error(`alias en boucle : ${[...seen, m[1]].join(' → ')}`);
    const t = all.get(m[1]);
    if (!t) throw new Error(`alias sans cible : ${v} (depuis ${depuis})`);
    return valeur(t.$value, depuis, [...seen, m[1]]);
  };
  /** @param {any} v @param {string} depuis */
  const px = (v, depuis) => {
    const d = valeur(v, depuis);
    if (d?.unit === 'px' && typeof d.value === 'number') return d.value;
    if (d?.unit === 'rem' && typeof d.value === 'number') return d.value * REM;
    throw new Error(`taille illisible (px ou rem attendu) : ${depuis}`);
  };
  /** @param {any} v @param {string} depuis */
  const nombre = (v, depuis) => {
    const n = valeur(v, depuis);
    if (typeof n !== 'number') throw new Error(`nombre attendu : ${depuis}`);
    return n;
  };
  /** Consigne de hauteur de capitale d'un jeton, résolue ; null sans consigne. @param {any} tok @param {string} depuis */
  const consigne = (tok, depuis) => {
    const c = tok.$extensions?.[CONSIGNE];
    return c === undefined ? null : nombre(c, `${depuis} (consigne)`);
  };
  /** @param {number} taille @param {number} interligne @param {number | null} hauteurCapitale @returns {Mesure} */
  const mesure = (taille, interligne, hauteurCapitale) => ({ taille, interligne, ligne: taille * interligne, hauteurCapitale });

  const types = tokenTypes(semantique);
  /** @type {Style[]} */
  const styles = [];
  for (const [path, t] of sem) {
    if (path.endsWith('.$root') || types.get(path) !== 'typography') continue;
    const style = path.replace(/^typo\./, '');
    const v = t.$value;
    const large = mesure(px(v.fontSize, `${style}.fontSize`), nombre(v.lineHeight, `${style}.lineHeight`), consigne(t, style));
    const te = semEtroit?.get(path);
    const x = te && JSON.stringify(te.$value) !== JSON.stringify(v) ? te.$value : null;
    const etroit = x && te ? mesure(px(x.fontSize, `${style} (étroit)`), nombre(x.lineHeight, `${style} (étroit)`), consigne(te, `${style} (étroit)`)) : null;
    const sous = x && largeurEtroite ? largeurEtroite.sous : null;
    styles.push({ style, police: v.fontFamily, graisse: nombre(v.fontWeight, `${style}.fontWeight`), large, etroit, sous, seuil: x && largeurEtroite ? largeurEtroite.seuil : '', description: t.$description ?? '', hauteurCapitale: large.hauteurCapitale });
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
    `taille × interligne multiple de ${PAS} px (tolérance ${fr(TOLERANCE)} px), en large et en étroit`,
    styles.flatMap((s) =>
      variantes(s)
        .filter(([, m]) => Math.abs(m.ligne - Math.round(m.ligne / PAS) * PAS) > TOLERANCE)
        .map(([n, m]) => `${s.style} en ${n} : ${fr(m.taille)} px × ${fr(m.interligne)} = ${fr(r2(m.ligne))} px`),
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
      return suite.slice(1).flatMap((b, i) => (b.taille < suite[i].taille ? [] : [`en ${n} : ${suite[i].name} ${fr(suite[i].taille)} px, ${b.name} ${fr(b.taille)} px`]));
    }),
  );
  regle(
    'etroit-large',
    'étroit inférieur ou égal au large (taille et ligne)',
    styles
      .filter((s) => s.etroit && (s.etroit.taille > s.large.taille || s.etroit.ligne > s.large.ligne + TOLERANCE))
      .map((s) => {
        const e = /** @type {Mesure} */ (s.etroit);
        return `${s.style} : étroit ${fr(e.taille)} / ${fr(r2(e.ligne))} px, large ${fr(s.large.taille)} / ${fr(r2(s.large.ligne))} px`;
      }),
  );
  for (const g of INTERLIGNES_MIN)
    regle(
      g.id,
      `${g.styles.join(', ')} : interligne au moins ${fr(g.min)}`,
      g.styles.flatMap((name) => variantes(get(name)).filter(([, m]) => m.interligne < g.min).map(([n, m]) => `${name} en ${n} : ${fr(m.interligne)} < ${fr(g.min)}`)),
    );
  regle(
    'corps-1rem',
    `corps.moyen au moins 1 rem (${REM} px)`,
    variantes(get('corps.moyen')).filter(([, m]) => m.taille < REM).map(([n, m]) => `corps.moyen en ${n} : ${fr(m.taille)} px < ${REM} px (1 rem)`),
  );
  regle(
    'min-12',
    `aucune taille sous ${MIN_PX} px, en large et en étroit`,
    styles.flatMap((s) => variantes(s).filter(([, m]) => m.taille < MIN_PX).map(([n, m]) => `${s.style} en ${n} : ${fr(m.taille)} px < ${MIN_PX} px`)),
  );
  regle(
    'police',
    'police par rôle : affichage et titres 1 à 3 sur police.titre, le reste sur police.texte',
    styles.flatMap((s) => {
      const attendu = SUR_POLICE_TITRE.includes(s.style) ? '{marque.police.titre}' : '{marque.police.texte}';
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
          if (m.hauteurCapitale !== null && !(m.hauteurCapitale > 0 && m.hauteurCapitale < 1)) return [`${s.style} en ${n} : consigne ${fr(m.hauteurCapitale)} hors de ]0, 1[`];
          return [];
        }),
      ),
      ...(valeurs.size > 1 ? [`consignes différentes : ${[...valeurs].map(fr).join(', ')}`] : []),
    ],
  );

  return { styles, regles, fails: regles.filter((g) => !g.ok), sansRole: primitivesSansRole([semantique, largeurEtroite?.semantique ?? {}], [primitives], ['taille-texte', 'graisse']) };
}
