// Preuve rejouable de l'atelier (D42) : pour chaque thème de chaque marque, le témoin rendu par Storybook a le fond,
// le texte et les polices des jetons, Vuetify n'a calculé aucun texte, les variables du bouton (--v-ds-*) sont celles
// des jetons, et le rendu est le même en développement et en version construite. Sortie 0 si tout passe, 1 si une vérification échoue, 2 sur une panne (D18).
// La version construite doit exister (npm run build) ; le serveur de développement est lancé ici, sur 127.0.0.1, puis
// arrêté.
//
// Les valeurs attendues ne viennent pas des fichiers de thèmes que l'atelier affiche : elles sont relues dans les jetons
// par le lecteur du dépôt (loadRoles, resolveRoles), avec les rôles que nomme la table commune. La preuve emprunte à la
// racine du dépôt son lancement de Chromium (D34) et la comparaison de pixels (pixelmatch, pngjs) : elle demande
// l'installation de la racine, comme les tests.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { basename, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { lancer } from '../src/cli/garde.js';
import { lancerChromium } from '../src/browser/lancement.js';
import { dossiersDeMarque, nomDeMarque } from '../src/tokens/resolver.js';
import { loadRoles, resolveRoles, flattenTokens, resoudreAlias } from '../src/tokens/roles.js';
import { lireTable } from '../src/tokens/vuetify.js';

const ICI = fileURLToPath(new URL('./', import.meta.url));
const CONSTRUITE = join(ICI, 'storybook-static');
const STORY = encodeURIComponent('témoin-bouton--plein');
const CADRE = { width: 400, height: 200 };
const MODES = ['clair', 'sombre'];
/**
 * Variables de Vuetify écrites sous le même préfixe que les couleurs du thème (--v-theme-…) mais qui n'en sont pas :
 * couleurs de kbd et de code, et les deux textes dont Vuetify se sert pour calculer un on- absent. Elles restent les
 * siennes (KNOWN_ISSUES.md).
 */
const VARIABLES_VUETIFY = ['code', 'kbd', 'on-code', 'on-dark', 'on-kbd', 'on-light'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

/** Noms d'une valeur CSS font-family, guillemets ôtés. @param {string} s */
const noms = (s) => s.split(',').map((x) => x.trim().replace(/^"(.*)"$/, '$1'));
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
  if (typeof valeur?.hex === 'string') return rgb(valeur.hex);
  return `${valeur.value}${valeur.unit}`;
}

/** Thèmes attendus, dans l'ordre du sélecteur : marques de tokens/, puis clair et sombre. */
function attendus() {
  const table = lireTable();
  return dossiersDeMarque().flatMap((dossier) =>
    MODES.map((mode) => {
      const set = loadRoles(dossier, { mode });
      const roles = resolveRoles(set.semantique, set.primitives, set.marque);
      const hex = (/** @type {string} */ role) => /** @type {string} */ (roles.get(role)?.hex);
      const jetons = new Map([...flattenTokens(set.primitives), ...flattenTokens(set.marque)]);
      const police = (/** @type {string} */ j) => resoudreAlias(jetons, jetons.get(j).$value, { depuis: j, chaine: [j] }).valeur;
      const tous = new Map([...jetons, ...flattenTokens(set.semantique)]);
      return {
        nom: `${basename(dossier)}-${mode}`,
        titre: `${nomDeMarque(dossier)}, ${mode}`,
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
        // Variables du bouton (--v-ds-<clé>), relues dans les jetons : couleur en r,g,b comme Vuetify l'écrit, dimension
        // en px, nombre tel quel ; rangées par nom.
        variables: Object.fromEntries(
          Object.entries(table.variables)
            .map(([k, v]) => [k, variable(tous, v)])
            .sort(([a], [b]) => (a < b ? -1 : 1)),
        ),
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
async function servirConstruite() {
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
async function servirDeveloppement() {
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
 * Relevé du témoin dans l'aperçu d'une story, thème passé par son nom.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {string | null} theme
 */
async function releve(contexte, base, theme) {
  const page = await contexte.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  await page.goto(`${base}/iframe.html?id=${STORY}&viewMode=story${theme === null ? '' : `&globals=theme:${theme}`}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.v-btn') || document.body.classList.contains('sb-show-errordisplay'), null, { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(() => {
    const hex = (/** @type {string} */ c) => '#' + (c.match(/\d+/g) ?? []).slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('');
    const app = document.querySelector('.v-application');
    const b = document.querySelector('.v-btn');
    const classe = app ? [...app.classList].find((c) => c.startsWith('v-theme--')) ?? null : null;
    /** Couleurs écrites par Vuetify pour le thème posé : --v-theme-<clé>, hors multiplicateurs d'opacité. */
    const couleurs = {};
    /** Variables du bouton écrites par Vuetify pour le thème posé : --v-ds-<clé>. */
    const variables = {};
    const feuille = /** @type {HTMLStyleElement | null} */ (document.getElementById('vuetify-theme-stylesheet'));
    const parcourir = (/** @type {CSSRuleList} */ regles) => {
      for (const r of regles) {
        if ('cssRules' in r && !(r instanceof CSSStyleRule)) parcourir(/** @type {CSSGroupingRule} */ (r).cssRules);
        else if (r instanceof CSSStyleRule && classe && r.selectorText === `.${classe}`)
          for (const p of r.style)
            if (p.startsWith('--v-theme-') && !p.endsWith('-overlay-multiplier')) couleurs[p.slice('--v-theme-'.length)] = r.style.getPropertyValue(p).replace(/\s/g, '');
            else if (p.startsWith('--v-ds-')) variables[p.slice('--v-'.length)] = r.style.getPropertyValue(p).replace(/\s/g, '');
      }
    };
    if (feuille?.sheet) parcourir(feuille.sheet.cssRules);
    return {
      classe,
      erreur: document.body.classList.contains('sb-show-errordisplay') ? (document.querySelector('#error-message')?.textContent ?? '').trim() : null,
      fond: b ? hex(getComputedStyle(b).backgroundColor) : null,
      texte: b ? hex(getComputedStyle(b).color) : null,
      police: b ? getComputedStyle(b).fontFamily : null,
      page: app ? hex(getComputedStyle(app).backgroundColor) : null,
      titre: app ? getComputedStyle(app).getPropertyValue('--v-font-heading').trim() : null,
      etire: b ? b.getBoundingClientRect().width >= /** @type {HTMLElement} */ (b.parentElement).getBoundingClientRect().width : null,
      couleurs,
      variables,
    };
  });
  const image = m.erreur === null ? await page.screenshot() : null;
  await page.close();
  const couleurs = Object.fromEntries(Object.entries(m.couleurs).filter(([k]) => !VARIABLES_VUETIFY.includes(k)).sort(([a], [b]) => (a < b ? -1 : 1)));
  const variables = Object.fromEntries(Object.entries(m.variables).sort(([a], [b]) => (a < b ? -1 : 1)));
  return { ...m, couleurs, variables, image, erreurs };
}

/** Pixels différents entre deux captures PNG de même taille, seuil 0. @param {Buffer} a @param {Buffer} b */
function ecart(a, b) {
  const x = PNG.sync.read(a);
  const y = PNG.sync.read(b);
  if (x.width !== y.width || x.height !== y.height) return Infinity;
  return pixelmatch(x.data, y.data, null, x.width, x.height, { threshold: 0 });
}

/**
 * Le sélecteur de la barre : ses entrées, et un changement de thème par un clic, sans recharger la story.
 * @param {import('playwright-core').BrowserContext} contexte @param {string} base @param {{ nom: string, titre: string }[]} themes
 */
async function selecteur(contexte, base, themes) {
  const page = await contexte.newPage();
  await page.setViewportSize({ width: 1000, height: 700 });
  await page.goto(`${base}/?path=/story/${STORY}`, { waitUntil: 'networkidle' });
  const apercu = page.frameLocator('#storybook-preview-iframe');
  await apercu.locator('.v-btn').waitFor();
  await page.getByRole('button', { name: 'Thème Vuetify : marque et mode' }).click();
  const entrees = (await page.getByRole('option').allTextContents()).map((t) => t.trim());
  const cible = themes[themes.length - 1];
  await page.getByRole('option', { name: cible.titre, exact: true }).click();
  await apercu.locator(`.v-application.v-theme--${cible.nom}`).waitFor({ timeout: 10_000 }).catch(() => {});
  const classe = await apercu.locator('.v-application').getAttribute('class');
  await page.close();
  return { entrees, cible: cible.nom, atteint: (classe ?? '').split(/\s+/).includes(`v-theme--${cible.nom}`) };
}

await lancer('preuve', async () => {
  const themes = attendus();
  /** @type {string[]} */
  const echecs = [];
  const verifier = (/** @type {boolean} */ ok, /** @type {string} */ ligne) => {
    console.log(`${ok ? '✓' : '✗'} ${ligne}`);
    if (!ok) echecs.push(ligne);
  };
  const construite = await servirConstruite();
  const developpement = await servirDeveloppement();
  const navigateur = await lancerChromium();
  try {
    const contexte = await navigateur.newContext({ viewport: CADRE, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light' });
    // Premier chargement du serveur de développement : Vite prépare ses dépendances et peut recharger la page.
    await releve(contexte, developpement.base, themes[0].nom);
    for (const t of themes) {
      const dev = await releve(contexte, developpement.base, t.nom);
      const bld = await releve(contexte, construite.base, t.nom);
      for (const [mode, r] of [['développement', dev], ['construite', bld]]) {
        const ok =
          r.erreur === null &&
          r.classe === `v-theme--${t.nom}` &&
          r.fond === t.fond &&
          r.texte === t.texte &&
          r.page === t.page &&
          noms(r.police ?? '').join('|') === t.policeTexte.join('|') &&
          noms(r.titre ?? '').join('|') === t.policeTitre.join('|') &&
          r.etire === false &&
          JSON.stringify(r.couleurs) === JSON.stringify(t.couleurs) &&
          JSON.stringify(r.variables) === JSON.stringify(t.variables) &&
          r.erreurs.length === 0;
        verifier(ok, `${t.nom}, ${mode} : fond ${r.fond} (jeton ${t.fond}), texte ${r.texte} (jeton ${t.texte}), page ${r.page}, police ${r.police}, titres ${r.titre}, ${Object.keys(r.couleurs).length} couleurs du thème${JSON.stringify(r.couleurs) === JSON.stringify(t.couleurs) ? ' égales à la table' : ' différentes de la table'}, ${Object.keys(r.variables).length} variables ds-${JSON.stringify(r.variables) === JSON.stringify(t.variables) ? ' égales aux jetons' : ` différentes des jetons (${JSON.stringify(r.variables)})`}${r.etire ? ', bouton étiré' : ''}${r.erreur ? `, erreur ${r.erreur}` : ''}${r.erreurs.length ? `, ${r.erreurs.join(' ; ')}` : ''}`);
      }
      const px = dev.image && bld.image ? ecart(dev.image, bld.image) : Infinity;
      verifier(px === 0, `${t.nom} : développement et construite, ${px} pixel(s) différent(s)`);
    }
    for (const [mode, base] of [['développement', developpement.base], ['construite', construite.base]]) {
      for (const nom of ['inexistant', 'light']) {
        const r = await releve(contexte, base, nom);
        verifier(r.erreur === `thème inconnu : ${nom}` && r.fond === null, `${mode} : « ${nom} » refusé (${r.erreur ?? 'aucune erreur'})`);
      }
      for (const schema of /** @type {const} */ (['light', 'dark'])) {
        const c = await navigateur.newContext({ viewport: CADRE, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: schema });
        const r = await releve(c, base, null);
        await c.close();
        verifier(r.classe === `v-theme--${themes[0].nom}`, `${mode}, système ${schema === 'dark' ? 'sombre' : 'clair'}, sans thème : ${r.classe} (premier thème nommé, jamais « system »)`);
      }
      const s = await selecteur(contexte, base, themes);
      verifier(JSON.stringify(s.entrees) === JSON.stringify(themes.map((t) => t.titre)), `${mode} : sélecteur, ${s.entrees.length} entrées dans l'ordre des marques`);
      verifier(s.atteint, `${mode} : clic sur « ${themes[themes.length - 1].titre} », thème posé sans recharger la story`);
    }
  } finally {
    await navigateur.close();
    developpement.arreter();
    await construite.arreter();
  }
  console.log(echecs.length ? `${echecs.length} vérification(s) en échec.` : `Toutes les vérifications passent : ${themes.length} thèmes.`);
  return echecs.length ? 1 : 0;
});
