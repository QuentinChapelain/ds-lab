#!/usr/bin/env node
// @ts-check
/**
 * Saisie d'une marque. Lit tokens/<marque>/entree.json, génère les échelles et la couche
 * marque, refuse avec motif (entrée invalide, checkValise, paire de rôles en échec) ou écrit marque.tokens.json
 * (et echelles.tokens.json si une échelle est générée), le mode sombre (echelles.sombre.tokens.json,
 * marque.sombre.tokens.json) et le resolver marque.resolver.json dans le dossier de l'entrée, et affiche le contrôle de
 * contraste dans les deux modes.
 * Si l'entrée donne les fichiers de la police des titres, contrôle d'encre dans Chromium avant
 * d'écrire ; refus si l'encre de deux lignes se touche ; sinon la table des mesures est affichée.
 * Sort en 0 si la marque est acceptée, en 1 si elle est refusée (rien n'est écrit).
 * D18 : en 2 sur une panne, par la garde commune (src/cli/garde.js) : aucun fichier
 * donné, fichier absent ou illisible, couche commune cassée, Chromium qui ne se lance pas ; rien n'est écrit.
 * D31 : les fichiers sont écrits à côté, contrôlés (contraste dans les deux modes, sur les textes
 * relus), puis remplacent les fichiers en place (remplacer, src/tokens/ecriture.js) ; un contrôle en échec (incohérence de
 * l'outil) ou une panne d'écriture sort en 2 sans rien laisser d'écrit. Plus de sous-processus.
 * --verdict <fichier> écrit en plus, acceptée ou refusée, le verdict et ses motifs, avec l'empreinte de l'entrée (D72) :
 * un refus laisse ainsi une trace que la commande parcours relit ; sans l'option, rien ne change.
 * Usage : npm run saisie -- <entree.json> [--verdict <fichier>]
 */
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { saisir, serialiser, controlerEncre, controlerEcrits } from '../tokens/saisie.js';
import { remplacer } from '../tokens/ecriture.js';
import { lignesContraste } from '../report/contraste.js';
import { RESOLVER } from '../tokens/resolver.js';
import { decrirePolice } from '../polices/lecture.js';
import { tableEncre } from '../polices/encre.js';
import { lancer } from './garde.js';
import { lireJson } from '../lib/fichiers.js';
import { fr } from '../lib/format.js';

await lancer('saisie', async () => {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { verdict: { type: 'string' } } });
  const fichier = positionals[0];
  const usage = '(usage : npm run saisie -- <entree.json> [--verdict <fichier>])';
  if (!fichier) throw new Error(`aucun fichier d'entrée ${usage}`);
  if (positionals.length > 1) throw new Error(`un seul fichier d'entrée ${usage}`);
  const dossier = dirname(fichier);
  const entree = lireJson(fichier);
  /** Le verdict, écrit seulement si --verdict est donné. @param {'acceptée' | 'refusée'} verdict @param {string[]} motifs */
  const ecrireVerdict = (verdict, motifs) => {
    if (!values.verdict) return;
    const empreinte = createHash('sha256').update(readFileSync(fichier)).digest('hex');
    mkdirSync(dirname(values.verdict), { recursive: true });
    writeFileSync(values.verdict, JSON.stringify({ name: nom, verdict, motifs, entree: empreinte }, null, 2) + '\n');
  };
  const r = saisir(entree, { dossier });
  const nom = typeof entree?.name === 'string' && entree.name.trim() ? entree.name : fichier;
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
    ecrireVerdict('refusée', r.motifs);
    return 1;
  }
  const echelles = join(dossier, 'echelles.tokens.json');
  /** @type {[string, any][]} */
  const docs = [
    ['marque.tokens.json', r.marque],
    ...(r.echelles ? /** @type {[string, any][]} */ ([['echelles.tokens.json', r.echelles]]) : []),
    ['echelles.sombre.tokens.json', r.echellesSombres],
    ['marque.sombre.tokens.json', r.marqueSombre],
    [RESOLVER, r.resolver],
  ];
  // Une échelle générée devenue échelle nommée : echelles.tokens.json n'est supprimé qu'au remplacement final.
  const controles = remplacer(
    dossier,
    docs.map(([nom, doc]) => /** @type {[string, string]} */ ([nom, serialiser(doc)])),
    { supprimer: r.echelles ? [] : ['echelles.tokens.json'], controler: (lus) => controlerEcrits(dossier, lus) },
  );
  console.log(`marque acceptée : ${nom}`);
  ecrireVerdict('acceptée', []);
  // La police des titres, contrôlée si l'entrée donne ses fichiers ; « non contrôlée » n'est écrit qu'ici.
  const pt = r.policeTitre;
  if (pt) {
    console.log(`police des titres : ${pt.familles.join(', ')}, ${pt.controlee ? 'contrôlée' : 'non contrôlée (aucun fichier)'}`);
    for (const f of pt.fichiers) console.log(`  ${f.chemin} : ${decrirePolice(f.police)}`);
    if (encre.length) {
      console.log(`encre de deux lignes, consigne de hauteur de capitale ${fr(encre[0].consigne)} (aucun écart nul ou négatif) :`);
      for (const l of tableEncre(encre)) console.log(`  ${l}`);
    }
  }
  console.log(`écrit : ${join(dossier, 'marque.tokens.json')}${r.echelles ? `, ${echelles}` : ''}, mode sombre, ${join(dossier, RESOLVER)}`);
  // Contrôle final, fait sur les fichiers écrits à côté, avant remplacement : son texte, comme npm run contraste.
  for (const [mode, c] of controles ?? []) for (const l of lignesContraste(c, { mode })) console.log(l);
  return 0;
});
