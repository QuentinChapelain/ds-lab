// @ts-check
/**
 * Orchestration de npm run composants (D46) : un navigateur, un contexte, les pages d'une seule origine ouvertes chacune
 * dans son onglet jusqu'aux captures ; le relevé de chaque page, puis les captures des premières occurrences, puis le
 * constat et ses sorties. `recalculer` refait le constat depuis un relevé écrit, sans navigateur.
 * Une page qui ne se charge pas (panne, statut HTTP d'erreur) n'est pas relevée ; le constat est écrit sans elle et la
 * commande sort en 2. Aucune page relevée : rien n'est écrit.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveAddresses, groupByHost } from '../lib/addresses.js';
import { lireJson } from '../lib/fichiers.js';
import { gotoAndSettle, DEFAULT_WAIT_MS } from '../browser/navigate.js';
import { lancerChromium } from '../browser/lancement.js';
import { releverPieces, capturer } from '../browser/composants.js';
import { pageName } from '../verify/reference.js';
import { stampOf, freeOutputDir } from '../report/json.js';
import { ecrireConstat } from '../report/constat.js';
import { construireConstat, aCapturer } from './constat.js';
import { lireDecisions } from './decisions.js';
import { idDe } from './pieces.js';

const PKG = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'));

/**
 * Table de signatures validée ; une erreur d'une ligne nomme le fichier.
 * @param {string} chemin
 * @returns {{ framework: string, version: string, pieces: import('../browser/composants.js').Piece[] }}
 */
function lireSignatures(chemin) {
  const t = lireJson(chemin);
  const err = (/** @type {string} */ m) => new Error(`${chemin} : ${m}`);
  if (!t || typeof t !== 'object' || typeof t.framework !== 'string' || !t.framework.trim()) throw err('« framework » (son nom) est attendu');
  if (!Array.isArray(t.pieces) || !t.pieces.length) throw err('« pieces » (une liste non vide) est attendu');
  const pieces = t.pieces.map((/** @type {any} */ p, /** @type {number} */ i) => {
    if (!p || typeof p.selecteur !== 'string' || typeof p.nom !== 'string' || !p.selecteur.trim() || !p.nom.trim())
      throw err(`pièce ${i + 1} : « selecteur » et « nom » sont attendus`);
    if (p.type !== undefined && (typeof p.type !== 'string' || !p.type.trim())) throw err(`pièce ${i + 1} : « type » doit être un nom`);
    return { selecteur: p.selecteur, nom: p.nom, ...(p.type ? { type: p.type } : {}), framework: t.framework };
  });
  return { framework: t.framework, version: String(t.version ?? ''), pieces };
}

/** Date locale, à la minute : 2026-11-18 19:05. @param {Date} d */
const dateDe = (d) => stampOf(d).replace(/T(\d\d)(\d\d)$/, ' $1:$2');

/**
 * @typedef {object} OptionsComposants
 * @property {string[]} addresses
 * @property {string[]} [signatures]   tables de signatures (aucune : tout marche pareil, sans framework)
 * @property {string} [decisions]      fichier de décisions du designer
 * @property {{ width: number, height: number }} [viewport]
 * @property {number} [waitMs]
 * @property {string} [storageState]
 * @property {string} [outRoot]        défaut : local/composants
 * @property {Date} [now]
 * @property {(m: string) => void} [log]
 */

/**
 * @param {OptionsComposants} opts
 * @returns {Promise<{ dir: string, fichiers: string[], constat: ReturnType<typeof construireConstat>, tombees: string[] }>}
 */
export async function runComposants(opts) {
  const { signatures = [], viewport = { width: 1366, height: 900 }, waitMs = DEFAULT_WAIT_MS, storageState, outRoot = 'local/composants', now = new Date(), log = () => {} } = opts;
  const tables = signatures.map(lireSignatures);
  const decisions = opts.decisions ? lireDecisions(opts.decisions) : undefined;
  const urls = resolveAddresses(opts.addresses);
  const hotes = [...groupByHost(urls).keys()];
  if (hotes.length > 1) throw new Error(`une seule origine par constat (reçu ${hotes.join(', ')})`);
  const pieces = tables.flatMap((t) => t.pieces);
  /** @type {import('./constat.js').ReleveFichier['pages']} */
  const pages = [];
  /** @type {import('./pieces.js').Ligne[]} */
  const lignes = [];
  /** @type {Map<string, Buffer>} */
  const images = new Map();
  const browser = await lancerChromium();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
    /** @type {Map<number, import('playwright-core').Page>} */
    const onglets = new Map();
    for (const [i, url] of urls.entries()) {
      const page = await context.newPage();
      const nom = pageName(url);
      try {
        const nav = await gotoAndSettle(page, url, { waitMs });
        if (typeof nav.status === 'number' && nav.status >= 400) throw new Error(`statut HTTP ${nav.status}`);
        const releve = await releverPieces(page, { pieces });
        lignes.push(...releve.map((r) => ({ ...r, page: i, id: idDe(i, r.index) })));
        pages.push({ adresse: url, nom, statut: nav.status });
        onglets.set(i, page);
        log(`${url} : ${releve.length} éléments relevés`);
      } catch (e) {
        const erreur = String(/** @type {any} */ (e)?.message ?? e).split('\n')[0];
        pages.push({ adresse: url, nom, statut: null, erreur });
        log(`${url} : page non relevée (${erreur})`);
        await page.close().catch(() => {});
      }
    }
    if (!onglets.size) throw new Error("aucune page relevée : rien d'écrit");
    /** @type {import('./constat.js').ReleveFichier} */
    const brut = {
      outil: { nom: PKG.name, version: PKG.version },
      date: dateDe(now),
      site: new URL(urls[0]).origin,
      fenetre: viewport,
      frameworks: tables.map((t) => ({ nom: t.framework, version: t.version })),
      pages,
      lignes,
      captures: [],
    };
    brut.captures = aCapturer(brut);
    for (const id of brut.captures) {
      const l = /** @type {import('./pieces.js').Ligne} */ (lignes.find((x) => x.id === id));
      images.set(`captures/${id}.png`, await capturer(/** @type {import('playwright-core').Page} */ (onglets.get(l.page)), l.index));
    }
    const constat = construireConstat(brut, decisions);
    const dir = await freeOutputDir(outRoot, hotes[0], stampOf(now));
    const fichiers = await ecrireConstat(dir, brut, constat, images);
    return { dir, fichiers, constat, tombees: pages.filter((p) => p.erreur).map((p) => `${p.adresse} (${p.erreur})`) };
  } finally {
    await browser.close();
  }
}

/**
 * Constat recalculé depuis un relevé écrit (releve.json et ses captures), sans navigateur, avec les décisions données.
 * @param {{ releve: string, decisions?: string, outRoot?: string, now?: Date }} opts
 */
export async function recalculer({ releve, decisions, outRoot = 'local/composants', now = new Date() }) {
  /** @type {import('./constat.js').ReleveFichier} */
  const brut = lireJson(join(releve, 'releve.json'));
  if (!brut || !Array.isArray(brut.lignes) || !Array.isArray(brut.pages) || typeof brut.site !== 'string') throw new Error(`${join(releve, 'releve.json')} : relevé illisible (lignes, pages, site attendus)`);
  const d = decisions ? lireDecisions(decisions) : undefined;
  /** @type {Map<string, Buffer>} */
  const images = new Map();
  for (const id of brut.captures ?? []) {
    const chemin = `captures/${id}.png`;
    try {
      images.set(chemin, await readFile(join(releve, chemin)));
    } catch {
      throw new Error(`${join(releve, chemin)} : capture absente du relevé`);
    }
  }
  const constat = construireConstat(brut, d);
  const dir = await freeOutputDir(outRoot, new URL(brut.site).host, stampOf(now));
  const fichiers = await ecrireConstat(dir, brut, constat, images);
  return { dir, fichiers, constat, tombees: brut.pages.filter((p) => p.erreur).map((p) => `${p.adresse} (${p.erreur})`) };
}
