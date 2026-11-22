// @ts-check
/**
 * Le relecteur (D67, docs/attendus/etape-10-banc.md) : le hook PostToolUse qui relit le seul fichier écrit. Attendus
 * écrits à la main avant le code ; chaque cas joue dans un dépôt fictif hors de ds-lab, avec des copies des marques :
 *   RL1 un fichier d'une marque cassée en sombre : code 2, « relecteur : <fichier> » puis ses blocs sur la sortie
 *       d'erreur, un « À faire » par bloc ; rien sur la sortie standard ;
 *   RL2 un .vue propre : code 0, une ligne de contexte (additionalContext) ; un fichier ni de marque ni de style : code 0,
 *       rien ; une valeur en dur dans le .vue écrit : code 2 et son bloc de style ;
 *   RL3 --poser fusionne le hook avec un settings.json qui existe, garde un CLAUDE.md et y ajoute le bloc du carnet,
 *       pose carnet.md ; relancé, il ne change aucun octet ;
 *   RL4 la commande du hook sans DS_LAB : code 2 et ce qu'il faut poser ; une entrée qui n'est pas du JSON : code 2 ;
 *   RL5 une page en faute, intouchée, et un autre fichier propre écrit : le relecteur ne dit rien de la page.
 * Et BN2 : un passage du bras B posé par le banc porte le hook, le bloc du carnet et carnet.md, dans le commit « départ ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, RESOLVER } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'relecteur.js');
const MARQUE = dossiersDeMarque()[0];
const BON = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: var(--v-ds-label-gap);\n}\n</style>\n';
const EN_DUR = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: 12px;\n}\n</style>\n';
const OPTIONS = ['--marques', 'tokens', '--style', 'src/**/*.vue'];
const CARNET_BLOC =
  "## Carnet\n\nChaque question que tu poses à l'humain, ou que tu ne peux pas lui poser, s'écrit dans `carnet.md` : une ligne du tableau, avec l'heure, la question, la réponse reçue ou ce que tu as choisi faute de réponse, et le fichier concerné. Puis continue.\n";
const CARNET = '# Carnet des questions\n\n| Heure | Question | Réponse reçue, ou choix faute de réponse | Fichier |\n|---|---|---|---|\n';
const COMMANDE =
  'if [ -z "$DS_LAB" ]; then echo "relecteur : DS_LAB n\'est pas posée : la poser sur le chemin du clone de ds-lab (env de .claude/settings.local.json, ou le shell)" >&2; exit 2; fi; node "$DS_LAB/src/cli/relecteur.js" --marques tokens --style "src/**/*.vue"';

/** Un dépôt fictif : une marque copiée, un composant propre, une page en faute. */
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
  return racine;
}
/** Le hook, appelé comme par Claude Code après l'écriture de `fichier`. @param {string} racine @param {string} fichier */
const relire = (racine, fichier) =>
  spawnSync(process.execPath, [CLI, ...OPTIONS], {
    cwd: racine,
    input: JSON.stringify({ hook_event_name: 'PostToolUse', cwd: racine, tool_name: 'Write', tool_input: { file_path: join(racine, fichier), content: '' } }),
    encoding: 'utf8',
  });
const contexte = (/** @type {string} */ f) => `${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `relecteur : ${f}, 0 échec` } })}\n`;

test('RL1 un fichier d’une marque cassée : code 2, ses blocs sur la sortie d’erreur', () => {
  const racine = depot();
  const nom = basename(MARQUE);
  const resolver = join(racine, 'tokens', nom, RESOLVER);
  const r = JSON.parse(readFileSync(resolver, 'utf8'));
  r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } });
  writeFileSync(resolver, JSON.stringify(r, null, 2));
  const s = relire(racine, `tokens/${nom}/${RESOLVER}`);
  assert.equal(s.status, 2);
  assert.equal(s.stdout, '');
  const l = s.stderr.trimEnd().split('\n');
  assert.equal(l[0], `relecteur : tokens/${nom}/${RESOLVER}`);
  assert.ok(l[1].startsWith('✗ contraste · ') && l[1].includes('sombre, large ; sombre, étroit'), l[1]);
  assert.ok(l.length >= 3 && l.slice(1).every((x, i) => (i % 2 ? x.startsWith('  À faire : ') : x.startsWith('✗ '))), s.stderr);
  rmSync(racine, { recursive: true, force: true });
});

test('RL2 un .vue propre : une ligne de contexte ; un autre fichier : rien ; une valeur en dur : son bloc', () => {
  const racine = depot();
  const bon = relire(racine, 'src/components/Bon.vue');
  assert.equal(bon.status, 0, bon.stderr);
  assert.equal(bon.stdout, contexte('src/components/Bon.vue'));
  const autre = relire(racine, 'README.md');
  assert.deepEqual([autre.status, autre.stdout, autre.stderr], [0, '', '']);
  writeFileSync(join(racine, 'src', 'components', 'Bon.vue'), EN_DUR);
  const dur = relire(racine, 'src/components/Bon.vue');
  assert.equal(dur.status, 2);
  assert.equal(
    dur.stderr,
    'relecteur : src/components/Bon.vue\n✗ style · src/components/Bon.vue : ligne 4 : Valeur brute « 12px » pour padding (declaration-property-value-allowed-list).\n  À faire : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).\n',
  );
  rmSync(racine, { recursive: true, force: true });
});

test('RL3 --poser fusionne, garde, ajoute ; relancé, ne change rien', () => {
  const racine = depot();
  mkdirSync(join(racine, '.claude'));
  const autre = { matcher: 'Bash', hooks: [{ type: 'command', command: 'echo autre' }] };
  writeFileSync(join(racine, '.claude', 'settings.json'), JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { PostToolUse: [autre] } }));
  writeFileSync(join(racine, 'CLAUDE.md'), '# App\n\nRègles de l’équipe.\n');
  const poser = () => spawnSync(process.execPath, [CLI, '--poser', ...OPTIONS], { cwd: racine, encoding: 'utf8' });
  assert.equal(poser().status, 0);
  const reglages = JSON.parse(readFileSync(join(racine, '.claude', 'settings.json'), 'utf8'));
  assert.deepEqual(reglages, {
    permissions: { allow: ['Bash(npm test)'] },
    hooks: { PostToolUse: [autre, { matcher: 'Edit|Write', hooks: [{ type: 'command', command: COMMANDE }] }] },
  });
  assert.equal(readFileSync(join(racine, 'CLAUDE.md'), 'utf8'), `# App\n\nRègles de l’équipe.\n\n${CARNET_BLOC}`);
  assert.equal(readFileSync(join(racine, 'carnet.md'), 'utf8'), CARNET);
  const avant = ['.claude/settings.json', 'CLAUDE.md', 'carnet.md'].map((f) => readFileSync(join(racine, f), 'utf8'));
  assert.equal(poser().status, 0);
  assert.deepEqual(['.claude/settings.json', 'CLAUDE.md', 'carnet.md'].map((f) => readFileSync(join(racine, f), 'utf8')), avant);
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
  assert.match(avec.stderr, /^relecteur : entrée de hook attendue sur l'entrée standard \(Claude Code, PostToolUse, JSON\) ; pour poser le hook : --poser ; usage : /);
  rmSync(racine, { recursive: true, force: true });
});

test('RL5 une page en faute et intouchée : le relecteur n’en dit rien', () => {
  const racine = depot();
  const s = relire(racine, 'src/components/Bon.vue');
  assert.equal(s.status, 0, s.stderr);
  assert.equal(s.stdout, contexte('src/components/Bon.vue'));
  assert.ok(!`${s.stdout}${s.stderr}`.includes('Ancienne'), 'la page intouchée');
  const page = relire(racine, 'src/pages/Ancienne.vue');
  assert.equal(page.status, 2, 'la page, si on l’écrit, est relue');
  rmSync(racine, { recursive: true, force: true });
});

test('BN2 un passage du bras B : hook, bloc du carnet et carnet.md dans « départ »', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-banc-'));
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'banc.js'), '--exercice', 'composer', '--dossier', racine, '--modele', 'essai', '--sans-installation', '--bras', 'B', '--passage', '1'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const app = join(racine, 'composer', 'B-1', 'app');
  assert.deepEqual(JSON.parse(readFileSync(join(app, '.claude', 'settings.json'), 'utf8')), { hooks: { PostToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: COMMANDE }] }] } });
  assert.equal(readFileSync(join(app, 'CLAUDE.md'), 'utf8'), CARNET_BLOC);
  assert.equal(readFileSync(join(app, 'carnet.md'), 'utf8'), CARNET);
  const suivis = spawnSync('git', ['ls-files'], { cwd: app, encoding: 'utf8' }).stdout.split('\n');
  for (const f of ['.claude/settings.json', 'CLAUDE.md', 'carnet.md']) assert.ok(suivis.includes(f), f);
  assert.equal(spawnSync('git', ['status', '--porcelain'], { cwd: app, encoding: 'utf8' }).stdout, '');
  assert.equal(existsSync(join(app, '.claude', 'settings.local.json')), true);
  rmSync(racine, { recursive: true, force: true });
});
