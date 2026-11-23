#!/usr/bin/env node
// @ts-check
/**
 * D71 : le carnet. Ajoute une ligne à carnet.md, datée par la commande et non par l'IA : une heure vraie dit si le choix
 * a été écrit avant d'être appliqué.
 * Usage : node "$DS_LAB/src/cli/carnet.js" --question "…" (--choix "…" | --reponse "…") [--fichier <chemin>]
 *   --question : ce que la demande ne disait pas ; --choix : ce que l'agent a décidé ; --reponse : ce que l'humain a
 *   répondu, à la place de --choix. carnet.md est cherché dans le dossier courant, puis dans ses parents. L'heure est
 *   celle de la machine, à la seconde, avec son décalage (2026-11-23T15:41:07+01:00). Une barre et un retour à la ligne
 *   sont échappés dans la cellule.
 * Sortie 0, ou 2 sur une panne (D18).
 */
import { parseArgs } from 'node:util';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { lancer } from './garde.js';

const USAGE = 'node "$DS_LAB/src/cli/carnet.js" --question "…" (--choix "…" | --reponse "…") [--fichier <chemin>]';

/** L'heure locale à la seconde, avec son décalage. @param {Date} d */
function heureLocale(d) {
  const p = (/** @type {number} */ n) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const decalage = -d.getTimezoneOffset();
  const signe = decalage >= 0 ? '+' : '-';
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}${signe}${p(decalage / 60)}:${p(decalage % 60)}`;
}

/** Une cellule de tableau : barres échappées, retours à la ligne en espaces. @param {string} t */
const cellule = (t) => t.trim().replace(/\|/g, '\\|').replace(/\s*\r?\n\s*/g, ' ');

await lancer('carnet', async () => {
  const { values } = parseArgs({ options: { question: { type: 'string' }, choix: { type: 'string' }, reponse: { type: 'string' }, fichier: { type: 'string' } } });
  if (!values.question?.trim()) throw new Error(`--question "…" attendu : ce que la demande ne disait pas ; usage : ${USAGE}`);
  if (values.choix !== undefined && values.reponse !== undefined) throw new Error(`--choix ou --reponse, pas les deux : --reponse si l'humain a répondu, sinon --choix ; usage : ${USAGE}`);
  const suite = values.reponse ?? values.choix;
  if (!suite?.trim()) throw new Error(`--choix "…" attendu (ce que tu as décidé), ou --reponse "…" si l'humain a répondu ; usage : ${USAGE}`);
  let dossier = process.cwd();
  while (!existsSync(join(dossier, 'carnet.md')) && dirname(dossier) !== dossier) dossier = dirname(dossier);
  const carnet = join(dossier, 'carnet.md');
  if (!existsSync(carnet)) throw new Error(`carnet.md introuvable dans ${process.cwd()} ni ses parents : lancer depuis le dépôt de l'équipe, ou poser le carnet (node "$DS_LAB/src/cli/relecteur.js" --poser …)`);
  const ligne = `| ${heureLocale(new Date())} | ${cellule(values.question)} | ${values.reponse !== undefined ? 'réponse' : 'choix'} : ${cellule(suite)} | ${values.fichier ? cellule(values.fichier) : '—'} |`;
  appendFileSync(carnet, `${readFileSync(carnet, 'utf8').endsWith('\n') ? '' : '\n'}${ligne}\n`);
  console.log(`carnet : ligne ajoutée à ${carnet}`);
  return 0;
});
