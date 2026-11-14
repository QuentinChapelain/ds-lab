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
  {
    n: 20,
    point: 'Couleurs rendues',
    v1: 'color, background-color et la bordure du premier côté visible',
    outil: 'en plus : une occurrence par couleur de bordure distincte, contour, ombres, soulignement, dégradés, fill et stroke des formes SVG (R5 bis, R6 bis)',
    effet: 'plus de couleurs rendues ; le rapport déclaré / rendu compare enfin des propriétés proches',
    tag: '[F]',
  },
  {
    n: 21,
    point: 'Texte des champs',
    v1: 'un champ sans nœud texte n’est pas porteur de texte',
    outil: 'valeur d’un input, d’un textarea ou d’un select, et ::placeholder d’un champ vide (R3 bis)',
    effet: 'plus de couleurs de texte, de tailles et de paires de contraste',
    tag: '[F]',
  },
  {
    n: 22,
    point: 'États et regroupement',
    v1: 'état de repos seulement ; regroupement glouton par fréquence',
    outil: 'hover, focus et active forcés sur un échantillon, rapportés à part (R15) ; regroupement à liaison complète en plus du glouton',
    effet: 'aucun sur les familles ; le glouton reste la base de comparaison avec la v1',
    tag: '[F]',
  },
  {
    n: 23,
    point: 'Éléments écartés du rendu',
    v1: 'tout élément qui a un rectangle et que visibility ne masque pas',
    outil: 'en moins : les éléments à opacity 0 ou sous un ancêtre à opacity 0 (R1 bis), et les composants tiers désignés dans le fichier de sources (R17)',
    effet: 'moins d’éléments et de couleurs rendus ; le nombre d’éléments ne se compare plus à celui de la v1',
    tag: '[F]',
  },
];

export const V1_SAME =
  'Identiques à la v1 [F] : seuils ΔE stricts à 2 et 5 en OKLab × 100, regroupement glouton par fréquence (groupsDE2, groupsDE5), couleurs opaques seules dans les groupes, arrondi au centième des tailles déclarées, rootPx mesuré.';

/**
 * Limites connues, toujours rappelées dans le rapport.
 * @type {{ text: string, tag: string }[]}
 */
export const LIMITS = [
  {
    text: 'Le rendu est celui d’une seule fenêtre (option --viewport) : la mise en page mobile demande un second audit. Les contenus qui n’existent qu’après une action (menu ouvert, modale, notification, message d’erreur) ne sont pas mesurés.',
    tag: '[F]',
  },
  {
    text: 'États : hover, focus et active sont forcés sur un élément par couple (rôle, sélecteur court), 60 au plus par page, et lus sur l’élément et ses pseudo-éléments ::before et ::after (pas sur ses enfants). Les états d’erreur, de sélection et de désactivation ne peuvent pas être forcés.',
    tag: '[F]',
  },
  {
    text: 'Un élément est « rendu » s’il a un rectangle, n’est pas en visibility: hidden et n’est pas à opacity 0 : un élément hors écran ou masqué par clip est encore compté.',
    tag: '[F]',
  },
  {
    text: 'Contraste : un texte dont le centre tombe sur une image ou sur un élément positionné hors de sa lignée est marqué [V] (overlap) ; son ratio n’est pas corrigé et l’ordre d’empilement n’est pas calculé.',
    tag: '[F]',
  },
  {
    text: 'Le déclaré compte tout jeton couleur de toute déclaration ; le rendu compte les couleurs de texte, de fond, de bordure, de contour, d’ombre, de soulignement, de dégradé et de SVG. Les images, les polices d’icônes en couleur et les canvas échappent aux deux.',
    tag: '[F]',
  },
  {
    text: 'Contraste : seules les icônes en police d’icônes (pseudo-élément en zone à usage privé) sont jugées à 3:1 ; une icône SVG ou image n’est pas mesurée.',
    tag: '[F]',
  },
  {
    text: 'Interface ou contenu : une couleur est classée « contenu » si elle vient d’un SVG qui ne suit pas la couleur du texte, ou du fond d’une boîte d’image. Une image de fond, un avatar coloré en CSS ou un composant de graphique en HTML ne sont pas reconnus.',
    tag: '[H]',
  },
  { text: 'Seuil de chroma des gris de texte (0,02) : choisi sur une seule plateforme.', tag: '[H]' },
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
