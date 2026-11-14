// @ts-check
/**
 * Serveurs de test pour fixtures/marque-demo : deux origines distinctes.
 * - principale : http://127.0.0.1:<p1>/, racine fixtures/marque-demo/ (ou `root`, lot V)
 * - distante   : http://localhost:<p2>/, racine fixtures/marque-demo/distant/
 * `{{ORIGINE_DISTANTE}}` est remplacé dans les pages HTML par l'origine distante.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const FIXTURE_DIR = fileURLToPath(new URL('../../fixtures/marque-demo/', import.meta.url));

const TYPES = /** @type {Record<string, string>} */ ({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
});

/**
 * @param {string} root
 * @param {() => string} remoteOrigin
 */
function handler(root, remoteOrigin) {
  return async (/** @type {import('node:http').IncomingMessage} */ req, /** @type {import('node:http').ServerResponse} */ res) => {
    const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
    const rel = path.endsWith('/') ? path + 'index.html' : path;
    const file = normalize(join(root, rel));
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep)) {
      res.writeHead(403).end();
      return;
    }
    try {
      let body = await readFile(file);
      const ext = extname(file);
      if (ext === '.html') body = Buffer.from(body.toString('utf8').replaceAll('{{ORIGINE_DISTANTE}}', remoteOrigin()));
      res.writeHead(200, { 'content-type': TYPES[ext] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404).end();
    }
  };
}

/**
 * @param {import('node:http').Server} server
 * @param {string} host
 * @returns {Promise<number>}
 */
function listen(server, host) {
  return new Promise((resolvePort, reject) => {
    server.once('error', reject);
    server.listen(0, host, () => {
      const addr = server.address();
      resolvePort(typeof addr === 'object' && addr ? addr.port : 0);
    });
  });
}

/**
 * Démarre les deux serveurs.
 * @param {{ root?: string }} [opts]  root : racine du serveur principal (lot V) ; le distant reste fixtures/marque-demo/distant/
 * @returns {Promise<{ origin: string, remoteOrigin: string, close: () => Promise<void> }>}
 */
export async function startFixtureServers({ root = FIXTURE_DIR } = {}) {
  let remoteOrigin = '';
  const main = createServer(handler(resolve(root), () => remoteOrigin));
  const remote = createServer(handler(join(FIXTURE_DIR, 'distant'), () => remoteOrigin));
  const p1 = await listen(main, '127.0.0.1');
  const p2 = await listen(remote, 'localhost');
  remoteOrigin = `http://localhost:${p2}`;
  const close = () =>
    Promise.all([main, remote].map((s) => new Promise((r) => s.close(() => r(undefined))))).then(() => undefined);
  return { origin: `http://127.0.0.1:${p1}`, remoteOrigin, close };
}
