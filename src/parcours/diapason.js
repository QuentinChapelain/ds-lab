// @ts-check
/**
 * Les composants de Diapason (D101), dans l'ordre de l'écran « Tes composants, à ta marque » : la clé (le nom de la
 * fiche dans `docs/composants/`, de la story de l'atelier, `a-ta-marque--<clé>`, et de la capture), le nom dit, et les types relevés sur le
 * site qu'il remplace. Une seule table : l'écran des composants et la remise (les fiches copiées) la lisent.
 */

/**
 * @typedef {{ cle: string, nom: string, types: string[], phrase: string | null }} Composant
 *   phrase : ce que le composant change, sous la ligne de ce qu'il remplace ; le bouton écrit la sienne (intentions)
 */

/** Les intentions du bouton, celles de sa fiche (`variant`), et leur nom dit à l'écran (CS4) : un composant expose une intention, jamais une couleur. */
export const INTENTIONS = /** @type {const} */ ([
  ['primary', 'principal'],
  ['secondary', 'secondaire'],
  ['ghost', 'discret'],
  ['danger', 'danger'],
]);

/** @type {Composant[]} */
export const COMPOSANTS = [
  { cle: 'button', nom: 'Bouton', types: ['bouton avec texte', 'bouton'], phrase: null },
  { cle: 'text-input', nom: 'Champ de texte', types: ['champ de texte'], phrase: 'Un seul champ, toujours avec son nom au-dessus, une aide et un message d’erreur prévus.' },
  { cle: 'icon-button', nom: 'Bouton à icône', types: ['bouton à icône seule'], phrase: 'Un seul bouton à icône, toujours avec un nom que le lecteur d’écran dit.' },
  { cle: 'tag', nom: 'Étiquette', types: [], phrase: null },
  { cle: 'avatar', nom: 'Avatar', types: [], phrase: null },
  { cle: 'card', nom: 'Carte', types: [], phrase: null },
];

/** Le composant qui remplace un type relevé, ou null. @param {string} type  le nom du type, quelle que soit sa casse */
export const composantDuType = (type) => COMPOSANTS.find((c) => c.types.includes(type.toLowerCase())) ?? null;

/** La capture d'un composant, dans le dossier de la marque. @param {string} cle */
export const captureDe = (cle) => `composants/${cle}.png`;
