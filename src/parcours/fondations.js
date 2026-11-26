// @ts-check
/**
 * Les fondations d'une marque saisie (D83), lues dans ses jetons écrits : ce que l'écran des fondations montre. Chaque
 * chiffre est calculé pour cette marque, jamais recopié d'une marque d'exemple : les douze pas de ses deux couleurs ;
 * les espacements, tailles de texte et arrondis de son resolver ; le compte de ses rôles ; ses cinq relations d'espace ;
 * ses paires de rôles jugées dans chaque contexte de son resolver, comme `npm run contraste`. Une preuve qui n'est pas
 * vraie pour cette marque n'est pas rendue. Seul compte de l'outil, pas de la marque : les règles et les défauts de
 * `docs/regles.md`.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenTokens, loadRoles, contratRoles, resoudreAlias } from '../tokens/roles.js';
import { lireResolver, RESOLVER } from '../tokens/resolver.js';

const REGLES = new URL('../../docs/regles.md', import.meta.url);

/** Les cinq relations d'espace, de la plus proche à la plus lointaine. */
const RELATIONS = /** @type {const} */ ([
  ['within-component', 'Dans un composant'],
  ['between-blocks', 'Entre deux blocs d’un composant'],
  ['between-components', 'Entre deux composants'],
  ['between-groups', 'Entre deux groupes'],
  ['section', 'Entre deux sections'],
]);

/** Les trois planches de la marque, écrites par la saisie. */
const PLANCHES = /** @type {const} */ ([
  ['roles.html', 'La planche des rôles'],
  ['espacements.html', 'des espacements'],
  ['typo.html', 'des textes'],
]);

/**
 * @typedef {{ fichier: string, nom: string }} Planche
 * @typedef {{ titre: string, texte: string }} Preuve
 * @typedef {{
 *   primaire: string[], accent: string[] | null,
 *   espacements: number[], tailles: number[], rayons: { nom: string, px: number }[],
 *   roles: { fonds: number, textes: number, bordures: number, styles: number, ecarts: number },
 *   relations: { nom: string, px: number }[],
 *   paires: { controlees: number, echec: number, interdites: number, contextes: number },
 *   regles: number, planches: Planche[], preuves: Preuve[], limites: string[]
 * }} Fondations
 */

/** Une dimension DTCG en px, ou null. @param {any} v */
const enPx = (v) => (v && typeof v === 'object' && v.unit === 'px' && typeof v.value === 'number' ? v.value : null);

/** Les clés numériques d'un groupe, dans l'ordre des valeurs. @param {any} g */
const pasDe = (g) => Object.keys(g ?? {}).filter((k) => !k.startsWith('$'));

/** Le nombre de règles et de défauts de l'outil : les lignes DS, NM, CP, DOC et DF, hors consignes. */
function compterRegles() {
  const texte = readFileSync(REGLES, 'utf8');
  const avant = texte.split(/^## Consignes/m)[0];
  return avant.split('\n').filter((l) => /^\| (DS|NM|CP|DOC|DF)\d+ \|/.test(l)).length;
}

/**
 * @param {string} dossier  le dossier de la marque saisie (son resolver, ses planches, sa feuille CSS)
 * @returns {Fondations}
 */
export function fondationsDe(dossier) {
  const resolver = lireResolver(join(dossier, RESOLVER));
  const { jetons } = resolver;
  const m = flattenTokens(jetons);
  /** @param {string} p */
  const compte = (p) => [...m.keys()].filter((k) => k.startsWith(`${p}.`) && !k.endsWith('.$root')).length;
  /** @param {string} chemin */
  const px = (chemin) => enPx(resoudreAlias(m, m.get(chemin)?.$value, { depuis: chemin, chaine: [chemin] }).valeur);
  /** @param {string} n @returns {string[] | null} */
  const echelle = (n) => {
    const g = jetons.color?.[n];
    return g?.['12'] ? Array.from({ length: 12 }, (_, i) => String(g[String(i + 1)].$value.hex)) : null;
  };
  const primaire = echelle('primary');
  if (!primaire) throw new Error(`fondations : pas d’échelle primaire dans ${dossier}`);
  /** @param {string} g */
  const valeurs = (g) => pasDe(jetons[g]).map((k) => /** @type {number} */ (enPx(jetons[g][k].$value))).filter((x) => x !== null);

  // Les paires, dans chaque contexte du resolver : le même jugement que npm run contraste.
  const mod = resolver.modifiers ?? {};
  const modes = Object.keys(mod.mode?.contexts ?? { light: [] });
  const largeurs = Object.keys(mod.width?.contexts ?? { wide: [] });
  const jugements = modes.flatMap((mode) => largeurs.map((largeur) => contratRoles(loadRoles(dossier, { mode, largeur }))));
  const [premier] = jugements;
  const echec = Math.max(...jugements.map((j) => j.fails.length));
  const paires = { controlees: premier.pairs.length, echec, interdites: premier.interdites.length, contextes: jugements.length };

  const regles = compterRegles();
  const planches = PLANCHES.filter(([f]) => existsSync(join(dossier, f))).map(([fichier, nom]) => ({ fichier, nom }));
  const code = existsSync(join(dossier, 'jetons.css')) && existsSync(join(dossier, 'vuetify.json'));
  const quatre = modes.includes('dark') && largeurs.includes('narrow');

  /** @type {Preuve[]} */
  const preuves = [
    { titre: 'Format standard', texte: 'Jetons au format DTCG 2025.10, lisibles par les outils du marché.' },
    { titre: 'Trois couches', texte: 'Valeurs, marque, rôles. Changer de marque ne touche qu’une couche.' },
    ...(echec === 0
      ? [{ titre: 'Accessibilité', texte: `${paires.controlees} paires contrôlées aux seuils WCAG 2.1 AA.` }]
      : []),
    ...(quatre && echec === 0 ? [{ titre: 'Quatre contextes', texte: 'Clair et sombre, large et étroit : mêmes rôles, mêmes contrôles.' }] : []),
    ...(code ? [{ titre: 'Prêt pour le code', texte: 'Une feuille de variables CSS et un thème Vuetify par marque.' }] : []),
    { titre: 'Règles sourcées', texte: 'Chaque règle dit sa raison, la source de son seuil et son contrôle.' },
  ];
  return {
    primaire,
    accent: echelle('accent'),
    espacements: valeurs('space'),
    tailles: valeurs('font-size'),
    rayons: pasDe(jetons.radius).map((k) => ({ nom: k, px: /** @type {number} */ (enPx(jetons.radius[k].$value)) })),
    roles: { fonds: compte('background'), textes: compte('text'), bordures: compte('border'), styles: compte('typography'), ecarts: compte('gap') },
    relations: RELATIONS.map(([k, nom]) => ({ nom, px: /** @type {number} */ (px(`gap.${k}`)) })),
    paires,
    regles,
    planches,
    preuves,
    limites: [
      'pas encore de tokens d’ombre ni de superposition',
      'deux couleurs de marque : une troisième couleur de ton site va sur l’échelle de la palette qui a sa teinte (red, green), sinon aux gris',
      'une seule sortie, le web',
      'aucun test avec un vrai lecteur d’écran',
    ],
  };
}
