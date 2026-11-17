// @ts-check
/**
 * Preuve des feuilles ajoutées sur une réduction de fixtures (docs/attendus/feuille-ajoutee.md) : réduction avec ses
 * références, feuilles ajoutées sur le site intact, copie passée par apply ; captures de chaque page de la réduction
 * avec les feuilles ajoutées (clair, puis système en sombre) et de la copie appliquée.
 */
import { readFile, writeFile, mkdtemp, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './serveur.js';
import { runReduce } from '../../src/reduce/run.js';
import { applyModifications } from '../../src/apply/apply.js';
import { feuillesAjoutees, ecrireAjouts } from '../../src/apply/ajout.js';
import { capturePage } from '../../src/verify/capture.js';
import { referenceFiles } from '../../src/verify/reference.js';
import { compareImages, compareAria } from '../../src/verify/compare.js';

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
  /** @type {{ page: string, ajout: { px: number, aria: boolean }, reference: { px: number, aria: boolean }, sombre: number }[]} */
  const resultats = [];
  try {
    for (const p of pages) {
      const app = await capturePage({ url: appliquee.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty });
      const clair = await capturePage({ url: servers.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty, ajout: sortie });
      const sombre = await capturePage({ url: servers.origin + p, viewport: VIEWPORT, waitMs: 100, thirdParty, ajout: sortie, colorScheme: 'dark' });
      const f = referenceFiles(refs, servers.origin + p);
      const refAria = (await readFile(f.aria, 'utf8')).replace(/\n$/, '');
      resultats.push({
        page: p,
        ajout: { px: compareImages(app.png, clair.png).different, aria: compareAria(app.aria, clair.aria).identical },
        reference: { px: compareImages(await readFile(f.png), clair.png).different, aria: compareAria(refAria, clair.aria).identical },
        sombre: compareImages(clair.png, sombre.png).different,
      });
    }
  } finally {
    await appliquee.close();
  }
  return { mods, ajout, sortie, resultats };
}

/**
 * Lignes décidées (REMPLACEMENTS, COUPLAGES) et lignes du reste : chacune est écrite dans sa feuille ajoutée ou
 * présente dans le fichier des pertes. Rend la liste de celles qui ne sont ni l'une ni l'autre.
 * @param {any} mods @param {Awaited<ReturnType<typeof feuillesAjoutees>>} ajout
 */
export function lignesPerdues(mods, ajout) {
  const pertes = ajout.pertes.split('\n');
  const texte = (/** @type {string} */ sheet) => ajout.feuilles.find((f) => f.feuille === sheet)?.texte ?? '';
  /** @type {string[]} */
  const out = [];
  for (const e of mods.entries.filter((/** @type {any} */ x) => x.section !== 'RATTACHE')) {
    const ecrite = texte(e.sheet).includes(`${e.property}: ${e.value}; /* ${e.rows.join(', ')} */`);
    const listee = pertes.some((l) => l.startsWith(`- ${e.rows.join(', ')} : ${e.sheet}:${e.line} ${e.selector} { ${e.property} } : `));
    if (ecrite === listee) out.push(`${e.rows.join(', ')} ${e.sheet}:${e.line} ${e.property} : ${ecrite ? 'écrite et listée' : 'ni écrite ni listée'}`);
  }
  for (const t of mods.brief.reste) if (!pertes.includes(`- ${t}`)) out.push(`reste absent : ${t}`);
  return out;
}
