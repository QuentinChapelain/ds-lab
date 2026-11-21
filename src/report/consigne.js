// @ts-check
/**
 * D29 : consigne pour un agent, structurée. Une seule source pour la section « Consigne pour un
 * agent » de migration.md et pour la consigne réduite de modifications.json (reste.md, écrit par npm run apply) : chaque
 * section est une liste d'entrées ; migration.md en écrit le texte, modifications.json lit les entrées, jamais le texte.
 */
import { fr } from '../lib/format.js';
import { cssVarFallback } from '../lib/nom-css.js';

/** La liste des sélecteurs est-elle coupée ? @param {{ selectorsCut?: boolean }} r */
export const cutNote = (r) => (r.selectorsCut ? ' (liste coupée au relevé, d’autres éléments sont touchés)' : '');

/**
 * M6 : seconde version d'une décision, ou pourquoi il n'y en a pas.
 * @param {any} r
 */
export function m6Text(r) {
  const a = r.alternatives?.[0];
  if (!a) return '';
  const moves = a.backgrounds.map((/** @type {any} */ b) => `le fond ${b.from} passe à ${b.name} (${b.to})`).join(' et ');
  const ex = exceptionsText(a, r.readable);
  return ` Seconde version (M6) : ${a.name} (${a.new})${moves ? `, si ${moves}` : ''}${ex ? `, sauf ${ex}` : ''}.`;
}

/**
 * M6 : éléments en exception d'une seconde version (aucun fond proche), et la valeur qu'ils gardent.
 * @param {any} a  seconde version @param {{ name: string, value: string } | undefined} readable
 */
function exceptionsText(a, readable) {
  if (!a.exceptions?.length) return '';
  return a.exceptions
    .map((/** @type {any} */ x) => `${x.elements} élément(s) sur le fond ${x.background}, page ${x.pages.join(', ')} (${x.selectors.join(', ')}), qui gardent ${readable ? `${readable.name} (${readable.value})` : 'la valeur lisible'}`)
    .join(' ; ');
}

/**
 * Fond à déplacer quand la valeur décidée est celle de la seconde version (M6).
 * @param {any} r
 */
export function m6Move(r) {
  const a = r.alternatives?.find((/** @type {any} */ x) => x.new === r.new);
  if (r.status !== 'décidée' || !a) return '';
  const moves = a.backgrounds.length ? ` Déplace aussi le fond de la paire : ${a.backgrounds.map((/** @type {any} */ b) => `${b.from} → ${b.to} (${b.name})`).join(', ')}, seulement sous ces sélecteurs.` : '';
  const ex = a.exceptions?.length
    ? ` Exception (M6) : ${a.exceptions.map((/** @type {any} */ x) => `page ${x.pages.join(', ')}, fond ${x.background}, ${x.elements} élément(s) (${x.selectors.join(', ')})`).join(' ; ')} : écris ${r.readable ? `${r.readable.value} (${r.readable.name})` : 'la valeur lisible'} au lieu de ${a.new}, qui y resterait sous le seuil.`
    : '';
  return moves + ex;
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

/** Relation d'une marge dans la consigne. @param {any} r */
// « à vérifier » reste dans la revue et dans les tables, pas dans la consigne.
const relationOf = (r) => {
  const rel = (r.relation ?? '').split(' · ').filter((/** @type {string} */ x) => !x.startsWith('à vérifier')).join(' · ');
  return rel && rel !== '—' ? ` Relation : ${rel}.` : '';
};

/** La ligne a-t-elle un jeton ? @param {any} r */
export const hasToken = (r) => !!r.token && r.token !== 'jeton absent' && r.token !== '—';
/** I4 : relation d'une ligne en quelques mots (sans signal ni lieu), ou rien. @param {any} r */
export const relationShort = (r) => {
  const first = (r.relation ?? '—').split(' · ')[0];
  return first && first !== '—' ? ` ${first}` : '';
};

/** Renvoi aux conflits : migration.md a une section CONFLITS, reste.md non (le script a marqué ces déclarations). */
const CONFLITS = { consigne: 'Les déclarations de CONFLITS', reste: 'Les déclarations marquées /* ds-lab : conflit … */' };
/** Fin de NE TOUCHE PAS, dans les deux consignes. */
const ABSENTE = 'Toute valeur absente de cette consigne.';

/**
 * @typedef {object} Consigne
 * @property {string[]} lines         texte de la consigne, ligne par ligne, tel qu'il est écrit dans migration.md
 * @property {string} markdown        section « Consigne pour un agent » de migration.md
 * @property {number} replacements    lignes de REMPLACEMENTS
 * @property {string[]} changeAussi   entrées de CHANGE AUSSI, sans tiret
 * @property {string[]} neTouchePas   entrées de NE TOUCHE PAS, sans tiret
 * @property {string[]} signale       entrées de SIGNALE SANS MODIFIER, sans tiret
 * @property {string[]} verification  lignes de VÉRIFICATION
 * @property {{ neTouchePas: { avant: string[], attente: { id: string, texte: string }[], apres: string[] }, verification: string[] }} reste
 *   consigne réduite de reste.md (npm run apply), après ce que le script a fait : une ligne en attente n'y est que si le
 *   script a posé son commentaire ; VÉRIFICATION renvoie aux déclarations marquées, pas à CONFLITS
 */

/**
 * « Consigne pour un agent », à l'impératif, copiable telle quelle. D29 : la consigne est
 * rendue en sections ; migration.md écrit son texte, modifications.json lit ses sections, sans relire le texte.
 * @param {any} d @param {{ applied: any[], pending: any[], refused: any[], outOfTable: any[], attached: any[] }} s
 * @returns {Consigne}
 */
export function consigneAgent(d, s) {
  const m = d.meta;
  /** @param {any} r */
  const write = (r) => (hasToken(r) ? `${cssVarFallback(r.token, r.value)} (${r.new})` : `${r.new} (jeton absent : écris la valeur)`);
  const lines = [];
  lines.push('CONTEXTE');
  lines.push(`Tu migres les feuilles CSS des pages ${m.pages.join(', ')} vers les jetons ${m.tokens ?? '(aucun fichier de jetons)'} de la cible ${m.target}.`);
  lines.push(
    "Écris chaque jeton sous la forme var(--color-neutral-11, ancienne valeur) : chemin du jeton, points remplacés par des tirets ; en repli, l'ancienne valeur ; si la source l'écrit autrement (rem, rgb()), garde l'écriture de la source. Si la ligne dit « jeton absent », écris la valeur hex ou px indiquée.",
  );
  lines.push('Les valeurs ci-dessous sont des valeurs calculées : dans la source, elles peuvent être écrites autrement (rem, em, rgb(), mot-clé) ; cherche leur équivalent.');
  // Unité relative et conflits de déclarations, en règle générale.
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
   * Une ligne de texte exclut les éléments visés par un COUPLAGE (leur texte devient
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
  /** Ligne de fond qui suit une carte de plein. @param {any} r */
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
  // I1, I2 : valeurs déjà sur la cible, rattachées à leur jeton sans changement visible.
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
  // Une déclaration, deux lignes aux issues différentes.
  lines.push(`CONFLITS (${(d.conflicts ?? []).length})`);
  for (const c of d.conflicts ?? [])
    lines.push(
      `- ${c.file}:${c.line} ${c.selector} { ${c.property}: ${c.written ?? '?'} } : même déclaration pour ${c.rows.map((/** @type {any} */ x) => `${x.id} (${x.outcome === 'laisse' ? 'laissée' : `→ ${x.outcome}`}${x.scope ? `, ${x.scope}` : ''})`).join(' et ')}, pages ${c.pages.join(', ')}. Ne remplace pas cette déclaration et ne coupe pas la règle ; pose au-dessus /* ds-lab : conflit, ${c.rows.map((/** @type {any} */ x) => `${x.id} ${x.outcome}`).join(' / ')}, même déclaration (${date}) */ ; signale-le dans ton compte rendu.`,
    );
  if (!(d.conflicts ?? []).length) lines.push('- Aucun.');
  lines.push('');
  // Un couplage suit la carte de son plein ; les autres choix et les cartes en attente le disent.
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
      `- Le texte posé sur un plein ${p.scale} devient ${p.onSolid} (${p.tint ? `même teinte, ${p.name ?? 'pas de la valise'}` : 'onSolid'}${v}) : texte ${p.text} sur ${p.bg} après la table (fonds d'origine ${p.befores.map((/** @type {any} */ b) => b.bg).join(', ')}), ${fr(p.ratio)}:1. Sélecteurs : ${p.selectors.join(', ') || '—'}.`,
    );
  }
  for (const g of d.pleins ?? []) {
    const ver = g.versions.find((/** @type {any} */ x) => x.choice === (g.choice ?? ''));
    const ratio = ver ? `${fr(ver.ratio)}:1` : '';
    if (g.choice === 'pas-10')
      couples.push(`- Plein ${g.scale} : le fond passe au pas 10 (${g.steps[10].name}, ${g.steps[10].value}) et le texte reste tel quel (${ver.text} sur ${ver.bg}, ${ratio}), choisi par le designer (carte ${g.title}). Les fonds sont dans REMPLACEMENTS ; ne change pas le texte.`);
    else if (g.choice === 'garder')
      couples.push(`- Plein ${g.scale} : le texte reste tel quel (${ver.text} sur ${ver.bg}, ${ratio}, sous ${fr(ver.threshold)}:1), gardé par le designer (carte ${g.title}). Ne change pas le texte.`);
    else if (!g.choice) couples.push(`- Plein ${g.scale} : en attente du designer (carte ${g.title}) : ne change ni le texte ni le fond ; les lignes de fond sont dans NE TOUCHE PAS.`);
  }
  lines.push(`COUPLAGES (${couples.length})`);
  lines.push(...couples);
  if (!couples.length) lines.push('- Aucun.');
  lines.push('');
  const links = d.exceptions.links;
  const msgs = d.exceptions.messages;
  const changeAussi = [
    `Souligne tout lien posé dans du texte courant : ${links.length} trouvé${links.length > 1 ? 's' : ''} ici${links.length ? ` (${links.flatMap((/** @type {any} */ l) => l.selectors).join(', ')})` : ''}.`,
    `Relie chaque message à son champ par aria-describedby (id du message dans l’attribut aria-describedby du champ) : ${msgs.length} trouvé${msgs.length > 1 ? 's' : ''} ici${msgs.length ? ` (${msgs.map((/** @type {any} */ x) => `${x.message} → ${x.field}`).join(', ')})` : ''}.`,
  ];
  const avant = [...s.outOfTable.map((r) => `Hors table : ${r.value} (${r.usage}), ${r.reason}.`), ...s.refused.map((r) => `Refusée : ${r.value} (${r.usage}), le designer garde la valeur.`)];
  const tiers = d.thirdParty.map((/** @type {string} */ sel) => `Composant tiers : ${sel} et tout ce qu'il contient.`);
  const neTouchePas = [
    ...avant,
    // R-2 : décisions en attente, avec leur identifiant et leur titre.
    // I4 : un commentaire CSS marque la déclaration en attente.
    ...s.pending.map(
      (r) =>
        `${r.id} ${r.title}. Pas encore choisie par le designer : ne l'applique pas (${r.value}, ${r.usage}). Ajoute au-dessus de la déclaration le commentaire /* ds-lab : en attente du designer, ${r.value} ${r.usage}${relationShort(r)} (${r.id}, ${m.stamp}) */.${pleinNote(r)}${relationOf(r)}${r.reason ? ` Motif : ${r.reason}.` : ''}${m6Text(r)} Sélecteurs : ${r.selectors.join(', ') || '—'}${cutNote(r)}.`,
    ),
    ...tiers,
    ABSENTE,
  ];
  // I5 : une valeur hors tranche et inchangée est rattachée, et reste signalée.
  /** @param {any} x */
  const isAttached = (x) => s.attached.some((r) => r.family === 'colors' && r.value === x.value && r.usage === x.usage);
  // Une valeur traitée par REMPLACEMENTS n'est pas aussi à signaler sans modifier.
  /** @param {any} x */
  const isReplaced = (x) => replaceable.some((/** @type {any} */ r) => r.family === 'colors' && r.value === x.value && r.usage === x.usage);
  const signale = [
    ...d.exceptions.outOfSlice
      .filter((/** @type {any} */ x) => !isReplaced(x))
      .map((/** @type {any} */ x) => `Valeur hors de sa tranche : ${x.value} (${x.name}) en ${x.usage}, ${x.elements} élément(s), tranche attendue ${x.expected} : ${x.selectors.join(', ')}${isAttached(x) ? " ; rattaché, rôle à revoir" : ''}.`),
    ...d.exceptions.states.map((/** @type {any} */ st) => `État non lu : ${st.value} (${[...new Set(st.contexts.map((/** @type {any} */ c) => `${c.state} ${c.property}`))].join(', ')}).`),
    ...d.exceptions.ties
      .filter((/** @type {any} */ r) => !replaceable.some((/** @type {any} */ x) => x.id === r.id))
      .map((/** @type {any} */ r) => `Égalité tranchée en silence : ${r.value} (${r.usage}) entre ${r.tie[0]} et ${r.tie[1]}, rangée vers ${r.new}.`),
    'Élément injecté après le chargement : non mesuré ; signale-le si tu en trouves.',
  ];
  /** @param {string} conflits renvoi aux déclarations en conflit */
  const verification = (conflits) => [
    `Relance : ${m.command ?? 'npm run reduce (mêmes options)'}`,
    'Après modification du CSS, relance reduce sur les pages de la table et sur les pages témoins, et compare au prévu ; signale tout écart avant la mise en ligne.',
    `Chaque ligne traitée doit ressortir « inchangé » dans la nouvelle table. ${conflits} et les unités relatives laissées ressortent telles quelles : c’est attendu.`,
    // I6 : chaque variable écrite est déclarée.
    'Chaque variable écrite est déclarée dans tokens.css.',
    'Retire le repli quand toutes les pages sont migrées, pas avant.',
    `Il ne doit rester ${d.remaining.length === 1 ? 'qu’une paire' : `que ${d.remaining.length} paires`} de texte sous 4,5:1 : ${d.remaining.map((/** @type {any} */ p) => `${p.text} sur ${p.bg} (${fr(p.ratio)}:1)${p.note ? `, sous ${fr(p.threshold)}:1, ${p.note}` : ''}`).join(' ; ') || 'aucune'}.`,
  ];
  const tiret = (/** @type {string} */ x) => `- ${x}`;
  lines.push('CHANGE AUSSI', ...changeAussi.map(tiret), '');
  lines.push('NE TOUCHE PAS', ...neTouchePas.map(tiret), '');
  lines.push('SIGNALE SANS MODIFIER', ...signale.map(tiret), '');
  lines.push('VÉRIFICATION', ...verification(CONFLITS.consigne));
  const markdown = ['## Consigne pour un agent', '', 'À copier telle quelle.', '', '```text', ...lines, '```', ''].join('\n');
  return {
    markdown,
    replacements: replaceable.length,
    lines,
    changeAussi,
    neTouchePas,
    signale,
    verification: verification(CONFLITS.consigne),
    reste: {
      neTouchePas: {
        avant,
        attente: s.pending.map((r) => ({
          id: r.id,
          texte: `${r.id} ${r.title}. Pas encore choisie par le designer : ne l'applique pas (${r.value}, ${r.usage}) ; le script a posé le commentaire « en attente du designer » au-dessus de ses déclarations.`,
        })),
        apres: ['Les déclarations marquées par le script /* ds-lab : conflit … */ ou /* ds-lab : unité relative … */ : laisse-les telles quelles, ne coupe pas leur règle.', ...tiers, ABSENTE],
      },
      verification: verification(CONFLITS.reste),
    },
  };
}
