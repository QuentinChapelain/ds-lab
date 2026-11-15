// @ts-check
/**
 * Séance 3b : règle des pleins en trois cas, déclarée dans la couche marque (jamais dans les rôles).
 * La classe se lit sur le pas 9 de l'échelle :
 *   sombre : blanc ≥ 5,5 sur le pas 9 → plein = pas 9, texte blanc, survol = pas 9 + voile blanc 8 % ;
 *   clair  : sinon, clarté OKLCH ≥ 0,70 et teinte OKLCH dans [55°, 115°] (jaune ou orangé) [H]
 *            → plein = pas 9 (couleur exacte), texte = pas 12, survol = pas 10 ;
 *   moyen  : le reste → plein = pas 11, texte blanc, survol = pas 12.
 * Le voile est la seule valeur calculée de la couche marque : couleur DTCG, formule en $extensions.
 */
import { oklch, wcagContrast, interpolate, formatHex } from 'culori';
import { colorValue } from './primitives.js';

/** Seuil du cas sombre : contraste du blanc sur le pas 9. */
export const SOMBRE_BLANC = 5.5;
/** Seuils du cas clair, en OKLCH [H]. */
export const CLAIR_L = 0.7;
export const CLAIR_H = /** @type {[number, number]} */ ([55, 115]);
/** Voile blanc du survol sombre. */
export const VOILE_BLANC = 0.08;

const WHITE = '#ffffff';

/** @param {string} hex9 @returns {'sombre' | 'clair' | 'moyen'} */
export function classePlein(hex9) {
  if (wcagContrast(WHITE, hex9) >= SOMBRE_BLANC) return 'sombre';
  const o = oklch(hex9);
  const h = o?.h;
  if (o && o.l >= CLAIR_L && typeof h === 'number' && h >= CLAIR_H[0] && h <= CLAIR_H[1]) return 'clair';
  return 'moyen';
}

/** Blanc posé à `a` d'opacité sur `hex` (composition source-over en sRGB, comme le navigateur). @param {string} hex @param {number} [a] */
export function voileBlanc(hex, a = VOILE_BLANC) {
  return formatHex(interpolate([hex, WHITE], 'rgb')(a));
}

const REGLES = {
  sombre: 'sombre (blanc ≥ 5,5 sur le pas 9) : plein = pas 9, texte blanc, survol = plein + voile blanc 8 %',
  moyen: 'moyen : plein = pas 11, texte blanc, survol = pas 12',
  clair: 'clair, jaune ou orangé : plein = pas 9, texte = pas 12, survol = pas 10',
};
const LABELS = /** @type {Record<string, string>} */ ({
  primaire: 'Primaire (actions)',
  accent: 'Accent (mise en avant)',
  erreur: 'Statut erreur',
  succes: 'Statut succès',
  avertissement: 'Statut avertissement',
  info: 'Statut information',
});
const STEP_WORD = 'pas';

/**
 * Un emplacement : 12 pas en alias (si `withSteps`), puis plein, plein-survol et sur-plein selon la classe.
 * @param {string} name @param {{ scale: string, steps: string[] }} src @param {boolean} withSteps
 */
export function emplacement(name, { scale, steps }, withSteps) {
  const classe = classePlein(steps[8]);
  const ref = (/** @type {string|number} */ k) => `{couleur.${scale}.${k}}`;
  /** @type {Record<string, any>} */
  const g = {
    $description: `${LABELS[name] ?? name} : échelle ${scale}, plein ${classe}.`,
    $extensions: { 'ds-lab.plein': { classe, regle: REGLES[classe] } },
  };
  if (withSteps) for (let i = 1; i <= 12; i++) g[String(i)] = { $value: ref(i), $description: `${STEP_WORD} ${i} de l'échelle ${scale}` };
  if (classe === 'sombre') {
    g.plein = { $value: ref(9), $description: 'plein : pas 9' };
    g['plein-survol'] = {
      $value: colorValue(voileBlanc(steps[8])),
      $description: 'plein survolé : pas 9 sous un voile blanc de 8 %, valeur calculée',
      $extensions: { 'ds-lab.voile': { base: ref(9), blanc: VOILE_BLANC, composition: 'blanc posé sur la base, source-over en sRGB' } },
    };
    g['sur-plein'] = { $value: '{couleur.blanc}', $description: 'texte sur le plein : blanc' };
  } else if (classe === 'moyen') {
    g.plein = { $value: ref(11), $description: 'plein : pas 11' };
    g['plein-survol'] = { $value: ref(12), $description: 'plein survolé : pas 12' };
    g['sur-plein'] = { $value: '{couleur.blanc}', $description: 'texte sur le plein : blanc' };
  } else {
    g.plein = { $value: ref(9), $description: 'plein : pas 9, couleur exacte' };
    g['plein-survol'] = { $value: ref(10), $description: 'plein survolé : pas 10' };
    g['sur-plein'] = { $value: ref(12), $description: 'texte sur le plein : pas 12' };
  }
  return g;
}

/**
 * Fichier marque.tokens.json : primaire et accent (12 pas + cases de plein), statuts (cases de plein).
 * @param {{ primaire: { scale: string, steps: string[] }, accent: { scale: string, steps: string[] }, statuts: Record<string, { scale: string, steps: string[] }>, description: string }} spec
 */
export function marqueTokens({ primaire, accent, statuts, description }) {
  /** @type {Record<string, any>} */
  const m = {
    $type: 'color',
    $description: "Emplacements de marque : primaire et accent (12 pas, plein, plein survolé, texte sur plein), statuts (plein, plein survolé, texte sur plein). Règle des pleins en trois cas, lue sur le pas 9 : sombre, moyen, clair.",
    primaire: emplacement('primaire', primaire, true),
    accent: emplacement('accent', accent, true),
  };
  for (const [name, s] of Object.entries(statuts)) m[name] = emplacement(name, s, false);
  return { $description: description, marque: m };
}
