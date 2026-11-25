// @ts-check
/**
 * L'écran des pages (D77), côté serveur : retirer une page, en ajouter une après l'avoir vérifiée, valider la liste au
 * clic sur « Mesurer », et la vignette de chaque page. Toute écriture passe par projet.json (les pages) ou par les
 * sorties (la validation, les vignettes) ; le site n'est jamais modifié.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireProjet, ecrirePages } from './projet.js';
import { PAGES_VALIDEES } from './etat.js';
import { lancerChromium } from '../browser/lancement.js';

/** Délai de la vérification d'une page ajoutée. */
const DELAI_MS = 10_000;

/** @typedef {import('./projet.js').Site} Site */

/** Les pages d'un site, avec leur nom. @param {Site} s */
const pagesDe = (s) => s.pages.map((p) => ({ path: p, ...(s.noms[p] ? { name: s.noms[p] } : {}) }));

/**
 * Le site d'un projet, ou une panne qui le nomme.
 * @param {string} fichier @param {string} id
 */
function site(fichier, id) {
  const s = lireProjet(fichier).sites.find((x) => x.id === id);
  if (!s) throw new Error(`aucun site ${id}`);
  return s;
}

/**
 * Retire une page d'un site.
 * @param {string} fichier @param {string} id @param {string} chemin
 */
export function retirerPage(fichier, id, chemin) {
  const s = site(fichier, id);
  ecrirePages(fichier, id, pagesDe(s).filter((p) => p.path !== chemin));
}

/** Le titre d'une page HTML, ou null. @param {string} html */
const titreDe = (html) => {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const t = m?.[1].replace(/\s+/g, ' ').trim();
  return t || null;
};

/**
 * Ajoute une page à un site, si elle est sur le même site et qu'elle répond ; sinon, la raison en une phrase.
 * @param {string} fichier @param {string} id @param {string} saisie  une adresse ou un chemin
 * @param {{ chercher?: typeof fetch }} [o]
 * @returns {Promise<{ ok: true, chemin: string } | { ok: false, raison: string }>}
 */
export async function ajouterPage(fichier, id, saisie, { chercher = fetch } = {}) {
  const s = site(fichier, id);
  const v = saisie.trim();
  if (!v) return { ok: false, raison: 'Tape l’adresse d’une page de ce site.' };
  /** @type {URL} */
  let u;
  try {
    u = new URL(/^[a-z]+:\/\//i.test(v) ? v : /^[^/]+\.[a-z]{2,}(?::\d+)?\//i.test(v) ? `http://${v}` : v.startsWith('/') ? v : `/${v}`, s.origine);
  } catch {
    return { ok: false, raison: 'Cette adresse ne se lit pas.' };
  }
  if (u.host !== new URL(s.origine).host) return { ok: false, raison: `Cette page n’est pas sur ${new URL(s.origine).host}.` };
  const chemin = `${u.pathname}${u.search}`;
  if (s.pages.includes(chemin)) return { ok: false, raison: 'Cette page est déjà dans la liste.' };
  /** @type {Response} */
  let r;
  try {
    r = await chercher(new URL(chemin, s.origine), { signal: AbortSignal.timeout(DELAI_MS), redirect: 'follow' });
  } catch {
    return { ok: false, raison: 'Cette page ne répond pas.' };
  }
  if (!r.ok) return { ok: false, raison: `Cette page ne répond pas (erreur ${r.status}).` };
  if (!/text\/html/i.test(r.headers.get('content-type') ?? '')) return { ok: false, raison: 'Cette adresse n’est pas une page.' };
  const nom = titreDe(await r.text());
  ecrirePages(fichier, id, [...pagesDe(s), { path: chemin, ...(nom ? { name: nom } : {}) }]);
  return { ok: true, chemin };
}

/**
 * Valide les pages de chaque site : le clic sur « Mesurer » (D77). `parcours --attendre` voit la main passer à l'outil.
 * @param {string} fichier
 */
export function validerPages(fichier) {
  const p = lireProjet(fichier);
  if (p.sites.some((s) => !s.pages.length)) throw new Error('un site sans page ne se mesure pas');
  mkdirSync(p.sorties, { recursive: true });
  writeFileSync(join(p.sorties, PAGES_VALIDEES), `${JSON.stringify(Object.fromEntries(p.sites.map((s) => [s.id, s.pages])), null, 2)}\n`);
}

/** Nom de fichier d'une vignette. @param {string} chemin */
const fichierVignette = (chemin) => `${chemin.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'accueil'}.png`;

/**
 * Les vignettes des pages : une capture du haut de la page, prise à la première demande et gardée dans les sorties.
 * Un seul Chromium, lancé à la première capture.
 */
export function vignettes() {
  /** @type {Promise<import('playwright-core').Browser> | null} */
  let navigateur = null;
  /** @type {Map<string, Promise<Buffer>>} */
  const enCours = new Map();
  return {
    /**
     * La capture d'une page, ou une panne.
     * @param {string} fichier @param {string} id @param {string} chemin
     * @returns {Promise<Buffer>}
     */
    async capture(fichier, id, chemin) {
      const p = lireProjet(fichier);
      const s = p.sites.find((x) => x.id === id);
      if (!s || !s.pages.includes(chemin)) throw new Error('page absente du projet');
      const dossier = join(p.sorties, 'vignettes', s.id);
      const f = join(dossier, fichierVignette(chemin));
      if (existsSync(f)) return readFileSync(f);
      if (!enCours.has(f))
        enCours.set(
          f,
          (async () => {
            navigateur ??= lancerChromium();
            const page = await (await navigateur).newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.25 });
            try {
              await page.goto(new URL(chemin, s.origine).href, { waitUntil: 'load', timeout: DELAI_MS });
              const png = await page.screenshot({ type: 'png' });
              mkdirSync(dossier, { recursive: true });
              writeFileSync(f, png);
              return png;
            } finally {
              await page.close();
            }
          })().finally(() => enCours.delete(f)),
        );
      return /** @type {Promise<Buffer>} */ (enCours.get(f));
    },
    async fermer() {
      if (navigateur) await (await navigateur).close();
    },
  };
}
