// @ts-check
/**
 * La cible prise dans la marque (D76, D82), sur les trois pages en désordre, avec d'autres marques que celle lue sur le
 * site ; CM1 et CM3 sont dans test/e2e-cible-marque.test.js :
 *   CM2 une deuxième marque (Atelier Lavandine) : chaque nuance proposée à la revue (valeur retenue, candidats, versions
 *       du texte sur plein) existe dans la cible écrite dans table.json, et chaque couleur de cette cible est un jeton
 *       de la marque ;
 *   CM4 le sable en accent : les terracottas du site n'ont la teinte d'aucune échelle de la marque, ils vont au neutre
 *       (M8), jamais sur l'erreur, qui a leur teinte mais dit un sens ; CB4 le vérifie aussi sans navigateur.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers } from './helpers/serveur.js';
import { reduire, saisir } from './helpers/cible-marque.js';
import { lireResolver } from '../src/tokens/resolver.js';
import { flattenTokens } from '../src/tokens/roles.js';

const LAVANDINE = new URL('../tokens/atelier-lavandine/marque.resolver.json', import.meta.url).pathname;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let lavandine;
/** @type {any} */
let sable;

before(async () => {
  servers = await startFixtureServers();
  lavandine = await reduire(servers, LAVANDINE);
  sable = await reduire(servers, (await saisir('#f0c987')).tokensPath);
});

after(async () => servers?.close());

test('CM2 deuxième marque : chaque nuance proposée est dans la cible écrite, et chaque couleur de la cible est un jeton', async () => {
  const table = JSON.parse(await readFile(/** @type {string} */ (lavandine.files.find((/** @type {string} */ f) => f.endsWith('table.json'))), 'utf8'));
  const cible = new Set(table.target.colors.map((/** @type {any} */ c) => c.value));
  const jetons = new Set([...flattenTokens(lireResolver(LAVANDINE).jetons).values()].map((/** @type {any} */ t) => String(t.$value?.hex ?? '').toLowerCase()));
  const hors = [...cible].filter((c) => !jetons.has(c));
  assert.deepEqual(hors, [], 'couleurs de la cible sans jeton');
  /** @type {string[]} */
  const proposees = [];
  for (const r of table.table.families.colors.rows) {
    if (r.new) proposees.push(`${r.id} ${r.new}`);
    for (const c of r.candidates ?? []) proposees.push(`${r.id} ${c.value}`);
  }
  for (const g of table.table.pleins ?? []) for (const v of g.versions) if (v.choice !== 'garder') proposees.push(`${g.id} ${v.text}`, `${g.id} ${v.bg}`);
  assert.ok(proposees.length > 30);
  assert.deepEqual(proposees.filter((p) => !cible.has(/** @type {string} */ (p.split(' ')[1]))), []);
});

test('CM4 le sable en accent : les terracottas vont au neutre (M8), jamais sur l’erreur', () => {
  const terracottas = sable.table.families.colors.rows.filter((/** @type {any} */ r) => ['#d0563f', '#c4513a', '#c8553d'].includes(r.old));
  assert.ok(terracottas.length >= 2, `${terracottas.length} lignes`);
  assert.deepEqual(
    terracottas.filter((/** @type {any} */ r) => !r.name?.startsWith('neutre-') || r.candidates.some((/** @type {any} */ c) => !c.name.startsWith('neutre-'))).map((/** @type {any} */ r) => `${r.old} ${r.usage} ${r.name}`),
    [],
  );
  assert.ok(terracottas.some((/** @type {any} */ r) => /M8/.test(r.reason ?? '')));
});
