// @ts-check
/**
 * Les écrans, côté serveur : retirer une page, en ajouter une après l'avoir vérifiée, valider la liste quand la mesure
 * est lancée dans le chat (D89), et la vignette de chaque page (D77) ; la dette vue, la marque, les fondations vues ; le rendu validé et la
 * revue rouverte (D86). Toute écriture passe par projet.json (les pages) ou par les
 * sorties (la validation, les vignettes) ; le site n'est jamais modifié.
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { lireProjet, ecrirePages, ecrireMarque } from './projet.js';
import { calculerEtat, empreinteDesChoix, AVANCEMENT, DETTE_VUE, FONDATIONS_VUES, PAGES_VALIDEES, RENDU_VALIDE, REVUE_ROUVERTE } from './etat.js';
import { entreeDe } from './marque.js';
import { lancerChromium } from '../browser/lancement.js';
import { ecrireRemise, message } from './remise.js';
import { execFileSync } from 'node:child_process';

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
  if (!r.ok) return { ok: false, raison: 'Cette page n’existe pas sur ce site.' };
  if (!/text\/html/i.test(r.headers.get('content-type') ?? '')) return { ok: false, raison: 'Cette adresse n’est pas une page.' };
  const nom = titreDe(await r.text());
  ecrirePages(fichier, id, [...pagesDe(s), { path: chemin, ...(nom ? { name: nom } : {}) }]);
  return { ok: true, chemin };
}

/**
 * Valide les pages de chaque site : la mesure lancée dans le chat, par `parcours --passer pages` (D77, D89, D92).
 * @param {string} fichier
 */
export function validerPages(fichier) {
  const p = lireProjet(fichier);
  if (p.sites.some((s) => !s.pages.length)) throw new Error('un site sans page ne se mesure pas');
  mkdirSync(p.sorties, { recursive: true });
  writeFileSync(join(p.sorties, PAGES_VALIDEES), `${JSON.stringify(Object.fromEntries(p.sites.map((s) => [s.id, s.pages])), null, 2)}\n`);
  // Une mesure neuve repart d'un avancement vide (D93).
  rmSync(join(p.sorties, AVANCEMENT), { force: true });
}

/**
 * La dette vue : « Définir ma marque », dans le chat, par `parcours --passer dette` (D78, D92).
 * @param {string} fichier
 */
export function detteVue(fichier) {
  const p = lireProjet(fichier);
  mkdirSync(p.sorties, { recursive: true });
  writeFileSync(join(p.sorties, DETTE_VUE), `${JSON.stringify({ vue: true }, null, 2)}\n`);
}

/** Les fondations regardées (D83) : « Comparer mon site », dans le chat (`parcours --passer fondations`, D92), rend la main à l'outil, qui lance la réduction. @param {string} fichier */
export function fondationsVues(fichier) {
  const p = lireProjet(fichier);
  mkdirSync(p.sorties, { recursive: true });
  writeFileSync(join(p.sorties, FONDATIONS_VUES), `${JSON.stringify({ vues: true }, null, 2)}\n`);
}

/**
 * Le rendu validé : « Valider mon rendu », dans le chat (`parcours --passer rendu`, D86, D92), pour la vérification regardée. Une vérification plus
 * récente rouvre l'avant et après.
 * @param {string} fichier
 */
export function validerRendu(fichier) {
  const p = lireProjet(fichier);
  const a = calculerEtat(p, { base: p.dossier }).avantApres;
  if (!a) throw new Error('aucun rendu à valider');
  writeFileSync(join(p.sorties, RENDU_VALIDE), `${JSON.stringify({ verification: a.verification }, null, 2)}\n`);
  // La remise (D87) : le dossier à donner au développeur, écrit pour le rendu validé.
  const e = calculerEtat(p, { base: p.dossier });
  if (e.remise && e.bilan) ecrireRemise(e.remise, { dossierAjout: a.dossierAjout, verification: a.verification, controle: e.bilan });
}

/** Le presse-papiers du Mac ; ailleurs, une panne. @param {string} texte */
function presse(texte) {
  if (process.platform !== 'darwin') throw new Error('presse-papiers : macOS seulement');
  execFileSync('pbcopy', { input: texte });
}

/**
 * « Copier le message » (D87) : le serveur, sur le Mac de l'humain, met le message de la remise dans le
 * presse-papiers (pbcopy). Rend vrai si la copie est faite ; ailleurs que sur macOS, faux.
 * @param {string} fichier @param {{ copier?: (texte: string) => void }} [o]
 */
export function copierMessage(fichier, { copier = presse } = {}) {
  const p = lireProjet(fichier);
  const r = calculerEtat(p, { base: p.dossier }).remise;
  if (!r) throw new Error('aucune remise à copier');
  try {
    copier(message(r));
    return true;
  } catch {
    return false;
  }
}

/**
 * Revenir sur une décision (D86), dit dans le chat (`parcours --revenir`, D92) : le rendu n'est plus validé, et la revue rouverte au designer jusqu'à un nouvel
 * export des choix ; la réduction, les feuilles et la vérification se refont ensuite, et l'avant et après revient.
 * @param {string} fichier
 */
export function rouvrirRevue(fichier) {
  const p = lireProjet(fichier);
  rmSync(join(p.sorties, RENDU_VALIDE), { force: true });
  mkdirSync(p.sorties, { recursive: true });
  writeFileSync(join(p.sorties, REVUE_ROUVERTE), `${JSON.stringify({ decisions: empreinteDesChoix(p.sorties) }, null, 2)}\n`);
}

/**
 * Confirme la marque montrée à l'écran (D80), dans le chat (`parcours --passer marque`, D92) : écrit son entrée, `marques/<id>/entree.json` à côté du projet, et la
 * nomme dans projet.json. Une marque refusée ne se confirme pas.
 * @param {string} fichier
 */
export function confirmerMarque(fichier) {
  const p = lireProjet(fichier);
  const m = calculerEtat(p, { base: p.dossier }).marque;
  if (!m) throw new Error('aucune marque à confirmer');
  if (m.apercu.motifs.length) throw new Error('une marque refusée ne se confirme pas');
  const chemin = join('marques', m.site.id, 'entree.json');
  mkdirSync(join(p.dossier, 'marques', m.site.id), { recursive: true });
  writeFileSync(join(p.dossier, chemin), `${JSON.stringify(entreeDe(p.produit, m.choix), null, 2)}\n`);
  ecrireMarque(fichier, m.site.id, chemin);
}

/** Le choix de la marque changé à l'écran (D80), par site, dans les sorties. */
const MARQUE_CHOISIE = 'marque.json';

/**
 * Change une couleur de la marque à l'écran (D80) : une couleur relevée, ou un code tapé. La valeur que porte déjà
 * l'autre couleur de la marque s'échange avec elle. Rend le refus en une phrase, ou null.
 * @param {string} fichier @param {'primary' | 'accent'} role @param {string} saisie
 * @returns {string | null}
 */
export function choisirCouleur(fichier, role, saisie) {
  const p = lireProjet(fichier);
  const m = calculerEtat(p, { base: p.dossier }).marque;
  if (!m) throw new Error('aucune marque à changer');
  if (role !== 'primary' && role !== 'accent') throw new Error(`couleur inconnue : ${role}`);
  const v = saisie.trim().toLowerCase().replace(/^#?/, '#');
  const hex = /^#[0-9a-f]{3}$/.test(v) ? `#${[...v.slice(1)].map((x) => x + x).join('')}` : v;
  if (!/^#[0-9a-f]{6}$/.test(hex)) return 'Tape un code de couleur à six chiffres, comme #2b4c7e.';
  const autre = role === 'primary' ? 'accent' : 'primary';
  /** @type {Record<string, string | null>} */
  const c = { primary: m.choix.primary, accent: m.choix.accent, troisieme: m.choix.troisieme };
  if (c[autre] === hex) c[autre] = c[role];
  if (c.troisieme === hex) c.troisieme = c[role];
  c[role] = hex;
  ecrireChoix(p.sorties, m.site.id, c);
  return null;
}

/**
 * Échange l'accent et la troisième couleur (D80).
 * @param {string} fichier
 */
export function echangerAccent(fichier) {
  const p = lireProjet(fichier);
  const m = calculerEtat(p, { base: p.dossier }).marque;
  if (!m || !m.choix.troisieme) throw new Error('aucune troisième couleur à échanger');
  ecrireChoix(p.sorties, m.site.id, { primary: m.choix.primary, accent: m.choix.troisieme, troisieme: m.choix.accent });
}

/** @param {string} sorties @param {string} id @param {Record<string, string | null>} choix */
function ecrireChoix(sorties, id, choix) {
  const f = join(sorties, MARQUE_CHOISIE);
  const tout = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  tout[id] = choix;
  mkdirSync(sorties, { recursive: true });
  writeFileSync(f, `${JSON.stringify(tout, null, 2)}\n`);
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
