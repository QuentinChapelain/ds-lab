// @ts-check
/**
 * D68 : le point de départ de chaque exercice du banc. Une base, l'app de fixtures/app-fictive/, et des couches de
 * fichiers posées dessus dans l'ordre (fixtures/banc/exercices.json) : ce que les départs partagent n'est écrit qu'une
 * fois. Ce qui vient de ds-lab n'est pas recopié dans fixtures/ : composants et fiches sont copiés, jetons et thèmes
 * écrits par les commandes du clone qu'on donne, comme une équipe le ferait.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { copierArbre, executer } from './outils.js';

/**
 * @typedef {{ couches: string[], retires: string[], copies: { de: string, vers: string, sauf?: string[] }[], saisir: boolean,
 *   brief: string | null, pages: string[] }} Exercice
 */

/** Ce que disent les exercices, lu dans fixtures/banc/exercices.json. @param {string} depot */
export const exercices = (depot) =>
  /** @type {{ caches: string[], signaux: { plusTard: Record<string, string>, refait: string }, exercices: Record<string, Exercice> }} */ (JSON.parse(readFileSync(join(depot, 'fixtures', 'banc', 'exercices.json'), 'utf8')));

/** Les marques de l'app, chacune par son dossier de tokens/. @param {string} depot */
export const marquesDuBanc = (depot) => /** @type {string[]} */ (JSON.parse(readFileSync(join(depot, 'fixtures', 'app-fictive', 'banc.json'), 'utf8')).marques);

/**
 * Fabrique l'app de départ d'un exercice, sans l'installer.
 * @param {{ depot: string, clone: string, exercice: string, app: string }} o depot : la racine de ds-lab qui porte la base
 *   et les couches ; clone : celle dont viennent les composants, les fiches et les commandes (la copie d'un passage, qui
 *   n'a ni base ni couches) ; app : le dossier à remplir
 */
export function fabriquer(o) {
  const tous = exercices(o.depot).exercices;
  const e = tous[o.exercice];
  if (!e) throw new Error(`exercice inconnu : ${o.exercice} (${Object.keys(tous).join(', ')})`);
  copierArbre(join(o.depot, 'fixtures', 'app-fictive'), o.app, (f) => f !== 'banc.json' && !e.retires.includes(f));
  for (const c of e.couches) copierArbre(join(o.depot, 'fixtures', 'banc', c), o.app, () => true);
  for (const c of e.copies) copierArbre(join(o.clone, c.de), join(o.app, c.vers), (f) => !(c.sauf ?? []).includes(f));
  if (!e.saisir) return;
  for (const m of marquesDuBanc(o.depot)) {
    executer(process.execPath, [join(o.clone, 'src', 'cli', 'saisie.js'), `tokens/${m}/entree.json`], { cwd: o.app });
    executer(process.execPath, [join(o.clone, 'src', 'cli', 'vuetify.js'), '--marque', `tokens/${m}`], { cwd: o.app });
  }
}
