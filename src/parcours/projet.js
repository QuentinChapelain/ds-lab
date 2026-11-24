// @ts-check
/**
 * Le projet d'un parcours (D72) : projet.json, écrit par l'IA ou à la main. Il nomme le produit, ses sites (adresse,
 * échantillon de pages, entrée de la marque), la cible de la réduction et la racine des sorties. Chemins relatifs au
 * fichier. Toute faute de forme est une panne qui nomme la clé (D18) : la commande sort en 2.
 */
import { realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { lireJson } from '../lib/fichiers.js';
import { hostDirName } from '../lib/addresses.js';

/**
 * @typedef {{ id: string, url: string, origine: string, hote: string, pages: string[], entree: string | null, dossierMarque: string | null }} Site
 * @typedef {{ fichier: string, dossier: string, produit: string, sites: Site[], cible: string | null, sources: string | null,
 *   signatures: string | null, sorties: string }} Projet
 */

const CLES = ['product', 'sites', 'target', 'sources', 'signatures', 'outputs'];
const CLES_SITE = ['id', 'url', 'pages', 'brand'];

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
    const pages = s.pages ?? [];
    if (!Array.isArray(pages) || pages.some((x) => typeof x !== 'string' || !x.startsWith('/'))) throw faute(`${ou}.pages : une liste de chemins qui commencent par / est attendue`);
    if (s.brand !== undefined && (typeof s.brand !== 'string' || !s.brand.trim())) throw faute(`${ou}.brand : chemin de l'entrée de la marque attendu`);
    const entree = s.brand === undefined ? null : resolve(dossier, s.brand);
    return { id: s.id, url: s.url, origine: adresse.origin, hote: hostDirName(adresse.host), pages, entree, dossierMarque: entree && dirname(entree) };
  });
  const vus = new Set();
  for (const s of sites) {
    if (vus.has(s.id)) throw faute(`id en double : ${s.id}`);
    vus.add(s.id);
  }
  return { fichier: resolve(dossier, resolve(fichier).split(/[\\/]/).at(-1) ?? ''), dossier, produit, sites, cible: chemin('target'), sources: chemin('sources'), signatures: chemin('signatures'), sorties };
}
