// @ts-check
/**
 * Le banc d'essai (D67, docs/attendus/etape-10-banc.md). Chaque pose se fait dans un dossier temporaire, sans npm ci
 * (--sans-installation : un lien vers les node_modules du dépôt) :
 *   BN1 un passage du bras A : la copie de ds-lab sans aucun chemin caché (chacun présent dans le dépôt) et d'un seul commit, l'app d'un seul commit
 *       « départ » sans banc.json, le skill copié à l'identique, DS_LAB et le dossier de la copie dans
 *       settings.local.json, ni relecteur ni carnet, les deux briefs, depart.txt et ses deux commandes ; le même
 *       passage reposé : sortie 2 qui dit quoi faire ;
 *   BN3 deux poses du même commit : mêmes fichiers à l'octet et mêmes empreintes de commit, aux chemins absolus et à
 *       l'heure près ;
 *   BN4 verifier, lancé depuis la copie : sortie 2 au départ, qui dit de saisir ; après la saisie et le thème des
 *       trois marques par la copie, sortie 1, des blocs de style seulement, aucun échec de contraste.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { caches } from '../src/banc/banc.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'banc.js');
const MARQUES = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'app-fictive', 'banc.json'), 'utf8')).marques;

/** @param {string} racine @param {string[]} args */
const banc = (racine, args) => spawnSync(process.execPath, [CLI, '--dossier', racine, '--modele', 'essai', '--sans-installation', ...args], { cwd: ROOT, encoding: 'utf8' });
/** @param {string} cwd @param {string[]} args */
const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' }).stdout.trim();
/** Les fichiers d'un dossier, hors .git et liens, en chemins relatifs. @param {string} d @returns {string[]} */
const arbre = (d) =>
  /** @type {string[]} */ (readdirSync(d, { recursive: true }))
    .filter((f) => !f.split('/').includes('.git') && !f.split('/').includes('node_modules'))
    .filter((f) => lstatSync(join(d, f)).isFile())
    .sort();

test('BN1 un passage du bras A : copie cachée, app de départ, skill, réglages, briefs', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const r = banc(racine, ['--bras', 'A', '--passage', '1']);
  assert.equal(r.status, 0, r.stderr);
  const dossier = join(racine, 'A-1');
  const copie = join(dossier, 'ds-lab');
  const app = join(dossier, 'app');
  assert.ok(caches(ROOT).length >= 10);
  for (const c of caches(ROOT)) assert.ok(existsSync(join(ROOT, c)), `${c} : chemin caché absent du dépôt, la liste a vieilli`);
  for (const c of caches(ROOT)) assert.equal(existsSync(join(copie, c)), false, c);
  assert.ok(existsSync(join(copie, 'atelier', 'composants', 'DsCard.vue')) && existsSync(join(copie, 'src', 'cli', 'verifier.js')), 'les composants et les commandes restent');
  assert.equal(git(copie, ['rev-list', '--count', 'HEAD']), '1');
  assert.equal(git(app, ['rev-list', '--count', 'HEAD']), '1');
  assert.equal(git(app, ['log', '-1', '--format=%s']), 'départ');
  assert.equal(git(app, ['status', '--porcelain']), '');
  assert.equal(existsSync(join(app, 'banc.json')), false);
  for (const f of arbre(join(ROOT, 'skill', 'ds-lab'))) assert.equal(readFileSync(join(app, '.claude', 'skills', 'ds-lab', f), 'utf8'), readFileSync(join(ROOT, 'skill', 'ds-lab', f), 'utf8'), f);
  assert.deepEqual(JSON.parse(readFileSync(join(app, '.claude', 'settings.local.json'), 'utf8')), { env: { DS_LAB: copie }, permissions: { additionalDirectories: [copie] } });
  for (const f of ['.claude/settings.json', 'CLAUDE.md', 'carnet.md']) assert.equal(existsSync(join(app, f)), false, f);
  const brief = readFileSync(join(ROOT, 'fixtures', 'banc', 'brief.txt'), 'utf8');
  assert.equal(readFileSync(join(dossier, 'brief.txt'), 'utf8'), brief);
  assert.equal(readFileSync(join(dossier, 'brief-seul.txt'), 'utf8'), `${brief.trimEnd()}\n\n${readFileSync(join(ROOT, 'fixtures', 'banc', 'sans-humain.txt'), 'utf8')}`);
  const depart = readFileSync(join(dossier, 'depart.txt'), 'utf8');
  assert.match(depart, /^passage : A-1, bras A$/m);
  assert.match(depart, /^modèle : essai$/m);
  const base = `cd "${app}" && claude --model essai --permission-mode auto --setting-sources project,local --strict-mcp-config`;
  assert.ok(depart.includes(`${base}\n`) && depart.includes(`${base} -p "$(cat ../brief-seul.txt)" --output-format stream-json --verbose > ../session.jsonl`), depart);
  const encore = banc(racine, ['--bras', 'A', '--passage', '1']);
  assert.equal(encore.status, 2);
  assert.equal(encore.stderr, `banc : ${dossier} existe déjà : prendre un autre numéro de passage, ou supprimer ce dossier\n`);
  rmSync(racine, { recursive: true, force: true });
});

test('BN3 deux poses du même commit : mêmes fichiers, mêmes commits', () => {
  const [un, deux] = [mkdtempSync(join(tmpdir(), 'ds-lab-banc-')), mkdtempSync(join(tmpdir(), 'ds-lab-banc-'))];
  for (const r of [un, deux]) assert.equal(banc(r, ['--bras', 'A', '--passage', '2']).status, 0);
  const a = join(un, 'A-2');
  const b = join(deux, 'A-2');
  assert.deepEqual(arbre(a), arbre(b));
  /** Le texte sans la racine, écrite telle quelle, en vrai chemin ou encodée pour le journal, ni l'heure. */
  const neutre = (/** @type {string} */ racine, /** @type {string} */ t) =>
    [racine, realpathSync(racine)]
      .flatMap((r) => [r, r.replace(/[^a-zA-Z0-9]/g, '-')])
      .reduce((x, r) => x.replaceAll(r, '<racine>'), t)
      .replace(/^heure : .*$/m, 'heure : <heure>');
  for (const f of arbre(a)) assert.equal(neutre(un, readFileSync(join(a, f), 'utf8')), neutre(deux, readFileSync(join(b, f), 'utf8')), f);
  for (const d of ['ds-lab', 'app']) assert.equal(git(join(a, d), ['rev-parse', 'HEAD']), git(join(b, d), ['rev-parse', 'HEAD']), d);
  for (const r of [un, deux]) rmSync(r, { recursive: true, force: true });
});

test('BN4 verifier depuis la copie : saisir d’abord, puis le style seul échoue', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  assert.equal(banc(racine, ['--bras', 'A', '--passage', '3']).status, 0);
  const copie = join(racine, 'A-3', 'ds-lab');
  const app = join(racine, 'A-3', 'app');
  /** @param {string} c @param {string[]} args */
  const lancer = (c, args) => spawnSync(process.execPath, [join(copie, 'src', 'cli', c), ...args], { cwd: app, encoding: 'utf8' });
  const args = ['--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'];
  const avant = lancer('verifier.js', args);
  assert.equal(avant.status, 2);
  assert.equal(avant.stderr, "verifier : aucune marque dans tokens (un sous-dossier avec marque.resolver.json) : lancer d'abord la saisie\n");
  for (const m of MARQUES) {
    assert.equal(lancer('saisie.js', [`tokens/${m}/entree.json`]).status, 0, `saisie de ${m}`);
    assert.equal(lancer('vuetify.js', ['--marque', `tokens/${m}`]).status, 0, `thème de ${m}`);
  }
  const apres = lancer('verifier.js', args);
  assert.equal(apres.status, 1, apres.stderr);
  const blocs = apres.stdout.split('\n').filter((l) => l.startsWith('✗ '));
  assert.ok(blocs.length > 0 && blocs.every((l) => l.startsWith('✗ style · src/')), apres.stdout);
  assert.match(apres.stdout.trimEnd().split('\n').at(-1) ?? '', /^verifier : \d+ échecs en \d+ blocs \(contraste 0, espacements 0, typo 0, style \d+, skill 0\)$/);
  assert.ok(relative(ROOT, copie).startsWith('..'), 'la copie est hors du dépôt');
  rmSync(racine, { recursive: true, force: true });
});
