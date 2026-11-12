// @ts-check
/**
 * Lot M : migration.md, écrit par reduce à chaque réduction, lu par le
 * développeur sans l'outil. Une table valeur × usage → jeton DTCG, classe,
 * origine CSS, éléments ; trois sections (appliqué, décisions en attente, hors
 * table avec motif) ; des exceptions nommées. Les données structurées sont
 * renvoyées avec le texte, pour les tests.
 */
import { basename } from 'node:path';
import { APPLIED, isOut } from '../reduce/propose.js';
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

/**
 * Index des jetons DTCG : couleur par hex, dimension par groupe et valeur en px.
 * @param {any} tokens  contenu d'un fichier .tokens.json (DTCG 2025.10)
 */
export function indexTokens(tokens) {
  /** @type {Map<string, string>} */
  const colors = new Map();
  /** @type {Map<string, Map<string, string>>} */
  const dims = new Map();
  /** @param {any} node @param {string[]} path @param {string | undefined} type */
  const walk = (node, path, type) => {
    if (!node || typeof node !== 'object') return;
    const t = node.$type ?? type;
    if ('$value' in node) {
      const v = node.$value;
      if (t === 'color' && v?.hex) colors.set(String(v.hex).toLowerCase(), path.join('.'));
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
  /** @param {string} family @param {string | null} value */
  const find = (family, value) => {
    if (!value) return null;
    if (family === 'colors') return colors.get(value.toLowerCase()) ?? null;
    for (const g of DIM_GROUPS[family] ?? []) {
      const hit = dims.get(g)?.get(value);
      if (hit) return hit;
    }
    return null;
  };
  return { find, size: colors.size + [...dims.values()].reduce((t, g) => t + g.size, 0) };
}

/** @param {unknown} s */
const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
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
 * @param {{ host: string, stamp: string, target: string, tokens: string | null, pages: string[], viewport: { width: number, height: number } }} o.meta
 */
export function buildMigration({ table, rendered, map, target, tokens, meta }) {
  const idx = tokens ? indexTokens(tokens) : null;
  /** @param {string} family @param {string | null} value */
  const token = (family, value) => (value === null ? '—' : idx?.find(family, value) ?? 'jeton absent');

  /** @type {any[]} */
  const rows = [];
  for (const [family, f] of Object.entries(table.families))
    for (const r of f.rows) {
      const shown = isOut(r.class) ? null : r.new ?? r.old;
      rows.push({
        family,
        value: r.old,
        usage: r.usage ?? (r.usages ?? []).join(', '),
        token: token(family, shown),
        new: isOut(r.class) ? null : r.new,
        class: r.class,
        origin: originOf(rendered, family, r),
        elements: r.count,
        reason: r.reason ?? (r.class === 'hors table' ? OUT_REASON : null),
        candidates: r.candidates ?? [],
        contrast: r.contrast ?? null,
        tie: r.candidates?.length > 1 && r.candidates[0].delta > 0 && r.candidates[0].delta === r.candidates[1].delta ? [r.candidates[0].value, r.candidates[1].value] : null,
      });
    }
  const applied = rows.filter((r) => APPLIED.has(r.class) && r.class !== 'inchangé');
  const pending = rows.filter((r) => r.class === 'décision');
  const outOfTable = rows.filter((r) => isOut(r.class));
  /** @param {any[]} list */
  const byFamily = (list) => Object.fromEntries(Object.keys(table.families).map((f) => [f, list.filter((r) => r.family === f).length]));

  // Exceptions nommées.
  const links = (rendered.usages?.links ?? []).map((/** @type {any} */ l) => ({ ...l }));
  const onSolidMap = target.onSolid ?? {};
  const T = (target.colors ?? []).map((/** @type {any} */ c) => ({ name: c.name, value: c.value.toLowerCase(), lab: toLab(c.value.toLowerCase()) }));
  /** @param {string} hex */
  const scaleOf = (hex) => {
    if (!T.length || !isOpaque(hex)) return null;
    const lab = toLab(hex);
    const best = T.map((/** @type {any} */ t) => ({ t, d: deltaE(lab, t.lab) })).sort((/** @type {any} */ a, /** @type {any} */ b) => a.d - b.d)[0];
    const m = /^(.+)-(\d+)$/.exec(best.t.name ?? '');
    return m && Number(m[2]) >= 9 && Number(m[2]) <= 10 ? m[1] : null;
  };
  /** @type {any[]} */
  const onSolid = [];
  for (const p of rendered.usages?.pairs ?? []) {
    if (p.bgUsage !== 'plein') continue;
    const text = mapped(map, p.text, 'texte');
    const bg = mapped(map, p.bg, 'plein');
    const ratio = contrastRatio(text, bg);
    const scale = scaleOf(bg);
    if (ratio >= p.threshold || !scale || !onSolidMap[scale]) continue;
    onSolid.push({ text, bg, before: { text: p.text, bg: p.bg }, ratio: Math.round(ratio * 10000) / 10000, threshold: p.threshold, scale, onSolid: onSolidMap[scale], n: p.n });
  }
  const states = (rendered.states?.onlyInStates ?? []).map((/** @type {string} */ hex) => {
    const v = rendered.states.colors[hex];
    return { value: hex, contexts: v.contexts.map((/** @type {any} */ c) => ({ state: c.state, property: c.property, role: c.role, selectors: c.selectors })) };
  });
  const ties = rows.filter((r) => r.tie && APPLIED.has(r.class) && r.class !== 'inchangé');

  const data = {
    meta,
    rows,
    sections: {
      applied: { total: applied.length, ...byFamily(applied) },
      pending: { total: pending.length, ...byFamily(pending) },
      outOfTable: { total: outOfTable.length, ...byFamily(outOfTable) },
    },
    unchanged: rows.filter((r) => r.class === 'inchangé').length,
    exceptions: { links, onSolid, states, injected: null, ties },
  };
  return { data, markdown: renderMarkdown(data, { applied, pending, outOfTable }) };
}

/**
 * @param {any} d
 * @param {{ applied: any[], pending: any[], outOfTable: any[] }} s
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
  for (const [k, label] of [['applied', 'Appliqué (auto, proche, correction)'], ['pending', 'Décisions en attente'], ['outOfTable', 'Hors table']]) {
    const x = d.sections[k];
    L.push(`| ${label} | ${x.total} | ${x.colors ?? 0} | ${x.spacing ?? 0} | ${x.fontSizes ?? 0} | ${x.radii ?? 0} |`);
  }
  L.push(`| Inchangé | ${d.unchanged} | | | | |`, '');

  L.push('## Table', '', '| famille | valeur | usage | jeton | classe | origine CSS | éléments |', '|---|---|---|---|---|---|---|');
  for (const r of d.rows) L.push(`| ${FAMILY_LABELS[r.family] ?? r.family} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === '—' || r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | ${cell(r.class)} | ${cell(r.origin)} | ${r.elements} |`);
  L.push('');

  L.push(`## Appliqué (auto, proche, correction) : ${s.applied.length}`, '', 'La table pose ces remplacements. Une correction (R9) répare un contraste ; elle reste annulable.', '');
  L.push('| famille | valeur | usage | → jeton | valeur cible | classe | motif |', '|---|---|---|---|---|---|---|');
  for (const r of s.applied)
    L.push(`| ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} | \`${cell(r.new)}\` | ${r.class} | ${cell(r.reason ?? '')}${r.contrast ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)}` : ''} |`);
  L.push('');

  L.push(`## Décisions en attente : ${s.pending.length}`, '', 'Rien n’est appliqué tant que le designer n’a pas répondu (R5). Les candidats sont rangés du plus proche au plus loin.', '');
  L.push('| famille | valeur | usage | proposé | candidats | motif |', '|---|---|---|---|---|---|');
  for (const r of s.pending)
    L.push(
      `| ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${r.token === 'jeton absent' ? r.token : `\`${r.token}\``} (\`${cell(r.new)}\`) | ${r.candidates.map((/** @type {any} */ c) => `\`${cell(c.value)}\` (${fr(c.delta)})`).join(', ')} | ${cell(r.reason ?? 'écart au-delà des seuils')}${r.contrast ? ` contraste ${fr(r.contrast.before)} → ${fr(r.contrast.after)} si appliquée` : ''} |`,
    );
  L.push('');

  L.push(`## Hors table : ${s.outOfTable.length}`, '', 'Laissées telles quelles, avec leur motif.', '');
  L.push('| famille | valeur | usage | motif | éléments |', '|---|---|---|---|---|');
  for (const r of s.outOfTable) L.push(`| ${FAMILY_LABELS[r.family]} | \`${cell(r.value)}\` | ${cell(r.usage)} | ${cell(r.reason)} | ${r.elements} |`);
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
  return L.join('\n');
}
