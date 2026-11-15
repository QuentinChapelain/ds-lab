// @ts-check
/**
 * Étape 4, séance b, lot 1 : lecteur maison des resolvers DTCG 2025.10 (module Resolver), sans dépendance
 * (docs/attendus/etape-4b-contextes.md, réponse 4).
 *
 * Ce qu'il lit, et rien d'autre :
 *   version          "2025.10" ;
 *   sets             { nom: { sources: [ { "$ref": "fichier.tokens.json" } | jetons en ligne ] } } ;
 *   modifiers        { nom: { contexts: { contexte: [sources] }, default?, $extensions? } } ;
 *   resolutionOrder  [ { "$ref": "#/sets/<nom>" } | { "$ref": "#/modifiers/<nom>" } ].
 * Un $ref de fichier se lit depuis le dossier du resolver. Les entrées nomment un contexte par modificateur ;
 * un modificateur absent des entrées prend son défaut. Fusion dans l'ordre : le dernier jeton gagne, en entier
 * (un jeton n'est jamais fusionné champ par champ) ; un groupe se fusionne clé par clé, dans l'ordre de première
 * apparition. Les alias ne sont pas résolus ici : resolveRoles, espacements et typo le font sur l'arbre fusionné.
 *
 * Chaque marque a son tokens/<marque>/marque.resolver.json, écrit par la saisie (modeleResolver) :
 *   jeux        primitives (tokens/commun/), marque (échelles et couche marque du dossier), roles (tokens/commun/) ;
 *   mode        clair | sombre, défaut clair ;
 *   largeur     large | etroit, défaut large ; le seuil de l'étroit est dans $extensions["ds-lab.largeur"].
 */
import { readFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = '2025.10';
/** Nom du resolver dans le dossier d'une marque. */
export const RESOLVER = 'marque.resolver.json';
/** Couches communes à toutes les marques. */
export const COMMUN = fileURLToPath(new URL('../../tokens/commun/', import.meta.url));
/** Dossier d'Orbe Café, marque par défaut des contrôles. */
export const ORBE = fileURLToPath(new URL('../../tokens/orbe-cafe/', import.meta.url));
/** Clé d'extension du seuil de largeur, sur le modificateur largeur. */
export const LARGEUR = 'ds-lab.largeur';
/** Modificateurs et leurs contextes, dans l'ordre ; le premier est le défaut. */
export const MODIFICATEURS = { mode: ['clair', 'sombre'], largeur: ['large', 'etroit'] };

/** @param {any} v */
const estObjet = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/** @param {any} v */
const estJeton = (v) => estObjet(v) && '$value' in v;

/**
 * Fusionne `doc` dans `cible` (modifiée) : un jeton remplace le précédent en entier, un groupe se fusionne.
 * @param {Record<string, any>} cible @param {Record<string, any>} doc
 */
export function fusionner(cible, doc) {
  for (const [k, v] of Object.entries(doc ?? {})) {
    if (estObjet(v) && !estJeton(v) && !k.startsWith('$') && estObjet(cible[k]) && !estJeton(cible[k])) fusionner(cible[k], v);
    else cible[k] = structuredClone(v);
  }
  return cible;
}

/**
 * @typedef {{ ensemble: string, chemin: string | null, doc: any }} Source
 * @typedef {{ nom: string, jetons: any, sources: Source[], entrees: Record<string, string>, modifiers: Record<string, any> }} Resolu
 */

/**
 * Résout un resolver déjà lu.
 * @param {any} resolver contenu du resolver @param {string} base dossier depuis lequel se lisent les $ref de fichier
 * @param {Record<string, string>} [entrees] contexte choisi par modificateur
 * @returns {Resolu}
 */
export function resoudre(resolver, base, entrees = {}) {
  if (!estObjet(resolver)) throw new Error('resolver : objet JSON attendu');
  if (resolver.version !== VERSION) throw new Error(`resolver : version ${VERSION} attendue, lu ${resolver.version}`);
  if (!Array.isArray(resolver.resolutionOrder)) throw new Error('resolver : resolutionOrder manquant');
  const sets = resolver.sets ?? {};
  const modifiers = resolver.modifiers ?? {};
  for (const k of Object.keys(entrees)) if (!(k in modifiers)) throw new Error(`resolver : modificateur inconnu ${k}`);
  /** @type {Record<string, string>} */
  const choisis = {};
  for (const [nom, m] of Object.entries(modifiers)) {
    if (!estObjet(m?.contexts)) throw new Error(`resolver : modificateur ${nom} sans contexts`);
    const c = entrees[nom] ?? m.default;
    if (c === undefined) throw new Error(`resolver : modificateur ${nom} sans entrée ni défaut`);
    if (!Array.isArray(m.contexts[c])) throw new Error(`resolver : contexte inconnu ${nom}=${c} (connus : ${Object.keys(m.contexts).join(', ')})`);
    choisis[nom] = c;
  }
  /** @type {Source[]} */
  const sources = [];
  /** @param {any[]} liste @param {string} ensemble */
  const lire = (liste, ensemble) => {
    if (!Array.isArray(liste)) throw new Error(`resolver : sources de ${ensemble}, tableau attendu`);
    for (const s of liste) {
      if (estObjet(s) && typeof s.$ref === 'string') {
        if (s.$ref.startsWith('#')) throw new Error(`resolver : ${ensemble}, référence interne non lue dans une source (${s.$ref})`);
        const chemin = join(base, s.$ref);
        sources.push({ ensemble, chemin, doc: JSON.parse(readFileSync(chemin, 'utf8')) });
      } else if (estObjet(s)) sources.push({ ensemble, chemin: null, doc: s });
      else throw new Error(`resolver : ${ensemble}, source illisible`);
    }
  };
  for (const item of resolver.resolutionOrder) {
    const ref = estObjet(item) && typeof item.$ref === 'string' ? item.$ref : null;
    const m = ref ? /^#\/(sets|modifiers)\/([^/]+)$/.exec(ref) : null;
    if (!m) throw new Error(`resolver : resolutionOrder, { "$ref": "#/sets/<nom>" } ou "#/modifiers/<nom>" attendu`);
    const [, genre, nom] = m;
    if (genre === 'sets') {
      if (!estObjet(sets[nom])) throw new Error(`resolver : jeu inconnu ${nom}`);
      lire(sets[nom].sources, nom);
    } else {
      if (!estObjet(modifiers[nom])) throw new Error(`resolver : modificateur inconnu ${nom}`);
      lire(modifiers[nom].contexts[choisis[nom]], `${nom}:${choisis[nom]}`);
    }
  }
  const jetons = {};
  for (const s of sources) fusionner(jetons, s.doc);
  return { nom: resolver.name ?? '', jetons, sources, entrees: choisis, modifiers };
}

/**
 * Lit et résout un fichier resolver.
 * @param {string} chemin @param {Record<string, string>} [entrees]
 */
export function lireResolver(chemin, entrees = {}) {
  return resoudre(JSON.parse(readFileSync(chemin, 'utf8')), dirname(chemin), entrees);
}

/**
 * Resolver d'une marque. Les chemins se lisent depuis le dossier de la marque : les couches communes par leur chemin
 * relatif vers tokens/commun/ (« ../commun/ » pour tokens/<marque>/).
 * @param {{ nom: string, marque: string[], sombre?: string[], dossier?: string }} opts nom de la marque ; fichiers du jeu
 *   marque, dans l'ordre ; fichiers de la marque en sombre, après le commun sombre ; dossier de la marque
 *   (tokens/<marque>/ par défaut)
 */
export function modeleResolver({ nom, marque, sombre = [], dossier }) {
  const vers = dossier ? relative(dossier, COMMUN).split(sep).join('/') : '../commun';
  const commun = (/** @type {string} */ f) => ({ $ref: `${vers ? `${vers}/` : ''}${f}` });
  const ref = (/** @type {string} */ f) => ({ $ref: f });
  return {
    name: nom,
    version: VERSION,
    description: `Jeux de jetons de ${nom} et ses deux contextes, mode et largeur. Écrit par la saisie ; les rôles (semantique.tokens.json) sont les mêmes dans tous les contextes.`,
    sets: {
      primitives: {
        description: 'Primitives communes à toutes les marques : neutres, statuts, espaces, tailles de texte, graisses, rayons.',
        sources: [commun('primitives.tokens.json'), commun('statuts.tokens.json')],
      },
      marque: { description: `Échelles et couche marque de ${nom}.`, sources: marque.map(ref) },
      roles: { description: 'Rôles communs à toutes les marques.', sources: [commun('semantique.tokens.json')] },
    },
    modifiers: {
      mode: {
        description: 'Mode de couleur. Clair : valeurs des jeux. Sombre : échelles en miroir sous les mêmes noms, communes puis de la marque, et couche marque sombre (mêmes boutons qu\'en clair).',
        contexts: { clair: [], sombre: [commun('mode.sombre.tokens.json'), ...sombre.map(ref)] },
        default: 'clair',
      },
      largeur: {
        description: "Largeur de l'écran. Large : valeurs des jeux. Étroit : grands écarts et grands textes réduits (DS6).",
        contexts: { large: [], etroit: [commun('largeur.etroit.tokens.json')] },
        default: 'large',
        $extensions: { [LARGEUR]: { etroit: { sous: { value: 600, unit: 'px' }, seuil: '[H]' } } },
      },
    },
    resolutionOrder: [ref('#/sets/primitives'), ref('#/sets/marque'), ref('#/sets/roles'), ref('#/modifiers/mode'), ref('#/modifiers/largeur')],
  };
}

/**
 * Arbre résolu partagé en trois : rôles (groupes des sources du jeu roles), couche marque (groupe marque),
 * primitives (le reste).
 * @param {Resolu} r
 */
export function partager(r) {
  const groupesRoles = new Set(r.sources.filter((s) => s.ensemble === 'roles').flatMap((s) => Object.keys(s.doc).filter((k) => !k.startsWith('$'))));
  /** @type {Record<string, any>} */
  const semantique = {};
  /** @type {Record<string, any>} */
  const primitives = {};
  for (const [k, v] of Object.entries(r.jetons)) {
    if (k.startsWith('$') || k === 'marque') continue;
    (groupesRoles.has(k) ? semantique : primitives)[k] = v;
  }
  return { semantique, primitives, marque: r.jetons.marque ? { marque: r.jetons.marque } : {} };
}

/**
 * Seuil de l'étroit déclaré sur le modificateur largeur.
 * @param {Resolu} r @returns {{ sous: number, seuil: string }}
 */
export function seuilEtroit(r) {
  const x = r.modifiers.largeur?.$extensions?.[LARGEUR]?.etroit;
  if (x?.sous?.unit !== 'px' || typeof x?.sous?.value !== 'number') throw new Error(`resolver : seuil de l'étroit illisible ($extensions["${LARGEUR}"], px attendu)`);
  return { sous: x.sous.value, seuil: x.seuil ?? '' };
}

/**
 * Une marque dans ses deux largeurs, pour espacements et typo.
 * @param {string} [dossier] tokens/<marque>/ @param {{ mode?: string }} [opts]
 */
export function largeurs(dossier = ORBE, { mode } = {}) {
  const chemin = join(dossier, RESOLVER);
  const large = lireResolver(chemin, { ...(mode ? { mode } : {}), largeur: 'large' });
  const etroit = lireResolver(chemin, { ...(mode ? { mode } : {}), largeur: 'etroit' });
  const contexte = etroit.sources.filter((x) => x.ensemble === 'largeur:etroit').map((x) => x.doc);
  return { large: partager(large), etroit: { semantique: partager(etroit).semantique, ...seuilEtroit(etroit) }, contexte };
}

/**
 * Rôles en étroit d'une couche sémantique donnée : la couche, puis le contexte étroit par-dessus.
 * @param {any} semantique @param {any[]} contexte documents du contexte étroit
 */
export function enEtroit(semantique, contexte) {
  return contexte.reduce((acc, doc) => fusionner(acc, doc), structuredClone(semantique));
}
