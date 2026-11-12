// @ts-check
/**
 * Page de revue de la réduction (revue.html) : la table ancien → nouveau,
 * classe par classe, avec pour chaque changement des captures avant et après
 * et un choix à faire. Les choix s'exportent en decisions.json, que la commande
 * reduce relit au tour suivant (--decisions). Un seul fichier, sans dépendance.
 * Toute chaîne venue de la page auditée est échappée.
 */
import { ALL_CLASSES, OUT, rowKey, isOut } from '../reduce/propose.js';

/** @param {unknown} s */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
/** @param {string} v */
const hex = (v) => (/^#[0-9a-f]{6}$/.test(v) ? v : null);
/** @param {string} v */
const num = (v) => {
  const m = /^(-?\d+(?:\.\d+)?)px$/.exec(v);
  return m ? Number(m[1]) : null;
};
/** @param {string} b64 */
const img = (b64) => (/^[A-Za-z0-9+/=]+$/.test(b64) ? `<img alt="" src="data:image/png;base64,${b64}">` : '');

/** Nom lisible d'une propriété touchée. */
const PROP_LABELS = /** @type {Record<string, string>} */ ({
  padding: 'retrait intérieur',
  margin: 'marge extérieure',
  'row-gap': 'gouttière',
  'column-gap': 'gouttière',
  'font-size': 'taille du texte',
  color: 'texte',
  'background-color': 'fond',
  'border-color': 'bordure',
  'border-radius': 'arrondi',
});

/**
 * Une couche du comparateur : la capture et le repère de l'élément modifié.
 * @param {import('../browser/simulate.js').Shot} shot @param {string} cls
 */
function layer(shot, cls) {
  const pct = (/** @type {number} */ n, /** @type {number} */ d) => `${Math.max(0, Math.min(100, (100 * n) / d)).toFixed(2)}%`;
  const b = shot.box;
  return `<div class="layer ${cls}">${img(shot.png)}<span class="repere" style="left:${pct(b.x, shot.width)};top:${pct(b.y, shot.height)};width:${pct(b.width, shot.width)};height:${pct(b.height, shot.height)}"></span></div>`;
}

/**
 * Comparateur : avant et après au même endroit, on bascule d'un clic.
 * @param {{ before: import('../browser/simulate.js').Shot, after: import('../browser/simulate.js').Shot }} x
 */
const comparator = (x) =>
  `<button type="button" class="cmp" data-etat="avant" title="Cliquer pour basculer entre avant et après">${layer(x.before, 'a')}${layer(x.after, 'b')}<span class="etat"></span></button>`;

const FAMILY_LABELS = /** @type {Record<string, string>} */ ({ radii: 'Rayons', spacing: 'Espacements', fontSizes: 'Tailles de police', colors: 'Couleurs' });
const CLASS_LABELS = /** @type {Record<string, [string, string]>} */ ({
  décision: ['Décisions', 'L’écart se voit, ou le contraste l’impose. Choisis une valeur parmi les candidates ; sans choix, l’ancienne reste (R5).'],
  correction: ['Corrections', 'Le contraste échouait et passe avec la valise (R9). Appliquées d’office, annulables une à une.'],
  proche: ['Proches', 'Écart faible. Valide le lot d’un clic, ou refuse au cas par cas.'],
  auto: ['Appliqués d’office', 'Écart invisible à l’œil. Listés pour mémoire, refusables.'],
  inchangé: ['Déjà sur la cible', ''],
  [OUT.scale]: ['Hors table : aucune échelle', 'Trop loin de toute la valise (ΔE > 10, R4) : laissées telles quelles.'],
  [OUT.dark]: ['Hors table : fond sombre', 'Plus sombres que le pas 10 le plus sombre de la valise (R8) : laissés tels quels.'],
  [OUT.layout]: ['Hors table : mise en page', 'Espacements négatifs ou supérieurs à 64 px (R7) : laissés tels quels. Les marges auto ne sont pas relevées.'],
  'hors table': ['Hors table', 'Valeurs non convertibles (pourcentages, transparences) : laissées telles quelles.'],
});

/**
 * Dessin d'une valeur : pastille, boîte arrondie, barre ou mot à sa taille.
 * @param {string} family @param {string} value
 */
function glyph(family, value) {
  if (family === 'colors') {
    const h = hex(value);
    return h ? `<span class="g sw" style="background:${h}"></span>` : '<span class="g sw vide"></span>';
  }
  const n = num(value);
  if (n === null) return '<span class="g"></span>';
  if (family === 'radii') return `<span class="g box" style="border-radius:${Math.min(n, 22)}px"></span>`;
  // Espacement : deux blocs et l'intervalle qui les sépare, à l'échelle.
  if (family === 'spacing') return `<span class="g esp" title="${esc(value)} d’espace"><i></i><b style="width:${Math.min(Math.abs(n), 96)}px"></b><i></i></span>`;
  return `<span class="g txt" style="font-size:${Math.min(Math.max(n, 6), 44)}px">Aa</span>`;
}

/**
 * @param {ReturnType<typeof import('../reduce/propose.js').propose>} table
 * @param {{ url: string, changes: import('../browser/simulate.js').SimulatedChange[], before: string | null, after: string | null }[]} pages
 * @param {{ host: string, stamp: string, target: string, decisions: Record<string, string | false> }} meta
 */
export function renderReview(table, pages, meta) {
  /** @type {Map<string, { before: import('../browser/simulate.js').Shot, after: import('../browser/simulate.js').Shot }[]>} */
  const crops = new Map();
  /** @type {Map<string, Set<string>>} */
  const props = new Map();
  for (const p of pages)
    for (const c of p.changes) {
      const k = c.key ?? `${c.family}|${c.old}`;
      const list = crops.get(k) ?? [];
      for (const x of c.crops) if (list.length < 2) list.push(x);
      crops.set(k, list);
      const set = props.get(k) ?? new Set();
      for (const name of c.props ?? []) set.add(PROP_LABELS[name] ?? name);
      props.set(k, set);
    }

  const sections = Object.entries(table.families)
    .map(([family, f]) => {
      const s = f.summary;
      const byClass = ALL_CLASSES.map((cls) => {
        const rows = f.rows.filter((r) => r.class === cls);
        if (!rows.length) return '';
        const [title, help] = CLASS_LABELS[cls];
        const cards = rows
          .map((r) => {
            const key = rowKey(family, r);
            const list = crops.get(key) ?? [];
            const shots = list.length ? `<div class="shots">${list.map(comparator).join('')}</div>` : '';
            const what = [...(props.get(key) ?? [])].map((x) => `<span class="quoi">${esc(x)}</span>`).join('');
            const pick =
              cls === 'décision'
                ? `<div class="pick">${r.candidates
                    .map(
                      (c, i) =>
                        `<label><input type="radio" name="${esc(key)}" value="${esc(c.value)}">${glyph(family, c.value)}<code>${esc(c.value)}</code>${c.name ? ` ${esc(c.name)}` : ''} <i>écart ${c.delta}</i></label>`,
                    )
                    .join('')}<label><input type="radio" name="${esc(key)}" value="" checked> garder <code>${esc(r.old)}</code></label></div>`
                : cls === 'proche' || cls === 'auto' || cls === 'correction'
                  ? `<label class="ok"><input type="checkbox" name="${esc(key)}" checked> appliquer</label>`
                  : '';
            const arrow = r.new && r.new !== r.old ? `<b class="arrow">→</b>${glyph(family, r.new)}<code>${esc(r.new)}</code>${r.name ? ` <i>${esc(r.name)}</i>` : ''}` : r.name ? ` <i>${esc(r.name)}</i>` : '';
            const usage = (r.usages ?? []).map((x) => `<span class="usage">${esc(x)}</span>`).join('');
            const contrast = r.contrast
              ? ` <span class="ctr">contraste ${String(r.contrast.before).replace('.', ',')} → ${String(r.contrast.after).replace('.', ',')} (seuil ${String(r.contrast.threshold).replace('.', ',')})</span>`
              : '';
            const motif = r.reason || r.contrast ? `<p class="motif">${r.reason ? `Motif : ${esc(r.reason)}.` : ''}${contrast}</p>` : '';
            return `<article class="row c-${isOut(cls) ? 'hors' : esc(cls)}" data-key="${esc(key)}">
  <header>${glyph(family, r.old)}<code>${esc(r.old)}</code>${arrow}${usage}${what}<span class="n">×${r.count}${r.delta ? ` · écart ${r.delta}` : ''}</span></header>
  ${motif}<div class="sel">${r.selectors.map((x) => `<code>${esc(x)}</code>`).join(' ')}</div>
  ${pick}${shots}
</article>`;
          })
          .join('\n');
        const open = cls === 'décision' || cls === 'proche' || cls === 'correction';
        return `<details${open ? ' open' : ''}><summary>${esc(title)} <span class="n">${rows.length}</span></summary>${help ? `<p class="lede">${esc(help)}</p>` : ''}${cards}</details>`;
      }).join('\n');
      return `<section>
<h2>${esc(FAMILY_LABELS[family] ?? family)}</h2>
<p class="lede"><b>${s.before}</b> valeurs aujourd’hui → <b>${s.after}</b> sur la cible, pour ${s.occurrences} usages. ${s.decisions} décision(s), ${s.corrections ?? 0} correction(s), ${s.near} proche(s), ${s.auto} d’office, ${s.unchanged} déjà bonnes${s.outOfTable ? `, ${s.outOfTable} hors table` : ''}.</p>
${byClass}
</section>`;
    })
    .join('\n');

  const full = pages
    .filter((p) => p.before && p.after)
    .map(
      (p) =>
        `<details><summary>${esc(p.url)}</summary><div class="full"><button type="button" class="cmp page" data-etat="avant" title="Cliquer pour basculer entre avant et après"><div class="layer a">${img(/** @type {string} */ (p.before))}</div><div class="layer b">${img(/** @type {string} */ (p.after))}</div><span class="etat"></span></button></div></details>`,
    )
    .join('\n');

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revue de la réduction, ${esc(meta.host)}, ${esc(meta.stamp)}</title>
<style>
  :root { --ink:#16181d; --soft:#5b616e; --line:#e3e5ea; --bg:#f6f7f9; --card:#fff; --go:#17603a; --no:#a3172f; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width:1080px; margin:0 auto; padding:28px 24px 120px; }
  h1 { font-size:25px; margin:0 0 4px; } h2 { font-size:20px; margin:44px 0 2px; }
  .lede { color:var(--soft); margin:2px 0 12px; max-width:75ch; } .lede b { color:var(--ink); }
  code { font:12px/1.4 ui-monospace, Menlo, monospace; background:#eef0f3; padding:1px 5px; border-radius:4px; }
  i { font-style:normal; color:var(--soft); font-size:13px; }
  details { margin:10px 0; } summary { cursor:pointer; font-weight:600; padding:6px 0; }
  .n { color:var(--soft); font-weight:400; font-size:13px; margin-left:8px; }
  .row { background:var(--card); border:1px solid var(--line); border-left:4px solid var(--line); border-radius:10px; padding:12px 14px; margin:8px 0; }
  .row.c-décision { border-left-color:#b45309; } .row.c-correction { border-left-color:#17603a; }
  .usage { font-size:12px; border:1px solid var(--line); border-radius:999px; padding:0 8px; color:var(--ink); }
  .motif { margin:6px 0 0; font-size:14px; } .ctr { color:var(--soft); font-variant-numeric:tabular-nums; } .row.c-proche { border-left-color:#2563eb; } .row.c-auto { border-left-color:#6b7280; }
  .row.refuse { opacity:.55; }
  .row header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .arrow { color:var(--soft); margin:0 4px; }
  .sel { margin:6px 0 0; display:flex; gap:4px; flex-wrap:wrap; }
  .g { display:inline-block; vertical-align:middle; }
  .sw { width:34px; height:24px; border-radius:5px; border:1px solid rgba(0,0,0,.15); } .sw.vide { background:repeating-conic-gradient(#d8dbe0 0% 25%, #fff 0% 50%) 0 0 / 10px 10px; }
  .box { width:44px; height:30px; background:#dfe3ea; border:1px solid #c5cad3; }
  .esp { display:inline-flex; align-items:center; height:22px; }
  .esp i { width:10px; height:22px; background:#c9ced8; border-radius:2px; }
  .esp b { height:10px; min-width:1px; background:repeating-linear-gradient(90deg, #e2572b 0 2px, transparent 2px 4px); border-top:1px solid #e2572b; border-bottom:1px solid #e2572b; }
  .quoi { font-size:12px; background:#eef0f3; border-radius:999px; padding:1px 8px; color:var(--soft); }
  .cmp { all:unset; display:inline-grid; position:relative; cursor:pointer; background:#fff; border:1px solid var(--line); border-radius:8px; overflow:hidden; max-width:100%; }
  .cmp:focus-visible { outline:3px solid #2563eb; outline-offset:2px; }
  .cmp .layer { grid-area:1 / 1; position:relative; justify-self:start; align-self:start; line-height:0; }
  .cmp .layer img { display:block; max-width:100%; }
  .cmp[data-etat="avant"] .layer.b, .cmp[data-etat="apres"] .layer.a { visibility:hidden; }
  .cmp .etat { position:absolute; top:6px; right:6px; font:600 12px/1 system-ui, sans-serif; padding:4px 8px; border-radius:999px; color:#fff; background:#5b616e; }
  .cmp[data-etat="apres"] .etat { background:#17603a; }
  .cmp[data-etat="avant"] .etat::after { content:"avant"; } .cmp[data-etat="apres"] .etat::after { content:"après"; }
  .repere { position:absolute; border:2px dashed #d6249f; border-radius:3px; pointer-events:none; }
  body.sans-reperes .repere { display:none; }
  .txt { line-height:1; font-weight:500; }
  .pick { display:flex; flex-direction:column; gap:4px; margin:10px 0 0; } .pick label, .ok { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .ok { margin-top:8px; font-size:14px; }
  .shots { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
  .full { margin-top:10px; max-height:620px; overflow:auto; border-radius:8px; }
  .cmp.page { display:grid; }
  .barre { position:fixed; left:0; right:0; bottom:0; background:#16181d; color:#fff; padding:10px 24px; display:flex; gap:16px; align-items:center; justify-content:center; font-size:14px; }
  .barre label { display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  .barre button { font:inherit; border:0; border-radius:6px; padding:7px 14px; cursor:pointer; background:#fff; color:#16181d; font-weight:600; }
</style>
</head>
<body>
<main>
<h1>Revue de la réduction : ${esc(meta.host)}</h1>
<p class="lede">${esc(meta.stamp)} · cible : <code>${esc(meta.target)}</code> · ${pages.length} page(s) simulée(s). Rien n’a été modifié sur le site : les nouvelles valeurs sont posées dans le navigateur de l’audit, le temps des captures. Les pseudo-éléments (icônes) ne sont pas simulés.</p>
<p class="lede"><b>Pour voir un changement</b> : clique sur une capture, elle bascule entre avant et après au même endroit. Chaque capture ne contient que le changement de sa ligne. Le cadre en pointillés entoure l’élément modifié. La touche <code>Espace</code> bascule toutes les captures à la fois.</p>
${sections}
<h2>Pages entières</h2>
<p class="lede">Avec toutes les propositions appliquées. Clique dans la page pour basculer.</p>
${full || '<p class="lede">Aucune capture de page.</p>'}
</main>
<div class="barre"><span id="bilan"></span><button id="tout" type="button">Tout basculer</button><label><input id="reperes" type="checkbox" checked> repères</label><button id="export" type="button">Exporter mes décisions</button></div>
<script>
(function () {
  var KEY = 'ds-lab-revue:' + ${JSON.stringify(meta.host)};
  var previous = ${JSON.stringify(meta.decisions).replace(/</g, '\\u003c')};
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var state = Object.assign({}, previous, saved);
  function rows() { return Array.prototype.slice.call(document.querySelectorAll('.row[data-key]')); }
  function restore() {
    rows().forEach(function (row) {
      var k = row.getAttribute('data-key'); if (!(k in state)) return;
      var v = state[k];
      var box = row.querySelector('input[type=checkbox]');
      if (box) box.checked = v !== false;
      row.querySelectorAll('input[type=radio]').forEach(function (r) { r.checked = v === false ? r.value === '' : r.value === v; });
    });
  }
  function collect() {
    var out = {};
    rows().forEach(function (row) {
      var k = row.getAttribute('data-key');
      var box = row.querySelector('input[type=checkbox]');
      var radio = row.querySelector('input[type=radio]:checked');
      var refused = false;
      if (box) { if (!box.checked) { out[k] = false; refused = true; } }
      else if (radio) { if (radio.value === '') { out[k] = false; refused = true; } else out[k] = radio.value; }
      row.classList.toggle('refuse', refused);
    });
    return out;
  }
  function refresh() {
    state = collect();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    var refused = Object.keys(state).filter(function (k) { return state[k] === false; }).length;
    var decided = document.querySelectorAll('.row.c-décision').length;
    document.getElementById('bilan').textContent = decided + ' décision(s) à prendre, ' + refused + ' changement(s) refusé(s)';
  }
  restore(); refresh();
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'reperes') { document.body.classList.toggle('sans-reperes', !e.target.checked); return; }
    refresh();
  });
  function flip(el, etat) { el.setAttribute('data-etat', etat || (el.getAttribute('data-etat') === 'avant' ? 'apres' : 'avant')); }
  document.addEventListener('click', function (e) {
    var c = e.target && e.target.closest ? e.target.closest('.cmp') : null;
    if (c) flip(c);
  });
  var global = 'avant';
  function flipAll() {
    global = global === 'avant' ? 'apres' : 'avant';
    document.querySelectorAll('.cmp').forEach(function (c) { flip(c, global); });
  }
  document.getElementById('tout').addEventListener('click', flipAll);
  document.addEventListener('keydown', function (e) {
    var t = e.target && e.target.tagName;
    if (e.code === 'Space' && t !== 'INPUT' && t !== 'BUTTON') { e.preventDefault(); flipAll(); }
  });
  document.getElementById('export').addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(collect(), null, 2) + '\\n'], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'decisions.json'; a.click();
  });
})();
</script>
</body>
</html>
`;
}
