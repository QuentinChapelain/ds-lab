// @ts-check
/**
 * Les valeurs de la page du parcours, lues dans les couches communes des jetons, sans aucune marque (D26, D72) : une
 * variable CSS par rôle, nommée d'après son jeton comme dans jetons.css (`--background-app`), en clair et en sombre.
 * La page n'écrit aucune autre valeur : hors de ces blocs, seulement des variables, des mots-clés, 0 et 100 %.
 * La page n'a pas de marque : la police des titres de la marque (`brand.font.heading`) y prend celle du produit, comme
 * `brand.font.body` dans les couches communes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { famille } from '../lib/format.js';
import { flattenTokens, resoudreAlias } from '../tokens/roles.js';
import { COMMUN } from '../tokens/resolver.js';

/** Rôles de couleur de la page ; seuls à changer en sombre. */
const COULEURS = [
  'background.app',
  'background.surface',
  'background.subtle',
  'background.inverse',
  'background.info.subtle',
  'text.default',
  'text.secondary',
  'text.info',
  'text.on-inverse',
  'text.error',
  'border.subtle',
  'border.default',
];
/** Rôles de dimension de la page. */
const DIMENSIONS = [
  'gap.within-component',
  'gap.between-blocks',
  'gap.between-components',
  'gap.between-groups',
  'gap.section',
  'padding.component',
  'width.column',
  'width.page',
  'border-radius.surface',
  'border-radius.control',
  'border-radius.full',
  'border-width.default',
  'border-width.focus',
  'offset.focus',
  'height.control.medium',
  'height.control.small',
  'avatar-size.medium',
  'avatar-size.large',
  'padding.tag',
];
/** Styles de texte de la page. */
const STYLES = ['typography.display.medium', 'typography.heading.1', 'typography.heading.3', 'typography.body.medium', 'typography.body.small', 'typography.label'];

/** Champ d'un style de texte → suffixe de sa variable, comme jetons.css. */
const CHAMPS = /** @type {const} */ ([
  ['fontFamily', 'font-family'],
  ['fontSize', 'font-size'],
  ['fontWeight', 'font-weight'],
  ['letterSpacing', 'letter-spacing'],
  ['lineHeight', 'line-height'],
]);

/** @param {string} chemin */
const variable = (chemin) => `--${chemin.replace(/\./g, '-')}`;

/** @param {any} v */
const texte = (v) =>
  v && typeof v === 'object' && 'hex' in v ? String(v.hex)
  : v && typeof v === 'object' && 'unit' in v ? `${v.value}${v.unit}`
  : Array.isArray(v) ? famille(v)
  : String(v);

/** @param {string[]} fichiers */
function jetons(fichiers) {
  /** @type {Map<string, any>} */
  const m = new Map();
  for (const f of fichiers) flattenTokens(JSON.parse(readFileSync(join(COMMUN, f), 'utf8')), [], m);
  m.set('brand.font.heading', { $value: '{font.product}' });
  return m;
}

/** @param {Map<string, any>} m @param {any} v @param {string} depuis */
const valeur = (m, v, depuis) => texte(resoudreAlias(m, v, { depuis, chaine: [depuis] }).valeur);

/**
 * Les variables de la page : `clair` (toutes) et `sombre` (les couleurs seules).
 * @returns {{ clair: [string, string][], sombre: [string, string][] }}
 */
export function variablesDeLaPage() {
  const base = ['primitives.tokens.json', 'statuts.tokens.json', 'police.tokens.json'];
  const clair = jetons([...base, 'semantique.tokens.json']);
  const sombre = jetons([...base, 'mode.sombre.tokens.json', 'semantique.tokens.json']);
  /** @param {Map<string, any>} m @param {string} r */
  const jeton = (m, r) => {
    const t = m.get(r);
    if (!t) throw new Error(`parcours : rôle ${r} absent des jetons communs`);
    return t;
  };
  /** @type {[string, string][]} */
  const tout = [...COULEURS, ...DIMENSIONS].map((r) => [variable(r), valeur(clair, jeton(clair, r).$value, r)]);
  for (const s of STYLES) {
    const v = resoudreAlias(clair, jeton(clair, s).$value, { depuis: s, chaine: [s] }).valeur;
    for (const [champ, suffixe] of CHAMPS) tout.push([`${variable(s)}-${suffixe}`, valeur(clair, v[champ], `${s}.${champ}`)]);
  }
  return { clair: tout, sombre: COULEURS.map((r) => [variable(r), valeur(sombre, jeton(sombre, r).$value, r)]) };
}
