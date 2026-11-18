// @ts-check
/**
 * Une panne n'est pas un refus (docs/attendus/revue-lot-1a-pannes-controles.md, D18).
 * Trois issues pour toute commande : 0 tout passe ; 1 l'entrée a été lue et jugée (règle en échec, marque refusée avec
 * son motif) ; 2 l'entrée n'a pas pu être jugée (fichier absent ou illisible, option inconnue, panne de l'outil), message
 * d'une ligne préfixé par le nom de la commande, sans pile. Sans navigateur : Chromium est empêché de se lancer par
 * PLAYWRIGHT_BROWSERS_PATH=/nulle/part.
 *   N1 espacements : fichier absent, JSON illisible, dossier → 2 ;
 *   N2 typo : mêmes cas → 2 ;
 *   N3 option inconnue sur les trois contrôles → 2 ;
 *   N4 saisie : fichier absent, JSON illisible, dossier → 2, rien d'écrit ;
 *   N5 saisie : Chromium qui ne se lance pas pendant le contrôle d'encre → 2, rien d'écrit ;
 *   N6 couche commune cassée (paire vers un rôle inexistant) : saisir() lève ; la commande, sur une copie de src/ et
 *      tokens/ hors du dépôt, sort en 2 sans rien écrire ;
 *   N7 vrais refus en 1 avec leur motif, rien d'écrit : couleur illisible, échelle qui échoue, police refusée ; paire
 *      sous son seuil au niveau de la fonction (aucune couleur d'entrée connue ne la provoque par la commande) ;
 *   N8 marque et verify : option inconnue → 2 ; Chromium qui ne se lance pas → 2 ;
 *   N9 espacements() et typo() sans contexte étroit lèvent ;
 *   N10 (D31 : l'exception de D18 est fermée) contrôle final de la saisie, fait sur les fichiers
 *      écrits à côté avant remplacement, sur une copie dont controlerEcrits (src/tokens/saisie.js) est forcé : s'il lève,
 *      ou s'il trouve une paire en échec (incohérence de l'outil), sortie 2, le message le dit, rien n'est écrit, aucun
 *      fichier temporaire laissé ;
 *   N11 composants (D46) : option inconnue, aucune adresse, décisions ou signatures absentes, illisibles ou mal formées
 *      (la ligne est nommée), relevé absent, Chromium qui ne se lance pas → 2, rien d'écrit.
 *
 * La copie (N6, N10) va dans le dossier temporaire du système, hors du dépôt : src/, tokens/, package.json (pour
 * "type": "module") et .node-version (la garde de version de chaque commande, D40) ; elle trouve ses dépendances par
 * un lien symbolique node_modules vers celui du dépôt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, readFileSync, cpSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir, chargerCommun } from '../src/tokens/saisie.js';
import { espacements } from '../src/tokens/espacements.js';
import { typo } from '../src/tokens/typo.js';
import { largeurs } from '../src/tokens/resolver.js';
import { ORBE } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const POLICES = join(ROOT, 'fixtures', 'polices');
const OSWALD = join(POLICES, 'oswald', 'oswald-latin-wght-normal.woff2');
const BEBAS = join(POLICES, 'bebas-neue', 'bebas-neue-latin-400-normal.woff2');
const SANS_CHROMIUM = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/nulle/part' };
const POLICES_NOMS = { titre: ['Georgia', 'serif'] };

/** @param {string} racine @param {string} cli @param {string[]} args @param {NodeJS.ProcessEnv} [env] */
const lancer = (racine, cli, args, env = process.env) => spawnSync(process.execPath, [join(racine, 'src', 'cli', `${cli}.js`), ...args], { cwd: racine, encoding: 'utf8', env });
/** @param {string} cli @param {string[]} args @param {NodeJS.ProcessEnv} [env] */
const run = (cli, args, env) => lancer(ROOT, cli, args, env);
const tmp = (/** @type {string} */ nom) => mkdtempSync(join(tmpdir(), `ds-lab-${nom}-`));

/**
 * Une panne : sortie 2, une ligne préfixée par le nom de la commande, sans pile.
 * @param {import('node:child_process').SpawnSyncReturns<string>} p @param {string} nom @param {RegExp} [motif]
 */
function panne(p, nom, motif) {
  const err = p.stderr.trim();
  assert.equal(p.status, 2, `sortie ${p.status}\n${p.stdout}\n${p.stderr}`);
  assert.equal(err.split('\n').length, 1, `une ligne attendue :\n${err}`);
  assert.ok(err.startsWith(`${nom} : `), err);
  assert.doesNotMatch(err, /node:internal|\n\s+at /, err);
  if (motif) assert.match(err, motif);
}

/** Fichiers de panne : absent, JSON illisible, dossier. */
function fichiersFaux() {
  const d = tmp('panne');
  writeFileSync(join(d, 'casse.json'), '{ "a": ');
  return { absent: join(d, 'absent.json'), casse: join(d, 'casse.json'), dossier: d };
}

/** Copie de src/, tokens/, package.json et .node-version hors du dépôt, node_modules en lien symbolique. */
function copie() {
  const d = tmp('copie');
  cpSync(join(ROOT, 'src'), join(d, 'src'), { recursive: true });
  cpSync(join(ROOT, 'tokens'), join(d, 'tokens'), { recursive: true });
  cpSync(join(ROOT, 'package.json'), join(d, 'package.json'));
  cpSync(join(ROOT, '.node-version'), join(d, '.node-version'));
  symlinkSync(join(ROOT, 'node_modules'), join(d, 'node_modules'), 'dir');
  return d;
}

/** Dossier d'entrée hors du dépôt. @param {any} entree */
function entree(entree) {
  const d = tmp('saisie');
  writeFileSync(join(d, 'entree.json'), JSON.stringify(entree));
  return { dossier: d, fichier: join(d, 'entree.json') };
}

for (const [id, cli] of /** @type {const} */ ([['N1', 'espacements'], ['N2', 'typo']]))
  test(`${id} ${cli} : fichier absent, JSON illisible, dossier → 2, une ligne, sans pile`, () => {
    const f = fichiersFaux();
    panne(run(cli, ['--semantique', f.absent]), cli, /absent\.json/);
    panne(run(cli, ['--semantique', f.casse]), cli, /casse\.json/);
    panne(run(cli, ['--semantique', f.dossier]), cli);
    panne(run(cli, ['--etroit', f.casse]), cli, /casse\.json/);
  });

test('N3 option inconnue : contraste, espacements, typo → 2', () => {
  for (const cli of ['contraste', 'espacements', 'typo']) panne(run(cli, ['--inconnu']), cli, /--inconnu/);
});

test('N4 saisie : fichier absent, JSON illisible, dossier → 2, pas « marque refusée », rien d\'écrit', () => {
  const f = fichiersFaux();
  for (const chemin of [f.absent, f.casse, f.dossier]) {
    const p = run('saisie', [chemin]);
    panne(p, 'saisie');
    assert.doesNotMatch(p.stderr, /marque refusée/);
  }
  assert.deepEqual(readdirSync(f.dossier), ['casse.json'], 'rien d\'écrit');
});

test('N5 saisie : Chromium qui ne se lance pas pendant le contrôle d\'encre → 2, rien d\'écrit', () => {
  const e = entree({ nom: 'Essai', primaire: '#2b4c7e', polices: { titre: { familles: ['Oswald'], fichiers: [OSWALD] } } });
  const p = run('saisie', [e.fichier], SANS_CHROMIUM);
  panne(p, 'saisie', /Chromium|navigateur|Executable/i);
  assert.doesNotMatch(p.stderr, /marque refusée/);
  assert.deepEqual(readdirSync(e.dossier), ['entree.json']);
});

test('N6 couche commune cassée : saisir() lève ; la commande, sur une copie cassée, sort en 2 sans rien écrire', () => {
  const commun = chargerCommun();
  const cassee = { ...commun, paires: { ...commun.paires, paires: [...commun.paires.paires, { devant: 'texte.inexistant', fond: 'fond.app', type: 'texte' }] } };
  assert.throws(() => saisir({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES_NOMS }, { dossier: tmp('saisie'), commun: cassee }), /rôle inconnu texte\.inexistant/);
  const d = copie();
  const paires = join(d, 'tokens', 'commun', 'paires.json');
  const p0 = JSON.parse(readFileSync(paires, 'utf8'));
  p0.paires.push({ devant: 'texte.inexistant', fond: 'fond.app', type: 'texte' });
  writeFileSync(paires, JSON.stringify(p0));
  const e = entree({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES_NOMS });
  const p = lancer(d, 'saisie', [e.fichier]);
  panne(p, 'saisie', /rôle inconnu texte\.inexistant/);
  assert.doesNotMatch(p.stderr, /marque refusée/);
  assert.deepEqual(readdirSync(e.dossier), ['entree.json']);
});

test('N7 vrais refus : sortie 1 avec le motif, rien d\'écrit', () => {
  const cas = [
    [{ nom: 'Essai', primaire: 'rouge', polices: POLICES_NOMS }, /entrée invalide : primaire, couleur #rrggbb/],
    [{ nom: 'Essai', primaire: '#00ccff', polices: POLICES_NOMS }, /checkValise \(clair\) : primaire : doublon/],
    [{ nom: 'Essai', primaire: '#8a4fd8', polices: { titre: { familles: ['Bebas Neue'], fichiers: [BEBAS] } } }, /police des titres : graisses absentes : 600, 700/],
  ];
  for (const [x, motif] of cas) {
    const e = entree(x);
    const p = run('saisie', [e.fichier]);
    assert.equal(p.status, 1, p.stderr + p.stdout);
    assert.match(p.stderr, /marque refusée : Essai/);
    assert.match(p.stderr, /** @type {RegExp} */ (motif));
    assert.deepEqual(readdirSync(e.dossier), ['entree.json']);
  }
  // Paire sous son seuil : seuil durci, comme C4 (test/contraste-modes.test.js).
  /** @param {any} c */
  const durci = (c) => {
    const paires = structuredClone(c.paires);
    paires.seuils.essai = 3.15;
    for (const q of paires.paires) if (q.devant === 'bordure.forte' && q.fond === 'fond.surface') q.type = 'essai';
    return { ...c, paires };
  };
  const r = saisir({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES_NOMS }, { dossier: tmp('saisie'), commun: durci(chargerCommun()), communSombre: durci(chargerCommun({ mode: 'sombre' })) });
  assert.deepEqual(r.motifs, ['contraste (sombre) : bordure.forte sur fond.surface, 3,10:1 < 3,15:1']);
});

test('N8 marque et verify : option inconnue → 2 ; Chromium qui ne se lance pas → 2', () => {
  const out = tmp('sorties');
  panne(run('marque', ['--inconnu']), 'marque', /--inconnu/);
  panne(run('verify', ['--inconnu']), 'verify', /--inconnu/);
  panne(run('marque', ['http://127.0.0.1:9/', '--out', out], SANS_CHROMIUM), 'marque', /Executable|Chromium|navigateur/i);
  panne(run('verify', ['http://127.0.0.1:9/', '--reference', join(out, 'ref'), '--save', '--out', out], SANS_CHROMIUM), 'verify', /Executable|Chromium|navigateur/i);
  assert.deepEqual(readdirSync(out), [], 'rien d\'écrit');
});

test('N9 espacements() et typo() sans contexte étroit lèvent', () => {
  const l = largeurs(ORBE);
  assert.throws(() => espacements(l.large.semantique, l.large.primitives, /** @type {any} */ (undefined)), /contexte étroit/);
  assert.throws(() => typo(l.large.semantique, l.large.primitives, l.large.marque, /** @type {any} */ (undefined)), /contexte étroit/);
});

test('N10 contrôle final avant remplacement : panne ou incohérence ; sortie 2, message, rien d\'écrit', () => {
  for (const [avant, apres, motif] of /** @type {const} */ ([
    ['const resolver = docs[RESOLVER];', "throw new Error('contrôle final : essai de panne');", /contrôle final : essai de panne/],
    ['if (c.roles.fails.length)', 'if (true)', /incohérence de l'outil.*rien n'est écrit/],
  ])) {
    const d = copie();
    const f = join(d, 'src', 'tokens', 'saisie.js');
    const texte = readFileSync(f, 'utf8');
    assert.ok(texte.includes(avant), avant);
    writeFileSync(f, texte.replace(avant, apres));
    const e = entree({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES_NOMS });
    const p = lancer(d, 'saisie', [e.fichier]);
    assert.equal(p.status, 2, `${apres} : sortie ${p.status}\n${p.stdout}\n${p.stderr}`);
    assert.match(p.stderr, motif);
    assert.doesNotMatch(p.stdout, /marque acceptée/);
    assert.deepEqual(readdirSync(e.dossier), ['entree.json'], 'rien d\'écrit');
  }
});

test('N11 composants : option inconnue, décisions et signatures absentes, illisibles ou mal formées, relevé absent, Chromium absent → 2, rien d\'écrit', () => {
  const f = fichiersFaux();
  const out = tmp('composants');
  const site = 'http://127.0.0.1:9/';
  const malFormees = join(f.dossier, 'decisions.json');
  writeFileSync(malFormees, JSON.stringify({ blocs: [{ bloc: 'x', sort: 'jeter' }] }));
  const sansPieces = join(f.dossier, 'signatures.json');
  writeFileSync(sansPieces, JSON.stringify({ framework: 'Cadre', pieces: [] }));
  panne(run('composants', ['--inconnu']), 'composants', /--inconnu/);
  panne(run('composants', ['--out', out]), 'composants', /au moins une adresse/);
  panne(run('composants', [site, '--decisions', f.absent, '--out', out]), 'composants', /absent\.json : fichier absent/);
  panne(run('composants', [site, '--decisions', f.casse, '--out', out]), 'composants', /casse\.json : JSON illisible/);
  panne(run('composants', [site, '--decisions', malFormees, '--out', out]), 'composants', /blocs, ligne 1 : sort « jeter » inconnu/);
  panne(run('composants', [site, '--signatures', f.casse, '--out', out]), 'composants', /casse\.json : JSON illisible/);
  panne(run('composants', [site, '--signatures', sansPieces, '--out', out]), 'composants', /« pieces »/);
  panne(run('composants', ['--releve', f.dossier, '--out', out]), 'composants', /releve\.json : fichier absent/);
  panne(run('composants', [site, '--out', out], SANS_CHROMIUM), 'composants', /Executable|Chromium|navigateur/i);
  assert.deepEqual(readdirSync(out), [], 'rien d\'écrit');
});
