// @ts-check
/**
 * Étape 4, séance a, lot 1 : saisie d'une marque (docs/attendus/etape-4-contrat-de-marque.md).
 *
 * Attendus écrits à la main avant le code (15/11/2026) :
 *   S1 Orbe Café passe par la saisie sans changer de valeur : tokens/orbe-cafe/entree.json nomme les échelles
 *      existantes bleu et terre ; aucune échelle n'est générée ; marque.tokens.json est réécrit à l'identique,
 *      octet par octet. Empreinte du fichier versionné, commande : git show b5783d3:tokens/orbe-cafe/marque.tokens.json | shasum -a 256
 *      → b479882e1a159e9c429805f44eefd7178e569d8f833edbacb5c6102c57016461.
 *   S2 Motif « entrée invalide » : nom, primaire ou polices manquants ; couleur qui n'est pas #rrggbb ;
 *      clé inconnue ; échelle existante hors d'Orbe Café (réservée) ; échelle inconnue.
 *   S3 Motif « checkValise » : primaire #00ccff. Essai avant le code (generateScale, script d'essai hors dépôt) :
 *      pas 7 = pas 9 = #00ccff → « primaire : doublon, pas 7 = pas 9 (#00ccff) ».
 *   S4 Motif « contraste ». Avant le lot 3 bis : primaire #cc9900 refusée (texte pas 12 sur survol pas 10, 4,27:1).
 *      Règle du lot 3 bis : #cc9900 devient moyen et passe ; sur la grille de 216 couleurs, aucune n'échoue plus au
 *      contraste. Le motif se vérifie avec un seuil d'essai : les deux paires texte.sur-interactif passent au type
 *      « essai », seuil 5,2. Primaire #8a4fd8, soutenu (pas 9 #8a4fd8, pas 10 #864bd3) ; culori, wcagContrast :
 *      blanc sur #8a4fd8 = 5,0112 (échoue), blanc sur #864bd3 = 5,3021 (passe)
 *      → texte.sur-interactif sur fond.interactif.fort, 5,01:1 < 5,2:1.
 *   S5 Sans accent : repli sur le neutre (D05) ; marque.accent.* → couleur.neutre.* ; texte.accent = texte.secondaire
 *      = #6d675b (neutre 11).
 *   S6 Commande : sans fichier → code 2 ; refusée (#00ccff, S3) → code 1, motif sur la sortie d'erreur, rien d'écrit ;
 *      acceptée → code 0, marque.tokens.json et echelles.tokens.json écrits, contrôle de contraste lancé (0 paire en échec).
 *   S7 npm run contraste -- --marque tokens/orbe-cafe/ : même sortie que sans l'option.
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

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ORBE = join(ROOT, 'tokens', 'orbe-cafe');
const ORBE_SHA = 'b479882e1a159e9c429805f44eefd7178e569d8f833edbacb5c6102c57016461';
const POLICES = { titre: ['Georgia', 'serif'], texte: ['Arial', 'sans-serif'] };
const AILLEURS = join(tmpdir(), 'ds-lab-ailleurs');
const sha = (/** @type {string} */ s) => createHash('sha256').update(s).digest('hex');

test('S1 Orbe Café : échelles existantes, marque.tokens.json identique octet par octet', () => {
  const entree = JSON.parse(readFileSync(join(ORBE, 'entree.json'), 'utf8'));
  assert.deepEqual(entree.primaire, { echelle: 'bleu' });
  assert.deepEqual(entree.accent, { echelle: 'terre' });
  const r = saisir(entree, { dossier: ORBE });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.echelles, null, 'aucune échelle générée');
  const texte = serialiser(r.marque);
  assert.equal(texte, readFileSync(join(ORBE, 'marque.tokens.json'), 'utf8'));
  // Étape 4a, lot 5 : seul ajout, l'emplacement texte-grand ; retiré, le fichier redevient identique octet par octet.
  const sans = structuredClone(r.marque);
  delete sans.marque.primaire['texte-grand'];
  assert.equal(sha(serialiser(sans)), ORBE_SHA);
  assert.deepEqual(fondsClairs(r.commun), ['#fbfbfb', '#ffffff', '#f8f8f7']);
});

test('S2 entrée invalide : motifs', () => {
  const motifs = (/** @type {any} */ e, dossier = AILLEURS) => saisir(e, { dossier }).motifs;
  assert.deepEqual(motifs({}), ['entrée invalide : nom manquant', 'entrée invalide : primaire manquante', 'entrée invalide : polices manquantes']);
  assert.deepEqual(motifs([]), ['entrée invalide : objet JSON attendu']);
  const ok = { nom: 'Essai', primaire: '#2b4c7e', polices: POLICES };
  assert.deepEqual(motifs(ok), []);
  assert.deepEqual(motifs({ ...ok, primaire: '#12345' }), ['entrée invalide : primaire, couleur #rrggbb ou { "echelle": nom } attendue']);
  assert.deepEqual(motifs({ ...ok, accent: 'bleu' }), ['entrée invalide : accent, couleur #rrggbb ou { "echelle": nom } attendue']);
  assert.deepEqual(motifs({ ...ok, accnet: '#2b4c7e' }), ['entrée invalide : clé inconnue accnet']);
  assert.deepEqual(motifs({ ...ok, primaire: { echelle: 'bleu' } }), ['entrée invalide : primaire, échelle existante réservée à Orbe Café']);
  assert.deepEqual(motifs({ ...ok, accent: { echelle: 'violet' } }, ORBE), ['entrée invalide : accent, échelle inconnue violet']);
  assert.deepEqual(motifs({ ...ok, polices: { titre: ['Georgia'] } }), ['entrée invalide : polices.texte, liste de noms de familles attendue']);
  assert.deepEqual(motifs({ ...ok, polices: { titre: [], texte: ['Arial'] } }), ['entrée invalide : polices.titre, liste de noms de familles attendue']);
});

test('S3 checkValise en échec sur l\'échelle générée : refus', () => {
  const r = saisir({ nom: 'Essai', primaire: '#00ccff', polices: POLICES }, { dossier: AILLEURS });
  assert.deepEqual(r.motifs, ['checkValise (clair) : primaire : doublon, pas 7 = pas 9 (#00ccff)']);
});

test('S4 paire de rôles en échec : refus', () => {
  assert.equal(Math.round(wcagContrast('#ffffff', '#8a4fd8') * 100) / 100, 5.01);
  assert.equal(Math.round(wcagContrast('#ffffff', '#864bd3') * 100) / 100, 5.3);
  assert.deepEqual(saisir({ nom: 'Essai', primaire: '#cc9900', polices: POLICES }, { dossier: AILLEURS }).motifs, []);
  const commun = chargerCommun();
  const paires = structuredClone(commun.paires);
  paires.seuils.essai = 5.2;
  for (const p of paires.paires) if (p.devant === 'texte.sur-interactif') p.type = 'essai';
  const r = saisir({ nom: 'Essai', primaire: '#8a4fd8', polices: POLICES }, { dossier: AILLEURS, commun: { ...commun, paires } });
  assert.deepEqual(r.motifs, ['contraste (clair) : texte.sur-interactif sur fond.interactif.fort, 5,01:1 < 5,2:1']);
  const pas = r.echelles?.couleur.primaire;
  assert.deepEqual([pas['9'].$value.hex, pas['10'].$value.hex], ['#8a4fd8', '#864bd3']);
});

test('S5 sans accent : repli sur le neutre (D05)', () => {
  const r = saisir({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES }, { dossier: AILLEURS });
  assert.deepEqual(r.motifs, []);
  assert.equal(r.marque.marque.accent['9'].$value, '{couleur.neutre.9}');
  assert.deepEqual(Object.keys(r.echelles?.couleur ?? {}).filter((k) => !k.startsWith('$')), ['primaire']);
  const roles = resolveRoles(r.commun.semantique, r.commun.primitives, r.commun.statuts, r.commun.marque, r.marque, r.echelles);
  assert.equal(roles.get('texte.accent')?.hex, '#6d675b');
  assert.equal(roles.get('texte.accent')?.hex, roles.get('texte.secondaire')?.hex);
});

/** @param {string[]} args */
const run = (...args) => spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });

test('S6 commande saisie : codes de sortie, motif, fichiers', () => {
  assert.equal(run('src/cli/saisie.js').status, 2);
  const refus = mkdtempSync(join(tmpdir(), 'ds-lab-saisie-'));
  writeFileSync(join(refus, 'entree.json'), JSON.stringify({ nom: 'Essai', primaire: '#00ccff', polices: POLICES }));
  const r1 = run('src/cli/saisie.js', join(refus, 'entree.json'));
  assert.equal(r1.status, 1);
  assert.match(r1.stderr, /marque refusée : Essai/);
  assert.match(r1.stderr, /checkValise \(clair\) : primaire : doublon, pas 7 = pas 9 \(#00ccff\)/);
  assert.deepEqual(readdirSync(refus), ['entree.json'], 'rien d\'écrit');
  const ok = mkdtempSync(join(tmpdir(), 'ds-lab-saisie-'));
  writeFileSync(join(ok, 'entree.json'), JSON.stringify({ nom: 'Essai', primaire: '#2b4c7e', accent: '#c8553d', polices: POLICES }));
  const r2 = run('src/cli/saisie.js', join(ok, 'entree.json'));
  assert.equal(r2.status, 0, r2.stderr);
  assert.match(r2.stdout, /marque acceptée : Essai/);
  assert.match(r2.stdout, /mode sombre, largeur large\n/);
  assert.equal(r2.stdout.match(/70 paires de rôles, 0 paire en échec/g)?.length, 2, 'les deux modes');
  assert.ok(existsSync(join(ok, 'marque.tokens.json')) && existsSync(join(ok, 'echelles.tokens.json')));
});

test('S7 contraste --marque tokens/orbe-cafe/ : même sortie que sans l\'option', () => {
  const a = run('src/cli/contraste.js');
  const b = run('src/cli/contraste.js', '--marque', 'tokens/orbe-cafe/');
  assert.equal(a.status, 0);
  assert.equal(b.status, 0);
  assert.equal(b.stdout, a.stdout);
  assert.equal(COMMUN, join(ROOT, 'tokens', 'commun') + '/');
});
