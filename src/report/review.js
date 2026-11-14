// @ts-check
/**
 * Page de revue de la réduction (revue.html) : la table ancien → nouveau,
 * classe par classe, avec pour chaque changement des captures avant et après
 * et un choix à faire. Les choix s'exportent en decisions.json, que la commande
 * reduce relit au tour suivant (--decisions). Un seul fichier, sans dépendance.
 * Toute chaîne venue de la page auditée est échappée.
 */
import { ALL_CLASSES, OUT, rowKey, isOut, decisionFor, APPLIED, WHERE_TO_FIX, marginRow, M_REASONS, nearestOf, tieOf } from '../reduce/propose.js';

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
 * Lot J : J8, élément hors de la page, sans capture ; J6, toutes les versions donnent la même image.
 * @param {any} capture @param {any[]} shots  versions capturées
 */
function captureNotes(capture, shots) {
  if (capture?.offPage) return '<p class="sans-capture">hors de la page, visible seulement au focus : pas de capture</p>';
  const pngs = shots.map((v) => v?.shot?.png).filter(Boolean);
  return pngs.length > 1 && pngs.length === shots.length && pngs.every((x) => x === pngs[0]) ? '<p class="sans-effet">sans effet visible sur les captures</p>' : '';
}

/**
 * Lot P-fin : légende d'une version dont la marge est absorbée par celle du voisin, plus grande
 * (« espace visible 16 px, la marge du voisin l'emporte ») ; une par version, qui suit la version affichée.
 * @param {any[]} versions
 */
function absorbedNotes(versions) {
  return versions
    .map((v, i) => {
      const z = (v.space ?? []).find((/** @type {any} */ x) => x.absorbed);
      return z ? `<p class="absorbe" data-v="${i}"${i ? ' hidden' : ''}>espace visible ${fr(z.visiblePx)} px, la marge du voisin l’emporte</p>` : '';
    })
    .join('');
}

/**
 * Lot M : l'autre côté de la paire la plus défavorable, après la table, et sa valeur d'aujourd'hui quand elle change.
 * @param {string | undefined} usage @param {{ text: string, bg: string, bgToday?: string, textToday?: string }} c
 */
export function contrastSide(usage, c) {
  if (usage === 'texte' || usage === 'bordure')
    return c.bgToday ? `sur le fond le moins favorable après la table (${c.bg}, aujourd’hui ${c.bgToday})` : `sur le fond le moins favorable ${c.bg}`;
  return c.textToday ? `avec le texte le moins favorable après la table (${c.text}, aujourd’hui ${c.textToday})` : `avec le texte le moins favorable ${c.text}`;
}

/**
 * Lot R : contraste d'une version de couleur : « 4,35 · sous le seuil de 4,5 », puis la couleur
 * réelle de l'autre côté de la paire (le texte posé sur un fond, le fond sous un texte ou une bordure).
 * Lot M : la paire est la plus défavorable de la ligne, sur toutes les pages, après la table.
 * @param {string | undefined} usage @param {{ ratio: number, threshold: number, text: string, bg: string, bgToday?: string, textToday?: string }} c
 */
function contrastLine(usage, c) {
  const pass = c.ratio >= c.threshold - 1e-9;
  // Lot M : la paire la plus défavorable de toute la ligne (toutes pages), après la table, comme le détail.
  const other = contrastSide(usage, c);
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
  if (r.capture?.offPage) return captureNotes(r.capture, []);
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
    .join('')}</div>${absorbedNotes(vs.slice(0, 2))}${captureNotes(r.capture, vs.slice(0, 2))}`;
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
  const nearest = nearestOf(r);
  /** @param {{ delta: number }} c */
  const gapOf = (c) => (family === 'colors' ? `écart ΔE ${fr(c.delta)}` : `écart ${fr(c.delta)} px`);
  const gap = nearest ? gapOf(nearest) : '';
  // Lot C : à égalité d'écart, les deux candidats affichent leur écart ; le défaut le dit.
  const tie = tieOf(r.candidates ?? []);
  const partner = tie && nearest && tie.includes(nearest.value) ? tie.find((v) => v !== nearest.value) : null;
  const partnerC = partner ? r.candidates.find((/** @type {any} */ c) => c.value === partner) : null;
  const buttons = versions
    .map((/** @type {any} */ v, /** @type {number} */ i) => {
      const name = i === 0 ? `actuelle · ${short(family, v.value)}` : `${short(family, v.value)}${stepName(family, v) ? ` · ${stepName(family, v)}` : ''}`;
      const note =
        i === 0
          ? '<small>la choisir garde la valeur</small>'
          : nearest && v.value === nearest.value && gap
            ? `<small class="ecart">le plus proche${partner ? `, à égalité avec ${esc(short(family, partner))}` : ''} · ${esc(gap)}</small>`
            : partnerC && v.value === partner
              ? `<small class="ecart">${esc(gapOf(partnerC))}</small>`
              : '';
      const ctr = v.contrast ? contrastLine(r.usage, v.contrast) : '';
      // Lot J, J1 : candidat qui échoue au contraste alors que l'actuelle passe : grisé, avec sa raison,
      // toujours cliquable ; le grisé du lot C (marges) ne le touche pas (data-contraste). J2 : pas hors tranche.
      const c = i === 0 ? null : (r.candidates ?? []).find((/** @type {any} */ x) => x.value === v.value);
      const fails = c?.fails ? `<small class="raison-contraste">${fr(c.fails.ratio)} sous le seuil de ${fr(c.fails.threshold)}, alors que l’actuelle passe</small>` : '';
      const out = c?.outOfSlice ? '<small>hors tranche</small>' : '';
      return `<button type="button" class="v${c?.fails ? ' grise' : ''}" data-v="${i}" data-value="${esc(v.value)}" data-court="${esc(short(family, v.value))}"${c?.fails ? ' data-contraste' : ''} aria-pressed="${i === 0}">${glyph(family, v.value)}<span class="nom"><span>${esc(name)}</span>${note}${out}${ctr}${fails}</span></button>`;
    })
    .join('');
  const shot0 = versions[0].shot;
  const scale = shot0 && shot0.width < SMALL_FRAME ? 2 : 1;
  const view = shot0
    ? `<div class="vue" style="width:${shot0.width * scale}px;aspect-ratio:${shot0.width} / ${shot0.height}">${versions
        .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}${zones(v.shot, v.space ?? [])}</div>`)
        .join('')}</div>${absorbedNotes(versions)}`
    : '';
  const notes = captureNotes(r.capture, versions);
  // Une vignette par autre élément touché, 3 au plus, à la taille CSS de son cadre plafonnée à 240 px ;
  // chacune suit la version affichée.
  const others = r.capture?.others ?? [];
  const more = (r.capture?.elements ?? 0) - 1 - others.length;
  const thumbs = others.length
    ? `<div class="vignettes">${others
        .map(
          (/** @type {any} */ o) =>
            `<figure class="vig-bloc" style="width:${Math.min(o.clip.width, THUMB_MAX)}px"><div class="vig" style="width:${Math.min(o.clip.width, THUMB_MAX)}px;aspect-ratio:${o.clip.width} / ${o.clip.height}">${o.versions
              .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}${zones(v.shot, v.space ?? [], { end: true })}</div>`)
              .join('')}</div>${absorbedNotes(o.versions)}</figure>`,
        )
        .join('')}${more > 0 ? `<span class="encore">et ${more} ${more === 1 ? 'autre' : 'autres'}</span>` : ''}</div>`
    : '';
  // Lot J, J2 : aucun pas de la tranche ne garde le contraste.
  const hole = r.hole ? `<p class="trou">la cible ne couvre pas ce cas : aucun pas ${esc(r.hole.slice)} de ${esc(r.hole.scale)} ne garde le contraste de l’actuelle ; les pas de ${esc(r.hole.scale)} hors tranche qui passent sont proposés</p>` : '';
  return `${hole}<div class="versions" role="group" aria-label="Versions">${buttons}</div>
  ${view}${notes}${thumbs}
  <div class="trancher"><button type="button" class="retenir">Choisir cette version</button></div>`;
}

/**
 * Lot R : motif réécrit en clair, et la règle qui l'impose. Un motif inconnu reste tel quel.
 * @param {string} reason
 * @returns {{ text: string, rule: string | null }}
 */
export function plainReason(reason) {
  const rule = /\(([RM]\d+)\)\s*$/.exec(reason)?.[1] ?? null;
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
    [/^échelle de statut réservée aux états/, () => 'cette couleur tombe sur une échelle de statut (erreur, succès), réservée aux vrais états : champ invalide, alerte, message relié à un champ. Ici, ce n’en est pas un : la couleur est à choisir'],
    [/^correction de couleur de marque à plus de 10/, () => 'couleur de marque peu lisible : la valeur la plus proche qui reste lisible sur tous ses fonds s’en écarte de plus de ΔE 10, ce qui change la marque. La correction n’est pas appliquée d’office : elle est à choisir'],
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
 * Lot M : note visible d'une carte de couleur de marque — pourquoi elle est à choisir (M4, M5),
 * et la seconde version (M6) ou pourquoi il n'y en a pas.
 * @param {any} r
 */
function brandNote(r) {
  /** @type {string[]} */
  const lines = [];
  if (r.reason === M_REASONS.M5) lines.push(`Couleur de marque : la valeur la plus proche lisible sur tous ses fonds (${r.name}, ${r.new}) s’en écarte de ΔE ${fr(r.delta)}. À choisir.`);
  if (r.reason === M_REASONS.M4) lines.push(`Échelle de statut réservée aux vrais états : ${r.name ? `${r.name.replace(/-\d+$/, '')} ` : ''}ne vaut ici pour aucun champ invalide, alerte ou message relié. À choisir.`);
  for (const a of r.alternatives ?? []) {
    const moves = a.backgrounds.map((/** @type {any} */ b) => `le fond ${b.from} passe à ${b.name} (${b.to})`).join(' et ');
    const n = a.exceptions.reduce((/** @type {number} */ t, /** @type {any} */ x) => t + x.elements, 0);
    const where = a.exceptions
      .map((/** @type {any} */ x) => `${a.exceptions.length > 1 ? `${x.elements} ` : ''}sur le fond ${x.background}, page ${x.pages.join(', ')} (${x.selectors.join(', ')})`)
      .join(' ; ');
    lines.push(
      `Seconde version : ${a.name} (${a.new}), plus proche de la couleur d’origine, lisible${moves ? ` si ${moves}` : ''}${n ? `${moves ? ',' : ''} partout sauf ${n} ${n === 1 ? 'élément' : 'éléments'} en exception : ${where}. Aucun fond proche (ΔE ≤ 5) ne les rend lisibles : ils gardent ${r.name} (${r.new}), et la consigne les met à part` : ''}.`,
    );
  }
  return lines.length ? `<p class="marque">${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</p>` : '';
}

/** Lot P, étape 3 : où corriger, en clair, d'après la relation de la marge. */
const WHERE_TEXT = /** @type {Record<string, string>} */ ({
  'dans le composant': 'dans le composant : la marge relie deux parties du même composant ; corrige-la dans la feuille du composant, pas dans la page',
  'entre composants': 'dans la page : la marge sépare deux composants ; corrige-la dans la mise en page qui les assemble (conteneur, gouttière), pas dans le composant',
  inconnue: 'à vérifier : aucun élément voisin de ce côté (texte seul, ou marge fusionnée avec le parent) ; regarde la page avant de corriger',
});

/** @param {{ text: string, n: number }[]} list */
const withCounts = (list) => list.map((x) => `${x.text} (${x.n})`).join(', ');

/** Lot P, étape 3 : relation, signal et lieu de correction d'une marge. @param {any} r */
function relationDetail(r) {
  // Lot P-fin : marge non coupée, relations réunies.
  if (!r.scope && r.scopes?.length) {
    const rel = r.scopes.map((/** @type {any} */ x) => `${x.text === 'inconnue' ? 'relation inconnue' : x.text} (${x.n})`).join(', ');
    const where = r.scopes.length === 1 ? WHERE_TEXT[r.scopes[0].text] : 'à vérifier élément par élément : la ligne réunit plusieurs relations, aucune dans le composant';
    return `<dt>Relation</dt><dd>${esc(rel)}</dd>${r.signals?.length ? `<dt>Signal</dt><dd>${esc(withCounts(r.signals))}</dd>` : ''}<dt>Où corriger</dt><dd>${esc(where ?? '')}</dd>`;
  }
  if (!r.scope) return '';
  const rel = r.scope === 'inconnue' ? 'relation inconnue' : `${r.scope}${r.relations?.length ? ` · ${withCounts(r.relations)}` : ''}`;
  return `<dt>Relation</dt><dd>${esc(rel)}</dd>${r.signals?.length ? `<dt>Signal</dt><dd>${esc(withCounts(r.signals))}</dd>` : ''}<dt>Où corriger</dt><dd>${esc(WHERE_TEXT[r.scope] ?? WHERE_TO_FIX[r.scope] ?? '')}</dd>`;
}

/**
 * Lot R : « Détail » d'une carte, fermé par défaut, en bas de la carte : motif en clair,
 * contrastes chiffrés, usages, sélecteurs, clé technique. Le contraste « après » est celui de
 * la valeur la plus proche pour une décision, de la valeur proposée sinon.
 * @param {string} family @param {any} r @param {string} key @param {string} cls
 */
function detail(family, r, key, cls) {
  // Lot M (M5) : la valeur proposée est la plus proche lisible sur tous ses fonds, pas la plus proche.
  const readable = r.reason === M_REASONS.M5;
  const label = readable ? 'la valeur la plus proche lisible sur tous ses fonds' : cls === 'décision' ? 'la valeur la plus proche' : 'la valeur proposée';
  const against = `avec ${label}`;
  const ctr = r.contrast ? `<dt>Contraste</dt><dd>${fr(r.contrast.before)} avant → ${fr(r.contrast.after)} ${against} (seuil ${fr(r.contrast.threshold)})</dd>` : '';
  // Lot P-fin : l'écart en une phrase, avec la valeur visée ; le nombre d'usages seulement s'il ne répète pas la portée.
  const target = cls === 'décision' && !readable ? nearestOf(r)?.value : r.new;
  const ecart = r.delta && target ? `${family === 'colors' ? `ΔE ${fr(r.delta)}` : `${fr(r.delta)} px`} ${against} (${short(family, target)})` : '';
  const scope = r.capture?.elements ?? r.count;
  const usages = r.count !== scope ? `${r.count} occurrences relevées dans le rendu, sur ${scope} ${scope === 1 ? 'élément' : 'éléments'} (un élément peut porter la valeur sur plusieurs côtés)` : '';
  const motif = r.reason ? plainReason(r.reason) : null;
  // Sélecteurs : 4 au plus, puis « et n autres » ; sans capture, les exemples du relevé, dits coupés s'ils le sont.
  const full = !!r.capture?.touched?.length;
  const all = (full ? [...new Set(r.capture.touched.map((/** @type {any} */ t) => t.selector))] : r.selectors) ?? [];
  const sel = all.slice(0, SELECTORS_SHOWN);
  const more = all.length - sel.length;
  const cut = more > 0 ? `<i>et ${more} ${more === 1 ? 'autre' : 'autres'}</i>` : !full && all.length >= 3 && r.count > all.length ? '<i>et d’autres (liste coupée au relevé)</i>' : '';
  return `<details class="detail"><summary>Détail</summary><dl>
    ${motif ? `<dt>Motif</dt><dd>${esc(motif.text)}${motif.rule ? ` <i>(règle ${esc(motif.rule)})</i>` : ''}</dd>` : ''}
    ${r.slot ? `<dt>Emplacement</dt><dd>${esc(r.slot)} (valeur ou variante déclarée dans la cible)</dd>` : ''}
    ${relationDetail(r)}${ctr}${ecart ? `<dt>Écart</dt><dd>${esc(ecart)}</dd>` : ''}${usages ? `<dt>Usages</dt><dd>${esc(usages)}</dd>` : ''}
    <dt>Sélecteurs</dt><dd>${sel.map((/** @type {string} */ x) => `<code>${esc(x)}</code>`).join(' ')}${cut}</dd>
    <dt>Clé technique</dt><dd><code>${esc(key)}</code></dd>
  </dl></details>`;
}

/**
 * Lot P, étape 3 : paires contrôlées (P3) pour la revue, dédoublonnées. Chaque marge porte la clé
 * de sa ligne, sa valeur actuelle et la proposition appliquée par défaut. Seules les paires dont
 * une ligne se choisit (décision, proche, d'office, correction) sont gardées ; `before` : la
 * hiérarchie était déjà égale ou inversée avant la revue.
 * @param {any} table
 */
function controlPairs(table) {
  const rows = table.families?.spacing?.rows ?? [];
  /** @param {string} old @param {string} scope */
  const rowOf = (old, scope) => marginRow(rows, old, scope);
  /** @param {any} sp */
  const side = (sp) => ({
    mode: sp.mode,
    extra: sp.extra,
    parts: sp.parts.map((/** @type {string} */ old) => {
      const r = rowOf(old, sp.scope);
      return { key: r ? rowKey('spacing', r) : null, old, applied: r && APPLIED.has(r.class) && r.new ? r.new : null, choice: !!r && ['décision', 'proche', 'auto', 'correction'].includes(r.class) };
    }),
  });
  /** @type {Map<string, any>} */
  const out = new Map();
  for (const x of table.proximity ?? []) {
    if (!x.roles) continue;
    const p = { roles: x.roles, facing: x.facing, toward: x.toward, before: x.in.gapPx >= x.out.gapPx, in: side(x.in), out: side(x.out) };
    if (![...p.in.parts, ...p.out.parts].some((q) => q.choice)) continue;
    for (const q of [...p.in.parts, ...p.out.parts]) delete q.choice;
    const k = JSON.stringify(p);
    if (!out.has(k)) out.set(k, p);
  }
  return [...out.values()];
}

/** Lot C (C12) : étiquette d'usage du bilan. */
const BILAN_LABELS = /** @type {Record<string, string>} */ ({ marge: 'Marge', retrait: 'Retrait', 'gouttière': 'Gouttière', rayon: 'Rayon', pilule: 'Pilule' });
/** Familles numériques du bilan, dans l'ordre d'affichage. */
const BILAN_FAMILIES = ['spacing', 'radii', 'fontSizes'];

/**
 * Lot C (C12) : lignes numériques de la table pour le bilan par usage (hors table exclues : leur
 * valeur n'est pas rangée sur l'échelle). Chaque entrée porte sa clé, sa valeur actuelle et la proposition.
 * @param {any} table
 */
function usageBilan(table) {
  /** @type {{ label: string, rows: { key: string, old: string, new: string | null }[] }[]} */
  const out = [];
  for (const family of BILAN_FAMILIES) {
    const rows = table.families?.[family]?.rows ?? [];
    /** @type {Map<string, { key: string, old: string, new: string | null }[]>} */
    const byUsage = new Map();
    for (const r of rows) {
      if (isOut(r.class) || r.class === 'hors table') continue;
      const label = family === 'fontSizes' ? 'Taille du texte' : BILAN_LABELS[r.usage] ?? (r.usage ? r.usage[0].toUpperCase() + r.usage.slice(1) : FAMILY_LABELS[family] ?? family);
      byUsage.set(label, [...(byUsage.get(label) ?? []), { key: rowKey(family, r), old: r.old, new: r.new ?? null }]);
    }
    const order = Object.values(BILAN_LABELS);
    for (const label of [...byUsage.keys()].sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b, 'fr')))
      out.push({ label, rows: /** @type {any} */ (byUsage.get(label)) });
  }
  return out;
}

/**
 * @param {ReturnType<typeof import('../reduce/propose.js').propose>} table
 * @param {{ url: string, changes: import('../browser/simulate.js').SimulatedChange[], before: string | null, after: string | null }[]} pages
 * @param {{ host: string, stamp: string, target: string, decisions: Record<string, string | false> }} meta
 */
/**
 * Lot K : carte « Texte sur plein <échelle> ». Trois versions (onSolid sur le pas 9, texte d'origine
 * sur le pas 10 si le contraste passe, garder), chacune avec sa capture et son contraste ; aucune
 * recommandée ni présélectionnée. Les lignes de fond qui mènent à ce plein suivent la carte.
 * @param {any} g
 */
function pleinCard(g, pageIndex = /** @type {Map<string, number>} */ (new Map())) {
  const vs = g.versions;
  const shots = g.capture?.versions ?? [];
  const buttons = vs
    .map((/** @type {any} */ v, /** @type {number} */ i) => {
      const pass = v.pass ? `passe le seuil de ${fr(v.threshold)}` : 'sous le seuil';
      const sw = hex(v.bg) && hex(v.text) ? `<span class="g sw paire" style="background:${v.bg};color:${v.text}">Aa</span>` : '<span class="g sw vide"></span>';
      return `<button type="button" class="v" data-v="${i}" data-value="${esc(v.choice)}" data-court="${esc(v.label)}" aria-pressed="${i === 0}">${sw}<span class="nom"><span>${esc(v.label)}</span><small>${esc(v.text)} sur ${esc(v.bg)}</small><small>${String(v.ratio).replace('.', ',')} · ${pass}</small></span></button>`;
    })
    .join('');
  const s0 = shots[0]?.shot;
  const scale = s0 && s0.width < SMALL_FRAME ? 2 : 1;
  const view = s0
    ? `<div class="vue" style="width:${s0.width * scale}px;aspect-ratio:${s0.width} / ${s0.height}">${shots
        .map((/** @type {any} */ v, /** @type {number} */ i) => `<div class="ver" data-v="${i}"${i ? ' hidden' : ''}>${img(v.shot.png)}</div>`)
        .join('')}</div>`
    : '';
  const n = g.elements.length;
  const rows = g.rows.map((/** @type {any} */ r) => `${r.id} (${r.old})`).join(', ');
  const els = g.elements.map((/** @type {any} */ e) => `<li><code>${esc(e.selector)}</code> ${esc(e.text)} <i>fond ${esc(e.bg)}, ${esc(e.page)}</i></li>`).join('');
  return `<article class="row decision a-trancher plein" data-key="${esc(g.key)}" tabindex="0"${anchorOf(g.capture, pageIndex)}>
  <p class="titre"><b class="id">${esc(g.id)}</b> ${esc(g.title)}<span class="choix">Pas encore choisie</span></p>
  <p class="portee">Ce choix s’applique à ${n} ${n === 1 ? 'élément' : 'éléments'} : tous les textes posés sur un plein ${esc(g.scale)}, y compris ceux dont le fond est déjà sur la cible. Les lignes de fond ${esc(rows)} suivent ce choix.</p>
  <div class="versions" role="group" aria-label="Versions">${buttons}</div>
  ${view}${captureNotes(g.capture, shots)}
  <div class="trancher"><button type="button" class="retenir">Choisir cette version</button></div>
  <details class="detail"><summary>Détail</summary><dl>
    <dt>Éléments</dt><dd><ul class="couverts">${els}</ul></dd>
    <dt>Versions</dt><dd>onSolid : le texte prend l’onSolid ${esc(g.onSolid)}, fonds au pas 9 ; pas-10 : fonds au pas 10, texte gardé (seulement si chaque texte y passe) ; ${g.tints ? 'teinte : fonds au pas 9, chaque texte prend le pas de sa propre échelle le plus proche qui passe ; ' : ''}garder : fonds au pas 9, texte gardé.</dd>
    <dt>Clé technique</dt><dd><code>${esc(g.key)}</code></dd>
  </dl></details>
</article>`;
}

/**
 * Lot K : une ligne de fond qui suit une carte de plein : pas de choix à elle ; une décision de
 * ligne lue dans le fichier est ignorée, et la carte le dit.
 * @param {any} pl  r.plein
 */
const followsPlein = (pl) =>
  `<p class="suit">suit la carte ${esc(pl.title)} (${pl.choice ? `choix : ${esc(pl.choice)}` : 'pas encore choisie'})</p>${
    pl.ignored !== null && pl.ignored !== undefined ? `<p class="suit">décision de ligne ignorée (${esc(pl.ignored === false ? 'false' : pl.ignored)}) : suit la carte</p>` : ''
  }`;

/**
 * Lot J, J7 : page de la carte (index de son image « avant » dans la revue) et position, en px CSS
 * de page, de son premier élément ; un élément hors de la page renvoie au haut de la page.
 * @param {any} capture @param {Map<string, number>} pageIndex
 */
function anchorOf(capture, pageIndex) {
  if (!capture?.page || !pageIndex.has(capture.page)) return '';
  const y = capture.offPage ? 0 : capture.y ?? (capture.clip?.y ?? 0) + (capture.versions?.[0]?.shot?.box?.y ?? 0);
  return ` data-page="${pageIndex.get(capture.page)}" data-y="${Math.max(0, Math.round(y))}" data-url="${esc(capture.page)}"`;
}

export function renderReview(table, pages, meta) {
  // Lot J, J7 : index des pages entières (image « avant »), pour le panneau.
  const shown = pages.filter((p) => p.before && p.after);
  /** @type {Map<string, number>} */
  const pageIndex = new Map(shown.map((p, i) => [p.url, i]));
  // Lot P, étape 3 : un choix enregistré sans relation (ou sans usage) vaut pour les lignes qui en sont issues ;
  // il est rangé sous la clé de chaque ligne, que l'export reprend.
  /** @type {Record<string, string | false>} */
  const previous = { ...meta.decisions };
  for (const [family, f] of Object.entries(table.families))
    for (const r of f.rows) {
      const k = rowKey(family, r);
      const d = decisionFor(meta.decisions, family, r);
      if (!(k in previous) && d !== undefined) previous[k] = d;
    }
  const pairs = controlPairs(table);
  const usageLines = usageBilan(table);
  /** @type {Set<string>} */
  const paired = new Set(pairs.flatMap((x) => [...x.in.parts, ...x.out.parts].map((q) => q.key).filter((k) => k !== null)));
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
            const pl = r.plein ?? null;
            const shots = cls === 'décision' || pl ? '' : beforeAfter(family, r);
            const twoWay = !!shots;
            const whatList = [...(props.get(key) ?? [])];
            const pick = pl
              ? followsPlein(pl)
              : cls === 'décision'
                ? decisionCard(family, r)
                : cls === 'proche' || cls === 'auto' || cls === 'correction'
                  ? `<label class="ok"><input type="checkbox" name="${esc(key)}" checked> appliquer</label>`
                  : '';
            const arrow = cls === 'décision' ? '' : r.new && r.new !== r.old ? `<b class="arrow">→</b>${glyph(family, r.new)}<code>${esc(r.new)}</code>${r.name ? ` <i>${esc(r.name)}</i>` : ''}` : r.name ? ` <i>${esc(r.name)}</i>` : '';
            // Une seule étiquette quand deux disent la même chose (« retrait » et « retrait intérieur ») : la plus explicite.
            const usageList = (r.usages ?? []).filter((/** @type {string} */ u) => !whatList.some((w) => w === u || w.startsWith(`${u} `)));
            const usage = usageList.map((/** @type {string} */ x) => `<span class="usage">${esc(x)}</span>`).join('');
            const what = whatList.map((x) => `<span class="quoi">${esc(x)}</span>`).join('');
            const decision = cls === 'décision' && !pl;
            const choice = decision ? '<span class="choix">Pas encore choisie</span>' : pl ? '<span class="choix">Suit la carte</span>' : '<span class="choix"></span>';
            const head = `<p class="titre"><b class="id">${esc(r.id ?? '')}</b> ${esc(r.title ?? '')}${choice}</p>`;
            // Lot V, étape 6 (D4) : même déclaration que d'autres lignes aux issues différentes (trace).
            const conflict = r.conflict
              ? `<p class="conflit">${typeof decisionFor(meta.decisions, family, r) === 'string' ? 'décidé, ' : ''}${r.conflict === 'total' ? 'non applicable' : 'en partie non applicable'} sans changer la structure (${(r.conflicts ?? [])
                  .map((/** @type {any} */ c) => `même déclaration : ${c.file}:${c.line} ${c.selector}${c.with?.length ? `, avec ${c.with.join(', ')}` : ''}`)
                  .map(esc)
                  .join(' ; ')})</p>`
              : '';
            return `<article class="row c-${isOut(cls) ? 'hors' : esc(cls)}${decision ? ' decision a-trancher' : ''}${twoWay ? ' avant-apres' : ''}" data-key="${esc(key)}"${decision || twoWay ? ' tabindex="0"' : ''}${anchorOf(r.capture, pageIndex)}>
  ${head}
  ${conflict}
  <header>${glyph(family, r.old)}<code>${esc(r.old)}</code>${arrow}${usage}${what}</header>
  ${(decision || r.capture) && !pl ? portee(r) : ''}
  ${paired.has(key) ? '<p class="controle" aria-live="polite" hidden></p>' : ''}
  ${family === 'colors' ? brandNote(r) : ''}
  ${pick}${shots}
  ${detail(family, r, key, cls)}
</article>`;
          })
          .join('\n');
        const open = cls === 'décision' || cls === 'proche' || cls === 'correction';
        return `<details${open ? ' open' : ''}><summary>${esc(title)} <span class="n">${rows.length}</span></summary>${help ? `<p class="lede">${esc(help)}</p>` : ''}${cards}</details>`;
      }).join('\n');
      // Lot K : cartes « Texte sur plein », en tête des couleurs.
      const pleins = family === 'colors' ? /** @type {any[]} */ (/** @type {any} */ (table).pleins ?? []) : [];
      const pleinCards = pleins.length
        ? `<details open><summary>Texte sur plein <span class="n">${pleins.length}</span></summary><p class="lede">${esc('Un texte posé sur un plein échoue au contraste. Une seule décision par plein : ses lignes de fond suivent le choix. Sans choix, rien n’est appliqué, ni texte ni fond.')}</p>${pleins.map((/** @type {any} */ g) => pleinCard(g, pageIndex)).join('\n')}</details>`
        : '';
      return `<section>
<h2>${esc(FAMILY_LABELS[family] ?? family)}</h2>
<p class="lede"><b>${s.before}</b> valeurs aujourd’hui → <b>${s.after}</b> sur la cible, pour ${s.occurrences} usages. ${s.decisions} décision(s), ${s.corrections ?? 0} correction(s), ${s.near} proche(s), ${s.auto} d’office, ${s.unchanged} déjà bonnes${s.outOfTable ? `, ${s.outOfTable} hors table` : ''}.</p>
${pleinCards}${byClass}
</section>`;
    })
    .join('\n');

  const full = shown
    .map(
      (p, i) =>
        `<details><summary>${esc(p.url)}</summary><div class="full"><button type="button" class="cmp page" data-etat="avant" title="Cliquer pour basculer entre avant et après"><div class="layer a" data-avant="${i}">${img(/** @type {string} */ (p.before))}</div><div class="layer b">${img(/** @type {string} */ (p.after))}</div><span class="etat"></span></button></div></details>`,
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
  main { max-width:1080px; margin:0 auto; padding:28px 24px 200px; }
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
  .versions .v.grise { background:#f1f2f4; border-style:dashed; border-color:#9aa0aa; color:#4a4f59; }
  .versions .v .raison { color:#7a3a00; max-width:34ch; white-space:normal; }
  .versions .v.retenue .nom::after { content:"choisie"; font-size:11px; font-weight:600; color:var(--go); }
  .vue { display:grid; position:relative; max-width:100%; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:#fff; }
  .vue .ver { grid-area:1 / 1; position:relative; line-height:0; } .vue .ver[hidden] { display:none; }
  .vue img { display:block; width:100%; height:auto; }
  .zone { position:absolute; min-width:1px; min-height:1px; background:repeating-linear-gradient(45deg, rgba(226,87,43,.55) 0 2px, rgba(226,87,43,.12) 2px 5px); outline:1px solid #e2572b; pointer-events:none; }
  .cote { position:absolute; transform:translate(-50%, -50%); background:#e2572b; color:#fff; font:600 11px/1 ui-monospace, Menlo, monospace; padding:2px 4px; border-radius:3px; white-space:nowrap; pointer-events:none; }
  .cote.bout { font-size:9px; padding:1px 3px; border-radius:2px; } .cote.bout.droite { transform:translate(-100%, -50%); } .cote.bout.bas { transform:translate(-50%, -100%); }
  body.sans-reperes .zone, body.sans-reperes .cote { display:none; }
  .portee { margin:6px 0 0; font-size:14px; color:var(--soft); }
  .controle { margin:8px 0 0; display:flex; flex-direction:column; gap:4px; font-size:14px; }
  .suit { margin:6px 0 0; font-size:14px; color:#7a3a00; } .sw.paire { display:inline-flex; align-items:center; justify-content:center; font:600 12px/1 system-ui, sans-serif; width:40px; }
  .row.plein { border-left-color:#b45309; } .couverts { margin:0; padding-left:18px; }
  .conflit { margin:6px 0 0; padding:4px 8px; border-left:3px solid currentColor; font-size:14px; }
  .marque { margin:8px 0 0; display:flex; flex-direction:column; gap:4px; font-size:14px; }
  .marque span { border-radius:6px; padding:6px 10px; background:#eef2fb; color:#1f3363; border:1px solid #a9b9e0; }
  .controle span { border-radius:6px; padding:6px 10px; }
  .controle .alerte { background:#fff4e5; color:#7a3a00; border:1px solid #f0b46b; }
  .controle .ok { background:#eaf6ee; color:#17603a; border:1px solid #9fd0b0; }
  .vignettes { display:flex; flex-wrap:wrap; align-items:flex-end; gap:8px; margin-top:8px; }
  .vig { display:grid; position:relative; max-width:100%; border:1px solid var(--line); border-radius:6px; overflow:hidden; background:#fff; }
  .vig .ver { grid-area:1 / 1; position:relative; line-height:0; } .vig .ver[hidden] { display:none; } .vig img { display:block; width:100%; height:auto; }
  .encore { font-size:13px; color:var(--soft); padding-bottom:4px; }
  .vig-bloc { margin:0; max-width:100%; display:flex; flex-direction:column; gap:4px; }
  .absorbe { margin:4px 0 0; font-size:12px; line-height:1.35; color:#7a3a00; } .absorbe[hidden] { display:none; }
  .raison-contraste { color:#7a3a00; }
  .trou { margin:6px 0; font-size:13px; line-height:1.35; color:#7a3a00; }
  .sans-capture, .sans-effet { margin:6px 0 0; font-size:12px; line-height:1.35; color:#4a4f59; font-style:italic; }
  .trancher { display:flex; align-items:center; gap:10px; margin-top:10px; }
  .retenir { font:inherit; font-size:14px; font-weight:600; border:0; border-radius:6px; padding:7px 14px; cursor:pointer; background:#16181d; color:#fff; }
  /* Lot J, J7 : panneau fixe à droite, la page telle qu'elle existe ; sous la carte active sur écran étroit. */
  .apercu { position:fixed; top:0; right:0; bottom:52px; width:min(34vw, 560px); background:#fff; border-left:1px solid var(--line); display:flex; flex-direction:column; z-index:4; }
  .apercu[hidden] { display:none; }
  .apercu-titre { margin:0; padding:6px 12px; font-size:12px; color:var(--soft); border-bottom:1px solid var(--line); overflow-wrap:anywhere; }
  .apercu-vue { flex:1; overflow:auto; }
  .apercu-vue img { display:block; width:100%; height:auto; }
  @media (min-width:1001px) { body.avec-apercu main { margin-right:min(34vw, 560px); } }
  @media (max-width:1000px) { .apercu { position:static; width:auto; height:50vh; border:1px solid var(--line); border-radius:8px; margin:8px 0 16px; } }
  .barre { position:fixed; left:0; right:0; bottom:0; background:#16181d; color:#fff; padding:10px 24px; display:flex; gap:16px; align-items:center; justify-content:center; font-size:14px; }
  .compte { display:flex; flex-direction:column; gap:2px; }
  #bilan-usages { list-style:none; margin:0; padding:0; font-size:12px; line-height:1.35; color:#d5d8de; display:grid; grid-template-columns:repeat(2, max-content); gap:0 18px; }
  #bilan-usages b { color:#fff; font-weight:600; }
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
<aside class="apercu" id="apercu" aria-label="La page telle qu’elle existe" hidden><p class="apercu-titre"></p><div class="apercu-vue"><img alt="La page telle qu’elle existe"></div></aside>
<div class="barre"><div class="compte"><span id="bilan"></span><ul id="bilan-usages" aria-label="Valeurs finales par usage" aria-live="polite"></ul></div><span id="ecartees" hidden>décisions du fichier écartées</span><button id="suivante" type="button">Suivante à choisir</button><button id="tout" type="button">Tout basculer</button><label><input id="reperes" type="checkbox" checked> repères</label><button id="export" type="button">Exporter mes décisions</button><button id="raz" type="button" class="raz">Tout remettre à zéro</button></div>
<script>
(function () {
  // Mémoire propre à chaque réduction : hôte et horodatage.
  var KEY = 'ds-lab-revue:' + ${JSON.stringify(meta.host)} + ':' + ${JSON.stringify(meta.stamp)};
  var previous = ${JSON.stringify(previous).replace(/</g, '\\u003c')};
  // Lot P, étape 3 : paires contrôlées (P3), recalculées à chaque choix.
  var PAIRS = ${JSON.stringify(pairs).replace(/</g, '\\u003c')};
  // Lot C (C12) : lignes numériques par usage, pour le bilan des valeurs finales.
  var BILAN = ${JSON.stringify(usageLines).replace(/</g, '\\u003c')};
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
    row.querySelectorAll('.vue .ver, .vig .ver, .absorbe').forEach(function (f) { f.hidden = Number(f.getAttribute('data-v')) !== i; });
  }
  function retain(row, i, imposed) {
    var vs = versionsOf(row);
    row.classList.remove('a-trancher');
    vs.forEach(function (b, j) { b.classList.toggle('retenue', j === i); });
    if (i >= 0) { row.setAttribute('data-retenu', String(i)); row.removeAttribute('data-impose'); }
    else { row.removeAttribute('data-retenu'); row.setAttribute('data-impose', imposed); }
    var choix = row.querySelector('.choix');
    var plein = row.classList.contains('plein');
    if (choix) choix.textContent = i === 0 && !plein ? 'Gardée : ' + vs[0].getAttribute('data-court') : 'Choisie : ' + (i >= 0 ? vs[i].getAttribute('data-court') : imposed);
  }
  function restore() {
    rows().forEach(function (row) {
      var k = row.getAttribute('data-key'); if (!(k in state)) return;
      var v = state[k];
      var box = row.querySelector('input[type=checkbox]');
      if (box) box.checked = v !== false;
      if (row.classList.contains('decision')) {
        var vs = versionsOf(row);
        var i = v === false && !row.classList.contains('plein') ? 0 : vs.map(function (b) { return b.getAttribute('data-value'); }).indexOf(v);
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
          if (r === '0' && !row.classList.contains('plein')) { out[k] = false; refused = true; }
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
  // Lot P, étape 3 : valeur d'une marge avec les choix de la revue. Décision : la version choisie,
  // l'ancienne sans choix ; ligne appliquée : la proposition, l'ancienne si elle est refusée.
  function byKey(k) { return rows().filter(function (r) { return r.getAttribute('data-key') === k; })[0] || null; }
  function valueOf(part, over) {
    if (over && part.key && part.key in over) return { v: over[part.key], chosen: true };
    var row = part.key ? byKey(part.key) : null;
    if (!row) return { v: part.old, chosen: false };
    if (row.classList.contains('decision')) {
      var r = row.getAttribute('data-retenu');
      if (r !== null) return { v: r === '0' ? part.old : versionsOf(row)[Number(r)].getAttribute('data-value'), chosen: true };
      if (row.hasAttribute('data-impose')) return { v: row.getAttribute('data-impose'), chosen: true };
      return { v: part.old, chosen: false };
    }
    var box = row.querySelector('input[type=checkbox]');
    if (box && !box.checked) return { v: part.old, chosen: true };
    return { v: part.applied || part.old, chosen: false };
  }
  function spaceOf(sp, over) {
    var chosen = false;
    var vs = sp.parts.map(function (p) { var x = valueOf(p, over); chosen = chosen || x.chosen; return parseFloat(x.v) || 0; });
    var v = sp.mode === 'max' ? Math.max.apply(null, [0].concat(vs)) : vs.reduce(function (a, b) { return a + b; }, 0);
    return { px: Math.round((v + sp.extra) * 100) / 100, chosen: chosen };
  }
  function fr(n) { return String(n).replace('.', ','); }
  // Lot P-fin : une seule formulation, « du champ suivant » : libellé, champ et message comptent comme un champ.
  function group(role) { return role === 'libellé' || role === 'message' ? 'champ' : role; }
  function nextOf(x) { return group(x.roles[2]) + ' ' + x.toward; }
  function verdictOf(x, a, b) {
    var own = x.roles[1 - x.facing];
    return a.px < b.px ? 'on voit à quel ' + own + ' il appartient'
      : a.px === b.px ? 'même distance, on ne voit pas à quel ' + own + ' il appartient'
      : 'il est plus près du ' + nextOf(x) + ' que de son ' + own;
  }
  // Lot C (C7 à C10) : un candidat d'une marge appariée qui rendrait l'espace dans le composant égal
  // ou supérieur à l'espace entre composants est grisé, avec sa raison ; il reste cliquable.
  // Même calcul que control() (marges fusionnées, autres choix en cours), le candidat à la place de la marge.
  function greyOut() {
    var marks = {};
    PAIRS.forEach(function (x) {
      x.in.parts.concat(x.out.parts).forEach(function (p) {
        var row = p.key ? byKey(p.key) : null;
        if (!row || !row.classList.contains('decision')) return;
        versionsOf(row).slice(1).forEach(function (b) {
          var over = {}; over[p.key] = b.getAttribute('data-value');
          var a = spaceOf(x.in, over), o = spaceOf(x.out, over);
          if (a.px < o.px) return;
          var m = (marks[p.key] = marks[p.key] || {});
          var l = (m[b.getAttribute('data-value')] = m[b.getAttribute('data-value')] || { same: [], closer: [] });
          var own = x.roles[1 - x.facing];
          if (a.px === o.px) { if (l.same.indexOf(own) < 0) l.same.push(own); }
          else { var k = nextOf(x) + '|' + own; if (l.closer.indexOf(k) < 0) l.closer.push(k); }
        });
      });
    });
    rows().forEach(function (row) {
      if (!row.classList.contains('decision')) return;
      var m = marks[row.getAttribute('data-key')] || {};
      versionsOf(row).forEach(function (b) {
        if (b.hasAttribute('data-contraste')) return; // Lot J, J1 : grisé de contraste, fixe
        var why = m[b.getAttribute('data-value')];
        var old = b.querySelector('.raison'); if (old) old.remove();
        b.classList.toggle('grise', !!why && b.getAttribute('data-v') !== '0');
        if (!why || b.getAttribute('data-v') === '0') return;
        var s = document.createElement('small'); s.className = 'raison'; s.textContent = reasonOf(why);
        b.querySelector('.nom').appendChild(s);
      });
    });
  }
  // Lot C : raisons d'un candidat grisé fusionnées en une phrase, dans la formulation du lot P.
  function reasonOf(why) {
    var parts = [];
    if (why.same.length) parts.push('même distance, on ne voit pas ' + why.same.map(function (o) { return 'à quel ' + o; }).join(' ni ') + ' il appartient');
    if (why.closer.length) parts.push('il est plus près ' + why.closer.map(function (k) { var x = k.split('|'); return 'du ' + x[0] + ' que de son ' + x[1]; }).join(' et '));
    return parts.join(', et ');
  }
  // Lot C (C12) : valeurs finales distinctes par usage, toutes lignes comprises.
  function finalOf(e) {
    var row = byKey(e.key);
    if (!row) return e.new || e.old;
    if (row.classList.contains('decision')) {
      var r = row.getAttribute('data-retenu');
      if (r !== null) return r === '0' ? e.old : versionsOf(row)[Number(r)].getAttribute('data-value');
      if (row.hasAttribute('data-impose')) return row.getAttribute('data-impose');
      return e.old;
    }
    var box = row.querySelector('input[type=checkbox]');
    if (box && !box.checked) return e.old;
    return e.new || e.old;
  }
  function usages() {
    var ul = document.getElementById('bilan-usages'); if (!ul) return;
    ul.innerHTML = '';
    BILAN.forEach(function (u) {
      var seen = {};
      u.rows.forEach(function (e) { var v = parseFloat(finalOf(e)); if (!isNaN(v)) seen[v] = true; });
      var vs = Object.keys(seen).map(Number).sort(function (a, b) { return a - b; });
      var li = document.createElement('li');
      var b = document.createElement('b'); b.textContent = u.label + ' : ';
      li.appendChild(b);
      li.appendChild(document.createTextNode(vs.map(fr).join(', ') + ' px (' + vs.length + ' valeur' + (vs.length > 1 ? 's' : '') + ')'));
      ul.appendChild(li);
    });
  }
  function control() {
    var lines = {};
    PAIRS.forEach(function (x) {
      var a = spaceOf(x.in), b = spaceOf(x.out);
      if (a.px < b.px && !x.before) return;
      var me = x.roles[x.facing], own = x.roles[1 - x.facing], next = nextOf(x);
      var verdict = verdictOf(x, a, b);
      var text = (a.chosen || b.chosen ? 'Avec ces choix' : 'En l’état') + ', le ' + me + ' est à ' + fr(a.px) + ' px de son ' + own + ' et à ' + fr(b.px) + ' px du ' + next + ' : ' + verdict + '.';
      x.in.parts.concat(x.out.parts).forEach(function (p) {
        if (!p.key) return;
        var l = (lines[p.key] = lines[p.key] || []);
        if (!l.some(function (y) { return y.text === text; })) l.push({ text: text, ok: a.px < b.px });
      });
    });
    rows().forEach(function (row) {
      var box = row.querySelector('.controle'); if (!box) return;
      var l = lines[row.getAttribute('data-key')] || [];
      box.hidden = !l.length;
      box.innerHTML = '';
      l.forEach(function (y) { var s = document.createElement('span'); s.className = y.ok ? 'ok' : 'alerte'; s.textContent = y.text; box.appendChild(s); });
    });
  }
  function refresh(save) {
    state = collect();
    control();
    greyOut();
    usages();
    if (save !== false) try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    var total = document.querySelectorAll('.row.decision').length;
    var open = document.querySelectorAll('.row.a-trancher').length;
    document.getElementById('bilan').textContent = (total - open) + ' / ' + total + ' choisies';
  }
  // Lot J, J7 : la carte active (clic, focus, « Suivante à choisir ») montre sa page dans le panneau,
  // défilée jusqu'à son premier élément ; sur écran étroit, le panneau passe sous la carte.
  var apercu = document.getElementById('apercu');
  var etroit = window.matchMedia('(max-width: 1000px)');
  function voir(card, y0) {
    if (!apercu) return;
    var avant = document.querySelector('[data-avant="' + (card ? card.getAttribute('data-page') : '0') + '"] img');
    if (!avant) return;
    var im = apercu.querySelector('img'), vue = apercu.querySelector('.apercu-vue');
    if (card && etroit.matches) card.after(apercu);
    else if (apercu.parentNode !== document.body) document.body.appendChild(apercu);
    apercu.hidden = false;
    document.body.classList.add('avec-apercu');
    apercu.querySelector('.apercu-titre').textContent = card ? card.getAttribute('data-url') || '' : '';
    var y = card ? Number(card.getAttribute('data-y') || 0) : y0 || 0;
    function aller() { vue.scrollTop = Math.max(0, y * (im.clientWidth / (im.naturalWidth || 1)) - 24); }
    if (im.getAttribute('src') !== avant.getAttribute('src')) { im.onload = aller; im.src = avant.src; } else aller();
  }
  function active(e) { var c = e.target && e.target.closest ? e.target.closest('.row[data-page]') : null; if (c) voir(c); }
  document.addEventListener('focusin', active);
  document.addEventListener('click', active);
  if (!etroit.matches) voir(null, 0);
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
