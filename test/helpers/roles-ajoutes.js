// @ts-check
/**
 * Ajouts aux rôles et aux paires d'Orbe Café, partagés par les tests qui figent les rôles d'origine
 * (les 42 rôles, 48 paires et 4 interdites d'avant restent en tête et inchangés). Attendus : test/aplats.test.js.
 */

/** Rôle ajouté → [emplacement de la couche marque, hex chez Orbe Café]. */
export const AJOUTS = {
  'background.brand.subtle': ['brand.primary.3', '#f1f3f7'],
  'background.accent.subtle': ['brand.accent.3', '#fcf1ef'],
  // L'aplat plein passe par trois emplacements communs (tokens/commun/aplat.tokens.json), alias du plein.
  'background.brand.strong': ['brand.primary.feature', '#2b4c7e'],
  'text.on-brand': ['brand.primary.on-feature', '#ffffff'],
  'text.brand.large': ['brand.primary.text-large', '#2b4c7e'],
  'background.interactive.inverse': ['brand.primary.on-feature', '#ffffff'],
  'text.on-interactive.inverse': ['brand.primary.feature', '#2b4c7e'],
  // Survol du plein en clair (D45) : clarté OKLCH du bleu 9 − 0,05.
  'text.on-interactive.inverse.hover': ['brand.primary.feature-hover', '#1e3e6f'],
  'border.focus.inverse': ['brand.primary.on-feature', '#ffffff'],
};

/** Paires ajoutées, dans l'ordre de paires.json. */
const AP = ['background.brand.subtle', 'background.accent.subtle'];
export const PAIRES_AJOUTEES = [
  ...AP.flatMap((f) => [
    ['text.default', f, 'text'],
    ['text.secondary', f, 'text'],
    ['text.interactive', f, 'text'],
    ['text.brand.large', f, 'large-text'],
    ['border.focus', f, 'focus'],
  ]),
  ['text.accent', 'background.accent.subtle', 'text'],
  ['text.brand.large', 'background.app', 'large-text'],
  ['text.brand.large', 'background.surface', 'large-text'],
  ['text.brand.large', 'background.subtle', 'large-text'],
  ['text.on-brand', 'background.brand.strong', 'text'],
  ['text.on-interactive.inverse', 'background.interactive.inverse', 'text'],
  ['text.on-interactive.inverse.hover', 'background.interactive.inverse', 'text'],
  ['border.focus.inverse', 'background.brand.strong', 'focus'],
];
export const INTERDITES_AJOUTEES = ['text.brand.large', 'text.interactive', 'background.interactive.strong', 'border.focus'];

/**
 * Rôles de couleur du bouton → [cible de l'alias, hex chez Orbe Café en clair], écrits à la main dans
 * docs/attendus/bouton.md (culori, résolveur indépendant de src/). Ajoutés après les 51 rôles ci-dessus.
 */
export const AJOUTS_BOUTON = {
  // Survol du plein d'erreur (D45, docs/attendus/finitions-bouton.md) : clarté OKLCH de l'erreur 11 − 0,05.
  'background.error.strong.hover': ['brand.error.solid-hover', '#b9001a'],
  'background.disabled': ['color.neutral.3', '#f3f2f1'],
  'text.disabled': ['color.neutral.9', '#8a8478'],
};

/** Paires du bouton, en fin de paires.json, après les 70 d'avant ; les deux du désactivé portent une exception écrite. */
export const PAIRES_BOUTON = [
  ['text.on-error', 'background.error.strong.hover', 'text'],
  ['text.disabled', 'background.disabled', 'text'],
  ['text.disabled', 'background.app', 'text'],
];
/** Paires du bouton sous leur seuil, avec exception écrite (composant inactif, WCAG 1.4.3). */
export const EXCEPTIONS_BOUTON = ['text.disabled sur background.disabled', 'text.disabled sur background.app'];

/**
 * Rôles de couleur de DsAvatar et DsTag → [cible de l'alias, hex chez Orbe Café en clair], écrits à la main dans
 * docs/attendus/avatar-etiquette.md, puis les deux fonds teintés dans docs/attendus/carte-membre-liste.md, puis le fond
 * de DsAvatar (D63 : pas 5 du primaire, bleu 5 d'Orbe Café, #dce2eb) (culori, résolveur indépendant de src/). Ajoutés
 * après ceux du bouton.
 */
export const AJOUTS_AVATAR = {
  'text.brand': ['brand.primary.12', '#103060'],
  'background.tint': ['color.tint', '#f3f2f1'],
  'background.brand.tint': ['brand.primary.tint', '#f1f3f7'],
  'background.avatar': ['brand.primary.5', '#dce2eb'],
};

/** Paires de DsAvatar et DsTag, en fin de paires.json, après celles du bouton : text.brand sur background.brand.subtle, puis les fonds teintés, puis le fond de DsAvatar. */
export const PAIRES_AVATAR = [
  ['text.brand', 'background.brand.subtle', 'text'],
  ['text.default', 'background.tint', 'text'],
  ['text.brand', 'background.brand.tint', 'text'],
  ['text.brand', 'background.avatar', 'text'],
];

/** Rôles de couleur et paires de chaque marque, ajouts compris. */
export const N_ROLES = 42 + Object.keys(AJOUTS).length + Object.keys(AJOUTS_BOUTON).length + Object.keys(AJOUTS_AVATAR).length;
export const N_PAIRES = 70 + PAIRES_BOUTON.length + PAIRES_AVATAR.length;
