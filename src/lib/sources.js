// @ts-check
/**
 * Attribution des feuilles de style à une source nommée (thème, bundle, CDN…).
 *
 * Les motifs ne sont jamais écrits dans le code : ils viennent de
 * `local/sources.json` (ignoré par git) ou d'un fichier passé par `--sources`.
 * Un exemple générique est versionné dans `config/sources.example.json`.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const DEFAULT_SOURCES_PATH = 'local/sources.json';

/** Étiquettes réservées, attribuées avant toute règle. */
export const RESERVED = Object.freeze({
  inline: 'inline',
  injected: 'injecté',
  sameOrigin: 'même-origine',
  crossOrigin: 'autre-domaine',
});

/**
 * @typedef {{ label: string, match: string } | { label: string, regex: string }} SourceRule
 * @typedef {{ rules: SourceRule[], default?: string }} SourcesConfig
 * @typedef {{ label: string, test: (href: string) => boolean }} CompiledRule
 * @typedef {{ rules: CompiledRule[], default: string | null }} CompiledSources
 */

/**
 * Vérifie et compile une configuration. Lève une erreur explicite si elle est invalide.
 * @param {unknown} config
 * @returns {CompiledSources}
 */
export function compileSources(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(/** @type {any} */ (config).rules)) {
    throw new Error('sources : un objet { "rules": [...] } est attendu');
  }
  const cfg = /** @type {any} */ (config);
  const reserved = new Set(Object.values(RESERVED));
  const rules = cfg.rules.map((/** @type {any} */ r, /** @type {number} */ i) => {
    const where = `sources : règle ${i + 1}`;
    if (!r || typeof r.label !== 'string' || !r.label.trim()) throw new Error(`${where} : "label" manquant`);
    if (reserved.has(r.label)) throw new Error(`${where} : "${r.label}" est une étiquette réservée`);
    const hasMatch = typeof r.match === 'string';
    const hasRegex = typeof r.regex === 'string';
    if (hasMatch === hasRegex) throw new Error(`${where} : indiquer soit "match", soit "regex"`);
    if (hasMatch) {
      if (!r.match) throw new Error(`${where} : "match" vide`);
      return { label: r.label, test: (/** @type {string} */ h) => h.includes(r.match) };
    }
    let re;
    try {
      re = new RegExp(r.regex);
    } catch (e) {
      throw new Error(`${where} : expression invalide (${/** @type {Error} */ (e).message})`);
    }
    return { label: r.label, test: (/** @type {string} */ h) => re.test(h) };
  });
  if (cfg.default !== undefined && (typeof cfg.default !== 'string' || !cfg.default.trim())) {
    throw new Error('sources : "default" doit être une chaîne non vide');
  }
  return { rules, default: cfg.default ?? null };
}

/**
 * Charge la configuration des sources.
 * - `path` fourni : le fichier doit exister et être valide (sinon erreur) ;
 * - sinon `local/sources.json` ; s'il manque, repli sur l'attribution par origine
 *   avec un avertissement.
 * @param {{ path?: string, cwd?: string }} [opts]
 * @returns {Promise<{ sources: CompiledSources | null, path: string | null, warning: string | null }>}
 */
export async function loadSources({ path, cwd = process.cwd() } = {}) {
  const explicit = path !== undefined;
  const file = resolve(cwd, path ?? DEFAULT_SOURCES_PATH);
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (e) {
    if (!explicit && /** @type {NodeJS.ErrnoException} */ (e).code === 'ENOENT') {
      return {
        sources: null,
        path: null,
        warning: `${DEFAULT_SOURCES_PATH} absent : attribution par origine seulement (${RESERVED.inline}, ${RESERVED.sameOrigin}, ${RESERVED.crossOrigin})`,
      };
    }
    throw new Error(`sources : lecture impossible de ${file} (${/** @type {Error} */ (e).message})`);
  }
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error(`sources : JSON invalide dans ${file} (${/** @type {Error} */ (e).message})`);
  }
  return { sources: compileSources(json), path: file, warning: null };
}

/**
 * @typedef {object} SheetRef
 * @property {string} [href]       URL de la feuille, absente pour un `<style>` ou une feuille construite.
 * @property {boolean} [inline]    Vrai pour un `<style>` du HTML d'origine. Une feuille sans URL
 *   qui n'est pas inline (feuille construite ou <style> ajouté par JavaScript) est « injecté ».
 */

/**
 * Attribue une feuille à une source.
 * Ordre : `inline` / `injecté` pour une feuille sans URL, puis les règles dans
 * l'ordre du fichier (première qui correspond), puis `default`, puis
 * l'origine (`même-origine` / `autre-domaine`) par rapport à la page.
 * @param {SheetRef} sheet
 * @param {CompiledSources | null} sources
 * @param {string} pageUrl
 * @returns {string}
 */
export function attributeSource(sheet, sources, pageUrl) {
  const href = sheet.href || '';
  if (!href) return sheet.inline ? RESERVED.inline : RESERVED.injected;
  if (sources) {
    for (const r of sources.rules) if (r.test(href)) return r.label;
    if (sources.default) return sources.default;
  }
  return sameOrigin(href, pageUrl) ? RESERVED.sameOrigin : RESERVED.crossOrigin;
}

/**
 * @param {string} a
 * @param {string} b
 */
function sameOrigin(a, b) {
  try {
    return new URL(a).origin === new URL(b).origin;
  } catch {
    return false;
  }
}
