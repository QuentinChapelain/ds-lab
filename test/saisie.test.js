// @ts-check
/**
 * Saisie d'une marque (docs/attendus/etape-4-contrat-de-marque.md).
 *
 * Attendus écrits à la main avant le code (15/11/2026) :
 *   S1 Orbe Café passe par la saisie sans changer de valeur : tokens/orbe-cafe/entree.json nomme les échelles
 *      existantes blue et earth ; aucune échelle n'est générée ; marque.tokens.json est réécrit à l'identique,
 *      octet par octet. Empreinte du fichier versionné sans l'emplacement texte-grand (git show b5783d3:tokens/orbe-cafe/marque.tokens.json
 *      | shasum -a 256 → b479882e…), recalculée quand la description a perdu ses séances (16/11/2026, sha256 de
 *      JSON.stringify(marque, null, 2) + saut de ligne) → 2abaca339a3b57ac84a9bf999bee8814e9c1c2bb9b556a401b855353ca0d0a73 ;
 *      recalculée quand les descriptions des polices ont dit que le libellé garde la police du produit (18/11/2026,
 *      D44, aucune valeur changée) → 063f67df59e2a54ad0288a2e3041889983929b5183ddff3257e3bfd535ae1815 ; puis quand
 *      les six survols de pleins sont devenus la clarté OKLCH du plein − 0,05 (18/11/2026, D45 : seules valeurs
 *      changées, docs/attendus/finitions-bouton.md) → c6717998900ac0add8cc9114c2cd7eca7e1a091f50984d81b0ff250ad9a8b537 ;
 *      recalculée quand les noms des tokens sont passés en anglais (21/11/2026, docs/attendus/noms-en-anglais.md :
 *      aucune valeur changée ; traduit à rebours par docs/anciens-noms.json, le fichier retrouve c6717998…,
 *      test/anciens-noms.test.js) → fe878df65c88545d1c193e8a520071ee4ddbed409cdb8a80ea407a01cec7f8c9.
 *   S2 Motif « entrée invalide » : nom, primaire ou polices manquants ; couleur qui n'est pas #rrggbb ;
 *      clé inconnue ; échelle existante sans fichier d'échelles écrites à la main dans le dossier ; échelle inconnue.
 *   S3 Motif « checkValise » : primaire #00ccff. Essai avant le code (generateScale, script d'essai hors dépôt) :
 *      pas 7 = pas 9 = #00ccff → « primary : doublon, pas 7 = pas 9 (#00ccff) » (l'échelle générée porte le nom de l'emplacement).
 *   S4 Motif « contraste ». Avant D04 : primaire #cc9900 refusée (texte pas 12 sur survol pas 10, 4,27:1).
 *      Avec D04 : #cc9900 devient moyen et passe ; sur la grille de 216 couleurs, aucune n'échoue plus au
 *      contraste. Le motif se vérifie avec un seuil d'essai : les deux paires text.on-interactive passent au type
 *      « essai », seuil 5,2. Primaire #8a4fd8, soutenu (pas 9 #8a4fd8, pas 10 #864bd3) ; culori, wcagContrast :
 *      blanc sur #8a4fd8 = 5,0112 (échoue), blanc sur #864bd3 = 5,3021 (passe)
 *      → text.on-interactive sur background.interactive.strong, 5,01:1 < 5,2:1.
 *   S5 Sans accent : repli sur le neutre (D05) ; brand.accent.* → color.neutral.* ; text.accent = text.secondary
 *      = #6d675b (neutre 11).
 *   S6 Commande : sans fichier → code 2 ; refusée (#00ccff, S3) → code 1, motif sur la sortie d'erreur, rien d'écrit ;
 *      acceptée → code 0, marque.tokens.json et echelles.tokens.json écrits, contrôle de contraste lancé (0 paire en échec).
 *   S7 npm run contraste -- --marque tokens/orbe-cafe/ : même sortie que sans l'option ; Que son bloc sans l'option.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
import { saisir, serialiser, COMMUN, chargerCommun } from '../src/tokens/saisie.js';
import { resolveRoles, loadRoles } from '../src/tokens/roles.js';
import { fondsClairs } from '../src/tokens/saisie.js';
import { N_PAIRES } from './helpers/roles-ajoutes.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ORBE = join(ROOT, 'tokens', 'orbe-cafe');
const ORBE_SHA = 'fe878df65c88545d1c193e8a520071ee4ddbed409cdb8a80ea407a01cec7f8c9';
const POLICES = { heading: ['Georgia', 'serif'], body: ['Arial', 'sans-serif'] };
const AILLEURS = join(tmpdir(), 'ds-lab-ailleurs');
const sha = (/** @type {string} */ s) => createHash('sha256').update(s).digest('hex');

test('S1 Orbe Café : échelles existantes, marque.tokens.json identique octet par octet', () => {
  const entree = JSON.parse(readFileSync(join(ORBE, 'entree.json'), 'utf8'));
  assert.deepEqual(entree.primary, { scale: 'blue' });
  assert.deepEqual(entree.accent, { scale: 'earth' });
  const r = saisir(entree, { dossier: ORBE });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.echelles, null, 'aucune échelle générée');
  const texte = serialiser(r.marque);
  assert.equal(texte, readFileSync(join(ORBE, 'marque.tokens.json'), 'utf8'));
  // Seul ajout, l'emplacement texte-grand ; retiré, le fichier redevient identique octet par octet.
  const sans = structuredClone(r.marque);
  delete sans.brand.primary['text-large'];
  assert.equal(sha(serialiser(sans)), ORBE_SHA);
  assert.deepEqual(fondsClairs(r.commun), ['#fbfbfb', '#ffffff', '#f8f8f7']);
});

test('S2 entrée invalide : motifs', () => {
  const motifs = (/** @type {any} */ e, dossier = AILLEURS) => saisir(e, { dossier }).motifs;
  assert.deepEqual(motifs({}), ['entrée invalide : clé name absente', 'entrée invalide : clé primary absente', 'entrée invalide : clé fonts absente']);
  assert.deepEqual(motifs([]), ['entrée invalide : objet JSON attendu']);
  const ok = { name: 'Essai', primary: '#2b4c7e', fonts: POLICES };
  assert.deepEqual(motifs(ok), []);
  assert.deepEqual(motifs({ ...ok, primary: '#12345' }), ['entrée invalide : primary, couleur #rrggbb ou { "scale": nom } attendue']);
  assert.deepEqual(motifs({ ...ok, accent: 'bleu' }), ['entrée invalide : accent, couleur #rrggbb ou { "scale": nom } attendue']);
  assert.deepEqual(motifs({ ...ok, accnet: '#2b4c7e' }), ['entrée invalide : clé inconnue accnet']);
  assert.deepEqual(motifs({ ...ok, primary: { scale: 'bleu' } }), ['entrée invalide : primary, échelle existante : aucune échelle écrite à la main dans le dossier de la marque (primitives.tokens.json)']);
  assert.deepEqual(motifs({ ...ok, accent: { scale: 'violet' } }, ORBE), ['entrée invalide : accent, échelle inconnue violet']);
  // D16 : fonts.body est facultative, la police du produit la remplace.
  assert.deepEqual(motifs({ ...ok, fonts: { heading: ['Georgia'] } }), []);
  assert.deepEqual(motifs({ ...ok, fonts: { heading: ['Georgia'], body: [] } }), ['entrée invalide : fonts.body, liste de noms de familles attendue']);
  assert.deepEqual(motifs({ ...ok, fonts: { heading: [], body: ['Arial'] } }), ['entrée invalide : fonts.heading, liste de noms de familles attendue']);
});

test('S3 checkValise en échec sur l\'échelle générée : refus', () => {
  const r = saisir({ name: 'Essai', primary: '#00ccff', fonts: POLICES }, { dossier: AILLEURS });
  assert.deepEqual(r.motifs, ['checkValise (clair) : primary : doublon, pas 7 = pas 9 (#00ccff)']);
});

test('S4 paire de rôles en échec : refus', () => {
  assert.equal(Math.round(wcagContrast('#ffffff', '#8a4fd8') * 100) / 100, 5.01);
  assert.equal(Math.round(wcagContrast('#ffffff', '#864bd3') * 100) / 100, 5.3);
  assert.deepEqual(saisir({ name: 'Essai', primary: '#cc9900', fonts: POLICES }, { dossier: AILLEURS }).motifs, []);
  const commun = chargerCommun();
  const paires = structuredClone(commun.paires);
  paires.thresholds.essai = 5.2;
  for (const p of paires.pairs) if (p.foreground === 'text.on-interactive') p.type = 'essai';
  const r = saisir({ name: 'Essai', primary: '#8a4fd8', fonts: POLICES }, { dossier: AILLEURS, commun: { ...commun, paires } });
  assert.deepEqual(r.motifs, ['contraste (clair) : text.on-interactive sur background.interactive.strong, 5,01:1 < 5,2:1']);
  const pas = r.echelles?.color.primary;
  assert.deepEqual([pas['9'].$value.hex, pas['10'].$value.hex], ['#8a4fd8', '#864bd3']);
});

test('S5 sans accent : repli sur le neutre (D05)', () => {
  const r = saisir({ name: 'Essai', primary: '#2b4c7e', fonts: POLICES }, { dossier: AILLEURS });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.marque.brand.accent['9'].$value, '{color.neutral.9}');
  assert.deepEqual(Object.keys(r.echelles?.color ?? {}).filter((k) => !k.startsWith('$')), ['primary']);
  const roles = resolveRoles(r.commun.semantique, r.commun.primitives, r.commun.marque, r.marque, r.echelles);
  assert.equal(roles.get('text.accent')?.hex, '#6d675b');
  assert.equal(roles.get('text.accent')?.hex, roles.get('text.secondary')?.hex);
});

/** @param {string[]} args */
const run = (...args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });

test('S6 commande saisie : codes de sortie, motif, fichiers', () => {
  assert.equal(run('src/cli/saisie.js').status, 2);
  const refus = mkdtempSync(join(tmpdir(), 'ds-lab-saisie-'));
  writeFileSync(join(refus, 'entree.json'), JSON.stringify({ name: 'Essai', primary: '#00ccff', fonts: POLICES }));
  const r1 = run('src/cli/saisie.js', join(refus, 'entree.json'));
  assert.equal(r1.status, 1);
  assert.match(r1.stderr, /marque refusée : Essai/);
  assert.match(r1.stderr, /checkValise \(clair\) : primary : doublon, pas 7 = pas 9 \(#00ccff\)/);
  assert.deepEqual(readdirSync(refus), ['entree.json'], 'rien d\'écrit');
  const ok = mkdtempSync(join(tmpdir(), 'ds-lab-saisie-'));
  writeFileSync(join(ok, 'entree.json'), JSON.stringify({ name: 'Essai', primary: '#2b4c7e', accent: '#c8553d', fonts: POLICES }));
  const r2 = run('src/cli/saisie.js', join(ok, 'entree.json'));
  assert.equal(r2.status, 0, r2.stderr);
  assert.match(r2.stdout, /marque acceptée : Essai/);
  assert.match(r2.stdout, /mode dark, largeur wide\n/);
  assert.equal(r2.stdout.match(new RegExp(`${N_PAIRES} paires de rôles, 0 paire en échec`, 'g'))?.length, 2, 'les deux modes');
  assert.ok(existsSync(join(ok, 'marque.tokens.json')) && existsSync(join(ok, 'echelles.tokens.json')));
});

test('S7 contraste --marque tokens/orbe-cafe/ : même sortie que son bloc sans l\'option (D26 : sans l\'option, toutes les marques)', () => {
  const a = run('src/cli/contraste.js');
  const b = run('src/cli/contraste.js', '--marque', 'tokens/orbe-cafe/');
  assert.equal(a.status, 0);
  assert.equal(b.status, 0);
  assert.ok(a.stdout.endsWith(`marque Orbe Café (tokens/orbe-cafe/)\n${b.stdout}`));
  assert.equal(COMMUN, join(ROOT, 'tokens', 'commun') + '/');
});
