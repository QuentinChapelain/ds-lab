// @ts-check
/**
 * Feuilles ajoutées sur les réductions des pièges, de la proximité et de la page de marque
 * (docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026). Attendus écrits avant le code :
 *   P1 rendu avec les feuilles ajoutées identique au pixel à celui de la copie passée par apply, même arbre ;
 *   P2 0 px et même arbre contre la référence pour les pièges et la proximité ; la page de marque garde l'écart
 *      d'apply (valeurs en var(), README.md, Limites) ;
 *   P3 système en sombre : rendu identique au rendu en clair ;
 *   P6 verdict par ligne décidée (docs/attendus/verdict-par-decision.md) : pièges, chaque ligne décidée arrivée,
 *      sortie 0 ; proximité, aucune ligne décidée, sortie 0 ; page de marque, coul-09 et coul-11 (valeur écrite en
 *      var(), hors de modifications.json) non arrivées, la variable nommée, sortie 1 ;
 *   P4 chaque ligne décidée et non écrite, et chaque ligne du reste, est dans le fichier des pertes ; sur la page
 *      de marque, coul-06 (marque.css:41, border-bottom-color, simplement rattachée) est un rattachement non fait ;
 *   P5 proximité : seulement des lignes rattachées, aucune feuille ajoutée ; .message (proximite.css:67) n'est pas
 *      reprise, et ne passe plus devant .message-loin ;
 *   P7 une seule cause par déclaration, la même dans la ligne de verdict, le détail et le fichier des pertes
 *      (docs/attendus/verify-se-reconnait.md) : sur la page de marque, coul-09 et coul-11 ont pour cause « valeur en
 *      var() » et pour « à faire » celui du fichier des pertes (écrire var(<jeton>, var(<variable de la page>)) à la
 *      main), jamais « poser --marque-… là où elle est posée ».
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { preuve, lignesPerdues, pasArrivees, desaccords } from './helpers/ajout.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, Awaited<ReturnType<typeof preuve>>>} */
const R = {};

before(async () => {
  servers = await startFixtureServers();
  const P = JSON.parse(await readFile(`${FIXTURE_DIR}expected-proximite.json`, 'utf8'));
  const M = JSON.parse(await readFile(`${FIXTURE_DIR}expected-marque.json`, 'utf8'));
  R.pieges = await preuve(servers, { addresses: [`${servers.origin}/pieges/pieges.html`], targetPath: `${FIXTURE_DIR}cible-valise.json` });
  R.proximite = await preuve(servers, { addresses: [servers.origin + P.conditions.page], targetPath: `${FIXTURE_DIR}cible-valise.json` });
  R.marque = await preuve(servers, { addresses: [servers.origin + M.conditions.page], targetPath: `${FIXTURE_DIR}cible-marque.json` });
});

after(async () => servers?.close());

for (const nom of ['pieges', 'proximite', 'marque']) {
  test(`P1, P3 ${nom} : feuilles ajoutées = copie appliquée, au pixel ; sombre = clair`, () => {
    for (const x of R[nom].resultats) {
      assert.deepEqual({ page: x.page, px: x.ajout.px, aria: x.ajout.aria, sombre: x.sombre }, { page: x.page, px: 0, aria: true, sombre: 0 });
    }
  });
  test(`P4 ${nom} : chaque ligne décidée est écrite ou dans le fichier des pertes`, () => {
    assert.deepEqual(lignesPerdues(R[nom].mods, R[nom].ajout), []);
  });
}

for (const nom of ['pieges', 'proximite']) {
  test(`P2 ${nom} : 0 px et même arbre contre la référence`, () => {
    for (const x of R[nom].resultats) assert.deepEqual({ page: x.page, ...x.reference }, { page: x.page, px: 0, aria: true });
  });
}

test('P4 marque : coul-06, simplement rattachée, est un rattachement non fait', () => {
  const t = R.marque.ajout.pertes;
  const rattachements = t.slice(t.indexOf('RATTACHEMENTS NON FAITS'), t.indexOf('HORS DE MODIFICATIONS.JSON')).split('\n');
  assert.ok(rattachements.includes('- coul-06 : /marque/styles/marque.css:41 .onglet-actif { border-bottom-color } : var(--color-blue-9, currentcolor). À faire : rattacher dans la source quand le composant sera refait.'), t);
});

test('P5 proximité : aucune feuille ajoutée, .message rattachement non fait', () => {
  assert.deepEqual(R.proximite.ajout.feuilles, []);
  assert.ok(R.proximite.ajout.pertes.split('\n').some((l) => l.startsWith('- esp-03 : /proximite/styles/proximite.css:67 .message { margin-top } : ')), R.proximite.ajout.pertes);
});

test('P6 pièges : chaque ligne décidée arrivée, sortie 0', () => {
  assert.ok(R.pieges.verdict.lignes.length > 0);
  assert.deepEqual([pasArrivees(R.pieges), R.pieges.verdict.sortie], [{}, 0]);
  assert.equal(R.pieges.verdict.resume, `Toutes les lignes décidées sont arrivées (${R.pieges.verdict.lignes.length}).`);
});

test('P6 proximité : aucune ligne décidée, sortie 0', () => {
  assert.deepEqual([R.proximite.verdict.lignes, R.proximite.verdict.resume, R.proximite.verdict.sortie], [[], 'Aucune ligne décidée.', 0]);
});

test('P6 marque : coul-09 et coul-11, valeur en var() hors de modifications.json, non arrivées ; sortie 1', () => {
  assert.deepEqual(pasArrivees(R.marque), { 'coul-09': 'non arrivée', 'coul-11': 'non arrivée' });
  assert.equal(R.marque.verdict.sortie, 1);
  const ratees = R.marque.resultats.flatMap((x) => x.releve.ops).filter((/** @type {any} */ o) => o.apres !== o.visee && o.avant !== o.visee);
  assert.deepEqual([...new Set(ratees.map((/** @type {any} */ o) => o.ligne))].sort(), ['coul-09', 'coul-11']);
  for (const o of ratees) assert.ok(o.canal.categories.includes('variable'), JSON.stringify(o.canal));
});

for (const nom of ['pieges', 'proximite', 'marque']) {
  test(`P7 ${nom} : une cause par déclaration, la même dans le verdict, le détail et le fichier des pertes`, () => {
    assert.deepEqual(desaccords(R[nom].verdict, R[nom].ajout.pertes), []);
  });
}

test('P7 marque : coul-09 et coul-11, cause « valeur en var() », à faire du fichier des pertes', () => {
  for (const [id, aFaire] of [
    ['coul-09', 'si la valeur calculée est bien #8f8f8f, écris var(--color-neutral-11, var(--marque-secondary-color)) à la main.'],
    ['coul-11', 'si la valeur calculée est bien #c8553d, écris var(--color-earth-11, var(--marque-accent-color)) à la main.'],
  ]) {
    const l = /** @type {any} */ (R.marque.verdict.lignes.find((x) => x.id === id));
    assert.ok(l.texte.endsWith(' ; cause : valeur en var()'), l.texte);
    assert.equal(l.details.length, 1, l.details.join('\n'));
    assert.ok(l.details[0].includes(' ; cause : valeur en var() ; tient : '), l.details[0]);
    assert.ok(l.details[0].endsWith(` ; à faire : ${aFaire}`), l.details[0]);
    assert.ok(!l.details[0].includes('poser --marque-'), l.details[0]);
  }
});
