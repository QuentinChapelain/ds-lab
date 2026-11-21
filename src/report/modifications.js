// @ts-check
/**
 * S1 : modifications.json, écrit par reduce à côté de migration.md (avec --tokens). D29 :
 * rangé avec les sorties de reduce (src/report/) ; la consigne réduite est lue dans la consigne structurée
 * (src/report/consigne.js), jamais dans son texte ; src/apply/ ne fait que lire le fichier.
 *
 * Une entrée par déclaration et par propriété à modifier : feuille (chemin d'URL), ligne de la règle,
 * sélecteur, propriété, valeur écrite attendue, nouvelle valeur var(--jeton, valeur écrite), lignes ; puis la colonne de
 * la règle (accolade ouvrante, base 1 : elle la situe dans une feuille compressée), son !important d'origine et les
 * pages où la déclaration est tracée. En tête : le schéma des adresses et la fenêtre de la réduction.
 *   REMPLACEMENTS : déclarations hors conflit des lignes appliquées ou décidées, unité relative
 *     comprise (le repli garde l'écriture de la source).
 *   RATTACHE : déclarations hors conflit en unité absolue (ou sans unité) des lignes inchangées ;
 *     en unité relative, un commentaire « unité relative, non rattachée » à la place.
 *   COUPLAGES : déclarations de texte des éléments couplés, quand l'onSolid a un jeton.
 * Commentaires (texte exact de la consigne) : conflit, unité relative, en attente du designer.
 * Reste pour l'agent : lien tokens.css, CHANGE AUSSI, unité inconnue, ligne sans déclaration
 * tracée, bloc <style>, jeton absent, exception M6, couplage sans jeton. brief.reste garde son texte (reste.md d'apply
 * le recopie) ; `hors` redit chaque ligne du reste avec sa cause juste (valeur en var(), mot-clé d'héritage, raccourci
 * en var(), attribut style…) et le repli de la valeur écrite, pour pertes.md (npm run ajout).
 * Avec la simulation de la réduction (verify --ajout, docs/attendus/verdict-par-decision.md) : `simulation`, la carte
 * que la simulation applique (par famille, ancienne → nouvelle ; coupure, pleins, couplages, éléments tiers, conflits
 * repérés par chemin de feuille) ; `lignes`, chaque ligne décidée (appliquée ou décidée, hors conflit total, et texte
 * couplé), ses clés de simulation, ses valeurs, son jeton, les pages où la simulation la pose, l'état forcé où elle
 * seule est vue. Ni l'hôte ni le port n'y entrent.
 * Aucune date hors de celles des commentaires : un même fichier donne le même résultat.
 */

import { hasToken, m6Move, relationShort } from './consigne.js';
import { cssVar, cssVarFallback as withFallback } from '../lib/nom-css.js';
import { cleRepere } from '../reduce/declarations.js';
import { ligneDeCle } from '../lib/cles.js';

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

/** États forcés, comme le titre d'une ligne les nomme. */
const ETATS = /** @type {Record<string, string>} */ ({ hover: 'survol', focus: 'focus', active: 'appui' });

/**
 * Cause juste d'une valeur écrite qu'aucune sortie ne peut viser (unité « inconnue » de unitOf).
 * @param {string | null | undefined} w
 */
const causeDeValeur = (w) => {
  if (w == null) return 'valeur écrite inconnue';
  const t = String(w).trim().toLowerCase();
  // Chromium rend vide la propriété longue d'un raccourci qui contient un var() (substitution en attente).
  if (!t) return 'raccourci en var()';
  if (/\bvar\(/.test(t)) return 'valeur en var()';
  if (/^(inherit|initial|unset|revert|revert-layer)$/.test(t)) return "mot-clé d'héritage (inherit, initial, unset, revert)";
  if (/\b(calc|min|max|clamp|env)\(/.test(t)) return 'valeur calculée (calc(), min(), max(), clamp(), env())';
  return 'valeur écrite illisible';
};

/** Cause d'une ligne sans déclaration tracée, par son point de départ. @param {string | undefined} origin */
const causeSansDeclaration = (origin) =>
  origin === 'attribut style' ? 'attribut style' : origin === 'navigateur' ? 'feuille du navigateur' : origin === 'initiale' ? 'valeur initiale' : 'aucune déclaration tracée';

/**
 * @param {{ d: any, s: { applied: any[], pending: any[], refused: any[], outOfTable: any[], attached: any[] }, consigne: import('./consigne.js').Consigne, tokens: any,
 *   reperes?: Map<string, { column: number | null, important: boolean }>,
 *   simulation?: { carte: Record<string, any>, split: string[], pages: { page: string, keys: string[] }[], cles: Map<string, string> } }} o
 *   simulation : la carte de la simulation, sa coupure par relation, les clés posées par page, la clé de chaque ligne
 */
export function buildModifications({ d, s, consigne, tokens, reperes = new Map(), simulation }) {
  const m = d.meta;
  const host = m.host;
  const date = String(m.stamp ?? '').slice(0, 10);
  /** @type {Map<string, any>} */
  const entries = new Map();
  /** @type {Map<string, any>} */
  const comments = new Map();
  /** @type {string[]} */
  const reste = [];
  /**
   * Le reste, ligne à ligne, avec sa cause juste ; aFaire : ce qu'il faut faire, tel que le texte le dit ; declaration :
   * la déclaration visée, quand la ligne du reste en vise une (feuille null : bloc <style> ou autre origine). verify
   * --ajout reprend cause et aFaire pour la déclaration (docs/attendus/verify-se-reconnait.md).
   * @typedef {{ feuille: string | null, ligne: number, selecteur: string, propriete: string }} DeclarationVisee
   * @type {{ lignes: string[], cause: string, texte: string, aFaire?: string, declaration?: DeclarationVisee }[]}
   */
  const hors = [];
  /**
   * Une ligne du reste : son texte (reste.md, inchangé) et, pour pertes.md, sa cause et son texte justes.
   * @param {string[]} lignes @param {string} cause @param {string} texte @param {string} [juste]
   * @param {{ aFaire?: string, declaration?: DeclarationVisee }} [vise]
   */
  const rester = (lignes, cause, texte, juste = texte, vise = {}) => {
    reste.push(texte);
    hors.push({ lignes, cause, texte: juste, ...vise });
  };
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
      if (prev.value !== value) rester([r.id, ...prev.rows], 'même déclaration, valeurs différentes', `${r.id} ${r.title} : ${at(e)} : même déclaration que ${prev.rows.join(', ')}, valeurs différentes (${prev.value} / ${value}) ; tranche à la main et signale-le.`);
      else if (!prev.rows.includes(r.id)) prev.rows.push(r.id);
      prev.pages = [...new Set([...prev.pages, ...(e.pages ?? [])])].sort();
      return;
    }
    const rep = reperes.get(cleRepere(e.href, e.line, e.selector, e.property));
    entries.set(key, {
      sheet,
      line: e.line,
      selector: e.selector,
      property: e.property,
      written: e.written,
      value,
      token,
      rows: [r.id],
      section: sectionName,
      column: rep?.column ?? null,
      important: rep?.important ?? false,
      pages: [...new Set(e.pages ?? [])].sort(),
    });
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
  /**
   * Déclaration que le script ne peut pas viser. `what` reçoit le repli de la valeur à écrire : la valeur écrite (ou,
   * dans reste.md, la valeur de la ligne si elle manque) ; pour pertes.md, la valeur de la ligne aussi quand la valeur
   * écrite est vide.
   * @param {any} r @param {any} e @param {(repli: string) => string} what
   */
  const leave = (r, e, what) => {
    const bloc = !sheetOf(e.href, host);
    const cause = bloc ? 'bloc <style> ou autre origine' : causeDeValeur(e.written);
    const tete = `${r.id} ${r.title} : ${at(e)} : `;
    const aFaire = what(e.written || r.value);
    rester(
      [r.id],
      cause,
      `${tete}${bloc ? 'déclaration hors des feuilles de la copie (bloc <style> ou autre origine)' : 'unité inconnue'} ; ${what(e.written ?? r.value)}`,
      `${tete}${bloc ? 'déclaration hors des feuilles de la copie (bloc <style> ou autre origine)' : cause} ; ${aFaire}`,
      { aFaire, declaration: { feuille: sheetOf(e.href, host), ligne: e.line, selecteur: e.selector, propriete: e.property } },
    );
  };
  const noDecl = (/** @type {any} */ r, /** @type {string} */ what) => {
    const aFaire = `${what} Cherche toutes les déclarations de ${r.value} pour cette propriété et cet usage.`;
    const texte = `${r.id} ${r.title} : aucune déclaration tracée (point de départ : ${r.origin}) ; ${aFaire}`;
    rester([r.id], causeSansDeclaration(r.origin), texte, texte, { aFaire });
  };

  // REMPLACEMENTS
  for (const r of s.applied.filter((x) => x.conflict !== 'total')) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    const goal = hasToken(r) ? withFallback(r.token, r.value) : `${r.new} (jeton absent)`;
    if (!hasToken(r)) {
      const aFaire = `écris ${r.new} à la place de ${r.value} dans ses déclarations (${ds.map(at).join(', ') || r.origin}).`;
      const texte = `${r.id} ${r.title} : jeton absent pour ${r.new} ; ${aFaire}`;
      rester([r.id], 'jeton absent', texte, texte, { aFaire });
      continue;
    }
    if (!ds.length) noDecl(r, `remplace ${r.value} par ${goal}.`);
    for (const e of ds) reachable(e) ? addEntry(r, e, r.token, 'REMPLACEMENTS') : leave(r, e, (repli) => `si la valeur calculée est bien ${r.value}, écris ${withFallback(r.token, repli)} à la main.`);
    const m6 = m6Move(r).trim();
    if (m6) rester([r.id], 'exception M6', `${r.id} ${r.title} : ${m6}`);
  }
  // RATTACHE
  for (const r of s.attached) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    if (!ds.length) noDecl(r, `rattache-la : ${withFallback(r.token, r.value)}, sans changement visible.`);
    for (const e of ds) {
      if (!reachable(e)) leave(r, e, (repli) => `si la valeur calculée est bien ${r.value}, écris ${withFallback(r.token, repli)} à la main.`);
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
      if (!p.token) rester([r.id], 'couplage sans jeton', `${r.id} ${r.title} : ${at(e)} : texte couplé au plein ${p.scale}, onSolid ${p.onSolid} sans jeton ; écris ${p.onSolid} à la main.`);
      else if (!reachable(ee)) leave(r, ee, (repli) => `écris ${withFallback(p.token, repli)} à la main (COUPLAGES).`);
      else addEntry(r, ee, p.token, 'COUPLAGES');
    }
  }
  // Commentaires : conflits, puis lignes en attente.
  for (const c of d.conflicts ?? []) {
    const e = { ...c, pages: c.pages };
    const text = `ds-lab : conflit, ${c.rows.map((/** @type {any} */ x) => `${x.id} ${x.outcome}`).join(' / ')}, même déclaration (${date})`;
    if (sheetOf(c.href, host)) addComment(e, 'conflit', c.rows.map((/** @type {any} */ x) => x.id), text);
    else rester(c.rows.map((/** @type {any} */ x) => x.id), 'conflit hors des feuilles de la copie', `${at(e)} : conflit hors des feuilles de la copie ; pose à la main /* ${text} */ au-dessus.`);
  }
  /** @type {Set<string>} */
  const pendingMarked = new Set();
  for (const r of s.pending) {
    const ds = (r.declarations ?? []).filter((/** @type {any} */ e) => !e.conflict);
    const text = `ds-lab : en attente du designer, ${r.value} ${r.usage}${relationShort(r)} (${r.id}, ${m.stamp})`;
    const ok = ds.filter((/** @type {any} */ e) => sheetOf(e.href, host));
    for (const e of ok) addComment(e, 'en attente', [r.id], text);
    if (ok.length) pendingMarked.add(r.id);
    else rester([r.id], 'en attente du designer', `${r.id} ${r.title} : en attente du designer, aucune déclaration tracée dans les feuilles de la copie ; pose à la main /* ${text} */ au-dessus de ses déclarations, sans les changer.`);
  }

  const sorted = [...entries.values()].sort((a, b) => (a.sheet < b.sheet ? -1 : a.sheet > b.sheet ? 1 : a.line - b.line || (a.property < b.property ? -1 : a.property > b.property ? 1 : 0)));
  const notes = [...comments.values()].sort((a, b) => (a.sheet < b.sheet ? -1 : a.sheet > b.sheet ? 1 : a.line - b.line));
  const sheets = [...new Set([...sorted, ...notes].map((x) => x.sheet))].sort();
  // tokens.css : dossier commun des feuilles modifiées.
  const dirs = sheets.map((x) => x.split('/').slice(0, -1));
  const common = dirs.length ? dirs.reduce((a, b) => a.filter((p, i) => b[i] === p)) : [''];
  const tokensPath = `${common.join('/') || ''}/tokens.css`;
  const vars = [...tokenPaths].map((t) => ({ name: cssVar(t), value: tokenValue(tokens, t) })).sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
  for (const v of vars.filter((x) => !x.value)) rester([], 'jeton introuvable', `Jeton ${v.name} : valeur introuvable dans ${m.tokens} ; déclare-la à la main dans tokens.css.`);
  const content = [
    `/* ds-lab : jetons utilisés par les feuilles migrées, valeurs tirées de ${m.tokens}. À charger avant toutes les autres feuilles. */`,
    ':root {',
    ...vars.filter((x) => x.value).map((x) => `  ${x.name}: ${x.value};`),
    '}',
    '',
  ].join('\n');

  // Consigne réduite : NE TOUCHE PAS sans l'instruction de commentaire, que le script a posé.
  const reduite = consigne.reste;
  const neTouchePas = [
    ...reduite.neTouchePas.avant,
    ...reduite.neTouchePas.attente.filter((x) => pendingMarked.has(x.id)).map((x) => x.texte),
    ...reduite.neTouchePas.apres,
  ];
  return {
    version: 1,
    host,
    ...(m.scheme ? { scheme: m.scheme } : {}),
    ...(m.viewport ? { viewport: { width: m.viewport.width, height: m.viewport.height } } : {}),
    stamp: m.stamp,
    tokens: m.tokens,
    entries: sorted.map(({ token, ...e }) => e),
    comments: notes,
    tokensCss: { path: tokensPath, content },
    ...(simulation ? { simulation: simulationDe(simulation, d, host), lignes: lignesDecidees(simulation, d, s) } : {}),
    hors,
    brief: {
      pages: [...pages].sort(),
      sheets,
      reste,
      changeAussi: consigne.changeAussi,
      neTouchePas,
      signale: consigne.signale,
      // reste.md n'a pas de section CONFLITS : le script a marqué ces déclarations.
      verification: reduite.verification,
    },
  };
}

/**
 * Carte de la simulation, telle que scanInPage la reçoit, sans l'hôte ni le port : les conflits sont repérés par le
 * chemin de leur feuille (null pour un bloc <style>) et non par l'adresse.
 * @param {{ carte: Record<string, any>, split: string[] }} sim @param {any} d @param {string} host
 */
function simulationDe(sim, d, host) {
  const { conflicts: _c, ...carte } = sim.carte;
  return {
    ...carte,
    split: [...sim.split],
    conflits: (d.conflicts ?? []).map((/** @type {any} */ c) => {
      const u = c.href ? new URL(c.href) : null;
      return {
        feuille: u ? u.pathname : null,
        ...(u && u.host !== host ? { autreOrigine: true } : {}),
        ligne: c.line,
        selecteur: c.selector,
        propriete: c.property,
        cles: c.rows.map((/** @type {any} */ x) => x.key),
      };
    }),
  };
}

/**
 * Lignes décidées : appliquées ou décidées hors conflit total, et lignes de texte couplées à un plein ; leurs clés de
 * simulation, valeurs, jeton, pages où la simulation les pose, état forcé où elles seules sont vues.
 * @param {{ carte: Record<string, any>, pages: { page: string, keys: string[] }[], cles: Map<string, string> }} sim @param {any} d
 * @param {{ applied: any[] }} s
 */
function lignesDecidees(sim, d, s) {
  /** @type {Map<string, any>} */
  const out = new Map();
  /** @param {any} r @param {string | null} cle @param {string} nouvelle @param {string | null} jeton */
  const ajouter = (r, cle, nouvelle, jeton) => {
    const x = out.get(r.id);
    if (x) {
      if (cle && !x.cles.includes(cle)) x.cles.push(cle);
      return;
    }
    out.set(r.id, {
      id: r.id,
      titre: r.title,
      famille: r.family,
      cles: cle ? [cle] : [],
      ancienne: r.value,
      nouvelle,
      jeton,
      pages: [],
      ...(r.etats?.length ? { etats: r.etats.map((/** @type {string} */ e) => ETATS[e] ?? e) } : {}),
    });
  };
  for (const r of s.applied.filter((x) => x.conflict !== 'total')) ajouter(r, sim.cles.get(r.id) ?? null, r.new, hasToken(r) ? cssVar(r.token) : null);
  // Couplages : le texte posé sur un plein prend l'onSolid ; l'opération porte la clé « texte|sur-plein ».
  for (const c of sim.carte.couplings ?? []) {
    const r = d.rows.find((/** @type {any} */ x) => x.family === 'colors' && x.value === c.text && x.usage === 'texte');
    if (!r) continue;
    const p = d.exceptions.onSolid.find((/** @type {any} */ x) => x.befores.some((/** @type {any} */ b) => b.text === c.text));
    ajouter(r, `colors|${c.text}|texte|sur-plein`, c.onSolid, p?.token ? cssVar(p.token) : null);
  }
  const lignes = [...out.values()];
  /** @type {Map<string, string>} */
  const parCle = new Map(lignes.flatMap((l) => l.cles.map((/** @type {string} */ k) => [k, l.id])));
  for (const { page, keys } of sim.pages)
    for (const k of keys) {
      const id = ligneDeCle(parCle, k);
      const l = id ? out.get(id) : null;
      if (l && !l.pages.includes(page)) l.pages.push(page);
    }
  for (const l of lignes) l.pages.sort();
  return lignes;
}
