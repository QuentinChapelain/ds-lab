// @ts-check
/**
 * Étape 4a, lot 5 : ajouts aux rôles et aux paires d'Orbe Café, partagés par les tests qui figent l'étape 3
 * (les 42 rôles, 48 paires et 4 interdites d'avant restent en tête et inchangés). Attendus : test/aplats.test.js.
 */

/** Rôle ajouté → [emplacement de la couche marque, hex chez Orbe Café]. */
export const AJOUTS = {
  'fond.marque.discret': ['marque.primaire.3', '#f1f3f7'],
  'fond.accent.discret': ['marque.accent.3', '#fcf1ef'],
  'fond.marque.fort': ['marque.primaire.plein', '#2b4c7e'],
  'texte.sur-marque': ['marque.primaire.sur-plein', '#ffffff'],
  'texte.marque.grand': ['marque.primaire.texte-grand', '#2b4c7e'],
  'fond.interactif.inverse': ['marque.primaire.sur-plein', '#ffffff'],
  'texte.sur-interactif.inverse': ['marque.primaire.plein', '#2b4c7e'],
  'texte.sur-interactif.inverse.survol': ['marque.primaire.plein-survol', '#3c5a88'],
  'bordure.focus.inverse': ['marque.primaire.sur-plein', '#ffffff'],
};

/** Paires ajoutées, dans l'ordre de paires.json. */
const AP = ['fond.marque.discret', 'fond.accent.discret'];
export const PAIRES_AJOUTEES = [
  ...AP.flatMap((f) => [
    ['texte.principal', f, 'texte'],
    ['texte.secondaire', f, 'texte'],
    ['texte.interactif', f, 'texte'],
    ['texte.marque.grand', f, 'grand-texte'],
    ['bordure.focus', f, 'focus'],
  ]),
  ['texte.accent', 'fond.accent.discret', 'texte'],
  ['texte.marque.grand', 'fond.app', 'grand-texte'],
  ['texte.marque.grand', 'fond.surface', 'grand-texte'],
  ['texte.marque.grand', 'fond.discret', 'grand-texte'],
  ['texte.sur-marque', 'fond.marque.fort', 'texte'],
  ['texte.sur-interactif.inverse', 'fond.interactif.inverse', 'texte'],
  ['texte.sur-interactif.inverse.survol', 'fond.interactif.inverse', 'texte'],
  ['bordure.focus.inverse', 'fond.marque.fort', 'focus'],
];
export const INTERDITES_AJOUTEES = ['texte.marque.grand', 'texte.interactif', 'fond.interactif.fort', 'bordure.focus'];
