// @ts-check
/**
 * Séance 3a, T0 : échelles de couleur en jetons DTCG 2025.10, et lecture inverse pour checkValise.
 * Les statuts avertissement et info d'Orbe Café sont générés par generateScale et rangés à part
 * (tokens/commun/statuts.tokens.json) ; primitives.tokens.json n'est pas modifié.
 */
import { rgb, formatHex } from 'culori';
import { contrastRatio } from '../lib/color.js';
import { generateScale, couleurAuContraste, TARGETS } from '../valise/generate.js';
import { r4 } from '../lib/format.js';

/** Phrases d'usage par pas, reprises de primitives.tokens.json. */
export const STEP_USAGES = /** @type {Record<string, string>} */ ({
  1: "fond d'application",
  2: 'fond discret',
  3: 'fond de composant',
  4: 'fond de composant, survol',
  5: 'fond de composant, appui',
  6: 'bordure discrète',
  7: 'bordure de composant',
  8: "bordure d'interaction, focus (3:1)",
  9: 'plein, couleur source',
  10: 'plein, survol',
  11: 'texte secondaire (4,5:1)',
  12: 'texte principal',
});
/** generateScale vérifie le texte sur-plein sur les pas 9 et 10 (G4). */
export const ON_SOLID_USAGE = 'texte posé sur les pas 9 et 10 (4,5:1)';

/** Statuts ajoutés en séance 3a (sources de l'attendu). */
export const STATUTS = [
  { name: 'avertissement', source: '#e5a000', label: "Statut d'avertissement" },
  { name: 'info', source: '#0284c7', label: "Statut d'information" },
];

/** Couleur DTCG 2025.10 (srgb, composantes à 4 décimales, hex). @param {string} hex */
export function colorValue(hex) {
  const c = /** @type {import('culori').Rgb} */ (rgb(hex));
  return { colorSpace: 'srgb', components: [c.r, c.g, c.b].map(r4), hex: formatHex(hex) };
}

/** Phrase d'échelle selon l'école du générateur. @param {ReturnType<typeof generateScale>} g @param {string} label */
function scaleDescription(g, label) {
  if (g.fond === 'sombre')
    return `${label}, mode sombre. Pas 9 = ${g.source} exact ; autres pas générés par generateScale (src/valise/generate.js) en miroir [H] : mêmes cibles, contraste visé contre le noir au lieu du blanc ; école « ${g.school} » lue contre le noir.`;
  const school =
    g.school === 'plein clair'
      ? 'école « plein clair » : pas 7 et 8 plus foncés que le pas 9, texte sur-plein foncé'
      : g.onSolid === '#ffffff'
        ? `école « ${g.school} »`
        : `école « ${g.school} », texte sur-plein foncé : le blanc ne tient pas 4,5:1 sur le pas 9`;
  return `${label}. Pas 9 = ${g.source} exact ; autres pas générés par generateScale (src/valise/generate.js), ${school}.`;
}

/**
 * Une échelle générée en groupe DTCG : 12 pas, sur-plein, phrase d'échelle et $extensions de valise.
 * @param {ReturnType<typeof generateScale>} g @param {string} label
 */
export function scaleToDtcg(g, label) {
  /** @type {Record<string, any>} */
  const group = {
    $description: scaleDescription(g, label),
    $extensions: { 'ds-lab.valise': { source: g.source, ecole: g.school, pas10: g.step10, signaux: g.signals, ...(g.fond === 'sombre' ? { fond: 'sombre' } : {}) } },
  };
  g.steps.forEach((hex, i) => (group[String(i + 1)] = { $value: colorValue(hex), $description: STEP_USAGES[i + 1] }));
  group['sur-plein'] = { $value: colorValue(g.onSolid), $description: ON_SOLID_USAGE };
  return group;
}

/** Fichier statuts.tokens.json complet. */
export function statutsTokens() {
  /** @type {Record<string, any>} */
  const couleur = {
    $type: 'color',
    $description: 'Statuts complémentaires (avertissement, info), générés par contraste visé contre le blanc ; checkValise passe.',
  };
  for (const s of STATUTS) couleur[s.name] = scaleToDtcg(generateScale(s.name, s.source), s.label);
  return {
    $description: "Statuts complémentaires communs à toutes les marques (avertissement, info), séance 3a du 14/11/2026. Format DTCG 2025.10. Complète primitives.tokens.json sans le modifier.",
    couleur,
  };
}

/**
 * Lecture inverse : un ou plusieurs fichiers de jetons → valise lisible par checkValise et contractOf.
 * Les échelles sont les groupes de couleur.* qui ont les pas 1 à 12 ; l'école vient de
 * $extensions["ds-lab.valise"] si elle est écrite (sinon checkValise prend « normale »).
 * @param {...any} files
 */
export function valiseFromTokens(...files) {
  /** @type {any} */
  const valise = { generator: { schools: {}, sources: {}, step10: {}, fonds: {} }, signals: {}, onSolid: {}, colors: [] };
  for (const f of files) {
    for (const [name, g] of Object.entries(f.couleur ?? {})) {
      if (name.startsWith('$') || !g?.['1'] || !g?.['12']) continue;
      for (let i = 1; i <= 12; i++) valise.colors.push({ name: `${name}-${i}`, value: g[String(i)].$value.hex });
      if (g['sur-plein']) valise.onSolid[name] = g['sur-plein'].$value.hex;
      const x = g.$extensions?.['ds-lab.valise'];
      if (x) {
        valise.generator.schools[name] = x.ecole;
        valise.generator.sources[name] = x.source;
        valise.generator.step10[name] = x.pas10;
        if (x.fond) valise.generator.fonds[name] = x.fond;
        if (x.signaux?.length) valise.signals[name] = x.signaux;
      }
    }
  }
  return valise;
}

/**
 * Étape 4b, lot 2 bis [H] : cibles du mode sombre, contraste contre le noir, calées sur la page (PAGE_SOMBRE).
 * Pas 1 à 7 (et 8 des couleurs) au même rapport à la page que les cibles claires au pas 1 (cible ÷ 1,02 × page).
 * Pas 8 (bordures de champ et de statut, 3:1) à 3,1 × fond.surface, pour tenir 3:1 sur la surface où se pose un champ.
 * Neutre : pas 11 et 12 au rapport clair (5,49 et 12,75 sur la page),
 * pas 9 au milieu géométrique des pas 8 et 11. Couleurs : pas 11 à 9:1 sur la page (repères #8bb9ff et #c4a3ff),
 * pas 12 à 12,75:1. fond.surface entre les pas 2 et 3 (milieu géométrique).
 */
export const PAGE_SOMBRE = '#121212';
const KP = contrastRatio(PAGE_SOMBRE, '#000000');
const surPage = (/** @type {number} */ t) => (t / TARGETS[1]) * KP;
/** Contraste de fond.surface sombre contre le noir. */
export const SURFACE_SOMBRE = Math.sqrt(surPage(TARGETS[2]) * surPage(TARGETS[3]));
const BASE_SOMBRE = Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [i, surPage(TARGETS[i])]));
const NEUTRE_8 = 3.1 * SURFACE_SOMBRE;
const NEUTRE_11 = surPage(TARGETS[11]);
export const CIBLES_SOMBRES = {
  couleur: /** @type {Record<number, number>} */ ({ ...BASE_SOMBRE, 8: NEUTRE_8, 11: 9 * KP, 12: surPage(TARGETS[12]) }),
  neutre: /** @type {Record<number, number>} */ ({ ...BASE_SOMBRE, 8: NEUTRE_8, 11: NEUTRE_11, 12: surPage(TARGETS[12]) }),
  /** Contraste du pas 9 neutre contre le noir. */
  neutre9: Math.sqrt(NEUTRE_8 * NEUTRE_11),
};
/** Options de generateScale pour une échelle de couleur sombre (marques et statuts). */
export const OPTIONS_COULEUR_SOMBRE = /** @type {const} */ ({ fond: 'sombre', cibles: CIBLES_SOMBRES.couleur, chromaTextes: 'max' });

/** Étape 4b : échelles communes du mode sombre ; statuts depuis le pas 9 de leur échelle claire, neutre dessiné. */
export const ECHELLES_SOMBRES = [
  { name: 'neutre', label: 'Neutre' },
  { name: 'erreur', label: "Statut d'erreur" },
  { name: 'succes', label: 'Statut de succès' },
  { name: 'avertissement', label: "Statut d'avertissement" },
  { name: 'info', label: "Statut d'information" },
];

/**
 * Fichier tokens/commun/mode.sombre.tokens.json (lot 2 bis) : neutre dessiné sur la page #121212 (teinte du neutre
 * clair, cibles CIBLES_SOMBRES.neutre), surface entre ses pas 2 et 3, texte sur inverse = pas 1 du neutre ; statuts en
 * échelles de couleur sombres (OPTIONS_COULEUR_SOMBRE) depuis le pas 9 de leur échelle claire.
 * @param {any} primitives tokens/commun/primitives.tokens.json @param {any} statuts tokens/commun/statuts.tokens.json
 */
export function sombreTokens(primitives, statuts) {
  const claires = { ...primitives.couleur, ...statuts.couleur };
  const neutre9 = couleurAuContraste(claires.neutre['9'].$value.hex, CIBLES_SOMBRES.neutre9, { fond: 'sombre' });
  /** @type {Record<string, any>} */
  const couleur = {
    $type: 'color',
    $description: `Mode sombre, commun à toutes les marques [H] : page ${PAGE_SOMBRE}, chaque surface posée au-dessus plus claire. Neutre dessiné (teinte du neutre clair, cibles calées sur la page) ; statuts générés depuis le pas 9 de leur échelle claire, pas 11 à 9:1 sur la page, pas 12 au-dessus, chroma la plus forte possible. Même nom que l'échelle claire, que le contexte sombre remplace.`,
    surface: {
      $value: colorValue(couleurAuContraste(neutre9, SURFACE_SOMBRE, { fond: 'sombre', echelle: true })),
      $description: 'Surface en sombre : plus claire que fond.discret, plus foncée que les fonds de composant, jamais plus foncée que la page [H].',
    },
    'sur-inverse': { $value: '{couleur.neutre.1}', $description: 'Texte sur fond.inverse en sombre : la page, pas 1 du neutre.' },
  };
  for (const e of ECHELLES_SOMBRES) {
    const g =
      e.name === 'neutre'
        ? generateScale('neutre', neutre9, { fond: 'sombre', cibles: CIBLES_SOMBRES.neutre })
        : generateScale(e.name, claires[e.name]['9'].$value.hex, OPTIONS_COULEUR_SOMBRE);
    couleur[e.name] = scaleToDtcg(g, e.label);
  }
  return {
    $description: "Contexte sombre du modificateur mode (marque.resolver.json), commun à toutes les marques. Écrit par src/cli/sombre.js si checkValise passe. Format DTCG 2025.10. Chaque jeton remplace en entier celui du mode clair.",
    couleur,
  };
}
