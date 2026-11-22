// @ts-check
/**
 * Le banc d'essai (D67, docs/attendus/etape-10-banc.md). Chaque pose se fait dans un dossier temporaire, sans npm ci
 * (--sans-installation : un lien vers les node_modules du dépôt) ; BN1, BN3 et BN5 sur Composer, BN4 sur Installer :
 *   BN1 un passage de Composer, bras A : la copie de ds-lab sans aucun chemin caché (chacun présent dans le dépôt) et d'un seul commit, l'app d'un seul commit
 *       « départ » sans banc.json, le skill copié à l'identique, DS_LAB, le dossier de la copie et le Node de
 *       .node-version en tête du PATH dans settings.local.json (BN7 pour le reste du PATH), ni relecteur ni carnet, les deux briefs, depart.txt et ses deux commandes ; le même
 *       passage reposé : sortie 2 qui dit quoi faire ;
 *   BN3 deux poses de Composer du même commit : mêmes fichiers à l'octet et mêmes empreintes de commit, aux chemins absolus et à
 *       l'heure près ;
 *   BN4 verifier, lancé depuis la copie : sortie 2 au départ, qui dit de saisir ; après la saisie et le thème des
 *       trois marques par la copie, sortie 1, des blocs de style seulement, aucun échec de contraste ;
 *   BN5 --exercice absent ou inconnu, et un exercice sans brief : sortie 2, un message qui dit quoi faire, rien de posé ;
 *   BN6 un passage d'Inventorier (D69) : le brief joint, le même sans humain, le départ de Composer ; son relevé, sans
 *       construction ni planche ni relevé de page ; la copie de ds-lab modifiée est notée ;
 *   BN7 les réglages d'un passage, bras A et B, posé depuis un PATH qui nomme le vrai dépôt (D70) : chaque chemin est dans
 *       le passage, sauf le Node de .node-version et les dossiers du système ; les outils courants s'y trouvent.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, lstatSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exercices } from '../src/banc/departs.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'banc.js');
const CACHES = exercices(ROOT).caches;
const MARQUES = JSON.parse(readFileSync(join(ROOT, 'fixtures', 'app-fictive', 'banc.json'), 'utf8')).marques;

/** @param {string} racine @param {string[]} args @param {string[]} exercice */
const banc = (racine, args, exercice = ['--exercice', 'composer']) => spawnSync(process.execPath, [CLI, ...exercice, '--dossier', racine, '--modele', 'essai', '--sans-installation', ...args], { cwd: ROOT, encoding: 'utf8' });
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
  const dossier = join(racine, 'composer', 'A-1');
  const copie = join(dossier, 'ds-lab');
  const app = join(dossier, 'app');
  assert.ok(CACHES.length >= 10);
  for (const c of CACHES) assert.ok(existsSync(join(ROOT, c)), `${c} : chemin caché absent du dépôt, la liste a vieilli`);
  for (const c of CACHES) assert.equal(existsSync(join(copie, c)), false, c);
  assert.ok(existsSync(join(copie, 'atelier', 'composants', 'DsCard.vue')) && existsSync(join(copie, 'src', 'cli', 'verifier.js')), 'les composants et les commandes restent');
  assert.equal(git(copie, ['rev-list', '--count', 'HEAD']), '1');
  assert.equal(git(app, ['rev-list', '--count', 'HEAD']), '1');
  assert.equal(git(app, ['log', '-1', '--format=%s']), 'départ');
  assert.equal(git(app, ['status', '--porcelain']), '');
  assert.equal(existsSync(join(app, 'banc.json')), false);
  for (const f of arbre(join(ROOT, 'skill', 'ds-lab'))) assert.equal(readFileSync(join(app, '.claude', 'skills', 'ds-lab', f), 'utf8'), readFileSync(join(ROOT, 'skill', 'ds-lab', f), 'utf8'), f);
  const reglages = JSON.parse(readFileSync(join(app, '.claude', 'settings.local.json'), 'utf8'));
  assert.deepEqual(reglages.permissions, { additionalDirectories: [copie] });
  assert.equal(reglages.env.DS_LAB, copie);
  const node = spawnSync(join(reglages.env.PATH.split(':')[0], 'node'), ['-v'], { encoding: 'utf8' }).stdout.trim();
  assert.equal(node.split('.')[0], `v${readFileSync(join(ROOT, '.node-version'), 'utf8').trim().split('.')[0]}`, 'le Node de .node-version en tête du PATH');
  for (const f of ['.claude/settings.json', 'CLAUDE.md', 'carnet.md']) assert.equal(existsSync(join(app, f)), false, f);
  const brief = readFileSync(join(ROOT, 'fixtures', 'banc', 'composer', 'brief.txt'), 'utf8');
  assert.equal(readFileSync(join(dossier, 'brief.txt'), 'utf8'), brief);
  assert.equal(readFileSync(join(dossier, 'brief-seul.txt'), 'utf8'), `${brief.trimEnd()}\n\n${readFileSync(join(ROOT, 'fixtures', 'banc', 'sans-humain.txt'), 'utf8')}`);
  const depart = readFileSync(join(dossier, 'depart.txt'), 'utf8');
  assert.match(depart, /^passage : composer\/A-1, exercice composer, bras A$/m);
  assert.match(depart, /^verifier au départ \(sortie 0\) :$/m);
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
  const a = join(un, 'composer', 'A-2');
  const b = join(deux, 'composer', 'A-2');
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
  assert.equal(banc(racine, ['--bras', 'A', '--passage', '3'], ['--exercice', 'installer']).status, 0);
  const copie = join(racine, 'installer', 'A-3', 'ds-lab');
  const app = join(racine, 'installer', 'A-3', 'app');
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

test('BN5 un exercice absent, inconnu ou sans brief : sortie 2, rien de posé', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const args = ['--bras', 'A', '--passage', '1'];
  const absent = banc(racine, args, []);
  assert.equal(absent.status, 2);
  assert.match(absent.stderr, /^banc : --exercice installer\|composer\|etendre\|inventorier attendu ; usage : npm run banc -- --exercice /);
  const inconnu = banc(racine, args, ['--exercice', 'annuaire']);
  assert.equal(inconnu.status, 2);
  assert.match(inconnu.stderr, /^banc : --exercice installer\|composer\|etendre\|inventorier attendu, reçu annuaire ; usage : /);
  const sansBrief = banc(racine, args, ['--exercice', 'etendre']);
  assert.equal(sansBrief.status, 2);
  assert.equal(sansBrief.stderr, 'banc : exercice etendre : pas encore de brief, aucun passage à poser ; écrire le brief dans fixtures/banc/etendre/ et le nommer dans fixtures/banc/exercices.json\n');
  assert.deepEqual(readdirSync(racine), []);
  const releve = banc(racine, ['--relever', 'A-1'], []);
  assert.equal(releve.status, 2);
  rmSync(racine, { recursive: true, force: true });
});

test('BN6 un passage d’Inventorier et son relevé', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const exercice = ['--exercice', 'inventorier'];
  const p = banc(racine, ['--bras', 'A', '--passage', '1'], exercice);
  assert.equal(p.status, 0, p.stderr);
  const dossier = join(racine, 'inventorier', 'A-1');
  const app = join(dossier, 'app');
  const brief = readFileSync(join(dossier, 'brief.txt'), 'utf8');
  assert.equal(brief, ['composer/description-brute.txt', 'inventorier/demande.txt'].map((f) => readFileSync(join(ROOT, 'fixtures', 'banc', f), 'utf8')).join('\n'));
  assert.equal(readFileSync(join(dossier, 'brief-seul.txt'), 'utf8'), brief, 'pas de paragraphe sans humain');
  assert.match(readFileSync(join(dossier, 'depart.txt'), 'utf8'), /^passage : inventorier\/A-1, exercice inventorier, bras A$[\s\S]*^verifier au départ \(sortie 0\) :$/m);

  writeFileSync(join(app, 'inventaire.md'), '# Inventaire\n\n- Le champ de recherche : `DsTextInput`.\n- La pagination : `DsPager` manque.\n');
  appendFileSync(join(app, 'README.md'), 'x\n');
  appendFileSync(join(dossier, 'ds-lab', 'README.md'), 'x\n');
  writeFileSync(
    join(dossier, 'session.jsonl'),
    `${JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'Read', input: { file_path: join(app, 'docs/gabarit.md') } }] } })}\n`,
  );
  const sortie = join(racine, 'releve');
  const r = banc(racine, ['--relever', 'A-1', '--sortie', sortie], exercice);
  assert.equal(r.status, 0, r.stderr);
  const lire = (/** @type {string} */ f) => readFileSync(join(sortie, f), 'utf8');
  assert.equal(lire('inventaire.md'), readFileSync(join(app, 'inventaire.md'), 'utf8'));
  const releve = lire('releve-inventaire.md');
  assert.match(releve, /^- Fichier rendu : inventaire\.md$/m);
  assert.match(releve, /^- Fichiers touchés en dehors : M README\.md$/m);
  assert.match(releve, /^- Pièces demandées : 2 nommées sur 18$/m);
  assert.match(releve, /^- DsPager, ligne 4 : /m);
  assert.deepEqual(JSON.parse(lire('lu.json')).fichiers.gabarit, ['docs/gabarit.md']);
  assert.match(lire('lu.md'), /^- Gabarit : docs\/gabarit\.md$/m);
  assert.equal(lire('notes.txt').replace(/^aucun journal dans .*\n/, ''), 'copie de ds-lab modifiée par le passage : README.md\n');
  for (const f of ['pose.md', 'planches']) assert.equal(existsSync(join(sortie, f)), false, f);
  rmSync(racine, { recursive: true, force: true });
});

test('BN7 les réglages d’un passage ne nomment rien hors de lui, sauf Node et le système', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const systeme = ['/usr/bin', '/bin', '/usr/sbin', '/sbin'];
  const pollue = [join(ROOT, 'node_modules', '.bin'), join(ROOT, 'outils'), process.env.PATH].join(':');
  /** @type {(v: unknown) => string[]} */
  const textes = (v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(textes) : []);
  for (const bras of ['A', 'B']) {
    const r = spawnSync(process.execPath, [CLI, '--exercice', 'composer', '--dossier', racine, '--modele', 'essai', '--sans-installation', '--bras', bras, '--passage', '4'], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PATH: pollue } });
    assert.equal(r.status, 0, r.stderr);
    const dossier = join(racine, 'composer', `${bras}-4`);
    const reglages = JSON.parse(readFileSync(join(dossier, 'app', '.claude', 'settings.local.json'), 'utf8'));
    const chemins = textes(reglages).flatMap((v) => v.split(':'));
    assert.ok(chemins.length >= 3, 'des chemins à juger');
    const dehors = chemins.filter((c) => c !== dossier && !c.startsWith(`${dossier}/`) && c !== dirname(process.execPath) && !systeme.includes(c));
    assert.deepEqual(dehors, [], `bras ${bras}`);
    for (const outil of ['node', 'npm', 'npx', 'git', 'sh', 'cat', 'ls', 'sed', 'grep', 'find', 'printenv']) {
      const ou = spawnSync('/bin/sh', ['-c', `command -v ${outil}`], { encoding: 'utf8', env: { PATH: reglages.env.PATH } }).stdout.trim();
      assert.ok(ou.startsWith('/'), `${outil} introuvable dans le PATH du passage`);
    }
  }
  rmSync(racine, { recursive: true, force: true });
});
