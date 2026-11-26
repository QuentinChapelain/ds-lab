// @ts-check
/**
 * npm run projet -- <dossier> (D102) : pose le dossier de projet, neutre, branché sur ce clone, ou le remet à son départ. Sortie 0 ;
 * 2 si le dossier n’est pas vide et n’est pas un dossier de projet, ou s'il est dans le clone (D18).
 */
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { lancer } from './garde.js';
import { poserProjet } from '../parcours/jeu.js';

const USAGE = 'npm run projet -- <dossier>';

await lancer('projet', () => {
  const { positionals } = parseArgs({ allowPositionals: true, options: {} });
  if (positionals.length !== 1) throw new Error(`un dossier et un seul (usage : ${USAGE})`);
  const { dossier, remis } = poserProjet(positionals[0], { depot: fileURLToPath(new URL('../..', import.meta.url)) });
  console.log(`${remis ? 'Dossier de projet remis à son départ' : 'Dossier de projet posé'} : ${dossier}`);
  console.log('L’ouvrir dans Claude Code, puis taper /ds-lab : le chat demande l’adresse de ton site.');
  return 0;
});
