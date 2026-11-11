// @ts-check
/**
 * Analyse du déclaré : toutes les feuilles de toutes les pages, dédoublonnées,
 * puis comptage par famille selon les conventions D1 à D15
 * (fixtures/marque-demo/expected.json).
 *
 * - @projectwallace/css-analyzer : couleurs, font-family, font-size, line-height,
 *   box-shadow, rayons, durées et courbes (valeurs écrites, avec leurs lignes) ;
 * - PostCSS : marges, retraits, gap, graisses, letter-spacing, épaisseurs de
 *   bordure, opacity, points de rupture, propriétés personnalisées, et les
 *   références var() dans les propriétés de couleur.
 */
import { createHash } from 'node:crypto';
import { analyze } from '@projectwallace/css-analyzer';
import postcss from 'postcss';
import { normalizeColor, isOpaque, cluster } from '../lib/color.js';
import { splitSpaces } from '../lib/units.js';
import { attributeSource } from '../lib/sources.js';
import {
  isGlobalKeyword,
  lengthKey,
  lengthOrKeywordKey,
  durationKey,
  fontFamilyKey,
  fontWeightKey,
  lineHeightKey,
  opacityKey,
  timingKey,
  shadowKey,
  mediaWidths,
} from '../lib/values.js';

/** Familles du déclaré, dans l'ordre du rapport. */
export const DECLARED_FAMILIES = /** @type {const} */ ([
  'colors',
  'fontFamilies',
  'fontSizes',
  'fontWeights',
  'lineHeights',
  'letterSpacings',
  'margins',
  'paddings',
  'gaps',
  'borderWidths',
  'radii',
  'shadows',
  'opacities',
  'durations',
  'timingFunctions',
  'breakpoints',
]);

/** Nombre maximal d'emplacements gardés par valeur. */
const MAX_LOCATIONS = 10;

/**
 * @typedef {import('../browser/sheets.js').CollectedSheet} CollectedSheet
 * @typedef {{ pageUrl: string, sheets: CollectedSheet[] }} PageSheets
 * @typedef {CollectedSheet & { id: number, pages: string[], hash: string }} UniqueSheet
 */

/** @param {string} s */
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

/**
 * D1 : dédoublonne les feuilles de plusieurs pages par URL et texte.
 * @param {PageSheets[]} perPage
 * @returns {UniqueSheet[]}
 */
export function dedupeSheets(perPage) {
  /** @type {Map<string, UniqueSheet>} */
  const byKey = new Map();
  for (const { pageUrl, sheets } of perPage) {
    for (const s of sheets) {
      const hash = sha(s.text);
      const key = `${s.href ?? (s.inline ? 'inline' : 'construite')}\n${hash}`;
      const known = byKey.get(key);
      if (known) {
        if (!known.pages.includes(pageUrl)) known.pages.push(pageUrl);
      } else {
        byKey.set(key, { ...s, id: byKey.size, pages: [pageUrl], hash });
      }
    }
  }
  return [...byKey.values()];
}

/**
 * @typedef {object} ValueEntry
 * @property {number} count
 * @property {boolean} normalizable
 * @property {Record<string, number>} originals
 * @property {Record<string, number>} sources
 * @property {Record<string, number>} properties
 * @property {{ sheet: number, line: number }[]} locations
 */

/**
 * @typedef {object} Family
 * @property {number} total
 * @property {number} distinct
 * @property {number} nonNormalizable
 * @property {Record<string, ValueEntry>} values
 */

function createCollector() {
  /** @type {Map<string, ValueEntry>} */
  const values = new Map();
  let total = 0;
  let nonNormalizable = 0;
  return {
    /**
     * @param {{ key: string, normalizable: boolean }} k
     * @param {{ raw: string, source: string, sheet: number, line: number, property?: string }} at
     */
    add(k, at) {
      total++;
      if (!k.normalizable) nonNormalizable++;
      let e = values.get(k.key);
      if (!e) {
        e = { count: 0, normalizable: k.normalizable, originals: {}, sources: {}, properties: {}, locations: [] };
        values.set(k.key, e);
      }
      e.count++;
      e.originals[at.raw] = (e.originals[at.raw] ?? 0) + 1;
      e.sources[at.source] = (e.sources[at.source] ?? 0) + 1;
      if (at.property) e.properties[at.property] = (e.properties[at.property] ?? 0) + 1;
      if (e.locations.length < MAX_LOCATIONS) e.locations.push({ sheet: at.sheet, line: at.line });
    },
    /** @returns {Family} */
    result() {
      const sorted = [...values.entries()].sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1));
      return { total, distinct: values.size, nonNormalizable, values: Object.fromEntries(sorted) };
    },
  };
}

/** Propriétés porteuses de couleur, pour repérer les var() (declared.colors.varReferences). */
const COLOR_PROPERTY =
  /^(color|background(-color)?|border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?|outline(-color)?|(box|text)-shadow|fill|stroke|caret-color|accent-color|text-decoration(-color)?|text-emphasis(-color)?|column-rule(-color)?)$/;

const MARGIN = /^margin(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/;
const PADDING = /^padding(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/;
const GAP = /^(gap|row-gap|column-gap|grid-gap|grid-row-gap|grid-column-gap)$/;
const BORDER_SHORTHAND = /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/;
const BORDER_WIDTH = /^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?-width$/;
const WIDTH_KEYWORD = /^(thin|medium|thick)$/;
const LENGTH_TOKEN = /^-?(?:\d+\.?\d*|\.\d+)[a-z%]*$|^(calc|var|min|max|clamp)\(/;
const FONT_WEIGHT_TOKEN = /^(bold|bolder|lighter|[1-9]\d{0,2})$/;

/**
 * Graisse écrite dans le raccourci `font` (avant la taille). `normal` est
 * ambigu dans ce raccourci (style, variante ou graisse) : il n'est pas compté.
 * @param {string} value
 * @returns {string | null}
 */
function weightInFontShorthand(value) {
  for (const tok of splitSpaces(value.toLowerCase())) {
    if (/^-?(?:\d+\.?\d*|\.\d+)[a-z%]+/.test(tok) || /^(xx?-)?(small|large)$|^medium$|^smaller$|^larger$/.test(tok)) break;
    if (FONT_WEIGHT_TOKEN.test(tok)) return tok;
  }
  return null;
}

/**
 * @param {UniqueSheet[]} sheets
 * @param {{ rootPx: number, sources: import('../lib/sources.js').CompiledSources | null }} opts
 */
export function analyzeDeclared(sheets, { rootPx, sources }) {
  /** @type {Record<string, ReturnType<typeof createCollector>>} */
  const fam = Object.fromEntries(DECLARED_FAMILIES.map((f) => [f, createCollector()]));
  let customProperties = 0;
  let varReferences = 0;
  let mediaOther = 0;
  let outOfGamut = 0;
  /** @type {Record<string, { distinct: Set<string>, occurrences: number }>} */
  const colorsBySource = {};
  /** @type {string[]} */
  const warnings = [];

  const sheetInfo = sheets.map((s) => {
    const firstPage = s.pages[0];
    const source = attributeSource({ href: s.href ?? undefined, inline: s.inline }, sources, firstPage);
    let crossOrigin = false;
    if (s.href) {
      try {
        crossOrigin = new URL(s.href).origin !== new URL(firstPage).origin;
      } catch {
        /* URL non http : laissée à false */
      }
    }
    return { s, source, crossOrigin, rules: 0, selectorsHash: '', parseError: /** @type {string | null} */ (null) };
  });

  for (const info of sheetInfo) {
    const { s, source } = info;
    /** @param {string} raw */
    const at = (raw, /** @type {number} */ line, /** @type {string | undefined} */ property) => ({
      raw,
      source,
      sheet: s.id,
      line,
      property,
    });

    // --- Wallace : valeurs écrites, avec leurs lignes.
    let w;
    try {
      w = analyze(s.text, { useLocations: true }).values;
    } catch (e) {
      warnings.push(`feuille ${s.href ?? s.id} : analyse Wallace impossible (${/** @type {Error} */ (e).message})`);
      w = null;
    }
    /**
     * @param {{ uniqueWithLocations?: Record<string, { line: number }[]> }} part
     * @param {(raw: string, line: number) => void} fn
     */
    const each = (part, fn) => {
      for (const [raw, locs] of Object.entries(part.uniqueWithLocations ?? {})) for (const l of locs) fn(raw, l.line);
    };

    if (w) {
    each(w.colors, (raw, line) => {
      const c = normalizeColor(raw);
      if (!c) return;
      if (c.outOfGamut) outOfGamut++;
      fam.colors.add({ key: c.hex, normalizable: true }, at(raw, line));
      const b = (colorsBySource[source] ??= { distinct: new Set(), occurrences: 0 });
      b.distinct.add(c.hex);
      b.occurrences++;
    });
    each(w.fontFamilies, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.fontFamilies.add(fontFamilyKey(raw), at(raw, line));
    });
    each(w.fontSizes, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.fontSizes.add(lengthOrKeywordKey(raw, rootPx), at(raw, line));
    });
    each(w.lineHeights, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.lineHeights.add(lineHeightKey(raw, rootPx), at(raw, line));
    });
    each(w.boxShadows, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.shadows.add(shadowKey(raw, rootPx), at(raw, line));
    });
    each(w.borderRadiuses, (raw, line) => {
      if (isGlobalKeyword(raw)) return;
      for (const part of splitSpaces(raw.replace('/', ' '))) fam.radii.add(lengthKey(part, rootPx), at(raw, line));
    });
    each(w.animations.durations, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.durations.add(durationKey(raw), at(raw, line));
    });
    each(w.animations.timingFunctions, (raw, line) => {
      if (!isGlobalKeyword(raw)) fam.timingFunctions.add(timingKey(raw), at(raw, line));
    });
    }

    // --- PostCSS : familles absentes de Wallace.
    let root;
    try {
      root = postcss.parse(s.text);
    } catch (e) {
      info.parseError = /** @type {Error} */ (e).message;
      warnings.push(`feuille ${s.href ?? s.id} : analyse PostCSS impossible (${info.parseError})`);
      continue;
    }
    /** @type {string[]} */
    const selectors = [];
    root.walkRules((rule) => {
      const parent = /** @type {any} */ (rule.parent);
      if (parent?.type === 'atrule' && /keyframes$/i.test(parent.name)) return;
      info.rules++;
      selectors.push(rule.selector.replace(/\s+/g, ' ').trim());
    });
    info.selectorsHash = sha(selectors.join('\n'));

    root.walkAtRules(/^media$/i, (rule) => {
      const widths = mediaWidths(rule.params);
      if (!widths.length) mediaOther++;
      for (const wd of widths) fam.breakpoints.add(wd, at(rule.params, rule.source?.start?.line ?? 0, `${wd.feature}-width`));
    });

    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      const value = decl.value;
      const line = decl.source?.start?.line ?? 0;
      if (prop.startsWith('--')) {
        customProperties++;
        return;
      }
      if (isGlobalKeyword(value)) return;
      if (COLOR_PROPERTY.test(prop) && /var\(/i.test(value)) varReferences++;

      /** @param {keyof typeof fam} f @param {{ key: string, normalizable: boolean }} k @param {string} raw */
      const add = (f, k, raw) => fam[f].add(k, at(raw, line, prop));

      if (MARGIN.test(prop)) for (const t of splitSpaces(value)) add('margins', lengthOrKeywordKey(t, rootPx), t);
      else if (PADDING.test(prop)) for (const t of splitSpaces(value)) add('paddings', lengthOrKeywordKey(t, rootPx), t);
      else if (GAP.test(prop)) for (const t of splitSpaces(value)) add('gaps', lengthOrKeywordKey(t, rootPx), t);
      else if (prop === 'font-weight') add('fontWeights', fontWeightKey(value), value);
      else if (prop === 'font') {
        const wt = weightInFontShorthand(value);
        if (wt) add('fontWeights', fontWeightKey(wt), wt);
      } else if (prop === 'letter-spacing') add('letterSpacings', lengthOrKeywordKey(value, rootPx), value);
      else if (prop === 'opacity') add('opacities', opacityKey(value), value);
      else if (BORDER_WIDTH.test(prop)) for (const t of splitSpaces(value)) add('borderWidths', lengthOrKeywordKey(t, rootPx), t);
      else if (BORDER_SHORTHAND.test(prop)) {
        for (const t of splitSpaces(value)) {
          const lt = t.toLowerCase();
          if (WIDTH_KEYWORD.test(lt) || (LENGTH_TOKEN.test(lt) && !/^var\(/.test(lt))) add('borderWidths', lengthOrKeywordKey(lt, rootPx), t);
        }
      }
    });
  }

  const families = /** @type {Record<string, Family>} */ (
    Object.fromEntries(DECLARED_FAMILIES.map((f) => [f, fam[f].result()]))
  );

  // --- Couleurs : opaques, transparentes, regroupements OKLab (méthode v1).
  const colorCounts = Object.entries(families.colors.values).map(([hex, e]) => ({ hex, n: e.count }));
  const opaque = colorCounts.filter((c) => isOpaque(c.hex));
  const colors = {
    ...families.colors,
    opaque: opaque.length,
    opaqueOnce: opaque.filter((c) => c.n === 1).length,
    translucent: colorCounts.length - opaque.length,
    outOfGamut,
    varReferences,
    bySource: Object.fromEntries(
      Object.entries(colorsBySource).map(([k, v]) => [k, { distinct: v.distinct.size, occurrences: v.occurrences }]),
    ),
    groupsDE2: cluster(colorCounts, 2),
    groupsDE5: cluster(colorCounts, 5),
  };

  return {
    rootPx,
    sheets: sheetInfo.map(({ s, source, crossOrigin, rules, selectorsHash, parseError }) => ({
      id: s.id,
      href: s.href,
      source,
      inline: s.inline,
      constructed: s.constructed,
      crossOrigin,
      pages: s.pages,
      bytes: Buffer.byteLength(s.text),
      startLine: s.startLine,
      rules,
      textHash: s.hash,
      selectorsHash,
      via: s.via,
      parseError,
    })),
    customProperties,
    families: { ...families, colors, breakpoints: { ...families.breakpoints, mediaOther } },
    warnings,
  };
}
