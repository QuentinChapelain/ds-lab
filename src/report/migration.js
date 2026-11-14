// @ts-check
/**
 * Lot M : migration.md, écrit par reduce à chaque réduction, lu par le
 * développeur sans l'outil. Une table valeur × usage → jeton DTCG, classe,
 * origine CSS, éléments ; trois sections (appliqué, décisions en attente, hors
 * table avec motif) ; des exceptions nommées. Les données structurées sont
 * renvoyées avec le texte, pour les tests.
 */
import { basename } from 'node:path';
import { APPLIED, isOut, SLICES, decisionFor, decisionKeyFor, WHERE_TO_FIX, nearestOf, tieOf, onSolidOf } from '../reduce/propose.js';

export { onSolidOf };
import { contrastRatio } from '../lib/color.js';
import { pleinFinder } from '../reduce/pleins.js';

/** Groupes de jetons de dimension, par famille de la table. */
const DIM_GROUPS = /** @type {Record<string, string[]>} */ ({
  spacing: ['espace', 'spacing', 'space'],
  fontSizes: ['taille-texte', 'font-size', 'fontSize'],
  radii: ['rayon', 'radius', 'radii'],
});
/** Familles du rendu derrière une ligne (origine CSS). */
const SPACING_FAMILY = /** @type {Record<string, string>} */ ({ marge: 'margins', retrait: 'paddings', gouttière: 'gaps' });
const FAMILY_LABELS = /** @type {Record<string, string>} */ ({ colors: 'couleurs', spacing: 'espacements', fontSizes: 'tailles', radii: 'rayons' });
const OUT_REASON = 'valeur non convertible (pourcentage, transparence)';

/** Jeton « sur plein » (texte posé sur le pas 9 d'une échelle). @param {string} path */
const isOnSolid = (path) => /\.(sur-plein|on-solid|onSolid)$/.test(path);

/**
 * Choix d'un jeton de couleur quand plusieurs ont la même valeur : d'abord celui
 * qui porte le nom de la ligne dans la valise (blanc → couleur.blanc, neutre-11 →
 * couleur.neutre.11) ; un jeton sur-plein seulement pour un texte posé sur le
 * plein de cette échelle ; sinon le premier jeton qui n'est pas sur-plein.
 * @param {string[]} paths
 * @param {{ name?: string | null, pleinScales?: Set<string> }} [ctx]
 */
export function pickColorToken(paths, { name = null, pleinScales = new Set() } = {}) {
  // Lot V, étape 4 : une ligne « <échelle>-sur-plein » va au jeton sur-plein de son échelle.
  const solid = name ? /^(.+)-sur-plein$/.exec(name) : null;
  if (solid) {
    const hit = paths.find((p) => isOnSolid(p) && p.split('.').slice(-2, -1)[0] === solid[1]);
    if (hit) return hit;
  }
  if (name && !solid) {
    const suffix = name.replace(/-(\d+)$/, '.$1');
    const hit = paths.find((p) => !isOnSolid(p) && (p === suffix || p.endsWith(`.${suffix}`)));
    if (hit) return hit;
  }
  for (const scale of pleinScales) {
    const hit = paths.find((p) => isOnSolid(p) && p.split('.').slice(-2, -1)[0] === scale);
    if (hit) return hit;
  }
  return paths.find((p) => !isOnSolid(p)) ?? null;
}

/**
 * Index des jetons DTCG : couleurs par hex (tous les chemins), dimension par groupe et valeur en px.
 * @param {any} tokens  contenu d'un fichier .tokens.json (DTCG 2025.10)
 */
export function indexTokens(tokens) {
  /** @type {Map<string, string[]>} */
  const colors = new Map();
  /** @type {Map<string, Map<string, string>>} */
  const dims = new Map();
  /** @param {any} node @param {string[]} path @param {string | undefined} type */
  const walk = (node, path, type) => {
    if (!node || typeof node !== 'object') return;
    const t = node.$type ?? type;
    if ('$value' in node) {
      const v = node.$value;
      if (t === 'color' && v?.hex) {
        const k = String(v.hex).toLowerCase();
        colors.set(k, [...(colors.get(k) ?? []), path.join('.')]);
      }
      else if (t === 'dimension' && v?.unit === 'px') {
        const g = dims.get(path[0]) ?? new Map();
        if (!g.has(`${v.value}px`)) g.set(`${v.value}px`, path.join('.'));
        dims.set(path[0], g);
      }
      return;
    }
    for (const [k, child] of Object.entries(node)) if (!k.startsWith('$')) walk(child, [...path, k], t);
  };
  walk(tokens, [], undefined);
  /**
   * @param {string} family @param {string | null} value
   * @param {{ name?: string | null, pleinScales?: Set<string> }} [ctx]  couleur : nom dans la valise, échelles des pleins qui portent ce texte
   */
  const find = (family, value, ctx) => {
    if (!value) return null;
    if (family === 'colors') {
      const paths = colors.get(value.toLowerCase());
      return paths ? pickColorToken(paths, ctx) : null;
    }
    for (const g of DIM_GROUPS[family] ?? []) {
      const hit = dims.get(g)?.get(value);
      if (hit) return hit;
    }
    return null;
  };
  return { find, size: [...colors.values()].reduce((t, l) => t + l.length, 0) + [...dims.values()].reduce((t, g) => t + g.size, 0) };
}

/** @param {unknown} s */
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
/** Lot R, R-2 : identifiant et titre d'une ligne, en tête de cellule. @param {{ id: string, title: string }} r */
const line = (r) => cell(`${r.id} ${r.title}`.trim());
/** Lot R, R-2 : sélecteurs d'exemple, gardés en détail. @param {{ selectors: string[], selectorsCut?: boolean }} r */
const selectorsOf = (r) => (r.selectors.map((x) => `\`${cell(x)}\``).join(', ') || '—') + cutNote(r);
/** Lot R : la liste des sélecteurs est-elle coupée ? @param {{ selectorsCut?: boolean }} r */
const cutNote = (r) => (r.selectorsCut ? ' (liste coupée au relevé, d’autres éléments sont touchés)' : '');
/** @param {number} n */
const fr = (n) => String(n).replace('.', ',');
/** Liste en clair, comptes entre parenthèses quand il y en a plusieurs. @param {{ text: string, n: number }[]} list */
const listed = (list) => (list.length > 1 ? list.map((x) => `${x.text} (${x.n})`).join(', ') : list[0]?.text ?? '');
/**
 * Lot P, étape 3 : relation d'une marge en une cellule : relation, formules, signal, où corriger.
 * « — » pour une ligne sans relation.
 * @param {{ scope?: string | null, relations?: { text: string, n: number }[], signals?: { text: string, n: number }[], scopes?: { text: string, n: number }[] }} r
 */
export function relationCell(r) {
  // Lot P-fin : marge non coupée, relations réunies.
  if (!r.scope && r.scopes?.length) {
    const one = r.scopes.length === 1 ? r.scopes[0].text : null;
    const rel = one ? (one === 'inconnue' ? 'relation inconnue' : one) : r.scopes.map((x) => `${x.text === 'inconnue' ? 'relation inconnue' : x.text} (${x.n})`).join(', ');
    const where = one ? (one === 'inconnue' ? WHERE_TO_FIX[one] : `à corriger ${WHERE_TO_FIX[one]}`) : 'à vérifier élément par élément';
    return [rel, listed(r.signals ?? []), where].filter(Boolean).join(' · ');
  }
  if (!r.scope) return '—';
  const where = WHERE_TO_FIX[r.scope];
  const parts = r.scope === 'inconnue' ? ['relation inconnue'] : [r.scope, listed(r.relations ?? [])];
  parts.push(listed(r.signals ?? []), r.scope === 'inconnue' ? where : `à corriger ${where}`);
  return parts.filter(Boolean).join(' · ');
}

/**
 * Valeur après la table (avec décisions) pour une couleur et un usage.
 * @param {Record<string, any>} map @param {string} value @param {string} usage
 */
const mapped = (map, value, usage) => map.colors?.[`${value}|${usage}`] ?? map.colors?.[value] ?? value;

/**
 * Origine CSS d'une ligne : la règle tracée d'un élément d'exemple (fichier:ligne).
 * @param {any} rendered @param {string} family @param {any} r
 */
function originOf(rendered, family, r) {
  const fams = family === 'spacing' ? [SPACING_FAMILY[r.usage] ?? 'margins'] : [family];
  for (const f of fams) {
    const contexts = rendered.families?.[f]?.values?.[r.old]?.contexts ?? [];
    const props = new Set(r.properties ?? []);
    const pool = contexts.filter((/** @type {any} */ c) => c.trace && (family === 'fontSizes' || !props.size || props.has(c.property)));
    const sheet = pool.find((/** @type {any} */ c) => c.trace.origin === 'feuille' && c.trace.line);
    if (sheet) {
      const t = sheet.trace;
      const file = t.href ? basename(new URL(t.href).pathname) : '<style>';
      return `${file}:${t.line}`;
    }
    const other = pool.find((/** @type {any} */ c) => c.trace.origin !== 'non tracé');
    if (other) return other.trace.origin;
  }
  return 'non tracé';
}

/**
 * @param {object} o
 * @param {ReturnType<typeof import('../reduce/propose.js').propose> & { thirdParty?: string[] }} o.table
 * @param {any} o.rendered        agrégat du rendu (usages, contextes tracés, états)
 * @param {Record<string, any>} o.map   table appliquée, décisions comprises (mapping)
 * @param {any} o.target          cible (onSolid, couleurs)
 * @param {any} [o.tokens]        fichier de jetons DTCG
 * @param {Record<string, string | false>} [o.decisions]  décisions du designer (--decisions) : une chaîne décide, false refuse
 * @param {{ host: string, stamp: string, target: string, tokens: string | null, pages: string[], viewport: { width: number, height: number }, command?: string }} o.meta
 */
/** Lot C : « 12 px » pour une dimension, la valeur telle quelle sinon. @param {string} v */
const shortValue = (v) => (/^-?[\d.]+px$/.test(v) ? `${String(parseFloat(v)).replace('.', ',')} px` : v);



/**
 * COUPLAGES : textes posés sur un plein et l'onSolid de l'échelle du plein. Une entrée par paire
 * après la table, avec ses paires d'origine (befores). Lot V, étape 4 : la simulation les applique
 * aussi (voir simulationCouplings). Lot K : un couplage est une décision ; seuls les pleins dont la
 * carte a retenu « onSolid » en ont, pour tous leurs textes (sauf ceux déjà à l'onSolid).
 * @param {{ rendered: any, map: Record<string, any>, target?: any, pleins?: any[] }} o
 */
export function couplingsOf({ rendered, map, pleins = [] }) {
  /** @type {any[]} */
  const onSolid = [];
  for (const p of rendered.usages?.pairs ?? []) {
    if (p.bgUsage !== 'plein') continue;
    const g = pleins.find((x) => x.choice === 'onSolid' && x.rows.some((/** @type {any} */ r) => r.old === p.bg));
    if (!g) continue;
    const text = mapped(map, p.text, 'texte');
    const bg = mapped(map, p.bg, 'plein');
    if (text === g.onSolid) continue;
    const ratio = contrastRatio(text, bg);
    const seen = (rendered.contrast?.pairs ?? []).find((/** @type {any} */ x) => x.text === p.text && x.bg === p.bg);
    // Une entrée par paire après la table : plusieurs fonds d'origine peuvent aller au même pas.
    let o = onSolid.find((x) => x.text === text && x.bg === bg);
    if (!o) {
      o = { text, bg, before: { text: p.text, bg: p.bg }, befores: [], ratio: Math.round(ratio * 10000) / 10000, threshold: p.threshold, scale: g.scale, onSolid: g.onSolid, card: g.title, n: 0, selectors: [] };
      onSolid.push(o);
    }
    o.n += p.n;
    if (!o.befores.some((/** @type {any} */ b) => b.bg === p.bg && b.text === p.text)) o.befores.push({ text: p.text, bg: p.bg });
    for (const sel of seen?.selectors ?? []) if (!o.selectors.includes(sel)) o.selectors.push(sel);
  }
  return onSolid;
}

/**
 * Lot V, étape 4 : couplages pour la simulation, par paire d'origine : texte et fond lus dans la
 * page, fond attendu après la table (to), couleur posée sur le texte (onSolid).
 * @param {any[]} couplings  couplingsOf(…)
 * @returns {{ text: string, bg: string, to: string, onSolid: string }[]}
 */
export const simulationCouplings = (couplings) =>
  couplings.flatMap((o) => o.befores.map((/** @type {any} */ b) => ({ text: b.text, bg: b.bg, to: o.bg, onSolid: String(o.onSolid).toLowerCase() })));

/**
 * Lot V, étape 5 : page témoin, hors de la table, sur laquelle la table est simulée.
 * @typedef {{ url: string, page: string, elements: number, changed: number, operations: number, byFamily: Record<string, number>,
 *   uncovered: { family: string, value: string, usage: string | null, count: number, selectors: string[] }[] }} Witness
 */

/** @param {{ table: any, rendered: any, map: Record<string, any>, target: any, tokens?: any, decisions?: Record<string, string | false>, meta: any, witnesses?: Witness[], conflicts?: any[] }} o */
export function buildMigration({ table, rendered, map, target, tokens, decisions = {}, meta, witnesses = [], conflicts = [] }) {
  const idx = tokens ? indexTokens(tokens) : null;
  /** @param {string} family @param {string | null} value @param {{ name?: string | null, pleinScales?: Set<string> }} [ctx] */
  const token = (family, value, ctx) => (value === null ? '—' : idx?.find(family, value, ctx) ?? 'jeton absent');
  const { T, pleinOf } = pleinFinder(target);
  /** @param {string} hex */
  const scaleOf = (hex) => pleinOf(hex)?.scale ?? null;
  /** Échelles des pleins sur lesquels un texte est posé (après la table). @param {string} text */
  const pleinScalesOf = (text) => {
    /** @type {Set<string>} */
    const out = new Set();
    for (const p of rendered.usages?.pairs ?? []) {
      if (p.text !== text || p.bgUsage !== 'plein') continue;
      const sc = scaleOf(mapped(map, p.bg, 'plein'));
      if (sc) out.add(sc);
    }
    return out;
  };

  /** @param {string} family @param {any} r */
  const decisionOf = (family, r) => decisionFor(decisions, family, r);
  /** @param {string} hex */
  const valiseName = (hex) => T.find((/** @type {any} */ t) => t.value === hex.toLowerCase())?.name ?? null;

  /** @type {any[]} */
  const rows = [];
  for (const [family, f] of Object.entries(table.families))
    for (const r of f.rows) {
      const d = decisionOf(family, r);
      // Statut après décisions : une chaîne décide (la ligne est appliquée), false refuse.
      // Lot K : une ligne de fond d'un plein suit sa carte ; non tranchée, elle attend (K5).
      const pl = r.plein ?? null;
      const status = pl
        ? !pl.choice
          ? 'en attente'
          : typeof d === 'string' && d !== r.old
            ? 'décidée'
            : 'inchangé'
        : r.class === 'inchangé' && d !== false
          ? 'inchangé'
          : d === false
            ? 'refusée'
            : typeof d === 'string' && d !== r.old
              ? 'décidée'
              : isOut(r.class)
                ? 'hors table'
                : r.class === 'décision'
                  ? 'en attente'
                  : 'appliquée';
      const next = status === 'décidée' ? /** @type {string} */ (d) : status === 'appliquée' || status === 'en attente' ? r.new : status === 'inchangé' ? r.old : null;
      const name = status === 'décidée' ? (family === 'colors' ? valiseName(/** @type {string} */ (d)) : null) : isOut(r.class) ? null : r.name ?? null;
      rows.push({
        id: r.id ?? '',
        title: r.title ?? '',
        family,
        value: r.old,
        usage: r.usage ?? (family === 'fontSizes' ? 'taille du texte' : (r.usages ?? []).join(', ')),
        scope: r.scope ?? null,
        relation: relationCell(r),
        token: token(family, next, family === 'colors' ? { name, pleinScales: r.usage === 'texte' ? pleinScalesOf(r.old) : new Set() } : undefined),
        new: next,
        status,
        decision: d ?? null,
        decisionKey: decisionKeyFor(decisions, family, r),
        properties: r.properties ?? [],
        // Lot R : tous les sélecteurs des éléments touchés (capture), sinon les exemples du relevé,
        // signalés comme coupés quand la ligne compte plus d'occurrences que d'exemples.
        selectors: r.capture?.touched?.length ? [...new Set(r.capture.touched.map((/** @type {any} */ t) => t.selector))] : r.selectors ?? [],
        selectorsCut: !r.capture?.touched?.length && (r.selectors ?? []).length >= 3 && r.count > (r.selectors ?? []).length,
        class: r.class,
        origin: originOf(rendered, family, r),
        elements: r.count,
        reason: r.reason ?? (r.class === 'hors table' ? OUT_REASON : null),
        candidates: r.candidates ?? [],
        contrast: r.contrast ?? null,
        tie: tieOf(r.candidates ?? []),
        // Lot V, étape 6 : déclarations sources (unité écrite) et conflits (même déclaration, issues différentes).
        declarations: r.declarations ?? null,
        conflict: r.conflict ?? null,
        conflicts: r.conflicts ?? [],
        coupledDeclarations: r.coupledDeclarations ?? [],
        // Lot K : carte de plein suivie (identifiant, titre, choix, décision de ligne ignorée).
        plein: pl,
        // Lot M : emplacement de marque, seconde version ou exception (M6).
        ...(r.slot ? { slot: r.slot } : {}),
        // Valeur lisible sur tous les fonds (proposition M5), gardée par les éléments en exception.
        ...(r.alternatives ? { alternatives: r.alternatives, readable: { name: r.name, value: r.new } } : {}),
      });
    }
  const applied = rows.filter((r) => r.status === 'appliquée' || r.status === 'décidée');
  const pending = rows.filter((r) => r.status === 'en attente');
  const refused = rows.filter((r) => r.status === 'refusée');
  const outOfTable = rows.filter((r) => r.status === 'hors table');
  // Lot I : valeurs inchangées rattachées à leur jeton (I1) ; sans jeton, elles restent écrites (I2).
  const attached = rows.filter((r) => r.status === 'inchangé' && hasToken(r));
  /** @param {any[]} list */
  const byFamily = (list) => Object.fromEntries(Object.keys(table.families).map((f) => [f, list.filter((r) => r.family === f).length]));

  // Exceptions nommées.
  const links = (rendered.usages?.links ?? []).map((/** @type {any} */ l) => ({ ...l }));
  const pleins = table.pleins ?? [];
  const onSolid = couplingsOf({ rendered, map, target, pleins }).map((o) => ({ ...o, token: idx?.find('colors', o.onSolid, { pleinScales: new Set([o.scale]) }) ?? null }));
  // Paires encore sous leur seuil une fois la table posée, hors celles que le couplage onSolid répare.
  /** @type {Map<string, { text: string, bg: string, ratio: number, threshold: number, n: number }>} */
  const remaining = new Map();
  for (const p of rendered.usages?.pairs ?? []) {
    const text = mapped(map, p.text, 'texte');
    const bg = mapped(map, p.bg, p.bgUsage);
    const ratio = contrastRatio(text, bg);
    if (ratio >= p.threshold || onSolid.some((o) => o.text === text && o.bg === bg)) continue;
    const k = `${text}|${bg}`;
    // Lot K : paire d'un plein gardée par le designer (c), ou dont la carte attend (K5).
    const g = pleins.find((x) => x.rows.some((/** @type {any} */ r) => r.old === p.bg));
    const note = g?.choice === 'garder' ? 'gardée par le designer' : g && !g.choice ? `en attente du designer (carte ${g.title})` : null;
    const x = remaining.get(k) ?? { text, bg, ratio: Math.round(ratio * 10000) / 10000, threshold: p.threshold, n: 0, note };
    x.note = x.note ?? note;
    x.n += p.n;
    remaining.set(k, x);
  }
  const states = (rendered.states?.onlyInStates ?? []).map((/** @type {string} */ hex) => {
    const v = rendered.states.colors[hex];
    return { value: hex, contexts: v.contexts.map((/** @type {any} */ c) => ({ state: c.state, property: c.property, role: c.role, selectors: c.selectors })) };
  });
  const ties = rows.filter((r) => r.tie && r.status === 'appliquée');
  // Valeur de la valise utilisée hors de sa tranche (R1) : signalée, la table ne change pas.
  /** @type {any[]} */
  const outOfSlice = [];
  for (const r of table.families.colors?.rows ?? []) {
    const slice = r.usage ? SLICES[r.usage] : undefined;
    const exact = T.find((/** @type {any} */ t) => t.value === r.old);
    const m = exact ? /^(.+)-(\d+)$/.exec(exact.name ?? '') : null;
    if (!slice || !m) continue;
    const step = Number(m[2]);
    if (step >= slice[0] && step <= slice[1]) continue;
    outOfSlice.push({ value: r.old, name: exact.name, usage: r.usage, elements: r.count, step, expected: `${r.usage} ${slice[0]}-${slice[1]}`, class: r.class, selectors: r.selectors });
  }

  const data = {
    meta,
    rows,
    witnesses,
    conflicts,
    // Lot K : cartes « Texte sur plein », sans leurs captures.
    pleins: pleins.map(({ capture, ...g }) => g),
    sections: {
      applied: { total: applied.length, ...byFamily(applied) },
      pending: { total: pending.length, ...byFamily(pending) },
      refused: { total: refused.length, ...byFamily(refused) },
      outOfTable: { total: outOfTable.length, ...byFamily(outOfTable) },
    },
    unchanged: rows.filter((r) => r.status === 'inchangé').length,
    attached: attached.length,
    decided: rows.filter((r) => r.status === 'décidée').length,
    // Lot K (retouche) : décisions du fichier, comptées par clé ; les décisions de ligne qui suivent
    // une carte sont comptées à part.
    decisionKeys: {
      decided:
        new Set(rows.filter((r) => r.status === 'décidée' && !r.plein).map((r) => r.decisionKey)).size + pleins.filter((g) => g.choice).length,
      ignored: pleins.reduce((n, g) => n + (g.ignored?.length ?? 0), 0),
    },
    exceptions: { links, onSolid, states, injected: null, ties, outOfSlice, messages: rendered.usages?.messages ?? [] },
    remaining: [...remaining.values()],
    thirdParty: table.thirdParty ?? [],
    ...(table.brand ? { brand: table.brand } : {}),
  };
  const agent = agentBrief(data, { applied, pending, refused, outOfTable, attached });
  return { data: { ...data, agent }, markdown: renderMarkdown(data, { applied, pending, refused, outOfTable }) + '\n' + agent.markdown };
}

/**
 * @param {any} d
 * @param {{ applied: any[], pending: any[], refused: any[], outOfTable: any[] }} s
 */
/**
 * Lot M (M6) : seconde version d'une décision, ou pourquoi il n'y en a pas.
 * @param {any} r
 */
function m6Text(r) {
  const a = r.alternatives?.[0];
  if (!a) return '';
  const moves = a.backgrounds.map((/** @type {any} */ b) => `le fond ${b.from} passe à ${b.name} (${b.to})`).join(' et ');
  const ex = exceptionsText(a, r.readable);
  return ` Seconde version (M6) : ${a.name} (${a.new})${moves ? `, si ${moves}` : ''}${ex ? `, sauf ${ex}` : ''}.`;
}

/**
 * Lot M (M6) : éléments en exception d'une seconde version (aucun fond proche), et la valeur qu'ils gardent.
 * @param {any} a  seconde version @param {{ name: string, value: string } | undefined} readable
 */
function exceptionsText(a, readable) {
  if (!a.exceptions?.length) return '';
  return a.exceptions
    .map((/** @type {any} */ x) => `${x.elements} élément(s) sur le fond ${x.background}, page ${x.pages.join(', ')} (${x.selectors.join(', ')}), qui gardent ${readable ? `${readable.name} (${readable.value})` : 'la valeur lisible'}`)
    .join(' ; ');
}

/**
 * Lot M : fond à déplacer quand la valeur décidée est celle de la seconde version (M6).
 * @param {any} r
 */
function m6Move(r) {
  const a = r.alternatives?.find((/** @type {any} */ x) => x.new === r.new);
  if (r.status !== 'décidée' || !a) return '';
  const moves = a.backgrounds.length ? ` Déplace aussi le fond de la paire : ${a.backgrounds.map((/** @type {any} */ b) => `${b.from} → ${b.to} (${b.name})`).join(', ')}, seulement sous ces sélecteurs.` : '';
  const ex = a.exceptions?.length
    ? ` Exception (M6) : ${a.exceptions.map((/** @type {any} */ x) => `page ${x.pages.join(', ')}, fond ${x.background}, ${x.elements} élément(s) (${x.selectors.join(', ')})`).join(' ; ')} : écris ${r.readable ? `${r.readable.value} (${r.readable.name})` : 'la valeur lisible'} au lieu de ${a.new}, qui y resterait sous le seuil.`
    : '';
  return moves + ex;
}

function renderMarkdown(d, s) {
  const m = d.meta;
  const L = [];
  L.push(`# Migration : ${m.host}`, '');
  L.push(`Réduction du ${m.stamp}, fenêtre ${m.viewport.width}×${m.viewport.height}, cible \`${m.target}\`, jetons \`${m.tokens ?? 'aucun fichier de jetons (--tokens)'}\`.`);
  L.push(`Pages : ${m.pages.map((/** @type {string} */ p) => `\`${p}\``).join(', ')}.`, '');
  L.push('Ce document se lit sans l’outil. Chaque ligne range une valeur relevée dans le rendu, pour un usage, sur un jeton de la cible.');
  L.push('« Origine CSS » donne la règle d’un élément d’exemple (fichier:ligne de la règle) ; « non tracé » quand elle n’a pas pu être lue (fond de page, pseudo-élément).', '');
  if (m.decisions) {
    const k = d.decisionKeys;
    const n = (/** @type {number} */ x, /** @type {string} */ one, /** @type {string} */ many) => `${x} ${x > 1 ? many : one}`;
    const ignored = k.ignored ? `, ${n(k.ignored, 'décision de ligne ignorée : suit une carte', 'décisions de ligne ignorées : suivent une carte')}` : '';
    L.push(`Décisions lues : \`${m.decisions}\`, ${n(k.decided, 'décidée', 'décidées')}, ${n(d.sections.refused.total, 'refusée', 'refusées')}${ignored}.`, '');
  }
  L.push('| section | lignes | couleurs | espacements | tailles | rayons |', '|---|---|---|---|---|---|');
  for (const [k, label] of [['applied', 'Appliqué (auto, proche, correction, décidée)'], ['pending', 'Décisions en attente'], ['refused', 'Refusée, laissée telle quelle'], ['outOfTable', 'Hors table']]) {
    const x = d.sections[k];
    L.push(`| ${label} | ${x.total} | ${x.colors ?? 0} | ${x.spacing ?? 0} | ${x.fontSizes ?? 0} | ${x.radii ?? 0} |`);
  }
  // Lot I (I7) : combien rattachées à leur jeton, combien sans jeton.
  L.push(`| Inchangé : ${d.attached} rattachée${d.attached > 1 ? 's' : ''}, ${d.unchanged - d.attached} sans jeton | ${d.unchanged} | | | | |`, '');

  if (d.brand) {
    L.push('## Marque déclarée', '', 'Emplacements lus dans la cible (bloc brand) : chacun range sa valeur et ses variantes sur son échelle (M3) ; un emplacement gris rejoint neutre (M1), sauf déclaration contraire.', '');
    L.push('| emplacement | variable | valeur | échelle |', '|---|---|---|---|');
    for (const x of d.brand.slots) L.push(`| ${cell(x.slot)} | ${x.variable ? `\`${cell(x.variable)}\`` : '—'} | \`${cell(x.value)}\` | ${cell(x.scale)}${x.rule ? ` (${x.rule})` : ''} |`);
    L.push('', `### Contradictions entre le back-office et la feuille : ${d.brand.contradictions.length}`, '');
    for (const c of d.brand.contradictions)
      L.push(`- \`${c.variable}\` vaut \`${c.backOffice}\` au back-office, la feuille donne \`${c.sheet}\` : ${c.ruling ? `la cible le range sur ${c.ruling} (M7)` : 'la cible ne tranche pas : à déclarer (M7)'}.`);
    if (!d.brand.contradictions.length) L.push('- Aucune.');
    L.push('');
  }
  // Lot K : une décision par plein ; les décisions de ligne sur ses fonds sont ignorées.
  if ((d.pleins ?? []).length) {
    L.push(`## Texte sur plein : ${d.pleins.length}`, '', 'Un texte posé sur un plein qui échoue au contraste est une décision par plein (une carte par échelle). Les lignes de fond qui mènent à ce plein suivent la carte, sans choix séparé ; non tranchée, rien n’est appliqué (ni texte, ni fond).', '');
    L.push('| carte | clé | lignes de fond | versions (contraste) | choix | décisions de ligne ignorées |', '|---|---|---|---|---|---|');
    for (const g of d.pleins)
      L.push(
        `| ${cell(g.title)} | \`${cell(g.key)}\` | ${g.rows.map((/** @type {any} */ r) => `${r.id} \`${r.old}\``).join(', ')} | ${g.versions.map((/** @type {any} */ v) => `${v.choice} : ${v.text} sur ${v.bg}, ${fr(v.ratio)}:1${v.pass ? '' : ', sous le seuil'}`).join(' ; ')} | ${g.choice ?? 'en attente'} | ${g.ignored.length ? g.ignored.map((/** @type {any} */ x) => `décision de ligne ignorée (${x.value === false ? 'false' : x.value}) : ${x.id} \`${x.key}\`, suit la carte`).join(' ; ') : '—'} |`,
      );
    L.push('');
  }
  L.push('## Table', '', 'Chaque ligne commence par son identifiant et son titre, les mêmes que dans table.json, revue.html et la barre --live.', '');
  L.push('« Relation » dit, pour une marge, ce qu’elle sépare (dans le composant, entre composants, ou inconnue), le signal qui l’établit et où la corriger ; « motif », pourquoi la ligne est classée ainsi.', '');
  L.push('| ligne | famille | valeur | usage | jeton | classe | relation | motif | origine CSS | éléments |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of d.rows)
    L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family] ?? r.family} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === '—' || r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | ${cell(classLabel(r))} | ${cell(r.relation)} | ${cell(r.reason ?? '—')} | ${cell(r.origin)} | ${r.elements} |`);
  L.push('');

  L.push(`## Appliqué (auto, proche, correction, décidée) : ${s.applied.length}`, '', 'La table pose ces remplacements. Une correction (R9) répare un contraste ; elle reste annulable. Une ligne « décidée » porte la valeur choisie par le designer.', '');
  L.push('| ligne | famille | valeur | usage | relation | → jeton | valeur cible | classe | motif | sélecteurs |', '|---|---|---|---|---|---|---|---|---|---|');
  for (const r of s.applied)
    L.push(
      `| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.relation)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | \`${cell(r.new)}\` | ${cell(classLabel(r))} | ${r.status === 'décidée' ? 'décidée' : cell(r.reason ?? '')}${r.contrast && r.status !== 'décidée' ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)}` : ''} | ${selectorsOf(r)} |`,
    );
  L.push('');

  L.push(`## Décisions en attente : ${s.pending.length}`, '', 'Rien n’est appliqué tant que le designer n’a pas répondu (R5). Les candidats de dimension sont rangés par valeur croissante, le plus proche signalé ; ceux de couleur, du plus proche au plus loin.', '');
  L.push('| ligne | famille | valeur | usage | relation | proposé | candidats | motif | sélecteurs |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of s.pending)
    L.push(
      `| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.relation)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} (\`${cell(r.new)}\`) | ${r.candidates.map((/** @type {any} */ c) => `\`${cell(c.value)}\` (${fr(c.delta)}${c.nearest ? `, le plus proche${r.tie && r.tie[0] === c.value ? `, à égalité avec ${shortValue(r.tie[1])}` : ''}` : ''})`).join(', ')} | ${cell(r.reason ?? 'écart au-delà des seuils')}${r.contrast ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)} si appliquée` : ''}${cell(m6Text(r))} | ${selectorsOf(r)} |`,
    );
  L.push('');

  L.push(`## Refusée, laissée telle quelle : ${s.refused.length}`, '', 'Le designer a refusé le changement : la valeur reste.', '');
  L.push('| ligne | famille | valeur | usage | relation | proposé | classe | motif | éléments |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of s.refused) L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.relation)} | ${nearestOf(r) ? `\`${cell(nearestOf(r).value)}\`` : '—'} | ${cell(r.class)} | ${cell(r.reason ?? '—')} | ${r.elements} |`);
  if (!s.refused.length) L.push('| — | | | | | | | | |');
  L.push('');

  L.push(`## Hors table : ${s.outOfTable.length}`, '', 'Laissées telles quelles, avec leur motif.', '');
  L.push('| ligne | famille | valeur | usage | relation | motif | éléments |', '|---|---|---|---|---|---|---|');
  for (const r of s.outOfTable) L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.relation)} | ${cell(r.reason)} | ${r.elements} |`);
  L.push('');

  // Lot V, étape 5 : pages témoins, hors de la table.
  if (d.witnesses?.length) {
    L.push(`## Pages témoins : ${d.witnesses.length}`, '', 'Ces pages n’entrent pas dans la table : la table y est simulée telle quelle, couplages compris. Une valeur non couverte n’a aucune ligne pour sa valeur et son usage ; la migration ne la touche pas.', '');
    for (const w of d.witnesses) {
      const fams = Object.entries(w.byFamily ?? {}).map(([f, n]) => `${FAMILY_LABELS[f] ?? f} ${n}`).join(', ');
      L.push(`### \`${w.page}\``, '', `${w.changed} élément(s) changé(s) sur ${w.elements}, ${w.operations} opération(s)${fams ? ` (${fams})` : ''}.`, '');
      if (!w.uncovered.length) L.push('Valeurs non couvertes : aucune.', '');
      else {
        L.push(`Valeurs non couvertes : ${w.uncovered.length}`, '', '| famille | valeur | usage | éléments | exemples |', '|---|---|---|---|---|');
        for (const u of w.uncovered)
          L.push(`| ${FAMILY_LABELS[u.family] ?? u.family} | \`${cell(u.value)}\` | ${cell(u.usage ?? 'taille du texte')} | ${u.count} | ${u.selectors.map((x) => `\`${cell(x)}\``).join(', ')} |`);
        L.push('');
      }
    }
  }

  const e = d.exceptions;
  L.push('## Exceptions', '');
  L.push(`### Liens sans soulignement dans un paragraphe : ${e.links.length}`, '');
  L.push('Un lien posé dans du texte courant sans soulignement ne se distingue que par sa couleur : WCAG demande alors 3:1 avec le texte voisin et un autre signal au survol et au focus.', '');
  for (const l of e.links) L.push(`- \`${l.color}\` dans un texte \`${l.neighbor}\` : ${fr(l.ratio)}:1 (${l.n} lien(s) : ${l.selectors.map((/** @type {string} */ x) => `\`${x}\``).join(', ')}).`);
  if (!e.links.length) L.push('- Aucun.');
  L.push('');
  L.push(`### Messages non reliés à leur champ : ${e.messages.length}`, '');
  L.push('Un message (aide, erreur) rattaché à son champ par la seule position n’est pas annoncé par un lecteur d’écran avec le champ : relier le message par aria-describedby (id du message dans l’attribut du champ).', '');
  for (const x of e.messages) L.push(`- \`${cell(x.message)}\` sous le champ \`${cell(x.field)}\`.`);
  if (!e.messages.length) L.push('- Aucun.');
  L.push('');
  L.push(`### Texte sur un plein à poser en onSolid : ${e.onSolid.length}`, '');
  L.push('Après la table, ces textes restent sous leur seuil sur un fond de pas 9-10. Ni la table ni R9 ne les corrigent (zone morte) : poser la couleur onSolid de l’échelle.', '');
  for (const p of e.onSolid) L.push(`- \`${p.text}\` sur \`${p.bg}\` (${p.scale}) : ${fr(p.ratio)}:1, seuil ${fr(p.threshold)} ; onSolid ${p.scale} = \`${p.onSolid}\`.`);
  if (!e.onSolid.length) L.push('- Aucun.');
  L.push('');
  L.push(`### États non lus : ${e.states.length}`, '');
  L.push('Couleurs vues seulement à un état forcé (survol, focus, actif) : la table et la simulation ne les rangent pas.', '');
  for (const st of e.states)
    L.push(`- \`${st.value}\` : ${st.contexts.map((/** @type {any} */ c) => `${c.state} ${c.property} (${c.role} : ${c.selectors.map((/** @type {string} */ x) => `\`${x}\``).join(', ')})`).join(' ; ')}.`);
  if (!e.states.length) L.push('- Aucun.');
  L.push('');
  L.push('### Élément injecté après le chargement : limite connue', '');
  L.push('- Un élément ajouté par script après la lecture de la page n’est ni mesuré ni simulé. L’outil ne le détecte pas : à vérifier à la main sur les composants chargés à la demande.', '');
  L.push(`### Égalités tranchées en silence : ${e.ties.length}`, '');
  L.push('La valeur est à égale distance de deux pas ; la table a pris le plus petit sans le demander.', '');
  for (const r of e.ties) L.push(`- ${FAMILY_LABELS[r.family]} \`${r.value}\` (${r.usage}) : entre \`${r.tie[0]}\` et \`${r.tie[1]}\`, rangée vers \`${r.new}\` (${r.class}).`);
  if (!e.ties.length) L.push('- Aucune.');
  L.push('');
  L.push(`### Valeur de la valise utilisée hors de sa tranche : ${e.outOfSlice.length}`, '');
  L.push('La valeur est un pas exact de la valise, mais son usage appelle une autre tranche (texte 11-12, bordure 6-8, fond 1-5, plein 9-10). La table ne la change pas ; à revoir avec le designer.', '');
  L.push('| valeur | pas | usage | éléments | tranche attendue | classe dans la table | exemples |', '|---|---|---|---|---|---|---|');
  for (const x of e.outOfSlice)
    L.push(`| \`${x.value}\` | ${x.name} | ${x.usage} | ${x.elements} | ${x.expected} | ${x.class} | ${x.selectors.map((/** @type {string} */ y) => `\`${cell(y)}\``).join(', ')} |`);
  if (!e.outOfSlice.length) L.push('| — | | | | | | |');
  L.push('');
  return L.join('\n');
}

/** Classe affichée : la classe de la table, et « décidée » ou « refusée » le cas échéant. @param {any} r */
function classLabel(r) {
  return r.status === 'décidée' || r.status === 'refusée' ? `${r.class}, ${r.status}` : r.class;
}

/** Propriété CSS lisible, côtés et coins regroupés. @param {string} family @param {string[]} props */
function propertyOf(family, props) {
  if (family === 'fontSizes') return 'font-size';
  const out = new Set(
    props.map((p) =>
      p
        .replace(/^border-(top|right|bottom|left)-color$/, 'border-color')
        .replace(/^border-(top|bottom)-(left|right)-radius$/, 'border-radius')
        .replace(/^(margin|padding)-(top|right|bottom|left)$/, '$1')
        .replace(/^(row|column)-gap$/, 'gap'),
    ),
  );
  return [...out].join(', ');
}

/** Lot P, étape 3 : relation d'une marge dans la consigne. @param {any} r */
// Lot P-fin : « à vérifier » reste dans la revue et dans les tables, pas dans la consigne.
const relationOf = (r) => {
  const rel = (r.relation ?? '').split(' · ').filter((/** @type {string} */ x) => !x.startsWith('à vérifier')).join(' · ');
  return rel && rel !== '—' ? ` Relation : ${rel}.` : '';
};

/** Variable CSS d'un jeton DTCG (points en tirets), avec repli : l'ancienne valeur mesurée (lot I). @param {string} token @param {string} old */
const cssVarFallback = (token, old) => `var(--${token.replace(/\./g, '-')}, ${old})`;
/** La ligne a-t-elle un jeton ? @param {any} r */
const hasToken = (r) => !!r.token && r.token !== 'jeton absent' && r.token !== '—';
/** Lot I (I4) : relation d'une ligne en quelques mots (sans signal ni lieu), ou rien. @param {any} r */
const relationShort = (r) => {
  const first = (r.relation ?? '—').split(' · ')[0];
  return first && first !== '—' ? ` ${first}` : '';
};

/**
 * Lot M : « Consigne pour un agent », à l'impératif, copiable telle quelle.
 * @param {any} d @param {{ applied: any[], pending: any[], refused: any[], outOfTable: any[], attached: any[] }} s
 */
function agentBrief(d, s) {
  const m = d.meta;
  /** @param {any} r */
  const write = (r) => (hasToken(r) ? `${cssVarFallback(r.token, r.value)} (${r.new})` : `${r.new} (jeton absent : écris la valeur)`);
  const lines = [];
  lines.push('CONTEXTE');
  lines.push(`Tu migres les feuilles CSS des pages ${m.pages.join(', ')} vers les jetons ${m.tokens ?? '(aucun fichier de jetons)'} de la cible ${m.target}.`);
  lines.push(
    "Écris chaque jeton sous la forme var(--couleur-neutre-11, ancienne valeur) : chemin du jeton, points remplacés par des tirets ; en repli, l'ancienne valeur ; si la source l'écrit autrement (rem, rgb()), garde l'écriture de la source. Si la ligne dit « jeton absent », écris la valeur hex ou px indiquée.",
  );
  lines.push('Les valeurs ci-dessous sont des valeurs calculées : dans la source, elles peuvent être écrites autrement (rem, em, rgb(), mot-clé) ; cherche leur équivalent.');
  // Lot V, étape 6 : D3 (unité relative) et D4 (conflits), en règle générale.
  lines.push(
    "Une déclaration source en unité relative (rem, em, %) dépend de la racine de sa page : en RATTACHE, ne la rattache pas, laisse-la et pose au-dessus /* ds-lab : unité relative, non rattachée (<valeur>, <date>) */ ; en REMPLACEMENTS, remplace-la et vérifie le rendu sur les pages témoins. Quand une ligne ne liste pas ses déclarations, lis la source et applique cette règle.",
  );
  lines.push("Quand une ligne liste ses déclarations, ne touche que celles-là. Une déclaration de CONFLITS ne se remplace pas : ne coupe pas la règle.");
  lines.push('');
  const date = String(m.stamp ?? '').slice(0, 10);
  /** @param {any} e */
  const at = (e) => `${e.file}:${e.line} ${e.selector}`;
  /** @param {any} e */
  const said = (e) => `${at(e)} (${e.written ?? '?'}${e.inherited ? ', héritée' : ''})`;
  /**
   * Déclarations d'une ligne, pour l'agent (D3, D4). Null quand l'outil ne les connaît pas.
   * @param {any} r @param {boolean} attach  ligne RATTACHE
   */
  const declsOf = (r, attach) => {
    // Une déclaration par feuille, ligne et sélecteur : les côtés et les coins d'un raccourci ne se répètent pas.
    /** @type {Map<string, any>} */
    const seen = new Map();
    for (const e of r.declarations ?? []) {
      const k = `${at(e)}|${e.written}`;
      const prev = seen.get(k);
      seen.set(k, prev ? { ...prev, conflict: prev.conflict || e.conflict, inherited: prev.inherited || e.inherited } : e);
    }
    const ds = [...seen.values()];
    if (!ds.length) return null;
    const ok = ds.filter((/** @type {any} */ e) => !e.conflict);
    const rel = ok.filter((/** @type {any} */ e) => e.unit === 'relative');
    const parts = [];
    if (attach) {
      const abs = ok.filter((/** @type {any} */ e) => e.unit !== 'relative');
      if (abs.length) parts.push(`Déclarations à rattacher : ${abs.map(said).join(', ')}.`);
      if (rel.length)
        parts.push(`Laisse en l'état, unité relative : ${rel.map((/** @type {any} */ e) => `${said(e)}, pose au-dessus /* ds-lab : unité relative, non rattachée (${e.written}, ${date}) */`).join(' ; ')}.`);
    } else {
      if (ok.length) parts.push(`Déclarations à remplacer : ${ok.map(said).join(', ')}.`);
      if (rel.length) parts.push(`Unité relative (${rel.map((/** @type {any} */ e) => `${e.written}, ${e.file}:${e.line}`).join(' ; ')}) : à vérifier sur les pages témoins.`);
    }
    const conf = ds.filter((/** @type {any} */ e) => e.conflict);
    if (conf.length) parts.push(`hors : ${conf.map(said).join(', ')} : conflit, voir CONFLITS.`);
    parts.push('Ne touche que ces déclarations.');
    return parts.join(' ');
  };
  /**
   * Lot V, étape 6 : une ligne de texte exclut les éléments visés par un COUPLAGE (leur texte devient
   * l'onSolid) et le dit ; leurs déclarations relèvent de COUPLAGES.
   * @param {any} r
   */
  const coupledOf = (r) => {
    if (r.family !== 'colors' || r.usage !== 'texte') return '';
    const hits = d.exceptions.onSolid.filter((/** @type {any} */ p) => p.befores.some((/** @type {any} */ b) => b.text === r.value));
    if (!hits.length) return '';
    const sels = [...new Set(hits.flatMap((/** @type {any} */ p) => p.selectors))];
    const decl = [...new Set((r.coupledDeclarations ?? []).map((/** @type {any} */ e) => `${e.file}:${e.line} ${e.selector}`))];
    return ` Exclut les éléments du COUPLAGE (texte posé sur un plein ${[...new Set(hits.map((/** @type {any} */ p) => p.scale))].join(', ')}, voir COUPLAGES) : ${sels.join(', ') || '—'}${decl.length ? ` ; leurs déclarations relèvent de COUPLAGES : ${decl.join(', ')}` : ''}.`;
  };
  /** Lot K : ligne de fond qui suit une carte de plein. @param {any} r */
  const pleinNote = (r) =>
    !r.plein ? '' : r.plein.choice ? ` Suit la carte ${r.plein.title} (${r.plein.key}, choix : ${r.plein.choice}).` : ` Suit la carte ${r.plein.title} (${r.plein.key}), pas encore choisie.`;
  const replaceable = s.applied.filter((/** @type {any} */ r) => r.conflict !== 'total');
  lines.push(`REMPLACEMENTS (${replaceable.length})`);
  lines.push(
    `0. Crée tokens.css, qui déclare dans :root chaque variable utilisée ci-dessous avec sa valeur, à partir de ${m.tokens ?? 'primitives.tokens.json'}, et charge-la avant toutes les autres feuilles, dans toute page qui charge une feuille modifiée, pas seulement les pages de la table.`,
  );
  replaceable.forEach((r, i) => {
    const decl = declsOf(r, false);
    lines.push(
      `${i + 1}. ${r.id} ${r.title}. Propriété ${propertyOf(r.family, r.properties)}, usage ${r.usage} : remplace ${r.value} par ${write(r)}${r.status === 'décidée' ? ' [décidée]' : ''}.${pleinNote(r)}${relationOf(r)}${r.reason && r.status !== 'décidée' ? ` Motif : ${r.reason}.` : ''} Sélecteurs : ${r.selectors.join(', ') || '—'}${cutNote(r)}.${coupledOf(r)}${m6Move(r)} ${decl ?? `Point de départ : ${r.origin}. Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.`}`,
    );
  });
  lines.push('');
  // Lot I (I1, I2) : valeurs déjà sur la cible, rattachées à leur jeton sans changement visible.
  lines.push(`RATTACHE (${s.attached.length})`);
  if (!m.tokens) {
    const n = d.unchanged;
    lines.push(`Aucun fichier de jetons : relance avec --tokens pour rattacher ${n} valeur${n > 1 ? 's' : ''}.`);
  } else {
    s.attached.forEach((r, i) => {
      lines.push(
        `${i + 1}. ${r.id} ${r.title}. Propriété ${propertyOf(r.family, r.properties)}, usage ${r.usage}, valeur ${r.value} : remplace la valeur écrite par ${cssVarFallback(r.token, r.value)} ; aucun changement visible sur les pages mesurées.${relationOf(r)} Sélecteurs : ${r.selectors.join(', ') || '—'}${cutNote(r)}.${coupledOf(r)} ${declsOf(r, true) ?? `Point de départ : ${r.origin}. Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.`}`,
      );
    });
    if (!s.attached.length) lines.push('- Aucune.');
  }
  lines.push('');
  // Lot V, étape 6 (D4) : une déclaration, deux lignes aux issues différentes.
  lines.push(`CONFLITS (${(d.conflicts ?? []).length})`);
  for (const c of d.conflicts ?? [])
    lines.push(
      `- ${c.file}:${c.line} ${c.selector} { ${c.property}: ${c.written ?? '?'} } : même déclaration pour ${c.rows.map((/** @type {any} */ x) => `${x.id} (${x.outcome === 'laisse' ? 'laissée' : `→ ${x.outcome}`}${x.scope ? `, ${x.scope}` : ''})`).join(' et ')}, pages ${c.pages.join(', ')}. Ne remplace pas cette déclaration et ne coupe pas la règle ; pose au-dessus /* ds-lab : conflit, ${c.rows.map((/** @type {any} */ x) => `${x.id} ${x.outcome}`).join(' / ')}, même déclaration (${date}) */ ; signale-le dans ton compte rendu.`,
    );
  if (!(d.conflicts ?? []).length) lines.push('- Aucun.');
  lines.push('');
  // Lot K : un couplage suit la carte de son plein ; les autres choix et les cartes en attente le disent.
  const couples = [];
  for (const p of d.exceptions.onSolid) {
    // Repli : l'ancienne couleur du texte ; une par texte d'origine quand il y en a plusieurs.
    const olds = [...new Set(p.befores.map((/** @type {any} */ b) => b.text))];
    const v = !p.token
      ? ''
      : olds.length === 1
        ? `, ${cssVarFallback(p.token, olds[0])}`
        : `, ${olds.map((/** @type {string} */ o) => `${cssVarFallback(p.token, o)} là où le texte valait ${o}`).join(', ')}`;
    couples.push(
      `- Le texte posé sur un plein ${p.scale} devient ${p.onSolid} (onSolid${v}) : texte ${p.text} sur ${p.bg} après la table (fonds d'origine ${p.befores.map((/** @type {any} */ b) => b.bg).join(', ')}), ${String(p.ratio).replace('.', ',')}:1. Sélecteurs : ${p.selectors.join(', ') || '—'}.`,
    );
  }
  for (const g of d.pleins ?? []) {
    const ver = g.versions.find((/** @type {any} */ x) => x.choice === (g.choice ?? ''));
    const ratio = ver ? `${String(ver.ratio).replace('.', ',')}:1` : '';
    if (g.choice === 'pas-10')
      couples.push(`- Plein ${g.scale} : le fond passe au pas 10 (${g.steps[10].name}, ${g.steps[10].value}) et le texte reste tel quel (${ver.text} sur ${ver.bg}, ${ratio}), choisi par le designer (carte ${g.title}). Les fonds sont dans REMPLACEMENTS ; ne change pas le texte.`);
    else if (g.choice === 'garder')
      couples.push(`- Plein ${g.scale} : le texte reste tel quel (${ver.text} sur ${ver.bg}, ${ratio}, sous ${String(ver.threshold).replace('.', ',')}:1), gardé par le designer (carte ${g.title}). Ne change pas le texte.`);
    else if (!g.choice) couples.push(`- Plein ${g.scale} : en attente du designer (carte ${g.title}) : ne change ni le texte ni le fond ; les lignes de fond sont dans NE TOUCHE PAS.`);
  }
  lines.push(`COUPLAGES (${couples.length})`);
  lines.push(...couples);
  if (!couples.length) lines.push('- Aucun.');
  lines.push('');
  lines.push('CHANGE AUSSI');
  const links = d.exceptions.links;
  lines.push(`- Souligne tout lien posé dans du texte courant : ${links.length} trouvé${links.length > 1 ? 's' : ''} ici${links.length ? ` (${links.flatMap((/** @type {any} */ l) => l.selectors).join(', ')})` : ''}.`);
  const msgs = d.exceptions.messages;
  lines.push(
    `- Relie chaque message à son champ par aria-describedby (id du message dans l’attribut aria-describedby du champ) : ${msgs.length} trouvé${msgs.length > 1 ? 's' : ''} ici${msgs.length ? ` (${msgs.map((/** @type {any} */ x) => `${x.message} → ${x.field}`).join(', ')})` : ''}.`,
  );
  lines.push('');
  lines.push('NE TOUCHE PAS');
  for (const r of s.outOfTable) lines.push(`- Hors table : ${r.value} (${r.usage}), ${r.reason}.`);
  for (const r of s.refused) lines.push(`- Refusée : ${r.value} (${r.usage}), le designer garde la valeur.`);
  // Lot R, R-2 : décisions en attente, avec leur identifiant et leur titre.
  // Lot I (I4) : un commentaire CSS marque la déclaration en attente.
  for (const r of s.pending) lines.push(`- ${r.id} ${r.title}. Pas encore choisie par le designer : ne l'applique pas (${r.value}, ${r.usage}). Ajoute au-dessus de la déclaration le commentaire /* ds-lab : en attente du designer, ${r.value} ${r.usage}${relationShort(r)} (${r.id}, ${m.stamp}) */.${pleinNote(r)}${relationOf(r)}${r.reason ? ` Motif : ${r.reason}.` : ''}${m6Text(r)} Sélecteurs : ${r.selectors.join(', ') || '—'}${cutNote(r)}.`);
  for (const sel of d.thirdParty) lines.push(`- Composant tiers : ${sel} et tout ce qu'il contient.`);
  lines.push('- Toute valeur absente de cette consigne.');
  lines.push('');
  lines.push('SIGNALE SANS MODIFIER');
  // Lot I (I5) : une valeur hors tranche et inchangée est rattachée, et reste signalée.
  /** @param {any} x */
  const isAttached = (x) => s.attached.some((r) => r.family === 'colors' && r.value === x.value && r.usage === x.usage);
  // Lot K (retouche) : une valeur traitée par REMPLACEMENTS n'est pas aussi à signaler sans modifier.
  /** @param {any} x */
  const isReplaced = (x) => replaceable.some((/** @type {any} */ r) => r.family === 'colors' && r.value === x.value && r.usage === x.usage);
  for (const x of d.exceptions.outOfSlice.filter((/** @type {any} */ x) => !isReplaced(x)))
    lines.push(`- Valeur hors de sa tranche : ${x.value} (${x.name}) en ${x.usage}, ${x.elements} élément(s), tranche attendue ${x.expected} : ${x.selectors.join(', ')}${isAttached(x) ? " ; rattaché, rôle à revoir à l'étape 3" : ''}.`);
  for (const st of d.exceptions.states) lines.push(`- État non lu : ${st.value} (${[...new Set(st.contexts.map((/** @type {any} */ c) => `${c.state} ${c.property}`))].join(', ')}).`);
  for (const r of d.exceptions.ties.filter((/** @type {any} */ r) => !replaceable.some((/** @type {any} */ x) => x.id === r.id))) lines.push(`- Égalité tranchée en silence : ${r.value} (${r.usage}) entre ${r.tie[0]} et ${r.tie[1]}, rangée vers ${r.new}.`);
  lines.push("- Élément injecté après le chargement : non mesuré ; signale-le si tu en trouves.");
  lines.push('');
  lines.push('VÉRIFICATION');
  lines.push(`Relance : ${m.command ?? 'npm run reduce (mêmes options)'}`);
  lines.push('Après modification du CSS, relance reduce sur les pages de la table et sur les pages témoins, et compare au prévu ; signale tout écart avant la mise en ligne.');
  lines.push('Chaque ligne traitée doit ressortir « inchangé » dans la nouvelle table. Les déclarations de CONFLITS et les unités relatives laissées ressortent telles quelles : c’est attendu.');
  // Lot I (I6).
  lines.push('Chaque variable écrite est déclarée dans tokens.css.');
  lines.push('Retire le repli quand toutes les pages sont migrées, pas avant.');
  lines.push(
    `Il ne doit rester ${d.remaining.length === 1 ? 'qu’une paire' : `que ${d.remaining.length} paires`} de texte sous 4,5:1 : ${d.remaining.map((/** @type {any} */ p) => `${p.text} sur ${p.bg} (${String(p.ratio).replace('.', ',')}:1)${p.note ? `, sous ${String(p.threshold).replace('.', ',')}:1, ${p.note}` : ''}`).join(' ; ') || 'aucune'}.`,
  );
  const markdown = ['## Consigne pour un agent', '', 'À copier telle quelle.', '', '```text', ...lines, '```', ''].join('\n');
  return { markdown, replacements: replaceable.length, lines };
}
