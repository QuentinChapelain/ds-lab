// @ts-check
/**
 * Contrôle de contraste par mode (docs/attendus/etape-4b-contextes.md).
 * Attendus écrits à la main avant le code :
 *   C1 npm run contraste --mode clair : même sortie que sans option (un bloc par marque, D26) ; --mode sombre, --largeur etroit acceptés ;
 *      mode inconnu : erreur d'usage, code 2 ;
 *   C2 les 5 marques fictives sortent en 0 dans les deux modes et dans les deux largeurs ; 70 paires (66 + les 4
 *      bordures de statut sur background.surface), puis 73 avec les paires du bouton (18/11/2026, docs/attendus/bouton.md) ;
 *   C3 border.error, .succes, .avertissement, .info sur background.surface : paires de type bordure (3:1), déclarées ;
 *   C4 la saisie dit le mode d'un refus : avec un seuil de 3,15 sur border.strong sur background.surface (clair 3,21:1,
 *      sombre 3,10:1 pour une marque quelconque), le seul motif est « contraste (sombre) : border.strong sur
 *      background.surface, 3,10:1 < 3,15:1 ».
 *   C5 (D31) : pour les 5 marques fictives, en clair et en sombre, le contrat
 *      que saisir() a calculé (contrats, par la fusion du resolver, sur les fichiers de la marque donnés en mémoire) est
 *      égal au contrat de loadRoles(dossier, { mode }), lu sur les fichiers écrits.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir, chargerCommun } from '../src/tokens/saisie.js';
import { loadRoles, contratRoles } from '../src/tokens/roles.js';
import { charger } from './helpers/jetons.js';
import { N_PAIRES } from './helpers/roles-ajoutes.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie', 'maison-alberto'];
const POLICES = { titre: ['Georgia', 'serif'], texte: ['Arial', 'sans-serif'] };
/** @param {string[]} args */
const run = (...args) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'contraste.js'), ...args], { cwd: ROOT, encoding: 'utf8' });

test('C1 --mode et --largeur : clair = sans option ; mode inconnu = code 2', () => {
  const sans = run();
  assert.equal(sans.status, 0);
  assert.equal(run('--mode', 'clair').stdout, sans.stdout);
  assert.equal(run('--mode', 'clair', '--largeur', 'large').stdout, sans.stdout);
  const sombre = run('--mode', 'sombre');
  assert.equal(sombre.status, 0, sombre.stdout);
  // D26 : sans --marque, un bloc par marque, chacun nomme son contexte après son en-tête.
  assert.equal(sombre.stdout.match(/^marque [^\n]+\nmode sombre, largeur large$/gm)?.length, 5);
  assert.equal(run('--largeur', 'etroit').status, 0);
  const faux = run('--mode', 'nuit');
  assert.equal(faux.status, 2);
  assert.match(faux.stderr, /contexte inconnu mode=nuit/);
});

test('C2 les 5 marques fictives : 0 échec dans les deux modes et les deux largeurs, toutes les paires', () => {
  for (const m of MARQUES)
    for (const mode of ['clair', 'sombre'])
      for (const largeur of ['large', 'etroit']) {
        const p = run('--marque', join('tokens', m), '--mode', mode, '--largeur', largeur);
        assert.equal(p.status, 0, `${m} ${mode} ${largeur}\n${p.stdout}`);
        assert.match(p.stdout, new RegExp(`${N_PAIRES} paires de rôles, 0 paire en échec`), `${m} ${mode} ${largeur}`);
      }
});

test('C3 bordures de statut sur background.surface : paires déclarées, type border', () => {
  const paires = charger('paires.json').pairs;
  for (const s of ['error', 'success', 'warning', 'info'])
    assert.ok(paires.some((/** @type {any} */ p) => p.foreground === `border.${s}` && p.background === 'background.surface' && p.type === 'border'), s);
  assert.equal(paires.length, N_PAIRES);
});

test('C4 la saisie dit le mode du refus', () => {
  const commun = chargerCommun();
  const communSombre = chargerCommun({ mode: 'sombre' });
  /** @param {any} c */
  const durci = (c) => {
    const paires = structuredClone(c.paires);
    paires.thresholds.essai = 3.15;
    for (const p of paires.pairs) if (p.foreground === 'border.strong' && p.background === 'background.surface') p.type = 'essai';
    return { ...c, paires };
  };
  const r = saisir({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES }, { dossier: '/ailleurs', commun: durci(commun), communSombre: durci(communSombre) });
  assert.deepEqual(r.motifs, ['contraste (sombre) : border.strong sur background.surface, 3,10:1 < 3,15:1']);
});

test('C5 contrat calculé par la saisie = contrat du resolver, 5 marques, clair et sombre', () => {
  for (const m of MARQUES) {
    const dossier = join(ROOT, 'tokens', m);
    const s = saisir(JSON.parse(readFileSync(join(dossier, 'entree.json'), 'utf8')), { dossier });
    assert.deepEqual(s.motifs, [], m);
    for (const mode of /** @type {const} */ (['clair', 'sombre'])) {
      const saisie = /** @type {any} */ (s.contrats)?.[mode];
      assert.equal(saisie?.pairs.length, N_PAIRES, `${m} ${mode}`);
      assert.deepEqual(saisie, contratRoles(loadRoles(dossier, { mode })), `${m} ${mode}`);
    }
  }
});
