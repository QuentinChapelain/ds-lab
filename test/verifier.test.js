// @ts-check
/**
 * verifier, le contrôle d'un dépôt externe (D66, docs/attendus/etape-9-skill.md). Attendus écrits à la main avant le
 * code ; chaque cas joue dans un dépôt fictif hors de ds-lab, fait des copies de toutes les marques de tokens/ :
 *   VR1 tout passe : l'en-tête, puis le bilan à 0 échec, rien d'autre ; sortie 0 ;
 *   VR2 une paire cassée en sombre : une ligne par contexte sombre (large et étroit), aucune en clair ; sortie 1 ;
 *   VR3 une échelle commune redéfinie : le motif de la saisie (D25), mot pour mot, et ce qu'il faut faire ;
 *   VR4 une valeur en dur dans un .vue : une ligne de style, fichier:ligne et le message de CP3 ; sortie 1 ;
 *   VR5 --marques ou --style absent, motif sans fichier : sortie 2, message qui dit quoi passer ;
 *   VR6 chaque ligne d'échec, de chaque contrôle, finit par « À faire : … » ou par le message de CP3 ; chaque règle de
 *       npm run typo a son numéro et son « À faire » ;
 *   VR7 la sortie ne dépend pas du dossier d'où l'on lance : même texte depuis le dépôt fictif et depuis un sous-dossier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, nomDeMarque, largeurs, enEtroit, RESOLVER } from '../src/tokens/resolver.js';
import { typo } from '../src/tokens/typo.js';
import { motifRedefinies } from '../src/tokens/saisie.js';
import { TYPO_A_FAIRE } from '../src/report/verifier.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'verifier.js');
const MARQUES = dossiersDeMarque();
const NOMS = MARQUES.map(nomDeMarque);
const BON = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: var(--v-ds-label-gap);\n  color: rgb(var(--v-theme-on-surface));\n}\n</style>\n';
const EN_DUR = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  color: rgb(var(--v-theme-on-surface));\n  padding: 12px;\n}\n</style>\n';
const CP3 = 'Valeur brute « 12px » pour padding : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).';

/** Un dépôt fictif : tokens/ avec une copie de chaque marque, src/components/ avec un composant bon. */
function depot() {
  const racine = mkdtempSync(join(tmpdir(), 'ds-lab-verifier-'));
  for (const d of MARQUES) {
    const cible = join(racine, 'tokens', basename(d));
    mkdirSync(cible, { recursive: true });
    for (const f of readdirSync(d).filter((x) => x.endsWith('.json'))) copyFileSync(join(d, f), join(cible, f));
  }
  mkdirSync(join(racine, 'src', 'components'), { recursive: true });
  writeFileSync(join(racine, 'src', 'components', 'Bon.vue'), BON);
  return racine;
}
/** @param {string} cwd @param {string[]} [args] */
const verifier = (cwd, args = ['--marques', 'tokens', '--style', 'src/**/*.vue']) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8' });
/** Ajoute une source en ligne au resolver d'une marque copiée. @param {string} dossier @param {(r: any) => void} f */
function modifier(dossier, f) {
  const r = JSON.parse(readFileSync(join(dossier, RESOLVER), 'utf8'));
  f(r);
  writeFileSync(join(dossier, RESOLVER), JSON.stringify(r, null, 2));
}
const lignes = (/** @type {string} */ s) => s.split('\n').filter(Boolean);
const echecs = (/** @type {string} */ s) => lignes(s).filter((l) => l.startsWith('✗ '));
const ENTETE = (/** @type {number} */ n) => `verifier : ${MARQUES.length} marques dans tokens/ (${NOMS.join(', ')}) ; ${n} ${n > 1 ? 'fichiers' : 'fichier'} de style`;
const ZERO = 'verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style)';

test('VR1 tout passe : en-tête et bilan, sortie 0', () => {
  const racine = depot();
  const r = verifier(racine);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(lignes(r.stdout), [ENTETE(1), ZERO]);
  rmSync(racine, { recursive: true, force: true });
});

test('VR2 une paire cassée en sombre : une ligne par contexte sombre, aucune en clair', () => {
  const racine = depot();
  const d = join(racine, 'tokens', basename(MARQUES[0]));
  modifier(d, (r) => r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } }));
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  const e = echecs(r.stdout).filter((l) => l.includes('text.default sur background.app'));
  const tete = `✗ contraste · ${NOMS[0]} (tokens/${basename(MARQUES[0])}/) · `;
  const fin = ` : text.default sur background.app, 1,00:1 < 4,50:1 (DS12). À faire : relancer la saisie sur tokens/${basename(MARQUES[0])}/entree.json ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.`;
  assert.deepEqual(e, [`${tete}sombre, large${fin}`, `${tete}sombre, étroit${fin}`]);
  assert.ok(!echecs(r.stdout).some((l) => l.includes('· clair')), r.stdout);
  assert.match(lignes(r.stdout).at(-1) ?? '', /^verifier : \d+ échecs \(contraste \d+, espacements 0, typo 0, style 0\)$/);
  rmSync(racine, { recursive: true, force: true });
});

test('VR3 une échelle commune redéfinie : le motif de la saisie et ce qu’il faut faire', () => {
  const racine = depot();
  const nom = basename(MARQUES.at(-1) ?? '');
  writeFileSync(join(racine, 'tokens', nom, 'primitives.tokens.json'), JSON.stringify({ color: { neutral: { 1: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } } } } }));
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(echecs(r.stdout), [
    `✗ contraste · ${nomDeMarque(MARQUES.at(-1) ?? '')} (tokens/${nom}/) : ${motifRedefinies(['neutral'])} (D25). À faire : renommer l'échelle dans le dossier de la marque, puis relancer la saisie sur tokens/${nom}/entree.json.`,
  ]);
  rmSync(racine, { recursive: true, force: true });
});

test('VR4 une valeur en dur : une ligne de style, fichier et ligne, sortie 1', () => {
  const racine = depot();
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), EN_DUR);
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(lignes(r.stdout)[0], ENTETE(2));
  assert.deepEqual(echecs(r.stdout), [`✗ style · src/components/MemberBadge.vue:5 : ${CP3} (declaration-property-value-allowed-list)`]);
  assert.equal(lignes(r.stdout).at(-1), 'verifier : 1 échec (contraste 0, espacements 0, typo 0, style 1)');
  rmSync(racine, { recursive: true, force: true });
});

test('VR5 option absente, motif sans fichier : sortie 2 qui dit quoi passer', () => {
  const racine = depot();
  const usage = 'usage : node <clone>/src/cli/verifier.js --marques <dossier> --style <motif> [--style <motif>…]';
  const cas = [
    [['--style', 'src/**/*.vue'], `verifier : --marques <dossier> attendu, le dossier qui contient un sous-dossier par marque ; ${usage}\n`],
    [['--marques', 'tokens'], `verifier : --style <motif> attendu, les fichiers des composants (par exemple --style "src/**/*.vue") ; ${usage}\n`],
    [['--marques', 'tokens', '--style', 'lib/*.vue'], 'verifier : --style lib/*.vue : aucun fichier ; nommer les fichiers des composants, par exemple --style "src/**/*.vue"\n'],
    [['--marques', 'src', '--style', 'src/**/*.vue'], "verifier : aucune marque dans src (un sous-dossier avec marque.resolver.json) : lancer d'abord la saisie\n"],
  ];
  for (const [args, message] of /** @type {[string[], string][]} */ (cas)) {
    const r = verifier(racine, args);
    assert.equal(r.status, 2, args.join(' '));
    assert.equal(r.stderr, message);
    assert.equal(r.stdout, '', args.join(' '));
  }
  rmSync(racine, { recursive: true, force: true });
});

test('VR6 chaque ligne d’échec dit quoi faire ; chaque règle de typo a son numéro', () => {
  const racine = depot();
  const d = join(racine, 'tokens', basename(MARQUES[0]));
  const corps = { fontFamily: '{brand.font.body}', fontSize: '{font-size.12}', fontWeight: '{font-weight.400}', letterSpacing: { value: 0, unit: 'px' }, lineHeight: 1 };
  modifier(d, (r) => {
    r.sets.roles.sources.push({ gap: { 'within-component': { $type: 'dimension', $value: '{space.64}' } }, typography: { body: { medium: { $type: 'typography', $value: corps } } } });
    r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } });
  });
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), EN_DUR);
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  const e = echecs(r.stdout);
  for (const f of ['contraste', 'espacements', 'typo', 'style']) assert.ok(e.some((l) => l.startsWith(`✗ ${f} · `)), `${f} : ${r.stdout}`);
  for (const l of e) assert.ok(/ \((DS|DF|D)\d+\)\. À faire : [^.]+.*\.$/.test(l) || l.includes(CP3), l);
  const l = largeurs(MARQUES[0]);
  const ids = typo(l.large.semantique, l.large.primitives, l.large.marque, { ...l.etroit, semantique: enEtroit(l.large.semantique, l.contexte) }).regles.map((g) => g.id);
  assert.deepEqual(Object.keys(TYPO_A_FAIRE).sort(), [...ids].sort());
  rmSync(racine, { recursive: true, force: true });
});

test('VR7 même sortie depuis le dépôt et depuis un sous-dossier', () => {
  const racine = depot();
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), EN_DUR);
  const haut = verifier(racine);
  const bas = verifier(join(racine, 'src'), ['--marques', '../tokens', '--style', 'components/*.vue']);
  assert.equal(bas.status, haut.status);
  const sansChemins = (/** @type {string} */ s) => s.replaceAll('../tokens/', 'tokens/').replaceAll('src/components/', 'components/');
  assert.equal(sansChemins(bas.stdout), sansChemins(haut.stdout));
  rmSync(racine, { recursive: true, force: true });
});
