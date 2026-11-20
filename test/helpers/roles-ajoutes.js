// @ts-check
/**
 * Ajouts aux rôles et aux paires d'Orbe Café, partagés par les tests qui figent les rôles d'origine
 * (les 42 rôles, 48 paires et 4 interdites d'avant restent en tête et inchangés). Attendus : test/aplats.test.js.
 */

/** Rôle ajouté → [emplacement de la couche marque, hex chez Orbe Café]. */
export const AJOUTS = {
  'fond.marque.discret': ['marque.primaire.3', '#f1f3f7'],
  'fond.accent.discret': ['marque.accent.3', '#fcf1ef'],
  // L'aplat plein passe par trois emplacements communs (tokens/commun/aplat.tokens.json), alias du plein.
  'fond.marque.fort': ['marque.primaire.aplat', '#2b4c7e'],
  'texte.sur-marque': ['marque.primaire.sur-aplat', '#ffffff'],
  'texte.marque.grand': ['marque.primaire.texte-grand', '#2b4c7e'],
  'fond.interactif.inverse': ['marque.primaire.sur-aplat', '#ffffff'],
  'texte.sur-interactif.inverse': ['marque.primaire.aplat', '#2b4c7e'],
  // Survol du plein en clair (D45) : clarté OKLCH du bleu 9 − 0,05.
  'texte.sur-interactif.inverse.survol': ['marque.primaire.aplat-survol', '#1e3e6f'],
  'bordure.focus.inverse': ['marque.primaire.sur-aplat', '#ffffff'],
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

/**
 * Rôles de couleur du bouton → [cible de l'alias, hex chez Orbe Café en clair], écrits à la main dans
 * docs/attendus/bouton.md (culori, résolveur indépendant de src/). Ajoutés après les 51 rôles ci-dessus.
 */
export const AJOUTS_BOUTON = {
  // Survol du plein d'erreur (D45, docs/attendus/finitions-bouton.md) : clarté OKLCH de l'erreur 11 − 0,05.
  'fond.erreur.fort.survol': ['marque.erreur.plein-survol', '#b9001a'],
  'fond.desactive': ['couleur.neutre.3', '#f3f2f1'],
  'texte.desactive': ['couleur.neutre.9', '#8a8478'],
};

/** Paires du bouton, en fin de paires.json, après les 70 d'avant ; les deux du désactivé portent une exception écrite. */
export const PAIRES_BOUTON = [
  ['texte.sur-erreur', 'fond.erreur.fort.survol', 'texte'],
  ['texte.desactive', 'fond.desactive', 'texte'],
  ['texte.desactive', 'fond.app', 'texte'],
];
/** Paires du bouton sous leur seuil, avec exception écrite (composant inactif, WCAG 1.4.3). */
export const EXCEPTIONS_BOUTON = ['texte.desactive sur fond.desactive', 'texte.desactive sur fond.app'];

/**
 * Rôles de couleur de DsAvatar et DsTag → [cible de l'alias, hex chez Orbe Café en clair], écrits à la main dans
 * docs/attendus/avatar-etiquette.md, puis les deux fonds teintés dans docs/attendus/carte-membre-liste.md (culori,
 * résolveur indépendant de src/). Ajoutés après ceux du bouton.
 */
export const AJOUTS_AVATAR = {
  'texte.marque': ['marque.primaire.12', '#103060'],
  'fond.teinte': ['couleur.teinte', '#f3f2f1'],
  'fond.marque.teinte': ['marque.primaire.teinte', '#f1f3f7'],
};

/** Paires de DsAvatar et DsTag, en fin de paires.json, après celles du bouton : texte.marque sur fond.marque.discret, puis les fonds teintés. */
export const PAIRES_AVATAR = [
  ['texte.marque', 'fond.marque.discret', 'texte'],
  ['texte.principal', 'fond.teinte', 'texte'],
  ['texte.marque', 'fond.marque.teinte', 'texte'],
];

/** Rôles de couleur et paires de chaque marque, ajouts compris. */
export const N_ROLES = 42 + Object.keys(AJOUTS).length + Object.keys(AJOUTS_BOUTON).length + Object.keys(AJOUTS_AVATAR).length;
export const N_PAIRES = 70 + PAIRES_BOUTON.length + PAIRES_AVATAR.length;
