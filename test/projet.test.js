// @ts-check
/**
 * Le dossier de projet (D102) : neutre, posé depuis fixtures/projet/, branché sur le clone comme le dossier de jeu.
 *
 *   PJ1 posé : le guide du dossier et la cible générique ; ni site, ni sources ; le skill en lien, DS_LAB, le Node du
 *       clone et le crochet de la description dans les réglages ; la commande sort en 0
 *   PJ2 les deux sortes ne se mêlent pas : la commande du jeu refuse un dossier de projet, et l'inverse ; rien n'est effacé
 *   PJ3 la cible générique n'a aucune couleur de marque ; prise dans une marque saisie (--brand-colors), elle garde ses
 *       dimensions, prend les échelles de la marque et ne porte aucune marque à résoudre : la réduction ne s'arrête pas
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, lstatSync, mkdtempSync, readFileSync, readlinkSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARQUE_JEU, MARQUE_PROJET, poserJeu, poserProjet } from '../src/parcours/jeu.js';
import { cibleDeLaMarque } from '../src/tokens/cible.js';
import { jetonsDe } from '../src/tokens/resolver.js';
import { lireJson } from '../src/lib/fichiers.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const vide = () => join(realpathSync(mkdtempSync(join(tmpdir(), 'ds-lab-projet-'))), 'projet');

test('PJ1 posé : guide, cible générique, ni site ni sources, skill en lien, réglages ; sortie 0', () => {
  const d = vide();
  const r = spawnSync(process.execPath, [join(ROOT, 'src/cli/projet.js'), d], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Dossier de projet posé : /);
  for (const f of ['CLAUDE.md', 'cible.json', MARQUE_PROJET]) assert.ok(existsSync(join(d, f)), f);
  for (const f of ['site.mjs', 'sources.json', MARQUE_JEU, 'marques']) assert.ok(!existsSync(join(d, f)), f);
  assert.equal(readFileSync(join(d, 'cible.json'), 'utf8'), readFileSync(join(ROOT, 'fixtures/projet/cible.json'), 'utf8'));
  const skill = join(d, '.claude/skills/ds-lab');
  assert.ok(lstatSync(skill).isSymbolicLink());
  assert.equal(readlinkSync(skill), join(ROOT, 'skill/ds-lab').replace(/\/$/, ''));
  const reglages = JSON.parse(readFileSync(join(d, '.claude/settings.local.json'), 'utf8'));
  assert.equal(reglages.env.DS_LAB, ROOT.replace(/\/$/, ''));
  assert.equal(reglages.env.PATH.split(':')[0], dirname(process.execPath));
  assert.equal(reglages.hooks.PreToolUse[0].matcher, 'Bash');
  const guide = readFileSync(join(d, 'CLAUDE.md'), 'utf8');
  for (const s of ['## Repartir de zéro', '## Les tâches', '## Regarder le site', 'src/cli/projet.js']) assert.ok(guide.includes(s), s);
  assert.equal(poserProjet(d, { depot: ROOT }).remis, true);
});

test('PJ2 un dossier de jeu et un dossier de projet ne se remettent pas l’un par l’autre', () => {
  const p = vide();
  poserProjet(p, { depot: ROOT });
  assert.throws(() => poserJeu(p, { depot: ROOT }), /n'est pas vide et n'est pas un dossier de jeu : rien n'est effacé/);
  assert.ok(existsSync(join(p, MARQUE_PROJET)));
  const j = vide();
  poserJeu(j, { depot: ROOT });
  assert.throws(() => poserProjet(j, { depot: ROOT }), /n'est pas vide et n'est pas un dossier de projet : rien n'est effacé/);
  assert.ok(existsSync(join(j, 'site.mjs')));
  assert.throws(() => poserProjet(join(ROOT, 'local', 'projet'), { depot: ROOT }), /le dossier de projet ne peut pas être dans le clone/);
});

test('PJ3 la cible générique : aucune couleur de marque ; prise dans une marque, ses dimensions gardées, rien à résoudre', () => {
  const cible = lireJson(join(ROOT, 'fixtures/projet/cible.json'));
  assert.equal(cible.brand, undefined);
  assert.deepEqual([...new Set(cible.colors.map((/** @type {{ name: string }} */ c) => c.name.replace(/-\d+$/, '')))], ['blanc', 'neutre', 'erreur', 'succes']);
  const fResolver = join(ROOT, 'tokens/orbe-cafe/marque.resolver.json');
  const prise = cibleDeLaMarque(cible, jetonsDe(lireJson(fResolver), fResolver), { marque: 'essai' });
  for (const k of ['radii', 'spacing', 'fontSizes']) assert.deepEqual(prise[k], cible[k], k);
  assert.ok(prise.brandScales.length, 'les échelles de la marque');
  // La réduction ne résout la marque de la cible (et ne s'arrête sur une couleur illisible) que si elle en porte une.
  assert.equal(/** @type {any} */ (prise).brand, undefined);
});
