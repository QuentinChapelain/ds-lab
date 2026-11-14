// @ts-check
/**
 * Lot S : applique modifications.json (écrit par reduce) aux feuilles d'une copie du site.
 *
 * S2. Chaque entrée vise une déclaration : feuille (chemin d'URL sous la racine), ligne de la règle
 *     (ligne de son accolade ouvrante, comme la trace), sélecteur, propriété (côté ou coin : un
 *     composant d'un raccourci). Garde : si le composant trouvé n'est pas la valeur écrite attendue,
 *     l'entrée n'est pas appliquée et sort en écart ; s'il vaut déjà la nouvelle valeur, elle est
 *     « déjà appliquée ». Un composant partagé par des propriétés aux issues différentes (ou par une
 *     propriété sans entrée) sort en écart : le raccourci n'est pas coupé.
 * S3. Relance sur une copie migrée : les commentaires posés décalent les lignes ; la ligne d'origine
 *     d'une règle se retrouve en retranchant les lignes de ces commentaires (ceux de ce fichier de
 *     modifications) qui la précèdent.
 * S4. Le HTML n'est jamais touché ; reste.md dit ce qui reste à faire à la main.
 */
import postcss from 'postcss';
import { parse as parseColor } from 'culori';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, relative, isAbsolute } from 'node:path';

const SIDES = ['top', 'right', 'bottom', 'left'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
const BORDER_STYLES = new Set(['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset']);

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
function coverage(prop, parts) {
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

/** Le raccourci écrit couvre-t-il cette propriété ? @param {string} written @param {string} prop */
const covers = (written, prop) =>
  written === prop ||
  (prop.startsWith(`${written}-`) && /^(margin|padding|border|outline|background|text-decoration|gap|font)/.test(written)) ||
  (written === 'border-radius' && /^border-.*-radius$/.test(prop)) ||
  (/^border-(width|style|color)$/.test(written) && new RegExp(`^border-[a-z]+-${written.slice(7)}$`).test(prop)) ||
  ((written === 'gap' || written === 'grid-gap') && (prop === 'row-gap' || prop === 'column-gap')) ||
  (written === 'font' && /^(font-|line-height)/.test(prop));

/** Nombre de retours à la ligne. @param {string} s */
const newlines = (s) => (String(s ?? '').match(/\n/g) ?? []).length;

/**
 * Ligne de l'accolade ouvrante d'une règle, dans le fichier tel qu'il est.
 * @param {any} rule
 */
const braceLine = (rule) => rule.source.start.line + newlines(rule.raws.selector?.raw ?? rule.selector) + newlines(rule.raws.between);

/**
 * Règles d'une feuille, avec leur ligne d'origine (avant les commentaires posés par apply).
 * @param {postcss.Root} root @param {Set<string>} posed  textes des commentaires de ce fichier de modifications
 */
function rulesOf(root, posed) {
  /** @type {any[]} */
  const rules = [];
  root.walkRules((r) => {
    rules.push({ rule: r, line: braceLine(r), selector: normSelector(r.selector) });
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
 * Applique un fichier de modifications à une copie.
 * @param {any} mods  contenu de modifications.json
 * @param {{ root: string, dryRun?: boolean, restePath?: string }} o
 */
export async function applyModifications(mods, { root, dryRun = false, restePath }) {
  /** @type {{ entry: any, status: 'appliquée' | 'déjà appliquée' | 'écart', reason?: string, at?: string }[]} */
  const results = mods.entries.map((/** @type {any} */ entry) => ({ entry, status: 'écart' }));
  /** @type {{ comment: any, status: 'posé' | 'déjà posé' | 'écart', reason?: string, at?: string }[]} */
  const comments = (mods.comments ?? []).map((/** @type {any} */ comment) => ({ comment, status: 'écart' }));
  /** @type {string[]} */
  const written = [];
  const sheets = [...new Set([...mods.entries.map((/** @type {any} */ e) => e.sheet), ...(mods.comments ?? []).map((/** @type {any} */ c) => c.sheet)])].sort();
  for (const sheet of sheets) {
    const file = join(root, sheet);
    const mine = results.filter((x) => x.entry.sheet === sheet);
    const notes = comments.filter((x) => x.comment.sheet === sheet);
    /** @type {string} */
    let text;
    try {
      text = await readFile(file, 'utf8');
    } catch {
      for (const x of [...mine, ...notes]) x.reason = `feuille introuvable sous la racine (${sheet})`;
      continue;
    }
    const css = postcss.parse(text, { from: file });
    const rules = rulesOf(css, new Set(notes.map((x) => x.comment.text)));
    /** @param {any} t */
    const locate = (t) => {
      // Le navigateur réécrit certains sélecteurs (:nth-child(even) lu :nth-child(2n)) : une règle
      // seule à sa ligne d'origine suffit ; le sélecteur ne départage que plusieurs règles sur une ligne.
      const atLine = rules.filter((r) => r.origin === t.line);
      const hits = atLine.length === 1 ? atLine : atLine.filter((r) => r.selector === normSelector(t.selector));
      if (hits.length !== 1) return { error: hits.length ? `règle ambiguë (${hits.length} règles ${t.selector} à la ligne ${t.line})` : `règle introuvable (${t.selector}, ligne ${t.line})` };
      const decl = declOf(hits[0].rule, t.property);
      if (!decl) return { error: `déclaration introuvable (${t.property} dans ${t.selector})` };
      return { decl, at: `${sheet}:${hits[0].line}` };
    };
    // 1. Tout est localisé avant toute écriture : les positions sont celles du fichier lu.
    /** @type {Map<any, { decl: any, items: { x: any, index: number }[] }>} */
    const byDecl = new Map();
    for (const x of mine) {
      const loc = locate(x.entry);
      if (loc.error) {
        x.reason = loc.error;
        continue;
      }
      x.at = loc.at;
      const decl = loc.decl;
      const prop = decl.prop.toLowerCase();
      let index = -1;
      if (prop !== x.entry.property) {
        const c = components(decl.value);
        if (c.comma) {
          x.reason = `raccourci ${prop} à plusieurs couches (virgule)`;
          continue;
        }
        if (c.slash) {
          x.reason = `raccourci ${prop} avec « / »`;
          continue;
        }
        const cov = coverage(prop, c.parts);
        if (typeof cov === 'string') {
          x.reason = cov;
          continue;
        }
        const i = cov.get(x.entry.property);
        if (i === undefined) {
          x.reason = `${x.entry.property} introuvable dans ${prop}: ${decl.value}`;
          continue;
        }
        index = i;
      }
      const g = byDecl.get(decl) ?? { decl, items: [] };
      g.items.push({ x, index });
      byDecl.set(decl, g);
    }
    // 2. Par déclaration et par composant : garde, puis remplacement.
    for (const { decl, items } of byDecl.values()) {
      const prop = decl.prop.toLowerCase();
      const c = items.some((i) => i.index >= 0) ? components(decl.value) : null;
      const cov = c ? coverage(prop, c.parts) : null;
      /** @type {Map<number, { x: any, index: number }[]>} */
      const byIndex = new Map();
      for (const it of items) byIndex.set(it.index, [...(byIndex.get(it.index) ?? []), it]);
      /** @type {{ start: number, end: number, text: string }[]} */
      const edits = [];
      for (const [index, group] of byIndex) {
        const current = index < 0 ? decl.value : /** @type {any} */ (c).parts[index].text;
        const values = new Set(group.map((it) => norm(it.x.entry.value)));
        const props = group.map((it) => it.x.entry.property);
        if (values.size > 1) {
          for (const it of group) it.x.reason = `composant partagé par ${[...new Set(props)].join(', ')}, issues différentes (${[...new Set(group.map((y) => y.x.entry.value))].join(' / ')}) : le raccourci ${prop}: ${decl.value} n'est pas coupé`;
          continue;
        }
        if (index >= 0 && cov && typeof cov !== 'string') {
          const without = [...cov].filter(([p, i]) => i === index && !props.includes(p)).map(([p]) => p);
          if (without.length) {
            for (const it of group) it.x.reason = `composant partagé avec ${without.join(', ')}, sans entrée : le raccourci ${prop}: ${decl.value} n'est pas coupé`;
            continue;
          }
        }
        const e = group[0].x.entry;
        if (norm(current) === norm(e.value)) {
          for (const it of group) it.x.status = 'déjà appliquée';
          continue;
        }
        if (norm(current) !== norm(e.written)) {
          for (const it of group) it.x.reason = `valeur écrite attendue ${e.written}, trouvée ${current}`;
          continue;
        }
        for (const it of group) it.x.status = 'appliquée';
        if (index < 0) edits.push({ start: 0, end: decl.value.length, text: e.value });
        else {
          const p = /** @type {any} */ (c).parts[index];
          edits.push({ start: p.start, end: p.end, text: e.value });
        }
      }
      if (edits.length) {
        let v = decl.value;
        for (const ed of edits.sort((a, b) => b.start - a.start)) v = v.slice(0, ed.start) + ed.text + v.slice(ed.end);
        decl.value = v;
      }
    }
    // 3. Commentaires au-dessus de leur déclaration, une fois.
    for (const x of notes) {
      const loc = locate(x.comment);
      if (loc.error) {
        x.reason = loc.error;
        continue;
      }
      x.at = loc.at;
      const decl = loc.decl;
      /** @type {string[]} */
      const above = [];
      for (let n = decl.prev(); n && n.type === 'comment'; n = n.prev()) above.push(n.text);
      if (above.includes(x.comment.text)) {
        x.status = 'déjà posé';
        continue;
      }
      decl.before(postcss.comment({ text: x.comment.text, raws: { before: decl.raws.before, left: ' ', right: ' ' } }));
      x.status = 'posé';
    }
    const out = css.toString();
    if (out !== text) {
      if (!dryRun) await writeFile(file, out);
      written.push(sheet.replace(/^\//, ''));
    }
  }
  // tokens.css : écrit tel que reduce l'a préparé.
  if (mods.tokensCss) {
    const file = join(root, mods.tokensCss.path);
    let prev = null;
    try {
      prev = await readFile(file, 'utf8');
    } catch {}
    if (prev !== mods.tokensCss.content) {
      if (!dryRun) {
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, mods.tokensCss.content);
      }
      written.push(mods.tokensCss.path.replace(/^\//, ''));
    }
  }
  const reste = renderReste(mods, results, comments);
  const resteFile = restePath ?? join(root, 'reste.md');
  if (!dryRun) {
    await writeFile(resteFile, reste);
    const rel = relative(root, resteFile);
    written.push(rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : resteFile);
  }
  return { results, comments, written, reste, resteFile };
}

/** @param {string} s */
const dash = (s) => (s.startsWith('- ') ? s : `- ${s}`);

/**
 * S4 : reste.md, la consigne réduite à ce que le script n'a pas fait.
 * @param {any} mods @param {any[]} results @param {any[]} comments
 */
export function renderReste(mods, results, comments) {
  const b = mods.brief ?? {};
  const n = (/** @type {string} */ s) => results.filter((x) => x.status === s).length;
  const posed = comments.filter((x) => x.status === 'posé').length;
  const already = comments.filter((x) => x.status === 'déjà posé').length;
  const gaps = results.filter((x) => x.status === 'écart');
  const badNotes = comments.filter((x) => x.status === 'écart');
  const tokens = mods.tokensCss?.path ?? 'tokens.css';
  const L = [];
  L.push('CONTEXTE');
  L.push(
    `Le script a appliqué ${n('appliquée')} entrées sur ${results.length} (npm run apply ; ${n('déjà appliquée')} déjà appliquées, ${gaps.length} écarts), posé ${posed} commentaires (${already} déjà posés) et écrit ${tokens}. Il n'a pas touché au HTML.`,
  );
  L.push("Ce qui suit est ce qu'il reste à faire à la main. Ne reviens pas sur ce que le script a écrit : valeurs en var(--…, …) et commentaires /* ds-lab : … */.");
  L.push("Écris chaque jeton sous la forme var(--chemin-du-jeton, ancienne valeur) : points du chemin remplacés par des tirets ; en repli, l'ancienne valeur telle que la source l'écrit.");
  L.push('');
  const items = [];
  items.push(
    `Charge ${tokens} (écrit par le script) avant toutes les autres feuilles, dans toute page qui charge une feuille modifiée (${(b.sheets ?? []).join(', ') || '—'}) : ${(b.pages ?? []).join(', ') || '—'}, et toute autre page qui charge ces feuilles.`,
  );
  items.push(...(b.changeAussi ?? []));
  items.push(...(b.reste ?? []));
  for (const x of gaps) {
    const e = x.entry;
    items.push(`Écart : ${x.at ?? `${e.sheet}:${e.line}`} ${e.selector} { ${e.property} } (${e.rows.join(', ')}) : ${x.reason}. Si c'est bien cette déclaration, écris ${e.value} pour ${e.property} à la main ; sinon, laisse-la et signale-le.`);
  }
  for (const x of badNotes) {
    const c = x.comment;
    items.push(`Écart : ${c.sheet}:${c.line} ${c.selector} { ${c.property} } (${c.rows.join(', ')}) : ${x.reason}. Pose à la main /* ${c.text} */ au-dessus de la déclaration.`);
  }
  L.push(`RESTE (${items.length})`);
  items.forEach((t, i) => L.push(`${i + 1}. ${t}`));
  L.push('');
  L.push('NE TOUCHE PAS');
  for (const t of b.neTouchePas ?? []) L.push(dash(t));
  L.push('');
  L.push('SIGNALE SANS MODIFIER');
  for (const t of b.signale ?? []) L.push(dash(t));
  L.push('');
  L.push('VÉRIFICATION');
  for (const t of b.verification ?? []) L.push(t);
  return L.join('\n') + '\n';
}
