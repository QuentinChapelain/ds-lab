// @ts-check
/**
 * Dossier des marques, --marques <dossier> (D66, docs/attendus/etape-9-skill.md). Attendus écrits à la main avant le code :
 *   MQ1 contraste, espacements et typo jugent chaque marque d'un dossier hors du dépôt, l'une bonne et l'autre cassée :
 *       un bloc chacune sous « marque <nom> (<dossier>/) », dans l'ordre des dossiers, sortie 1 ;
 *   MQ2 --marque et --marques ensemble : sortie 2, « l'un ou l'autre » ;
 *   MQ3 dossier sans marque, ou absent : sortie 2, message qui dit quoi faire.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, nomDeMarque, RESOLVER } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CONTROLES = ['contraste', 'espacements', 'typo'];
/** @param {string} cli @param {string[]} args @param {string} cwd */
const run = (cli, args, cwd) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd, encoding: 'utf8' });

/** Un dossier de marques hors du dépôt : une copie de chaque marque donnée, sous le nom de dossier donné. @param {[string, string][]} marques */
function dossierDeMarques(marques) {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-marques-'));
  for (const [source, nom] of marques) {
    mkdirSync(join(racine, 'tokens', nom), { recursive: true });
    for (const f of readdirSync(source).filter((x) => x.endsWith('.json'))) copyFileSync(join(source, f), join(racine, 'tokens', nom, f));
  }
  return racine;
}

test('MQ1 chaque marque du dossier, un bloc chacune, sortie 1 si l’une échoue', () => {
  const [a, b] = dossiersDeMarque();
  const racine = dossierDeMarques([[a, 'a-bonne'], [b, 'b-cassee']]);
  // Cassée pour les trois contrôles : une échelle commune redéfinie (contraste, D25) ; l'écart dans un composant plus
  // grand que l'écart de section (espacements, DS5) ; le corps moyen à interligne 1 (typo, DS18), posés après les rôles.
  const cassee = join(racine, 'tokens', 'b-cassee');
  const r = JSON.parse(readFileSync(join(cassee, RESOLVER), 'utf8'));
  const corps = { fontFamily: '{brand.font.body}', fontSize: '{font-size.16}', fontWeight: '{font-weight.400}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1 };
  r.sets.roles.sources.push({ gap: { 'within-component': { $type: 'dimension', $value: '{space.64}' } }, typography: { body: { medium: { $type: 'typography', $value: corps } } } });
  writeFileSync(join(cassee, RESOLVER), JSON.stringify(r, null, 2));
  writeFileSync(join(cassee, 'primitives.tokens.json'), JSON.stringify({ color: { neutral: { 1: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } } } } }));
  for (const cli of CONTROLES) {
    const s = run(cli, ['--marques', 'tokens'], racine);
    assert.equal(s.status, 1, `${cli} : ${s.stderr}`);
    const entetes = s.stdout.split('\n').filter((l) => l.startsWith('marque '));
    assert.deepEqual(entetes, [`marque ${nomDeMarque(a)} (tokens/a-bonne/)`, `marque ${nomDeMarque(b)} (tokens/b-cassee/)`], cli);
    const blocs = s.stdout.split(/^marque .*$/m).slice(1);
    assert.ok(!blocs[0].includes('✗'), `${cli}, ${basename(a)} : ${blocs[0]}`);
    assert.ok(blocs[1].includes('✗'), `${cli}, la marque cassée échoue`);
    const seule = run(cli, ['--marque', join(racine, 'tokens', 'a-bonne')], racine);
    assert.equal(seule.status, 0, `${cli} : ${seule.stdout}`);
  }
  rmSync(racine, { recursive: true, force: true });
});

test('MQ2 --marque et --marques ensemble : sortie 2', () => {
  const racine = dossierDeMarques([[dossiersDeMarque()[0], 'a']]);
  for (const cli of CONTROLES) {
    const s = run(cli, ['--marques', 'tokens', '--marque', 'tokens/a'], racine);
    assert.equal(s.status, 2, cli);
    assert.equal(s.stderr, `${cli} : l'un ou l'autre : --marque <dossier> pour une marque, --marques <dossier> pour toutes celles d'un dossier\n`);
    assert.equal(s.stdout, '', cli);
  }
  rmSync(racine, { recursive: true, force: true });
});

test('MQ3 dossier sans marque, ou absent : sortie 2 qui dit quoi faire', () => {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-marques-'));
  mkdirSync(join(racine, 'tokens', 'pas-une-marque'), { recursive: true });
  for (const cli of CONTROLES) {
    const vide = run(cli, ['--marques', 'tokens'], racine);
    assert.equal(vide.status, 2, cli);
    assert.equal(vide.stderr, `${cli} : aucune marque dans tokens (un sous-dossier avec marque.resolver.json) : lancer d'abord la saisie\n`);
    const absent = run(cli, ['--marques', 'ailleurs'], racine);
    assert.equal(absent.status, 2, cli);
    assert.equal(absent.stderr, `${cli} : --marques ailleurs : dossier introuvable ; nommer le dossier qui contient un sous-dossier par marque\n`);
  }
  rmSync(racine, { recursive: true, force: true });
});
