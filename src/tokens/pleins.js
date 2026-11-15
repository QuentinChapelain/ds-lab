// @ts-check
/**
 * Règle des pleins, déclarée dans la couche marque (jamais dans les rôles). Séance 3b, puis étape 4a, lot 3 bis :
 * décisions de Quentin sur image (15/11/2026, 13 h 18 à 13 h 48). La classe se lit sur l'échelle, dans cet ordre :
 *   1. blanc ≥ 4,5 sur le pas 9 → couleur exacte (plein = pas 9), texte blanc ;
 *        sombre  : blanc ≥ 5,5 → survol = pas 9 + voile blanc 8 % ;
 *        soutenu : blanc entre 4,5 et 5,5 → survol = pas 10 (plus foncé) ;
 *   2. clair : sinon, pas 12 sur le pas 9 ≥ 7 et pas 12 sur le pas 10 ≥ 4,5 → plein = pas 9, texte = pas 12,
 *      survol = pas 10 (seuil 7 calibré à l'œil, KNOWN_ISSUES.md) ;
 *   3. moyen : le reste → plein = pas 11, texte blanc, survol = pas 12.
 * Cette règle vaut pour le primaire et l'accent. Les quatre statuts gardent leur bouton d'avant l'étape 4, figé ici
 * (STATUTS_FIGES), pour que la couche marque d'Orbe Café reste identique.
 * Le voile est la seule valeur calculée de la couche marque : couleur DTCG, formule en $extensions.
 */
import { wcagContrast, interpolate, formatHex } from 'culori';
import { colorValue } from './primitives.js';

/** Couleur exacte et texte blanc : contraste du blanc sur le pas 9. */
export const BLANC_MIN = 4.5;
/** Survol par voile au-delà de ce contraste du blanc sur le pas 9 ; en dessous, survol au pas 10. */
export const SOMBRE_BLANC = 5.5;
/** Texte foncé (pas 12) sur le plein (pas 9) : seuil calibré à l'œil ; sur le survol (pas 10) : 4,5. */
export const TEXTE_FONCE = 7;
export const TEXTE_FONCE_SURVOL = 4.5;
/** Voile blanc du survol sombre. */
export const VOILE_BLANC = 0.08;

const WHITE = '#ffffff';

/** @typedef {'sombre' | 'soutenu' | 'clair' | 'moyen'} Classe */

/** Classe de plein d'une échelle de 12 pas (primaire, accent). @param {string[]} steps @returns {Classe} */
export function classePlein(steps) {
  const blanc = wcagContrast(WHITE, steps[8]);
  if (blanc >= SOMBRE_BLANC) return 'sombre';
  if (blanc >= BLANC_MIN) return 'soutenu';
  if (wcagContrast(steps[11], steps[8]) >= TEXTE_FONCE && wcagContrast(steps[11], steps[9]) >= TEXTE_FONCE_SURVOL) return 'clair';
  return 'moyen';
}

/**
 * Statuts figés : classe et phrase de règle d'avant l'étape 4 (séance 3b), écrites telles quelles.
 * Avertissement : texte foncé à 5,77 sur le plein, sous le seuil des couleurs du client (KNOWN_ISSUES.md).
 */
export const STATUTS_FIGES = /** @type {Record<string, { classe: Classe, regle: string }>} */ ({
  erreur: { classe: 'moyen', regle: 'moyen : plein = pas 11, texte blanc, survol = pas 12' },
  succes: { classe: 'moyen', regle: 'moyen : plein = pas 11, texte blanc, survol = pas 12' },
  avertissement: { classe: 'clair', regle: 'clair, jaune ou orangé : plein = pas 9, texte = pas 12, survol = pas 10' },
  info: { classe: 'moyen', regle: 'moyen : plein = pas 11, texte blanc, survol = pas 12' },
});

/** Blanc posé à `a` d'opacité sur `hex` (composition source-over en sRGB, comme le navigateur). @param {string} hex @param {number} [a] */
export function voileBlanc(hex, a = VOILE_BLANC) {
  return formatHex(interpolate([hex, WHITE], 'rgb')(a));
}

const REGLES = {
  sombre: 'sombre (blanc ≥ 5,5 sur le pas 9) : plein = pas 9, texte blanc, survol = plein + voile blanc 8 %',
  soutenu: 'soutenu (blanc ≥ 4,5 et < 5,5 sur le pas 9) : plein = pas 9, texte blanc, survol = pas 10',
  moyen: 'moyen : plein = pas 11, texte blanc, survol = pas 12',
  clair: 'clair (pas 12 ≥ 7 sur le pas 9 et ≥ 4,5 sur le pas 10) : plein = pas 9, texte = pas 12, survol = pas 10',
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
 * Statut : classe et phrase figées (STATUTS_FIGES) ; primaire et accent : classePlein.
 * @param {string} name @param {{ scale: string, steps: string[] }} src @param {boolean} withSteps
 */
export function emplacement(name, { scale, steps }, withSteps) {
  const fige = withSteps ? undefined : STATUTS_FIGES[name];
  if (!withSteps && !fige) throw new Error(`statut sans bouton figé : ${name}`);
  const classe = fige?.classe ?? classePlein(steps);
  const ref = (/** @type {string|number} */ k) => `{couleur.${scale}.${k}}`;
  /** @type {Record<string, any>} */
  const g = {
    $description: `${LABELS[name] ?? name} : échelle ${scale}, plein ${classe}.`,
    $extensions: { 'ds-lab.plein': { classe, regle: fige?.regle ?? REGLES[classe] } },
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
  } else if (classe === 'soutenu') {
    g.plein = { $value: ref(9), $description: 'plein : pas 9, couleur exacte' };
    g['plein-survol'] = { $value: ref(10), $description: 'plein survolé : pas 10, plus foncé' };
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
 * Fichier marque.tokens.json : primaire et accent (12 pas + cases de plein), statuts (cases de plein),
 * et, si elles sont données, les polices de la marque (séance 3c : police.titre, police.texte, $type fontFamily).
 * @param {{ primaire: { scale: string, steps: string[] }, accent: { scale: string, steps: string[] }, statuts: Record<string, { scale: string, steps: string[] }>, polices?: { titre: string[], texte: string[] }, description: string }} spec
 */
export function marqueTokens({ primaire, accent, statuts, polices, description }) {
  /** @type {Record<string, any>} */
  const m = {
    $type: 'color',
    $description: "Emplacements de marque : primaire et accent (12 pas, plein, plein survolé, texte sur plein), statuts (plein, plein survolé, texte sur plein). Règle des pleins en trois cas, lue sur le pas 9 : sombre, moyen, clair.",
    primaire: emplacement('primaire', primaire, true),
    accent: emplacement('accent', accent, true),
  };
  // Phrase complétée seulement si un emplacement est soutenu, pour qu'Orbe Café reste identique octet par octet.
  if ([m.primaire, m.accent].some((g) => g.$extensions['ds-lab.plein'].classe === 'soutenu'))
    m.$description += ' Variante soutenue du cas sombre (blanc entre 4,5 et 5,5 sur le pas 9) : survol au pas 10.';
  for (const [name, s] of Object.entries(statuts)) m[name] = emplacement(name, s, false);
  if (polices)
    m.police = {
      $type: 'fontFamily',
      $description: 'Polices de la marque : titre pour les styles affichage et titre 1 à 3, texte pour tout le reste.',
      titre: { $value: polices.titre, $description: 'Police des styles affichage et titre 1 à 3.' },
      texte: { $value: polices.texte, $description: 'Police des titres 4, du corps, des libellés et des mentions.' },
    };
  return { $description: description, marque: m };
}
