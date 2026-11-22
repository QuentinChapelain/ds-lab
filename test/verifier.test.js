// @ts-check
/**
 * verifier, le contrôle d'un dépôt externe (D66, D67, docs/attendus/etape-9-skill.md et etape-10-banc.md). Attendus
 * écrits à la main avant le code ; chaque cas joue dans un dépôt fictif hors de ds-lab, fait des copies de toutes les
 * marques de tokens/. Un échec s'écrit dans le bloc de sa cause : le constat, puis un seul « À faire ».
 *   VR1 tout passe : l'en-tête, puis le bilan à 0 échec, rien d'autre ; sortie 0 ;
 *   VR2 une paire cassée en sombre : un bloc, les deux contextes sombres, aucun clair ; sortie 1 ;
 *   VR3 une échelle commune redéfinie : le motif de la saisie (D25), mot pour mot, et ce qu'il faut faire ;
 *   VR4 une valeur en dur dans un .vue : un bloc de style, le fichier, la ligne, le constat et la fin du message de CP3 ;
 *   VR5 --marques ou --style absent, motif sans fichier : sortie 2, message qui dit quoi passer ;
 *   VR6 chaque bloc, de chaque contrôle, a deux lignes : le constat et sa règle, puis « À faire : … » ; chaque règle de
 *       npm run typo a son numéro et son « À faire » ;
 *   VR7 la sortie ne dépend pas du dossier d'où l'on lance : même texte depuis le dépôt fictif et depuis un sous-dossier ;
 *   VR8 --skill : une copie fidèle de skill/ds-lab/ passe et le bilan nomme le skill ; un fichier changé et un fichier
 *       absent donnent un seul bloc, « À faire : recopier », sortie 1 ; une copie introuvable, sortie 2 ;
 *   VR9 un pas d'échelle cassé : un seul bloc qui nomme le jeton et sa valeur, les rôles qui le lisent, les paires
 *       distinctes, les contextes, le compte d'échecs et ses règles, tous recomptés ici sur le contrat ;
 *   VR10 deux valeurs en dur dans un fichier : un bloc, les deux lignes citées ; dans deux fichiers : deux blocs ;
 *   VR11 le bilan compte les échecs, les blocs et chaque contrôle ; chaque message de stylelint.config.mjs a la forme
 *       « constat : à faire ».
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, cpSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dossiersDeMarque, nomDeMarque, largeurs, enEtroit, RESOLVER } from '../src/tokens/resolver.js';
import { loadRoles, contrat, resolveRoles } from '../src/tokens/roles.js';
import { typo } from '../src/tokens/typo.js';
import { motifRedefinies } from '../src/tokens/saisie.js';
import { TYPO_A_FAIRE } from '../src/report/verifier.js';
import { SKILL } from '../src/report/skill.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CLI = join(ROOT, 'src', 'cli', 'verifier.js');
const MARQUES = dossiersDeMarque();
const NOMS = MARQUES.map(nomDeMarque);
const BON = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  padding: var(--v-ds-label-gap);\n  color: rgb(var(--v-theme-on-surface));\n}\n</style>\n';
const EN_DUR = '<template><div class="b">x</div></template>\n<style scoped>\n.b {\n  color: rgb(var(--v-theme-on-surface));\n  padding: 12px;\n}\n</style>\n';
const CP3 = '  À faire : prendre var(--v-ds-…) ou rgb(var(--v-theme-…)) ; sinon une exception avec sa raison (CP3).';

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
/** Les blocs : chaque ligne « ✗ » avec la ligne qui la suit. @param {string} s */
const blocsDe = (s) => lignes(s).flatMap((l, i, t) => (l.startsWith('✗ ') ? [[l, t[i + 1]]] : []));
const ENTETE = (/** @type {number} */ n) => `verifier : ${MARQUES.length} marques dans tokens/ (${NOMS.join(', ')}) ; ${n} ${n > 1 ? 'fichiers' : 'fichier'} de style`;
const ZERO = 'verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style)';

test('VR1 tout passe : en-tête et bilan, sortie 0', () => {
  const racine = depot();
  const r = verifier(racine);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(lignes(r.stdout), [ENTETE(1), ZERO]);
  rmSync(racine, { recursive: true, force: true });
});

test('VR2 une paire cassée en sombre : un bloc, les deux contextes sombres, aucun clair', () => {
  const racine = depot();
  const nom = basename(MARQUES[0]);
  const d = join(racine, 'tokens', nom);
  modifier(d, (r) => r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } }));
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  const b = blocsDe(r.stdout).filter(([l]) => l.startsWith('✗ contraste · '));
  assert.equal(b.length, 1, r.stdout);
  const [constat, aFaire] = b[0];
  assert.ok(constat.startsWith(`✗ contraste · ${NOMS[0]} (tokens/${nom}/) : `), constat);
  assert.match(constat, /, lu par (.+, )?text\.default[ ,]/);
  assert.match(constat, / dans 2 contextes sur 4 \(sombre, large ; sombre, étroit\), soit \d+ échecs, la plus basse à 1,00:1 \(DS12 : \d+(, DS2 : \d+)?\)\.$/);
  assert.equal(aFaire, `  À faire : relancer la saisie sur tokens/${nom}/entree.json ; si elle refuse la marque, changer la couleur qu'elle nomme. Ne pas corriger les jetons à la main.`);
  assert.ok(!r.stdout.includes('clair, '), r.stdout);
  assert.match(lignes(r.stdout).at(-1) ?? '', /^verifier : \d+ échecs en 1 bloc \(contraste \d+, espacements 0, typo 0, style 0\)$/);
  rmSync(racine, { recursive: true, force: true });
});

test('VR3 une échelle commune redéfinie : le motif de la saisie et ce qu’il faut faire', () => {
  const racine = depot();
  const nom = basename(MARQUES.at(-1) ?? '');
  writeFileSync(join(racine, 'tokens', nom, 'primitives.tokens.json'), JSON.stringify({ color: { neutral: { 1: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } } } } }));
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  assert.deepEqual(blocsDe(r.stdout), [
    [
      `✗ contraste · ${nomDeMarque(MARQUES.at(-1) ?? '')} (tokens/${nom}/) : ${motifRedefinies(['neutral'])} (D25).`,
      `  À faire : renommer l'échelle dans le dossier de la marque, puis relancer la saisie sur tokens/${nom}/entree.json.`,
    ],
  ]);
  rmSync(racine, { recursive: true, force: true });
});

test('VR4 une valeur en dur : un bloc de style, le fichier, la ligne, sortie 1', () => {
  const racine = depot();
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), EN_DUR);
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  assert.equal(lignes(r.stdout)[0], ENTETE(2));
  assert.deepEqual(blocsDe(r.stdout), [['✗ style · src/components/MemberBadge.vue : ligne 5 : Valeur brute « 12px » pour padding (declaration-property-value-allowed-list).', CP3]]);
  assert.equal(lignes(r.stdout).at(-1), 'verifier : 1 échec en 1 bloc (contraste 0, espacements 0, typo 0, style 1)');
  rmSync(racine, { recursive: true, force: true });
});

test('VR5 option absente, motif sans fichier : sortie 2 qui dit quoi passer', () => {
  const racine = depot();
  const usage = 'usage : node <clone>/src/cli/verifier.js --marques <dossier> --style <motif> [--style <motif>…] [--skill <dossier>]';
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

test('VR6 chaque bloc a son constat, sa règle et un « À faire » ; chaque règle de typo a son numéro', () => {
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
  const b = blocsDe(r.stdout);
  assert.equal(lignes(r.stdout).filter((l) => l.startsWith('  À faire : ')).length, b.length, r.stdout);
  for (const [constat, aFaire] of b) {
    assert.match(constat, / \((?:(?:DS|DF|D)\d+(?: : \d+)?(?:, )?)+\)\.$|\(declaration-property-value-allowed-list\)\.$/, constat);
    assert.match(aFaire ?? '', /^ {2}À faire : \S.*\.$/, constat);
  }
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

test('VR8 --skill : copie fidèle, copie qui vieillit, copie introuvable', () => {
  const racine = depot();
  const copie = join(racine, '.claude', 'skills', 'ds-lab');
  cpSync(SKILL, copie, { recursive: true });
  const args = ['--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'];
  const bon = verifier(racine, args);
  assert.equal(bon.status, 0, bon.stdout + bon.stderr);
  assert.equal(lignes(bon.stdout).at(-1), 'verifier : 0 échec (contraste en clair et en sombre, en large et en étroit ; espacements ; typo ; style ; skill)');
  appendFileSync(join(copie, 'regles.md'), 'ajout\n');
  rmSync(join(copie, 'consignes.md'));
  const vieux = verifier(racine, args);
  assert.equal(vieux.status, 1, vieux.stderr);
  const aFaire = 'À faire : recopier skill/ds-lab/ du clone dans .claude/skills/ds-lab/.';
  assert.deepEqual(blocsDe(vieux.stdout), [
    ['✗ skill · .claude/skills/ds-lab/ : consignes.md absent de la copie ; regles.md diffère de skill/ds-lab/ du clone.', `  ${aFaire}`],
  ]);
  assert.equal(lignes(vieux.stdout).at(-1), 'verifier : 2 échecs en 1 bloc (contraste 0, espacements 0, typo 0, style 0, skill 2)');
  const absent = verifier(racine, [...args.slice(0, -1), 'ailleurs']);
  assert.equal(absent.status, 2);
  assert.equal(absent.stderr, 'verifier : --skill ailleurs : dossier introuvable ; nommer le dossier où le skill est copié, par exemple .claude/skills/ds-lab\n');
  assert.equal(absent.stdout, '');
  rmSync(racine, { recursive: true, force: true });
});

/** La première marque de tokens/ qui a son échelle principale dans echelles.tokens.json, et son pas 11. */
const AVEC_ECHELLE = MARQUES.find((d) => {
  try {
    return !!JSON.parse(readFileSync(join(d, 'echelles.tokens.json'), 'utf8')).color.primary['11'];
  } catch {
    return false;
  }
});

test('VR9 un pas d’échelle cassé : un seul bloc, recompté sur le contrat', () => {
  assert.ok(AVEC_ECHELLE, 'une marque à échelle saisie');
  const racine = depot();
  const nom = basename(AVEC_ECHELLE);
  const d = join(racine, 'tokens', nom);
  const f = join(d, 'echelles.tokens.json');
  const e = JSON.parse(readFileSync(f, 'utf8'));
  e.color.primary['11'].$value = { colorSpace: 'srgb', components: [0xf2 / 255, 0xe6 / 255, 0xc4 / 255], hex: '#f2e6c4' };
  writeFileSync(f, JSON.stringify(e, null, 2));
  // Recompte, sans le code du regroupement : chaque paire en échec, dans chaque contexte, et ses deux jetons primitifs.
  /** @type {{ cle: string, contexte: string, regle: string, jetons: string[] }[]} */
  const paires = [];
  for (const [mode, largeur, contexte] of [['light', 'wide', 'clair, large'], ['dark', 'wide', 'sombre, large'], ['light', 'narrow', 'clair, étroit'], ['dark', 'narrow', 'sombre, étroit']]) {
    const set = loadRoles(d, { mode, largeur });
    const roles = resolveRoles(set.semantique, set.primitives, set.marque ?? {}, ...(set.echelles ?? []));
    for (const p of contrat(set).roles.fails)
      paires.push({ cle: `${p.devant}|${p.fond}`, contexte, regle: p.type === 'focus' ? 'DS2' : 'DS12', jetons: [roles.get(p.devant)?.cible ?? '', roles.get(p.fond)?.cible ?? ''] });
  }
  assert.ok(paires.length > 1 && paires.every((p) => p.jetons.includes('color.primary.11')), 'toutes les paires passent par le pas cassé');
  const r = verifier(racine);
  assert.equal(r.status, 1, r.stderr);
  const b = blocsDe(r.stdout);
  assert.equal(b.length, 1, r.stdout);
  const [constat] = b[0];
  const contextes = [...new Set(paires.map((p) => p.contexte))];
  const n = (/** @type {string} */ g) => paires.filter((p) => p.regle === g).length;
  assert.ok(constat.startsWith(`✗ contraste · ${nomDeMarque(AVEC_ECHELLE)} (tokens/${nom}/) : color.primary.11 (#f2e6c4), lu par `), constat);
  assert.match(constat, /lu par (.+, )?text\.interactive[ ,;]/);
  assert.match(constat, /lu par (.+, )?border\.focus[ ,;]/);
  assert.ok(constat.includes(` ; ${new Set(paires.map((p) => p.cle)).size} paires sous leur seuil dans ${contextes.length} contexte${contextes.length > 1 ? 's' : ''} sur 4 (${contextes.join(' ; ')}), soit ${paires.length} échecs, `), constat);
  const regles = [['DS12', n('DS12')], ['DS2', n('DS2')]].filter(([, k]) => k).sort((x, y) => Number(y[1]) - Number(x[1])).map(([g, k]) => `${g} : ${k}`).join(', ');
  assert.ok(constat.endsWith(`(${regles}).`), constat);
  assert.equal(lignes(r.stdout).at(-1), `verifier : ${paires.length} échecs en 1 bloc (contraste ${paires.length}, espacements 0, typo 0, style 0)`);
  rmSync(racine, { recursive: true, force: true });
});

test('VR10 deux valeurs en dur dans un fichier : un bloc ; dans deux fichiers : deux blocs', () => {
  const racine = depot();
  const deux = EN_DUR.replace('  padding: 12px;\n', '  padding: 12px;\n  margin: 4px;\n');
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), deux);
  const un = verifier(racine);
  assert.equal(un.status, 1, un.stderr);
  assert.deepEqual(blocsDe(un.stdout), [
    ['✗ style · src/components/MemberBadge.vue : ligne 5 : Valeur brute « 12px » pour padding ; ligne 6 : Valeur brute « 4px » pour margin (declaration-property-value-allowed-list).', CP3],
  ]);
  writeFileSync(join(racine, 'src', 'components', 'Autre.vue'), EN_DUR);
  const deuxFichiers = verifier(racine);
  assert.deepEqual(
    blocsDe(deuxFichiers.stdout).map(([l]) => l.slice(0, l.indexOf(' : '))),
    ['✗ style · src/components/Autre.vue', '✗ style · src/components/MemberBadge.vue'],
  );
  assert.equal(lignes(deuxFichiers.stdout).at(-1), 'verifier : 3 échecs en 2 blocs (contraste 0, espacements 0, typo 0, style 3)');
  rmSync(racine, { recursive: true, force: true });
});

test('VR11 le bilan compte échecs, blocs et contrôles ; chaque message de style a la forme « constat : à faire »', async () => {
  const racine = depot();
  writeFileSync(join(racine, 'src', 'components', 'MemberBadge.vue'), EN_DUR);
  modifier(join(racine, 'tokens', basename(MARQUES[0])), (r) => r.modifiers.mode.contexts.dark.push({ text: { default: { $type: 'color', $value: '{background.app}' } } }));
  const r = verifier(racine);
  assert.equal(r.status, 1);
  const contraste = Number(/contraste (\d+)/.exec(lignes(r.stdout).at(-1) ?? '')?.[1]);
  assert.equal(lignes(r.stdout).at(-1), `verifier : ${contraste + 1} échecs en ${blocsDe(r.stdout).length} blocs (contraste ${contraste}, espacements 0, typo 0, style 1)`);
  assert.equal(blocsDe(r.stdout).length, 2);
  const config = (await import(join(ROOT, 'stylelint.config.mjs'))).default;
  const messages = Object.values(config.rules).map((/** @type {any} */ v) => v[1].message).map((m) => (typeof m === 'function' ? m('padding', '12px') : m));
  assert.ok(messages.length >= 5);
  for (const m of messages) assert.match(m, /^[^:]+ : \S.*\(CP3\)\.$/, m);
  rmSync(racine, { recursive: true, force: true });
});
