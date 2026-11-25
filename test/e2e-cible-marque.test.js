// @ts-check
/**
 * La cible prise dans la marque saisie (D76), sur les trois pages en désordre du dossier de jeu ; CM2 et CM4 sont dans
 * test/e2e-cible-marque-autres-marques.test.js :
 *   CM1 une marque saisie par ses deux couleurs du site ; à chaque décision, la première nuance proposée ; au texte sur
 *       plein, la première version qui passe : aucune ligne décidée non arrivée (une ligne vue seulement à un état
 *       reste non vérifiable), sortie 0 ;
 *   CM3 la troisième couleur du site (le sable, #f0c987) n'a la teinte d'aucune échelle de la marque : elle va au
 *       neutre (M8), en fond comme en texte.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startFixtureServers } from './helpers/serveur.js';
import { preuve, pasArrivees } from './helpers/ajout.js';
import { adresses, CIBLE, reduire, saisir } from './helpers/cible-marque.js';
import { rowKey } from '../src/reduce/propose.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof preuve>>} */
let partie;
/** @type {any} */
let premiere;

before(async () => {
  servers = await startFixtureServers();
  // La marque lue sur le site : ses deux couleurs.
  const { dossier, tokensPath } = await saisir('#c8553d');
  premiere = await reduire(servers, tokensPath);
  /** @type {Record<string, string>} */
  const decisions = {};
  for (const [family, f] of Object.entries(premiere.table.families))
    for (const r of /** @type {any[]} */ (f.rows)) if (r.class === 'décision' && r.candidates?.length) decisions[rowKey(family, r)] = r.candidates[0].value;
  for (const g of /** @type {any[]} */ (premiere.table.pleins ?? [])) decisions[g.key] = g.versions.find((/** @type {any} */ v) => v.pass)?.choice ?? 'garder';
  const fichier = join(dossier, 'decisions.json');
  await writeFile(fichier, JSON.stringify(decisions));
  partie = await preuve(servers, { addresses: adresses(servers), targetPath: CIBLE, tokensPath, brandColors: true, decisionsPath: fichier });
});

after(async () => servers?.close());

test('CM1 marque saisie par ses deux couleurs, la première nuance à chaque décision : aucune ligne non arrivée', () => {
  const v = partie.verdict;
  assert.ok(v.lignes.length > 40, `${v.lignes.length} lignes`);
  // Une ligne vue seulement au survol, au focus ou à l'appui n'est pas jugée sur la page : elle reste à l'humain.
  const manquantes = Object.entries(pasArrivees(partie)).filter(([, etat]) => etat !== 'non vérifiable (état)');
  assert.deepEqual([manquantes, v.sortie], [[], 0]);
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
