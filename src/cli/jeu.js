// @ts-check
/**
 * npm run jeu -- <dossier> (D75) : pose le dossier de jeu, branché sur ce clone, ou le remet à son départ. Sortie 0 ;
 * 2 si le dossier n'est pas vide et n'est pas un dossier de jeu, ou s'il est dans le clone (D18).
 */
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { lancer } from './garde.js';
import { poserJeu } from '../parcours/jeu.js';

const USAGE = 'npm run jeu -- <dossier>';

await lancer('jeu', () => {
  const { positionals } = parseArgs({ allowPositionals: true, options: {} });
  if (positionals.length !== 1) throw new Error(`un dossier et un seul (usage : ${USAGE})`);
  const { dossier, remis } = poserJeu(positionals[0], { depot: fileURLToPath(new URL('../..', import.meta.url)) });
  console.log(`${remis ? 'Dossier de jeu remis à son départ' : 'Dossier de jeu posé'} : ${dossier}`);
  console.log('L’ouvrir dans Claude Code, puis taper /ds-lab.');
  return 0;
});
