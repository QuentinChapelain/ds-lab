// @ts-check
/**
 * Lot M : migration.md, écrit par reduce à chaque réduction, lu par le
 * développeur sans l'outil. Une table valeur × usage → jeton DTCG, classe,
 * origine CSS, éléments ; trois sections (appliqué, décisions en attente, hors
 * table avec motif) ; des exceptions nommées. Les données structurées sont
 * renvoyées avec le texte, pour les tests.
 */
import { basename } from 'node:path';
import { APPLIED, isOut, SLICES, rowKey } from '../reduce/propose.js';
import { contrastRatio, isOpaque, toLab, deltaE } from '../lib/color.js';

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
  if (name) {
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
/** Lot R, R-2 : sélecteurs d'exemple, gardés en détail. @param {{ selectors: string[] }} r */
const selectorsOf = (r) => r.selectors.map((x) => `\`${cell(x)}\``).join(', ') || '—';
/** @param {number} n */
const fr = (n) => String(n).replace('.', ',');

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
export function buildMigration({ table, rendered, map, target, tokens, decisions = {}, meta }) {
  const idx = tokens ? indexTokens(tokens) : null;
  /** @param {string} family @param {string | null} value @param {{ name?: string | null, pleinScales?: Set<string> }} [ctx] */
  const token = (family, value, ctx) => (value === null ? '—' : idx?.find(family, value, ctx) ?? 'jeton absent');
  const T = (target.colors ?? []).map((/** @type {any} */ c) => ({ name: c.name, value: c.value.toLowerCase(), lab: toLab(c.value.toLowerCase()) }));
  /** Échelle d'un plein (pas 9-10 le plus proche), ou null. @param {string} hex */
  const scaleOf = (hex) => {
    if (!T.length || !isOpaque(hex)) return null;
    const lab = toLab(hex);
    const best = T.map((/** @type {any} */ t) => ({ t, d: deltaE(lab, t.lab) })).sort((/** @type {any} */ a, /** @type {any} */ b) => a.d - b.d)[0];
    const m = /^(.+)-(\d+)$/.exec(best.t.name ?? '');
    return m && Number(m[2]) >= 9 && Number(m[2]) <= 10 ? m[1] : null;
  };
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
  const decisionOf = (family, r) => {
    const k = rowKey(family, r);
    return k in decisions ? decisions[k] : decisions[`${family}|${r.old}`];
  };
  /** @param {string} hex */
  const valiseName = (hex) => T.find((/** @type {any} */ t) => t.value === hex.toLowerCase())?.name ?? null;

  /** @type {any[]} */
  const rows = [];
  for (const [family, f] of Object.entries(table.families))
    for (const r of f.rows) {
      const d = decisionOf(family, r);
      // Statut après décisions : une chaîne décide (la ligne est appliquée), false refuse.
      const status =
        r.class === 'inchangé' && d !== false
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
        token: token(family, next, family === 'colors' ? { name, pleinScales: r.usage === 'texte' ? pleinScalesOf(r.old) : new Set() } : undefined),
        new: next,
        status,
        decision: d ?? null,
        properties: r.properties ?? [],
        selectors: r.selectors ?? [],
        class: r.class,
        origin: originOf(rendered, family, r),
        elements: r.count,
        reason: r.reason ?? (r.class === 'hors table' ? OUT_REASON : null),
        candidates: r.candidates ?? [],
        contrast: r.contrast ?? null,
        tie: r.candidates?.length > 1 && r.candidates[0].delta > 0 && r.candidates[0].delta === r.candidates[1].delta ? [r.candidates[0].value, r.candidates[1].value] : null,
      });
    }
  const applied = rows.filter((r) => r.status === 'appliquée' || r.status === 'décidée');
  const pending = rows.filter((r) => r.status === 'en attente');
  const refused = rows.filter((r) => r.status === 'refusée');
  const outOfTable = rows.filter((r) => r.status === 'hors table');
  /** @param {any[]} list */
  const byFamily = (list) => Object.fromEntries(Object.keys(table.families).map((f) => [f, list.filter((r) => r.family === f).length]));

  // Exceptions nommées.
  const links = (rendered.usages?.links ?? []).map((/** @type {any} */ l) => ({ ...l }));
  const onSolidMap = target.onSolid ?? {};
  /** @type {any[]} */
  const onSolid = [];
  for (const p of rendered.usages?.pairs ?? []) {
    if (p.bgUsage !== 'plein') continue;
    const text = mapped(map, p.text, 'texte');
    const bg = mapped(map, p.bg, 'plein');
    const ratio = contrastRatio(text, bg);
    const scale = scaleOf(bg);
    if (ratio >= p.threshold || !scale || !onSolidMap[scale]) continue;
    const seen = (rendered.contrast?.pairs ?? []).find((/** @type {any} */ x) => x.text === p.text && x.bg === p.bg);
    // Une entrée par paire après la table : plusieurs fonds d'origine peuvent aller au même pas.
    let o = onSolid.find((x) => x.text === text && x.bg === bg);
    if (!o) {
      o = {
        text, bg, before: { text: p.text, bg: p.bg }, befores: [], ratio: Math.round(ratio * 10000) / 10000, threshold: p.threshold, scale, onSolid: onSolidMap[scale], n: 0,
        selectors: [],
        token: idx?.find('colors', onSolidMap[scale], { pleinScales: new Set([scale]) }) ?? null,
      };
      onSolid.push(o);
    }
    o.n += p.n;
    if (!o.befores.some((/** @type {any} */ b) => b.bg === p.bg && b.text === p.text)) o.befores.push({ text: p.text, bg: p.bg });
    for (const sel of seen?.selectors ?? []) if (!o.selectors.includes(sel)) o.selectors.push(sel);
  }
  // Paires encore sous leur seuil une fois la table posée, hors celles que le couplage onSolid répare.
  /** @type {Map<string, { text: string, bg: string, ratio: number, threshold: number, n: number }>} */
  const remaining = new Map();
  for (const p of rendered.usages?.pairs ?? []) {
    const text = mapped(map, p.text, 'texte');
    const bg = mapped(map, p.bg, p.bgUsage);
    const ratio = contrastRatio(text, bg);
    if (ratio >= p.threshold || onSolid.some((o) => o.text === text && o.bg === bg)) continue;
    const k = `${text}|${bg}`;
    const x = remaining.get(k) ?? { text, bg, ratio: Math.round(ratio * 10000) / 10000, threshold: p.threshold, n: 0 };
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
    sections: {
      applied: { total: applied.length, ...byFamily(applied) },
      pending: { total: pending.length, ...byFamily(pending) },
      refused: { total: refused.length, ...byFamily(refused) },
      outOfTable: { total: outOfTable.length, ...byFamily(outOfTable) },
    },
    unchanged: rows.filter((r) => r.status === 'inchangé').length,
    decided: rows.filter((r) => r.status === 'décidée').length,
    exceptions: { links, onSolid, states, injected: null, ties, outOfSlice },
    remaining: [...remaining.values()],
    thirdParty: table.thirdParty ?? [],
  };
  const agent = agentBrief(data, { applied, pending, refused, outOfTable });
  return { data: { ...data, agent }, markdown: renderMarkdown(data, { applied, pending, refused, outOfTable }) + '\n' + agent.markdown };
}

/**
 * @param {any} d
 * @param {{ applied: any[], pending: any[], refused: any[], outOfTable: any[] }} s
 */
function renderMarkdown(d, s) {
  const m = d.meta;
  const L = [];
  L.push(`# Migration : ${m.host}`, '');
  L.push(`Réduction du ${m.stamp}, fenêtre ${m.viewport.width}×${m.viewport.height}, cible \`${m.target}\`, jetons \`${m.tokens ?? 'aucun fichier de jetons (--tokens)'}\`.`);
  L.push(`Pages : ${m.pages.map((/** @type {string} */ p) => `\`${p}\``).join(', ')}.`, '');
  L.push('Ce document se lit sans l’outil. Chaque ligne range une valeur relevée dans le rendu, pour un usage, sur un jeton de la cible.');
  L.push('« Origine CSS » donne la règle d’un élément d’exemple (fichier:ligne de la règle) ; « non tracé » quand elle n’a pas pu être lue (fond de page, pseudo-élément).', '');
  L.push('| section | lignes | couleurs | espacements | tailles | rayons |', '|---|---|---|---|---|---|');
  if (m.decisions) L.push(`Décisions lues : \`${m.decisions}\`, ${d.decided} décidée(s), ${d.sections.refused.total} refusée(s).`, '');
  for (const [k, label] of [['applied', 'Appliqué (auto, proche, correction, décidée)'], ['pending', 'Décisions en attente'], ['refused', 'Refusée, laissée telle quelle'], ['outOfTable', 'Hors table']]) {
    const x = d.sections[k];
    L.push(`| ${label} | ${x.total} | ${x.colors ?? 0} | ${x.spacing ?? 0} | ${x.fontSizes ?? 0} | ${x.radii ?? 0} |`);
  }
  L.push(`| Inchangé | ${d.unchanged} | | | | |`, '');

  L.push('## Table', '', 'Chaque ligne commence par son identifiant et son titre, les mêmes que dans table.json, revue.html et la barre --live.', '');
  L.push('| ligne | famille | valeur | usage | jeton | classe | origine CSS | éléments |', '|---|---|---|---|---|---|---|---|');
  for (const r of d.rows)
    L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family] ?? r.family} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === '—' || r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | ${cell(classLabel(r))} | ${cell(r.origin)} | ${r.elements} |`);
  L.push('');

  L.push(`## Appliqué (auto, proche, correction, décidée) : ${s.applied.length}`, '', 'La table pose ces remplacements. Une correction (R9) répare un contraste ; elle reste annulable. Une ligne « décidée » porte la valeur choisie par le designer.', '');
  L.push('| ligne | famille | valeur | usage | → jeton | valeur cible | classe | motif | sélecteurs |', '|---|---|---|---|---|---|---|---|---|');
  for (const r of s.applied)
    L.push(
      `| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | \`${cell(r.new)}\` | ${cell(classLabel(r))} | ${r.status === 'décidée' ? 'décidée' : cell(r.reason ?? '')}${r.contrast && r.status !== 'décidée' ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)}` : ''} | ${selectorsOf(r)} |`,
    );
  L.push('');

  L.push(`## Décisions en attente : ${s.pending.length}`, '', 'Rien n’est appliqué tant que le designer n’a pas répondu (R5). Les candidats sont rangés du plus proche au plus loin.', '');
  L.push('| ligne | famille | valeur | usage | proposé | candidats | motif | sélecteurs |', '|---|---|---|---|---|---|---|---|');
  for (const r of s.pending)
    L.push(
      `| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} (\`${cell(r.new)}\`) | ${r.candidates.map((/** @type {any} */ c) => `\`${cell(c.value)}\` (${fr(c.delta)})`).join(', ')} | ${cell(r.reason ?? 'écart au-delà des seuils')}${r.contrast ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)} si appliquée` : ''} | ${selectorsOf(r)} |`,
    );
  L.push('');

  L.push(`## Refusée, laissée telle quelle : ${s.refused.length}`, '', 'Le designer a refusé le changement : la valeur reste.', '');
  L.push('| ligne | famille | valeur | usage | proposé | classe | éléments |', '|---|---|---|---|---|---|---|');
  for (const r of s.refused) L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.candidates[0] ? `\`${cell(r.candidates[0].value)}\`` : '—'} | ${cell(r.class)} | ${r.elements} |`);
  if (!s.refused.length) L.push('| — | | | | | | |');
  L.push('');

  L.push(`## Hors table : ${s.outOfTable.length}`, '', 'Laissées telles quelles, avec leur motif.', '');
  L.push('| ligne | famille | valeur | usage | motif | éléments |', '|---|---|---|---|---|---|');
  for (const r of s.outOfTable) L.push(`| ${line(r)} | ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.reason)} | ${r.elements} |`);
  L.push('');

  const e = d.exceptions;
  L.push('## Exceptions', '');
  L.push(`### Liens sans soulignement dans un paragraphe : ${e.links.length}`, '');
  L.push('Un lien posé dans du texte courant sans soulignement ne se distingue que par sa couleur : WCAG demande alors 3:1 avec le texte voisin et un autre signal au survol et au focus.', '');
  for (const l of e.links) L.push(`- \`${l.color}\` dans un texte \`${l.neighbor}\` : ${fr(l.ratio)}:1 (${l.n} lien(s) : ${l.selectors.map((/** @type {string} */ x) => `\`${x}\``).join(', ')}).`);
  if (!e.links.length) L.push('- Aucun.');
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

/** Variable CSS d'un jeton DTCG (points en tirets). @param {string} token */
const cssVar = (token) => `var(--${token.replace(/\./g, '-')})`;

/**
 * Lot M : « Consigne pour un agent », à l'impératif, copiable telle quelle.
 * @param {any} d @param {{ applied: any[], pending: any[], refused: any[], outOfTable: any[] }} s
 */
function agentBrief(d, s) {
  const m = d.meta;
  /** @param {any} r */
  const write = (r) => (r.token && r.token !== 'jeton absent' && r.token !== '—' ? `${cssVar(r.token)} (${r.new})` : `${r.new} (jeton absent : écris la valeur)`);
  const lines = [];
  lines.push('CONTEXTE');
  lines.push(`Tu migres les feuilles CSS des pages ${m.pages.join(', ')} vers les jetons ${m.tokens ?? '(aucun fichier de jetons)'} de la cible ${m.target}.`);
  lines.push('Écris chaque jeton sous la forme var(--couleur-neutre-11) (chemin du jeton, points remplacés par des tirets) ; si la ligne dit « jeton absent », écris la valeur hex ou px indiquée.');
  lines.push('Les valeurs ci-dessous sont des valeurs calculées : dans la source, elles peuvent être écrites autrement (rem, em, rgb(), mot-clé) ; cherche leur équivalent.');
  lines.push('');
  lines.push(`REMPLACEMENTS (${s.applied.length})`);
  lines.push(
    `0. Crée tokens.css, qui déclare dans :root chaque variable utilisée ci-dessous avec sa valeur, à partir de ${m.tokens ?? 'primitives.tokens.json'}, et charge-la avant toutes les autres feuilles.`,
  );
  s.applied.forEach((r, i) => {
    lines.push(
      `${i + 1}. ${r.id} ${r.title}. Propriété ${propertyOf(r.family, r.properties)}, usage ${r.usage} : remplace ${r.value} par ${write(r)}${r.status === 'décidée' ? ' [décidée]' : ''}. Sélecteurs : ${r.selectors.join(', ') || '—'}. Point de départ : ${r.origin}. Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.`,
    );
  });
  lines.push('');
  lines.push(`COUPLAGES (${d.exceptions.onSolid.length})`);
  for (const p of d.exceptions.onSolid)
    lines.push(
      `- Le texte posé sur un plein ${p.scale} devient ${p.onSolid} (onSolid${p.token ? `, ${cssVar(p.token)}` : ''}) : texte ${p.text} sur ${p.bg} après la table (fonds d'origine ${p.befores.map((/** @type {any} */ b) => b.bg).join(', ')}), ${String(p.ratio).replace('.', ',')}:1. Sélecteurs : ${p.selectors.join(', ') || '—'}.`,
    );
  if (!d.exceptions.onSolid.length) lines.push('- Aucun.');
  lines.push('');
  lines.push('CHANGE AUSSI');
  const links = d.exceptions.links;
  lines.push(`- Souligne tout lien posé dans du texte courant : ${links.length} trouvé${links.length > 1 ? 's' : ''} ici${links.length ? ` (${links.flatMap((/** @type {any} */ l) => l.selectors).join(', ')})` : ''}.`);
  lines.push('');
  lines.push('NE TOUCHE PAS');
  for (const r of s.outOfTable) lines.push(`- Hors table : ${r.value} (${r.usage}), ${r.reason}.`);
  for (const r of s.refused) lines.push(`- Refusée : ${r.value} (${r.usage}), le designer garde la valeur.`);
  // Lot R, R-2 : décisions en attente, avec leur identifiant et leur titre.
  for (const r of s.pending) lines.push(`- ${r.id} ${r.title}. Pas encore choisie par le designer : ne l'applique pas (${r.value}, ${r.usage}). Sélecteurs : ${r.selectors.join(', ') || '—'}.`);
  for (const sel of d.thirdParty) lines.push(`- Composant tiers : ${sel} et tout ce qu'il contient.`);
  lines.push('- Toute valeur absente de cette consigne.');
  lines.push('');
  lines.push('SIGNALE SANS MODIFIER');
  for (const x of d.exceptions.outOfSlice) lines.push(`- Valeur hors de sa tranche : ${x.value} (${x.name}) en ${x.usage}, ${x.elements} élément(s), tranche attendue ${x.expected} : ${x.selectors.join(', ')}.`);
  for (const st of d.exceptions.states) lines.push(`- État non lu : ${st.value} (${[...new Set(st.contexts.map((/** @type {any} */ c) => `${c.state} ${c.property}`))].join(', ')}).`);
  for (const r of d.exceptions.ties) lines.push(`- Égalité tranchée en silence : ${r.value} (${r.usage}) entre ${r.tie[0]} et ${r.tie[1]}, rangée vers ${r.new}.`);
  lines.push("- Élément injecté après le chargement : non mesuré ; signale-le si tu en trouves.");
  lines.push('');
  lines.push('VÉRIFICATION');
  lines.push(`Relance : ${m.command ?? 'npm run reduce (mêmes options)'}`);
  lines.push('Après modification du CSS, relance reduce sur les pages de la table et sur les pages témoins, et compare au prévu ; signale tout écart avant la mise en ligne.');
  lines.push('Chaque ligne traitée doit ressortir « inchangé » dans la nouvelle table.');
  lines.push(
    `Il ne doit rester ${d.remaining.length === 1 ? 'qu’une paire' : `que ${d.remaining.length} paires`} de texte sous 4,5:1 : ${d.remaining.map((/** @type {any} */ p) => `${p.text} sur ${p.bg} (${String(p.ratio).replace('.', ',')}:1)`).join(' ; ') || 'aucune'}.`,
  );
  const markdown = ['## Consigne pour un agent', '', 'À copier telle quelle.', '', '```text', ...lines, '```', ''].join('\n');
  return { markdown, replacements: s.applied.length, lines };
}
