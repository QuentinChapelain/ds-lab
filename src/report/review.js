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

const FAMILY_LABELS = /** @type {Record<string, string>} */ ({ radii: 'Rayons', spacing: 'Espacements', fontSizes: 'Tailles de police', colors: 'Couleurs' });
const CLASS_LABELS = /** @type {Record<string, [string, string]>} */ ({
  décision: ['Décisions', 'L’écart se voit, ou le contraste l’impose. Choisis une valeur parmi les candidates ; sans choix, l’ancienne reste (R5).'],
  correction: ['Corrections', 'Le contraste échouait et passe avec la valise (R9). Appliquées d’office, annulables une à une.'],
  proche: ['Proches', 'Écart faible. Appliqués par défaut ; refuse au cas par cas.'],
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

/** Lot R : valeur lisible, « 10 px » ou « #d0563f ». @param {string} family @param {string} v */
const short = (family, v) => {
  const n = num(v);
  return family === 'colors' || n === null ? v : `${String(n).replace('.', ',')} px`;
};
/** @param {number} n */
const fr = (n) => String(Math.round(n * 100) / 100).replace('.', ',');
/** Lot R : nom de jeton d'un pas de dimension (les couleurs gardent le nom de la valise). */
const TOKEN_PREFIX = /** @type {Record<string, string>} */ ({ spacing: 'espace', radii: 'rayon', fontSizes: 'taille-texte' });
/** Lot R : nom du pas d'une version, « terre-9 » ou « espace.8 ». @param {string} family @param {{ value: string, name?: string }} c */
const stepName = (family, c) => c.name ?? (num(c.value) !== null && TOKEN_PREFIX[family] ? `${TOKEN_PREFIX[family]}.${num(c.value)}` : '');
/** @param {number} n @param {number} d */
const pct = (n, d) => `${((100 * n) / d).toFixed(3)}%`;
/** Plus petit cadre affiché sans agrandissement (R-8) : en deçà, l'image est montrée à 2×. */
const SMALL_FRAME = 200;
/** Sélecteurs montrés dans le détail d'une carte, avant « et n autres ». */
const SELECTORS_SHOWN = 4;
/** Largeur maximale d'une vignette. */
const THUMB_MAX = 240;

/**
 * Lot R : zones d'espace d'une version, découpées au cadre ; cote au milieu de la partie
 * visible, toujours dans l'image. Masquées avec la case « repères ». Dans une vignette (end),
 * cote réduite et posée au bout de la bande : à droite d'une bande horizontale, en bas d'une
 * bande verticale, pour ne pas couvrir le texte.
 * @param {{ width: number, height: number }} shot @param {{ px: number, rect: { x: number, y: number, width: number, height: number } }[]} space
 * @param {{ end?: boolean }} [opts]
 */
function zones(shot, space, { end = false } = {}) {
  return space
    .map((z) => {
      const x = Math.max(0, z.rect.x);
      const y = Math.max(0, z.rect.y);
      const w = Math.min(shot.width, z.rect.x + z.rect.width) - x;
      const h = Math.min(shot.height, z.rect.y + z.rect.height) - y;
      if (w < 0 || h < 0 || x > shot.width || y > shot.height) return '';
      const box = `<span class="zone" style="left:${pct(x, shot.width)};top:${pct(y, shot.height)};width:${pct(w, shot.width)};height:${pct(h, shot.height)}"></span>`;
      if (end) {
        const across = w >= h;
        const ex = across ? x + w : x + w / 2;
        const ey = across ? y + h / 2 : y + h;
        return `${box}<span class="cote bout ${across ? 'droite' : 'bas'}" style="left:${pct(ex, shot.width)};top:${pct(ey, shot.height)}">${fr(z.px)} px</span>`;
      }
      const cx = Math.min(Math.max(x + w / 2, 26), shot.width - 26);
      const cy = Math.min(Math.max(y + h / 2, 9), shot.height - 9);
      return `${box}<span class="cote" style="left:${pct(cx, shot.width)};top:${pct(cy, shot.height)}">${fr(z.px)} px</span>`;
    })
    .join('');
}

/**
 * Lot R : contraste d'une version de couleur : « 4,35 · sous le seuil de 4,5 », puis la couleur
 * réelle de l'autre côté de la paire (le texte posé sur un fond, le fond sous un texte ou une bordure).
 * @param {string | undefined} usage @param {{ ratio: number, threshold: number, text: string, bg: string }} c
 */
function contrastLine(usage, c) {
  const pass = c.ratio >= c.threshold - 1e-9;
  const other = usage === 'texte' || usage === 'bordure' ? `sur le fond actuel ${c.bg}` : `avec le texte actuel ${c.text}`;
  return `<small>${fr(c.ratio)} · ${pass ? 'passe' : 'sous'} le seuil de ${fr(c.threshold)}</small><small>${esc(other)}</small>`;
}

/**
 * Lot R, 5c : capture d'une ligne appliquée (proche, d'office, correction), en deux versions,
 * « avant » et « après », avec le même sélecteur que les décisions (clic, ou ←/→ quand la
 * carte a le focus) ; « Tout basculer » les bascule toutes. Même cadre et même taille que pour
 * une décision, zone d'espace hachurée et cotée.
 * @param {string} family @param {any} r
 */
function beforeAfter(family, r) {
  const vs = r.capture?.versions;
  if (!vs || vs.length < 2) return '';
  const buttons = vs
    .slice(0, 2)
    .map((/** @type {any} */ v, /** @type {number} */ i) => `<button type="button" class="v" data-v="${i}" data-value="${esc(v.value)}" aria-pressed="${i === 0}">${glyph(family, v.value)}<span class="nom"><span>${i === 0 ? 'avant' : 'après'}</span><small>${esc(short(family, v.value))}</small></span></button>`)
    .join('');
  const a = vs[0].shot;
  const scale = a.width < SMALL_FRAME ? 2 : 1;
  return `<div class="versions" role="group" aria-label="Avant, après">${buttons}</div>
  <div class="vue" style="width:${a.width * scale}px;aspect-ratio:${a.width} / ${a.height}">${vs
    .slice(0, 2)
    .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}${zones(v.shot, v.space ?? [])}</div>`)
    .join('')}</div>`;
}

/** Lot R : « Ce choix s'applique à n éléments ». @param {any} r */
function portee(r) {
  const n = r.capture?.elements ?? r.count;
  return `<p class="portee">Ce choix s’applique à ${n} ${n === 1 ? 'élément' : 'éléments'}</p>`;
}

/**
 * Lot R : carte de décision. Sélecteur de versions (actuelle, puis chaque candidat), une seule
 * image (la version affichée) avec sa zone d'espace, et « Choisir cette version ». Afficher
 * une version ne change pas l'export ; seule une version choisie y entre.
 * @param {string} family @param {any} r
 */
function decisionCard(family, r) {
  const versions = r.capture?.versions ?? [{ label: 'actuelle', value: r.old }, ...r.candidates.map((/** @type {any} */ c, /** @type {number} */ i) => ({ label: `candidat ${i + 1}`, value: c.value, name: c.name }))];
  const nearest = r.candidates[0];
  const gap = nearest ? (family === 'colors' ? `écart ΔE ${fr(nearest.delta)}` : `écart ${fr(nearest.delta)} px`) : '';
  const buttons = versions
    .map((/** @type {any} */ v, /** @type {number} */ i) => {
      const name = i === 0 ? `actuelle · ${short(family, v.value)}` : `${short(family, v.value)}${stepName(family, v) ? ` · ${stepName(family, v)}` : ''}`;
      const note = i === 0 ? '<small>la choisir garde la valeur</small>' : i === 1 && gap ? `<small>le plus proche · ${esc(gap)}</small>` : '';
      const ctr = v.contrast ? contrastLine(r.usage, v.contrast) : '';
      return `<button type="button" class="v" data-v="${i}" data-value="${esc(v.value)}" data-court="${esc(short(family, v.value))}" aria-pressed="${i === 0}">${glyph(family, v.value)}<span class="nom"><span>${esc(name)}</span>${note}${ctr}</span></button>`;
    })
    .join('');
  const shot0 = versions[0].shot;
  const scale = shot0 && shot0.width < SMALL_FRAME ? 2 : 1;
  const view = shot0
    ? `<div class="vue" style="width:${shot0.width * scale}px;aspect-ratio:${shot0.width} / ${shot0.height}">${versions
        .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}${zones(v.shot, v.space ?? [])}</div>`)
        .join('')}</div>`
    : '';
  // Une vignette par autre élément touché, 3 au plus, à la taille CSS de son cadre plafonnée à 240 px ;
  // chacune suit la version affichée.
  const others = r.capture?.others ?? [];
  const more = (r.capture?.elements ?? 0) - 1 - others.length;
  const thumbs = others.length
    ? `<div class="vignettes">${others
        .map(
          (/** @type {any} */ o) =>
            `<div class="vig" style="width:${Math.min(o.clip.width, THUMB_MAX)}px;aspect-ratio:${o.clip.width} / ${o.clip.height}">${o.versions
              .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}${zones(v.shot, v.space ?? [], { end: true })}</div>`)
              .join('')}</div>`,
        )
        .join('')}${more > 0 ? `<span class="encore">et ${more} ${more === 1 ? 'autre' : 'autres'}</span>` : ''}</div>`
    : '';
  return `<div class="versions" role="group" aria-label="Versions">${buttons}</div>
  ${view}${thumbs}
  <div class="trancher"><button type="button" class="retenir">Choisir cette version</button></div>`;
}

/**
 * Lot R : motif réécrit en clair, et la règle qui l'impose. Un motif inconnu reste tel quel.
 * @param {string} reason
 * @returns {{ text: string, rule: string | null }}
 */
export function plainReason(reason) {
  const rule = /\((R\d+)\)\s*$/.exec(reason)?.[1] ?? null;
  /** @type {[RegExp, (m: RegExpExecArray) => string][]} */
  const RULES = [
    [/^ΔE ([\d.]+) à la valeur la plus proche de la valise \((.+)\) : aucune échelle/, (m) => `aucune couleur de la valise n’en est assez proche (la plus proche, ${m[2]}, est à ΔE ${m[1].replace('.', ',')}) : la valeur est laissée telle quelle`],
    [/^fond plus sombre que le pas 10/, () => 'ce fond est plus sombre que tous les fonds de la valise : il est laissé tel quel'],
    [/^texte posé sur un fond sombre/, () => 'ce texte est posé sur un fond sombre que la valise ne couvre pas : sa couleur est à choisir à l’œil'],
    [/^la paire passe avant et échoue après/, () => 'le contraste suffit aujourd’hui, mais ne suffirait plus avec la valeur la plus proche'],
    [/^texte sous 4,5:1 avant, au seuil après/, () => 'ce texte n’était pas assez lisible (contraste sous 4,5:1) ; la valeur proposée le rend lisible'],
    [/^bordure de champ sous 3:1 avant, au seuil après/, () => 'le bord de ce champ se distinguait mal du fond (contraste sous 3:1) ; la valeur proposée le rend visible'],
    [/^texte porté sous 4,5:1 avant, au seuil après/, () => 'le texte posé sur ce fond n’était pas assez lisible (contraste sous 4,5:1) ; ce fond le rend lisible'],
    [/^texte posé sur .+ : utiliser onSolid/, () => 'un texte est posé sur ce fond ; si le fond change, la couleur du texte devra changer pour rester lisible'],
    [/^espacement négatif/, () => 'cet espacement est négatif : il relève de la mise en page et reste tel quel'],
    [/^espacement supérieur à (\d+) px/, (m) => `cet espacement dépasse ${m[1]} px : il relève de la mise en page et reste tel quel`],
  ];
  for (const [re, f] of RULES) {
    const m = re.exec(reason);
    if (m) return { text: f(m), rule };
  }
  return { text: reason, rule };
}

/**
 * Lot R : « Détail » d'une carte, fermé par défaut, en bas de la carte : motif en clair,
 * contrastes chiffrés, usages, sélecteurs, clé technique. Le contraste « après » est celui de
 * la valeur la plus proche pour une décision, de la valeur proposée sinon.
 * @param {string} family @param {any} r @param {string} key @param {string} cls
 */
function detail(family, r, key, cls) {
  const against = cls === 'décision' ? 'avec la valeur la plus proche' : 'avec la valeur proposée';
  const ctr = r.contrast ? `<dt>Contraste</dt><dd>${fr(r.contrast.before)} avant → ${fr(r.contrast.after)} ${against} (seuil ${fr(r.contrast.threshold)})</dd>` : '';
  const gap = r.delta ? ` · écart ${family === 'colors' ? 'ΔE ' : ''}${fr(r.delta)}${family === 'colors' ? '' : ' px'}` : '';
  const motif = r.reason ? plainReason(r.reason) : null;
  // Sélecteurs : 4 au plus, puis « et n autres » ; sans capture, les exemples du relevé, dits coupés s'ils le sont.
  const full = !!r.capture?.touched?.length;
  const all = (full ? [...new Set(r.capture.touched.map((/** @type {any} */ t) => t.selector))] : r.selectors) ?? [];
  const sel = all.slice(0, SELECTORS_SHOWN);
  const more = all.length - sel.length;
  const cut = more > 0 ? `<i>et ${more} ${more === 1 ? 'autre' : 'autres'}</i>` : !full && all.length >= 3 && r.count > all.length ? '<i>et d’autres (liste coupée au relevé)</i>' : '';
  return `<details class="detail"><summary>Détail</summary><dl>
    ${motif ? `<dt>Motif</dt><dd>${esc(motif.text)}${motif.rule ? ` <i>(règle ${esc(motif.rule)})</i>` : ''}</dd>` : ''}
    ${ctr}<dt>Usages</dt><dd>${r.count}${gap}</dd>
    <dt>Sélecteurs</dt><dd>${sel.map((/** @type {string} */ x) => `<code>${esc(x)}</code>`).join(' ')}${cut}</dd>
    <dt>Clé technique</dt><dd><code>${esc(key)}</code></dd>
  </dl></details>`;
}

/**
 * @param {ReturnType<typeof import('../reduce/propose.js').propose>} table
 * @param {{ url: string, changes: import('../browser/simulate.js').SimulatedChange[], before: string | null, after: string | null }[]} pages
 * @param {{ host: string, stamp: string, target: string, decisions: Record<string, string | false> }} meta
 */
export function renderReview(table, pages, meta) {
  /** @type {Map<string, Set<string>>} */
  const props = new Map();
  for (const p of pages)
    for (const c of p.changes) {
      const k = c.key ?? `${c.family}|${c.old}`;
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
            const shots = cls === 'décision' ? '' : beforeAfter(family, r);
            const twoWay = !!shots;
            const whatList = [...(props.get(key) ?? [])];
            const pick =
              cls === 'décision'
                ? decisionCard(family, r)
                : cls === 'proche' || cls === 'auto' || cls === 'correction'
                  ? `<label class="ok"><input type="checkbox" name="${esc(key)}" checked> appliquer</label>`
                  : '';
            const arrow = cls === 'décision' ? '' : r.new && r.new !== r.old ? `<b class="arrow">→</b>${glyph(family, r.new)}<code>${esc(r.new)}</code>${r.name ? ` <i>${esc(r.name)}</i>` : ''}` : r.name ? ` <i>${esc(r.name)}</i>` : '';
            // Une seule étiquette quand deux disent la même chose (« retrait » et « retrait intérieur ») : la plus explicite.
            const usageList = (r.usages ?? []).filter((/** @type {string} */ u) => !whatList.some((w) => w === u || w.startsWith(`${u} `)));
            const usage = usageList.map((/** @type {string} */ x) => `<span class="usage">${esc(x)}</span>`).join('');
            const what = whatList.map((x) => `<span class="quoi">${esc(x)}</span>`).join('');
            const decision = cls === 'décision';
            const choice = decision ? '<span class="choix">Pas encore choisie</span>' : '<span class="choix"></span>';
            const head = `<p class="titre"><b class="id">${esc(r.id ?? '')}</b> ${esc(r.title ?? '')}${choice}</p>`;
            return `<article class="row c-${isOut(cls) ? 'hors' : esc(cls)}${decision ? ' decision a-trancher' : ''}${twoWay ? ' avant-apres' : ''}" data-key="${esc(key)}"${decision || twoWay ? ' tabindex="0"' : ''}>
  ${head}
  <header>${glyph(family, r.old)}<code>${esc(r.old)}</code>${arrow}${usage}${what}</header>
  ${decision || r.capture ? portee(r) : ''}
  ${pick}${shots}
  ${detail(family, r, key, cls)}
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
  .row.refuse, .row.refuse.c-proche, .row.refuse.c-auto, .row.refuse.c-correction { border-color:#9aa0aa; border-left-color:#9aa0aa; }
  .detail { margin:8px 0 0; } .detail summary { font-weight:500; font-size:13px; color:var(--soft); padding:2px 0; }
  .detail dl { display:grid; grid-template-columns:max-content 1fr; gap:4px 12px; margin:6px 0 0; font-size:13px; }
  .detail dt { color:var(--soft); } .detail dd { margin:0; display:flex; flex-wrap:wrap; gap:4px; align-items:baseline; }
  .row header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .titre { margin:0 0 6px; font-weight:600; } .titre .id { font:600 12px/1.4 ui-monospace, Menlo, monospace; color:var(--soft); margin-right:6px; }
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
  .row.avant-apres:focus-visible { outline:3px solid #2563eb; outline-offset:2px; }
  .txt { line-height:1; font-weight:500; }
  .pick { display:flex; flex-direction:column; gap:4px; margin:10px 0 0; } .pick label, .ok { display:flex; align-items:center; gap:8px; cursor:pointer; }
  .ok { margin-top:8px; font-size:14px; }
  .shots { display:flex; flex-wrap:wrap; gap:10px; margin-top:10px; }
  .full { margin-top:10px; max-height:620px; overflow:auto; border-radius:8px; }
  .cmp.page { display:grid; }
  .row.decision:focus-visible { outline:3px solid #2563eb; outline-offset:2px; }
  .row.decision { border-left-color:#c5cad3; } .row.a-trancher { border:3px solid #ea580c; border-left-width:6px; }
  .row .titre { display:flex; align-items:baseline; gap:6px; } .choix { margin-left:auto; font-weight:400; font-size:14px; color:var(--soft); white-space:nowrap; }
  .versions { display:flex; flex-wrap:wrap; gap:6px; margin:10px 0 8px; }
  .versions .v { font:inherit; font-size:13px; display:inline-flex; align-items:center; gap:8px; text-align:left; border:1px solid var(--line); background:#fff; border-radius:8px; padding:5px 10px; cursor:pointer; color:var(--ink); }
  .versions .v .nom { display:flex; flex-direction:column; } .versions .v small { color:var(--soft); font-size:12px; }
  .versions .v[aria-pressed="true"] { border-color:#16181d; box-shadow:inset 0 0 0 1px #16181d; }
  .versions .v.retenue .nom::after { content:"choisie"; font-size:11px; font-weight:600; color:var(--go); }
  .vue { display:grid; position:relative; max-width:100%; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; }
  .vue .ver { grid-area:1 / 1; position:relative; line-height:0; } .vue .ver[hidden] { display:none; }
  .vue img { display:block; width:100%; height:auto; }
  .zone { position:absolute; min-width:1px; min-height:1px; background:repeating-linear-gradient(45deg, rgba(226,87,43,.55) 0 2px, rgba(226,87,43,.12) 2px 5px); outline:1px solid #e2572b; pointer-events:none; }
  .cote { position:absolute; transform:translate(-50%, -50%); background:#e2572b; color:#fff; font:600 11px/1 ui-monospace, Menlo, monospace; padding:2px 4px; border-radius:3px; white-space:nowrap; pointer-events:none; }
  .cote.bout { font-size:9px; padding:1px 3px; border-radius:2px; } .cote.bout.droite { transform:translate(-100%, -50%); } .cote.bout.bas { transform:translate(-50%, -100%); }
  body.sans-reperes .zone, body.sans-reperes .cote { display:none; }
  .portee { margin:6px 0 0; font-size:14px; color:var(--soft); }
  .vignettes { display:flex; flex-wrap:wrap; align-items:flex-end; gap:8px; margin-top:8px; }
  .vig { display:grid; position:relative; max-width:100%; border:1px solid var(--line); border-radius:6px; overflow:hidden; background:#fff; }
  .vig .ver { grid-area:1 / 1; position:relative; line-height:0; } .vig .ver[hidden] { display:none; } .vig img { display:block; width:100%; height:auto; }
  .encore { font-size:13px; color:var(--soft); padding-bottom:4px; }
  .trancher { display:flex; align-items:center; gap:10px; margin-top:10px; }
  .retenir { font:inherit; font-size:14px; font-weight:600; border:0; border-radius:6px; padding:7px 14px; cursor:pointer; background:#16181d; color:#fff; }
  .barre { position:fixed; left:0; right:0; bottom:0; background:#16181d; color:#fff; padding:10px 24px; display:flex; gap:16px; align-items:center; justify-content:center; font-size:14px; }
  .barre label { display:inline-flex; align-items:center; gap:6px; cursor:pointer; }
  #ecartees { color:#f6c39f; }
  .barre .raz[data-confirmer] { background:#ea580c; color:#fff; }
  .barre button { font:inherit; border:0; border-radius:6px; padding:7px 14px; cursor:pointer; background:#fff; color:#16181d; font-weight:600; }
</style>
</head>
<body>
<main>
<h1>Revue de la réduction : ${esc(meta.host)}</h1>
<p class="lede">${esc(meta.stamp)} · cible : <code>${esc(meta.target)}</code> · ${pages.length} page(s) simulée(s). Rien n’a été modifié sur le site : les nouvelles valeurs sont posées dans le navigateur de l’audit, le temps des captures. Les pseudo-éléments (icônes) ne sont pas simulés.</p>
<p class="lede"><b>Pour voir un changement</b> : choisis « avant » ou « après » au-dessus de la capture (ou <code>←</code> <code>→</code> quand la carte a le focus), l’image change au même endroit. Chaque capture ne contient que le changement de sa ligne. La touche <code>Espace</code> bascule toutes les captures à la fois.</p>
<p class="lede"><b>Pour trancher une décision</b> : parcours ses versions (clic, ou <code>←</code> <code>→</code> quand la carte a le focus), puis « Choisir cette version » (ou <code>Entrée</code>). Afficher une version ne change rien à l’export ; une décision pas encore choisie n’y figure pas, l’actuelle choisie y vaut <code>false</code>.</p>
${sections}
<h2>Pages entières</h2>
<p class="lede">Avec toutes les propositions appliquées. Clique dans la page pour basculer.</p>
${full || '<p class="lede">Aucune capture de page.</p>'}
</main>
<div class="barre"><span id="bilan"></span><span id="ecartees" hidden>décisions du fichier écartées</span><button id="suivante" type="button">Suivante à choisir</button><button id="tout" type="button">Tout basculer</button><label><input id="reperes" type="checkbox" checked> repères</label><button id="export" type="button">Exporter mes décisions</button><button id="raz" type="button" class="raz">Tout remettre à zéro</button></div>
<script>
(function () {
  // Mémoire propre à chaque réduction : hôte et horodatage.
  var KEY = 'ds-lab-revue:' + ${JSON.stringify(meta.host)} + ':' + ${JSON.stringify(meta.stamp)};
  var previous = ${JSON.stringify(meta.decisions).replace(/</g, '\\u003c')};
  // Décisions venues de --decisions : écartées par une remise à zéro, jusqu'à la prochaine réduction.
  var FILE_KEY = KEY + ':fichier';
  var discarded = false;
  try { discarded = localStorage.getItem(FILE_KEY) === 'écartées'; } catch (e) {}
  var hasFile = Object.keys(previous).length > 0;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  var state = Object.assign({}, discarded ? {} : previous, saved);
  function showDiscarded() { document.getElementById('ecartees').hidden = !(discarded && hasFile); }
  showDiscarded();
  function rows() { return Array.prototype.slice.call(document.querySelectorAll('.row[data-key]')); }
  // Décisions : une version affichée (sans effet sur l'export), une version retenue (exportée).
  function versionsOf(row) { return Array.prototype.slice.call(row.querySelectorAll('.versions .v')); }
  function shown(row) { return Number(row.getAttribute('data-vue') || 0); }
  function show(row, i) {
    var vs = versionsOf(row); if (!vs.length) return;
    i = Math.max(0, Math.min(vs.length - 1, i));
    row.setAttribute('data-vue', String(i));
    vs.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === i)); });
    row.querySelectorAll('.vue .ver, .vig .ver').forEach(function (f) { f.hidden = Number(f.getAttribute('data-v')) !== i; });
  }
  function retain(row, i, imposed) {
    var vs = versionsOf(row);
    row.classList.remove('a-trancher');
    vs.forEach(function (b, j) { b.classList.toggle('retenue', j === i); });
    if (i >= 0) { row.setAttribute('data-retenu', String(i)); row.removeAttribute('data-impose'); }
    else { row.removeAttribute('data-retenu'); row.setAttribute('data-impose', imposed); }
    var choix = row.querySelector('.choix');
    if (choix) choix.textContent = i === 0 ? 'Gardée : ' + vs[0].getAttribute('data-court') : 'Choisie : ' + (i > 0 ? vs[i].getAttribute('data-court') : imposed);
  }
  function restore() {
    rows().forEach(function (row) {
      var k = row.getAttribute('data-key'); if (!(k in state)) return;
      var v = state[k];
      var box = row.querySelector('input[type=checkbox]');
      if (box) box.checked = v !== false;
      if (row.classList.contains('decision')) {
        var vs = versionsOf(row);
        var i = v === false ? 0 : vs.map(function (b) { return b.getAttribute('data-value'); }).indexOf(v);
        retain(row, i, v);
        if (i >= 0) show(row, i);
      }
    });
  }
  function collect() {
    var out = {};
    rows().forEach(function (row) {
      var k = row.getAttribute('data-key');
      var refused = false;
      if (row.classList.contains('decision')) {
        // Non tranchée : absente ; l'actuelle retenue : false ; sinon la valeur retenue.
        var r = row.getAttribute('data-retenu');
        if (r !== null) {
          if (r === '0') { out[k] = false; refused = true; }
          else out[k] = versionsOf(row)[Number(r)].getAttribute('data-value');
        } else if (row.hasAttribute('data-impose')) out[k] = row.getAttribute('data-impose');
      } else {
        var box = row.querySelector('input[type=checkbox]');
        if (box && !box.checked) { out[k] = false; refused = true; }
        var choix = row.querySelector('.choix');
        if (choix && box) choix.textContent = refused ? 'Refusé' : '';
      }
      row.classList.toggle('refuse', refused && !row.classList.contains('decision'));
    });
    return out;
  }
  function refresh(save) {
    state = collect();
    if (save !== false) try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    var total = document.querySelectorAll('.row.decision').length;
    var open = document.querySelectorAll('.row.a-trancher').length;
    document.getElementById('bilan').textContent = (total - open) + ' / ' + total + ' choisies';
  }
  // Suivante à choisir : la première carte pas encore choisie après celle qui a le focus.
  document.getElementById('suivante').addEventListener('click', function () {
    var open = Array.prototype.slice.call(document.querySelectorAll('.row.a-trancher'));
    if (!open.length) return;
    var here = document.activeElement && document.activeElement.closest ? document.activeElement.closest('.row.decision') : null;
    var next = here ? open.filter(function (r) { return here.compareDocumentPosition(r) & Node.DOCUMENT_POSITION_FOLLOWING; })[0] || open[0] : open[0];
    next.scrollIntoView({ block: 'center' });
    next.focus({ preventScroll: true });
  });
  // Tout remettre à zéro : un second clic confirme, sans boîte de dialogue.
  var raz = document.getElementById('raz');
  var razTimer = null;
  raz.addEventListener('click', function () {
    if (!raz.hasAttribute('data-confirmer')) {
      raz.setAttribute('data-confirmer', '');
      raz.textContent = 'Cliquer encore pour tout remettre à zéro';
      razTimer = setTimeout(function () { raz.removeAttribute('data-confirmer'); raz.textContent = 'Tout remettre à zéro'; }, 4000);
      return;
    }
    clearTimeout(razTimer);
    raz.removeAttribute('data-confirmer');
    raz.textContent = 'Tout remettre à zéro';
    try { localStorage.removeItem(KEY); } catch (e) {}
    if (hasFile) { discarded = true; try { localStorage.setItem(FILE_KEY, 'écartées'); } catch (e) {} }
    showDiscarded();
    rows().forEach(function (row) {
      var box = row.querySelector('input[type=checkbox]');
      if (box) box.checked = true;
      if (row.classList.contains('decision')) {
        row.classList.add('a-trancher');
        row.removeAttribute('data-retenu'); row.removeAttribute('data-impose');
        versionsOf(row).forEach(function (b) { b.classList.remove('retenue'); });
        var choix = row.querySelector('.choix'); if (choix) choix.textContent = 'Pas encore choisie';
        show(row, 0);
      }
    });
    refresh(false);
  });
  restore(); refresh(false);
  document.addEventListener('change', function (e) {
    if (e.target && e.target.id === 'reperes') { document.body.classList.toggle('sans-reperes', !e.target.checked); return; }
    refresh();
  });
  function flip(el, etat) { el.setAttribute('data-etat', etat || (el.getAttribute('data-etat') === 'avant' ? 'apres' : 'avant')); }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null; if (!t) return;
    var c = t.closest('.cmp');
    if (c) { flip(c); return; }
    var row = t.closest('.row.decision, .row.avant-apres'); if (!row) return;
    var v = t.closest('.versions .v');
    if (v) { show(row, Number(v.getAttribute('data-v'))); return; }
    if (row.classList.contains('decision') && t.closest('.retenir')) { retain(row, shown(row)); refresh(); }
  });
  var global = 'avant';
  function flipAll() {
    global = global === 'avant' ? 'apres' : 'avant';
    document.querySelectorAll('.cmp').forEach(function (c) { flip(c, global); });
    document.querySelectorAll('.row.avant-apres').forEach(function (r) { show(r, global === 'apres' ? 1 : 0); });
  }
  document.getElementById('tout').addEventListener('click', flipAll);
  document.addEventListener('keydown', function (e) {
    var row = e.target && e.target.closest ? e.target.closest('.row.decision, .row.avant-apres') : null;
    if (row && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { e.preventDefault(); show(row, shown(row) + (e.key === 'ArrowRight' ? 1 : -1)); return; }
    if (row && row.classList.contains('decision') && e.key === 'Enter' && e.target === row) { e.preventDefault(); retain(row, shown(row)); refresh(); return; }
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
