// @ts-check
/**
 * Preuve des feuilles ajoutées sur une réduction de fixtures (docs/attendus/feuille-ajoutee.md) : réduction avec ses
 * références, feuilles ajoutées sur le site intact, copie passée par apply ; captures de chaque page de la réduction
 * avec les feuilles ajoutées (clair, puis système en sombre) et de la copie appliquée ; verdict par ligne décidée tiré
 * des relevés de la capture en clair (docs/attendus/verdict-par-decision.md).
 */
import { readFile, writeFile, mkdtemp, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './serveur.js';
import { runReduce } from '../../src/reduce/run.js';
import { applyModifications } from '../../src/apply/apply.js';
import { feuillesAjoutees, ecrireAjouts, MANIFESTE } from '../../src/apply/ajout.js';
import { capturePage } from '../../src/verify/capture.js';
import { referenceFiles } from '../../src/verify/reference.js';
import { compareImages, compareAria } from '../../src/verify/compare.js';
import { juger } from '../../src/verify/arrivee.js';

export const TOKENS = new URL('../../tokens/orbe-cafe/marque.resolver.json', import.meta.url).pathname;
const VIEWPORT = { width: 1366, height: 900 };

/**
 * @param {Awaited<ReturnType<typeof startFixtureServers>>} servers
 * @param {Record<string, any>} opts  options de runReduce propres à la réduction (cible, adresses, décisions)
 */
export async function preuve(servers, opts) {
  const refs = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-refs-'));
  const [run] = await runReduce({
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: VIEWPORT,
    waitMs: 100,
    now: new Date(2026, 10, 17, 12, 0),
    referencesPath: refs,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-ajout-reduce-')),
    ...opts,
  });
  const mods = JSON.parse(await readFile(/** @type {string} */ (run.files.find((f) => f.endsWith('modifications.json'))), 'utf8'));
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  const ajout = await feuillesAjoutees(mods, { origine: servers.origin, waitMs: 100 });
  await ecrireAjouts(ajout, sortie);
  // Copie passée par apply ; tokens.css chargé avant les autres feuilles, comme le demande reste.md.
  const copie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-copie-'));
  await cp(FIXTURE_DIR, copie, { recursive: true });
  await applyModifications(mods, { root: copie, restePath: join(copie, 'reste.md') });
  const pages = run.pages.map((p) => new URL(p.url).pathname);
  for (const p of pages) {
    const h = await readFile(join(copie, p), 'utf8');
    await writeFile(join(copie, p), h.replace(/(\n(\s*)<link rel="stylesheet")/, `\n$2<link rel="stylesheet" href="${mods.tokensCss.path}">$1`));
  }
  const appliquee = await startFixtureServers({ root: copie });
  const thirdParty = ['.tiers-cookies'];
  /** @type {{ page: string, ajout: { px: number, aria: boolean }, reference: { px: number, aria: boolean }, sombre: number, releve: any }[]} */
  const resultats = [];
  try {
    for (const p of pages) {
      const app = await capturePage({ url: appliquee.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty });
      const clair = await capturePage({ url: servers.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty, ajout: sortie });
      const sombre = await capturePage({ url: servers.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty, ajout: sortie, juger: false, colorScheme: 'dark' });
      const f = referenceFiles(refs, servers.origin + p);
      const refAria = (await readFile(f.aria, 'utf8')).replace(/\n$/, '');
      resultats.push({
        page: p,
        ajout: { px: compareImages(app.png, clair.png).different, aria: compareAria(app.aria, clair.aria).identical },
        reference: { px: compareImages(await readFile(f.png), clair.png).different, aria: compareAria(refAria, clair.aria).identical },
        sombre: compareImages(clair.png, sombre.png).different,
        releve: clair.releve,
      });
    }
  } finally {
    await appliquee.close();
  }
  const manifeste = JSON.parse(await readFile(join(sortie, MANIFESTE), 'utf8'));
  return {
    mods,
    ajout,
    sortie,
    resultats,
    manifeste,
    /** Verdict par ligne décidée sur les pages de la réduction, tiré des relevés en clair. */
    get verdict() {
      return juger(manifeste, resultats.map((x) => x.releve));
    },
  };
}

/**
 * Lignes décidées (REMPLACEMENTS, COUPLAGES) et lignes hors de modifications.json : chacune est écrite dans sa
 * feuille ajoutée ou présente dans le fichier des pertes. Rend la liste de celles qui ne sont ni l'une ni l'autre.
 * @param {any} mods @param {Awaited<ReturnType<typeof feuillesAjoutees>>} ajout
 */
export function lignesPerdues(mods, ajout) {
  const tout = ajout.pertes.split('\n');
  // Les lignes non écrites sont listées entre NON ÉCRITES et RATTACHEMENTS NON FAITS.
  const pertes = tout.slice(tout.findIndex((l) => l.startsWith('NON ÉCRITES (')), tout.findIndex((l) => l.startsWith('RATTACHEMENTS NON FAITS (')));
  const reste = tout.slice(tout.findIndex((l) => l.startsWith('HORS DE MODIFICATIONS.JSON (')));
  const texte = (/** @type {string} */ sheet) => ajout.feuilles.find((f) => f.feuille === sheet)?.texte ?? '';
  /** @type {string[]} */
  const out = [];
  for (const e of mods.entries.filter((/** @type {any} */ x) => x.section !== 'RATTACHE')) {
    const t = texte(e.sheet);
    const ecrite = t.includes(`${e.property}: ${e.value}; /* ${e.rows.join(', ')} */`) || t.includes(`${e.property}: ${e.value} !important; /* ${e.rows.join(', ')} ; `);
    const vise = [`${e.sheet}:${e.line} `, `${e.sheet}:${e.line}:${e.column} `].map((r) => `- ${e.rows.join(', ')} : ${r}${e.selector} { ${e.property} } : `);
    const listee = pertes.some((l) => vise.some((v) => l.startsWith(v)));
    if (ecrite === listee) out.push(`${e.rows.join(', ')} ${e.sheet}:${e.line} ${e.property} : ${ecrite ? 'écrite et listée' : 'ni écrite ni listée'}`);
  }
  for (const h of mods.hors) if (!reste.includes(`- ${h.texte}`)) out.push(`hors de modifications.json, absente : ${h.texte}`);
  return out;
}

/**
 * Une seule cause par déclaration, la même dans la ligne de verdict, le détail et pertes.md
 * (docs/attendus/verify-se-reconnait.md). Chaque détail d'une déclaration non arrivée dit une cause, ce qui la tient
 * et un « à faire » ; pour une déclaration non écrite ou hors de modifications.json, pertes.md a une ligne qui porte
 * cet « à faire », sous une section qui nomme cette cause. La ligne de verdict finit par « cause : <la cause> » si ses
 * détails n'en ont qu'une, par « causes : voir le détail » sinon. Rend les désaccords.
 * @param {{ lignes: { texte: string, details: string[] }[] }} verdict @param {string} pertes
 */
export function desaccords(verdict, pertes) {
  const P = pertes.split('\n');
  /** Section d'une ligne de pertes.md : le dernier titre au-dessus d'elle. @param {number} i */
  const section = (i) => P.slice(0, i).findLast((l) => /^[A-ZÀ-Ý]/.test(l)) ?? '';
  /** @type {string[]} */
  const out = [];
  for (const l of verdict.lignes) {
    /** @type {Set<string>} */
    const causes = new Set();
    for (const d of l.details.filter((x) => / : (écrite|non écrite|hors de modifications\.json) ; (en partie|non arrivée)/.test(x))) {
      const i = d.indexOf(' ; cause : ');
      const j = d.indexOf(' ; tient : ');
      const k = d.indexOf(' ; à faire : ');
      if (i < 0 || j < i || k < j || d.indexOf(' ; cause : ', i + 1) >= 0) {
        out.push(`détail sans une cause, un « tient » et un « à faire », dans cet ordre : ${d}`);
        continue;
      }
      const cause = d.slice(i + ' ; cause : '.length, j);
      const aFaire = d.slice(k + ' ; à faire : '.length);
      causes.add(cause);
      if (!/ : (non écrite|hors de modifications\.json) ; /.test(d)) continue;
      const ok = P.some((x, n) => x.startsWith('- ') && x.includes(aFaire) && section(n).includes(cause.toUpperCase()));
      if (!ok) out.push(`pertes.md ne dit pas « ${cause} » ni « ${aFaire} » : ${d}`);
    }
    if (!causes.size) continue;
    const fin = causes.size === 1 ? ` ; cause : ${[...causes][0]}` : ' ; causes : voir le détail';
    if (!l.texte.endsWith(fin)) out.push(`ligne de verdict sans « ${fin.slice(3)} » : ${l.texte}`);
  }
  return out;
}

/**
 * État de chaque ligne décidée qui n'est pas arrivée, par identifiant.
 * @param {Awaited<ReturnType<typeof preuve>>} r
 */
export function pasArrivees(r) {
  return Object.fromEntries(r.verdict.lignes.filter((l) => l.etat !== 'arrivée').map((l) => [l.id, l.etat]));
}
