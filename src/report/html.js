// @ts-check
/**
 * Page visuelle de l'audit (rapport.html), à partir de l'objet écrit dans
 * audit.json. Elle montre ce que le rapport Markdown énumère : chaque couleur
 * en pastille avec ses usages, les couleurs d'état, les paires texte-fond dans
 * leurs vraies couleurs, les tailles à leur taille, les rayons et les ombres.
 * Un seul fichier, sans dépendance ni requête réseau. Toute chaîne venue de la
 * page auditée est échappée ; une valeur n'entre dans un attribut style que si
 * elle a la forme attendue.
 */
import { LIMITS } from './differences.js';
import { contrastRatio, isOpaque, blend } from '../lib/color.js';

/** @param {unknown} s */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** @param {string} hex */
const safeHex = (hex) => (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex) ? hex : '#ffffff');
/** @param {string} key  clé « 12px » */
const safePx = (key) => {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(key);
  return m ? Number(m[1]) : null;
};

const PROPERTY_LABELS = /** @type {[RegExp, string][]} */ ([
  [/^color$/, 'texte'],
  [/^background-color$/, 'fond'],
  [/^border-.*-color$/, 'bordure'],
  [/^outline-color$/, 'contour'],
  [/^box-shadow$/, 'ombre'],
  [/^text-decoration-color$/, 'soulignement'],
  [/^background-image$/, 'dégradé'],
  [/^fill$/, 'remplissage SVG'],
  [/^stroke$/, 'trait SVG'],
]);
/** @param {string} property */
export const propertyLabel = (property) => PROPERTY_LABELS.find(([re]) => re.test(property))?.[1] ?? property;

const STATE_LABELS = /** @type {Record<string, string>} */ ({ hover: 'survol', focus: 'focus', active: 'appui' });

/** Texte lisible (noir ou blanc) sur une couleur opaque. @param {string} hex */
const inkOn = (hex) => {
  const base = isOpaque(hex) ? hex : blend(hex, '#ffffff');
  return contrastRatio('#111111', base) >= contrastRatio('#ffffff', base) ? '#111111' : '#ffffff';
};

/**
 * Usages d'une couleur : « texte ×12 (lien, titre) · fond ×3 (bouton) ».
 * @param {{ property: string, role: string, count: number }[]} contexts
 */
function usages(contexts) {
  /** @type {Map<string, { n: number, roles: Map<string, number> }>} */
  const by = new Map();
  for (const c of contexts) {
    const k = propertyLabel(c.property);
    const u = by.get(k) ?? { n: 0, roles: new Map() };
    u.n += c.count;
    u.roles.set(c.role, (u.roles.get(c.role) ?? 0) + c.count);
    by.set(k, u);
  }
  return [...by.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .map(([k, u]) => {
      const roles = [...u.roles.entries()].sort((a, b) => b[1] - a[1]).map(([r]) => r);
      return `<span class="usage"><b>${esc(k)}</b> ×${u.n} <i>${esc(roles.join(', '))}</i></span>`;
    })
    .join('');
}

/** @param {string[]} selectors */
const selectorList = (selectors) => selectors.map((s) => `<code>${esc(s)}</code>`).join(' ');

/**
 * @param {string} hex
 * @param {any} v  valeur rendue (count, pseudo, contexts)
 */
function swatch(hex, v) {
  const h = safeHex(hex);
  // R18 : la pastille d'interface ne montre que les usages d'interface.
  const contexts = v.contexts
    .map((/** @type {any} */ c) => ({ ...c, count: c.count - (c.content ?? 0) }))
    .filter((/** @type {any} */ c) => c.count > 0);
  v = { ...v, count: v.count - (v.content ?? 0), contexts };
  const examples = [...new Set(v.contexts.flatMap((/** @type {any} */ c) => c.selectors))].slice(0, 4);
  const iconOnly = v.pseudo > 0 && v.pseudo >= v.count;
  return `<div class="swatch">
  <div class="chip${isOpaque(h) ? '' : ' damier'}"><span style="background:${h};color:${inkOn(h)}">${esc(hex)}</span></div>
  <div class="meta"><div class="count">×${v.count}${iconOnly ? ' <em class="tag">pseudo-élément seulement</em>' : v.pseudo ? ` <em class="tag">dont ${v.pseudo} en pseudo-élément</em>` : ''}</div>
  <div class="usages">${usages(v.contexts)}</div>
  <div class="examples">${selectorList(examples)}</div></div>
</div>`;
}

/**
 * @param {any} audit  contenu de audit.json
 * @returns {string}
 */
export function renderHtml(audit) {
  const { meta, pages, rendered, declared } = audit;
  const R = rendered.families;
  const colors = R.colors;
  /** @type {string[]} */
  const out = [];
  const push = (/** @type {string} */ s) => out.push(s);

  // --- Couleurs d'interface, par groupe (liaison complète, ΔE < 5), puis rares, puis contenu (R18).
  const RARE = 2;
  const uses = (/** @type {string} */ h) => colors.values[h].count - (colors.values[h].content ?? 0);
  const groups = colors.groupsInterfaceDE5 ?? colors.groupsCompleteDE5 ?? [];
  const isRare = (/** @type {any} */ g) => g.n <= RARE;
  const translucentAll = Object.keys(colors.values).filter((h) => !isOpaque(h) && uses(h) > 0);
  const translucent = translucentAll.filter((h) => uses(h) > RARE);
  const rare = [...groups.filter(isRare).flatMap((/** @type {any} */ g) => g.members), ...translucentAll.filter((h) => uses(h) <= RARE)];
  const contentColors = Object.entries(colors.values)
    .filter(([, v]) => (/** @type {any} */ (v).content ?? 0) > 0)
    .sort((a, b) => /** @type {any} */ (b[1]).content - /** @type {any} */ (a[1]).content);
  const groupHtml = groups
    .filter((/** @type {any} */ g) => !isRare(g))
    .map((/** @type {any} */ g) => {
      const members = g.members.map((/** @type {string} */ m) => swatch(m, colors.values[m])).join('');
      const head =
        g.members.length > 1
          ? `<h3>${g.members.length} couleurs proches <small>écart maximal ΔE ${g.diameter.toFixed(1)} · ×${g.n}</small></h3>`
          : '';
      return `<section class="group${g.members.length > 1 ? ' multi' : ''}">${head}${members}</section>`;
    })
    .join('\n');
  const mini = (/** @type {string} */ hex, /** @type {number} */ n, /** @type {string} */ note) => {
    const h = safeHex(hex);
    return `<span class="mini${isOpaque(h) ? '' : ' damier'}" title="${esc(note)}"><span style="background:${h};color:${inkOn(h)}">${esc(hex)} ×${n}</span></span>`;
  };
  const rareHtml = rare
    .map((h) => mini(h, uses(h), [...new Set(colors.values[h].contexts.flatMap((/** @type {any} */ c) => c.selectors))].slice(0, 3).join(' ')))
    .join('');
  const contentHtml = contentColors
    .map(([hex, v]) => {
      const x = /** @type {any} */ (v);
      const kinds = [...new Set(x.contexts.filter((/** @type {any} */ c) => c.content > 0).map((/** @type {any} */ c) => (c.property === 'background-color' ? 'fond d’image' : 'SVG')))].join(', ');
      return mini(hex, x.content, kinds);
    })
    .join('');
  const interfaceCount = colors.distinctInterface ?? colors.distinct;

  // --- États.
  const S = rendered.states ?? { sampled: 0, colors: {}, onlyInStates: [] };
  const stateRows = Object.entries(S.colors)
    .map(([hex, v]) => {
      const x = /** @type {any} */ (v);
      const h = safeHex(hex);
      const ctx = x.contexts
        .map(
          (/** @type {any} */ c) =>
            `<span class="usage"><b>${esc(STATE_LABELS[c.state] ?? c.state)}</b> ${esc(propertyLabel(c.property))} ×${c.count} <i>${esc(c.role)}</i> ${selectorList(c.selectors)}</span>`,
        )
        .join('');
      return `<div class="swatch"><div class="chip"><span style="background:${h};color:${inkOn(h)}">${esc(hex)}</span></div>
  <div class="meta"><div class="count">${x.newToRender ? '<em class="tag fort">absente au repos</em>' : '<em class="tag">existe aussi au repos, ailleurs</em>'}</div><div class="usages">${ctx}</div></div></div>`;
    })
    .join('\n');

  // --- Paires texte-fond.
  const pairs = rendered.contrast.pairs.slice(0, 80);
  const pairHtml = pairs
    .map((/** @type {any} */ p) => {
      const fg = safeHex(p.text);
      const bg = safeHex(p.bg);
      const fail = p.belowAA > 0;
      const reasons = Object.entries(p.uncertain?.reasons ?? {})
        .filter(([, n]) => n)
        .map(([k]) => ({ opacity: 'opacité', backgroundImage: 'image de fond', overlap: 'posé sur une image ou un bloc' })[k] ?? k)
        .join(', ');
      const onlyIcons = p.nIcon > 0 && p.nIcon === p.n;
      return `<div class="pair">
  <div class="sample" style="background:${bg};color:${fg}">${onlyIcons ? '★ icône' : 'Aa Texte'}</div>
  <div class="meta"><div><b>${p.ratio.toFixed(2)} : 1</b> <span class="badge ${fail ? 'ko' : 'ok'}">${fail ? `sous le seuil ×${p.belowAA}` : onlyIcons ? '3:1 atteint' : 'AA'}</span>${p.nIcon ? ` <em class="tag">${onlyIcons ? 'icône, seuil 3:1' : `dont ${p.nIcon} icône(s), seuil 3:1`}</em>` : ''}${p.flag ? ` <span class="badge v">à vérifier : ${esc(reasons)}</span>` : ''}</div>
  <div class="hexes"><code>${esc(p.text)}</code> sur <code>${esc(p.bg)}</code> · ×${p.n}</div>
  <div class="examples">${selectorList(p.selectors)}</div></div>
</div>`;
    })
    .join('\n');

  // --- Tailles de police.
  const sizes = Object.entries(R.fontSizes.values)
    .map(([k, v]) => ({ k, px: safePx(k), v: /** @type {any} */ (v) }))
    .filter((x) => x.px !== null)
    .sort((a, b) => /** @type {number} */ (a.px) - /** @type {number} */ (b.px));
  const maxCount = Math.max(1, ...sizes.map((x) => x.v.count));
  const sizeHtml = sizes
    .map((x) => {
      const roles = [...new Set(x.v.contexts.map((/** @type {any} */ c) => c.role))].join(', ');
      const shown = Math.min(/** @type {number} */ (x.px), 64);
      return `<div class="size"><div class="label"><b>${esc(x.k)}</b> ×${x.v.count}${x.v.pseudo === x.v.count ? ' <em class="tag">pseudo-élément seulement</em>' : ''}<br><i>${esc(roles)}</i>
  <div class="bar"><span style="width:${Math.round((100 * x.v.count) / maxCount)}%"></span></div></div>
  <div class="specimen" style="font-size:${shown}px">Texte</div></div>`;
    })
    .join('\n');

  /** @param {string} family @param {number} n */
  const topPx = (family, n) =>
    Object.entries(R[family]?.values ?? {})
      .map(([k, v]) => ({ k, px: safePx(k.split(' ')[0]), n: /** @type {any} */ (v).count }))
      .filter((x) => x.px !== null && /** @type {number} */ (x.px) >= 0)
      .slice(0, n)
      .sort((a, b) => /** @type {number} */ (a.px) - /** @type {number} */ (b.px));

  const spacing = [...topPx('paddings', 14), ...topPx('margins', 14), ...topPx('gaps', 8)];
  /** @type {Map<number, number>} */
  const spaceBy = new Map();
  for (const x of spacing) spaceBy.set(/** @type {number} */ (x.px), (spaceBy.get(/** @type {number} */ (x.px)) ?? 0) + x.n);
  const spaceHtml = [...spaceBy.entries()]
    .sort((a, b) => a[0] - b[0])
    .slice(0, 24)
    .map(([px, n]) => `<div class="space"><span style="width:${Math.min(px, 160)}px"></span><b>${px}px</b> ×${n}</div>`)
    .join('\n');

  const radiusHtml = topPx('radii', 12)
    .map((x) => `<div class="tile"><span style="border-radius:${Math.min(/** @type {number} */ (x.px), 40)}px"></span><b>${esc(x.k)}</b> ×${x.n}</div>`)
    .join('\n');

  const shadowHtml = Object.entries(R.shadows?.values ?? {})
    .slice(0, 12)
    .map(([k, v]) => {
      const ok = /^[0-9a-z#.,\s-]+$/.test(k);
      return `<div class="tile wide"><span${ok ? ` style="box-shadow:${k}"` : ''}></span><code>${esc(k)}</code> ×${/** @type {any} */ (v).count}</div>`;
    })
    .join('\n');

  const weightHtml = Object.entries(R.fontWeights.values)
    .map(([k, v]) => ({ k, n: /** @type {any} */ (v).count }))
    .sort((a, b) => Number(a.k) - Number(b.k))
    .map((x) => `<div class="weight"><span style="font-weight:${/^\d+$/.test(x.k) ? x.k : 400}">Texte</span><b>${esc(x.k)}</b> ×${x.n}</div>`)
    .join('\n');

  const tg = rendered.textGreys;
  const greyHtml = tg
    ? Object.entries(tg.values)
        .map(([hex, v]) => {
          const x = /** @type {any} */ (v);
          const h = safeHex(hex);
          const base = isOpaque(h) ? h : blend(h, '#ffffff');
          const onWhite = contrastRatio(base, '#ffffff');
          return `<div class="pair"><div class="sample" style="background:#ffffff;color:${h}">Aa Texte</div>
  <div class="meta"><div><b><code>${esc(hex)}</code></b> ×${x.count}${x.pseudo ? ` <em class="tag">dont ${x.pseudo} en pseudo-élément</em>` : ''}</div>
  <div class="hexes">sur blanc : ${onWhite.toFixed(2)} : 1${x.onDark ? ` · ${x.onDark} fois sur fond sombre` : ''}</div></div></div>`;
        })
        .join('\n')
    : '';

  const stat = (/** @type {string|number} */ n, /** @type {string} */ label) => `<div class="stat"><b>${esc(n)}</b><span>${esc(label)}</span></div>`;

  push(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Audit visuel, ${esc(meta.host)}, ${esc(meta.stamp)}</title>
<style>
  :root { --ink:#16181d; --soft:#5b616e; --line:#e3e5ea; --bg:#f6f7f9; --card:#ffffff; --ok:#17603a; --ko:#a3172f; --v:#7a5200; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width:1120px; margin:0 auto; padding:32px 24px 80px; }
  h1 { font-size:26px; line-height:1.2; margin:0 0 4px; }
  h2 { font-size:19px; margin:48px 0 4px; }
  h3 { font-size:14px; margin:0 0 10px; grid-column:1/-1; }
  h3 small, .lede { color:var(--soft); font-weight:400; }
  .lede { margin:0 0 16px; max-width:70ch; }
  code { font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background:#eef0f3; padding:1px 5px; border-radius:4px; word-break:break-all; }
  i { color:var(--soft); font-style:normal; }
  .stats { display:flex; flex-wrap:wrap; gap:12px; margin:20px 0 0; }
  .stat { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 16px; min-width:132px; }
  .stat b { display:block; font-size:24px; line-height:1.1; }
  .stat span { color:var(--soft); font-size:13px; }
  .group { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:12px; margin:0 0 12px; }
  .group.multi { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px; }
  .swatch, .pair { display:flex; gap:12px; background:var(--card); border:1px solid var(--line); border-radius:10px; padding:10px; min-width:0; }
  .group.multi .swatch { border-color:transparent; padding:0; }
  .chip { flex:0 0 96px; height:64px; border-radius:8px; overflow:hidden; border:1px solid rgba(0,0,0,.12); }
  .chip.damier { background:repeating-conic-gradient(#d8dbe0 0% 25%, #ffffff 0% 50%) 0 0 / 14px 14px; }
  .chip span { display:flex; align-items:flex-end; width:100%; height:100%; padding:6px; font:11px/1 ui-monospace, Menlo, monospace; }
  .meta { min-width:0; flex:1; }
  .count { font-weight:600; }
  .usage { display:inline-block; margin:2px 10px 2px 0; font-size:13px; }
  .examples { margin-top:4px; display:flex; flex-wrap:wrap; gap:4px; }
  .minis { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0 0; }
  .mini { display:inline-block; border-radius:6px; overflow:hidden; border:1px solid rgba(0,0,0,.12); }
  .mini.damier { background:repeating-conic-gradient(#d8dbe0 0% 25%, #ffffff 0% 50%) 0 0 / 14px 14px; }
  .mini span { display:block; padding:10px 8px 4px; font:11px/1 ui-monospace, Menlo, monospace; }
  details { margin:12px 0 0; } summary { cursor:pointer; font-weight:600; font-size:14px; }
  .tag { font-style:normal; font-weight:400; font-size:12px; color:var(--v); background:#fdf3d7; border-radius:4px; padding:1px 6px; }
  .tag.fort { color:#fff; background:var(--ko); }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(330px, 1fr)); gap:12px; }
  .sample { flex:0 0 132px; height:64px; border-radius:8px; border:1px solid rgba(0,0,0,.12); display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:500; }
  .badge { display:inline-block; font-size:12px; border-radius:4px; padding:1px 7px; color:#fff; }
  .badge.ok { background:var(--ok); } .badge.ko { background:var(--ko); } .badge.v { background:var(--v); }
  .hexes { font-size:13px; color:var(--soft); margin-top:2px; }
  .size { display:flex; align-items:center; gap:20px; padding:10px 0; border-bottom:1px solid var(--line); }
  .size .label { flex:0 0 250px; font-size:13px; }
  .specimen { line-height:1.1; white-space:nowrap; overflow:hidden; }
  .bar { height:6px; background:#e9ebef; border-radius:3px; margin-top:6px; }
  .bar span { display:block; height:100%; background:#3b4252; border-radius:3px; min-width:2px; }
  .space { display:flex; align-items:center; gap:10px; font-size:13px; margin:5px 0; }
  .space span { height:14px; background:#3b4252; border-radius:2px; min-width:1px; }
  .tiles { display:flex; flex-wrap:wrap; gap:14px; }
  .tile { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:14px; font-size:13px; text-align:center; }
  .tile.wide { text-align:left; max-width:340px; }
  .tile span { display:block; width:84px; height:56px; margin:0 auto 10px; background:#dfe3ea; border:1px solid #c5cad3; }
  .tile.wide span { background:#ffffff; border:0; margin:6px 6px 16px; }
  .weight { display:inline-flex; flex-direction:column; margin:0 28px 12px 0; font-size:13px; }
  .weight span { font-size:24px; }
  ul.limits { color:var(--soft); font-size:13px; max-width:90ch; padding-left:18px; }
  @media (max-width:640px) { .size { flex-direction:column; align-items:flex-start; gap:6px; } .size .label { flex:auto; } }
</style>
</head>
<body>
<main>
<h1>Audit visuel : ${esc(meta.host)}</h1>
<p class="lede">${esc(meta.stamp)} · ${pages.length} page(s) · fenêtre ${meta.viewport.width} × ${meta.viewport.height} · session : ${esc(meta.storageState ?? 'aucune')}. Tout ce qui suit est mesuré dans le navigateur, sauf la ligne « déclarées ».</p>
<div class="stats">
${stat(rendered.elements, 'éléments affichés')}
${stat(interfaceCount, 'couleurs d’interface')}
${stat(interfaceCount - rare.length, `dont utilisées plus de ${RARE} fois`)}
${stat(groups.filter((/** @type {any} */ g) => !isRare(g)).length + translucent.length, 'groupes, une fois les proches réunies')}
${stat(S.onlyInStates.length, 'de plus, au survol, au focus ou à l’appui')}
${stat(contentColors.length, 'couleurs vues dans du contenu, à part')}
${stat(declared.families.colors.distinct, 'couleurs déclarées dans le CSS')}
${rendered.thirdParty?.elements ? stat(rendered.thirdParty.elements, 'éléments tiers écartés') : ''}
</div>

<h2>Couleurs de l’interface</h2>
<p class="lede">Texte, fonds, bordures, contours, ombres et icônes qui suivent la couleur du texte, au repos, utilisés plus de ${RARE} fois. Les couleurs encadrées ensemble sont proches à l’œil (toutes à moins de ΔE 5 les unes des autres) : ce sont les candidates à la fusion.</p>
${groupHtml}
${translucent.length ? `<h3>Couleurs avec transparence</h3><section class="group">${translucent.map((h) => swatch(h, colors.values[h])).join('')}</section>` : ''}
${rareHtml ? `<details><summary>${rare.length} couleur(s) d’interface rares, utilisées ${RARE} fois au plus</summary><p class="lede">Souvent un cas particulier ou une erreur. Survole une pastille pour voir où elle apparaît.</p><div class="minis">${rareHtml}</div></details>` : ''}

<h2>Couleurs de contenu</h2>
<p class="lede">Elles ne font pas partie du système : couleurs propres d’un SVG (illustration, graphique, logo) et fonds d’attente derrière une image. Une icône SVG qui suit la couleur du texte reste comptée dans l’interface. Le tri est automatique : à vérifier à l’œil [H].</p>
${contentHtml ? `<div class="minis">${contentHtml}</div>` : '<p class="lede">Aucune.</p>'}

<h2>Couleurs d’état</h2>
<p class="lede">${S.sampled} élément(s) interactif(s) testé(s) au survol, au focus et à l’appui${S.capped ? ' (échantillon plafonné : tous les éléments n’ont pas été testés)' : ''}. Ne sont listées que les couleurs qu’un élément n’avait pas au repos. Un contour sombre au focus sur beaucoup d’éléments est en général l’anneau par défaut du navigateur : le site n’a pas défini le sien.</p>
${stateRows ? `<section class="group">${stateRows}</section>` : `<p class="lede">${meta.states === false ? 'États non mesurés (option --no-states).' : 'Aucune couleur propre à un état sur l’échantillon.'}</p>`}

<h2>Texte sur fond</h2>
<p class="lede">Chaque paire est montrée dans ses vraies couleurs, de la moins lisible à la plus lisible${rendered.contrast.pairs.length > pairs.length ? ` (${pairs.length} premières sur ${rendered.contrast.pairs.length})` : ''}. « À vérifier » : le fond calculé n’est peut-être pas celui qu’on voit. Le texte se juge à 4,5:1 (3:1 s’il est grand), une icône à 3:1.</p>
<div class="grid">
${pairHtml}
</div>

${greyHtml ? `<h2>Gris de texte</h2>
<p class="lede">${tg.distinctWithoutPseudo ?? tg.distinct} gris servent de couleur de texte (${tg.distinct} avec les pseudo-éléments), montrés ici sur blanc. Le blanc lui-même sert ${tg.white} fois de couleur de texte.</p>
<div class="grid">
${greyHtml}
</div>` : ''}

<h2>Tailles de police</h2>
<p class="lede">${R.fontSizes.distinctWithoutPseudo ?? R.fontSizes.distinct} tailles affichées (${R.fontSizes.distinct} avec les pseudo-éléments). La barre donne la fréquence ; le mot est à sa taille réelle, plafonnée à 64 px.</p>
${sizeHtml}

<h2>Graisses</h2>
<div>${weightHtml}</div>

<h2>Espacements</h2>
<p class="lede">Marges, retraits et gouttières les plus fréquents, fusionnés par valeur.</p>
${spaceHtml || '<p class="lede">Aucun.</p>'}

<h2>Rayons</h2>
<div class="tiles">${radiusHtml || '<p class="lede">Aucun.</p>'}</div>

<h2>Ombres</h2>
<div class="tiles">${shadowHtml || '<p class="lede">Aucune.</p>'}</div>

<h2>Ce que cette page ne voit pas</h2>
<ul class="limits">
${LIMITS.map((l) => `<li>${esc(l.text)} ${esc(l.tag)}</li>`).join('\n')}
</ul>
</main>
</body>
</html>
`);
  return out.join('\n');
}
