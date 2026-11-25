// @ts-check
/**
 * Le dossier de jeu (D75) : posé depuis fixtures/jeu/, branché sur le clone, remis à son départ sans rien effacer
 * d'autre que lui.
 *
 *   JE1 posé : le guide du dossier, le site, la cible et les sources ; le skill, un lien vers celui du clone ; DS_LAB
 *       et le Node du clone dans les réglages, le crochet de la description (D87) ; aucune entrée de marque
 *   JE2 remis à son départ : le projet et les sorties effacés, les permissions déjà accordées gardées
 *   JE3 refus : un dossier non vide sans la marque d'un dossier de jeu, ou un dossier dans le clone, n'est pas touché ;
 *       la commande sort en 2
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARQUE_JEU, poserJeu } from '../src/parcours/jeu.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const vide = () => join(realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-jeu-'))), 'jeu');

test('JE1 posé : guide, site, cible, sources, skill en lien, réglages, aucune entrée de marque', () => {
  const d = vide();
  assert.deepEqual(poserJeu(d, { depot: ROOT }), { dossier: d, remis: false });
  for (const f of ['CLAUDE.md', 'site.mjs', MARQUE_JEU]) assert.ok(existsSync(join(d, f)), f);
  assert.equal(readFileSync(join(d, 'cible.json'), 'utf8'), readFileSync(join(ROOT, 'fixtures/marque-demo/cible-valise.json'), 'utf8'));
  assert.equal(readFileSync(join(d, 'sources.json'), 'utf8'), readFileSync(join(ROOT, 'fixtures/marque-demo/sources.json'), 'utf8'));
  const skill = join(d, '.claude/skills/ds-lab');
  assert.ok(lstatSync(skill).isSymbolicLink());
  assert.equal(readlinkSync(skill), join(ROOT, 'skill/ds-lab').replace(/\/$/, ''));
  const r = JSON.parse(readFileSync(join(d, '.claude/settings.local.json'), 'utf8'));
  assert.equal(r.env.DS_LAB, ROOT.replace(/\/$/, ''));
  assert.equal(r.env.PATH.split(':')[0], dirname(process.execPath));
  assert.deepEqual(r.permissions.additionalDirectories, [ROOT.replace(/\/$/, '')]);
  // Le crochet de la description (D87) : la commande qu'il lance refuse une description anglaise, en 2, et laisse passer
  // une description française, en 0.
  const crochet = r.hooks.PreToolUse[0];
  assert.equal(crochet.matcher, 'Bash');
  for (const [description, code] of /** @type {const} */ ([['Write the added sheets and read the next step', 2], ['poser les feuilles et lire la suite', 0]])) {
    const x = spawnSync('sh', ['-c', crochet.hooks[0].command], { input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'true', description } }), encoding: 'utf8' });
    assert.equal(x.status, code, description + x.stderr);
    if (code) assert.match(x.stderr, /^Décris cette commande en français/);
  }
  assert.ok(!existsSync(join(d, 'marques')));
  assert.match(readFileSync(join(d, 'CLAUDE.md'), 'utf8'), /## Repartir de zéro/);
});

test('JE2 remis à son départ : projet et sorties effacés, permissions gardées', () => {
  const d = vide();
  poserJeu(d, { depot: ROOT });
  const f = join(d, '.claude/settings.local.json');
  const r = JSON.parse(readFileSync(f, 'utf8'));
  writeFileSync(f, JSON.stringify({ ...r, permissions: { ...r.permissions, allow: ['Bash(node site.mjs)'] } }));
  writeFileSync(join(d, 'projet.json'), '{}');
  mkdirSync(join(d, 'sorties/verify'), { recursive: true });
  assert.equal(poserJeu(d, { depot: ROOT }).remis, true);
  assert.ok(!existsSync(join(d, 'projet.json')));
  assert.ok(!existsSync(join(d, 'sorties')));
  const apres = JSON.parse(readFileSync(f, 'utf8'));
  assert.deepEqual(apres.permissions.allow, ['Bash(node site.mjs)']);
  assert.equal(apres.env.DS_LAB, ROOT.replace(/\/$/, ''));
});

test('JE3 refus : dossier non vide sans marque, ou dans le clone ; sortie 2', () => {
  const d = vide();
  mkdirSync(d);
  writeFileSync(join(d, 'a-garder.txt'), 'x');
  assert.throws(() => poserJeu(d, { depot: ROOT }), /n'est pas vide et n'est pas un dossier de jeu : rien n'est effacé/);
  assert.ok(existsSync(join(d, 'a-garder.txt')));
  assert.throws(() => poserJeu(join(ROOT, 'local', 'jeu'), { depot: ROOT }), /ne peut pas être dans le clone/);
  const r = spawnSync(process.execPath, [join(ROOT, 'src/cli/jeu.js'), d], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /^jeu : /);
});
