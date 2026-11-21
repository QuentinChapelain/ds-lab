// Outils communs de la preuve de l'atelier (D42) : serveurs de la version construite et de développement, thèmes
// attendus relus dans les jetons, mise en forme des valeurs comme le navigateur les calcule, états forcés par le
// protocole DevTools, ouverture d'une story, comparaison de deux captures. Chaque composant a sa preuve à côté
// (bouton.js…) ; preuve.js les enchaîne.
//
// Les valeurs attendues ne viennent pas des fichiers de thèmes que l'atelier affiche : elles sont relues dans les jetons
// par le lecteur du dépôt (loadRoles, resolveRoles), avec les rôles que nomme la table commune.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { basename, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { dossiersDeMarque, nomDeMarque } from '../../src/tokens/resolver.js';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from '../../src/tokens/roles.js';
import { lireTable } from '../../src/tokens/vuetify.js';
import { famille } from '../../src/lib/format.js';

/** Dossier de l'atelier. */
export const ICI = fileURLToPath(new URL('../', import.meta.url));
const CONSTRUITE = join(ICI, 'storybook-static');
/** Dossier des captures, hors dépôt (local/ n'est jamais versionné). */
export const LOCAL = join(ICI, '..', 'local');
export const CADRE = { width: 1100, height: 700 };
/** Contextes de mode du resolver (D62), et le mot français du titre dans le sélecteur. */
const MODES = /** @type {const} */ ([['light', 'clair'], ['dark', 'sombre']]);
/**
 * Variables de Vuetify écrites sous le même préfixe que les couleurs du thème (--v-theme-…) mais qui n'en sont pas :
 * couleurs de kbd et de code, et les deux textes dont Vuetify se sert pour calculer un on- absent. Elles restent les
 * siennes (D42) : la preuve les écarte nommément, et une version de Vuetify qui en ajoute la fera échouer, ce qui est
 * voulu.
 */
export const VARIABLES_VUETIFY = ['code', 'kbd', 'on-code', 'on-dark', 'on-kbd', 'on-light'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
export const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));
/** @param {string} hex */
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(',');

/**
 * Valeur attendue d'une variable de la table, lue dans les jetons, au format de la feuille de Vuetify sans espaces.
 * @param {Map<string, any>} jetons @param {{ jeton: string, champ?: string }} v
 */
function variable(jetons, { jeton, champ }) {
  let { valeur } = resoudreAlias(jetons, jetons.get(jeton).$value, { depuis: jeton, chaine: [jeton] });
  if (champ) valeur = resoudreAlias(jetons, valeur[champ], { depuis: jeton, chaine: [jeton] }).valeur;
  if (typeof valeur === 'number') return String(valeur);
  if (Array.isArray(valeur)) return famille(valeur).replace(/\s/g, '');
  if (typeof valeur?.hex === 'string') return rgb(valeur.hex);
  return `${valeur.value}${valeur.unit}`;
}

/** Couleur CSS calculée par le navigateur, depuis r,g,b. @param {string} x */
export const css = (x) => `rgb(${x.split(',').join(', ')})`;
export const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/**
 * Thèmes attendus, dans l'ordre du sélecteur : marques de tokens/, puis clair et sombre. Chaque composant ajoute ses
 * mesures attendues par son propre module (attendre).
 */
export function attendus() {
  const table = lireTable();
  return dossiersDeMarque().flatMap((dossier) =>
    MODES.map(([mode, mot]) => {
      const set = loadRoles(dossier, { mode });
      const roles = resolveRoles(set.semantique, set.primitives, set.marque);
      const hex = (/** @type {string} */ role) => /** @type {string} */ (roles.get(role)?.hex);
      const jetons = new Map([...flattenTokens(set.primitives), ...flattenTokens(set.marque)]);
      const police = (/** @type {string} */ j) => resoudreAlias(jetons, jetons.get(j).$value, { depuis: j, chaine: [j] }).valeur;
      const tous = new Map([...jetons, ...flattenTokens(set.semantique)]);
      const variables = Object.fromEntries(
        Object.entries(table.variables)
          .map(([k, v]) => [k, variable(tous, v)])
          .sort(([a], [b]) => (a < b ? -1 : 1)),
      );
      return {
        nom: `${basename(dossier)}-${mode}`,
        titre: `${nomDeMarque(dossier)}, ${mot}`,
        fond: hex(table.couleurs.primary.fond),
        texte: hex(table.couleurs.primary.texte),
        page: hex(table.couleurs.background.fond),
        // Couleurs du thème comme Vuetify les écrit dans sa feuille (--v-theme-<clé>: r,g,b), chaque fond de la table et
        // son texte, rangées par nom : rien d'autre, ni couleur de Material ni texte calculé par Vuetify.
        couleurs: Object.fromEntries(
          Object.entries(table.couleurs)
            .flatMap(([k, c]) => [[k, rgb(hex(c.fond))], [`on-${k}`, rgb(hex(c.texte))]])
            .sort(([a], [b]) => (a < b ? -1 : 1)),
        ),
        policeTexte: police(table.polices['font-body'].jeton),
        policeTitre: police(table.polices['font-heading'].jeton),
        // Police du libellé : celle du produit, jamais celle du texte de la marque (D44).
        policeLibelle: resoudreAlias(tous, tous.get('typography.label').$value.fontFamily, { depuis: 'typography.label', chaine: ['typography.label'] }).valeur,
        // Variables des enveloppes (--v-ds-<clé>), relues dans les jetons : couleur en r,g,b comme Vuetify l'écrit,
        // dimension en px, nombre tel quel ; rangées par nom.
        variables,
      };
    }),
  );
}

/** Port libre sur 127.0.0.1. */
function portLibre() {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('node:net').AddressInfo} */ (s.address());
      s.close(() => resolve(port));
    });
  });
}

/** Serveur de la version construite, sur 127.0.0.1. */
export async function servirConstruite() {
  if (!existsSync(join(CONSTRUITE, 'iframe.html'))) throw new Error('version construite absente : lancer d’abord npm run build');
  const serveur = createServer(async (req, res) => {
    const chemin = normalize(join(CONSTRUITE, decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)));
    const fichier = chemin.endsWith('/') ? join(chemin, 'index.html') : chemin;
    if (!fichier.startsWith(CONSTRUITE) || !existsSync(fichier) || statSync(fichier).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(fichier)] ?? 'application/octet-stream' }).end(await readFile(fichier));
  });
  await new Promise((r) => serveur.listen(0, '127.0.0.1', () => r(undefined)));
  const { port } = /** @type {import('node:net').AddressInfo} */ (serveur.address());
  return { base: `http://127.0.0.1:${port}`, arreter: () => new Promise((r) => serveur.close(() => r(undefined))) };
}

/** Serveur de développement de Storybook, lancé ici et attendu jusqu'à ce que son index réponde. */
export async function servirDeveloppement() {
  const port = await portLibre();
  const bin = join(ICI, 'node_modules', '.bin', 'storybook');
  const args = ['dev', '--port', String(port), '--exact-port', '--host', '127.0.0.1', '--ci', '--no-open', '--no-version-updates', '--disable-telemetry', '--quiet'];
  const enfant = spawn(bin, args, { cwd: ICI, detached: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let erreurs = '';
  enfant.stderr.on('data', (d) => (erreurs += d));
  const base = `http://127.0.0.1:${port}`;
  const arreter = () => {
    try {
      process.kill(-(/** @type {number} */ (enfant.pid)), 'SIGTERM');
    } catch {
      // déjà arrêté
    }
  };
  const fin = Date.now() + 120_000;
  for (;;) {
    if (enfant.exitCode !== null) throw new Error(`serveur de développement arrêté (${enfant.exitCode}) : ${erreurs.split('\n')[0]}`);
    const ok = await fetch(`${base}/index.json`).then((r) => r.ok, () => false);
    if (ok) break;
    if (Date.now() > fin) {
      arreter();
      throw new Error('serveur de développement : pas de réponse en 120 s');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return { base, arreter };
}

/**
 * Force des états CSS (survol, focus) par le protocole DevTools, sur les éléments que désigne chaque sélecteur.
 * @param {import('playwright-core').Page} page @param {Record<string, string[]>} forces sélecteur → pseudo-classes
 */
export async function forcer(page, forces) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  for (const [selecteur, classes] of Object.entries(forces)) {
    const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: selecteur });
    for (const nodeId of nodeIds) await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: classes });
  }
}

/**
 * Story ouverte dans l'aperçu, avec ses erreurs de page et de console.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} id identifiant de la story @param {string} theme
 */
export async function ouvrir(contexte, base, id, theme) {
  const page = await contexte.newPage();
  /** @type {string[]} */
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') erreurs.push(m.text());
  });
  await page.goto(`${base}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: 'networkidle' });
  return { page, erreurs };
}

/**
 * Refus d'une story : l'erreur qui nomme l'usage, attendue jusqu'à 5 s (elle arrive par la console de l'aperçu), et
 * aucun élément du composant. Rend [ok, ligne].
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string} id @param {string} theme
 * @param {string} message @param {string} selecteur éléments du composant @param {string} quoi nom d'un élément, pour la ligne
 * @returns {Promise<[boolean, string]>}
 */
export async function refus(contexte, base, id, theme, message, selecteur, quoi) {
  const r = await ouvrir(contexte, base, id, theme);
  for (const fin = Date.now() + 5_000; Date.now() < fin && !r.erreurs.some((e) => e.includes(message)); ) await r.page.waitForTimeout(100);
  const n = await r.page.locator(selecteur).count();
  const vue = r.erreurs.some((e) => e.includes(message));
  await r.page.close();
  return [n === 0 && vue, `${theme}, ${id.split('--')[1]} : ${n} ${quoi}, erreur ${vue ? `« ${message} »` : 'absente'}`];
}

/** Pixels différents entre deux captures PNG de même taille, seuil 0. @param {Buffer} a @param {Buffer} b */
export function ecart(a, b) {
  const x = PNG.sync.read(a);
  const y = PNG.sync.read(b);
  if (x.width !== y.width || x.height !== y.height) return Infinity;
  return pixelmatch(x.data, y.data, null, x.width, x.height, { threshold: 0 });
}
