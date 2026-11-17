// @ts-check
/**
 * Localisation d'une déclaration de modifications.json dans le texte d'une feuille, et lecture du composant
 * qu'elle vise : partagées par npm run apply (src/apply/apply.js) et par les feuilles ajoutées
 * (src/apply/ajout.js), pour qu'une même entrée désigne la même déclaration et passe la même garde.
 * Une entrée vise une règle par la ligne de son accolade ouvrante (comme la trace) et, quand modifications.json la
 * donne, sa colonne : dans une feuille compressée, toutes les règles sont sur la même ligne. Sans colonne, le
 * sélecteur départage les règles d'une ligne. Puis une propriété longue, écrite directement ou comme composant
 * d'un raccourci.
 */
import { parse as parseColor } from 'culori';

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const BORDER_STYLES = new Set(['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']);
const KINDS = ['width', 'style', 'color'];

/**
 * Une seule table raccourci → propriétés longues, lue par covers et par coverage.
 * Un border ou un border-top ne couvre pas les rayons (border-*-radius), que seul border-radius couvre.
 * @type {Record<string, string[]>}
 */
const LONGUES = {
  margin: SIDES.map((s) => `margin-${s}`),
  padding: SIDES.map((s) => `padding-${s}`),
  'border-width': SIDES.map((s) => `border-${s}-width`),
  'border-style': SIDES.map((s) => `border-${s}-style`),
  'border-color': SIDES.map((s) => `border-${s}-color`),
  'border-radius': CORNERS.map((c) => `border-${c}-radius`),
  border: SIDES.flatMap((s) => KINDS.map((k) => `border-${s}-${k}`)),
  ...Object.fromEntries(SIDES.map((s) => [`border-${s}`, KINDS.map((k) => `border-${s}-${k}`)])),
  outline: KINDS.map((k) => `outline-${k}`),
  gap: ['row-gap', 'column-gap'],
  'grid-gap': ['row-gap', 'column-gap'],
  background: ['background-color', 'background-image', 'background-position', 'background-size', 'background-repeat', 'background-attachment', 'background-origin', 'background-clip'],
  'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'],
  font: ['font-style', 'font-variant', 'font-weight', 'font-stretch', 'font-size', 'line-height', 'font-family'],
};

/** Valeur comparable : casse, espaces. @param {string | null | undefined} v */
export const norm = (v) =>
  String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')');

/** Sélecteur comparable : une liste séparée par « , ». @param {string} s */
const normSelector = (s) =>
  String(s ?? '')
    .split(',')
    .map((x) => x.trim().replace(/\s+/g, ' '))
    .join(', ');

/**
 * Composants d'une valeur, séparés par les espaces de premier niveau (parenthèses et guillemets
 * respectés), avec leur position ; slash et virgule de premier niveau signalés.
 * @param {string} value
 */
export function components(value) {
  /** @type {{ text: string, start: number, end: number }[]} */
  const parts = [];
  let depth = 0;
  /** @type {string | null} */
  let quote = null;
  let start = -1;
  let slash = false;
  let comma = false;
  const close = (/** @type {number} */ i) => {
    if (start >= 0) parts.push({ text: value.slice(start, i), start, end: i });
    start = -1;
  };
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    if (depth === 0 && /\s/.test(c)) {
      close(i);
      continue;
    }
    if (depth === 0 && (c === '/' || c === ',')) {
      if (c === '/') slash = true;
      else comma = true;
      close(i);
      continue;
    }
    if (start < 0) start = i;
  }
  close(value.length);
  return { parts, slash, comma };
}

/** Type d'un composant (var() : celui de son repli). @param {string} t @returns {'color' | 'width' | 'style' | 'autre'} */
function kindOf(t) {
  const v = t.trim();
  const m = /^var\(\s*--[\w-]+\s*,\s*([\s\S]*)\)$/i.exec(v);
  if (m) return kindOf(m[1]);
  const l = v.toLowerCase();
  if (BORDER_STYLES.has(l)) return 'style';
  if (/^(thin|medium|thick)$/.test(l) || /^-?(\d*\.)?\d+([a-z%]+)?$/.test(l) || /^calc\(/.test(l)) return 'width';
  if (l === 'currentcolor' || l === 'transparent' || parseColor(l)) return 'color';
  return 'autre';
}

/** Indice du composant d'un côté, pour 1 à 4 valeurs (ordre haut, droite, bas, gauche). @param {number} n @param {number} i */
const sideIndex = (n, i) => (n === 1 ? 0 : n === 2 ? i % 2 : n === 3 ? (i === 3 ? 1 : i) : i);

/**
 * Propriétés couvertes par un raccourci, et le composant de chacune.
 * @param {string} prop  propriété écrite
 * @param {{ text: string }[]} parts
 * @returns {Map<string, number> | string}  propriété → indice du composant, ou motif d'écart
 */
export function coverage(prop, parts) {
  const out = coverageOf(prop, parts);
  // La table LONGUES borne ce qu'un raccourci couvre : coverage ne rend jamais une propriété hors de sa liste.
  if (typeof out !== 'string') for (const k of out.keys()) if (!(LONGUES[prop] ?? []).includes(k)) throw new Error(`apply : ${prop} ne couvre pas ${k} (table LONGUES)`);
  return out;
}

/** @param {string} prop @param {{ text: string }[]} parts @returns {Map<string, number> | string} */
function coverageOf(prop, parts) {
  const n = parts.length;
  /** @type {Map<string, number>} */
  const out = new Map();
  const sided = /^(margin|padding)$/.exec(prop) ?? null;
  if (sided) {
    if (n < 1 || n > 4) return `raccourci ${prop} à ${n} valeurs`;
    SIDES.forEach((s, i) => out.set(`${prop}-${s}`, sideIndex(n, i)));
    return out;
  }
  const bpart = /^border-(width|style|color)$/.exec(prop);
  if (bpart) {
    if (n < 1 || n > 4) return `raccourci ${prop} à ${n} valeurs`;
    SIDES.forEach((s, i) => out.set(`border-${s}-${bpart[1]}`, sideIndex(n, i)));
    return out;
  }
  if (prop === 'border-radius') {
    if (n < 1 || n > 4) return `raccourci ${prop} à ${n} valeurs`;
    CORNERS.forEach((c, i) => out.set(`border-${c}-radius`, sideIndex(n, i)));
    return out;
  }
  if (prop === 'gap' || prop === 'grid-gap') {
    if (n < 1 || n > 2) return `raccourci ${prop} à ${n} valeurs`;
    out.set('row-gap', 0);
    out.set('column-gap', n === 2 ? 1 : 0);
    return out;
  }
  const typed = /^(border(?:-(top|right|bottom|left))?|outline)$/.exec(prop);
  if (typed) {
    const sides = prop === 'outline' ? [null] : typed[2] ? [typed[2]] : SIDES;
    for (const kind of /** @type {const} */ (['width', 'style', 'color'])) {
      const idx = parts.findIndex((p) => kindOf(p.text) === kind);
      if (idx < 0) continue;
      for (const s of sides) out.set(s ? `border-${s}-${kind}` : `outline-${kind}`, idx);
    }
    return out;
  }
  if (prop === 'background' || prop === 'text-decoration') {
    const idx = parts.findIndex((p) => kindOf(p.text) === 'color');
    if (idx >= 0) out.set(`${prop}-color`, idx);
    return out;
  }
  return `raccourci ${prop} non pris en charge`;
}

/** Le raccourci écrit couvre-t-il cette propriété ? Lu dans la table LONGUES. @param {string} written @param {string} prop */
const covers = (written, prop) => written === prop || (LONGUES[written] ?? []).includes(prop);

/** Nombre de retours à la ligne. @param {string} s */
const newlines = (s) => (String(s ?? '').match(/\n/g) ?? []).length;

/**
 * Ligne de l'accolade ouvrante d'une règle, dans le fichier tel qu'il est.
 * @param {any} rule
 */
const braceLine = (rule) => rule.source.start.line + newlines(rule.raws.selector?.raw ?? rule.selector) + newlines(rule.raws.between);

/**
 * Colonne (base 1) de l'accolade ouvrante d'une règle, dans le fichier tel qu'il est ; null si la source ne le dit pas.
 * @param {any} rule
 */
function braceColumn(rule) {
  const css = rule.source?.input?.css;
  const start = rule.source?.start?.offset;
  if (typeof css !== 'string' || typeof start !== 'number') return null;
  const brace = start + String(rule.raws.selector?.raw ?? rule.selector).length + String(rule.raws.between ?? '').length;
  return brace - css.lastIndexOf('\n', brace - 1);
}

/**
 * Règles d'une feuille, avec leur ligne d'origine (avant les commentaires posés par apply) et leur colonne.
 * @param {import('postcss').Root} root @param {Set<string>} posed  textes des commentaires de ce fichier de modifications
 */
export function rulesOf(root, posed) {
  /** @type {any[]} */
  const rules = [];
  root.walkRules((r) => {
    rules.push({ rule: r, line: braceLine(r), column: braceColumn(r), selector: normSelector(r.selector) });
  });
  // S3 : chaque commentaire posé par apply a ajouté ses retours à la ligne (ceux de son raws.before,
  // copié de la déclaration qu'il précède, et ceux de son texte) ; une règle qui le suit a reculé
  // d'autant. Seuls comptent les commentaires dont le texte est l'un de ceux de ce fichier.
  /** @type {{ offset: number, added: number }[]} */
  const inserted = [];
  root.walkComments((c) => {
    if (posed.has(c.text)) inserted.push({ offset: /** @type {any} */ (c.source?.start)?.offset ?? 0, added: newlines(c.raws.before) + newlines(c.text) });
  });
  return rules.map((x) => {
    const at = x.rule.source?.start?.offset ?? 0;
    return { ...x, origin: x.line - inserted.filter((c) => c.offset < at).reduce((n, c) => n + c.added, 0) };
  });
}

/**
 * Déclaration visée dans une règle : la dernière qui fixe la propriété, directement ou par raccourci.
 * @param {any} rule @param {string} prop
 */
function declOf(rule, prop) {
  const decls = (rule.nodes ?? []).filter((/** @type {any} */ n) => n.type === 'decl' && covers(n.prop.toLowerCase(), prop));
  return decls[decls.length - 1] ?? null;
}

/**
 * La règle et la déclaration qu'une entrée vise, parmi les règles d'une feuille (rulesOf) ; ou le motif d'écart.
 * Avec une colonne, la règle de cette ligne et de cette colonne, sans regarder le sélecteur, que le navigateur
 * réécrit (:nth-child(even) lu :nth-child(2n), .a>b lu .a > b). Sans colonne, ou si aucune règle n'est à cette colonne
 * (copie déjà migrée, où les valeurs remplacées ont décalé la ligne) : une règle seule à sa ligne d'origine suffit ;
 * le sélecteur ne départage que plusieurs règles sur une ligne.
 * @param {any[]} rules  rulesOf(…)
 * @param {{ line: number, column?: number | null, selector: string, property: string }} t
 * @returns {{ rule: any, decl: any, line: number, column: number | null } | { error: string }}
 */
export function localiser(rules, t) {
  const atLine = rules.filter((r) => r.origin === t.line);
  const atColumn = t.column == null ? [] : atLine.filter((r) => r.column === t.column);
  const hits = atColumn.length === 1 ? atColumn : atLine.length === 1 ? atLine : atLine.filter((r) => r.selector === normSelector(t.selector));
  if (hits.length !== 1) return { error: hits.length ? `règle ambiguë (${hits.length} règles ${t.selector} à la ligne ${t.line})` : `règle introuvable (${t.selector}, ligne ${t.line})` };
  const decl = declOf(hits[0].rule, t.property);
  if (!decl) return { error: `déclaration introuvable (${t.property} dans ${t.selector})` };
  return { rule: hits[0].rule, decl, line: hits[0].line, column: hits[0].column };
}

/**
 * Composant d'une déclaration qui fixe une propriété longue : la valeur entière (index -1) si la déclaration
 * l'écrit directement, sinon l'indice du composant du raccourci ; ou le motif d'écart.
 * @param {any} decl @param {string} property
 * @returns {{ index: number, current: string } | { reason: string }}
 */
export function composantDe(decl, property) {
  const prop = decl.prop.toLowerCase();
  if (prop === property) return { index: -1, current: decl.value };
  const c = components(decl.value);
  if (c.comma) return { reason: `raccourci ${prop} à plusieurs couches (virgule)` };
  if (c.slash) return { reason: `raccourci ${prop} avec « / »` };
  const cov = coverage(prop, c.parts);
  if (typeof cov === 'string') return { reason: cov };
  const i = cov.get(property);
  if (i === undefined) return { reason: `${property} introuvable dans ${prop}: ${decl.value}` };
  return { index: i, current: c.parts[i].text };
}
