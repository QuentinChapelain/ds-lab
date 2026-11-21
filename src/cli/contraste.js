#!/usr/bin/env node
// @ts-check
/**
 * T3 : contrôle des paires de rôles d'une marque.
 * Sort en 1 si une paire est sous son seuil sans exception écrite, sinon en 0.
 * Le contrat par échelle (contractOf) est affiché pour information ; il ne change pas le code de sortie.
 * --marque <dossier> contrôle la marque de ce dossier. D26 : sans l'option, chaque
 * marque de tokens/, un bloc par marque (parMarque, src/cli/garde.js) ; sortie 1 si une marque échoue.
 * La marque se lit par son resolver (marque.resolver.json), avec les couches communes de tokens/commun/.
 * --mode light|dark et --largeur wide|narrow choisissent le contexte du resolver (light et wide par
 * défaut ; --largeur nomme le modificateur width, D62) ; un contexte inconnu sort en 2.
 * D18 : toute panne (option inconnue, fichier absent ou illisible) sort en 2, par la garde
 * commune (src/cli/garde.js).
 * D25, D31 : texte du contrôle dans src/report/contraste.js, lu aussi par la saisie ; une marque dont
 * primitives.tokens.json redéfinit une échelle commune échoue (sortie 1), l'échelle nommée.
 * Usage : npm run contraste [-- --paires <fichier>] [--marque <dossier>] [--mode light|dark] [--largeur wide|narrow]
 */
import { parseArgs } from 'node:util';
import { loadRoles, contrat } from '../tokens/roles.js';
import { echellesPropres, echellesCommunesRedefinies, motifRedefinies } from '../tokens/saisie.js';
import { lignesContraste } from '../report/contraste.js';
import { lancer, parMarque } from './garde.js';

await lancer('contraste', () => {
  const { values } = parseArgs({ options: { paires: { type: 'string' }, marque: { type: 'string' }, mode: { type: 'string' }, largeur: { type: 'string' } } });
  return parMarque(values.marque, (dossier) => {
    // D25 : une marque qui redéfinit une échelle commune échoue, comme à la saisie.
    const roles = loadRoles(dossier, { paires: values.paires, mode: values.mode, largeur: values.largeur });
    const redefinies = echellesCommunesRedefinies(echellesPropres(dossier));
    if (redefinies.length) {
      console.log(`✗ ${motifRedefinies(redefinies)}`);
      return 1;
    }
    const c = contrat(roles);
    for (const l of lignesContraste(c, values)) console.log(l);
    return c.roles.fails.length ? 1 : 0;
  });
});
