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
 * Les couches communes (neutres, statuts, rôles, paires) sont lues dans tokens/orbe-cafe/ (dette, KNOWN_ISSUES.md).
 */
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { generateScale, checkValise } from '../valise/generate.js';
import { scaleToDtcg, valiseFromTokens } from './primitives.js';
import { marqueTokens } from './pleins.js';
import { loadRoles, contratRoles } from './roles.js';

/** Dossier des couches communes, qui est aussi celui d'Orbe Café. */
export const COMMUN = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
const CLES = ['nom', 'description', 'primaire', 'accent', 'polices'];
const STATUTS = ['erreur', 'succes', 'avertissement', 'info'];
const HEX = /^#[0-9a-f]{6}$/i;
const LABELS = { primaire: 'Primaire', accent: 'Accent' };

/** @param {number} n */
const fr = (n) => n.toFixed(2).replace('.', ',');
/** @param {string} a @param {string} b */
const memeDossier = (a, b) => resolve(a) === resolve(b);

/** Texte du fichier de jetons, tel qu'il est écrit sur le disque. @param {any} tokens */
export const serialiser = (tokens) => JSON.stringify(tokens, null, 2) + '\n';

/**
 * @typedef {{ scale: string, steps: string[] }} Source
 * @typedef {{ motifs: string[], marque: any, echelles: any, commun: import('./roles.js').RoleSet }} Saisie
 */

/**
 * Saisie d'une marque, sans rien écrire. Une marque est acceptée si `motifs` est vide.
 * @param {any} entree contenu de entree.json
 * @param {{ dossier: string, commun?: import('./roles.js').RoleSet }} opts dossier de la marque ; couches communes
 * @returns {Saisie}
 */
export function saisir(entree, { dossier, commun = loadRoles(COMMUN) }) {
  /** @type {string[]} */
  const motifs = [];
  const invalide = (/** @type {string} */ m) => motifs.push(`entrée invalide : ${m}`);
  const vide = { motifs, marque: null, echelles: null, commun };
  if (!entree || typeof entree !== 'object' || Array.isArray(entree)) {
    invalide('objet JSON attendu');
    return vide;
  }
  for (const k of Object.keys(entree)) if (!CLES.includes(k)) invalide(`clé inconnue ${k}`);
  if (!(typeof entree.nom === 'string' && entree.nom.trim())) invalide('nom manquant');
  if (entree.primaire === undefined) invalide('primaire manquante');
  if (entree.polices === undefined) invalide('polices manquantes');
  if ('description' in entree && typeof entree.description !== 'string') invalide('description, texte attendu');

  const orbe = memeDossier(dossier, COMMUN);
  const existantes = { ...commun.primitives.couleur, ...commun.statuts.couleur };
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
      $description: `Échelles de ${entree.nom}, écrites par la saisie depuis entree.json. Format DTCG 2025.10. Lues avec les couches communes de tokens/orbe-cafe/.`,
      couleur,
    };
    for (const f of checkValise(valiseFromTokens(echelles))) motifs.push(`checkValise : ${f}`);
  }
  const marque = marqueTokens({
    primaire,
    accent: accent ?? commune('neutre'),
    statuts: Object.fromEntries(STATUTS.map((s) => [s, commune(s)])),
    polices,
    description:
      entree.description ??
      `Emplacements de marque de ${entree.nom}, écrits par la saisie depuis entree.json. Format DTCG 2025.10. Les rôles de semantique.tokens.json pointent vers marque.<emplacement>.* ; chaque emplacement pointe vers une échelle (${noms.length ? 'générées dans echelles.tokens.json, ' : ''}communes dans tokens/orbe-cafe/), et ses pleins suivent la règle en trois cas (sombre, moyen, clair) lue sur le pas 9.${accent ? '' : ' Sans accent saisi : repli sur le neutre (D05).'}`,
  });
  try {
    const c = contratRoles({ ...commun, marque, echelles: echelles ? [echelles] : [] });
    for (const p of c.fails) motifs.push(`contraste : ${p.devant} sur ${p.fond}, ${fr(p.ratio)}:1 < ${String(p.min).replace('.', ',')}:1`);
  } catch (e) {
    motifs.push(`contraste : ${/** @type {Error} */ (e).message}`);
  }
  return { motifs, marque, echelles, commun };
}
