// @ts-check
/**
 * Le fichier d'avancement de la mesure (D93) : l'état de chaque page relevée par l'audit, et celui du relevé des
 * composants de chaque site, que l'écran de la mesure relit à chaque rechargement. Les commandes se suivent (l'une
 * après l'autre, jamais ensemble) : chaque note relit le fichier, le complète et le réécrit en entier.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * @typedef {'en cours' | 'mesurée' | 'pas mesurée'} EtatPage
 * @typedef {'en cours' | 'fait' | 'pas fait'} EtatReleve
 * @typedef {{ pages: Record<string, EtatPage>, releves: Record<string, EtatReleve> }} Avancement
 *   pages : par adresse entière ; releves : par dossier de sortie du relevé, en chemin absolu
 */

/** L'avancement écrit, ou un avancement vide. Un fichier illisible vaut un avancement vide. @param {string} fichier @returns {Avancement} */
export function lireAvancement(fichier) {
  if (!existsSync(fichier)) return { pages: {}, releves: {} };
  try {
    const a = JSON.parse(readFileSync(fichier, 'utf8'));
    return { pages: a.pages ?? {}, releves: a.releves ?? {} };
  } catch {
    return { pages: {}, releves: {} };
  }
}

/** Note l'état d'une page. @param {string} fichier @param {string} url @param {EtatPage} etat */
export function noterPage(fichier, url, etat) {
  const a = lireAvancement(fichier);
  a.pages[url] = etat;
  ecrire(fichier, a);
}

/** Note l'état du relevé des composants écrit dans `out`. @param {string} fichier @param {string} out @param {EtatReleve} etat */
export function noterReleve(fichier, out, etat) {
  const a = lireAvancement(fichier);
  a.releves[resolve(out)] = etat;
  ecrire(fichier, a);
}

/** @param {string} fichier @param {Avancement} a */
function ecrire(fichier, a) {
  mkdirSync(dirname(fichier), { recursive: true });
  writeFileSync(fichier, `${JSON.stringify(a, null, 2)}\n`);
}
