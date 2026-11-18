// @ts-check
/**
 * Thèmes Vuetify d'une marque, clair et sombre, depuis ses jetons résolus et la table commune
 * tokens/commun/vuetify.json (D41). Chaque couleur de la table nomme un fond et son texte : le thème porte <clé> et
 * on-<clé>, si bien que Vuetify ne calcule aucun texte. Les polices passent par les variables du thème, que Vuetify
 * écrit en --v-font-body et --v-font-heading.
 * La table est vérifiée avant toute marque : chaque fond et son texte forment une paire de texte de paires.json
 * (contrôlée par npm run contraste), et aucune clé n'est écrite en on-. Un rôle absent d'une marque lève.
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

/**
 * @typedef {{ couleurs: Record<string, { fond: string, texte: string }>, polices: Record<string, { jeton: string }> }} Table
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
  const table = { couleurs: {}, polices: {} };
  for (const k of cles(brute.couleurs)) {
    if (k.startsWith('on-')) throw new Error(`table Vuetify : clé en on- : ${k}`);
    const { fond, texte } = brute.couleurs[k];
    const paire = (paires.paires ?? []).some((/** @type {any} */ p) => p.type === 'texte' && p.fond === fond && p.devant === texte);
    if (!paire) throw new Error(`table Vuetify : paire hors de paires.json : ${texte} sur ${fond} (${k})`);
    table.couleurs[k] = { fond, texte };
  }
  for (const k of cles(brute.polices)) table.polices[k] = { jeton: brute.polices[k].jeton };
  return table;
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
