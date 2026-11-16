// @ts-check
/**
 * Règle des pleins, déclarée dans la couche marque (jamais dans les rôles), D04 :
 * décisions de Quentin sur image (15/11/2026, 13 h 18 à 13 h 48). La classe se lit sur l'échelle, dans cet ordre :
 *   1. blanc ≥ 4,5 sur le pas 9 → couleur exacte (plein = pas 9), texte blanc ;
 *        sombre  : blanc ≥ 5,5 → survol = pas 9 + voile blanc 8 % ;
 *        soutenu : blanc entre 4,5 et 5,5 → survol = pas 9 sous un voile noir de 15 % (décision du 15/11/2026,
 *                  13 h 58 : le pas 10 était à ΔE 1,33 du repos, invisible) ;
 *   2. clair : sinon, pas 12 sur le pas 9 ≥ 7 et pas 12 sur le pas 10 ≥ 4,5 → plein = pas 9, texte = pas 12,
 *      survol = pas 10 (seuil 7 calibré à l'œil, KNOWN_ISSUES.md) ;
 *   3. moyen : le reste → plein = pas 11, texte blanc, survol = pas 12.
 * Cette règle vaut pour le primaire et l'accent. Les quatre statuts gardent leur bouton d'origine, figé ici
 * (STATUTS_FIGES), pour que la couche marque d'Orbe Café reste identique.
 * Les voiles (blanc du cas sombre, noir du cas soutenu) sont les seules valeurs calculées de la couche marque :
 * couleur DTCG, formule en $extensions.
 */
import { interpolate, formatHex } from 'culori';
import { contrastRatio } from '../lib/color.js';
import { colorValue } from './primitives.js';

/** Couleur exacte et texte blanc : contraste du blanc sur le pas 9. */
export const BLANC_MIN = 4.5;
/** Survol par voile blanc au-delà de ce contraste du blanc sur le pas 9 ; en dessous, voile noir. */
export const SOMBRE_BLANC = 5.5;
/** Texte foncé (pas 12) sur le plein (pas 9) : seuil calibré à l'œil ; sur le survol (pas 10) : 4,5. */
export const TEXTE_FONCE = 7;
export const TEXTE_FONCE_SURVOL = 4.5;
/** Voile blanc du survol sombre. */
export const VOILE_BLANC = 0.08;
/** Voile noir du survol soutenu. */
export const VOILE_NOIR = 0.15;

const WHITE = '#ffffff';

/** @typedef {'sombre' | 'soutenu' | 'clair' | 'moyen'} Classe */

/** Classe de plein d'une échelle de 12 pas (primaire, accent). @param {string[]} steps @returns {Classe} */
export function classePlein(steps) {
  const blanc = contrastRatio(WHITE, steps[8]);
  if (blanc >= SOMBRE_BLANC) return 'sombre';
  if (blanc >= BLANC_MIN) return 'soutenu';
  if (contrastRatio(steps[11], steps[8]) >= TEXTE_FONCE && contrastRatio(steps[11], steps[9]) >= TEXTE_FONCE_SURVOL) return 'clair';
  return 'moyen';
}

/**
 * Statuts figés : classe et phrase de règle d'origine, écrites telles quelles.
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

/** Noir posé à `a` d'opacité sur `hex` (source-over en sRGB). @param {string} hex @param {number} [a] */
export function voileNoir(hex, a = VOILE_NOIR) {
  return formatHex(interpolate([hex, '#000000'], 'rgb')(a));
}

const REGLES = {
  sombre: 'sombre (blanc ≥ 5,5 sur le pas 9) : plein = pas 9, texte blanc, survol = plein + voile blanc 8 %',
  soutenu: 'soutenu (blanc ≥ 4,5 et < 5,5 sur le pas 9) : plein = pas 9, texte blanc, survol = plein + voile noir 15 %',
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
    g['plein-survol'] = {
      $value: colorValue(voileNoir(steps[8])),
      $description: 'plein survolé : pas 9 sous un voile noir de 15 %, valeur calculée',
      $extensions: { 'ds-lab.voile': { base: ref(9), noir: VOILE_NOIR, composition: 'noir posé sur la base, source-over en sRGB' } },
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

/** Texte de marque des grands titres : contraste visé sur chaque fond clair (grand texte, WCAG 1.4.3). */
export const GRAND_TEXTE = 3;

/**
 * Pas du texte de marque des grands titres (affichage, titres 1 et 2). Pas 9 du primaire s'il atteint
 * 3:1 sur chacun des fonds donnés et sur son propre pas 3 (fond.marque.discret) ; sinon pas 10 ; sinon pas 11.
 * @param {string[]} steps échelle du primaire @param {string[]} fonds hex de fond.app, fond.surface, fond.discret
 * @returns {9 | 10 | 11}
 */
export function pasTexteGrand(steps, fonds) {
  const tous = [...fonds, steps[2]];
  for (const pas of /** @type {(9 | 10)[]} */ ([9, 10])) if (tous.every((f) => contrastRatio(steps[pas - 1], f) >= GRAND_TEXTE)) return pas;
  return 11;
}

/**
 * Fichier marque.tokens.json : primaire et accent (12 pas + cases de plein), statuts (cases de plein),
 * et, si elles sont données, les polices de la marque (police.titre, police.texte, $type fontFamily).
 * Le primaire porte en plus texte-grand (pasTexteGrand), écrit en dernier pour qu'Orbe Café redevienne
 * identique une fois cet ajout retiré.
 * @param {{ primaire: { scale: string, steps: string[] }, accent: { scale: string, steps: string[] }, statuts: Record<string, { scale: string, steps: string[] }>, polices?: { titre: string[], texte?: string[], fichiersTitre?: string[] }, fonds: string[], description: string }} spec
 */
export function marqueTokens({ primaire, accent, statuts, polices, fonds, description }) {
  /** @type {Record<string, any>} */
  const m = {
    $type: 'color',
    $description: "Emplacements de marque : primaire et accent (12 pas, plein, plein survolé, texte sur plein), statuts (plein, plein survolé, texte sur plein). Règle des pleins en trois cas, lue sur le pas 9 : sombre, moyen, clair.",
    primaire: emplacement('primaire', primaire, true),
    accent: emplacement('accent', accent, true),
  };
  // Phrase complétée seulement si un emplacement est soutenu, pour qu'Orbe Café reste identique octet par octet.
  if ([m.primaire, m.accent].some((g) => g.$extensions['ds-lab.plein'].classe === 'soutenu'))
    m.$description += ' Variante soutenue du cas sombre (blanc entre 4,5 et 5,5 sur le pas 9) : survol par voile noir de 15 %.';
  const grand = pasTexteGrand(primaire.steps, fonds);
  m.primaire['texte-grand'] = {
    $value: `{couleur.${primaire.scale}.${grand}}`,
    $description: `texte de marque des grands titres (affichage, titres 1 et 2) : pas ${grand}, premier des pas 9, 10, 11 à tenir 3:1 sur fond.app, fond.surface, fond.discret et fond.marque.discret`,
  };
  for (const [name, s] of Object.entries(statuts)) m[name] = emplacement(name, s, false);
  if (polices) {
    m.police = {
      $type: 'fontFamily',
      $description: 'Polices de la marque : titre pour les styles affichage et titre 1 à 3, texte pour tout le reste.',
      titre: {
        $value: polices.titre,
        $description: 'Police des styles affichage et titre 1 à 3.',
        // Fichiers de la police, relatifs à l'entrée, seulement s'ils sont donnés (les marques sans fichier ne changent pas).
        ...(polices.fichiersTitre?.length ? { $extensions: { 'ds-lab.police': { fichiers: polices.fichiersTitre } } } : {}),
      },
    };
    // Sans police de texte saisie, la police du produit vient du commun (tokens/commun/police.tokens.json).
    if (polices.texte) m.police.texte = { $value: polices.texte, $description: 'Police des titres 4, du corps, des libellés et des mentions.' };
  }
  return { $description: description, marque: m };
}

/** Emplacements de l'aplat plein du primaire, alias du plein en clair (tokens/commun/aplat.tokens.json). */
export const APLAT = /** @type {const} */ ({ aplat: 'plein', 'sur-aplat': 'sur-plein', 'aplat-survol': 'plein-survol' });

/** Fichier tokens/commun/aplat.tokens.json : les trois emplacements de l'aplat plein, alias du plein du primaire. */
export function aplatTokens() {
  /** @type {Record<string, any>} */
  const primaire = {};
  for (const [k, v] of Object.entries(APLAT)) primaire[k] = { $value: `{marque.primaire.${v}}`, $description: `aplat plein (fond.marque.fort et bouton inversé) : ${v} du primaire en clair ; en sombre, valeur claire figée (marque.sombre.tokens.json)` };
  return {
    $description: "Emplacements de l'aplat plein, communs à toutes les marques (étape 4b, lot 2 bis). Format DTCG 2025.10. En clair, alias du plein du primaire ; en sombre, la couche marque sombre les fige aux valeurs claires, pendant que le bouton prend la version lumineuse de la couleur du client (D04).",
    marque: { $type: 'color', primaire },
  };
}

/**
 * Couche marque du mode sombre, posée par-dessus la claire dans le contexte sombre (D04).
 *   Bouton du primaire et des quatre statuts, règle unique : plein = pas 11 de l'échelle sombre, survol = pas 12, texte =
 *   pas 1, en alias, sans valeur calculée.
 *   Aplat plein du primaire (aplat, sur-aplat, aplat-survol) et accent fort : valeurs du clair, écrites telles quelles
 *   (le blanc reste un alias).
 *   texte-grand : choisi de nouveau sur l'échelle sombre du primaire, contre les fonds sombres (pasTexteGrand).
 * @param {{ marque: any, clairs: Record<string, string[]>, echelles: Record<string, string>, primaireSombre: { scale: string, steps: string[] }, fonds: string[], description: string }} spec
 *   marque claire (marqueTokens) ; pas clairs par emplacement ; nom de l'échelle sombre par emplacement à bouton ;
 *   échelle sombre du primaire ; fonds sombres
 */
export function marqueSombreTokens({ marque, clairs, echelles, primaireSombre, fonds, description }) {
  const m0 = marque.marque;
  /** Valeur claire d'un emplacement, à figer. @param {string} name @param {string} k */
  const figee = (name, k) => {
    const t = m0[name][k];
    const v = t.$value;
    const mm = typeof v === 'string' ? /^\{couleur\.[^.]+\.(\d+)\}$/.exec(v) : null;
    const $value = mm ? colorValue(clairs[name][Number(mm[1]) - 1]) : structuredClone(v);
    return { $value, $description: `${t.$description}, valeur du mode clair, figée en sombre`, ...(mm ? { $extensions: { 'ds-lab.mode': { clair: v } } } : {}) };
  };
  /** @type {Record<string, any>} */
  const m = {};
  for (const [name, scale] of Object.entries(echelles))
    m[name] = {
      plein: { $value: `{couleur.${scale}.11}`, $description: "plein en sombre : pas 11 de l'échelle sombre, version lumineuse de la couleur" },
      'plein-survol': { $value: `{couleur.${scale}.12}`, $description: "plein survolé en sombre : pas 12 de l'échelle sombre" },
      'sur-plein': { $value: `{couleur.${scale}.1}`, $description: "texte sur le plein en sombre : pas 1 de l'échelle sombre (7:1 au moins, DS1)" },
    };
  for (const [k, v] of Object.entries(APLAT)) m.primaire[k] = { ...figee('primaire', v), $description: `aplat plein en sombre : ${v} du primaire en clair, figé (couleur exacte du client)` };
  m.accent = Object.fromEntries(['plein', 'plein-survol', 'sur-plein'].map((k) => [k, figee('accent', k)]));
  const grand = pasTexteGrand(primaireSombre.steps, fonds);
  m.primaire['texte-grand'] = {
    $value: `{couleur.${primaireSombre.scale}.${grand}}`,
    $description: `texte de marque des grands titres en sombre : pas ${grand} de l'échelle sombre, premier des pas 9, 10, 11 à tenir 3:1 sur fond.app, fond.surface, fond.discret et fond.marque.discret sombres`,
  };
  return { $description: description, marque: m };
}
