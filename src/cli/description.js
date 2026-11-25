#!/usr/bin/env node
// @ts-check
/**
 * Crochet de Claude Code dans le dossier de jeu (D87), avant chaque commande Bash : lit l'appel sur l'entrée standard
 * et refuse une description écrite en anglais (src/parcours/description.js). Sortie 2 et le refus sur la sortie
 * d'erreur : Claude Code bloque la commande et transmet le refus à l'agent. Sortie 0 sinon, et sur toute panne : un
 * crochet en panne ne doit bloquer aucune commande.
 */
import { lancer } from './garde.js';
import { refusDeDescription } from '../parcours/description.js';

await lancer('description', async () => {
  try {
    let entree = '';
    for await (const c of process.stdin) entree += c;
    const appel = JSON.parse(entree || '{}');
    const refus = appel.tool_name === 'Bash' ? refusDeDescription(String(appel.tool_input?.description ?? '')) : null;
    if (!refus) return 0;
    console.error(refus);
    return 2;
  } catch {
    return 0;
  }
});
