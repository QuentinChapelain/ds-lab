// @ts-check
/**
 * Feuilles ajoutées (D37) : la migration posée à côté de l'ancien code, sans toucher à aucune de ses feuilles.
 * Lit modifications.json, et rien d'autre de la réduction (D30) ; lit sur le site servi, intact, les feuilles
 * visées et les pages de la réduction (brief.pages).
 *
 * Une feuille ajoutée par feuille modifiée, <feuille>.ajout.css, à charger juste après elle ; tokens.css avant
 * toutes les feuilles. Seules les lignes décidées (REMPLACEMENTS, COUPLAGES) y entrent, chacune sous le sélecteur
 * de la source, dans son contexte (@media, @supports, @layer…), en propriété longue, l'identifiant de sa ligne en
 * commentaire. Aucune surenchère : ni !important ni spécificité ajoutés. Ne sont pas écrites, et sont listées avec
 * leur cause dans pertes.md :
 *   - la déclaration que la garde d'apply refuse (valeur écrite autre que l'attendue, règle introuvable…) ;
 *   - la déclaration d'origine en !important ;
 *   - la déclaration battue par l'ordre à spécificité égale : sur un élément d'une page, une règle qui la suit dans
 *     la même feuille, de même spécificité, non reprise, gagne la propriété ; reprise après sa feuille, elle
 *     passerait devant ;
 *   - le contexte que la feuille ajoutée ne sait pas redire (règle imbriquée, couche anonyme).
 * Les lignes simplement rattachées (RATTACHE) n'y entrent pas : « rattachement non fait ». Le reste de
 * modifications.json est recopié.
 */
import postcss from 'postcss';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { rulesOf, localiser, composantDe, norm } from './localisation.js';
import { lancerChromium } from '../browser/lancement.js';
import { gotoAndSettle } from '../browser/navigate.js';
import { reglesGagnantes, comparer } from '../browser/ordre.js';

export const MANIFESTE = 'feuilles-ajoutees.json';
const PERTES = 'pertes.md';
const SECTIONS_DECIDEES = new Set(['REMPLACEMENTS', 'COUPLAGES']);
const EN_TETE = "La réduction ne voit pas les styles en ligne : une valeur posée par un attribut style n'est ni dans modifications.json, ni dans ce fichier.";

/** Chemin de la feuille ajoutée d'une feuille. @param {string} feuille */
const cheminAjout = (feuille) => (/\.css$/i.test(feuille) ? feuille.replace(/\.css$/i, '.ajout.css') : `${feuille}.ajout.css`);

/** Sélecteur de la source, sur une ligne. @param {string} s */
const uneLigne = (s) => s.replace(/\s+/g, ' ').trim();

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
 * @typedef {{ entry: any, cause: string, aFaire: string }} NonEcrite
 * @typedef {{ feuille: string, ajout: string, texte: string }} FeuilleAjoutee
 */

/**
 * @param {any} mods  contenu de modifications.json
 * @param {{ origine?: string, viewport?: { width: number, height: number }, waitMs?: number, storageState?: string }} [o]
 *   origine : adresse du site intact (défaut : http://<host> de modifications.json)
 */
export async function feuillesAjoutees(mods, { origine, viewport = { width: 1366, height: 900 }, waitMs, storageState } = {}) {
  const base = (origine ?? `http://${mods.host}`).replace(/\/$/, '');
  const entries = /** @type {any[]} */ (mods.entries ?? []);
  const decidees = entries.filter((e) => SECTIONS_DECIDEES.has(e.section));
  const rattachees = entries.filter((e) => !SECTIONS_DECIDEES.has(e.section));
  /** @type {NonEcrite[]} */
  const nonEcrites = [];
  /** Déclarations candidates : entrée, règle, contexte et, page par page, la règle qui gagne. @type {{ entry: any, rule: any, contexte: string[], sur: import('../browser/ordre.js').Sur[] }[]} */
  let candidates = [];
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
      regles.set(sheet, rulesOf(css, new Set()));
    }
    for (const entry of decidees) {
      const rules = /** @type {any[] | string} */ (regles.get(entry.sheet));
      const autre = `retrouver la déclaration dans la source et y écrire ${entry.value}`;
      if (typeof rules === 'string') {
        nonEcrites.push({ entry, cause: rules, aFaire: autre });
        continue;
      }
      const loc = localiser(rules, entry);
      if ('error' in loc) {
        nonEcrites.push({ entry, cause: loc.error, aFaire: autre });
        continue;
      }
      const cd = composantDe(loc.decl, entry.property);
      if ('reason' in cd) {
        nonEcrites.push({ entry, cause: cd.reason, aFaire: autre });
        continue;
      }
      // Garde d'apply : le composant trouvé doit être la valeur écrite attendue (ou déjà la nouvelle valeur).
      if (norm(cd.current) !== norm(entry.written) && norm(cd.current) !== norm(entry.value)) {
        nonEcrites.push({ entry, cause: `valeur écrite attendue ${entry.written}, trouvée ${cd.current}`, aFaire: `vérifier la déclaration ; si c'est bien elle, écrire ${entry.value} dans la source` });
        continue;
      }
      if (loc.decl.important) {
        nonEcrites.push({ entry, cause: "!important d'origine", aFaire: `écrire ${entry.value} dans la source, ou décider d'un !important dans la feuille ajoutée` });
        continue;
      }
      const contexte = contexteDe(loc.rule);
      if (!Array.isArray(contexte)) {
        nonEcrites.push({ entry, cause: contexte.motif, aFaire: `écrire ${entry.value} dans la source` });
        continue;
      }
      candidates.push({ entry, rule: loc.rule, contexte, sur: [] });
    }
    // 2. Sur les pages de la réduction : la règle qui gagne chaque propriété, élément par élément.
    for (const p of mods.brief?.pages ?? []) {
      const page = await context.newPage();
      try {
        await gotoAndSettle(page, base + p, { waitMs });
        const sur = await reglesGagnantes(
          page,
          candidates.map((c) => ({ feuille: c.entry.sheet, ligne: c.entry.line, selecteur: uneLigne(c.rule.selector), propriete: c.entry.property })),
        );
        sur.forEach((s, i) => candidates[i].sur.push(...s));
      } finally {
        await page.close().catch(() => {});
      }
    }
    // 3. Battue par l'ordre : une règle qui la suit dans la même feuille, de même spécificité, non reprise, gagne
    //    sur un élément. Une déclaration retirée peut en faire battre une autre : jusqu'à stabilité.
    for (;;) {
      const reprises = new Set(candidates.map((c) => `${c.entry.sheet}|${c.entry.line}|${c.entry.property}`));
      const battues = [];
      for (const c of candidates) {
        const g = c.sur.find(
          (s) =>
            s.gagnante.origine === 'feuille' &&
            !s.gagnante.important &&
            s.gagnante.feuille === c.entry.sheet &&
            (s.gagnante.ligne ?? 0) > c.entry.line &&
            !!s.gagnante.specificite &&
            comparer(s.gagnante.specificite, s.specificite) === 0 &&
            !reprises.has(`${c.entry.sheet}|${s.gagnante.ligne}|${c.entry.property}`),
        );
        if (g) battues.push({ c, g: g.gagnante });
      }
      if (!battues.length) break;
      for (const { c, g } of battues)
        nonEcrites.push({
          entry: c.entry,
          cause: `battue par l'ordre à spécificité égale (${g.selecteur}, ${c.entry.sheet}:${g.ligne}, la suit dans la même feuille et gagne)`,
          aFaire: `écrire ${c.entry.value} dans la source`,
        });
      const out = new Set(battues.map((b) => b.c));
      candidates = candidates.filter((c) => !out.has(c));
    }
  } finally {
    await browser.close();
  }
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
          `/* ${ids.join(', ')} ; ${sheet}:${cs[0].entry.line} */`,
          ...ctx.map((x, i) => `${pad(i)}${x} {`),
          `${pad(ctx.length)}${uneLigne(rule.selector)} {`,
          ...cs.map((c) => `${pad(ctx.length + 1)}${c.entry.property}: ${c.entry.value}; /* ${c.entry.rows.join(', ')} */`),
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
  const reste = /** @type {string[]} */ (mods.brief?.reste ?? []);
  const compte = { ecrites: candidates.length, nonEcrites: nonEcrites.length, rattachements: rattachees.length, horsModifications: reste.length };
  const vise = (/** @type {any} */ e) => `${e.rows.join(', ')} : ${e.sheet}:${e.line} ${e.selector} { ${e.property} }`;
  const L = [
    'FEUILLES AJOUTÉES',
    EN_TETE,
    `Tirées de modifications.json (${mods.tokens}, ${mods.stamp}) : ${compte.ecrites} déclaration(s) écrite(s) dans ${feuilles.length} feuille(s) ajoutée(s).`,
    '',
    'CHARGEMENT',
    ...(tokensCss ? [`- ${tokensCss.path} avant toutes les autres feuilles.`] : []),
    ...feuilles.map((f) => `- ${f.ajout} juste après ${f.feuille}, dans toute page qui charge ${f.feuille}.`),
    '',
    `NON ÉCRITES (${nonEcrites.length})`,
    ...nonEcrites.map((x) => `- ${vise(x.entry)} : ${x.cause}. À faire : ${x.aFaire}.`),
    '',
    `RATTACHEMENTS NON FAITS (${rattachees.length})`,
    ...rattachees.map((e) => `- ${vise(e)} : ${e.value}. À faire : rattacher dans la source quand le composant sera refait.`),
    '',
    `HORS DE MODIFICATIONS.JSON (${reste.length})`,
    ...reste.map((t) => `- ${t}`),
  ];
  const manifeste = { tokensCss: tokensCss?.path ?? null, feuilles: feuilles.map((f) => ({ feuille: f.feuille, ajout: f.ajout })) };
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
