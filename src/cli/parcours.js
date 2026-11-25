// @ts-check
/**
 * npm run parcours -- <projet.json> [--servir] [--port <n>] (D72) : lit le projet, calcule l'état du parcours depuis
 * ses sorties, écrit parcours.html à côté de projet.json et, dans le terminal, où on en est, qui a la main, quoi faire
 * et la commande suivante ; dessous, les faits du moment, que l'IA dit avec ses mots (D74). --servir sert la page et les
 * écrans sur 127.0.0.1, au port 4311, ou à un port libre s'il est pris (D75), jusqu'à Ctrl+C.
 * Sortie 0 ; 2 sur un projet illisible ou une sortie illisible (D18). Une sortie absente n'est pas une panne : c'est un état.
 */
import { writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseArgs } from 'node:util';
import { lancer } from './garde.js';
import { lireProjet } from '../parcours/projet.js';
import { calculerEtat, lignesTerminal } from '../parcours/etat.js';
import { pageDuParcours } from '../parcours/page.js';
import { faitsDuMoment } from '../parcours/faits.js';
import { servir } from '../parcours/serveur.js';

const USAGE = 'npm run parcours -- <projet.json> [--servir] [--port <n>]';

await lancer('parcours', async () => {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: { servir: { type: 'boolean', default: false }, port: { type: 'string' } } });
  if (positionals.length !== 1) throw new Error(`un fichier de projet et un seul (usage : ${USAGE})`);
  if (values.port !== undefined && !/^\d+$/.test(values.port)) throw new Error(`--port : un nombre est attendu (usage : ${USAGE})`);
  if (values.port !== undefined && !values.servir) throw new Error(`--port ne s'emploie qu'avec --servir (usage : ${USAGE})`);
  const fichier = positionals[0];
  /** Les faits du moment, précédés d'une ligne vide. @param {{ etat: import('../parcours/etat.js').Etat, projet: { sorties: string } }} r */
  const chat = (r) => {
    const l = faitsDuMoment(r.etat, { sorties: r.projet.sorties });
    return l.length ? ['', ...l] : [];
  };
  /** Relit le projet, recalcule l'état, écrit la page ; rend l'état et la page. */
  const ecrire = () => {
    const projet = lireProjet(fichier);
    const etat = calculerEtat(projet);
    const html = pageDuParcours(etat);
    const page = join(projet.dossier, 'parcours.html');
    writeFileSync(page, html);
    return { projet, etat, html, page: relative(process.cwd(), page) };
  };
  const premier = ecrire();
  if (!values.servir) {
    for (const l of [...lignesTerminal(premier.etat, { page: premier.page }), ...chat(premier)]) console.log(l);
    return 0;
  }
  const s = await servir(
    {
      page: () => ecrire().html,
      sorties: () => lireProjet(fichier).sorties,
      marques: () => Object.fromEntries(lireProjet(fichier).sites.filter((x) => x.dossierMarque).map((x) => [x.id, /** @type {string} */ (x.dossierMarque)])),
    },
    values.port === undefined ? { port: 4311, libre: true } : { port: Number(values.port) },
  );
  for (const l of [...lignesTerminal(premier.etat, { page: premier.page, adresse: s.adresse }), ...chat(premier)]) console.log(l);
  console.log('Ctrl+C pour arrêter.');
  process.on('SIGINT', () => s.fermer().then(() => process.exit(0)));
  return 0;
});
