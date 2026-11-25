// @ts-check
/**
 * Regarder un site sans le montrer (D91) : la page donnée et les pages du même site vers lesquelles elle mène, ouvertes
 * dans le Chromium du clone, sans fenêtre, rendues par leur script ; pour chacune, son titre et ses composants comptés.
 * L'IA y retient les pages qui portent le plus de composants. Rien n'est écrit ; le volet de l'humain reste sur l'écran.
 */
import { lancerChromium } from '../browser/lancement.js';

/** Accord en nombre. @param {number} n @param {string} un @param {string} plusieurs */
const nombre = (n, un, plusieurs) => `${n} ${n > 1 ? plusieurs : un}`;

/** Délai de chargement d'une page. */
const DELAI_MS = 10_000;
/** Au plus tant de pages regardées, la page donnée comprise. */
const MAX_PAGES = 20;

/**
 * @typedef {{ boutons: number, champs: number, liens: number, images: number, formulaires: number, tableaux: number }} Composants
 * @typedef {{ chemin: string, titre: string, composants: Composants, total: number }} PageVue
 * @typedef {{ ok: true, origine: string, pages: PageVue[], nonVues: number } | { ok: false, raison: string }} Regard
 */

/**
 * Ce que compte une page rendue : ses composants par famille, et les chemins des liens du même site.
 * Exécuté dans la page : rien d'extérieur n'y est lu.
 */
function relever() {
  const n = (/** @type {string} */ s) => document.querySelectorAll(s).length;
  const ici = location.origin;
  const liens = [...document.querySelectorAll('a[href]')]
    .map((a) => /** @type {HTMLAnchorElement} */ (a))
    .filter((a) => a.origin === ici && /^https?:$/.test(a.protocol))
    .map((a) => a.pathname + a.search);
  return {
    titre: document.title.replace(/\s+/g, ' ').trim(),
    composants: {
      boutons: n('button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"]'),
      champs: n('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'),
      liens: n('a[href]:not([role="button"])'),
      images: n('img, svg, picture'),
      formulaires: n('form'),
      tableaux: n('table'),
    },
    liens,
  };
}

/** Un chemin qui mène à une page, pas à un fichier. @param {string} chemin */
const estPage = (chemin) => !/\.(?:pdf|zip|png|jpe?g|gif|svg|webp|ico|css|js|json|xml|txt|mp4|mp3)(?:\?|$)/i.test(chemin);

/**
 * Regarde la page donnée, puis les pages du même site vers lesquelles elle mène, dans l'ordre où elles y paraissent.
 * @param {string} adresse
 * @param {{ max?: number }} [o]
 * @returns {Promise<Regard>}
 */
export async function regarderSite(adresse, { max = MAX_PAGES } = {}) {
  /** @type {URL} */
  let depart;
  try {
    depart = new URL(/^[a-z]+:\/\//i.test(adresse.trim()) ? adresse.trim() : `http://${adresse.trim()}`);
  } catch {
    return { ok: false, raison: 'Cette adresse ne se lit pas.' };
  }
  const navigateur = await lancerChromium();
  try {
    const page = await navigateur.newPage({ viewport: { width: 1280, height: 800 } });
    /** @param {string} chemin */
    const lire = async (chemin) => {
      const r = await page.goto(new URL(chemin, depart.origin).href, { waitUntil: 'load', timeout: DELAI_MS });
      if (!r || !r.ok() || !/text\/html/i.test(r.headers()['content-type'] ?? '')) return null;
      if (new URL(page.url()).origin !== depart.origin) return null;
      return page.evaluate(relever);
    };
    /** @type {Awaited<ReturnType<typeof lire>>} */
    let premiere;
    try {
      premiere = await lire(depart.pathname + depart.search);
    } catch {
      return { ok: false, raison: `${depart.host} ne répond pas.` };
    }
    if (!premiere) return { ok: false, raison: `${depart.host} ne donne pas de page à cette adresse.` };
    const chemins = [...new Set([depart.pathname + depart.search, ...premiere.liens.filter(estPage)])];
    /** @type {PageVue[]} */
    const pages = [];
    for (const chemin of chemins.slice(0, max)) {
      let r = chemin === chemins[0] ? premiere : null;
      if (!r) {
        try {
          r = await lire(chemin);
        } catch {
          r = null;
        }
      }
      if (!r) continue;
      const total = Object.values(r.composants).reduce((a, b) => a + b, 0);
      pages.push({ chemin, titre: r.titre, composants: r.composants, total });
    }
    pages.sort((a, b) => b.total - a.total);
    return { ok: true, origine: depart.origin, pages, nonVues: Math.max(0, chemins.length - max) };
  } finally {
    await navigateur.close();
  }
}

/**
 * Les lignes du terminal : une par page, les plus riches d'abord.
 * @param {Extract<Regard, { ok: true }>} r
 */
export function lignesDuRegard(r) {
  const l = [`${r.origine} : ${nombre(r.pages.length, 'page regardée', 'pages regardées')}, sans fenêtre ; les plus riches en composants d'abord.`];
  for (const p of r.pages) {
    const c = p.composants;
    const familles = [[c.boutons, 'bouton'], [c.champs, 'champ'], [c.liens, 'lien'], [c.images, 'image'], [c.formulaires, 'formulaire'], [c.tableaux, 'tableau', 'tableaux']]
      .filter(([n]) => n)
      .map(([n, un, plusieurs]) => nombre(/** @type {number} */ (n), /** @type {string} */ (un), /** @type {string} */ (plusieurs ?? `${un}s`)));
    l.push(`  ${p.chemin}  ${p.titre || '(sans titre)'}  ${nombre(p.total, 'composant', 'composants')}${familles.length ? ` : ${familles.join(', ')}` : ''}`);
  }
  if (r.nonVues) l.push(`  ${nombre(r.nonVues, 'autre lien du site, non regardé.', 'autres liens du site, non regardés.')}`);
  return l;
}
