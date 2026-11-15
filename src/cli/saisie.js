#!/usr/bin/env node
// @ts-check
/**
 * Étape 4, séance a, lot 1 : saisie d'une marque. Lit tokens/<marque>/entree.json, génère les échelles et la couche
 * marque, refuse avec motif (entrée invalide, checkValise, paire de rôles en échec) ou écrit marque.tokens.json
 * (et echelles.tokens.json si une échelle est générée), le mode sombre (echelles.sombre.tokens.json,
 * marque.sombre.tokens.json) et le resolver marque.resolver.json dans le dossier de l'entrée,
 * puis lance le contrôle de contraste dans les deux modes (étape 4b, lot 3).
 * Étape 4c, lot 3 : si l'entrée donne les fichiers de la police des titres, contrôle d'encre dans Chromium avant
 * d'écrire ; refus si l'encre de deux lignes se touche ; sinon la table des mesures est affichée.
 * Sort en 0 si la marque est acceptée, en 1 si elle est refusée (rien n'est écrit).
 * Revue de code du 15/11, lot 1a (D18) : en 2 sur une panne, par la garde commune (src/cli/garde.js) : aucun fichier
 * donné, fichier absent ou illisible, couche commune cassée, Chromium qui ne se lance pas ; rien n'est écrit. Exception :
 * le contrôle contraste relancé après écriture ; s'il ne conclut pas (2), ou s'il trouve une paire en échec (1, une
 * incohérence de l'outil, puisqu'un refus n'écrit rien), la commande sort en 2, fichiers écrits, et le dit.
 * Usage : npm run saisie -- <entree.json>
 */
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { saisir, serialiser, controlerEncre } from '../tokens/saisie.js';
import { RESOLVER } from '../tokens/resolver.js';
import { decrirePolice } from '../polices/lecture.js';
import { tableEncre } from '../polices/encre.js';
import { lancer, lireJson } from './garde.js';

await lancer('saisie', async () => {
  const fichier = process.argv[2];
  if (!fichier) throw new Error('aucun fichier d\'entrée (usage : npm run saisie -- <entree.json>)');
  const dossier = dirname(fichier);
  const entree = lireJson(fichier);
  const r = saisir(entree, { dossier });
  const nom = typeof entree?.nom === 'string' && entree.nom.trim() ? entree.nom : fichier;
  /** @type {import('../polices/encre.js').LigneEncre[]} */
  let encre = [];
  if (!r.motifs.length && r.policeTitre?.controlee) {
    const e = await controlerEncre(r.policeTitre, { dossier, commun: r.commun });
    encre = e.lignes;
    r.motifs.push(...e.motifs);
  }
  if (r.motifs.length) {
    console.error(`marque refusée : ${nom}`);
    for (const m of r.motifs) console.error(`  ${m}`);
    return 1;
  }
  writeFileSync(join(dossier, 'marque.tokens.json'), serialiser(r.marque));
  const echelles = join(dossier, 'echelles.tokens.json');
  if (r.echelles) writeFileSync(echelles, serialiser(r.echelles));
  else if (existsSync(echelles)) rmSync(echelles);
  writeFileSync(join(dossier, 'echelles.sombre.tokens.json'), serialiser(r.echellesSombres));
  writeFileSync(join(dossier, 'marque.sombre.tokens.json'), serialiser(r.marqueSombre));
  writeFileSync(join(dossier, RESOLVER), serialiser(r.resolver));
  console.log(`marque acceptée : ${nom}`);
  // Étape 4c : la police des titres, contrôlée si l'entrée donne ses fichiers ; « non contrôlée » n'est écrit qu'ici.
  const pt = r.policeTitre;
  if (pt) {
    console.log(`police des titres : ${pt.familles.join(', ')}, ${pt.controlee ? 'contrôlée' : 'non contrôlée (aucun fichier)'}`);
    for (const f of pt.fichiers) console.log(`  ${f.chemin} : ${decrirePolice(f.police)}`);
    if (encre.length) {
      console.log(`encre de deux lignes, consigne de hauteur de capitale ${String(encre[0].consigne).replace('.', ',')} (aucun écart nul ou négatif) :`);
      for (const l of tableEncre(encre)) console.log(`  ${l}`);
    }
  }
  console.log(`écrit : ${join(dossier, 'marque.tokens.json')}${r.echelles ? `, ${echelles}` : ''}, mode sombre, ${join(dossier, RESOLVER)}`);
  // Contrôle final, relancé sur les fichiers écrits (D18 : exception à « rien n'est écrit »). La marque a déjà passé ses
  // paires en mémoire : une paire en échec ici est une incohérence de l'outil, pas un refus.
  const contraste = fileURLToPath(new URL('./contraste.js', import.meta.url));
  const codes = ['clair', 'sombre'].map((mode) => spawnSync(process.execPath, [contraste, '--marque', dossier, '--mode', mode], { stdio: 'inherit' }).status);
  if (codes.includes(1))
    throw new Error(`incohérence de l'outil : fichiers écrits dans ${dossier}, mais le contrôle final trouve une paire en échec que la saisie avait acceptée`);
  if (codes.some((c) => c !== 0)) throw new Error(`fichiers écrits dans ${dossier}, mais le contrôle final (npm run contraste) n'a pas conclu`);
  return 0;
});
