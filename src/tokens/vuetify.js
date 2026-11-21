// @ts-check
/**
 * Thèmes Vuetify d'une marque, clair et sombre, depuis ses jetons résolus et la table commune
 * tokens/commun/vuetify.json (D41). Chaque couleur de la table nomme un fond et son texte : le thème porte <clé> et
 * on-<clé>, si bien que Vuetify ne calcule aucun texte. Les polices passent par les variables du thème, que Vuetify
 * écrit en --v-font-body et --v-font-heading.
 * La table est vérifiée avant toute marque : chaque fond et son texte forment une paire de texte de paires.json
 * (contrôlée par npm run contraste), et aucune clé n'est écrite en on-. Un rôle absent d'une marque lève.
 * Les variables de la table (traits et dimensions de l'enveloppe du bouton) vont aussi dans les variables du thème,
 * sous une clé en ds- : une couleur en hex (Vuetify l'écrit en r, g, b), une dimension en px, un nombre tel quel, une
 * police en liste CSS (famille) ; field
 * prend une partie d'un style de texte. Une variable de couleur est le trait devant d'une paire de paires.json, ou porte
 * sa raison (unpaired) ; sinon, panne.
 */
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { COMMUN, nomDeMarque } from './resolver.js';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from './roles.js';
import { serialiser } from './saisie.js';
import { famille } from '../lib/format.js';

/** Fichier des thèmes, dans le dossier de chaque marque. */
export const THEMES = 'vuetify.json';
/** Modes du resolver, et la valeur dark de Vuetify qui va avec. */
const MODES = /** @type {const} */ ([['clair', false], ['sombre', true]]);

/** Parties d'un style de texte qu'une variable peut prendre. */
const CHAMPS = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'];
/** Préfixe des variables de la table : aucune variable de Vuetify ne le porte. */
const PREFIXE = 'ds-';

/**
 * @typedef {{ jeton: string, champ?: string, paire: boolean, sansPaire?: string }} Variable
 * @typedef {{ couleurs: Record<string, { fond: string, texte: string }>, polices: Record<string, { jeton: string }>, variables: Record<string, Variable> }} Table
 */

/** Clés d'un objet de la table, sans les clés DTCG ($description). @param {Record<string, any>} o */
const cles = (o) => Object.keys(o ?? {}).filter((k) => !k.startsWith('$'));

/**
 * Table de correspondance vérifiée.
 * @param {any} [brute] contenu de tokens/commun/vuetify.json @param {any} [paires] contenu de paires.json
 * @returns {Table}
 */
export function lireTable(brute = JSON.parse(readFileSync(join(COMMUN, 'vuetify.json'), 'utf8')), paires = JSON.parse(readFileSync(join(COMMUN, 'paires.json'), 'utf8'))) {
  /** @type {Table} */
  const table = { couleurs: {}, polices: {}, variables: {} };
  for (const k of cles(brute.colors)) {
    if (k.startsWith('on-')) throw new Error(`table Vuetify : clé en on- : ${k}`);
    const { background: fond, text: texte } = brute.colors[k];
    const paire = (paires.pairs ?? []).some((/** @type {any} */ p) => p.type === 'text' && p.background === fond && p.foreground === texte);
    if (!paire) throw new Error(`table Vuetify : paire hors de paires.json : ${texte} sur ${fond} (${k})`);
    table.couleurs[k] = { fond, texte };
  }
  for (const k of cles(brute.fonts)) table.polices[k] = { jeton: brute.fonts[k].token };
  for (const k of cles(brute.variables)) {
    if (!k.startsWith(PREFIXE)) throw new Error(`table Vuetify : variable sans le préfixe ${PREFIXE} : ${k}`);
    const { token: jeton, field: champ, unpaired: sansPaire } = brute.variables[k];
    if (typeof jeton !== 'string' || !jeton) throw new Error(`table Vuetify : variable sans jeton : ${k}`);
    if (champ !== undefined && !CHAMPS.includes(champ)) throw new Error(`table Vuetify : field inconnu : ${champ} (${k} ; ${CHAMPS.join(', ')})`);
    if (sansPaire !== undefined && !(typeof sansPaire === 'string' && sansPaire.trim())) throw new Error(`table Vuetify : unpaired vide : ${k}`);
    const paire = (paires.pairs ?? []).some((/** @type {any} */ p) => p.foreground === jeton);
    if (paire && sansPaire !== undefined) throw new Error(`table Vuetify : unpaired sur un trait qui a sa paire : ${jeton} (${k})`);
    table.variables[k] = { jeton, ...(champ ? { champ } : {}), paire, ...(sansPaire ? { sansPaire } : {}) };
  }
  return table;
}

/**
 * Valeur d'une variable du thème : hex d'une couleur, px d'une dimension, nombre tel quel, liste CSS d'une police.
 * @param {Map<string, any>} jetons @param {string} cle @param {Variable} v @param {string} ou marque et mode, pour les messages
 */
function valeurVariable(jetons, cle, v, ou) {
  const t = jetons.get(v.jeton);
  if (!t) throw new Error(`table Vuetify : jeton absent : ${v.jeton} (${ou})`);
  let { valeur } = resoudreAlias(jetons, t.$value, { depuis: v.jeton, chaine: [v.jeton] });
  if (v.champ) {
    if (!valeur || typeof valeur !== 'object' || !(v.champ in valeur)) throw new Error(`table Vuetify : ${v.jeton} n'a pas de champ ${v.champ} (${cle})`);
    valeur = resoudreAlias(jetons, valeur[v.champ], { depuis: v.jeton, chaine: [v.jeton] }).valeur;
  }
  if (typeof valeur === 'number') return String(valeur);
  if (Array.isArray(valeur) && valeur.length && valeur.every((f) => typeof f === 'string')) return famille(valeur);
  if (typeof valeur?.hex === 'string') {
    if (!v.paire && !v.sansPaire) throw new Error(`table Vuetify : couleur sans paire : ${v.jeton} (${cle}) ; la déclarer dans paires.json, ou dire pourquoi (unpaired)`);
    return valeur.hex.toLowerCase();
  }
  if (typeof valeur?.value === 'number' && valeur.unit === 'px') return `${valeur.value}px`;
  throw new Error(`table Vuetify : valeur illisible pour ${cle} : ${v.jeton} (couleur, dimension en px, nombre ou police attendus)`);
}

/**
 * Thèmes clair et sombre d'une marque, nommés <dossier>-clair et <dossier>-sombre, et son nom lu dans le resolver.
 * @param {string} dossier tokens/<marque>/ @param {Table} [table]
 * @returns {{ nom: string, themes: Record<string, { dark: boolean, colors: Record<string, string>, variables: Record<string, string> }> }}
 */
export function themesVuetify(dossier, table = lireTable()) {
  const slug = basename(dossier);
  /** @type {Record<string, { dark: boolean, colors: Record<string, string>, variables: Record<string, string> }>} */
  const themes = {};
  for (const [mode, dark] of MODES) {
    const set = loadRoles(dossier, { mode });
    const roles = resolveRoles(set.semantique, set.primitives, set.marque);
    /** @param {string} role */
    const hex = (role) => {
      const r = roles.get(role);
      if (!r) throw new Error(`table Vuetify : rôle absent : ${role} (${slug}, ${mode})`);
      return r.hex;
    };
    /** @type {Record<string, string>} */
    const colors = {};
    for (const [k, { fond, texte }] of Object.entries(table.couleurs)) {
      colors[k] = hex(fond);
      colors[`on-${k}`] = hex(texte);
    }
    const jetons = new Map([...flattenTokens(set.primitives), ...flattenTokens(set.marque)]);
    /** @type {Record<string, string>} */
    const variables = {};
    for (const [k, { jeton }] of Object.entries(table.polices)) {
      const t = jetons.get(jeton);
      if (!t) throw new Error(`table Vuetify : jeton absent : ${jeton} (${slug}, ${mode})`);
      variables[k] = famille(resoudreAlias(jetons, t.$value, { depuis: jeton, chaine: [jeton] }).valeur);
    }
    const tous = new Map([...jetons, ...flattenTokens(set.semantique)]);
    for (const [k, v] of Object.entries(table.variables)) variables[k] = valeurVariable(tous, k, v, `${slug}, ${mode}`);
    themes[`${slug}-${mode}`] = { dark, colors, variables };
  }
  return { nom: nomDeMarque(dossier), themes };
}

/**
 * Texte de tokens/<marque>/vuetify.json : thèmes de la marque, précédés d'une description.
 * @param {string} dossier @param {Table} [table]
 */
export function texteThemes(dossier, table = lireTable()) {
  const { nom, themes } = themesVuetify(dossier, table);
  return serialiser({
    $description: `Thèmes Vuetify de ${nom}, clair et sombre, écrits par npm run vuetify depuis marque.resolver.json et tokens/commun/vuetify.json. Ne pas modifier à la main.`,
    nom,
    themes,
  });
}
