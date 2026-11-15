// @ts-check
/**
 * Séance 3c, lot 2 : contrôle des espacements par relation (src/tokens/espacements.js, npm run espacements).
 *
 * Attendu écrit à la main avant le code, d'après la séance 3c du 15/11/2026 :
 *   les quatre ecart, dans l'ordre dans-composant, entre-composants, entre-groupes, section, sont
 *   strictement croissants ; un voisin égal ou plus petit est un échec, code de sortie 1 ;
 *   le rapport entre voisins (b / a) est affiché, jamais contrôlé ;
 *   marge-interieure.composant est affichée, hors contrôle ;
 *   Orbe Café : 4, 16, 24, 48 px ; rapports 4 ; 1,5 ; 2 ; aucun échec, code de sortie 0 ;
 *   rouge (deux rôles égaux) : entre-groupes → {espace.16} ; 4, 16, 16, 48 ; un échec,
 *     entre-composants / entre-groupes, rapport 1 ;
 *   rouge (ordre inversé) : entre-composants → {espace.24}, entre-groupes → {espace.16} ;
 *     4, 24, 16, 48 ; un échec, entre-composants / entre-groupes, rapport 0,67 (16 / 24 arrondi
 *     au centième) ; les deux autres voisins conformes (rapports 6 et 3) ;
 *   lot 4 (décision du 15/11/2026) : une valeur en étroit ($extensions["ds-lab.etroit"]) doit rester
 *     strictement supérieure à la valeur de l'ecart précédent et inférieure ou égale à sa valeur large ;
 *     sinon échec, code de sortie 1 ; Orbe Café : ecart.section 32 px sous 600 px, > 24 et ≤ 48, conforme ;
 *     rouge : étroit → {espace.24} (égal à entre-groupes) ; étroit → {espace.64} (au-dessus de 48) ;
 *   règle de proximité (décision du 15/11/2026) : ecart.entre-composants vaut au moins le double de
 *     ecart.dans-composant, « pour qu'on voie à quel champ appartient un libellé ou un message » ;
 *     statut : régularité observée dans les systèmes lus, pas une norme ; la raison et le statut sont
 *     écrits dans la sortie et dans la $description de ecart.entre-composants ; échec et code 1 si le
 *     rapport est sous 2 ; les autres rapports restent affichés sans seuil ;
 *     vert : 4 et 16, rapport 4 ; rouge : dans-composant → {espace.12}, 12 et 16, rapport 1,33, l'ordre
 *     strict reste conforme (12 < 16 < 24 < 48) ;
 *   séance 3c, typo (15/11/2026) : la sortie liste aussi les primitives espace.* sans rôle, affichées, non
 *     contrôlées ; une primitive citée seulement par une valeur en étroit compte comme utilisée ;
 *     Orbe Café : espace.0, espace.8, espace.12, espace.64 (espace.32 sert à ecart.section en étroit).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { espacements } from '../src/tokens/espacements.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIR = join(ROOT, 'tokens', 'orbe-cafe');
const load = (/** @type {string} */ f) => JSON.parse(readFileSync(join(DIR, f), 'utf8'));
const prims = load('primitives.tokens.json');

/** Lance la commande sur une couche sémantique donnée (fichier temporaire hors dépôt). @param {any} [sem] */
function run(sem) {
  const args = [join(ROOT, 'src', 'cli', 'espacements.js')];
  if (sem) {
    const f = join(mkdtempSync(join(tmpdir(), 'ds-lab-3c-')), 'semantique.tokens.json');
    writeFileSync(f, JSON.stringify(sem));
    args.push('--semantique', f);
  }
  return spawnSync(process.execPath, args, { encoding: 'utf8' });
}
/** @param {(s: any) => void} edit */
const variant = (edit) => {
  const s = load('semantique.tokens.json');
  edit(s);
  return s;
};
/** @param {ReturnType<typeof espacements>} r */
const values = (r) => r.ecarts.map((e) => e.px);

test('3c vert : Orbe Café, 4 < 16 < 24 < 48, rapports affichés, code 0', () => {
  const r = espacements(load('semantique.tokens.json'), prims);
  assert.deepEqual(values(r), [4, 16, 24, 48]);
  assert.deepEqual(r.ecarts.map((e) => e.role), ['ecart.dans-composant', 'ecart.entre-composants', 'ecart.entre-groupes', 'ecart.section']);
  assert.deepEqual(r.voisins.map((v) => v.rapport), [4, 1.5, 2]);
  assert.deepEqual(r.fails, []);
  assert.deepEqual(r.horsControle.map((e) => [e.role, e.px]), [['marge-interieure.composant', 16]]);
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.match(p.stdout, /✓ ecart\.dans-composant < ecart\.entre-composants : 4 → 16 px, rapport 4\n/);
  assert.match(p.stdout, /✓ ecart\.entre-composants < ecart\.entre-groupes : 16 → 24 px, rapport 1,5\n/);
  assert.match(p.stdout, /✓ ecart\.entre-groupes < ecart\.section : 24 → 48 px, rapport 2\n/);
  assert.match(p.stdout, /marge-interieure\.composant +16 px/);
  assert.match(p.stdout, /3 paires de voisins, aucune en échec\./);
  assert.doesNotMatch(p.stdout, /✗/);
  assert.deepEqual(r.sansRole, ['espace.0', 'espace.8', 'espace.12', 'espace.64']);
  assert.match(p.stdout, /primitives sans rôle \(affiché, non contrôlé\)\n {2}espace\.0, espace\.8, espace\.12, espace\.64\n/);
});

test('3c lot 4 vert : ecart.section en étroit, 32 px sous 600 px, > 24 et ≤ 48, code 0', () => {
  const r = espacements(load('semantique.tokens.json'), prims);
  assert.deepEqual(
    r.etroits.map((e) => ({ role: e.role, px: e.px, alias: e.alias, sous: e.sous, precedent: e.precedent, large: e.large, ok: e.ok })),
    [{ role: 'ecart.section', px: 32, alias: '{espace.32}', sous: 600, precedent: 24, large: 48, ok: true }],
  );
  assert.equal(r.ecarts.find((e) => e.role === 'ecart.section')?.px, 48, 'la valeur large ne change pas');
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.match(p.stdout, /✓ ecart\.section sous 600 px \[H\] : 32 px \{espace\.32\} ; > ecart\.entre-groupes 24 px : oui ; ≤ 48 px : oui\n/);
  assert.match(p.stdout, /1 valeur en étroit, aucune en échec\./);
});

test('3c lot 4 rouge : valeur en étroit égale à entre-groupes, ou au-dessus de la valeur large, code 1', () => {
  for (const [alias, px, sup, inf] of /** @type {const} */ ([['{espace.24}', 24, 'non', 'oui'], ['{espace.64}', 64, 'oui', 'non']])) {
    const sem = variant((s) => { s.ecart.section.$extensions['ds-lab.etroit'].valeur = alias; });
    const r = espacements(sem, prims);
    assert.deepEqual(r.fails, [], `${alias} : les voisins larges restent conformes`);
    assert.deepEqual(r.etroits.map((e) => [e.px, e.ok]), [[px, false]], alias);
    const p = run(sem);
    assert.equal(p.status, 1, p.stdout + p.stderr);
    assert.match(p.stdout, new RegExp(`✗ ecart\\.section sous 600 px \\[H\\] : ${px} px \\{espace\\.${px}\\} ; > ecart\\.entre-groupes 24 px : ${sup} ; ≤ 48 px : ${inf}\\n`));
    assert.match(p.stdout, /1 valeur en étroit, 1 en échec\./);
  }
});

test('3c rouge : deux rôles égaux (entre-composants = entre-groupes = 16), code 1', () => {
  const sem = variant((s) => { s.ecart['entre-groupes'].$value = '{espace.16}'; });
  const r = espacements(sem, prims);
  assert.deepEqual(values(r), [4, 16, 16, 48]);
  assert.deepEqual(r.fails.map((v) => [v.de, v.vers, v.rapport]), [['ecart.entre-composants', 'ecart.entre-groupes', 1]]);
  const p = run(sem);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, /✗ ecart\.entre-composants < ecart\.entre-groupes : 16 → 16 px, rapport 1\n/);
  assert.match(p.stdout, /3 paires de voisins, 1 en échec\./);
});

test('3c rouge : ordre inversé (entre-composants 24, entre-groupes 16), code 1', () => {
  const sem = variant((s) => {
    s.ecart['entre-composants'].$value = '{espace.24}';
    s.ecart['entre-groupes'].$value = '{espace.16}';
  });
  const r = espacements(sem, prims);
  assert.deepEqual(values(r), [4, 24, 16, 48]);
  assert.deepEqual(r.voisins.map((v) => [v.ok, v.rapport]), [[true, 6], [false, 0.67], [true, 3]]);
  assert.deepEqual(r.fails.map((v) => [v.de, v.vers]), [['ecart.entre-composants', 'ecart.entre-groupes']]);
  const p = run(sem);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.match(p.stdout, /✗ ecart\.entre-composants < ecart\.entre-groupes : 24 → 16 px, rapport 0,67\n/);
});

const RAISON = "pour qu'on voie à quel champ appartient un libellé ou un message";
const STATUT = 'régularité observée dans les systèmes lus, pas une norme';

test('3c règle de proximité vert : 4 et 16, au moins le double, code 0', () => {
  const sem = load('semantique.tokens.json');
  const r = espacements(sem, prims);
  assert.deepEqual(
    r.regles.map((g) => ({ de: g.de, vers: g.vers, a: g.a, b: g.b, min: g.min, rapport: g.rapport, ok: g.ok, raison: g.raison, statut: g.statut })),
    [{ de: 'ecart.dans-composant', vers: 'ecart.entre-composants', a: 4, b: 16, min: 2, rapport: 4, ok: true, raison: RAISON, statut: STATUT }],
  );
  const d = sem.ecart['entre-composants'].$description;
  assert.ok(d.includes(RAISON) && d.includes(STATUT), `description : ${d}`);
  const p = run();
  assert.equal(p.status, 0, p.stdout + p.stderr);
  assert.ok(p.stdout.includes(`  ✓ ecart.entre-composants ≥ 2 × ecart.dans-composant : 16 px pour 4 px, rapport 4 ; ${RAISON} (${STATUT})\n`), p.stdout);
  assert.match(p.stdout, /1 règle de proximité, aucune en échec\./);
});

test('3c règle de proximité rouge : 12 et 16, rapport 1,33 sous 2, code 1', () => {
  const sem = variant((s) => { s.ecart['dans-composant'].$value = '{espace.12}'; });
  const r = espacements(sem, prims);
  assert.deepEqual(r.fails, [], "l'ordre strict reste conforme");
  assert.deepEqual(r.regles.map((g) => [g.a, g.b, g.rapport, g.ok]), [[12, 16, 1.33, false]]);
  const p = run(sem);
  assert.equal(p.status, 1, p.stdout + p.stderr);
  assert.ok(p.stdout.includes(`  ✗ ecart.entre-composants ≥ 2 × ecart.dans-composant : 16 px pour 12 px, rapport 1,33 ; ${RAISON} (${STATUT})\n`), p.stdout);
  assert.match(p.stdout, /1 règle de proximité, 1 en échec\./);
  assert.match(p.stdout, /✓ ecart\.entre-composants < ecart\.entre-groupes : 16 → 24 px, rapport 1,5\n/, 'les autres rapports restent affichés sans seuil');
});
