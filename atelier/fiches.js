// Fiches des composants (D56) et des modules, commande : sans option, réécrit l'en-tête et les blocs générés de chaque
// fiche présente de docs/composants/ et de docs/modules/, puis le bloc de chaque index, sans toucher aux parties écrites ; avec --verifier, n'écrit rien et
// juge, table des noms comprise (NM1 à NM3). Sortie 0 si tout correspond, 1 sur un écart (une ligne ✗ par écart), 2 sur
// une panne (D18), par la garde commune. Elle ne demande aucune installation de l'atelier : elle lit les props, les
// composants et les stories en texte, la table du thème, la table des noms, les paires et les tokens des marques, avec
// l'installation de la racine.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { lancer } from '../src/cli/garde.js';
import { ICI, NOMS, RACINE, calculer } from './fiches/fiche.js';

await lancer('fiches', async () => {
  const { values } = parseArgs({ options: { verifier: { type: 'boolean', default: false } } });
  const { fiches, index, horsTable, absentes, noms } = await calculer();
  if (!values.verifier) {
    for (const f of fiches) if (f.attendu !== f.actuel) writeFileSync(join(RACINE, f.chemin), f.attendu);
    for (const i of index) if (i.attendu !== i.actuel) writeFileSync(join(RACINE, i.chemin), i.attendu);
    console.log(`fiches : ${fiches.length} fiche${fiches.length > 1 ? 's' : ''} écrite${fiches.length > 1 ? 's' : ''} (${fiches.map((f) => f.chemin).join(', ')}), index écrits (${index.map((i) => i.chemin).join(', ')})`);
    // Les écarts des parties écrites ne se régénèrent pas : ils restent à lire.
    const restes = [
      ...fiches.flatMap((f) => f.ecarts.filter((e) => !e.includes('à régénérer')).map((e) => `✗ ${f.chemin} : ${e}`)),
      ...absentes.map((a) => `✗ ${a} : fiche absente`),
      ...index.flatMap((i) => i.ecarts.map((e) => `✗ ${i.chemin} : ${e}`)),
      ...noms.map((e) => `✗ ${NOMS} : ${e}`),
    ];
    for (const l of restes) console.log(l);
    return restes.length ? 1 : 0;
  }
  let code = 0;
  /** @param {string} chemin @param {string[]} ecarts */
  const juger = (chemin, ecarts) => {
    if (!ecarts.length) console.log(`✓ ${chemin}`);
    for (const e of ecarts) console.log(`✗ ${chemin} : ${e}`);
    if (ecarts.length) code = 1;
  };
  for (const f of fiches) juger(f.chemin, f.ecarts);
  for (const h of horsTable) juger(h, ['fiche sans composant']);
  for (const a of absentes) juger(a, ['fiche absente']);
  for (const i of index) juger(i.chemin, [...(i.attendu === i.actuel ? [] : [`index à régénérer (npm --prefix ${ICI} run fiches)`]), ...i.ecarts]);
  juger(NOMS, noms);
  return code;
});
