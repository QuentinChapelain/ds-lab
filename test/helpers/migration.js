// @ts-check
/**
 * migration.md sur les pages de fixtures : réductions et lecture de la consigne pour un agent, communes aux deux
 * fichiers de test de migration.md (e2e-migration.test.js, e2e-migration-decisions.test.js), qui tournent en parallèle.
 */
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FIXTURE_DIR } from './serveur.js';
import { runReduce } from '../../src/reduce/run.js';

/** Attendus de migration.md, écrits avant le code. */
export const E = JSON.parse(await readFile(new URL('../../fixtures/marque-demo/expected-migration.json', import.meta.url), 'utf8'));
const TOKENS = new URL('../../tokens/orbe-cafe/marque.resolver.json', import.meta.url).pathname;

/** @typedef {{ data: any, md: string, table: any }} Reduction */

/**
 * Une réduction sur la cible de la valise, avec le fichier de jetons d'Orbe Café sauf `sansJetons`.
 * @param {string[]} addresses
 * @param {{ decisionsPath?: string, sansJetons?: boolean }} [opts]
 * @returns {Promise<Reduction>}
 */
export async function reduire(addresses, { decisionsPath, sansJetons = false } = {}) {
  const [run] = await runReduce({
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    ...(sansJetons ? {} : { tokensPath: TOKENS }),
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    now: new Date(2026, 10, 12, 14, 0),
    addresses,
    ...(decisionsPath ? { decisionsPath } : {}),
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')),
  });
  return { data: run.migration, table: run.table, md: await readFile(run.files[2], 'utf8') };
}

/**
 * Adresses des trois pages en désordre, la première servie par le serveur des fixtures.
 * @param {string} origin
 */
export function pagesDesordre(origin) {
  const [first, ...rest] = E.conditions.pages;
  return [origin + first, ...rest];
}

/** Lignes d'une section de la consigne, de son titre à la ligne vide. @param {string[]} lines @param {string} head */
export const sectionOf = (lines, head) => {
  const i = lines.findIndex((l) => l.startsWith(head));
  if (i < 0) return null;
  const j = lines.indexOf('', i);
  return lines.slice(i, j < 0 ? undefined : j);
};
/** Ligne numérotée d'une section pour un identifiant. @param {string[]} sec @param {string} id */
export const stepOf = (sec, id) => sec.find((l) => new RegExp(`^\\d+\\. ${id} `).test(l));
/** Valeurs inchangées qui ont un jeton. @param {any} d */
export const withToken = (d) => d.rows.filter((/** @type {any} */ r) => r.status === 'inchangé' && /^(couleur|espace|taille-texte|rayon)\./.test(r.token));
