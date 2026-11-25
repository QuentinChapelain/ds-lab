// @ts-check
/**
 * Le projet d'un parcours (D72) : projet.json, écrit par l'IA ou à la main. Il nomme le produit, ses sites (adresse,
 * échantillon de pages, entrée de la marque), la cible de la réduction et la racine des sorties. Chemins relatifs au
 * fichier. Toute faute de forme est une panne qui nomme la clé (D18) : la commande sort en 2.
 */
import { realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { lireJson } from '../lib/fichiers.js';
import { hostDirName } from '../lib/addresses.js';

/**
 * @typedef {{ id: string, nom: string | null, url: string, origine: string, hote: string, pages: string[], noms: Record<string, string>,
 *   entree: string | null, dossierMarque: string | null }} Site
 * Une page s'écrit par son chemin (`"/carte"`) ou avec son nom (`{ "path": "/carte", "name": "La carte" }`, D77) ;
 * `noms` garde le nom de chaque page qui en a un.
 * @typedef {{ fichier: string, dossier: string, produit: string, sites: Site[], cible: string | null, sources: string | null,
 *   signatures: string | null, sorties: string }} Projet
 */

const CLES = ['product', 'sites', 'target', 'sources', 'signatures', 'outputs'];
const CLES_SITE = ['id', 'name', 'url', 'pages', 'brand'];

/**
 * Lit et contrôle projet.json.
 * @param {string} fichier
 * @returns {Projet}
 */
export function lireProjet(fichier) {
  const p = lireJson(fichier);
  // Le chemin réel : les commandes proposées s'écrivent depuis le dossier courant, que le système donne réel.
  const dossier = realpathSync(dirname(resolve(fichier)));
  /** @param {string} m */
  const faute = (m) => new Error(`${fichier} : ${m}`);
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw faute('un objet JSON est attendu');
  for (const k of Object.keys(p)) if (!CLES.includes(k)) throw faute(`clé inconnue ${k} (${CLES.join(', ')})`);
  /** @param {string} k */
  const texte = (k) => {
    if (typeof p[k] !== 'string' || !p[k].trim()) throw faute(`clé ${k} absente ou vide`);
    return p[k];
  };
  /** @param {string} k */
  const chemin = (k) => (p[k] === undefined ? null : resolve(dossier, texte(k)));
  const produit = texte('product');
  const sorties = resolve(dossier, texte('outputs'));
  if (!Array.isArray(p.sites) || !p.sites.length) throw faute('clé sites absente ou vide : un site au moins');
  /** @type {Site[]} */
  const sites = p.sites.map((/** @type {any} */ s, /** @type {number} */ i) => {
    const ou = `sites[${i + 1}]`;
    if (!s || typeof s !== 'object' || Array.isArray(s)) throw faute(`${ou} : un objet est attendu`);
    for (const k of Object.keys(s)) if (!CLES_SITE.includes(k)) throw faute(`${ou} : clé inconnue ${k} (${CLES_SITE.join(', ')})`);
    if (typeof s.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.id)) throw faute(`${ou}.id : minuscules, chiffres et tirets attendus`);
    let adresse;
    try {
      adresse = new URL(s.url);
    } catch {
      throw faute(`${ou}.url : adresse http ou https attendue`);
    }
    if (!/^https?:$/.test(adresse.protocol)) throw faute(`${ou}.url : adresse http ou https attendue`);
    const brutes = s.pages ?? [];
    const chemin = (/** @type {any} */ x) => (typeof x === 'string' ? x : x && typeof x === 'object' && !Array.isArray(x) ? x.path : null);
    const valide = (/** @type {any} */ x) =>
      typeof chemin(x) === 'string' &&
      chemin(x).startsWith('/') &&
      (typeof x === 'string' || (Object.keys(x).every((k) => k === 'path' || k === 'name') && (x.name === undefined || (typeof x.name === 'string' && x.name.trim()))));
    if (!Array.isArray(brutes) || !brutes.every(valide))
      throw faute(`${ou}.pages : une liste est attendue, chaque page un chemin qui commence par /, ou { path, name }`);
    /** @type {string[]} */
    const pages = brutes.map(chemin);
    /** @type {Record<string, string>} */
    const noms = Object.fromEntries(brutes.filter((/** @type {any} */ x) => typeof x === 'object' && x.name).map((/** @type {any} */ x) => [x.path, x.name.trim()]));
    if (s.name !== undefined && (typeof s.name !== 'string' || !s.name.trim())) throw faute(`${ou}.name : un nom est attendu`);
    if (s.brand !== undefined && (typeof s.brand !== 'string' || !s.brand.trim())) throw faute(`${ou}.brand : chemin de l'entrée de la marque attendu`);
    const entree = s.brand === undefined ? null : resolve(dossier, s.brand);
    return { id: s.id, nom: s.name ?? null, url: s.url, origine: adresse.origin, hote: hostDirName(adresse.host), pages, noms, entree, dossierMarque: entree && dirname(entree) };
  });
  const vus = new Set();
  for (const s of sites) {
    if (vus.has(s.id)) throw faute(`id en double : ${s.id}`);
    vus.add(s.id);
  }
  return { fichier: resolve(dossier, resolve(fichier).split(/[\\/]/).at(-1) ?? ''), dossier, produit, sites, cible: chemin('target'), sources: chemin('sources'), signatures: chemin('signatures'), sorties };
}

/**
 * Réécrit les pages d'un site dans projet.json, sans toucher au reste du fichier (D77) : l'écran des pages retire et
 * ajoute. Chaque page garde son nom.
 * @param {string} fichier @param {string} id @param {{ path: string, name?: string }[]} pages
 */
export function ecrirePages(fichier, id, pages) {
  const p = lireJson(fichier);
  const s = (p.sites ?? []).find((/** @type {any} */ x) => x?.id === id);
  if (!s) throw new Error(`${fichier} : aucun site ${id}`);
  s.pages = pages.map((x) => (x.name ? { path: x.path, name: x.name } : x.path));
  writeFileSync(fichier, `${JSON.stringify(p, null, 2)}\n`);
}

/**
 * Nomme l'entrée de la marque d'un site dans projet.json (`brand`), sans toucher au reste du fichier (D80).
 * @param {string} fichier @param {string} id @param {string} chemin  relatif au dossier du projet
 */
export function ecrireMarque(fichier, id, chemin) {
  const p = lireJson(fichier);
  const s = (p.sites ?? []).find((/** @type {any} */ x) => x?.id === id);
  if (!s) throw new Error(`${fichier} : aucun site ${id}`);
  s.brand = chemin;
  writeFileSync(fichier, `${JSON.stringify(p, null, 2)}\n`);
}
