// @ts-check
/**
 * Le relecteur (D67, D71, docs/attendus/etape-10-banc.md et etape-10-relecteur-et-carnet.md) : trois hooks qui relisent
 * ce qui a changé dans le périmètre, quel que soit l'outil, et le carnet. Attendus écrits à la main avant le code ; chaque
 * cas joue dans un dépôt fictif hors de ds-lab, avec des copies des marques, et sa mémoire dans un dossier temporaire à lui :
 *   RL1 une marque cassée par le shell : code 2, « relecteur : <fichier> » puis ses blocs sur la sortie d'erreur, un
 *       « À faire » par bloc ; rien sur la sortie standard ;
 *   RL2 un .vue neuf et propre : aucune sortie ; un fichier ni de marque ni de style : rien ; une valeur en dur dans un
 *       .vue : code 2 et son bloc de style ;
 *   RL3 --poser fusionne les trois hooks avec un settings.json qui existe, garde un CLAUDE.md et y ajoute le bloc du
 *       carnet, pose carnet.md ; relancé, il ne change aucun octet ; sur une pose d'avant (hook sur Edit et Write, ancien
 *       bloc), il remplace hook et section, sans doublon, et garde la section suivante et carnet.md ;
 *   RL4 la commande du hook sans DS_LAB : code 2 et ce qu'il faut poser ; une entrée qui n'est pas du JSON : code 2 ;
 *   RL5 une page en faute, intouchée, et un autre fichier propre écrit : le relecteur ne dit rien de la page ;
 *   RL6 une écriture par le shell (cat >) : l'appel Bash qui suit rend le bloc ; l'appel d'après, rien d'écrit, rien ;
 *   RL7 la fin du tour : changé depuis le départ et en échec, l'arrêt est refusé ; à la relance, laissé, et l'humain lit
 *       les échecs ; corrigé, rien ;
 *   RL8 la mémoire est hors du dépôt, une par session, un journal d'une ligne par appel ; sans empreintes de départ, le
 *       seul fichier de tool_input.file_path est relu ;
 *   RL9 deux appels lancés ensemble, cinq fois : ni panne, ni relecture perdue, une ligne de journal par appel ;
 *   RL10 sans entrée (vide, ou ouverte et muette) : sortie 2 tout de suite, et la commande à lancer à la main ;
 *   RL11 le périmètre se compte depuis la racine du projet (CLAUDE_PROJECT_DIR), pas depuis le cd de l'agent ;
 *   RL12 une panne s'écrit au journal avant la sortie.
 * Et BN2 : un passage du bras B posé par le banc porte les hooks, le bloc du carnet et carnet.md, dans le commit « départ » ;
 * CN1 : le carnet, une ligne datée par la commande.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, RESOLVER } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'relecteur.js');
const CARNET_CLI = join(ROOT, 'src', 'cli', 'carnet.js');
const MARQUE = dossiersDeMarque()[0];
const BON = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: var(--v-ds-label-gap);\n}\n</style>\n';
const EN_DUR = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: 12px;\n}\n</style>\n';
const OPTIONS = ['--marques', 'tokens', '--style', 'src/**/*.vue'];
const ANCIEN_BLOC =
  "## Carnet\n\nChaque question que tu poses à l'humain, ou que tu ne peux pas lui poser, s'écrit dans `carnet.md` : une ligne du tableau, avec l'heure, la question, la réponse reçue ou ce que tu as choisi faute de réponse, et le fichier concerné. Puis continue.\n";
const CARNET_BLOC =
  "## Carnet\n\nChaque fois que tu dois choisir quelque chose que la demande ne dit pas, écris-le au carnet avant de l'appliquer, par cette commande, qui date la ligne :\n\n`node \"$DS_LAB/src/cli/carnet.js\" --question \"…\" --choix \"…\" --fichier <fichier>`\n\n`--question` dit ce qui n'était pas dit, `--choix` ce que tu as décidé ; si tu l'as demandé à l'humain et qu'il a répondu, `--reponse` à la place de `--choix`. N'écris pas `carnet.md` toi-même.\n";
const CARNET = '# Carnet des questions\n\n| Heure | Question | Réponse reçue, ou choix faute de réponse | Fichier |\n|---|---|---|---|\n';
const COMMANDE =
  'if [ -z "$DS_LAB" ]; then echo "relecteur : DS_LAB n\'est pas posée : la poser sur le chemin du clone de ds-lab (env de .claude/settings.local.json, ou le shell)" >&2; exit 2; fi; node "$DS_LAB/src/cli/relecteur.js" --marques tokens --style "src/**/*.vue"';
const HOOKS = {
  SessionStart: [{ hooks: [{ type: 'command', command: COMMANDE }] }],
  PostToolUse: [{ matcher: 'Edit|Write|NotebookEdit|Bash|PowerShell', hooks: [{ type: 'command', command: COMMANDE }] }],
  Stop: [{ hooks: [{ type: 'command', command: COMMANDE }] }],
};
const STYLE_EN_DUR = (/** @type {string} */ f) =>
  `✗ style · ${f} : ligne 4 : Valeur brute « 12px » pour padding (declaration-property-value-allowed-list).\n  À faire : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).\n`;

/** Un dépôt fictif : une marque copiée, un composant propre, une page en faute ; et un dossier temporaire à lui. */
function depot() {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-relecteur-'));
  const cible = join(racine, 'tokens', basename(MARQUE));
  mkdirSync(cible, { recursive: true });
  for (const f of readdirSync(MARQUE).filter((x) => x.endsWith('.json'))) copyFileSync(join(MARQUE, f), join(cible, f));
  mkdirSync(join(racine, 'src', 'components'), { recursive: true });
  mkdirSync(join(racine, 'src', 'pages'), { recursive: true });
  writeFileSync(join(racine, 'src', 'components', 'Bon.vue'), BON);
  writeFileSync(join(racine, 'src', 'pages', 'Ancienne.vue'), EN_DUR);
  writeFileSync(join(racine, 'README.md'), 'app\n');
  mkdirSync(join(racine, '.tmp'));
  return racine;
}
/**
 * Un hook, appelé comme par Claude Code ; la mémoire dans <racine>/.tmp, par TMPDIR ; la racine du projet par
 * CLAUDE_PROJECT_DIR ; le dossier courant de l'agent, cwd.
 * @param {string} racine @param {Record<string, unknown>} entree @param {string} [session] @param {string} [cwd]
 */
const hook = (racine, entree, session = 's1', cwd = racine) =>
  spawnSync(process.execPath, [CLI, ...OPTIONS], {
    cwd,
    env: { ...process.env, TMPDIR: join(racine, '.tmp'), CLAUDE_PROJECT_DIR: racine },
    input: JSON.stringify({ session_id: session, cwd, ...entree }),
    encoding: 'utf8',
  });
/**
 * Un hook lancé sans attendre sa fin ; entrée null : l'entrée reste ouverte, muette. Tué au bout de 10 s.
 * @param {string} racine @param {Record<string, unknown> | null} entree
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, ms: number }>}
 */
const hookEnFond = (racine, entree) =>
  new Promise((ok) => {
    const debut = Date.now();
    const p = spawn(process.execPath, [CLI, ...OPTIONS], { cwd: racine, env: { ...process.env, TMPDIR: join(racine, '.tmp'), CLAUDE_PROJECT_DIR: racine } });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    const tuer = setTimeout(() => p.kill(), 10_000);
    p.on('close', (code) => {
      clearTimeout(tuer);
      p.stdin.destroy();
      ok({ code, stdout, stderr, ms: Date.now() - debut });
    });
    p.stdin.on('error', () => {});
    if (entree) p.stdin.end(JSON.stringify({ session_id: 's1', cwd: racine, ...entree }));
  });
/** Les lignes du journal du relecteur d'une session. @param {string} racine @param {string} [session] */
const journalDe = (racine, session = 's1') =>
  readFileSync(join(racine, '.tmp', 'ds-lab-relecteur', session, 'journal.jsonl'), 'utf8').trimEnd().split('\n').map((l) => JSON.parse(l));
const depart = (/** @type {string} */ racine, session = 's1') => hook(racine, { hook_event_name: 'SessionStart', source: 'startup' }, session);
const apres = (/** @type {string} */ racine, outil = 'Bash', session = 's1') => hook(racine, { hook_event_name: 'PostToolUse', tool_name: outil, tool_input: { command: 'ls' } }, session);
const fin = (/** @type {string} */ racine, relance = false) => hook(racine, { hook_event_name: 'Stop', stop_hook_active: relance });
/** Une écriture par le shell, comme les IA neuves la font. @param {string} racine @param {string} fichier @param {string} texte */
const parLeShell = (racine, fichier, texte) => assert.equal(spawnSync('sh', ['-c', `cat > ${fichier} <<'FIN'\n${texte}FIN\n`], { cwd: racine }).status, 0);
const rien = (/** @type {import('node:child_process').SpawnSyncReturns<string>} */ s) => assert.deepEqual([s.status, s.stdout, s.stderr], [0, '', '']);

test('RL1 une marque cassée par le shell : code 2, ses blocs sur la sortie d’erreur', () => {
  const racine = depot();
  rien(depart(racine));
  const nom = basename(MARQUE);
  const resolver = join(racine, 'tokens', nom, RESOLVER);
  const r = JSON.parse(readFileSync(resolver, 'utf8'));
  r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } });
  writeFileSync(resolver, JSON.stringify(r, null, 2));
  const s = apres(racine);
  assert.equal(s.status, 2);
  assert.equal(s.stdout, '');
  const l = s.stderr.trimEnd().split('\n');
  assert.equal(l[0], `relecteur : tokens/${nom}/${RESOLVER}`);
  assert.ok(l[1].startsWith('✗ contraste · ') && l[1].includes('sombre, large ; sombre, étroit'), l[1]);
  assert.ok(l.length >= 3 && l.slice(1).every((x, i) => (i % 2 ? x.startsWith('  À faire : ') : x.startsWith('✗ '))), s.stderr);
  rmSync(racine, { recursive: true, force: true });
});

test('RL2 un .vue neuf et propre : rien ; un autre fichier : rien ; une valeur en dur : son bloc', () => {
  const racine = depot();
  rien(depart(racine));
  writeFileSync(join(racine, 'src', 'components', 'Neuf.vue'), BON);
  rien(apres(racine, 'Write'));
  writeFileSync(join(racine, 'README.md'), 'app, changée\n');
  rien(apres(racine, 'Edit'));
  writeFileSync(join(racine, 'src', 'components', 'Bon.vue'), EN_DUR);
  const dur = apres(racine, 'Edit');
  assert.equal(dur.status, 2);
  assert.equal(dur.stderr, `relecteur : src/components/Bon.vue\n${STYLE_EN_DUR('src/components/Bon.vue')}`);
  rmSync(racine, { recursive: true, force: true });
});

test('RL3 --poser fusionne, garde, ajoute ; relancé, ne change rien ; sur une pose d’avant, remplace', () => {
  const racine = depot();
  mkdirSync(join(racine, '.claude'));
  const autre = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo autre' }] };
  writeFileSync(join(racine, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { PostToolUse: [autre] } }));
  writeFileSync(join(racine, 'CLAUDE.md'), '# App\n\nRègles de l’équipe.\n');
  const poser = () => spawnSync(process.execPath, [CLI, '--poser', ...OPTIONS], { cwd: racine, encoding: 'utf8' });
  const p = poser();
  assert.equal(p.status, 0);
  assert.equal(p.stdout, 'relecteur : posé dans .claude/settings.json (hooks SessionStart, PostToolUse sur Edit, Write, NotebookEdit, Bash, PowerShell, Stop) ; carnet dans CLAUDE.md et carnet.md\n');
  const reglages = JSON.parse(readFileSync(join(racine, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(reglages, { permissions: { allow: ['Bash(npm test)'] }, hooks: { ...HOOKS, PostToolUse: [autre, ...HOOKS.PostToolUse] } });
  assert.equal(readFileSync(join(racine, 'CLAUDE.md'), 'utf8'), `# App\n\nRègles de l’équipe.\n\n${CARNET_BLOC}`);
  assert.equal(readFileSync(join(racine, 'carnet.md'), 'utf8'), CARNET);
  const avant = ['.claude/settings.json', 'CLAUDE.md', 'carnet.md'].map((f) => readFileSync(join(racine, f), 'utf8'));
  assert.equal(poser().status, 0);
  assert.deepEqual(['.claude/settings.json', 'CLAUDE.md', 'carnet.md'].map((f) => readFileSync(join(racine, f), 'utf8')), avant);

  // Une pose d'avant : le hook sur Edit et Write, l'ancien bloc suivi d'une autre section, un carnet rempli.
  const ancienHook = { matcher: 'Edit|Write', hooks: [{ type: 'command', command: COMMANDE }] };
  writeFileSync(join(racine, '.claude', 'settings.json'), JSON.stringify({ hooks: { PostToolUse: [autre, ancienHook] } }));
  writeFileSync(join(racine, 'CLAUDE.md'), `# App\n\n${ANCIEN_BLOC}\n## Ensuite\n\nGardé.\n`);
  const rempli = `${CARNET}| 14:00 | q | c | f |\n`;
  writeFileSync(join(racine, 'carnet.md'), rempli);
  assert.equal(poser().status, 0);
  assert.deepEqual(JSON.parse(readFileSync(join(racine, '.claude', 'settings.json'), 'utf8')), { hooks: { ...HOOKS, PostToolUse: [autre, ...HOOKS.PostToolUse] } });
  assert.equal(readFileSync(join(racine, 'CLAUDE.md'), 'utf8'), `# App\n\n${CARNET_BLOC}\n## Ensuite\n\nGardé.\n`);
  assert.equal(readFileSync(join(racine, 'carnet.md'), 'utf8'), rempli);
  rmSync(racine, { recursive: true, force: true });
});

test('RL4 sans DS_LAB, ou une entrée qui n’est pas du JSON : code 2 et quoi faire', () => {
  const racine = depot();
  const env = { ...process.env };
  delete env.DS_LAB;
  const sans = spawnSync('sh', ['-c', COMMANDE], { cwd: racine, env, input: '{}', encoding: 'utf8' });
  assert.equal(sans.status, 2);
  assert.equal(sans.stderr, "relecteur : DS_LAB n'est pas posée : la poser sur le chemin du clone de ds-lab (env de .claude/settings.local.json, ou le shell)\n");
  const avec = spawnSync('sh', ['-c', COMMANDE], { cwd: racine, env: { ...env, DS_LAB: ROOT }, input: 'pas du json', encoding: 'utf8' });
  assert.equal(avec.status, 2);
  assert.match(avec.stderr, /^relecteur : entrée de hook attendue sur l'entrée standard \(Claude Code, SessionStart, PostToolUse ou Stop, JSON\) ; pour poser les hooks : --poser ; usage : /);
  rmSync(racine, { recursive: true, force: true });
});

test('RL5 une page en faute et intouchée : le relecteur n’en dit rien', () => {
  const racine = depot();
  rien(depart(racine));
  writeFileSync(join(racine, 'src', 'components', 'Bon.vue'), `${BON}\n`);
  rien(apres(racine, 'Write'));
  rien(fin(racine));
  writeFileSync(join(racine, 'src', 'pages', 'Ancienne.vue'), `${EN_DUR}\n`);
  const page = apres(racine, 'Write');
  assert.equal(page.status, 2, 'la page, si on l’écrit, est relue');
  assert.equal(page.stderr, `relecteur : src/pages/Ancienne.vue\n${STYLE_EN_DUR('src/pages/Ancienne.vue')}`);
  rmSync(racine, { recursive: true, force: true });
});

test('RL6 une écriture par le shell : l’appel Bash qui suit rend le bloc, le suivant rien', () => {
  const racine = depot();
  rien(depart(racine));
  parLeShell(racine, 'src/components/Shell.vue', EN_DUR);
  const s = apres(racine, 'Bash');
  assert.equal(s.status, 2);
  assert.equal(s.stdout, '');
  assert.equal(s.stderr, `relecteur : src/components/Shell.vue\n${STYLE_EN_DUR('src/components/Shell.vue')}`);
  rien(apres(racine, 'Bash'));
  parLeShell(racine, 'src/components/Shell.vue', BON);
  rien(apres(racine, 'PowerShell'));
  rmSync(racine, { recursive: true, force: true });
});

test('RL7 la fin du tour : refusée sur un échec, laissée à la relance, rien une fois corrigé', () => {
  const racine = depot();
  rien(depart(racine));
  rien(fin(racine));
  parLeShell(racine, 'src/components/Shell.vue', EN_DUR);
  assert.equal(apres(racine).status, 2);
  const refus = fin(racine);
  assert.equal(refus.status, 2);
  assert.equal(refus.stdout, '');
  assert.equal(refus.stderr, `relecteur : fin du tour, changés depuis le départ de la session : src/components/Shell.vue\n${STYLE_EN_DUR('src/components/Shell.vue')}Corrige ces échecs, puis finis.\n`);
  const relance = fin(racine, true);
  assert.equal(relance.status, 0);
  assert.equal(relance.stderr, '');
  assert.deepEqual(JSON.parse(relance.stdout), { systemMessage: `relecteur : fin du tour, 1 échec(s) restent dans src/components/Shell.vue\n${STYLE_EN_DUR('src/components/Shell.vue').trimEnd()}` });
  parLeShell(racine, 'src/components/Shell.vue', BON);
  rien(fin(racine));
  rmSync(racine, { recursive: true, force: true });
});

test('RL8 la mémoire hors du dépôt, une par session, un journal ; sans empreintes, le fichier de l’outil seul', () => {
  const racine = depot();
  writeFileSync(join(racine, '.gitignore'), '.tmp/\n');
  for (const a of [['init', '-q'], ['add', '-A'], ['-c', 'user.name=t', '-c', 'user.email=t@exemple.invalid', 'commit', '-q', '-m', 'départ']]) spawnSync('git', a, { cwd: racine });
  rien(depart(racine, 'a'));
  rien(depart(racine, 'b'));
  parLeShell(racine, 'src/components/Shell.vue', EN_DUR);
  assert.equal(apres(racine, 'Bash', 'a').status, 2);
  assert.equal(apres(racine, 'Bash', 'b').status, 2, 'chaque session a ses empreintes');
  rien(apres(racine, 'Bash', 'a'));
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: racine, encoding: 'utf8' }).stdout, '?? src/components/Shell.vue\n');
  const memoire = join(racine, '.tmp', 'ds-lab-relecteur', 'a');
  assert.deepEqual(readdirSync(memoire).sort(), ['depart.json', 'dernier.json', 'journal.jsonl']);
  const journal = readFileSync(join(memoire, 'journal.jsonl'), 'utf8').trimEnd().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(
    journal.map(({ evenement, outil, relus, echecs, code }) => ({ evenement, outil, relus, echecs, code })),
    [
      { evenement: 'SessionStart', outil: null, relus: [], echecs: 0, code: 0 },
      { evenement: 'PostToolUse', outil: 'Bash', relus: ['src/components/Shell.vue'], echecs: 1, code: 2 },
      { evenement: 'PostToolUse', outil: 'Bash', relus: [], echecs: 0, code: 0 },
    ],
  );
  assert.ok(journal.every((l) => /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(l.heure)));

  // Sans SessionStart : le premier appel ne connaît que le fichier nommé par l'outil.
  writeFileSync(join(racine, 'src', 'pages', 'Ancienne.vue'), `${EN_DUR}\n`);
  const nomme = hook(racine, { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: join(racine, 'src', 'components', 'Bon.vue') } }, 'c');
  rien(nomme);
  const ecrit = hook(racine, { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: join(racine, 'src', 'pages', 'Ancienne.vue') } }, 'd');
  assert.equal(ecrit.status, 2);
  assert.equal(ecrit.stderr, `relecteur : src/pages/Ancienne.vue\n${STYLE_EN_DUR('src/pages/Ancienne.vue')}`);
  rmSync(racine, { recursive: true, force: true });
});

test('CN1 le carnet : une ligne datée par la commande, cellules échappées, une panne qui dit quoi faire', () => {
  const racine = depot();
  writeFileSync(join(racine, 'carnet.md'), CARNET);
  const carnet = (/** @type {string[]} */ args, cwd = racine) => spawnSync(process.execPath, [CARNET_CLI, ...args], { cwd, encoding: 'utf8', env: { ...process.env, TZ: 'Europe/Paris' } });
  const avant = Date.now();
  const s = carnet(['--question', 'Lien ou bouton ?', '--choix', 'un lien | à l’aspect\nde bouton', '--fichier', 'src/pages/Annuaire.vue'], join(racine, 'src', 'pages'));
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout, `carnet : ligne ajoutée à ${join(realpathSync(racine), 'carnet.md')}\n`);
  assert.equal(carnet(['--question', 'Combien par page ?', '--reponse', 'dix']).status, 0);
  const lignes = readFileSync(join(racine, 'carnet.md'), 'utf8').split('\n');
  assert.equal(lignes.length, 7);
  const m = lignes[4].match(/^\| (\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)\+0[12]:00 \| Lien ou bouton \? \| choix : un lien \\\| à l’aspect de bouton \| src\/pages\/Annuaire\.vue \|$/);
  assert.ok(m, lignes[4]);
  assert.ok(Math.abs(Date.parse(lignes[4].split(' | ')[0].slice(2)) - avant) < 60_000, 'l’heure est celle de la machine');
  assert.match(lignes[5], /^\| \S+ \| Combien par page \? \| réponse : dix \| — \|$/);
  for (const [args, motif] of /** @type {[string[], RegExp][]} */ ([
    [['--choix', 'x'], /^carnet : --question "…" attendu/],
    [['--question', 'q'], /^carnet : --choix "…" attendu/],
    [['--question', 'q', '--choix', 'x', '--reponse', 'y'], /^carnet : --choix ou --reponse, pas les deux/],
  ])) {
    const e = carnet(args);
    assert.equal(e.status, 2);
    assert.match(e.stderr, motif);
  }
  const ailleurs = mkdtempSync(join(tmpdir(), 'ds-lab-sans-carnet-'));
  const absent = carnet(['--question', 'q', '--choix', 'x'], ailleurs);
  assert.equal(absent.status, 2);
  assert.match(absent.stderr, /^carnet : carnet\.md introuvable dans .* ni ses parents : lancer depuis le dépôt de l'équipe, ou poser le carnet/);
  assert.equal(readFileSync(join(racine, 'carnet.md'), 'utf8').split('\n').length, 7, 'une panne n’écrit rien');
  rmSync(ailleurs, { recursive: true, force: true });
  rmSync(racine, { recursive: true, force: true });
});

test('RL9 deux appels lancés ensemble : ni panne, ni relecture perdue', async () => {
  const racine = depot();
  rien(depart(racine));
  for (let i = 0; i < 5; i++) {
    const px = `${12 + i}px`;
    parLeShell(racine, 'src/components/Shell.vue', EN_DUR.replace('12px', px));
    const bloc = `relecteur : src/components/Shell.vue\n${STYLE_EN_DUR('src/components/Shell.vue').replace('12px', px)}`;
    const entree = { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'cat > …' } };
    const deux = await Promise.all([hookEnFond(racine, entree), hookEnFond(racine, entree)]);
    for (const x of deux) assert.ok((x.code === 0 && x.stderr === '') || (x.code === 2 && x.stderr === bloc), `tour ${i} : ${JSON.stringify(x)}`);
    assert.ok(deux.some((x) => x.code === 2), `tour ${i} : la relecture est perdue`);
  }
  const journal = journalDe(racine);
  assert.equal(journal.length, 11);
  assert.ok(journal.every((l) => !('panne' in l)), JSON.stringify(journal));
  rmSync(racine, { recursive: true, force: true });
});

test('RL10 sans entrée : sortie 2 tout de suite, et la commande à lancer à la main', async () => {
  const racine = depot();
  const message =
    'relecteur : aucune entrée : il est lancé par les hooks de Claude Code (SessionStart, PostToolUse, Stop) ; à la main, lancer verifier : node "$DS_LAB/src/cli/verifier.js" --marques tokens --style "src/**/*.vue"\n';
  const vide = spawnSync(process.execPath, [CLI, ...OPTIONS], { cwd: racine, env: { ...process.env, TMPDIR: join(racine, '.tmp') }, input: '', encoding: 'utf8' });
  assert.deepEqual([vide.status, vide.stdout, vide.stderr], [2, '', message]);
  const muette = await hookEnFond(racine, null);
  assert.deepEqual([muette.code, muette.stdout, muette.stderr], [2, '', message]);
  assert.ok(muette.ms < 5_000, `${muette.ms} ms`);
  assert.equal(existsSync(join(racine, '.tmp', 'ds-lab-relecteur')), false, 'sans entrée, pas de session ni de journal');
  rmSync(racine, { recursive: true, force: true });
});

test('RL11 le périmètre se compte depuis la racine du projet, pas depuis le cd de l’agent', () => {
  const racine = depot();
  const sous = join(racine, 'src', 'components');
  const ici = (/** @type {string} */ cwd) => hook(racine, { hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } }, 's1', cwd);
  rien(depart(racine));
  rien(ici(sous));
  parLeShell(racine, 'src/components/Shell.vue', EN_DUR);
  const s = ici(sous);
  assert.equal(s.status, 2);
  assert.equal(s.stderr, `relecteur : src/components/Shell.vue\n${STYLE_EN_DUR('src/components/Shell.vue')}`);
  rien(ici(racine));
  assert.deepEqual(journalDe(racine).map((l) => l.relus), [[], [], ['src/components/Shell.vue'], []]);
  rmSync(racine, { recursive: true, force: true });
});

test('RL12 une panne s’écrit au journal avant la sortie', () => {
  const racine = depot();
  rien(depart(racine));
  writeFileSync(join(racine, '.tmp', 'ds-lab-relecteur', 's1', 'dernier.json'), '{');
  const s = apres(racine);
  assert.equal(s.status, 2);
  assert.equal(s.stdout, '');
  assert.match(s.stderr, /^relecteur : [^\n]*JSON[^\n]*\n$/);
  const derniere = /** @type {Record<string, unknown>} */ (journalDe(racine).at(-1));
  assert.deepEqual([derniere.evenement, derniere.outil, derniere.code, `relecteur : ${derniere.panne}\n`], ['PostToolUse', 'Bash', 2, s.stderr]);
  rmSync(racine, { recursive: true, force: true });
});

test('BN2 un passage du bras B : hooks, bloc du carnet et carnet.md dans « départ »', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'banc.js'), '--exercice', 'composer', '--dossier', racine, '--modele', 'essai', '--sans-installation', '--bras', 'B', '--passage', '1'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const app = join(racine, 'composer', 'B-1', 'app');
  assert.deepEqual(JSON.parse(readFileSync(join(app, '.claude', 'settings.json'), 'utf8')), { hooks: HOOKS });
  assert.equal(readFileSync(join(app, 'CLAUDE.md'), 'utf8'), CARNET_BLOC);
  assert.equal(readFileSync(join(app, 'carnet.md'), 'utf8'), CARNET);
  const suivis = spawnSync('git', ['ls-files'], { cwd: app, encoding: 'utf8' }).stdout.split('\n');
  for (const f of ['.claude/settings.json', 'CLAUDE.md', 'carnet.md']) assert.ok(suivis.includes(f), f);
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: app, encoding: 'utf8' }).stdout, '');
  assert.equal(existsSync(join(app, '.claude', 'settings.local.json')), true);
  rmSync(racine, { recursive: true, force: true });
});
