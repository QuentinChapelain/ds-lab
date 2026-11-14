// @ts-check
/**
 * Lot S, S1 : modifications.json, écrit par reduce à côté de migration.md (avec --tokens).
 *
 * Une entrée par déclaration et par propriété à modifier : feuille (chemin d'URL), ligne de la règle,
 * sélecteur, propriété, valeur écrite attendue, nouvelle valeur var(--jeton, valeur écrite), lignes.
 *   REMPLACEMENTS : déclarations hors conflit des lignes appliquées ou décidées, unité relative
 *     comprise (le repli garde l'écriture de la source).
 *   RATTACHE : déclarations hors conflit en unité absolue (ou sans unité) des lignes inchangées ;
 *     en unité relative, un commentaire « unité relative, non rattachée » à la place.
 *   COUPLAGES : déclarations de texte des éléments couplés, quand l'onSolid a un jeton.
 * Commentaires (texte exact de la consigne) : conflit, unité relative, en attente du designer.
 * Reste pour l'agent : lien tokens.css, CHANGE AUSSI, unité inconnue, ligne sans déclaration
 * tracée, bloc <style>, jeton absent, exception M6, couplage sans jeton.
 * Aucune date hors de celles des commentaires : un même fichier donne le même résultat.
 */

/** Variable CSS d'un jeton DTCG. @param {string} token */
const cssVar = (token) => `--${token.replace(/\./g, '-')}`;
/** @param {string} token @param {string} fallback */
const withFallback = (token, fallback) => `var(${cssVar(token)}, ${fallback})`;
const hasToken = (/** @type {any} */ r) => !!r.token && r.token !== 'jeton absent' && r.token !== '—';

/**
 * Valeur CSS d'un jeton DTCG (couleur : hex ; dimension : valeur et unité), ou null.
 * @param {any} tokens @param {string} path
 */
export function tokenValue(tokens, path) {
  let node = tokens;
  for (const k of path.split('.')) node = node?.[k];
  const v = node?.$value;
  if (v?.hex) return String(v.hex).toLowerCase();
  if (v && typeof v === 'object' && 'value' in v && 'unit' in v) return `${v.value}${v.unit}`;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  return null;
}

/** Chemin d'URL d'une feuille de l'hôte, ou null (autre origine, bloc <style>). @param {string | null} href @param {string} host */
const sheetOf = (href, host) => {
  if (!href) return null;
  try {
    const u = new URL(href);
    return u.host === host ? u.pathname : null;
  } catch {
    return null;
  }
};

/** Lignes d'une section de la consigne, sans son titre. @param {string[]} lines @param {string} head */
const section = (lines, head) => {
  const i = lines.findIndex((l) => l.startsWith(head));
  if (i < 0) return [];
  const j = lines.indexOf('', i);
  return lines.slice(i + 1, j < 0 ? undefined : j);
};

/**
 * @param {{ d: any, s: { applied: any[], pending: any[], refused: any[], outOfTable: any[], attached: any[] }, agentLines: string[], tokens: any,
 *   helpers: { m6Move: (r: any) => string, relationShort: (r: any) => string } }} o
 */
export function buildModifications({ d, s, agentLines, tokens, helpers }) {
  const m = d.meta;
  const host = m.host;
  const date = String(m.stamp ?? '').slice(0, 10);
  /** @type {Map<string, any>} */
  const entries = new Map();
  /** @type {Map<string, any>} */
  const comments = new Map();
  /** @type {string[]} */
  const reste = [];
  /** @type {Set<string>} */
  const pages = new Set();
  /** @type {Set<string>} */
  const tokenPaths = new Set();
  const at = (/** @type {any} */ e) => `${e.file}:${e.line} ${e.selector} { ${e.property}: ${e.written ?? '?'} }`;

  /** @param {any} r @param {any} e @param {string} token @param {string} sectionName */
  const addEntry = (r, e, token, sectionName) => {
    const sheet = sheetOf(e.href, host);
    const key = `${sheet}|${e.line}|${e.selector}|${e.property}`;
    const value = withFallback(token, e.written);
    const prev = entries.get(key);
    if (prev) {
      if (prev.value !== value) reste.push(`${r.id} ${r.title} : ${at(e)} : même déclaration que ${prev.rows.join(', ')}, valeurs différentes (${prev.value} / ${value}) ; tranche à la main et signale-le.`);
      else if (!prev.rows.includes(r.id)) prev.rows.push(r.id);
      return;
    }
    entries.set(key, { sheet, line: e.line, selector: e.selector, property: e.property, written: e.written, value, token, rows: [r.id], section: sectionName });
    tokenPaths.add(token);
    for (const p of e.pages ?? []) pages.add(p);
  };
  /** @param {any} e @param {string} kind @param {string[]} rows @param {string} text */
  const addComment = (e, kind, rows, text) => {
    const sheet = sheetOf(e.href, host);
    const key = `${sheet}|${e.line}|${e.selector}|${text}`;
    const prev = comments.get(key);
    if (prev) {
      for (const id of rows) if (!prev.rows.includes(id)) prev.rows.push(id);
      return;
    }
    comments.set(key, { sheet, line: e.line, selector: e.selector, property: e.property, kind, rows: [...rows], text });
    for (const p of e.pages ?? []) pages.add(p);
  };
  /** Une déclaration que le script peut viser : feuille de l'hôte, valeur écrite d'unité connue. @param {any} e */
  const reachable = (e) => !!sheetOf(e.href, host) && e.written != null && e.unit !== 'inconnue';
  /** @param {any} r @param {any} e @param {string} what */
  const leave = (r, e, what) =>
    reste.push(
      `${r.id} ${r.title} : ${at(e)} : ${!sheetOf(e.href, host) ? 'déclaration hors des feuilles de la copie (bloc <style> ou autre origine)' : 'unité inconnue'} ; ${what}`,
    );
  const noDecl = (/** @type {any} */ r, /** @type {string} */ what) =>
    reste.push(`${r.id} ${r.title} : aucune déclaration tracée (point de départ : ${r.origin}) ; ${what} Cherche toutes les déclarations de ${r.value} pour cette propriété et cet usage.`);

  // REMPLACEMENTS
  for (const r of s.applied.filter((x) => x.conflict !== 'total')) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    const goal = hasToken(r) ? withFallback(r.token, r.value) : `${r.new} (jeton absent)`;
    if (!hasToken(r)) {
      reste.push(`${r.id} ${r.title} : jeton absent pour ${r.new} ; écris ${r.new} à la place de ${r.value} dans ses déclarations (${ds.map(at).join(', ') || r.origin}).`);
      continue;
    }
    if (!ds.length) noDecl(r, `remplace ${r.value} par ${goal}.`);
    for (const e of ds) reachable(e) ? addEntry(r, e, r.token, 'REMPLACEMENTS') : leave(r, e, `si la valeur calculée est bien ${r.value}, écris ${withFallback(r.token, e.written ?? r.value)} à la main.`);
    const m6 = helpers.m6Move(r).trim();
    if (m6) reste.push(`${r.id} ${r.title} : ${m6}`);
  }
  // RATTACHE
  for (const r of s.attached) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    if (!ds.length) noDecl(r, `rattache-la : ${withFallback(r.token, r.value)}, sans changement visible.`);
    for (const e of ds) {
      if (!reachable(e)) leave(r, e, `si la valeur calculée est bien ${r.value}, écris ${withFallback(r.token, e.written ?? r.value)} à la main.`);
      else if (e.unit === 'relative') addComment(e, 'unité relative', [r.id], `ds-lab : unité relative, non rattachée (${e.written}, ${date})`);
      else addEntry(r, e, r.token, 'RATTACHE');
    }
  }
  // COUPLAGES (onSolid choisi sur une carte de plein)
  for (const r of d.rows.filter((/** @type {any} */ x) => x.family === 'colors' && x.usage === 'texte' && (x.coupledDeclarations ?? []).length)) {
    const p = d.exceptions.onSolid.find((/** @type {any} */ x) => x.befores.some((/** @type {any} */ b) => b.text === r.value));
    if (!p) continue;
    for (const e of r.coupledDeclarations) {
      const ee = { ...e, unit: 'absolue' };
      if (!p.token) reste.push(`${r.id} ${r.title} : ${at(e)} : texte couplé au plein ${p.scale}, onSolid ${p.onSolid} sans jeton ; écris ${p.onSolid} à la main.`);
      else if (!reachable(ee)) leave(r, ee, `écris ${withFallback(p.token, e.written ?? r.value)} à la main (COUPLAGES).`);
      else addEntry(r, ee, p.token, 'COUPLAGES');
    }
  }
  // Commentaires : conflits, puis lignes en attente.
  for (const c of d.conflicts ?? []) {
    const e = { ...c, pages: c.pages };
    const text = `ds-lab : conflit, ${c.rows.map((/** @type {any} */ x) => `${x.id} ${x.outcome}`).join(' / ')}, même déclaration (${date})`;
    if (sheetOf(c.href, host)) addComment(e, 'conflit', c.rows.map((/** @type {any} */ x) => x.id), text);
    else reste.push(`${at(e)} : conflit hors des feuilles de la copie ; pose à la main /* ${text} */ au-dessus.`);
  }
  /** @type {Set<string>} */
  const pendingMarked = new Set();
  for (const r of s.pending) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    const text = `ds-lab : en attente du designer, ${r.value} ${r.usage}${helpers.relationShort(r)} (${r.id}, ${m.stamp})`;
    const ok = ds.filter((/** @type {any} */ e) => sheetOf(e.href, host));
    for (const e of ok) addComment(e, 'en attente', [r.id], text);
    if (ok.length) pendingMarked.add(r.id);
    else reste.push(`${r.id} ${r.title} : en attente du designer, aucune déclaration tracée dans les feuilles de la copie ; pose à la main /* ${text} */ au-dessus de ses déclarations, sans les changer.`);
  }

  const sorted = [...entries.values()].sort((a, b) => (a.sheet < b.sheet ? -1 : a.sheet > b.sheet ? 1 : a.line - b.line || (a.property < b.property ? -1 : a.property > b.property ? 1 : 0)));
  const notes = [...comments.values()].sort((a, b) => (a.sheet < b.sheet ? -1 : a.sheet > b.sheet ? 1 : a.line - b.line));
  const sheets = [...new Set([...sorted, ...notes].map((x) => x.sheet))].sort();
  // tokens.css : dossier commun des feuilles modifiées.
  const dirs = sheets.map((x) => x.split('/').slice(0, -1));
  const common = dirs.length ? dirs.reduce((a, b) => a.filter((p, i) => b[i] === p)) : [''];
  const tokensPath = `${common.join('/') || ''}/tokens.css`;
  const vars = [...tokenPaths].map((t) => ({ name: cssVar(t), value: tokenValue(tokens, t) })).sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
  for (const v of vars.filter((x) => !x.value)) reste.push(`Jeton ${v.name} : valeur introuvable dans ${m.tokens} ; déclare-la à la main dans tokens.css.`);
  const content = [
    `/* ds-lab : jetons utilisés par les feuilles migrées, valeurs tirées de ${m.tokens}. À charger avant toutes les autres feuilles. */`,
    ':root {',
    ...vars.filter((x) => x.value).map((x) => `  ${x.name}: ${x.value};`),
    '}',
    '',
  ].join('\n');

  // Consigne réduite : NE TOUCHE PAS sans l'instruction de commentaire, que le script a posé.
  const neTouchePas = [
    ...s.outOfTable.map((r) => `Hors table : ${r.value} (${r.usage}), ${r.reason}.`),
    ...s.refused.map((r) => `Refusée : ${r.value} (${r.usage}), le designer garde la valeur.`),
    ...s.pending
      .filter((r) => pendingMarked.has(r.id))
      .map((r) => `${r.id} ${r.title}. Pas encore choisie par le designer : ne l'applique pas (${r.value}, ${r.usage}) ; le script a posé le commentaire « en attente du designer » au-dessus de ses déclarations.`),
    'Les déclarations marquées par le script /* ds-lab : conflit … */ ou /* ds-lab : unité relative … */ : laisse-les telles quelles, ne coupe pas leur règle.',
    ...(d.thirdParty ?? []).map((/** @type {string} */ sel) => `Composant tiers : ${sel} et tout ce qu'il contient.`),
    'Toute valeur absente de cette consigne.',
  ];
  return {
    version: 1,
    host,
    stamp: m.stamp,
    tokens: m.tokens,
    entries: sorted.map(({ token, ...e }) => e),
    comments: notes,
    tokensCss: { path: tokensPath, content },
    brief: {
      pages: [...pages].sort(),
      sheets,
      reste,
      changeAussi: section(agentLines, 'CHANGE AUSSI').map((l) => l.replace(/^- /, '')),
      neTouchePas,
      signale: section(agentLines, 'SIGNALE SANS MODIFIER').map((l) => l.replace(/^- /, '')),
      // reste.md n'a pas de section CONFLITS : le script a marqué ces déclarations.
      verification: section(agentLines, 'VÉRIFICATION').map((l) => l.replace('Les déclarations de CONFLITS', 'Les déclarations marquées /* ds-lab : conflit … */')),
    },
  };
}
