// Les trois marques de l'app : leur dossier dans tokens/, d'où viennent leurs thèmes (src/plugins/vuetify.js), et leur nom.
export const MARQUES = [
  { dossier: 'ecume-et-sel', nom: 'Écume et Sel' },
  { dossier: 'grenat-papeterie', nom: 'Grenat Papeterie' },
  { dossier: 'maison-alberto', nom: 'Maison Alberto' },
];

/** La marque et le mode que dit l'adresse. @param {Record<string, unknown>} query */
export const marqueDe = (query) => MARQUES.find((m) => m.dossier === query.marque) ?? MARQUES[0];
/** @param {Record<string, unknown>} query */
export const estSombre = (query) => query.mode === 'sombre';
