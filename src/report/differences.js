// @ts-check
/**
 * Textes fixes du rapport : écarts de méthode avec l'outil v1 et limites connues.
 * Description générique de la méthode, sans motif ni nom de plateforme.
 * Étiquettes : [F] mesuré ou lu dans le code, [H] hypothèse, [V] à vérifier.
 */

/**
 * @typedef {{ n: number, point: string, v1: string, outil: string, effet: string, tag: string }} Difference
 */

/** @type {Difference[]} */
export const V1_DIFFERENCES = [
  {
    n: 1,
    point: 'Raccourcis',
    v1: 'lus via le CSSOM, qui les développe en longhands (border: 2px solid X → X ×4 ; font fournit un font-size)',
    outil: 'texte lu tel qu’écrit, sans développement (D2)',
    effet: 'moins d’occurrences de couleurs de bordure au déclaré',
    tag: '[F]',
  },
  {
    n: 2,
    point: 'Propriétés retenues pour les couleurs',
    v1: 'noms contenant color, background, border, outline, shadow, fill, stroke, caret ou decoration',
    outil: 'toutes les déclarations, propriétés personnalisées comprises (D7)',
    effet: 'les --variables de couleur manquent en v1, sauf si leur nom contient l’un de ces mots',
    tag: '[F]',
  },
  {
    n: 3,
    point: 'Écritures de couleur',
    v1: 'hexadécimal, rgb()/rgba() et 8 noms seulement',
    outil: 'toutes (culori)',
    effet: 'oklch(), lab(), color() et les autres noms ignorés en v1 ; Chromium réécrit peut-être hex et hsl en rgb() dans le CSSOM',
    tag: '[F] / [V]',
  },
  {
    n: 4,
    point: 'Alpha et canaux en pourcentage',
    v1: 'parseFloat("50%") donne 50 : rgb(… / 50%) est compté opaque, les canaux en % sont faux (bug)',
    outil: 'lecture correcte',
    effet: 'effet sur les chiffres de l’étape 1 à mesurer',
    tag: '[F]',
  },
  {
    n: 5,
    point: 'Feuilles chargées par @import',
    v1: 'absentes de document.styleSheets, donc ignorées',
    outil: 'lues',
    effet: 'plus de déclaré',
    tag: '[F]',
  },
  {
    n: 6,
    point: 'Feuilles construites (adoptedStyleSheets)',
    v1: 'ignorées',
    outil: 'lues, source « injecté »',
    effet: 'plus de déclaré',
    tag: '[F]',
  },
  {
    n: 7,
    point: 'Feuilles d’un autre domaine',
    v1: 'ignorées (CORS)',
    outil: 'lues par le protocole DevTools',
    effet: 'plus de déclaré',
    tag: '[F]',
  },
  {
    n: 8,
    point: 'Périmètre du déclaré',
    v1: 'page courante seulement',
    outil: 'toutes les pages, feuilles dédoublonnées',
    effet: 'plus de déclaré si les pages chargent des feuilles différentes',
    tag: '[F]',
  },
  {
    n: 9,
    point: 'Déclarations doublées ou invalides',
    v1: 'le CSSOM garde la dernière déclaration valide de chaque propriété d’une règle',
    outil: 'le texte garde toutes les déclarations (replis, hacks, invalides)',
    effet: 'plus de déclaré',
    tag: '[F]',
  },
  {
    n: 10,
    point: 'Unités absolues',
    v1: 'pc, in, cm, mm et Q gardés bruts',
    outil: 'convertis en px',
    effet: 'moins de valeurs non normalisables',
    tag: '[F]',
  },
  {
    n: 11,
    point: 'Pages rendues',
    v1: 'la page courante est toujours scannée, même si elle figure aussi dans la liste (comptée deux fois)',
    outil: 'exactement les adresses données',
    effet: 'pas de doublon',
    tag: '[F]',
  },
  {
    n: 12,
    point: 'Fenêtre et attente',
    v1: 'page courante à la taille de la fenêtre, iframes à 1366×900, 2,5 s après onload',
    outil: 'fenêtre fixe pour toutes les pages ; load, puis networkidle (10 s max), puis délai',
    effet: 'une autre @media peut s’appliquer à la page courante en v1',
    tag: '[F]',
  },
  {
    n: 13,
    point: 'Shadow DOM et pseudo-éléments',
    v1: 'ignorés',
    outil: 'shadow roots ouverts parcourus ; ::before et ::after inclus',
    effet: 'plus de rendu',
    tag: '[F]',
  },
  {
    n: 14,
    point: 'Couleurs rendues modernes',
    v1: 'une couleur calculée en oklch() ou color() est ignorée',
    outil: 'comptée',
    effet: 'plus de couleurs rendues',
    tag: '[F] / [V]',
  },
  {
    n: 15,
    point: 'Taille de police rendue',
    v1: 'Math.round au pixel',
    outil: 'valeur exacte, plus une clé v1 (Math.round)',
    effet: 'comparable grâce à la clé v1',
    tag: '[F]',
  },
  {
    n: 16,
    point: 'Hexadécimal à alpha nul',
    v1: '#0000 ou #00000000 compté comme couleur (seul rgba(…, 0) est écarté)',
    outil: 'exclu, comme transparent (D7)',
    effet: 'une couleur distincte de plus en v1 par écriture de ce type',
    tag: '[F]',
  },
  {
    n: 17,
    point: 'Mots-clés globaux',
    v1: 'inherit, initial… comptés comme tailles de police déclarées',
    outil: 'exclus de toutes les familles (D4)',
    effet: 'moins de tailles distinctes',
    tag: '[F]',
  },
  {
    n: 18,
    point: '<style> ajoutés par JavaScript',
    v1: 'sans adresse, donc étiquetés inline',
    outil: 'étiquetés injecté ; seuls les <style> du HTML d’origine sont inline',
    effet: 'aucun sur les comptes, seulement sur la répartition par source',
    tag: '[F]',
  },
  {
    n: 19,
    point: 'Écriture des valeurs non normalisables',
    v1: 'sérialisée par le CSSOM (.5em → 0.5em, décimales arrondies)',
    outil: 'gardée telle qu’écrite',
    effet: 'clés différentes pour une même valeur ; comptes inchangés',
    tag: '[F]',
  },
];

export const V1_SAME =
  'Identiques à la v1 [F] : seuils ΔE stricts à 2 et 5 en OKLab × 100, regroupement glouton par fréquence, couleurs opaques seules dans les groupes, arrondi au centième des tailles déclarées, rootPx mesuré, règle de visibilité, porteur de texte, couleur de bordure du premier côté.';

/**
 * Limites connues, toujours rappelées dans le rapport.
 * @type {{ text: string, tag: string }[]}
 */
export const LIMITS = [
  { text: 'Les iframes sont comptées par page mais ni leurs feuilles ni leur rendu ne sont parcourus.', tag: '[F]' },
  { text: 'Le déclaré convertit les rem avec la rootPx de la première page.', tag: '[F]' },
  { text: 'Les déclarations invalides sont comptées au déclaré, puisque le texte des feuilles est lu tel quel.', tag: '[F]' },
  { text: 'Contraste : l’opacity n’entre pas dans le calcul ; les paires concernées (élément ou ancêtre à opacity < 1) sont marquées [V].', tag: '[F]' },
  { text: 'Contraste : une background-image (image ou dégradé) plus proche que le fond opaque n’est pas composée ; paire marquée [V].', tag: '[F]' },
  { text: 'Les éléments placés dans un <slot> remontent leurs ancêtres par le DOM et non par l’arbre affiché (fond effectif, héritage).', tag: '[F]' },
  { text: 'Les pseudo-éléments ne sont pas tracés par --trace-rendered.', tag: '[F]' },
  { text: 'Les shadow roots fermés ne sont pas parcourus.', tag: '[F]' },
  { text: 'Seuils ΔE à 2 et 5 en OKLab × 100 : repris de la v1, non validés perceptivement sur ces marques.', tag: '[H]' },
];

export const STORAGE_STATE_LIMIT = {
  text: 'La session (--storage-state) ne conserve pas sessionStorage : une page qui en dépend peut s’afficher comme déconnectée.',
  tag: '[F]',
};
