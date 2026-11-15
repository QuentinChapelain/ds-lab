// @ts-check
/**
 * Étape 4, séance a, lot 1 : saisie d'une marque (docs/attendus/etape-4-contrat-de-marque.md).
 *
 * Entrée (tokens/<marque>/entree.json) :
 *   nom          texte, obligatoire ;
 *   primaire     couleur #rrggbb (échelle générée par generateScale) ou { "echelle": nom } (échelle existante,
 *                réservée à Orbe Café, dont le dossier porte les couches communes) ;
 *   accent       facultatif, même forme ; absent : repli sur le neutre (D05) ;
 *   polices      { titre: [familles], texte: [familles] }, noms de familles seulement (ni chargement ni contrôle) ;
 *   description  facultative, $description de marque.tokens.json.
 *
 * Trois motifs de refus : entrée invalide ; checkValise en échec sur les échelles générées ; paire de rôles en échec.
 * Étape 4b : checkValise et le contraste sont contrôlés dans les deux modes ; chaque motif dit son mode, (clair) ou (sombre).
 * Les couches communes (neutres, statuts, rôles, paires) sont lues dans tokens/commun/ ; la saisie écrit aussi le resolver
 * de la marque (marque.resolver.json, src/tokens/resolver.js).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateScale, checkValise } from '../valise/generate.js';
import { scaleToDtcg, valiseFromTokens, OPTIONS_COULEUR_SOMBRE } from './primitives.js';
import { marqueTokens, marqueSombreTokens } from './pleins.js';
import { contratRoles, resolveRoles } from './roles.js';
import { COMMUN, ORBE, modeleResolver, resoudre, partager, fusionner } from './resolver.js';

export { COMMUN };
const CLES = ['nom', 'description', 'primaire', 'accent', 'polices'];
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
const HEX = /^#[0-9a-f]{6}$/i;
const LABELS = { primaire: 'Primaire', accent: 'Accent' };

/** @param {number} n */
const fr = (n) => n.toFixed(2).replace('.', ',');
/** @param {string} a @param {string} b */
const memeDossier = (a, b) => resolve(a) === resolve(b);

/**
 * Fonds clairs communs sur lesquels le texte de marque des grands titres doit tenir 3:1 (lot 5) :
 * hex de fond.app, fond.surface et fond.discret, résolus dans les couches communes.
 * @param {import('./roles.js').RoleSet} commun
 */
export function fondsClairs(commun) {
  const f = commun.semantique.fond;
  const roles = resolveRoles({ fond: { $type: 'color', app: f.app, surface: f.surface, discret: f.discret } }, commun.primitives, commun.statuts);
  return ['fond.app', 'fond.surface', 'fond.discret'].map((r) => /** @type {any} */ (roles.get(r)).hex);
}

/**
 * Couches communes seules, sans marque, dans un contexte : le resolver d'une marque sans fichier de marque.
 * @param {{ mode?: string }} [opts] @returns {import('./roles.js').RoleSet}
 */
export function chargerCommun({ mode } = {}) {
  const r = resoudre(modeleResolver({ nom: 'commun', marque: [], dossier: COMMUN }), COMMUN, mode ? { mode } : {});
  const { semantique, primitives, marque } = partager(r);
  return { primitives, statuts: {}, semantique, paires: JSON.parse(readFileSync(join(COMMUN, 'paires.json'), 'utf8')), marque, echelles: [] };
}

/** Échelles propres à Orbe Café (bleu, terre, sable), écrites à la main. */
export const lirePropresOrbe = () => JSON.parse(readFileSync(join(ORBE, 'primitives.tokens.json'), 'utf8'));

/** Texte du fichier de jetons, tel qu'il est écrit sur le disque. @param {any} tokens */
export const serialiser = (tokens) => JSON.stringify(tokens, null, 2) + '\n';

/**
 * @typedef {{ scale: string, steps: string[] }} Source
 * @typedef {{ motifs: string[], marque: any, echelles: any, echellesSombres: any, marqueSombre: any, resolver: any, commun: import('./roles.js').RoleSet }} Saisie
 */

/**
 * Saisie d'une marque, sans rien écrire. Une marque est acceptée si `motifs` est vide.
 * @param {any} entree contenu de entree.json
 * Étape 4b, lot 2 : la saisie génère aussi le mode sombre de la marque (échelles en miroir depuis le pas 9, couche marque
 * sombre) ; checkValise en échec sur une échelle sombre est un motif de refus.
 * @param {{ dossier: string, commun?: import('./roles.js').RoleSet, communSombre?: import('./roles.js').RoleSet }} opts dossier de la
 *   marque ; couches communes, en clair et en sombre
 * @returns {Saisie}
 */
export function saisir(entree, { dossier, commun = chargerCommun(), communSombre = chargerCommun({ mode: 'sombre' }) }) {
  /** @type {string[]} */
  const motifs = [];
  const invalide = (/** @type {string} */ m) => motifs.push(`entrée invalide : ${m}`);
  const vide = { motifs, marque: null, echelles: null, echellesSombres: null, marqueSombre: null, resolver: null, commun };
  if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
    invalide('objet JSON attendu');
    return vide;
  }
  for (const k of Object.keys(entree)) if (!CLES.includes(k)) invalide(`clé inconnue ${k}`);
  if (!(typeof entree.nom === 'string' && entree.nom.trim())) invalide('nom manquant');
  if (entree.primaire === undefined) invalide('primaire manquante');
  if (entree.polices === undefined) invalide('polices manquantes');
  if ('description' in entree && typeof entree.description !== 'string') invalide('description, texte attendu');

  const orbe = memeDossier(dossier, ORBE);
  const propres = orbe ? lirePropresOrbe() : null;
  const existantes = { ...commun.primitives.couleur, ...commun.statuts.couleur, ...propres?.couleur };
  /** @type {Record<string, ReturnType<typeof generateScale>>} */
  const generees = {};
  /** @param {'primaire' | 'accent'} slot @returns {Source | undefined} */
  const source = (slot) => {
    const v = entree[slot];
    if (v === undefined) return undefined;
    if (typeof v === 'string' && HEX.test(v)) {
      generees[slot] = generateScale(slot, v.toLowerCase());
      return { scale: slot, steps: generees[slot].steps };
    }
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 1 && typeof v.echelle === 'string') {
      if (!orbe) return void invalide(`${slot}, échelle existante réservée à Orbe Café`);
      const g = existantes[v.echelle];
      if (!g?.['1'] || !g?.['12']) return void invalide(`${slot}, échelle inconnue ${v.echelle}`);
      return { scale: v.echelle, steps: Array.from({ length: 12 }, (_, i) => g[String(i + 1)].$value.hex) };
    }
    return void invalide(`${slot}, couleur #rrggbb ou { "echelle": nom } attendue`);
  };
  const primaire = source('primaire');
  const accent = source('accent');
  /** @type {{ titre: string[], texte: string[] } | undefined} */
  let polices;
  if (entree.polices !== undefined) {
    const p = entree.polices;
    const familles = (/** @type {any} */ l) => Array.isArray(l) && l.length > 0 && l.every((x) => typeof x === 'string' && x.trim());
    if (!p || typeof p !== 'object' || Array.isArray(p)) invalide('polices, { "titre": [...], "texte": [...] } attendu');
    else {
      for (const k of Object.keys(p)) if (k !== 'titre' && k !== 'texte') invalide(`clé inconnue polices.${k}`);
      for (const k of ['titre', 'texte']) if (!familles(p[k])) invalide(`polices.${k}, liste de noms de familles attendue`);
      if (familles(p.titre) && familles(p.texte)) polices = { titre: p.titre, texte: p.texte };
    }
  }
  if (motifs.length || !primaire || !polices) return vide;

  /** @param {string} s @returns {Source} */
  const commune = (s) => ({ scale: s, steps: Array.from({ length: 12 }, (_, i) => existantes[s][String(i + 1)].$value.hex) });
  const noms = Object.keys(generees);
  /** @type {any} */
  let echelles = null;
  if (noms.length) {
    /** @type {Record<string, any>} */
    const couleur = { $type: 'color', $description: `Échelles générées de ${entree.nom} (generateScale, src/valise/generate.js), pas 9 = couleur saisie.` };
    for (const n of noms) couleur[n] = scaleToDtcg(generees[n], `${LABELS[/** @type {'primaire' | 'accent'} */ (n)]} de ${entree.nom}`);
    echelles = {
      $description: `Échelles de ${entree.nom}, écrites par la saisie depuis entree.json. Format DTCG 2025.10. Lues avec les couches communes de tokens/commun/.`,
      couleur,
    };
    for (const f of checkValise(valiseFromTokens(echelles))) motifs.push(`checkValise (clair) : ${f}`);
  }
  const marque = marqueTokens({
    primaire,
    accent: accent ?? commune('neutre'),
    statuts: Object.fromEntries(STATUTS.map((s) => [s, commune(s)])),
    polices,
    fonds: fondsClairs(commun),
    description:
      entree.description ??
      `Emplacements de marque de ${entree.nom}, écrits par la saisie depuis entree.json. Format DTCG 2025.10. Les rôles de semantique.tokens.json pointent vers marque.<emplacement>.* ; chaque emplacement pointe vers une échelle (${noms.length ? 'générées dans echelles.tokens.json, ' : ''}communes dans tokens/commun/), et ses pleins suivent la règle en trois cas (sombre, moyen, clair) lue sur le pas 9.${accent ? '' : ' Sans accent saisi : repli sur le neutre (D05).'}`,
  });
  // Mode sombre : échelles en miroir du primaire et de l'accent, depuis leur pas 9, sous le même nom.
  /** @type {Record<string, any>} */
  const couleurSombre = {
    $type: 'color',
    $description: `Échelles de ${entree.nom} en mode sombre (generateScale, fond sombre [H]), pas 9 = pas 9 clair ; même nom que l'échelle claire, qu'elles remplacent dans le contexte sombre.`,
  };
  /** @type {Record<string, string[]>} */
  const sombres = {};
  for (const [slot, src] of /** @type {const} */ ([['primaire', primaire], ['accent', accent]])) {
    if (!src) continue;
    const g = generateScale(src.scale, src.steps[8], OPTIONS_COULEUR_SOMBRE);
    sombres[slot] = g.steps;
    couleurSombre[src.scale] = scaleToDtcg(g, `${LABELS[slot]} de ${entree.nom}`);
  }
  const echellesSombres = {
    $description: `Échelles de ${entree.nom} en mode sombre, écrites par la saisie depuis entree.json. Format DTCG 2025.10. Lues dans le contexte sombre de marque.resolver.json, après tokens/commun/mode.sombre.tokens.json.`,
    couleur: couleurSombre,
  };
  for (const f of checkValise(valiseFromTokens(echellesSombres))) motifs.push(`checkValise (sombre) : ${f}`);
  const marqueSombre = marqueSombreTokens({
    marque,
    clairs: {
      primaire: primaire.steps,
      accent: (accent ?? commune('neutre')).steps,
      ...Object.fromEntries(STATUTS.map((s) => [s, commune(s).steps])),
    },
    echelles: { primaire: primaire.scale, ...Object.fromEntries(STATUTS.map((s) => [s, s])) },
    primaireSombre: { scale: primaire.scale, steps: sombres.primaire },
    fonds: fondsClairs(communSombre),
    description: `Couche marque de ${entree.nom} en mode sombre, écrite par la saisie. Format DTCG 2025.10. Posée sur marque.tokens.json dans le contexte sombre : les boutons gardent leurs valeurs claires (D04), le texte de marque des grands titres est choisi sur l'échelle sombre.`,
  });
  // Contraste dans les deux modes (lot 3) : chaque motif dit son mode. Même fusion que le resolver : commun, échelles et
  // couche marque claires, puis, en sombre, le commun sombre, les échelles sombres et la couche marque sombre.
  const claires = echelles ? [echelles] : propres ? [propres] : [];
  /** @type {[string, import('./roles.js').RoleSet][]} */
  const jeux = [
    ['clair', { ...commun, marque: fusionner(fusionner({}, commun.marque), marque), echelles: claires }],
    ['sombre', { ...communSombre, marque: fusionner(fusionner(fusionner({}, communSombre.marque), marque), marqueSombre), echelles: [...claires, echellesSombres] }],
  ];
  for (const [mode, jeu] of jeux) {
    try {
      const c = contratRoles(jeu);
      for (const p of c.fails) motifs.push(`contraste (${mode}) : ${p.devant} sur ${p.fond}, ${fr(p.ratio)}:1 < ${String(p.min).replace('.', ',')}:1`);
    } catch (e) {
      motifs.push(`contraste (${mode}) : ${/** @type {Error} */ (e).message}`);
    }
  }
  const resolver = modeleResolver({
    nom: entree.nom,
    dossier,
    marque: [...(orbe ? ['primitives.tokens.json'] : echelles ? ['echelles.tokens.json'] : []), 'marque.tokens.json'],
    sombre: ['echelles.sombre.tokens.json', 'marque.sombre.tokens.json'],
  });
  return { motifs, marque, echelles, echellesSombres, marqueSombre, resolver, commun };
}
