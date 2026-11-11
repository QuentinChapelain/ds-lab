// @ts-check
/**
 * Page de revue de la réduction (revue.html) : la table ancien → nouveau,
 * classe par classe, avec pour chaque changement des captures avant et après
 * et un choix à faire. Les choix s'exportent en decisions.json, que la commande
 * reduce relit au tour suivant (--decisions). Un seul fichier, sans dépendance.
 * Toute chaîne venue de la page auditée est échappée.
 */
import { CLASSES } from '../reduce/propose.js';

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

const FAMILY_LABELS = /** @type {Record<string, string>} */ ({ radii: 'Rayons', spacing: 'Espacements', fontSizes: 'Tailles de police', colors: 'Couleurs' });
const CLASS_LABELS = /** @type {Record<string, [string, string]>} */ ({
  décision: ['Décisions', 'L’écart se voit. Choisis une valeur parmi les candidates, ou garde l’ancienne.'],
  proche: ['Proches', 'Écart faible. Valide le lot d’un clic, ou refuse au cas par cas.'],
  auto: ['Appliqués d’office', 'Écart invisible à l’œil. Listés pour mémoire, refusables.'],
  inchangé: ['Déjà sur la cible', ''],
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
  if (family === 'spacing') return `<span class="g bar"><i style="width:${Math.min(Math.abs(n), 120)}px"></i></span>`;
  return `<span class="g txt" style="font-size:${Math.min(Math.max(n, 6), 44)}px">Aa</span>`;
}

/**
 * @param {ReturnType<typeof import('../reduce/propose.js').propose>} table
 * @param {{ url: string, changes: import('../browser/simulate.js').SimulatedChange[], before: string | null, after: string | null }[]} pages
 * @param {{ host: string, stamp: string, target: string, decisions: Record<string, string | false> }} meta
 */
export function renderReview(table, pages, meta) {
  /** @type {Map<string, { before: string, after: string }[]>} */
  const crops = new Map();
  for (const p of pages)
    for (const c of p.changes) {
      const k = `${c.family}|${c.old}`;
      const list = crops.get(k) ?? [];
      for (const x of c.crops) if (list.length < 2) list.push(x);
      crops.set(k, list);
    }

  const sections = Object.entries(table.families)
    .map(([family, f]) => {
      const s = f.summary;
      const byClass = CLASSES.map((cls) => {
        const rows = f.rows.filter((r) => r.class === cls);
        if (!rows.length) return '';
        const [title, help] = CLASS_LABELS[cls];
        const cards = rows
          .map((r) => {
            const key = `${family}|${r.old}`;
            const shots = (crops.get(key) ?? [])
              .map((x) => `<div class="shots"><figure>${img(x.before)}<figcaption>avant</figcaption></figure><figure>${img(x.after)}<figcaption>après</figcaption></figure></div>`)
              .join('');
            const pick =
              cls === 'décision'
                ? `<div class="pick">${r.candidates
                    .map(
                      (c, i) =>
                        `<label><input type="radio" name="${esc(key)}" value="${esc(c.value)}"${i === 0 ? ' checked' : ''}>${glyph(family, c.value)}<code>${esc(c.value)}</code>${c.name ? ` ${esc(c.name)}` : ''} <i>écart ${c.delta}</i></label>`,
                    )
                    .join('')}<label><input type="radio" name="${esc(key)}" value=""> garder <code>${esc(r.old)}</code></label></div>`
                : cls === 'proche' || cls === 'auto'
                  ? `<label class="ok"><input type="checkbox" name="${esc(key)}" checked> appliquer</label>`
                  : '';
            const arrow = r.new && r.new !== r.old ? `<b class="arrow">→</b>${glyph(family, r.new)}<code>${esc(r.new)}</code>${r.name ? ` <i>${esc(r.name)}</i>` : ''}` : r.name ? ` <i>${esc(r.name)}</i>` : '';
            return `<article class="row c-${cls === 'hors table' ? 'hors' : esc(cls)}" data-key="${esc(key)}">
  <header>${glyph(family, r.old)}<code>${esc(r.old)}</code>${arrow}<span class="n">×${r.count}${r.delta ? ` · écart ${r.delta}` : ''}</span></header>
  <div class="sel">${r.selectors.map((x) => `<code>${esc(x)}</code>`).join(' ')}</div>
  ${pick}${shots}
</article>`;
          })
          .join('\n');
        const open = cls === 'décision' || cls === 'proche';
        return `<details${open ? ' open' : ''}><summary>${esc(title)} <span class="n">${rows.length}</span></summary>${help ? `<p class="lede">${esc(help)}</p>` : ''}${cards}</details>`;
      }).join('\n');
      return `<section>
<h2>${esc(FAMILY_LABELS[family] ?? family)}</h2>
<p class="lede"><b>${s.before}</b> valeurs aujourd’hui → <b>${s.after}</b> sur la cible, pour ${s.occurrences} usages. ${s.decisions} décision(s), ${s.near} proche(s), ${s.auto} d’office, ${s.unchanged} déjà bonnes${s.outOfTable ? `, ${s.outOfTable} hors table` : ''}.</p>
${byClass}
</section>`;
    })
    .join('\n');

  const full = pages
    .filter((p) => p.before && p.after)
    .map((p) => `<details><summary>${esc(p.url)}</summary><div class="full"><figure>${img(/** @type {string} */ (p.before))}<figcaption>avant</figcaption></figure><figure>${img(/** @type {string} */ (p.after))}<figcaption>après</figcaption></figure></div></details>`)
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
  .row.c-décision { border-left-color:#b45309; } .row.c-proche { border-left-color:#2563eb; } .row.c-auto { border-left-color:#6b7280; }
  .row.refuse { opacity:.55; }
  .row header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .arrow { color:var(--soft); margin:0 4px; }
  .sel { margin:6px 0 0; display:flex; gap:4px; flex-wrap:wrap; }
  .g { display:inline-block; vertical-align:middle; }
  .sw { width:34px; height:24px; border-radius:5px; border:1px solid rgba(0,0,0,.15); } .sw.vide { background:repeating-conic-gradient(#d8dbe0 0% 25%, #fff 0% 50%) 0 0 / 10px 10px; }
  .box { width:44px; height:30px; background:#dfe3ea; border:1px solid #c5cad3; }
  .bar i { display:block; height:12px; background:#3b4252; border-radius:2px; min-width:1px; }
  .txt { line-height:1; font-weight:500; }
  .pick { display:flex; flex-direction:column; gap:4px; margin:10px 0 0; } .pick label, .ok { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .ok { margin-top:8px; font-size:14px; }
  .shots, .full { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
  figure { margin:0; background:#fff; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  figure img { display:block; max-width:100%; } figcaption { font-size:12px; color:var(--soft); padding:3px 8px; border-top:1px solid var(--line); }
  .full figure { max-height:520px; overflow:auto; }
  .barre { position:fixed; left:0; right:0; bottom:0; background:#16181d; color:#fff; padding:10px 24px; display:flex; gap:16px; align-items:center; justify-content:center; font-size:14px; }
  .barre button { font:inherit; border:0; border-radius:6px; padding:7px 14px; cursor:pointer; background:#fff; color:#16181d; font-weight:600; }
  @media (max-width:700px) { .shots, .full { grid-template-columns:1fr; } }
</style>
</head>
<body>
<main>
<h1>Revue de la réduction : ${esc(meta.host)}</h1>
<p class="lede">${esc(meta.stamp)} · cible : <code>${esc(meta.target)}</code> · ${pages.length} page(s) simulée(s). Rien n’a été modifié sur le site : les nouvelles valeurs sont posées dans le navigateur de l’audit, le temps des captures. Les pseudo-éléments (icônes) ne sont pas simulés.</p>
${sections}
<h2>Pages entières</h2>
<p class="lede">Avant et après, avec toutes les propositions appliquées.</p>
${full || '<p class="lede">Aucune capture de page.</p>'}
</main>
<div class="barre"><span id="bilan"></span><button id="export" type="button">Exporter mes décisions</button></div>
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
  document.addEventListener('change', refresh);
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
