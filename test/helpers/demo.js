// @ts-check
/**
 * npm run demo : sert la marque fictive Orbe Café en local, pour essayer
 * audit, reduce et --live sans toucher à un site réel. Ctrl+C pour arrêter.
 */
import { startFixtureServers } from './serveur.js';

const servers = await startFixtureServers();
console.log(`Orbe Café (marque fictive) : ${servers.origin}/`);
console.log(`Exemple : npm run reduce -- ${servers.origin}/ /page-2.html --target fixtures/marque-demo/cible.json --sources fixtures/marque-demo/sources.json --live`);
process.on('SIGINT', async () => {
  await servers.close();
  process.exit(0);
});
