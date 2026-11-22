// @ts-check
/**
 * D67, D68 : les planches d'une app du banc. La version construite de l'app, servie en local, chaque page de l'exercice
 * sous chaque marque, en clair et en sombre, à 1 280 et à 360 px. Une page qui ne s'ouvre pas est notée, pas une panne.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join } from 'node:path';
import { lancerChromium } from '../browser/lancement.js';

/** Types des fichiers servis. */
const TYPES = /** @type {Record<string, string>} */ ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' });

/** Nom d'une page dans celui d'une planche. @param {string} page */
const nomDePage = (page) => page.replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'accueil';

/**
 * Construit l'app et écrit ses planches. Rend les notes : construction impossible, page en erreur, page qui déborde.
 * @param {string} app @param {string} sortie @param {{ marques: string[], pages: string[] }} o
 * @returns {Promise<string[]>}
 */
export async function planches(app, sortie, o) {
  if (!existsSync(join(app, 'node_modules'))) return ['planches : app non installée (npm ci), aucune planche'];
  const b = spawnSync('npm', ['run', 'build'], { cwd: app, encoding: 'utf8' });
  if (b.status !== 0) return [`planches : npm run build sort en ${b.status} ; ${b.stderr.trim().split('\n').at(-1) ?? ''}`];
  const dist = join(app, 'dist');
  const serveur = createServer((req, res) => {
    const chemin = join(dist, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname));
    const fichier = chemin.startsWith(dist) && existsSync(chemin) && statSync(chemin).isFile() ? chemin : join(dist, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(fichier)] ?? 'application/octet-stream' });
    res.end(readFileSync(fichier));
  });
  await new Promise((ok) => serveur.listen(0, '127.0.0.1', () => ok(null)));
  const port = /** @type {import('node:net').AddressInfo} */ (serveur.address()).port;
  mkdirSync(sortie, { recursive: true });
  /** @type {string[]} */
  const notes = [];
  const navigateur = await lancerChromium();
  try {
    for (const adresse of o.pages)
      for (const marque of o.marques)
        for (const mode of ['clair', 'sombre'])
          for (const largeur of [1280, 360]) {
            const nom = `${nomDePage(adresse)}-${marque}-${mode}-${largeur}`;
            const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 } });
            /** @type {string[]} */
            const erreurs = [];
            page.on('pageerror', (e) => erreurs.push(e.message));
            try {
              await page.goto(`http://127.0.0.1:${port}${adresse}?marque=${marque}&mode=${mode}`, { waitUntil: 'networkidle', timeout: 20000 });
              const large = await page.evaluate(() => document.documentElement.scrollWidth);
              if (large > largeur) notes.push(`planche ${nom} : la page déborde, ${large} px de large pour ${largeur}`);
              await page.screenshot({ path: join(sortie, `${nom}.png`), fullPage: true });
            } catch (e) {
              notes.push(`planche ${nom} : ${String(/** @type {Error} */ (e).message).split('\n')[0]}`);
            }
            if (erreurs.length) notes.push(`planche ${nom} : erreur dans la page, ${erreurs[0]}`);
            await page.close();
          }
  } finally {
    await navigateur.close();
    serveur.close();
  }
  return notes;
}
