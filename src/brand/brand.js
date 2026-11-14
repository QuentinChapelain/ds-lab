// @ts-check
/**
 * Lot M (marque d'abord) : la marque déclarée dans la cible (bloc brand), sans navigateur.
 *
 *   M1  un emplacement gris (chroma OKLCH < 0,02) rejoint neutre ; la déclaration de la cible
 *       (clé scale d'un emplacement) l'emporte toujours ;
 *   M3  la valeur d'un emplacement ou d'une de ses variantes va sur l'échelle de l'emplacement ;
 *   M7  contradictions entre le back-office (valeur déclarée d'une variable) et la feuille :
 *       repli de var(--variable, valeur) différent ; la cible tranche (variante d'un emplacement).
 *
 * Forme du bloc brand :
 *   { slots: { <emplacement>: { variable?, value, scale?, variants?: [{ variable?, value, from? }] } },
 *     status?: [<échelle>, …] }
 */
import { converter } from 'culori';
import { normalizeColor } from '../lib/color.js';

/** M1 : en dessous, une couleur est un gris. */
export const GREY_CHROMA = 0.02;
const toOklch = converter('oklch');

/** @param {string} hex */
export const chromaOf = (hex) => toOklch(hex)?.c ?? 0;
/** @param {string} hex */
export const isGrey = (hex) => chromaOf(hex) < GREY_CHROMA;

/** @param {string} v */
const hexOf = (v) => normalizeColor(v)?.hex ?? v.toLowerCase();

/**
 * @typedef {{ slot: string, variable?: string, value: string, scale: string, rule?: string }} Slot
 * @typedef {{ slots: Slot[], byValue: Map<string, { slot: string, scale: string }>, brandScales: Set<string>, status: Set<string>, variables: Record<string, string> }} Brand
 */

/**
 * @param {any} brand  bloc brand de la cible
 * @param {Set<string>} scales  échelles de la valise
 * @param {(hex: string) => string} nearestScale  échelle de la valeur la plus proche de la valise
 * @returns {Brand}
 */
export function resolveBrand(brand, scales, nearestScale) {
  /** @type {Slot[]} */
  const slots = [];
  /** @type {Brand['byValue']} */
  const byValue = new Map();
  const brandScales = new Set();
  /** @type {Record<string, string>} */
  const variables = {};
  for (const [slot, s] of Object.entries(brand?.slots ?? {})) {
    const value = hexOf(s.value);
    const grey = isGrey(value);
    /** @type {Slot} */
    const out = { slot, ...(s.variable ? { variable: s.variable } : {}), value, scale: '' };
    if (s.scale) out.scale = s.scale;
    else if (grey) Object.assign(out, { scale: 'neutre', rule: 'M1' });
    else out.scale = scales.has(slot) ? slot : nearestScale(value);
    slots.push(out);
    if (!grey) brandScales.add(out.scale);
    if (s.variable) variables[s.variable] = value;
    byValue.set(value, { slot, scale: out.scale });
    for (const v of s.variants ?? []) {
      const vv = hexOf(v.value);
      if (!byValue.has(vv)) byValue.set(vv, { slot, scale: out.scale });
      if (v.variable) variables[v.variable] = vv;
    }
  }
  return { slots, byValue, brandScales, status: new Set(brand?.status ?? []), variables };
}

const COLOR_TOKEN = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi;
const VAR_FALLBACK = /var\(\s*(--[\w-]+)\s*,\s*([^()]*(?:\([^()]*\)[^()]*)*)\)/g;

/**
 * Nom court d'une feuille, pour les références « fichier.css:ligne ».
 * @param {{ href: string | null, inline?: boolean, startLine?: number }} s
 */
const nameOf = (s) => (s.href ? decodeURIComponent(new URL(s.href).pathname.split('/').pop() || s.href) : 'style');

/**
 * M0 et M7 : replis de var() contraires à la valeur posée par le back-office, et toutes les
 * lignes de la feuille qui portent la valeur contraire (repli ou en dur).
 * @param {{ href: string | null, inline?: boolean, startLine?: number, text: string }[]} sheets
 * @param {Record<string, string>} variables  nom → valeur du back-office (hexadécimal)
 * @returns {{ variable: string, backOffice: string, sheet: string, where: string[] }[]}
 */
export function contradictionsIn(sheets, variables) {
  /** @type {Map<string, { variable: string, backOffice: string, sheet: string, where: string[] }>} */
  const found = new Map();
  for (const s of sheets) {
    for (const m of s.text.matchAll(VAR_FALLBACK)) {
      const variable = m[1];
      if (!(variable in variables)) continue;
      const fb = normalizeColor(m[2].trim());
      if (!fb || fb.hex === variables[variable]) continue;
      const key = `${variable}|${fb.hex}`;
      if (!found.has(key)) found.set(key, { variable, backOffice: variables[variable], sheet: fb.hex, where: [] });
    }
  }
  if (!found.size) return [];
  const wanted = new Set([...found.values()].map((c) => c.sheet));
  /** @type {Map<string, string[]>} */
  const lines = new Map([...wanted].map((h) => [h, []]));
  for (const s of sheets) {
    const name = nameOf(s);
    const offset = s.inline ? s.startLine ?? 0 : 0;
    s.text.split('\n').forEach((line, i) => {
      for (const tok of line.match(COLOR_TOKEN) ?? []) {
        const hex = normalizeColor(tok)?.hex;
        const where = `${name}:${offset + i + 1}`;
        const list = hex ? lines.get(hex) : undefined;
        if (list && !list.includes(where)) list.push(where);
      }
    });
  }
  return [...found.values()].map((c) => ({ ...c, where: lines.get(c.sheet) ?? [] }));
}
