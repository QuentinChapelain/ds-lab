// @ts-check
/**
 * Une mesure ne tombe jamais pour une image (D104). La page fictive change trois éléments peu après leur relevé, pendant
 * que la page suivante se charge, comme une notification qui s'en va sur un site réel :
 *   K1 le relevé s'écrit, sans page tombée ;
 *   K2 « Envoyer », remplacé par son double, est retrouvé par son chemin : capturé, et marqué retrouvé dans le relevé ;
 *   K3 « Fermer », parti avec sa notification, et « Ajouter », remplacé par un autre bouton au même chemin, ne sont pas
 *      capturés : chacun est noté avec sa raison ;
 *   K4 le constat recalculé sans navigateur garde ces notes.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers } from './helpers/serveur.js';
import { runComposants, recalculer } from '../src/composants/run.js';

const NOW = new Date(2026, 10, 27, 15, 0);

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof runComposants>> | undefined} */
let r;
/** @type {unknown} */
let erreur;
/** @type {any} */
let releve;

before(async () => {
  servers = await startFixtureServers();
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-captures-'));
  // La page suivante attend une seconde après son chargement : les trois changements ont lieu pendant ce temps.
  const addresses = [`${servers.origin}/captures/notification.html`, '/captures/suite.html'];
  try {
    r = await runComposants({ addresses, waitMs: 1000, outRoot: sortie, now: NOW });
    releve = JSON.parse(await readFile(join(r.dir, 'releve.json'), 'utf8'));
  } catch (e) {
    erreur = e;
  }
});

after(async () => {
  await servers?.close();
});

/** L'identifiant de la ligne d'un bouton, par son nom. @param {string} nom */
const idDe = (nom) => {
  const l = releve.lignes.find((/** @type {any} */ x) => x.role === 'button' && x.nom === nom);
  assert.ok(l, `bouton « ${nom} » absent du relevé`);
  return /** @type {string} */ (l.id);
};

test('K1 une image qui échoue ne fait pas tomber le relevé', () => {
  assert.equal(erreur, undefined, `le relevé est tombé : ${String(/** @type {any} */ (erreur)?.message ?? erreur)}`);
  assert.deepEqual(r?.tombees, []);
});

test('K2 un élément remplacé par son double est retrouvé par son chemin, et marqué', async () => {
  assert.ok(r && releve, 'relevé absent');
  const id = idDe('Envoyer');
  assert.ok(releve.captures.includes(id), 'capture absente');
  assert.deepEqual(releve.capturesRetrouvees, [id]);
  assert.ok((await readdir(join(r.dir, 'captures'))).includes(`${id}.png`));
});

test('K3 un élément parti, ou remplacé par un autre, n’est pas capturé : noté avec sa raison', () => {
  assert.ok(r && releve, 'relevé absent');
  const tombees = Object.fromEntries(releve.capturesTombees.map((/** @type {any} */ x) => [x.id, x.raison]));
  for (const nom of ['Fermer', 'Ajouter']) {
    const id = idDe(nom);
    assert.ok(!releve.captures.includes(id), `« ${nom} » capturé`);
    assert.match(tombees[id] ?? '', /\S/, `« ${nom} » non noté`);
  }
  assert.equal(releve.capturesTombees.length, 2);
  assert.match(tombees[idDe('Fermer')], /quitté la page/);
  assert.match(tombees[idDe('Ajouter')], /autre élément/);
});

test('K4 le constat recalculé sans navigateur garde les notes', async () => {
  assert.ok(r, 'relevé absent');
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-captures-b-'));
  const b = await recalculer({ releve: r.dir, outRoot: sortie, now: NOW });
  const rb = JSON.parse(await readFile(join(b.dir, 'releve.json'), 'utf8'));
  assert.deepEqual(rb.capturesTombees, releve.capturesTombees);
  assert.deepEqual(rb.capturesRetrouvees, releve.capturesRetrouvees);
});
