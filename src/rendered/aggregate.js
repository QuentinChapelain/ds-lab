// @ts-check
/**
 * Agrégation du rendu (conventions R1 à R11) : relevés bruts de chaque page
 * → familles avec contexte (propriété, rôle, pages, sélecteurs), couleurs
 * regroupées en OKLab, paires de contraste WCAG 2.1.
 */
import {
  normalizeColor,
  isOpaque,
  toLab,
  cluster,
  clusterComplete,
  withOpacity,
  blend,
  contrastRatio,
  isLargeText,
  wcagLevels,
} from '../lib/color.js';
import { toMs, splitCommas, splitSpaces } from '../lib/units.js';
import {
  lengthKey,
  fontFamilyKey,
  fontWeightKey,
  lineHeightKey,
  opacityKey,
  timingKey,
  shadowKey,
} from '../lib/values.js';

export const RENDERED_FAMILIES = /** @type {const} */ ([
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
]);

const MAX_SELECTORS = 3;

/** R13 : seuil de chroma OKLab √(a² + b²) des gris de texte. */
export const GREY_CHROMA = 0.02;

/**
 * R13 : gris de texte = couleurs rendues employées au moins une fois en color
 * (porteur de texte), de chroma OKLab < 0,02, transparence comprise ; le blanc
 * opaque est compté à part.
 * R14 : `onDark` = occurrences dont le contraste avec le fond effectif dépasse
 * le contraste avec le blanc (texte inversé), relevées au calcul du contraste.
 * @param {Record<string, { contexts: { property: string, count: number }[] }>} colorValues
 * @param {Record<string, { onDark: number, backgrounds: Record<string, number> }>} [darkByText]
 *   par couleur de texte (avant fusion alpha) : occurrences sur fond sombre et leurs fonds
 */
export function textGreys(colorValues, darkByText = {}) {
  /** @type {Record<string, { count: number, pseudo: number, chroma: number, onDark: number, darkBackgrounds: Record<string, number> }>} */
  const values = {};
  let white = 0;
  let whitePseudo = 0;
  for (const [hex, v] of Object.entries(colorValues)) {
    const asText = v.contexts.filter((c) => c.property === 'color');
    const n = asText.reduce((t, c) => t + c.count, 0);
    const pseudo = asText.reduce((t, c) => t + (/** @type {any} */ (c).pseudo ?? 0), 0);
    if (!n) continue;
    if (hex === '#ffffff') {
      white = n;
      whitePseudo = pseudo;
      continue;
    }
    const [, a, b] = toLab(hex);
    const chroma = Math.hypot(a, b);
    if (chroma < GREY_CHROMA)
      values[hex] = {
        count: n,
        pseudo,
        chroma: Math.round(chroma * 10000) / 10000,
        onDark: darkByText[hex]?.onDark ?? 0,
        darkBackgrounds: darkByText[hex]?.backgrounds ?? {},
      };
  }
  const sorted = Object.fromEntries(Object.entries(values).sort((x, y) => y[1].count - x[1].count));
  return {
    total: Object.values(values).reduce((t, v) => t + v.count, 0),
    distinct: Object.keys(values).length,
    distinctWithoutPseudo: Object.values(values).filter((v) => v.count > v.pseudo).length,
    values: sorted,
    white,
    whiteWithoutPseudo: white - whitePseudo,
    onDark: Object.values(values).reduce((t, v) => t + v.onDark, 0),
  };
}
const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

/**
 * @typedef {import('../browser/rendered.js').RenderedRecord} RenderedRecord
 * @typedef {import('../browser/rendered.js').PageCollection} PageCollection
 * @typedef {{ page: string, index: number, pseudo: boolean }} Sample
 * @typedef {object} Context
 * @property {string} property
 * @property {string} role
 * @property {number} count
 * @property {number} pseudo   occurrences venues d'un pseudo-élément (R16)
 * @property {Record<string, number>} pages
 * @property {string[]} selectors
 * @property {Record<string, number>} tags
 * @property {Sample} sample   premier élément rencontré (pour --trace-rendered)
 * @property {object} [trace]
 * @typedef {object} RenderedValue
 * @property {number} count
 * @property {number} pseudo   occurrences venues d'un pseudo-élément (R16)
 * @property {boolean} normalizable
 * @property {Record<string, number>} originals
 * @property {Context[]} contexts
 */

function createCollector() {
  /** @type {Map<string, RenderedValue & { ctx: Map<string, Context> }>} */
  const values = new Map();
  let total = 0;
  let nonNormalizable = 0;
  return {
    /**
     * @param {{ key: string, normalizable: boolean }} k
     * @param {string} raw
     * @param {string} property
     * @param {RenderedRecord} rec
     * @param {string} page
     * @param {number} index
     * @returns {Context | null} le contexte s'il vient d'être créé
     */
    add(k, raw, property, rec, page, index) {
      total++;
      if (!k.normalizable) nonNormalizable++;
      let v = values.get(k.key);
      if (!v) {
        v = { count: 0, pseudo: 0, normalizable: k.normalizable, originals: {}, contexts: [], ctx: new Map() };
        values.set(k.key, v);
      }
      v.count++;
      if (rec.pseudo) v.pseudo++;
      v.originals[raw] = (v.originals[raw] ?? 0) + 1;
      const role = rec.role ?? 'conteneur';
      const ck = `${property}\n${role}`;
      let c = v.ctx.get(ck);
      let created = false;
      if (!c) {
        c = { property, role, count: 0, pseudo: 0, pages: {}, selectors: [], tags: {}, sample: { page, index, pseudo: !!rec.pseudo } };
        v.ctx.set(ck, c);
        created = true;
      }
      c.count++;
      if (rec.pseudo) c.pseudo++;
      c.pages[page] = (c.pages[page] ?? 0) + 1;
      const sel = rec.selector ?? '';
      if (c.selectors.length < MAX_SELECTORS && !c.selectors.includes(sel)) c.selectors.push(sel);
      const tag = rec.tag ?? '';
      c.tags[tag] = (c.tags[tag] ?? 0) + 1;
      return created ? c : null;
    },
    result() {
      const sorted = [...values.entries()].sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1));
      return {
        total,
        distinct: values.size,
        distinctWithoutPseudo: [...values.values()].filter((v) => v.count > v.pseudo).length,
        nonNormalizable,
        values: Object.fromEntries(
          sorted.map(([key, { ctx, ...v }]) => [key, { ...v, contexts: [...ctx.values()].sort((a, b) => b.count - a.count) }]),
        ),
      };
    },
  };
}

/** Jetons de couleur d'une valeur calculée (ombre, dégradé). */
const COLOR_TOKEN = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;

/**
 * Couleurs peintes par un élément, d'après ses propriétés calculées (R4, R5, R5 bis, R6 bis).
 * Sert au repos comme aux états forcés (R15).
 * @param {Record<string, string>} p   propriétés relevées par collectInPage
 * @param {boolean} text               porteur de texte
 * @returns {{ hex: string, raw: string, property: string }[]} dans l'ordre : texte, bordures, contour, ombres, fond, dégradé, SVG
 */
export function paintedColors(p, text) {
  /** @type {{ hex: string, raw: string, property: string }[]} */
  const out = [];
  /** @param {string | undefined} raw @param {string} property */
  const push = (raw, property) => {
    if (!raw) return null;
    const c = normalizeColor(raw);
    if (c) out.push({ hex: c.hex, raw, property });
    return c?.hex ?? null;
  };
  if (text) {
    const color = push(p['color'], 'color');
    const line = p['text-decoration-line'];
    if (line && line !== 'none') {
      const deco = normalizeColor(p['text-decoration-color'] ?? '');
      if (deco && deco.hex !== color) out.push({ hex: deco.hex, raw: p['text-decoration-color'], property: 'text-decoration-color' });
    }
  }
  // R6 bis : une occurrence par couleur distincte parmi les côtés visibles.
  /** @type {Set<string>} */
  const borders = new Set();
  for (const s of SIDES) {
    if (p[`border-${s}-style`] === 'none' || !(parseFloat(p[`border-${s}-width`]) > 0)) continue;
    const c = normalizeColor(p[`border-${s}-color`] ?? '');
    if (!c || borders.has(c.hex)) continue;
    borders.add(c.hex);
    out.push({ hex: c.hex, raw: p[`border-${s}-color`], property: `border-${s}-color` });
  }
  if (p['outline-style'] && p['outline-style'] !== 'none' && parseFloat(p['outline-width']) > 0) push(p['outline-color'], 'outline-color');
  if (p['box-shadow'] && p['box-shadow'] !== 'none') for (const m of p['box-shadow'].match(COLOR_TOKEN) ?? []) push(m, 'box-shadow');
  push(p['background-color'], 'background-color');
  if (p['background-image']) for (const m of p['background-image'].match(COLOR_TOKEN) ?? []) push(m, 'background-image');
  if (p['fill'] && p['fill'] !== 'none') push(p['fill'], 'fill');
  if (p['stroke'] && p['stroke'] !== 'none') push(p['stroke'], 'stroke');
  return out;
}

/**
 * Fond effectif et marqueurs d'incertitude d'un porteur de texte (R11).
 * @param {RenderedRecord[]} records
 * @param {number} index
 * @returns {{ bg: string, opacity: boolean, backgroundImage: boolean }}
 */
export function effectiveBackground(records, index) {
  /** @type {string[]} */
  const layers = [];
  let opaqueFound = false;
  let backgroundImage = false;
  let opacity = false;
  for (let i = index; i >= 0; i = records[i].parent) {
    const r = records[i];
    if (parseFloat(r.opacity) < 1) opacity = true;
    if (opaqueFound) continue;
    if (r.bgImage) backgroundImage = true;
    const c = normalizeColor(r.bg);
    if (c) {
      layers.push(c.hex);
      if (isOpaque(c.hex)) opaqueFound = true;
    }
  }
  let bg = opaqueFound ? /** @type {string} */ (layers.pop()) : '#ffffff';
  for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg);
  return { bg, opacity, backgroundImage };
}

/**
 * Agrégateur incrémental : une page à la fois, pour pouvoir tracer les
 * contextes nouveaux tant que la page est ouverte.
 */
export function createRenderedAggregator() {
  /** @type {Record<string, ReturnType<typeof createCollector>>} */
  const fam = Object.fromEntries(RENDERED_FAMILIES.map((f) => [f, createCollector()]));
  /** @type {Record<string, number>} */
  const v1FontSizes = {};
  /** @type {Map<string, any>} */
  const pairs = new Map();
  /** @type {Record<string, { elements: number, pseudoElements: number, excluded: number, textBearing: number, iframes: number }>} */
  const byPage = {};
  const roles = new Set();
  let unmeasuredContrast = 0;
  /** R14 : par couleur de texte (avant fusion), occurrences sur fond sombre et leurs fonds. */
  /** @type {Record<string, { onDark: number, backgrounds: Record<string, number> }>} */
  const darkByText = {};

  /**
   * @param {PageCollection} pc
   * @returns {{ family: string, value: string, context: Context }[]} contextes créés par cette page
   */
  function addPage(pc) {
    const page = pc.url;
    const stats = (byPage[page] = { elements: 0, pseudoElements: 0, excluded: pc.excluded, textBearing: 0, iframes: pc.iframes });
    if (pc.thirdParty) {
      third.elements += pc.thirdParty.elements;
      for (const [sel, n] of Object.entries(pc.thirdParty.selectors)) third.selectors[sel] = (third.selectors[sel] ?? 0) + n;
      for (const sel of pc.thirdParty.invalid) third.invalid.add(sel);
    }
    /** @type {{ family: string, value: string, context: Context }[]} */
    const created = [];
    pc.records.forEach((rec, index) => {
      if (!rec.retained || !rec.props) return;
      const p = rec.props;
      if (rec.pseudo) stats.pseudoElements++;
      else {
        stats.elements++;
        roles.add(rec.role);
      }
      /** @param {string} f @param {{ key: string, normalizable: boolean }} k @param {string} raw @param {string} property */
      const add = (f, k, raw, property) => {
        const c = fam[f].add(k, raw, property, rec, page, index);
        if (c) created.push({ family: f, value: k.key, context: c });
      };
      for (const c of paintedColors(p, !!rec.text)) add('colors', { key: c.hex, normalizable: true }, c.raw, c.property);

      if (rec.text) {
        stats.textBearing++;
        add('fontFamilies', fontFamilyKey(p['font-family']), p['font-family'], 'font-family');
        const fs = lengthKey(p['font-size'], 16);
        add('fontSizes', fs, p['font-size'], 'font-size');
        const v1 = `${Math.round(parseFloat(p['font-size']))}px`;
        v1FontSizes[v1] = (v1FontSizes[v1] ?? 0) + 1;
        add('fontWeights', fontWeightKey(p['font-weight']), p['font-weight'], 'font-weight');
        if (p['line-height'] !== 'normal') add('lineHeights', lineHeightKey(p['line-height'], 16), p['line-height'], 'line-height');
        if (p['letter-spacing'] !== 'normal')
          add('letterSpacings', lengthKey(p['letter-spacing'], 16), p['letter-spacing'], 'letter-spacing');
        addContrast(pc, index, page);
      }
      // R3 bis : un ::placeholder n'a que sa typographie et son fond.
      if (rec.textOnly) return;

      for (const s of SIDES) {
        const m = p[`margin-${s}`];
        if (m && m !== '0px') add('margins', lengthKey(m, 16), m, `margin-${s}`);
        const pd = p[`padding-${s}`];
        if (pd && pd !== '0px') add('paddings', lengthKey(pd, 16), pd, `padding-${s}`);
      }
      if (/\b(flex|grid)\b/.test(p['display'] ?? '')) {
        for (const g of ['row-gap', 'column-gap']) if (p[g] && p[g] !== 'normal') add('gaps', lengthKey(p[g], 16), p[g], g);
      }
      for (const s of SIDES) {
        const w = p[`border-${s}-width`];
        const st = p[`border-${s}-style`];
        if (st === 'none' || !(parseFloat(w) > 0)) continue;
        add('borderWidths', lengthKey(w, 16), w, `border-${s}-width`);
      }
      for (const c of CORNERS) {
        const r = p[`border-${c}-radius`];
        if (!r || r === '0px') continue;
        const parts = splitSpaces(r).map((x) => lengthKey(x, 16));
        add('radii', { key: parts.map((x) => x.key).join(' '), normalizable: parts.every((x) => x.normalizable) }, r, `border-${c}-radius`);
      }
      if (p['box-shadow'] && p['box-shadow'] !== 'none') add('shadows', shadowKey(p['box-shadow'], 16), p['box-shadow'], 'box-shadow');
      if (p['opacity'] && p['opacity'] !== '1') add('opacities', opacityKey(p['opacity']), p['opacity'], 'opacity');

      // R7 : chaque élément de liste, courbe seulement si sa durée est > 0.
      const td = splitCommas(p['transition-duration'] ?? '');
      const tt = splitCommas(p['transition-timing-function'] ?? '');
      td.forEach((d, i) => {
        const ms = toMs(d);
        if (!(ms.ms && ms.ms > 0)) return;
        add('durations', { key: ms.key, normalizable: ms.normalizable }, d, 'transition-duration');
        const t = tt[i % (tt.length || 1)];
        if (t) add('timingFunctions', timingKey(t), t, 'transition-timing-function');
      });
      const an = splitCommas(p['animation-name'] ?? '');
      const ad = splitCommas(p['animation-duration'] ?? '');
      const at = splitCommas(p['animation-timing-function'] ?? '');
      an.forEach((name, i) => {
        if (name === 'none') return;
        const d = ad[i % (ad.length || 1)];
        const ms = toMs(d ?? '');
        if (!(ms.ms && ms.ms > 0)) return;
        add('durations', { key: ms.key, normalizable: ms.normalizable }, d, 'animation-duration');
        const t = at[i % (at.length || 1)];
        if (t) add('timingFunctions', timingKey(t), t, 'animation-timing-function');
      });
    });
    return created;
  }

  /** R15 : couleurs qui n'apparaissent qu'à un état forcé, par couleur puis par (état, propriété, rôle). */
  /** @type {Map<string, { count: number, ctx: Map<string, { state: string, property: string, role: string, count: number, selectors: string[] }> }>} */
  const stateColors = new Map();
  const stateStats = { sampled: 0, capped: false, candidates: 0 };
  /** R17 : éléments tiers écartés. */
  const third = { elements: 0, selectors: /** @type {Record<string, number>} */ ({}), invalid: /** @type {Set<string>} */ (new Set()) };

  /**
   * Couleurs peintes par un élément testé et par ses pseudo-éléments (R15 bis).
   * @param {import('../browser/states.js').StateSnapshot} snap
   * @param {boolean} text
   * @param {string} selector
   */
  const snapshotColors = (snap, text, selector) => {
    const out = paintedColors(snap.el, text).map((c) => ({ hex: c.hex, property: c.property, selector }));
    for (const [name, p] of Object.entries(snap.pseudo ?? {})) {
      for (const c of paintedColors(p.props, p.text)) {
        const hex = withOpacity(c.hex, p.opacity);
        if (hex) out.push({ hex, property: c.property, selector: selector + name });
      }
    }
    return out;
  };

  /**
   * @param {import('../browser/states.js').StateCollection} sc
   */
  function addStates(sc) {
    stateStats.sampled += sc.samples.length;
    stateStats.candidates += sc.candidates;
    if (sc.capped) stateStats.capped = true;
    for (const smp of sc.samples) {
      const rest = new Set(snapshotColors(smp.rest, smp.text, smp.selector).map((c) => c.hex));
      for (const [state, snap] of Object.entries(smp.states)) {
        /** @type {Set<string>} */
        const seen = new Set();
        for (const c of snapshotColors(snap, smp.text, smp.selector)) {
          const k = `${c.hex}\n${c.property}`;
          if (rest.has(c.hex) || seen.has(k)) continue;
          seen.add(k);
          let v = stateColors.get(c.hex);
          if (!v) stateColors.set(c.hex, (v = { count: 0, ctx: new Map() }));
          v.count++;
          const ck = `${state}\n${c.property}\n${smp.role}`;
          let x = v.ctx.get(ck);
          if (!x) v.ctx.set(ck, (x = { state, property: c.property, role: smp.role, count: 0, selectors: [] }));
          x.count++;
          if (x.selectors.length < MAX_SELECTORS && !x.selectors.includes(c.selector)) x.selectors.push(c.selector);
        }
      }
    }
  }

  /**
   * @param {PageCollection} pc
   * @param {number} index
   * @param {string} page
   */
  function addContrast(pc, index, page) {
    const rec = pc.records[index];
    const p = /** @type {Record<string, string>} */ (rec.props);
    const fg = normalizeColor(p['color']);
    if (!fg) {
      unmeasuredContrast++;
      return;
    }
    const eff = effectiveBackground(pc.records, index);
    const text = isOpaque(fg.hex) ? fg.hex : blend(fg.hex, eff.bg);
    const ratio = contrastRatio(text, eff.bg);
    const onWhite = isOpaque(fg.hex) ? fg.hex : blend(fg.hex, '#ffffff');
    if (ratio > contrastRatio(onWhite, '#ffffff')) {
      const d = (darkByText[fg.hex] ??= { onDark: 0, backgrounds: {} });
      d.onDark++;
      d.backgrounds[eff.bg] = (d.backgrounds[eff.bg] ?? 0) + 1;
    }
    const large = isLargeText(parseFloat(p['font-size']), parseFloat(p['font-weight']));
    // R11 ter : une icône se juge au seuil des éléments graphiques (3:1), sans niveau AAA.
    const lv = rec.icon ? { AA: ratio >= 3, AAA: true } : wcagLevels(ratio, large);
    const key = `${text}|${eff.bg}`;
    let pair = pairs.get(key);
    if (!pair) {
      pair = {
        text,
        bg: eff.bg,
        ratio: Math.round(ratio * 10000) / 10000,
        n: 0,
        nIcon: 0,
        nLarge: 0,
        belowAA: 0,
        belowAAA: 0,
        uncertain: { value: 0, reasons: { opacity: 0, backgroundImage: 0, overlap: 0 } },
        selectors: [],
        roles: {},
        pages: {},
      };
      pairs.set(key, pair);
    }
    pair.n++;
    if (rec.icon) pair.nIcon++;
    else if (large) pair.nLarge++;
    if (!lv.AA) pair.belowAA++;
    if (!lv.AAA) pair.belowAAA++;
    if (eff.opacity || eff.backgroundImage || rec.overlap) {
      pair.uncertain.value++;
      if (eff.opacity) pair.uncertain.reasons.opacity++;
      if (eff.backgroundImage) pair.uncertain.reasons.backgroundImage++;
      if (rec.overlap) pair.uncertain.reasons.overlap++;
    }
    if (pair.selectors.length < MAX_SELECTORS && !pair.selectors.includes(rec.selector)) pair.selectors.push(rec.selector);
    const role = rec.role ?? 'texte';
    pair.roles[role] = (pair.roles[role] ?? 0) + 1;
    pair.pages[page] = (pair.pages[page] ?? 0) + 1;
  }

  function result() {
    const families = Object.fromEntries(RENDERED_FAMILIES.map((f) => [f, fam[f].result()]));
    const colorCounts = Object.entries(families.colors.values).map(([hex, v]) => ({ hex, n: v.count }));
    const opaque = colorCounts.filter((c) => isOpaque(c.hex));
    const pageStats = Object.values(byPage);
    /** @param {'elements'|'pseudoElements'|'excluded'|'textBearing'} k */
    const sum = (k) => pageStats.reduce((t, s) => t + s[k], 0);
    const pairList = [...pairs.values()]
      .map((p) => ({ ...p, flag: p.uncertain.value > 0 ? '[V]' : null }))
      .sort((a, b) => a.ratio - b.ratio || b.n - a.n);
    return {
      elements: sum('elements'),
      pseudoElements: sum('pseudoElements'),
      excluded: sum('excluded'),
      textBearing: sum('textBearing'),
      roles: [...roles].sort(),
      byPage,
      families: {
        ...families,
        colors: {
          ...families.colors,
          opaque: opaque.length,
          translucent: colorCounts.length - opaque.length,
          groupsDE2: cluster(colorCounts, 2),
          groupsDE5: cluster(colorCounts, 5),
          groupsCompleteDE2: clusterComplete(colorCounts, 2),
          groupsCompleteDE5: clusterComplete(colorCounts, 5),
        },
        fontSizes: { ...families.fontSizes, v1Keys: v1FontSizes },
      },
      textGreys: textGreys(families.colors.values, darkByText),
      thirdParty: {
        elements: third.elements,
        selectors: Object.fromEntries(Object.entries(third.selectors).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, 40)),
        invalid: [...third.invalid],
      },
      states: {
        ...stateStats,
        colors: Object.fromEntries(
          [...stateColors.entries()]
            .sort((a, b) => b[1].count - a[1].count || (a[0] < b[0] ? -1 : 1))
            .map(([hex, v]) => [
              hex,
              { count: v.count, newToRender: !(hex in families.colors.values), contexts: [...v.ctx.values()].sort((a, b) => b.count - a.count) },
            ]),
        ),
        onlyInStates: [...stateColors.keys()].filter((hex) => !(hex in families.colors.values)).sort(),
      },
      contrast: {
        pairs: pairList,
        occurrences: pairList.reduce((t, p) => t + p.n, 0),
        unmeasured: unmeasuredContrast,
      },
    };
  }

  return { addPage, addStates, result };
}
