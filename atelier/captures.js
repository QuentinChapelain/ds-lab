// Les composants de Diapason à la marque d'un projet (D101) : npm run captures -- --marque <dossier>, à la racine, ou
// npm --prefix atelier run captures -- --marque <dossier>. Chaque story de « Parcours/À ta marque » s'ouvre dans la
// version construite de l'atelier, avec le thème clair de la marque (son vuetify.json, écrit par npm run vuetify) posé
// avant le chargement et enregistré dans Vuetify comme les autres ; la rangée du composant est capturée, au double des
// pixels, dans <dossier>/composants/<clé>.png. Le vrai composant, avec les tokens de la marque : pas un dessin.
// La version construite manque, ou n'a pas ces stories : elle est construite d'abord (npm run build, environ une
// minute). Sortie 0 ; 2 sur une panne (D18) : un dossier sans thème, une story qui lève, un atelier non installé.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { lancer } from '../src/cli/garde.js';
import { lancerChromium } from '../src/browser/lancement.js';
import { COMPOSANTS, captureDe } from '../src/parcours/diapason.js';
import { ICI, servirConstruite } from './preuve/commun.js';

/** L'identifiant de la story d'un composant. @param {string} cle */
export const storyDe = (cle) => `a-ta-marque--${cle}`;

/** La version construite a-t-elle chaque story de l'écran ? */
function construiteAJour() {
  const index = join(ICI, 'storybook-static', 'index.json');
  if (!existsSync(index)) return false;
  const entrees = JSON.parse(readFileSync(index, 'utf8')).entries ?? {};
  return COMPOSANTS.every((c) => Object.hasOwn(entrees, storyDe(c.cle)));
}

/**
 * Le thème clair d'une marque, lu dans son vuetify.json.
 * @param {string} dossier
 */
export function themeClair(dossier) {
  const f = join(dossier, 'vuetify.json');
  if (!existsSync(f)) throw new Error(`${f} absent : lancer d’abord npm run vuetify -- --marque ${dossier}`);
  const t = Object.values(JSON.parse(readFileSync(f, 'utf8')).themes ?? {}).find((x) => !x.dark);
  if (!t) throw new Error(`${f} : aucun thème clair`);
  return t;
}

/**
 * Capture chaque composant de Diapason, au thème clair de la marque, dans `sortie` ; rend les fichiers écrits.
 * @param {{ dossier: string, sortie: string, base: string, navigateur: import('playwright-core').Browser }} o
 */
export async function capturer({ dossier, sortie, base, navigateur }) {
  const theme = themeClair(dossier);
  mkdirSync(join(sortie, 'composants'), { recursive: true });
  const contexte = await navigateur.newContext({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 2, reducedMotion: 'reduce', colorScheme: 'light' });
  await contexte.addInitScript((t) => {
    /** @type {any} */ (globalThis).dsLabTheme = t;
  }, theme);
  /** @type {string[]} */
  const ecrits = [];
  try {
    for (const c of COMPOSANTS) {
      const page = await contexte.newPage();
      /** @type {string[]} */
      const erreurs = [];
      page.on('pageerror', (e) => erreurs.push(e.message));
      await page.goto(`${base}/iframe.html?id=${storyDe(c.cle)}&viewMode=story`, { waitUntil: 'networkidle' });
      const rangee = page.locator('[data-a-ta-marque]');
      await rangee.waitFor({ timeout: 10_000 }).catch(() => undefined);
      if (erreurs.length || !(await rangee.count())) throw new Error(`${storyDe(c.cle)} : ${erreurs[0] ?? 'rien n’est rendu'}`);
      await page.evaluate(() => document.fonts.ready);
      const f = join(sortie, captureDe(c.cle));
      writeFileSync(f, await rangee.screenshot({ animations: 'disabled' }));
      ecrits.push(f);
      await page.close();
    }
  } finally {
    await contexte.close();
  }
  return ecrits;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href)
  await lancer('captures', async () => {
    const { values } = parseArgs({ options: { marque: { type: 'string' } } });
    if (!values.marque) throw new Error('usage : npm run captures -- --marque <dossier>');
    // Par npm --prefix atelier, le dossier est relatif à l'endroit d'où npm a été lancé.
    const dossier = resolve(process.env.INIT_CWD ?? process.cwd(), values.marque);
    themeClair(dossier);
    if (!construiteAJour()) {
      console.log('La version construite des stories manque ou n’a pas les composants à la marque : construction (environ une minute).');
      const r = spawnSync('npm', ['run', 'build'], { cwd: ICI, stdio: 'ignore' });
      if (r.status !== 0 || !construiteAJour()) throw new Error('construction des stories impossible : lancer npm ci, puis npm run build, dans le dossier des composants');
    }
    const serveur = await servirConstruite();
    const navigateur = await lancerChromium();
    try {
      const ecrits = await capturer({ dossier, sortie: dossier, base: serveur.base, navigateur });
      console.log(`${ecrits.length} composants capturés à la marque, dans ${join(dossier, 'composants')}.`);
    } finally {
      await navigateur.close();
      await serveur.arreter();
    }
    return 0;
  });
