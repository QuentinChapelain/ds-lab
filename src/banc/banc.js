// @ts-check
/**
 * D67 : le banc d'essai. Il pose, hors du dépôt, le dossier d'un passage : une copie de ds-lab sans la référence et
 * sans historique, l'app fictive en dépôt git d'un commit « départ », le skill copié, la variable DS_LAB, les deux
 * briefs et depart.txt ; dans le bras B, le relecteur et le carnet, posés par la commande de la copie. Deux poses du
 * même commit donnent les mêmes fichiers, aux chemins absolus et à l'heure près : les commits ont un auteur et une
 * date fixes. Il relève ensuite les traces d'un passage (src/cli/banc.js).
 */
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/** Ce que la copie de ds-lab ne contient pas, lu dans fixtures/banc/caches.json. @param {string} depot */
export const caches = (depot) => /** @type {string[]} */ (JSON.parse(readFileSync(join(depot, 'fixtures', 'banc', 'caches.json'), 'utf8')).caches);

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

/**
 * Une commande qui doit réussir ; sinon une panne qui la nomme, avec la fin de sa sortie d'erreur.
 * @param {string} cmd @param {string[]} args @param {{ cwd: string, env?: Record<string, string>, input?: Buffer }} o
 */
export function executer(cmd, args, o) {
  const r = spawnSync(cmd, args, { cwd: o.cwd, env: { ...process.env, ...o.env }, input: o.input, encoding: 'buffer', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} : sortie ${r.status ?? r.signal} dans ${o.cwd} ; ${String(r.stderr ?? '').trim().split('\n').at(-1) ?? ''}`);
  return String(r.stdout);
}

/** Fait d'un dossier un dépôt git d'un seul commit, au message donné. @param {string} dossier @param {string} message */
function commit(dossier, message) {
  if (!existsSync(join(dossier, '.git'))) executer('git', ['init', '-q', '-b', 'main'], { cwd: dossier });
  executer('git', ['add', '-A'], { cwd: dossier });
  executer('git', ['commit', '-q', '--allow-empty', '-m', message], { cwd: dossier, env: GIT_ENV });
}

/** Nom du dossier d'un passage. @param {string} bras @param {number} passage */
const nomDePassage = (bras, passage) => `${bras}-${passage}`;

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
 * @param {{ depot: string, racine: string, bras: 'A' | 'B', passage: number, modele: string, installer: boolean,
 *   heure: string, claude: string }} o depot : la racine de ds-lab ; installer : npm ci, sinon un lien vers les
 *   node_modules du dépôt (tests) ; heure et claude : la date de la pose et la version de claude, écrites dans depart.txt
 * @returns {{ dossier: string, app: string, copie: string, commit: string }}
 */
export function poser(o) {
  const dossier = join(o.racine, nomDePassage(o.bras, o.passage));
  if (existsSync(dossier)) throw new Error(`${dossier} existe déjà : prendre un autre numéro de passage, ou supprimer ce dossier`);
  const copie = join(dossier, 'ds-lab');
  const app = join(dossier, 'app');
  mkdirSync(copie, { recursive: true });
  const sha = executer('git', ['rev-parse', '--short', 'HEAD'], { cwd: o.depot }).trim();
  const archive = spawnSync('git', ['archive', '--format=tar', 'HEAD'], { cwd: o.depot, encoding: 'buffer', maxBuffer: 1 << 28 }).stdout;
  executer('tar', ['-x', '-f', '-'], { cwd: copie, input: archive });
  for (const c of caches(o.depot)) rmSync(join(copie, c), { recursive: true, force: true });
  commit(copie, `ds-lab ${sha}`);
  if (o.installer) executer('npm', ['ci', '--no-audit', '--no-fund'], { cwd: copie });
  else symlinkSync(join(o.depot, 'node_modules'), join(copie, 'node_modules'));

  const source = join(o.depot, 'fixtures', 'app-fictive');
  const fichiers = executer('git', ['ls-files', '--cached', '--others', '--exclude-standard', '.'], { cwd: source })
    .split('\n')
    .filter((f) => f && f !== 'banc.json');
  for (const f of fichiers) {
    mkdirSync(dirname(join(app, f)), { recursive: true });
    cpSync(join(source, f), join(app, f));
  }
  cpSync(join(copie, 'skill', 'ds-lab'), join(app, '.claude', 'skills', 'ds-lab'), { recursive: true });
  const reglages = { env: { DS_LAB: copie }, permissions: { additionalDirectories: [copie] } };
  writeFileSync(join(app, '.claude', 'settings.local.json'), `${JSON.stringify(reglages, null, 2)}\n`);
  if (o.bras === 'B') {
    const relecteur = join(copie, 'src', 'cli', 'relecteur.js');
    if (!existsSync(relecteur)) throw new Error(`bras B : ${relecteur} manque dans la copie ; poser le bras B depuis un commit qui a le relecteur`);
    executer(process.execPath, [relecteur, '--poser', '--marques', 'tokens', '--style', 'src/**/*.vue'], { cwd: app, env: { DS_LAB: copie } });
  }
  if (o.installer) executer('npm', ['ci', '--no-audit', '--no-fund'], { cwd: app });
  commit(app, 'départ');

  const briefs = join(o.depot, 'fixtures', 'banc');
  const brief = readFileSync(join(briefs, 'brief.txt'), 'utf8');
  writeFileSync(join(dossier, 'brief.txt'), brief);
  writeFileSync(join(dossier, 'brief-seul.txt'), `${brief.trimEnd()}\n\n${readFileSync(join(briefs, 'sans-humain.txt'), 'utf8')}`);
  const verifier = spawnSync(process.execPath, [join(copie, 'src', 'cli', 'verifier.js'), '--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'], {
    cwd: app,
    encoding: 'utf8',
  });
  const depart = [
    `passage : ${nomDePassage(o.bras, o.passage)}, bras ${o.bras}`,
    `heure : ${o.heure}`,
    `ds-lab : ${sha} (copie sans la référence ni l'historique : ${copie})`,
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
