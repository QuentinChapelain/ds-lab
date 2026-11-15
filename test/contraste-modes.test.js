// @ts-check
/**
 * Étape 4b, lot 3 : contrôle de contraste par mode (docs/attendus/etape-4b-contextes.md, lot 3 réduit).
 * Attendus écrits à la main avant le code :
 *   C1 npm run contraste --mode clair : même sortie que sans option ; --mode sombre, --largeur etroit acceptés ;
 *      mode inconnu : erreur d'usage, code 2 ;
 *   C2 les 4 marques fictives sortent en 0 dans les deux modes et dans les deux largeurs ; 70 paires (66 + les 4
 *      bordures de statut sur fond.surface) ;
 *   C3 bordure.erreur, .succes, .avertissement, .info sur fond.surface : paires de type bordure (3:1), déclarées ;
 *   C4 la saisie dit le mode d'un refus : avec un seuil de 3,15 sur bordure.forte sur fond.surface (clair 3,21:1,
 *      sombre 3,10:1 pour une marque quelconque), le seul motif est « contraste (sombre) : bordure.forte sur
 *      fond.surface, 3,10:1 < 3,15:1 » ; le contrat sombre de la saisie est celui que lit le resolver.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { saisir, chargerCommun } from '../src/tokens/saisie.js';
import { charger } from './helpers/jetons.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MARQUES = ['orbe-cafe', 'atelier-lavandine', 'ecume-et-sel', 'grenat-papeterie'];
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
  assert.match(sombre.stdout, /^mode sombre, largeur large\n/);
  assert.equal(run('--largeur', 'etroit').status, 0);
  const faux = run('--mode', 'nuit');
  assert.equal(faux.status, 2);
  assert.match(faux.stderr, /contexte inconnu mode=nuit/);
});

test('C2 les 4 marques fictives : 0 échec dans les deux modes et les deux largeurs, 70 paires', () => {
  for (const m of MARQUES)
    for (const mode of ['clair', 'sombre'])
      for (const largeur of ['large', 'etroit']) {
        const p = run('--marque', join('tokens', m), '--mode', mode, '--largeur', largeur);
        assert.equal(p.status, 0, `${m} ${mode} ${largeur}\n${p.stdout}`);
        assert.match(p.stdout, /70 paires de rôles, 0 paire en échec/, `${m} ${mode} ${largeur}`);
      }
});

test('C3 bordures de statut sur fond.surface : paires déclarées, type bordure', () => {
  const paires = charger('paires.json').paires;
  for (const s of ['erreur', 'succes', 'avertissement', 'info'])
    assert.ok(paires.some((/** @type {any} */ p) => p.devant === `bordure.${s}` && p.fond === 'fond.surface' && p.type === 'bordure'), s);
  assert.equal(paires.length, 70);
});

test('C4 la saisie dit le mode du refus ; contrat sombre de la saisie = contrat du resolver', () => {
  const commun = chargerCommun();
  const communSombre = chargerCommun({ mode: 'sombre' });
  /** @param {any} c */
  const durci = (c) => {
    const paires = structuredClone(c.paires);
    paires.seuils.essai = 3.15;
    for (const p of paires.paires) if (p.devant === 'bordure.forte' && p.fond === 'fond.surface') p.type = 'essai';
    return { ...c, paires };
  };
  const r = saisir({ nom: 'Essai', primaire: '#2b4c7e', polices: POLICES }, { dossier: '/ailleurs', commun: durci(commun), communSombre: durci(communSombre) });
  assert.deepEqual(r.motifs, ['contraste (sombre) : bordure.forte sur fond.surface, 3,10:1 < 3,15:1']);
});
