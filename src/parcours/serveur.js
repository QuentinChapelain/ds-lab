// @ts-check
/**
 * Le serveur du parcours (D72), sur 127.0.0.1 seulement : le panneau d'aperçu de Claude Code refuse un fichier ouvert
 * par son chemin. `/` recalcule l'état et réécrit la page à chaque demande : un rechargement suffit après une commande.
 * Les écrans sont servis sous deux racines, de la même origine que la page, qui peut donc les embarquer :
 * `/sorties/…` (les sorties du projet) et `/marques/<id>/…` (le dossier de l'entrée de la marque d'un site).
 * Rien d'autre ; un chemin qui sort d'une racine est un 404.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = /** @type {Record<string, string>} */ ({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.yml': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
});

/**
 * Fichier d'une racine, ou null s'il en sort.
 * @param {string} racine @param {string} reste
 */
function dans(racine, reste) {
  const f = normalize(join(racine, reste));
  return f.startsWith(racine.endsWith(sep) ? racine : racine + sep) ? f : null;
}

/**
 * Sert le parcours.
 * @param {{ page: () => string, sorties: () => string, marques: () => Record<string, string> }} sources
 *   page : écrit et rend la page à jour ; sorties : la racine des sorties ; marques : dossier de la marque de chaque site
 * @param {{ port?: number }} [opts]  0 : un port libre
 * @returns {Promise<{ adresse: string, fermer: () => Promise<void> }>}
 */
export function servir(sources, { port = 4311 } = {}) {
  const serveur = createServer(async (req, res) => {
    /** @param {number} code @param {string} [message] */
    const absent = (code = 404, message = '') => res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' }).end(code === 404 ? 'absent' : `panne : ${message}`);
    try {
      const chemin = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
      if (chemin === '/' || chemin === '/parcours.html') {
        res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' }).end(sources.page());
        return;
      }
      /** @type {string | null} */
      let f = null;
      const m = /^\/marques\/([a-z0-9-]+)\/(.+)$/.exec(chemin);
      if (chemin.startsWith('/sorties/')) f = dans(sources.sorties(), chemin.slice('/sorties/'.length));
      else if (m && sources.marques()[m[1]]) f = dans(sources.marques()[m[1]], m[2]);
      if (!f) return absent();
      const corps = await readFile(f);
      res.writeHead(200, { 'content-type': TYPES[extname(f)] ?? 'application/octet-stream', 'cache-control': 'no-store' }).end(corps);
    } catch (e) {
      const code = /** @type {any} */ (e).code;
      absent(code === 'ENOENT' || code === 'EISDIR' || code === 'ENOTDIR' ? 404 : 500, /** @type {Error} */ (e).message);
    }
  });
  return new Promise((ok, ko) => {
    serveur.once('error', (/** @type {any} */ e) => ko(e.code === 'EADDRINUSE' ? new Error(`port ${port} pris : passer --port <n>`) : e));
    serveur.listen(port, '127.0.0.1', () => {
      const a = /** @type {import('node:net').AddressInfo} */ (serveur.address());
      ok({ adresse: `http://127.0.0.1:${a.port}/`, fermer: () => new Promise((f) => serveur.close(() => f())) });
    });
  });
}
