// @ts-check
/**
 * Feuilles ajoutées (D37, D38) : la migration posée à côté de l'ancien code, sans toucher à aucune de ses feuilles.
 * Lit modifications.json, et rien d'autre de la réduction (D30) ; lit sur le site servi, intact, les feuilles
 * visées et les pages de la réduction (brief.pages), à la fenêtre de la réduction (viewport), à l'adresse
 * <scheme>://<host> de modifications.json sauf origine donnée.
 *
 * Une feuille ajoutée par feuille modifiée, <feuille>.ajout.css, à charger juste après elle ; tokens.css avant
 * toutes les feuilles. Seules les lignes décidées (REMPLACEMENTS, COUPLAGES) y entrent, chacune sous le sélecteur
 * de la source, dans son contexte (@media, @supports, @layer…), en propriété longue, l'identifiant de sa ligne en
 * commentaire. Une règle est retrouvée par sa ligne et sa colonne (feuille compressée). Aucune spécificité ajoutée.
 * Armes égales (D38) : une déclaration d'origine en !important est écrite avec !important, son commentaire dit
 * « provisoire : !important d'origine », et pertes.md la compte à part ; jamais d'!important ailleurs.
 * Une feuille injectée par un script (absente du HTML des pages) a sa feuille ajoutée, et pertes.md dit qu'il faut la
 * charger depuis le script ; le media du lien d'une feuille est redit au chargement.
 * Ne sont pas écrites, et sont listées dans pertes.md sous leur cause :
 *   - garde : la valeur écrite n'est pas celle qu'attend modifications.json ;
 *   - raccourci : la propriété longue ne se lit pas dans le raccourci (var(), virgule, « / ») ;
 *   - règle introuvable : aucune règle à cet endroit, ou la déclaration n'y est pas ;
 *   - battue par l'ordre : sur un élément d'une page, une règle qui la suit dans la même feuille, de même
 *     spécificité, non reprise, gagne la propriété ; reprise après sa feuille, elle passerait devant ;
 *   - contexte : la feuille ajoutée ne sait pas le redire (règle imbriquée, couche anonyme) ;
 *   - feuille introuvable : le site ne la sert pas.
 * Les lignes simplement rattachées (RATTACHE) n'y entrent pas : « rattachement non fait ». Les lignes hors de
 * modifications.json (`hors`, ou le reste pour un fichier qui ne le porte pas) sont recopiées, rangées par cause.
 * Le manifeste (feuilles-ajoutees.json) porte, pour verify --ajout, chaque déclaration décidée et ce qu'il en est
 * advenu, et recopie de modifications.json la simulation, les lignes décidées et les lignes hors (verdict par ligne
 * décidée, docs/attendus/verdict-par-decision.md).
 */
import postcss from 'postcss';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { rulesOf, localiser, composantDe, norm } from './localisation.js';
import { lancerChromium } from '../browser/lancement.js';
import { gotoAndSettle } from '../browser/navigate.js';
import { reglesGagnantes, comparer } from '../browser/ordre.js';

export const MANIFESTE = 'feuilles-ajoutees.json';
/** Fenêtre d'une réduction qui ne la dit pas (modifications.json écrit avant qu'il la porte). */
export const FENETRE_PAR_DEFAUT = { width: 1366, height: 900 };
const PERTES = 'pertes.md';
const SECTIONS_DECIDEES = new Set(['REMPLACEMENTS', 'COUPLAGES']);
const EN_TETE =
  "Une valeur posée par un attribut style n'est jamais dans modifications.json : une ligne tenue seulement par des attributs style est parmi les lignes hors de modifications.json, en fin de fichier (point de départ : attribut style) ; une ligne tenue en partie par eux ne le dit pas ici.";
/** Causes d'une ligne décidée non écrite, dans l'ordre de pertes.md. */
const CATEGORIES = /** @type {const} */ (['garde', 'raccourci', 'règle introuvable', "battue par l'ordre", 'contexte', 'feuille introuvable']);
const PROVISOIRE = "provisoire : !important d'origine";

/** Chemin de la feuille ajoutée d'une feuille. @param {string} feuille */
const cheminAjout = (feuille) => (/\.css$/i.test(feuille) ? feuille.replace(/\.css$/i, '.ajout.css') : `${feuille}.ajout.css`);

/** Sélecteur de la source, sur une ligne. @param {string} s */
const uneLigne = (s) => s.replace(/\s+/g, ' ').trim();

/** Nom du jeton d'une nouvelle valeur var(--jeton, repli), ou null. @param {string} v */
const jetonDe = (v) => /^var\(\s*(--[\w-]+)/.exec(String(v))?.[1] ?? null;

/**
 * Contexte d'une règle : les règles @ qui l'entourent, de la plus externe à la plus interne ; ou le motif qui
 * empêche de le redire.
 * @param {any} rule @returns {string[] | { motif: string }}
 */
function contexteDe(rule) {
  /** @type {string[]} */
  const out = [];
  for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type === 'rule') return { motif: `règle imbriquée dans ${uneLigne(p.selector)}` };
    if (p.type !== 'atrule') return { motif: `contexte inconnu (${p.type})` };
    if (p.name.toLowerCase() === 'layer' && !p.params.trim()) return { motif: 'couche anonyme : la feuille ajoutée en ouvrirait une autre' };
    out.unshift(`@${p.name}${p.params ? ` ${uneLigne(p.params)}` : ''}`);
  }
  return out;
}

/**
 * @typedef {typeof CATEGORIES[number]} Categorie
 * @typedef {{ entry: any, categorie: Categorie, cause: string, aFaire: string }} NonEcrite
 * @typedef {{ feuille: string, ajout: string, texte: string }} FeuilleAjoutee
 * @typedef {{ entry: any, rule: any, ligne: number, colonne: number | null, contexte: string[], important: boolean, sur: import('../browser/ordre.js').Sur[] }} Candidate
 */

/**
 * @param {any} mods  contenu de modifications.json
 * @param {{ origine?: string, waitMs?: number, storageState?: string }} [o]
 *   origine : adresse du site intact (défaut : <scheme>://<host> de modifications.json, http sans schéma)
 */
export async function feuillesAjoutees(mods, { origine, waitMs, storageState } = {}) {
  const base = (origine ?? `${mods.scheme ?? 'http'}://${mods.host}`).replace(/\/$/, '');
  const viewport = mods.viewport ?? FENETRE_PAR_DEFAUT;
  const pages = /** @type {string[]} */ (mods.brief?.pages ?? []);
  const entries = /** @type {any[]} */ (mods.entries ?? []);
  const decidees = entries.filter((e) => SECTIONS_DECIDEES.has(e.section));
  const rattachees = entries.filter((e) => !SECTIONS_DECIDEES.has(e.section));
  /** @type {NonEcrite[]} */
  const nonEcrites = [];
  /** @type {Candidate[]} */
  let candidates = [];
  /** Par feuille : les lignes qui portent plusieurs règles (la colonne est alors redite). @type {Map<string, Set<number>>} */
  const lignesPleines = new Map();
  /** Par feuille : les media de ses liens, et les pages où elle est injectée par un script. @type {Map<string, { media: Set<string>, injectee: string[] }>} */
  const liens = new Map();
  const browser = await lancerChromium();
  try {
    const context = await browser.newContext({ viewport, storageState: storageState ?? undefined });
    // 1. Feuilles lues sur le site servi ; chaque entrée localisée, gardée, son contexte lu.
    /** @type {Map<string, any[] | string>} */
    const regles = new Map();
    for (const sheet of [...new Set(decidees.map((e) => e.sheet))].sort()) {
      const res = await context.request.get(base + sheet);
      if (!res.ok()) {
        regles.set(sheet, `feuille introuvable sur le site (statut ${res.status()})`);
        continue;
      }
      const text = await res.text();
      let css;
      try {
        css = postcss.parse(text, { from: sheet });
      } catch (e) {
        const err = /** @type {any} */ (e);
        throw new Error(`${sheet} : CSS illisible (${err.line ? `ligne ${err.line} : ` : ''}${err.reason ?? String(err.message).split('\n')[0]})`);
      }
      const rules = rulesOf(css, new Set());
      regles.set(sheet, rules);
      /** @type {Map<number, number>} */
      const parLigne = new Map();
      for (const r of rules) parLigne.set(r.line, (parLigne.get(r.line) ?? 0) + 1);
      lignesPleines.set(sheet, new Set([...parLigne].filter(([, n]) => n > 1).map(([l]) => l)));
    }
    for (const entry of decidees) {
      const rules = /** @type {any[] | string} */ (regles.get(entry.sheet));
      const autre = `retrouver la déclaration dans la source et y écrire ${entry.value}`;
      if (typeof rules === 'string') {
        nonEcrites.push({ entry, categorie: 'feuille introuvable', cause: rules, aFaire: autre });
        continue;
      }
      const loc = localiser(rules, entry);
      if ('error' in loc) {
        nonEcrites.push({ entry, categorie: 'règle introuvable', cause: loc.error, aFaire: autre });
        continue;
      }
      const cd = composantDe(loc.decl, entry.property);
      if ('reason' in cd) {
        const jeton = jetonDe(entry.value);
        const aFaire =
          /var\(/i.test(loc.decl.value) && jeton
            ? `écrire ${entry.property} à part dans la source, avec le jeton ${jeton} ; le raccourci tient sa valeur d'un var(), sa valeur de repli n'est pas connue`
            : `écrire ${entry.value} dans la source`;
        nonEcrites.push({ entry, categorie: 'raccourci', cause: cd.reason, aFaire });
        continue;
      }
      // Garde d'apply : le composant trouvé doit être la valeur écrite attendue (ou déjà la nouvelle valeur).
      if (norm(cd.current) !== norm(entry.written) && norm(cd.current) !== norm(entry.value)) {
        nonEcrites.push({ entry, categorie: 'garde', cause: `valeur écrite attendue ${entry.written}, trouvée ${cd.current}`, aFaire: `vérifier la déclaration ; si c'est bien elle, écrire ${entry.value} dans la source` });
        continue;
      }
      const contexte = contexteDe(loc.rule);
      if (!Array.isArray(contexte)) {
        nonEcrites.push({ entry, categorie: 'contexte', cause: contexte.motif, aFaire: `écrire ${entry.value} dans la source` });
        continue;
      }
      candidates.push({ entry, rule: loc.rule, ligne: loc.line, colonne: loc.column, contexte, important: !!loc.decl.important, sur: [] });
    }
    // 2. Sur les pages de la réduction : la règle qui gagne chaque propriété, élément par élément ; les liens des
    //    feuilles visées, leur media, et celles qu'un script injecte (absentes du HTML de la page).
    const visees = new Set(candidates.map((c) => c.entry.sheet));
    for (const p of candidates.length ? pages : []) {
      const page = await context.newPage();
      try {
        await gotoAndSettle(page, base + p, { waitMs });
        const sur = await reglesGagnantes(
          page,
          candidates.map((c) => ({ feuille: c.entry.sheet, ligne: c.ligne, colonne: c.colonne, selecteur: uneLigne(c.rule.selector), propriete: c.entry.property })),
        );
        sur.forEach((s, i) => candidates[i].sur.push(...s));
        const html = await context.request.get(base + p).then((r) => r.text()).catch(() => null);
        const vus = await page.evaluate((brut) => {
          /** Liens de feuille d'un document, résolus contre l'adresse de la page. @param {Document} d */
          const adresses = (d) =>
            [...d.querySelectorAll('link[rel~="stylesheet"][href]')].map((l) => {
              const u = new URL(/** @type {string} */ (l.getAttribute('href')), location.href);
              return { chemin: u.origin === location.origin ? u.pathname : null, media: l.getAttribute('media') ?? '' };
            });
          const html = brut === null ? null : new Set(adresses(new DOMParser().parseFromString(brut, 'text/html')).map((x) => x.chemin));
          return adresses(document).map((x) => ({ ...x, injectee: html !== null && !html.has(x.chemin) }));
        }, html);
        for (const v of vus) {
          if (!v.chemin || !visees.has(v.chemin)) continue;
          const l = liens.get(v.chemin) ?? { media: new Set(), injectee: [] };
          if (v.media.trim()) l.media.add(v.media.trim());
          if (v.injectee && !l.injectee.includes(p)) l.injectee.push(p);
          liens.set(v.chemin, l);
        }
      } finally {
        await page.close().catch(() => {});
      }
    }
    // 3. Battue par l'ordre : une règle qui la suit dans la même feuille (ligne, puis colonne), de même spécificité,
    //    non reprise, gagne sur un élément. Une déclaration retirée peut en faire battre une autre : jusqu'à stabilité.
    /** @param {number | null} l @param {number | null} c @param {Candidate} x */
    const suit = (l, c, x) => (l ?? 0) > x.ligne || ((l ?? 0) === x.ligne && x.colonne != null && (c ?? 0) > x.colonne);
    for (;;) {
      const reprises = new Set(candidates.map((c) => `${c.entry.sheet}|${c.ligne}|${c.colonne}|${c.entry.property}`));
      const battues = [];
      for (const c of candidates) {
        const g = c.sur.find(
          (s) =>
            s.gagnante.origine === 'feuille' &&
            !s.gagnante.important &&
            s.gagnante.feuille === c.entry.sheet &&
            suit(s.gagnante.ligne, s.gagnante.colonne, c) &&
            !!s.gagnante.specificite &&
            comparer(s.gagnante.specificite, s.specificite) === 0 &&
            !reprises.has(`${c.entry.sheet}|${s.gagnante.ligne}|${c.colonne == null ? null : s.gagnante.colonne}|${c.entry.property}`),
        );
        if (g) battues.push({ c, g: g.gagnante });
      }
      if (!battues.length) break;
      for (const { c, g } of battues)
        nonEcrites.push({
          entry: c.entry,
          categorie: "battue par l'ordre",
          cause: `battue par l'ordre à spécificité égale (${g.selecteur}, ${repere(c.entry.sheet, g.ligne, g.colonne)}, la suit dans la même feuille et gagne)`,
          aFaire: `écrire ${c.entry.value} dans la source`,
        });
      const out = new Set(battues.map((b) => b.c));
      candidates = candidates.filter((c) => !out.has(c));
    }
  } finally {
    await browser.close();
  }

  /** Feuille, ligne, et colonne quand la ligne porte plusieurs règles. @param {string} sheet @param {number | null} line @param {number | null} [column] */
  function repere(sheet, line, column) {
    return `${sheet}:${line}${column != null && lignesPleines.get(sheet)?.has(/** @type {number} */ (line)) ? `:${column}` : ''}`;
  }
  const injectee = (/** @type {string} */ sheet) => (liens.get(sheet)?.injectee.length ?? 0) > 0;

  // 4. Une feuille ajoutée par feuille : règles dans l'ordre de la source.
  /** @type {FeuilleAjoutee[]} */
  const feuilles = [];
  for (const sheet of [...new Set(candidates.map((c) => c.entry.sheet))].sort()) {
    const mine = candidates.filter((c) => c.entry.sheet === sheet);
    /** @type {Map<any, typeof mine>} */
    const parRegle = new Map();
    for (const c of mine) parRegle.set(c.rule, [...(parRegle.get(c.rule) ?? []), c]);
    const blocs = [...parRegle.entries()]
      .sort(([a], [b]) => (a.source?.start?.offset ?? 0) - (b.source?.start?.offset ?? 0))
      .map(([rule, cs]) => {
        const ids = [...new Set(cs.flatMap((c) => c.entry.rows))];
        const ctx = cs[0].contexte;
        const pad = (/** @type {number} */ n) => '  '.repeat(n);
        return [
          `/* ${ids.join(', ')} ; ${repere(sheet, cs[0].entry.line, cs[0].colonne)} */`,
          ...ctx.map((x, i) => `${pad(i)}${x} {`),
          `${pad(ctx.length)}${uneLigne(rule.selector)} {`,
          ...cs.map(
            (c) =>
              `${pad(ctx.length + 1)}${c.entry.property}: ${c.entry.value}${c.important ? ' !important' : ''}; /* ${c.entry.rows.join(', ')}${c.important ? ` ; ${PROVISOIRE}` : ''} */`,
          ),
          `${pad(ctx.length)}}`,
          ...ctx.map((_, i) => `${pad(ctx.length - 1 - i)}}`),
        ].join('\n');
      });
    const tete = `/* ds-lab : feuille ajoutée de ${sheet}, à charger juste après elle. Tirée de modifications.json (${mods.tokens}, ${mods.stamp}). */`;
    feuilles.push({ feuille: sheet, ajout: cheminAjout(sheet), texte: `${tete}\n\n${blocs.join('\n\n')}\n` });
  }
  const tokensCss = feuilles.length && mods.tokensCss ? { path: mods.tokensCss.path, content: mods.tokensCss.content } : null;
  const ordre = (/** @type {any} */ e) => entries.indexOf(e);
  nonEcrites.sort((a, b) => ordre(a.entry) - ordre(b.entry));
  candidates.sort((a, b) => ordre(a.entry) - ordre(b.entry));
  const importantes = candidates.filter((c) => c.important);
  const injectees = candidates.filter((c) => injectee(c.entry.sheet));
  const reste = /** @type {string[]} */ (mods.brief?.reste ?? []);
  /** Lignes hors de modifications.json, avec leur cause ; sans le champ hors, le reste, sans cause. @type {{ lignes: string[], cause: string | null, texte: string }[]} */
  const hors = Array.isArray(mods.hors) ? mods.hors : reste.map((t) => ({ lignes: [], cause: null, texte: t }));
  const causesHors = [...new Set(hors.map((h) => h.cause).filter((c) => c !== null))];
  const compte = { ecrites: candidates.length, nonEcrites: nonEcrites.length, important: importantes.length, injectees: injectees.length, rattachements: rattachees.length, horsModifications: hors.length };
  /** @param {any} e @param {number | null} [colonne] */
  const vise = (e, colonne) => `${e.rows.join(', ')} : ${repere(e.sheet, e.line, colonne ?? e.column)} ${e.selector} { ${e.property} }`;
  /** @param {FeuilleAjoutee} f */
  const chargement = (f) => {
    const l = liens.get(f.feuille);
    if (l?.injectee.length)
      return `- ${f.ajout} : ${f.feuille} est injectée par un script après le chargement (absente du HTML de ${l.injectee.join(', ')}) ; le HTML ne peut pas la poser juste après elle : la charger depuis le même script, juste après l'injection.`;
    const media = l?.media.size ? `, avec le même media (${[...l.media].sort().join(' ; ')})` : '';
    return `- ${f.ajout} juste après ${f.feuille}${media}, dans toute page qui charge ${f.feuille}.`;
  };
  const L = [
    'FEUILLES AJOUTÉES',
    EN_TETE,
    `Tirées de modifications.json (${mods.tokens}, ${mods.stamp}) : ${compte.ecrites} déclaration(s) écrite(s) dans ${feuilles.length} feuille(s) ajoutée(s), dont ${compte.important} avec !important d'origine et ${compte.injectees} dans une feuille injectée par un script.`,
    '',
    'CHARGEMENT',
    ...(tokensCss ? [`- ${tokensCss.path} avant toutes les autres feuilles.`] : []),
    ...feuilles.map(chargement),
    '',
    `ÉCRITES AVEC !IMPORTANT D'ORIGINE (${importantes.length})`,
    ...importantes.map(
      (c) => `- ${vise(c.entry, c.colonne)} : écrite avec !important, comme la déclaration d'origine (provisoire). À faire : retirer !important de la source et de la feuille ajoutée quand le composant sera refait.`,
    ),
    '',
    `ÉCRITES DANS UNE FEUILLE INJECTÉE PAR UN SCRIPT (${injectees.length})`,
    ...injectees.map(
      (c) => `- ${vise(c.entry, c.colonne)} : ${c.entry.sheet} est injectée par un script. À faire : charger ${cheminAjout(c.entry.sheet)} depuis ce script, juste après elle.`,
    ),
    '',
    `NON ÉCRITES (${nonEcrites.length})`,
    ...CATEGORIES.flatMap((k) => {
      const xs = nonEcrites.filter((x) => x.categorie === k);
      return ['', `NON ÉCRITES, ${k.toUpperCase()} (${xs.length})`, ...xs.map((x) => `- ${vise(x.entry)} : ${x.cause}. À faire : ${x.aFaire}.`)];
    }),
    '',
    `RATTACHEMENTS NON FAITS (${rattachees.length})`,
    ...rattachees.map((e) => `- ${vise(e)} : ${e.value}. À faire : rattacher dans la source quand le composant sera refait.`),
    '',
    `HORS DE MODIFICATIONS.JSON (${hors.length})`,
    ...hors.filter((h) => h.cause === null).map((h) => `- ${h.texte}`),
    ...causesHors.flatMap((c) => {
      const xs = hors.filter((h) => h.cause === c);
      return ['', `HORS DE MODIFICATIONS.JSON, ${String(c).toUpperCase()} (${xs.length})`, ...xs.map((h) => `- ${h.texte}`)];
    }),
  ];
  const ecrites = new Map(candidates.map((c) => [c.entry, c]));
  const perdues = new Map(nonEcrites.map((x) => [x.entry, x]));
  const manifeste = {
    tokensCss: tokensCss?.path ?? null,
    feuilles: feuilles.map((f) => ({ feuille: f.feuille, ajout: f.ajout, injectee: injectee(f.feuille) })),
    viewport: { width: viewport.width, height: viewport.height },
    // Verdict par ligne décidée (verify --ajout) : la carte de la simulation, les lignes décidées, les lignes hors.
    simulation: mods.simulation ?? null,
    lignes: mods.lignes ?? [],
    hors,
    // Chaque déclaration décidée et ce qu'il en est advenu.
    declarations: decidees.map((e) => ({
      rows: e.rows,
      sheet: e.sheet,
      line: e.line,
      column: e.column ?? null,
      selector: e.selector,
      property: e.property,
      value: e.value,
      pages: e.pages ?? pages,
      ecrite: ecrites.has(e),
      cause: perdues.get(e)?.categorie ?? null,
      important: !!ecrites.get(e)?.important,
      injectee: ecrites.has(e) && injectee(e.sheet),
    })),
  };
  return { feuilles, tokensCss, pertes: L.join('\n') + '\n', compte, nonEcrites, manifeste };
}

/**
 * Écrit les feuilles ajoutées, tokens.css, pertes.md et le manifeste dans un dossier ; rend les chemins écrits,
 * relatifs au dossier. Aucun fichier du site n'est écrit.
 * @param {Awaited<ReturnType<typeof feuillesAjoutees>>} r @param {string} sortie
 */
export async function ecrireAjouts(r, sortie) {
  /** @type {[string, string][]} */
  const fichiers = [
    ...r.feuilles.map((f) => /** @type {[string, string]} */ ([f.ajout, f.texte])),
    ...(r.tokensCss ? [/** @type {[string, string]} */ ([r.tokensCss.path, r.tokensCss.content])] : []),
    [`/${PERTES}`, r.pertes],
    [`/${MANIFESTE}`, JSON.stringify(r.manifeste, null, 2) + '\n'],
  ];
  for (const [p, t] of fichiers) {
    const f = join(sortie, p);
    await mkdir(dirname(f), { recursive: true });
    await writeFile(f, t);
  }
  return fichiers.map(([p]) => p.replace(/^\//, ''));
}
