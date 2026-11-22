// @ts-check
/**
 * D67, D68 : le banc d'essai. Il pose, hors du dépôt, le dossier d'un passage d'un exercice : une copie de l'arbre de
 * ds-lab, sans la référence et sans historique (une pose installée refuse un arbre qui a des changements non commités) ;
 * l'app au point de départ de l'exercice (src/banc/departs.js), en dépôt git d'un commit « départ » ; le skill copié, la
 * variable DS_LAB, les deux briefs et depart.txt ; dans le bras B, le relecteur et le carnet, posés par la commande de la
 * copie. Deux poses du même commit donnent les mêmes fichiers, aux chemins absolus et à l'heure près : les commits ont un
 * auteur et une date fixes. Le relevé des traces d'un passage est dans src/cli/banc.js.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { exercices, fabriquer } from './departs.js';
import { copierArbre, executer } from './outils.js';

/** Racine par défaut des passages, hors de tout dossier qui porte un CLAUDE.md. */
export const RACINE = join(homedir(), 'Developer', 'banc');

/** Auteur et date fixes des commits posés : deux poses du même commit ont les mêmes empreintes. */
const GIT_ENV = {
  GIT_AUTHOR_NAME: 'banc',
  GIT_AUTHOR_EMAIL: 'banc@exemple.invalid',
  GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z',
  GIT_COMMITTER_NAME: 'banc',
  GIT_COMMITTER_EMAIL: 'banc@exemple.invalid',
  GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z',
};

/** Fait d'un dossier un dépôt git d'un seul commit, au message donné. @param {string} dossier @param {string} message */
function commit(dossier, message) {
  if (!existsSync(join(dossier, '.git'))) executer('git', ['init', '-q', '-b', 'main'], { cwd: dossier });
  executer('git', ['add', '-A'], { cwd: dossier });
  executer('git', ['commit', '-q', '--allow-empty', '-m', message], { cwd: dossier, env: GIT_ENV });
}

/** Nom d'un passage, et son dossier sous la racine. @param {string} exercice @param {string} bras @param {number} passage */
const nomDePassage = (exercice, bras, passage) => `${exercice}/${bras}-${passage}`;

/**
 * Dossier du journal de Claude Code pour une session ouverte dans `dossier`, donné par son vrai chemin (realpath) :
 * chaque signe autre qu'une lettre ou un chiffre devient « - ».
 * @param {string} dossier
 */
export const dossierDuJournal = (dossier) => join(homedir(), '.claude', 'projects', dossier.replace(/[^a-zA-Z0-9]/g, '-'));

/**
 * La ligne de commande d'un passage, la même avec et sans humain ; sans humain, le brief part en argument et la
 * session écrit son flux dans ../session.jsonl.
 * @param {string} app @param {string} modele @param {boolean} seul
 */
function commandeDuPassage(app, modele, seul) {
  const base = `cd "${app}" && claude --model ${modele} --permission-mode auto --setting-sources project,local --strict-mcp-config`;
  return seul ? `${base} -p "$(cat ../brief-seul.txt)" --output-format stream-json --verbose > ../session.jsonl` : base;
}

/**
 * Pose le dossier d'un passage.
 * @param {{ depot: string, racine: string, exercice: string, bras: 'A' | 'B', passage: number, modele: string, installer: boolean,
 *   heure: string, claude: string }} o depot : la racine de ds-lab ; installer : npm ci, sinon un lien vers les
 *   node_modules du dépôt (tests) ; heure et claude : la date de la pose et la version de claude, écrites dans depart.txt
 * @returns {{ dossier: string, app: string, copie: string, commit: string }}
 */
export function poser(o) {
  const { caches, exercices: tous } = exercices(o.depot);
  const exercice = tous[o.exercice];
  if (!exercice) throw new Error(`exercice inconnu : ${o.exercice} (${Object.keys(tous).join(', ')})`);
  if (!exercice.brief) throw new Error(`exercice ${o.exercice} : pas encore de brief, aucun passage à poser ; écrire le brief dans fixtures/banc/${o.exercice}/ et le nommer dans fixtures/banc/exercices.json`);
  const dossier = join(o.racine, nomDePassage(o.exercice, o.bras, o.passage));
  if (existsSync(dossier)) throw new Error(`${dossier} existe déjà : prendre un autre numéro de passage, ou supprimer ce dossier`);
  const modifie = executer('git', ['status', '--porcelain'], { cwd: o.depot }).trim() !== '';
  if (modifie && o.installer) throw new Error("l'arbre de ds-lab a des changements non commités : les commiter avant de poser un passage, pour qu'il se rejoue à l'identique");
  const copie = join(dossier, 'ds-lab');
  const app = join(dossier, 'app');
  const sha = executer('git', ['rev-parse', '--short', 'HEAD'], { cwd: o.depot }).trim();
  copierArbre(o.depot, copie, (f) => !caches.some((c) => f === c || f.startsWith(`${c}/`)));
  commit(copie, `ds-lab ${sha}${modifie ? ', arbre modifié' : ''}`);
  if (o.installer) executer('npm', ['ci', '--no-audit', '--no-fund'], { cwd: copie });
  else symlinkSync(join(o.depot, 'node_modules'), join(copie, 'node_modules'));
  fabriquer({ depot: o.depot, clone: copie, exercice: o.exercice, app });
  cpSync(join(copie, 'skill', 'ds-lab'), join(app, '.claude', 'skills', 'ds-lab'), { recursive: true });
  // Le Node du banc (celui de .node-version, que la garde impose) passe devant le PATH de la session et de ses hooks :
  // sous une autre version majeure, chaque commande de ds-lab sortirait en 2.
  const reglages = { env: { DS_LAB: copie, PATH: `${dirname(process.execPath)}:${process.env.PATH ?? ''}` }, permissions: { additionalDirectories: [copie] } };
  writeFileSync(join(app, '.claude', 'settings.local.json'), `${JSON.stringify(reglages, null, 2)}\n`);
  if (o.bras === 'B') {
    const relecteur = join(copie, 'src', 'cli', 'relecteur.js');
    if (!existsSync(relecteur)) throw new Error(`bras B : ${relecteur} manque dans la copie ; poser le bras B depuis un commit qui a le relecteur`);
    executer(process.execPath, [relecteur, '--poser', '--marques', 'tokens', '--style', 'src/**/*.vue'], { cwd: app, env: { DS_LAB: copie } });
  }
  if (o.installer) executer('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app });
  commit(app, 'départ');

  const briefs = join(o.depot, 'fixtures', 'banc');
  const brief = readFileSync(join(briefs, exercice.brief), 'utf8');
  writeFileSync(join(dossier, 'brief.txt'), brief);
  writeFileSync(join(dossier, 'brief-seul.txt'), `${brief.trimEnd()}\n\n${readFileSync(join(briefs, 'sans-humain.txt'), 'utf8')}`);
  const verifier = spawnSync(process.execPath, [join(copie, 'src', 'cli', 'verifier.js'), '--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'], {
    cwd: app,
    encoding: 'utf8',
  });
  const depart = [
    `passage : ${nomDePassage(o.exercice, o.bras, o.passage)}, exercice ${o.exercice}, bras ${o.bras}`,
    `heure : ${o.heure}`,
    `ds-lab : ${sha}${modifie ? ', arbre modifié' : ''} (copie sans la référence ni l'historique : ${copie})`,
    `claude : ${o.claude}`,
    `modèle : ${o.modele}`,
    `journal : ${dossierDuJournal(realpathSync(app))}/<session>.jsonl`,
    '',
    'Avec humain : lancer, puis coller brief.txt en premier message.',
    commandeDuPassage(app, o.modele, false),
    '',
    'Sans humain :',
    commandeDuPassage(app, o.modele, true),
    '',
    `verifier au départ (sortie ${verifier.status}) :`,
    `${verifier.stdout}${verifier.stderr}`.trimEnd(),
    '',
  ].join('\n');
  writeFileSync(join(dossier, 'depart.txt'), depart);
  return { dossier, app, copie, commit: sha };
}
