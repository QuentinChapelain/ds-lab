#!/usr/bin/env node
// @ts-check
/**
 * D67, D68, D69, D71 : le banc d'essai (npm run banc), ses exercices (fixtures/banc/exercices.json).
 * Poser : npm run banc -- --exercice <exercice> --bras A|B --passage <n> --modele <modèle> [--dossier <racine>]
 *   [--sans-installation] pose <racine>/<exercice>/<bras>-<n>/ (src/banc/banc.js) ; un exercice sans brief est refusé ;
 *   --sans-installation remplace les npm ci par un lien vers les node_modules du dépôt, pour les tests.
 * Relever : npm run banc -- --exercice <exercice> --relever <bras>-<n> [--dossier <racine>] [--sortie <dossier>]
 *   écrit dans local/banc/<exercice>/<bras>-<n>/ : le journal de la session, la sortie de verifier et ses échecs comptés
 *   dans les fichiers neufs ou modifiés et dans les fichiers intouchés, le diff depuis « départ », le carnet, ce que la
 *   session a chargé, ce qu'elle a lu (lu.md et lu.json, src/banc/lectures.js), les heures, le fichier que le brief demande,
 *   ce qu'elle a posé (pose.md et pose.json, src/banc/releve.js ; pas pour un exercice sans composants au départ ou sans
 *   page), l'inventaire face à sa liste (releve-inventaire.md et .json, src/banc/inventaire.js, pour un exercice qui en a
 *   une) et les planches des pages de l'exercice (marques de banc.json, 1 280 et 360 px, clair et sombre ; aucune page,
 *   aucune construction). Une page qui ne s'ouvre pas est notée, pas une panne ; une copie de ds-lab modifiée aussi.
 *   D71 : les heures de la seule session qui porte le brief, les autres nommées ; ce que la session a écrit et comment,
 *   le journal du relecteur, les heures du carnet, le TMPDIR du passage et les chemins de /tmp nommés (ecritures.md,
 *   src/banc/traces.js) ; ce qu'elle a chargé, face à la pose (charge.md) ; le code de sortie du relevé (sortie.txt),
 *   écrit en dernier, ou 2 et le message d'une panne.
 * Sortie 0, ou 2 sur une panne (D18).
 */
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, globSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { lancer, marquesDe } from './garde.js';
import { RACINE, poser, dossierDuJournal } from '../banc/banc.js';
import { executer } from '../banc/outils.js';
import { echecsDeMarque, echecsDeStyle, echecsDeSkill } from '../report/verifier.js';
import { exercices, marquesDuBanc } from '../banc/departs.js';
import { planches } from '../banc/planches.js';
import { enveloppes, relever, texteDuReleve } from '../banc/releve.js';
import { lectures, texteDesLectures } from '../banc/lectures.js';
import { releverInventaire, texteDeLInventaire } from '../banc/inventaire.js';
import { appels, charge, ecritures, heures, heuresDuCarnet, journalDuRelecteur, pannesVuesParClaudeCode, sessionsDuBrief, texteDeLaCharge, texteDesEcritures } from '../banc/traces.js';

const DEPOT = fileURLToPath(new URL('../..', import.meta.url));
const USAGE = 'npm run banc -- --exercice installer|composer|etendre|inventorier --bras A|B --passage <n> --modele <modèle> [--dossier <racine>], ou --exercice <exercice> --relever <bras>-<n> [--dossier <racine>]';

await lancer('banc', async () => {
  const { values } = parseArgs({
    options: {
      exercice: { type: 'string' },
      bras: { type: 'string' },
      passage: { type: 'string' },
      modele: { type: 'string' },
      dossier: { type: 'string' },
      relever: { type: 'string' },
      sortie: { type: 'string' },
      'sans-installation': { type: 'boolean' },
    },
  });
  const racine = resolve(values.dossier ?? RACINE);
  const noms = Object.keys(exercices(DEPOT).exercices);
  if (!values.exercice || !noms.includes(values.exercice)) throw new Error(`--exercice ${noms.join('|')} attendu${values.exercice ? `, reçu ${values.exercice}` : ''} ; usage : ${USAGE}`);
  if (values.relever) return releverPassage(racine, values.exercice, values.relever, resolve(values.sortie ?? join(DEPOT, 'local', 'banc', values.exercice, values.relever)));
  if (values.bras !== 'A' && values.bras !== 'B') throw new Error(`--bras A ou --bras B attendu ; usage : ${USAGE}`);
  const passage = Number(values.passage);
  if (!Number.isInteger(passage) || passage < 1) throw new Error(`--passage <n> attendu, un entier à partir de 1 ; usage : ${USAGE}`);
  if (!values.modele) throw new Error(`--modele <modèle> attendu, le même pour tous les passages ; usage : ${USAGE}`);
  const v = spawnSync('claude', ['--version'], { encoding: 'utf8' });
  const p = poser({
    depot: DEPOT,
    racine,
    exercice: values.exercice,
    bras: values.bras,
    passage,
    modele: values.modele,
    installer: !values['sans-installation'],
    heure: new Date().toISOString(),
    claude: v.status === 0 ? v.stdout.trim() : 'introuvable',
  });
  console.log(`banc : passage posé dans ${p.dossier} (ds-lab ${p.commit}) ; commandes et sortie de verifier au départ dans depart.txt`);
  return 0;
});

/**
 * Relève les traces d'un passage.
 * @param {string} racine @param {string} exercice @param {string} id @param {string} sortie
 */
async function releverPassage(racine, exercice, id, sortie) {
  try {
    await relevePassage(racine, exercice, id, sortie);
  } catch (e) {
    if (existsSync(sortie)) writeFileSync(join(sortie, 'sortie.txt'), `2 : ${String(/** @type {any} */ (e)?.message ?? e).split('\n')[0]}\n`);
    throw e;
  }
  writeFileSync(join(sortie, 'sortie.txt'), '0\n');
  console.log(`banc : passage ${exercice}/${id} relevé dans ${sortie}`);
  return 0;
}

/** Le relevé lui-même. @param {string} racine @param {string} exercice @param {string} id @param {string} sortie */
async function relevePassage(racine, exercice, id, sortie) {
  const { exercices: tous, signaux } = exercices(DEPOT);
  const e = tous[exercice];
  const dossier = join(racine, exercice, id);
  const app = join(dossier, 'app');
  const copie = join(dossier, 'ds-lab');
  if (!existsSync(app) || !existsSync(copie)) throw new Error(`${dossier} : pas de passage posé ici ; le poser d'abord (${USAGE})`);
  mkdirSync(sortie, { recursive: true });
  /** @type {string[]} */
  const notes = [];

  // Journal : celui de Claude Code pour le dossier de l'app, et le flux d'un passage sans humain.
  const journaux = dossierDuJournal(realpathSync(app));
  const sessions = existsSync(journaux) ? readdirSync(journaux).filter((f) => f.endsWith('.jsonl')) : [];
  // Les agents qu'une session a lancés ont leur journal à eux, dans un sous-dossier.
  const agents = existsSync(journaux) ? globSync('*/**/*.jsonl', { cwd: journaux }) : [];
  mkdirSync(join(sortie, 'journal'), { recursive: true });
  for (const f of [...sessions, ...agents]) {
    mkdirSync(dirname(join(sortie, 'journal', f)), { recursive: true });
    copyFileSync(join(journaux, f), join(sortie, 'journal', f));
  }
  if (!sessions.length) notes.push(`aucun journal dans ${journaux}`);
  for (const f of ['session.jsonl', 'depart.txt']) if (existsSync(join(dossier, f))) copyFileSync(join(dossier, f), join(sortie, f));
  if (existsSync(join(app, 'carnet.md'))) copyFileSync(join(app, 'carnet.md'), join(sortie, 'carnet.md'));

  // Diff depuis « départ », fichiers neufs compris, par un index temporaire : le dépôt de l'app n'est pas touché.
  const depart = executer('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: app }).trim().split('\n')[0];
  const index = join(mkdtempSync(join(tmpdir(), 'banc-index-')), 'index');
  const env = { GIT_INDEX_FILE: index };
  executer('git', ['add', '-A'], { cwd: app, env });
  writeFileSync(join(sortie, 'diff.patch'), executer('git', ['diff', '--cached', depart], { cwd: app, env }));
  const statuts = executer('git', ['diff', '--cached', '--name-status', '--no-renames', '-z', depart], { cwd: app, env }).split('\0').filter(Boolean);
  const touches = statuts.flatMap((s, i) => (i % 2 ? [{ statut: statuts[i - 1], fichier: s }] : []));
  rmSync(index, { force: true });
  const fichiersDuDepart = executer('git', ['ls-tree', '-r', '-z', '--name-only', depart], { cwd: app }).split('\0').filter(Boolean);
  const changes = changesDansLaCopie(copie);
  if (changes.length) notes.push(`copie de ds-lab modifiée par le passage : ${changes.join(', ')}`);

  // Le fichier que le brief demande : à la racine de l'app, ou le premier du même nom ailleurs.
  const lieuDuRendu = e.rendu ? (touches.filter((t) => t.statut !== 'D' && basename(t.fichier) === e.rendu).map((t) => t.fichier).sort((a, b) => a.split('/').length - b.split('/').length)[0] ?? null) : null;
  if (lieuDuRendu) copyFileSync(join(app, lieuDuRendu), join(sortie, basename(lieuDuRendu)));

  // verifier, tel que la copie l'écrit, puis ses échecs comptés à part : fichiers neufs ou modifiés, fichiers intouchés.
  const v = spawnSync(process.execPath, [join(copie, 'src', 'cli', 'verifier.js'), '--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'], {
    cwd: app,
    encoding: 'utf8',
  });
  const comptes = await compterEchecs(app, copie, touches.map((t) => t.fichier)).catch((e) => ({ panne: String(e.message ?? e) }));
  writeFileSync(join(sortie, 'verifier.txt'), `${v.stdout}${v.stderr}sortie ${v.status}\n\n${JSON.stringify(comptes, null, 2)}\n`);

  const brief = existsSync(join(dossier, 'brief.txt')) ? readFileSync(join(dossier, 'brief.txt'), 'utf8') : '';
  const sessionsPrises = sessionsDuBrief(sessions.map((f) => join(journaux, f)), brief);
  const ch = charge(join(dossier, 'session.jsonl'), sessionsPrises.retenues);
  writeFileSync(join(sortie, 'charge.json'), `${JSON.stringify(ch, null, 2)}\n`);
  writeFileSync(join(sortie, 'charge.md'), texteDeLaCharge(ch));
  const lu = lectures({ journaux: sessions.length ? [...sessions, ...agents].map((f) => join(journaux, f)) : [join(dossier, 'session.jsonl')].filter(existsSync), app, copie, depart: fichiersDuDepart });
  writeFileSync(join(sortie, 'lu.json'), `${JSON.stringify(lu, null, 2)}\n`);
  writeFileSync(join(sortie, 'lu.md'), texteDesLectures(lu));
  if (e.reference && e.rendu) {
    const { pieces } = JSON.parse(readFileSync(join(DEPOT, 'fixtures', 'banc', e.reference), 'utf8'));
    const r = releverInventaire({ texte: lieuDuRendu && readFileSync(join(app, lieuDuRendu), 'utf8'), lieu: lieuDuRendu, rendu: e.rendu, touches, depart: fichiersDuDepart, pieces });
    writeFileSync(join(sortie, 'releve-inventaire.json'), `${JSON.stringify(r, null, 2)}\n`);
    writeFileSync(join(sortie, 'releve-inventaire.md'), texteDeLInventaire(r));
  }
  if (e.copies.length && e.pages.length) {
    const r = relever({
      app,
      touches,
      avant: (f) => executer('git', ['show', `${depart}:${f}`], { cwd: app }),
      enveloppes: enveloppes(join(copie, 'docs', 'composants')),
      page: e.pages[0],
      signaux,
      provisoire: e.provisoire,
      catalogue: fichiersDuDepart.flatMap((f) => f.match(/^src\/components\/ds\/(Ds\w+)\.vue$/)?.slice(1) ?? []),
      rapport: e.rendu ? { attendu: e.rendu, lieu: lieuDuRendu } : undefined,
    });
    writeFileSync(join(sortie, 'pose.json'), `${JSON.stringify(r, null, 2)}\n`);
    writeFileSync(join(sortie, 'pose.md'), texteDuReleve(r));
  }
  const h = heures(sessionsPrises.retenues, sessionsPrises.ecartees);
  writeFileSync(join(sortie, 'heures.md'), h.texte);

  // Ce que la session a écrit et comment, le relecteur, le carnet, le dossier temporaire (D71).
  const tmp = join(dossier, 'tmp');
  const dansTmp = existsSync(tmp) ? globSync('**/*', { cwd: tmp, exclude: (f) => f.includes('node_modules') }).filter((f) => statSync(join(tmp, f)).isFile()).sort() : [];
  if (dansTmp.length) cpSync(tmp, join(sortie, 'tmp'), { recursive: true, filter: (f) => !f.includes('node_modules') });
  const ids = sessionsPrises.retenues.map((f) => basename(f, '.jsonl'));
  const dansLePassage = globSync('ds-lab-relecteur/*/journal.jsonl', { cwd: tmp }).map((f) => join(tmp, f));
  // Le TMPDIR des réglages n'atteint pas le hook (essai du 23/11/2026, D71) : sa mémoire est alors dans le dossier
  // temporaire de la session, celui du terminal qui l'a lancée, ou /tmp sans TMPDIR.
  const temporaires = [...new Set([tmpdir(), '/tmp'].map((d) => (existsSync(d) ? realpathSync(d) : d)))];
  const ailleurs = temporaires.flatMap((d) => ids.map((s) => join(d, 'ds-lab-relecteur', s, 'journal.jsonl'))).filter(existsSync);
  const relecteur = dansLePassage.length
    ? { fichiers: dansLePassage, lieu: 'le TMPDIR du passage' }
    : ailleurs.length
      ? { fichiers: ailleurs, lieu: `${[...new Set(ailleurs.map((f) => dirname(dirname(dirname(f)))))].join(', ')} (le TMPDIR du passage n'a pas atteint le hook)` }
      : null;
  const flux = existsSync(join(dossier, 'session.jsonl')) ? [join(dossier, 'session.jsonl')] : [];
  const ec = ecritures(appels(sessionsPrises.retenues.length ? [...sessionsPrises.retenues, ...agents.map((f) => join(journaux, f))] : flux));
  const pannes = pannesVuesParClaudeCode(sessionsPrises.retenues);
  const carnet = existsSync(join(app, 'carnet.md')) ? heuresDuCarnet(readFileSync(join(app, 'carnet.md'), 'utf8'), h.session, ec.premiere, ec.appelsDuCarnet) : null;
  writeFileSync(join(sortie, 'ecritures.md'), texteDesEcritures({ sessions: sessionsPrises, ecritures: ec, carnet, relecteur: relecteur && journalDuRelecteur(relecteur.fichiers), relecteurLieu: relecteur?.lieu ?? null, pannes, tmp: dansTmp }));
  writeFileSync(join(sortie, 'ecritures.json'), `${JSON.stringify({ ecritures: ec, carnet, relecteur: relecteur && journalDuRelecteur(relecteur.fichiers), pannes }, null, 2)}\n`);
  if (e.pages.length) notes.push(...(await planches(app, join(sortie, 'planches'), { marques: marquesDuBanc(DEPOT), pages: e.pages })));
  writeFileSync(join(sortie, 'notes.txt'), notes.length ? `${notes.join('\n')}\n` : 'rien à noter\n');
}


/** Les fichiers de la copie de ds-lab que le passage a changés, ajoutés ou retirés depuis sa pose. @param {string} copie */
function changesDansLaCopie(copie) {
  const pose = executer('git', ['rev-list', '--max-parents=0', 'HEAD'], { cwd: copie }).trim().split('\n')[0];
  const liste = (/** @type {string[]} */ args) => executer('git', args, { cwd: copie }).split('\0').filter(Boolean);
  return [...liste(['diff', '--name-only', '-z', pose]), ...liste(['ls-files', '-z', '--others', '--exclude-standard'])].filter((f) => f !== 'node_modules').sort();
}

/**
 * Les échecs de verifier, dans le processus, rangés selon que le fichier ou la marque a été touché depuis « départ ».
 * Une marque est touchée si un fichier de son dossier l'est ; le skill, si un fichier de sa copie l'est.
 * @param {string} app @param {string} copie @param {string[]} touches
 */
async function compterEchecs(app, copie, touches) {
  const estTouche = (/** @type {string} */ chemin) => touches.some((t) => t === chemin || t.startsWith(`${chemin.replace(/\/$/, '')}/`));
  /** @type {Record<string, { neufs: number, intouches: number }>} */
  const par = {};
  /** @param {string} famille @param {boolean} touche @param {number} n */
  const ajouter = (famille, touche, n) => {
    par[famille] ??= { neufs: 0, intouches: 0 };
    par[famille][touche ? 'neufs' : 'intouches'] += n;
  };
  let marques = [];
  try {
    marques = marquesDe(undefined, join(app, 'tokens'));
  } catch {
    marques = [];
  }
  for (const d of marques) {
    const echecs = echecsDeMarque(d, app);
    const touche = estTouche(relative(app, d));
    for (const e of echecs) ajouter(e.famille, touche, 1);
  }
  const fichiers = globSync('src/**/*.vue', { cwd: app }).map((f) => join(app, f));
  const { results } = await stylelint.lint({ files: fichiers, configFile: join(copie, 'stylelint.config.mjs') });
  for (const e of echecsDeStyle(results, app)) ajouter('style', estTouche(e.tete), 1);
  for (const e of echecsDeSkill(join(app, '.claude', 'skills', 'ds-lab'), app)) ajouter('skill', estTouche('.claude/skills/ds-lab'), 1);
  return { marques: marques.length, fichiersTouches: touches.length, echecs: par };
}
