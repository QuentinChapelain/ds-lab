// @ts-check
/**
 * Ce que partagent les deux fichiers de la cible prise dans la marque (D76) : les pages en désordre, la réduction avec
 * les couleurs de la marque, et la saisie d'une marque comme le fait le parcours.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FIXTURE_DIR } from './serveur.js';
import { runReduce } from '../../src/reduce/run.js';

export const PAGES = ['/desordre/carte.html', '/desordre/compte.html', '/desordre/gestion.html'];
export const CIBLE = `${FIXTURE_DIR}cible-valise.json`;
const SAISIE = new URL('../../src/cli/saisie.js', import.meta.url).pathname;
const VIEWPORT = { width: 1366, height: 900 };

/** Les adresses des trois pages. @param {{ origin: string }} servers */
export const adresses = (servers) => [servers.origin + PAGES[0], ...PAGES.slice(1)];

/**
 * La réduction des trois pages, cible prise dans la marque.
 * @param {{ origin: string }} servers @param {string} tokensPath @param {string} [decisionsPath]
 */
export const reduire = async (servers, tokensPath, decisionsPath) =>
  (
    await runReduce({
      addresses: adresses(servers),
      targetPath: CIBLE,
      tokensPath,
      brandColors: true,
      decisionsPath,
      sourcesPath: `${FIXTURE_DIR}sources.json`,
      viewport: VIEWPORT,
      waitMs: 100,
      outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-cible-marque-')),
    })
  )[0];

/** La marque saisie comme le fait le parcours : le bleu du site et l'accent donné ; son dossier et son resolver. @param {string} accent */
export const saisir = async (accent) => {
  const dossier = await mkdtemp(join(tmpdir(), 'ds-lab-cible-marque-saisie-'));
  const entree = join(dossier, 'entree.json');
  await writeFile(entree, JSON.stringify({ name: 'Essai', primary: '#2b4c7e', accent, fonts: { heading: ['Georgia', 'serif'] } }));
  const s = spawnSync(process.execPath, [SAISIE, entree], { encoding: 'utf8' });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  return { dossier, tokensPath: join(dossier, 'marque.resolver.json') };
};
