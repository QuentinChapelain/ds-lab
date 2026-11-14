// @ts-check
/**
 * npm run demo [-- --racine <dossier>] : sert la marque fictive Orbe Café en local, pour essayer
 * audit, reduce et --live sans toucher à un site réel. Ctrl+C pour arrêter.
 * Lot V : --racine sert un autre dossier comme origine principale (une copie à migrer,
 * par exemple local/lot-v) ; le serveur distant reste celui des fixtures.
 */
import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startFixtureServers, FIXTURE_DIR } from './serveur.js';

/** @param {string[]} argv */
export function parseDemoArgs(argv) {
  const { values } = parseArgs({ args: argv, options: { racine: { type: 'string' } } });
  return { root: values.racine ? resolve(values.racine) : FIXTURE_DIR };
}

async function main() {
  const { root } = parseDemoArgs(process.argv.slice(2));
  const servers = await startFixtureServers({ root });
  console.log(`Orbe Café (marque fictive) : ${servers.origin}/`);
  if (root !== FIXTURE_DIR) console.log(`Racine : ${root}`);
  console.log(`Exemple : npm run reduce -- ${servers.origin}/ /page-2.html --target fixtures/marque-demo/cible.json --sources fixtures/marque-demo/sources.json --live`);
  process.on('SIGINT', async () => {
    await servers.close();
    process.exit(0);
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
