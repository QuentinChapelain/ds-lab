#!/usr/bin/env node
// @ts-check
/**
 * D67, D68 : le banc d'essai (npm run banc), trois exercices (fixtures/banc/exercices.json).
 * Poser : npm run banc -- --exercice <exercice> --bras A|B --passage <n> --modele <modèle> [--dossier <racine>]
 *   [--sans-installation] pose <racine>/<exercice>/<bras>-<n>/ (src/banc/banc.js) ; un exercice sans brief est refusé ;
 *   --sans-installation remplace les npm ci par un lien vers les node_modules du dépôt, pour les tests.
 * Relever : npm run banc -- --exercice <exercice> --relever <bras>-<n> [--dossier <racine>] [--sortie <dossier>]
 *   écrit dans local/banc/<exercice>/<bras>-<n>/ : le journal de la session, la sortie de verifier et ses échecs comptés
 *   dans les fichiers neufs ou modifiés et dans les fichiers intouchés, le diff depuis « départ », le carnet, ce que la
 *   session a chargé, les heures, ce qu'elle a posé (pose.md et pose.json, src/banc/releve.js ; pas pour un exercice sans
 *   composants au départ) et les planches des pages de l'exercice (marques de banc.json, 1 280 et 360 px, clair et
 *   sombre). Une page qui ne s'ouvre pas est notée, pas une panne.
 * Sortie 0, ou 2 sur une panne (D18).
 */
import { parseArgs } from 'node:util';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, globSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';
import { lancer, marquesDe } from './garde.js';
import { RACINE, poser, dossierDuJournal } from '../banc/banc.js';
import { executer } from '../banc/outils.js';
import { echecsDeMarque, echecsDeStyle, echecsDeSkill } from '../report/verifier.js';
import { exercices, marquesDuBanc } from '../banc/departs.js';
import { planches } from '../banc/planches.js';
import { enveloppes, relever, texteDuReleve } from '../banc/releve.js';

const DEPOT = fileURLToPath(new URL('../..', import.meta.url));
const USAGE = 'npm run banc -- --exercice composer|etendre|installer --bras A|B --passage <n> --modele <modèle> [--dossier <racine>], ou --exercice <exercice> --relever <bras>-<n> [--dossier <racine>]';

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
  mkdirSync(join(sortie, 'journal'), { recursive: true });
  for (const f of sessions) copyFileSync(join(journaux, f), join(sortie, 'journal', f));
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

  // verifier, tel que la copie l'écrit, puis ses échecs comptés à part : fichiers neufs ou modifiés, fichiers intouchés.
  const v = spawnSync(process.execPath, [join(copie, 'src', 'cli', 'verifier.js'), '--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'], {
    cwd: app,
    encoding: 'utf8',
  });
  const comptes = await compterEchecs(app, copie, touches.map((t) => t.fichier)).catch((e) => ({ panne: String(e.message ?? e) }));
  writeFileSync(join(sortie, 'verifier.txt'), `${v.stdout}${v.stderr}sortie ${v.status}\n\n${JSON.stringify(comptes, null, 2)}\n`);

  writeFileSync(join(sortie, 'charge.json'), `${JSON.stringify(charge(join(dossier, 'session.jsonl')), null, 2)}\n`);
  if (e.copies.length) {
    const r = relever({
      app,
      touches,
      avant: (f) => executer('git', ['show', `${depart}:${f}`], { cwd: app }),
      enveloppes: enveloppes(join(copie, 'docs', 'composants')),
      page: e.pages[0],
      signaux,
    });
    writeFileSync(join(sortie, 'pose.json'), `${JSON.stringify(r, null, 2)}\n`);
    writeFileSync(join(sortie, 'pose.md'), texteDuReleve(r));
  }
  writeFileSync(join(sortie, 'heures.md'), heures(sessions.map((f) => join(journaux, f))));
  notes.push(...(await planches(app, join(sortie, 'planches'), { marques: marquesDuBanc(DEPOT), pages: e.pages })));
  writeFileSync(join(sortie, 'notes.txt'), notes.length ? `${notes.join('\n')}\n` : 'rien à noter\n');
  console.log(`banc : passage ${exercice}/${id} relevé dans ${sortie}`);
  return 0;
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

/** Ce que la session sans humain a chargé, lu dans le message d'ouverture de son flux. @param {string} flux */
function charge(flux) {
  if (!existsSync(flux)) return { note: 'session avec humain : ce qu’elle a chargé se lit dans les attachements du journal' };
  const init = readFileSync(flux, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .find((m) => m?.type === 'system' && m?.subtype === 'init');
  if (!init) return { note: 'aucun message d’ouverture dans session.jsonl' };
  const { model, tools, mcp_servers, slash_commands, skills, plugins, agents, permissionMode, claude_code_version } = init;
  return { model, claude_code_version, permissionMode, tools, mcp_servers, slash_commands, skills, plugins, agents };
}

/**
 * Les heures d'un passage, lues dans le journal : du brief au dernier message de l'agent ; une attente va d'un message
 * de l'agent au message suivant de l'humain (un texte, pas le résultat d'un outil). Les demandes de permission ne
 * sont ni des questions ni des attentes : elles restent dans le travail.
 * @param {string[]} journaux
 */
function heures(journaux) {
  /** @type {{ t: number, qui: 'humain' | 'agent' }[]} */
  const messages = [];
  for (const j of journaux)
    for (const l of readFileSync(j, 'utf8').split('\n').filter(Boolean)) {
      let m;
      try {
        m = JSON.parse(l);
      } catch {
        continue;
      }
      if (!m.timestamp || m.isMeta) continue;
      const contenu = m.message?.content;
      if (m.type === 'user' && (typeof contenu === 'string' || (Array.isArray(contenu) && contenu.some((c) => c.type === 'text'))))
        messages.push({ t: Date.parse(m.timestamp), qui: 'humain' });
      else if (m.type === 'assistant') messages.push({ t: Date.parse(m.timestamp), qui: 'agent' });
    }
  messages.sort((a, b) => a.t - b.t);
  const debut = messages.find((m) => m.qui === 'humain');
  const fin = messages.findLast((m) => m.qui === 'agent');
  if (!debut || !fin) return 'Heures : journal vide ou absent.\n';
  let attente = 0;
  for (let i = 1; i < messages.length; i++) if (messages[i].qui === 'humain' && messages[i - 1].qui === 'agent' && messages[i].t > debut.t) attente += messages[i].t - messages[i - 1].t;
  const min = (/** @type {number} */ ms) => `${Math.round(ms / 60000)} min`;
  return [
    '# Heures',
    '',
    `- Brief : ${new Date(debut.t).toISOString()}`,
    `- Dernier message de l'agent : ${new Date(fin.t).toISOString()}`,
    `- En tout : ${min(fin.t - debut.t)}`,
    `- L'agent attend l'humain : ${min(attente)}`,
    `- L'agent travaille : ${min(fin.t - debut.t - attente)}`,
    '',
    'La fin du passage est le message où l’agent dit avoir fini : à vérifier dans le journal.',
    '',
  ].join('\n');
}
