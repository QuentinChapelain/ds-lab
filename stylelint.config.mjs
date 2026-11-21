// Garde du style des composants et des modules (CP3, D65) : `npm run style`. Chaque valeur visuelle vient d'une
// variable de la table du thème (var(--v-ds-…)) ou d'une couleur du thème (rgb(var(--v-theme-…))) ; 0, 100 % et les
// mots-clés passent. Une exception s'écrit sur place, avec sa règle et sa raison :
// /* stylelint-disable-next-line declaration-property-value-allowed-list -- <raison> */.
// Hors de CP3, non jugés : opacity, transform, clip-path, aspect-ratio, et le gabarit (:style).

/** Ce que dit un échec : quoi faire. @param {string} propriete @param {string} valeur */
const message = (propriete, valeur) =>
  `Valeur brute « ${valeur} » pour ${propriete} : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).`;

const COULEUR = 'Couleur écrite en dur : prendre rgb(var(--v-theme-…)) ou rgb(var(--v-ds-…)) ; sinon une exception avec sa raison (CP3).';

const VARIABLE = String.raw`var\(--v-(?:ds|theme)-[\w-]+\)`;
/** Un terme admis : variable, couleur du thème, calcul de variables et de nombres sans unité, zéro (avec ou sans unité), 100 %, mot-clé. */
const TERME = String.raw`(?:${VARIABLE}|rgb\(${VARIABLE}\)|calc\((?:\s|${VARIABLE}|-?\d+(?:\.\d+)?|[-+*/()])*\)|-?0(?:px|r?em|%)?|100%|[a-z]+(?:-[a-z]+)*)`;
const ADMIS = new RegExp(String.raw`^${TERME}(?:\s*,?\s+${TERME})*$`);

/** Propriétés de CP3 : couleur, taille, espace, rayon, ombre, police, graisse, interligne, durée ; et les variables. */
const JUGEES =
  /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-(width|color|radius|style))?|border-(top|bottom)-(left|right)-radius|outline(-(width|color|offset))?|(min-|max-)?(width|height|block-size|inline-size)|padding(-.+)?|margin(-.+)?|(row-|column-)?gap|inset(-.+)?|top|right|bottom|left|font(-size|-weight)?|line-height|letter-spacing|box-shadow|text-shadow|transition(-duration|-delay)?|animation(-duration|-delay)?|--.+)$/;

export default {
  customSyntax: 'postcss-html',
  reportDescriptionlessDisables: true,
  reportNeedlessDisables: true,
  reportUnscopedDisables: true,
  rules: {
    'declaration-property-value-allowed-list': [{ [String(JUGEES)]: [ADMIS], 'font-family': [new RegExp(`^${VARIABLE}$`), 'inherit'] }, { message }],
    'color-no-hex': [true, { message: COULEUR }],
    'color-named': ['never', { message: COULEUR }],
    'font-weight-notation': ['numeric', { message: 'Graisse en mot : prendre var(--v-ds-…-font-weight) ; sinon une exception avec sa raison (CP3).' }],
    'function-disallowed-list': [['rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color', 'color-mix'], { message: COULEUR }],
  },
};
