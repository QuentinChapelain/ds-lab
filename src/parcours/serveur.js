// @ts-check
/**
 * Le serveur du parcours (D72), sur 127.0.0.1 seulement : le panneau d'aperçu de Claude Code refuse un fichier ouvert
 * par son chemin. `/` recalcule l'état et réécrit la page à chaque demande : un rechargement suffit après une commande.
 * Les écrans sont servis sous deux racines, de la même origine que la page, qui peut donc les embarquer :
 * `/sorties/…` (les sorties du projet) et `/marques/<id>/…` (le dossier de l'entrée de la marque d'un site).
 * L'écran des pages (D77) : `/vignette/<site>?page=<chemin>` rend la capture d'une page, ou son dessin ; un formulaire
 * envoyé (POST, `/pages/…`) passe à `poster`, puis le navigateur revient sur `/` (303), avec le refus d'une page ajoutée
 * dans l'adresse, pour le dire à côté du champ ; un formulaire envoyé depuis un écran revu (`/?voir=…`, D88) est refusé
 * (409). Rien d'autre ; un chemin qui sort d'une racine est un 404.
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

/** Le corps d'un formulaire envoyé. @param {import('node:http').IncomingMessage} req @returns {Promise<Record<string, string>>} */
async function champs(req) {
  let corps = '';
  for await (const c of req) {
    corps += c;
    if (corps.length > 100_000) throw new Error('formulaire trop long');
  }
  return Object.fromEntries(new URLSearchParams(corps));
}

/**
 * Sert le parcours.
 * @param {{ page: (q: URLSearchParams) => string, sorties: () => string, marques: () => Record<string, string>,
 *   vignette?: (site: string, chemin: string) => Promise<{ type: string, corps: Buffer | string }>,
 *   autre?: (chemin: string, q: URLSearchParams, ici: string) => Promise<{ type: string, corps: Buffer | string } | null>,
 *   poster?: (chemin: string, champs: Record<string, string>) => Promise<URLSearchParams | null> }} sources
 *   page : écrit et rend la page à jour, avec les paramètres de l'adresse ; sorties : la racine des sorties ; marques :
 *   dossier de la marque de chaque site ; vignette : la capture d'une page ; autre : une page de plus (le guide de migration, une
 *   page du site en direct, D87), ou null ; poster : un formulaire de l'écran, qui rend
 *   les paramètres de l'adresse du retour
 * @param {{ port?: number, libre?: boolean }} [opts]  port 0 : un port libre ; libre : si le port est pris, un port libre (D75)
 * @returns {Promise<{ adresse: string, fermer: () => Promise<void> }>}
 */
export function servir(sources, { port = 4311, libre = false } = {}) {
  const serveur = createServer(async (req, res) => {
    /** @param {number} code @param {string} [message] */
    const absent = (code = 404, message = '') => res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' }).end(code === 404 ? 'absent' : `panne : ${message}`);
    try {
      const adresse = new URL(req.url ?? '/', 'http://x');
      const chemin = decodeURIComponent(adresse.pathname);
      if (req.method === 'POST') {
        if (!sources.poster || !chemin.startsWith('/pages/')) return absent();
        // Un écran revu est en lecture seule (D88) : rien de ce qui en vient ne s'enregistre.
        if (/[?&]voir=/.test(req.headers.referer ?? '')) return res.writeHead(409, { 'content-type': 'text/plain; charset=utf-8' }).end('écran revu : rien ne s’enregistre');
        const q = await sources.poster(chemin, await champs(req));
        res.writeHead(303, { location: q && [...q].length ? `/?${q}` : '/' }).end();
        return;
      }
      if (chemin === '/' || chemin === '/parcours.html') {
        const html = sources.page(adresse.searchParams);
        res.writeHead(200, { 'content-type': TYPES['.html'], 'cache-control': 'no-store' }).end(html);
        return;
      }
      const v = /^\/vignette\/([a-z0-9-]+)$/.exec(chemin);
      if (v && sources.vignette) {
        const r = await sources.vignette(v[1], adresse.searchParams.get('page') ?? '');
        res.writeHead(200, { 'content-type': r.type, 'cache-control': 'no-store' }).end(r.corps);
        return;
      }
      const autre = sources.autre && !chemin.startsWith('/sorties/') && !chemin.startsWith('/marques/') ? await sources.autre(chemin, adresse.searchParams, `http://${req.headers.host ?? '127.0.0.1'}`) : null;
      if (autre) {
        res.writeHead(200, { 'content-type': autre.type, 'cache-control': 'no-store' }).end(autre.corps);
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
  /** @param {number} p @returns {Promise<{ adresse: string, fermer: () => Promise<void> }>} */
  const ecouter = (p) =>
    new Promise((ok, ko) => {
      serveur.once('error', (/** @type {any} */ e) => ko(e));
      serveur.listen(p, '127.0.0.1', () => {
        const a = /** @type {import('node:net').AddressInfo} */ (serveur.address());
        ok({ adresse: `http://127.0.0.1:${a.port}/`, fermer: () => new Promise((f) => serveur.close(() => f())) });
      });
    });
  return ecouter(port).catch((/** @type {any} */ e) => {
    if (e.code !== 'EADDRINUSE') throw e;
    if (libre) return ecouter(0);
    throw new Error(`port ${port} pris : passer un autre --port, ou aucun`);
  });
}
