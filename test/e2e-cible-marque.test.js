// @ts-check
/**
 * La cible prise dans la marque saisie (D76), sur les trois pages en désordre du dossier de jeu :
 *   CM1 une marque saisie par ses deux couleurs du site ; à chaque décision, la première nuance proposée ; au texte sur
 *       plein, la première version qui passe : aucune ligne décidée non arrivée (une ligne vue seulement à un état
 *       reste non vérifiable), sortie 0 ;
 *   CM2 une deuxième marque (Atelier Lavandine) : chaque nuance proposée à la revue (valeur retenue, candidats, versions
 *       du texte sur plein) existe dans la cible écrite dans table.json, et chaque couleur de cette cible est un jeton
 *       de la marque ;
 *   CM3 la troisième couleur du site (le sable, #f0c987) n'a la teinte d'aucune échelle de la marque : elle va au
 *       neutre (M8), en fond comme en texte ;
 *   CM4 le sable en accent : les terracottas du site n'ont la teinte d'aucune échelle de la marque, ils vont au neutre
 *       (M8), jamais sur l'erreur, qui a leur teinte mais dit un sens ; CB4 le vérifie aussi sans navigateur.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { preuve, pasArrivees } from './helpers/ajout.js';
import { runReduce } from '../src/reduce/run.js';
import { rowKey } from '../src/reduce/propose.js';
import { lireResolver } from '../src/tokens/resolver.js';
import { flattenTokens } from '../src/tokens/roles.js';

const PAGES = ['/desordre/carte.html', '/desordre/compte.html', '/desordre/gestion.html'];
const CIBLE = `${FIXTURE_DIR}cible-valise.json`;
const LAVANDINE = new URL('../tokens/atelier-lavandine/marque.resolver.json', import.meta.url).pathname;
const SAISIE = new URL('../src/cli/saisie.js', import.meta.url).pathname;
const VIEWPORT = { width: 1366, height: 900 };

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof preuve>>} */
let partie;
/** @type {any} */
let lavandine;
/** @type {any} */
let premiere;
/** @type {any} */
let sable;

/** @param {string} tokensPath @param {string} [decisionsPath] */
const reduire = async (tokensPath, decisionsPath) =>
  (
    await runReduce({
      addresses: [servers.origin + PAGES[0], ...PAGES.slice(1)],
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

/** La marque saisie comme le fait le parcours ; son resolver. @param {string} accent */
const saisir = async (accent) => {
  const dossier = await mkdtemp(join(tmpdir(), 'ds-lab-cible-marque-saisie-'));
  const entree = join(dossier, 'entree.json');
  await writeFile(entree, JSON.stringify({ name: 'Essai', primary: '#2b4c7e', accent, fonts: { heading: ['Georgia', 'serif'] } }));
  const s = spawnSync(process.execPath, [SAISIE, entree], { encoding: 'utf8' });
  assert.equal(s.status, 0, s.stdout + s.stderr);
  return { dossier, tokensPath: join(dossier, 'marque.resolver.json') };
};

before(async () => {
  servers = await startFixtureServers();
  // La marque lue sur le site : ses deux couleurs.
  const { dossier, tokensPath } = await saisir('#c8553d');
  premiere = await reduire(tokensPath);
  /** @type {Record<string, string>} */
  const decisions = {};
  for (const [family, f] of Object.entries(premiere.table.families))
    for (const r of /** @type {any[]} */ (f.rows)) if (r.class === 'décision' && r.candidates?.length) decisions[rowKey(family, r)] = r.candidates[0].value;
  for (const g of /** @type {any[]} */ (premiere.table.pleins ?? [])) decisions[g.key] = g.versions.find((/** @type {any} */ v) => v.pass)?.choice ?? 'garder';
  const fichier = join(dossier, 'decisions.json');
  await writeFile(fichier, JSON.stringify(decisions));
  partie = await preuve(servers, { addresses: [servers.origin + PAGES[0], ...PAGES.slice(1)], targetPath: CIBLE, tokensPath, brandColors: true, decisionsPath: fichier });
  lavandine = await reduire(LAVANDINE);
  sable = await reduire((await saisir('#f0c987')).tokensPath);
});

after(async () => servers?.close());

test('CM1 marque saisie par ses deux couleurs, la première nuance à chaque décision : aucune ligne non arrivée', () => {
  const v = partie.verdict;
  assert.ok(v.lignes.length > 40, `${v.lignes.length} lignes`);
  // Une ligne vue seulement au survol, au focus ou à l'appui n'est pas jugée sur la page : elle reste à l'humain.
  const manquantes = Object.entries(pasArrivees(partie)).filter(([, etat]) => etat !== 'non vérifiable (état)');
  assert.deepEqual([manquantes, v.sortie], [[], 0]);
});

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

test('CM3 la troisième couleur du site va au neutre (M8), en fond comme en texte', () => {
  const sable = premiere.table.families.colors.rows.filter((/** @type {any} */ r) => r.old === '#f0c987');
  assert.deepEqual(
    sable.map((/** @type {any} */ r) => [r.usage, r.name?.replace(/-\d+$/, ''), r.candidates.every((/** @type {any} */ c) => c.name.startsWith('neutre-'))]),
    [
      ['fond', 'neutre', true],
      ['texte', 'neutre', true],
    ].filter(([u]) => sable.some((/** @type {any} */ r) => r.usage === u)),
  );
  assert.ok(sable.length >= 2);
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
