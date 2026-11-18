// @ts-check
/**
 * npm run composants sur les deux pages d'annuaire (D46, docs/attendus/audit-composants.md), contre
 * fixtures/marque-demo/expected-composants.json, écrit à la main avant le code.
 *   C1 relevé brut : rôle et nom calculés, atteinte au clavier (liste sans tabindex, onglets en tabindex itinérant), zone
 *      de clic (bouton nu à 21 px, case dans son label) ; un arrondi en pourcentage converti en px (bouton à icône, 50 % de
 *      40 px), le cadre d'un champ Vuetify mesuré sur sa boîte intérieure (.v-field, D47) ;
 *   C2 lancement A, avec la table de Vuetify, sans décision : chiffres, phrase, types, égalité, apparences, gabarit ;
 *   C3 lancement B, recalculé depuis le relevé de A avec les décisions : chiffres, carte 7 fois en 2 versions, 3 rattachés ;
 *   C4 le constat de A recalculé sans navigateur est identique à l'octet ;
 *   C5 lancement sans table : chiffres, phrase « Aucun framework reconnu. » ;
 *   C6 page HTML : blocs dans l'ordre, quatre cartes de score puis l'effort, une explication sur chaque titre et chaque
 *      score, aucune occurrence du mot « enveloppe », étiquettes d'origine d'un seul style, aucun défilement horizontal à
 *      390 px de large, aucune requête ni script ;
 *   C7 la commande : sortie 0 ; une page qui ne se charge pas : constat écrit sans elle, sortie 2, une ligne.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startFixtureServers } from './helpers/serveur.js';
import { runComposants, recalculer } from '../src/composants/run.js';
import { lancerChromium } from '../src/browser/lancement.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const E = JSON.parse(await readFile(join(ROOT, 'fixtures/marque-demo/expected-composants.json'), 'utf8'));
const VUETIFY = join(ROOT, 'config/signatures/vuetify.json');
const DECISIONS = join(ROOT, 'fixtures/marque-demo/decisions-composants.json');
const NOW = new Date(2026, 10, 18, 19, 0);

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Awaited<ReturnType<typeof runComposants>>} */
let A;
/** @type {Awaited<ReturnType<typeof runComposants>>} */
let nu;
/** @type {string} */
let sortie;

before(async () => {
  servers = await startFixtureServers();
  sortie = await mkdtemp(join(tmpdir(), 'ds-lab-composants-'));
  const addresses = [`${servers.origin}/annuaire/liste.html`, '/annuaire/fiche.html'];
  A = await runComposants({ addresses, signatures: [VUETIFY], waitMs: 0, outRoot: sortie, now: NOW });
  nu = await runComposants({ addresses, waitMs: 0, outRoot: join(sortie, 'nu'), now: NOW });
});

after(async () => {
  await servers?.close();
});

/** Les chiffres d'un constat, sous la forme de l'attendu. @param {any} c */
const chiffres = (c) => ({
  elements: c.chiffres.elements,
  types: c.chiffres.types,
  versions: c.chiffres.versions,
  frameworks: c.chiffres.frameworks,
  nonIdentifies: c.chiffres.nonIdentifies,
  sourceUnique: [c.scores.sourceUnique.x, c.scores.sourceUnique.y],
  accessibilite: [c.scores.accessibilite.x, c.scores.accessibilite.y],
  versionsAGarder: [c.scores.versionsAGarder.x, c.scores.versionsAGarder.y],
  fiabilite: [c.scores.fiabilite.x, c.scores.fiabilite.y],
  effort: c.scores.effort,
  phrase: c.phrase,
});
/** @param {any} e */
const attendus = (e) => ({ elements: e.elements, types: e.types, versions: e.versions, frameworks: e.frameworks, nonIdentifies: e.nonIdentifies, sourceUnique: e.sourceUnique, accessibilite: e.accessibilite, versionsAGarder: e.versionsAGarder, fiabilite: e.fiabilite, effort: e.effort, phrase: e.phrase });
/** @param {any} c @param {string} nom */
const type = (c, nom) => c.types.find((/** @type {any} */ t) => t.nom === nom);

test('C1 relevé brut : rôle, nom, clavier et zone de clic calculés dans le navigateur', async () => {
  const releve = JSON.parse(await readFile(join(A.dir, 'releve.json'), 'utf8'));
  const de = (/** @type {number} */ page, /** @type {string} */ nom) => releve.lignes.find((/** @type {any} */ l) => l.page === page && l.nom === nom);
  assert.equal(de(1, 'Note').role, 'combobox');
  assert.equal(de(1, 'Note').clavier, false);
  assert.equal(de(0, 'Tri').clavier, true);
  assert.deepEqual(['Présentation', 'Horaires', 'Accès'].map((n) => [de(1, n).role, de(1, n).clavier]), [['tab', true], ['tab', true], ['tab', true]]);
  assert.equal(de(0, 'Effacer').zone[1], 21);
  assert.equal(de(0, 'Effacer').piece, null);
  assert.equal(de(0, 'Ouvert le dimanche').mesures.hauteur, 13);
  assert.equal(de(0, 'Ouvert le dimanche').zone[1], 32);
  assert.equal(de(0, 'Quartier').role, 'combobox');
  assert.equal(de(0, 'Quartier').piece.nom, 'v-select');
  assert.deepEqual(de(0, 'Haut de page').mesures.rayons, [20, 20, 20, 20]);
  for (const [page, nom] of /** @type {const} */ ([[0, 'Rechercher un café'], [0, 'Quartier'], [1, 'Votre nom']])) {
    const m = de(page, nom).mesures;
    assert.deepEqual([m.hauteur, m.bordures, m.rayons, m.marges], [42, [1, 1, 1, 1], [4, 4, 4, 4], [0, 12, 0, 12]], nom);
  }
  const icone = releve.lignes.find((/** @type {any} */ l) => l.classes[0] === 'an-icone');
  assert.deepEqual([icone.role, icone.nom, icone.texte], ['button', '', false]);
});

test('C2 lancement A : chiffres de l’attendu', () => {
  const c = A.constat;
  assert.deepEqual(chiffres(c), attendus(E.A));
  assert.equal(c.chiffres.autrement, E.A.autrement);
  for (const [nom, t] of Object.entries(E.A.parType)) {
    const x = type(c, nom);
    assert.deepEqual([x.fois, x.versions.length, [x.sourceUnique.x, x.sourceUnique.y]], [t.fois, t.versions, t.sourceUnique], nom);
    if (t.egalite) assert.deepEqual(x.sourceUnique.plusRepandues, t.egalite);
  }
  for (const [nom, n] of Object.entries(E.A.apparences)) assert.equal(type(c, nom.split(' / ')[0]).versions.find((/** @type {any} */ v) => v.nom === nom).apparences.length, n);
  for (const [nom, n] of Object.entries(E.A.gabarit)) {
    const g = type(c, nom.split(' / ')[0]).gabarit;
    assert.deepEqual([g.elements, g.versions.map((/** @type {any} */ v) => v.nom)], [n, [nom]]);
  }
  assert.ok(c.types.every((/** @type {any} */ t) => t.garder === null));
  assert.deepEqual(c.nonIdentifies.map((/** @type {any} */ b) => [b.bloc, b.fois, b.etat]), [['an-carte', 3, 'pas encore décidé']]);
});

test('C3 lancement B : décisions relues sur le relevé de A', async () => {
  const B = await recalculer({ releve: A.dir, decisions: DECISIONS, outRoot: join(sortie, 'b'), now: NOW });
  const c = B.constat;
  assert.deepEqual(chiffres(c), attendus(E.B));
  assert.equal(c.chiffres.autrement, E.B.autrement);
  const carte = type(c, 'carte');
  assert.deepEqual([carte.fois, carte.versions.length, carte.versions.filter((/** @type {any} */ v) => v.rattache).reduce((/** @type {number} */ n, /** @type {any} */ v) => n + v.fois, 0)], [E.B.carte.fois, E.B.carte.versions, E.B.carte.rattaches]);
  assert.equal(type(c, 'bouton avec texte').garder, E.B.garder['bouton avec texte']);
  assert.deepEqual(c.decisionsSansCible, []);
  const html = await readFile(join(B.dir, 'constat.html'), 'utf8');
  assert.match(html, /rattaché à la main/);
});

test('C4 le constat de A recalculé sans navigateur est identique à l’octet', async () => {
  const R = await recalculer({ releve: A.dir, outRoot: join(sortie, 'r'), now: NOW });
  for (const f of ['releve.json', 'constat.json', 'constat.md', 'constat.html']) assert.ok((await readFile(join(A.dir, f))).equals(await readFile(join(R.dir, f))), f);
  assert.deepEqual(await readdir(join(R.dir, 'captures')), await readdir(join(A.dir, 'captures')));
});

test('C5 lancement sans table de signatures', () => {
  assert.deepEqual(chiffres(nu.constat), attendus(E.sansTable));
  assert.deepEqual(Object.fromEntries(nu.constat.nonIdentifies.map((/** @type {any} */ b) => [b.bloc, b.fois])), E.sansTable.candidats);
});

test('C6 page HTML : ordre des blocs, explications, mots, étiquettes, largeur de téléphone', async () => {
  const html = await readFile(join(A.dir, 'constat.html'), 'utf8');
  const repere = (/** @type {string} */ s) => {
    const i = html.indexOf(s);
    assert.ok(i >= 0, s);
    return i;
  };
  const ordre = [repere('<dl class="entete">'), repere('<p class="phrase">'), repere('<div class="cartes">'), repere('<div class="effort">'), repere('<section class="type">'), repere('<section class="non-identifies">'), repere('Limites de cet audit')];
  assert.deepEqual(ordre, [...ordre].sort((a, b) => a - b));
  assert.equal(html.match(/class="carte-score"/g)?.length, 4);
  const types = A.constat.types.length;
  // Par type : son titre, Version, Origine, Version à garder ; puis les quatre scores, l'effort et les non identifiés.
  assert.equal(html.match(/<details class="i">/g)?.length, types * 4 + 6);
  for (const f of ['constat.html', 'constat.md', 'constat.json']) assert.doesNotMatch(await readFile(join(A.dir, f), 'utf8'), /enveloppe/i, f);
  assert.match(html, /17 viennent de Vuetify/);
  assert.doesNotMatch(html, /\sstyle="|<script|<link|https?:\/\/(?!127\.0\.0\.1)/);
  const origines = [...html.matchAll(/<span class="([^"]*)">(Vuetify|Fait maison|Sans style)<\/span>/g)].map((m) => m[1]);
  assert.ok(origines.length >= 12);
  assert.deepEqual([...new Set(origines)], ['origine']);
  const browser = await lancerChromium();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    /** @type {string[]} */
    const requetes = [];
    page.on('request', (r) => requetes.push(r.url()));
    await page.goto(`file://${join(A.dir, 'constat.html')}`);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (/** @type {HTMLDetailsElement} */ (d).open = true)));
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth)) <= 390);
    assert.deepEqual(requetes.filter((u) => !u.startsWith('file:') && !u.startsWith('data:')), []);
  } finally {
    await browser.close();
  }
});

/** @param {string[]} args @returns {Promise<{ code: number | null, stdout: string, stderr: string }>} */
const commande = (args) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, [join(ROOT, 'src/cli/composants.js'), ...args], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (code) => resolve({ code, stdout, stderr }));
  });

test('C7 la commande : 0 ; une page qui ne se charge pas : constat écrit sans elle, 2', async () => {
  const out = await mkdtemp(join(tmpdir(), 'ds-lab-composants-cli-'));
  const ok = await commande([`${servers.origin}/annuaire/liste.html`, '--signatures', VUETIFY, '--wait-ms', '0', '--out', out]);
  assert.equal(ok.code, 0, ok.stderr);
  assert.match(ok.stdout, /19 éléments relevés/);
  const ko = await commande([`${servers.origin}/annuaire/liste.html`, '/annuaire/absente.html', '--wait-ms', '0', '--out', join(out, 'ko')]);
  assert.equal(ko.code, 2, ko.stdout);
  assert.equal(ko.stderr.trim().split('\n').length, 1);
  assert.match(ko.stderr, /^composants : 1 page\(s\) non relevée\(s\) : .*absente\.html \(statut HTTP 404\) ; constat écrit, incomplet/);
  const [hote] = await readdir(join(out, 'ko'));
  const [date] = await readdir(join(out, 'ko', hote));
  const c = JSON.parse(await readFile(join(out, 'ko', hote, date, 'constat.json'), 'utf8'));
  assert.deepEqual(c.pages.map((/** @type {any} */ p) => p.erreur ?? null), [null, 'statut HTTP 404']);
});
