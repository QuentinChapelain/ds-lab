// @ts-check
/**
 * Revue de code du 15/11, lot 0 (docs/attendus/revue-lot-0-filets.md, point 2) : valeur retenue après décision.
 * La règle « décision écrite, sinon refus, sinon proposition appliquée, sinon valeur actuelle » est lue en quatre
 * endroits de src/ : mapping (simulation), outcomeOf (conflits de déclarations), controlAfter (contrôle de proximité
 * après décisions) et le statut de migration. Sans navigateur.
 *
 * Attendus écrits à la main, sur une table de trois lignes de marge et deux décisions :
 *   M1 20px, proche vers 16px, sans décision        → retenue 16px (appliquée) ;
 *   M2 18px, décision proposée vers 24px, décidée 12px → retenue 12px (décidée) ;
 *   M3 10px, proche vers 12px, refusée (false)       → retenue 10px (refusée, laissée telle quelle).
 * Lectures indirectes, faute d'export :
 *   outcomeOf n'est pas exporté (src/reduce/declarations.js) : lu par attachDeclarations, qui ne montre l'issue que dans
 *     un conflit ; les trois lignes partagent donc une même déclaration (écrite en px), d'issues toutes différentes ;
 *   controlAfter ne montre la valeur retenue que si la hiérarchie reste inversée : M1 et M3 dans le composant (marges
 *     additionnées : 16 + 10 = 26), M2 entre composants (12) ; 26 ≥ 12, la paire reste inversée.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapping, controlAfter } from '../src/reduce/propose.js';
import { attachDeclarations } from '../src/reduce/declarations.js';
import { buildMigration } from '../src/report/migration.js';

const DANS = 'dans le composant';
const ENTRE = 'entre composants';
/** Table écrite à la main, neuve à chaque lecture (controlAfter et attachDeclarations posent des champs). */
const table = () => ({
  families: {
    spacing: {
      rows: [
        { id: 'M1', old: '20px', new: '16px', class: 'proche', usage: 'marge', scope: DANS, count: 1 },
        { id: 'M2', old: '18px', new: '24px', class: 'décision', usage: 'marge', scope: ENTRE, count: 1 },
        { id: 'M3', old: '10px', new: '12px', class: 'proche', usage: 'marge', scope: DANS, count: 1 },
      ],
    },
  },
});
/** @type {Record<string, string | false>} */
const DECISIONS = { [`spacing|18px|marge|${ENTRE}`]: '12px', [`spacing|10px|marge|${DANS}`]: false };
/** Valeur retenue, écrite à la main. */
const RETENUE = { M1: '16px', M2: '12px', M3: '10px' };
const ANCIENNE = { M1: '20px', M2: '18px', M3: '10px' };

test('V1 mapping : la simulation reçoit la valeur retenue de chaque ligne', () => {
  const m = mapping(table(), DECISIONS);
  const retenue = Object.fromEntries(Object.entries(ANCIENNE).map(([id, old]) => [id, m.spacing[old] ?? old]));
  assert.deepEqual(retenue, RETENUE);
});

test('V2 outcomeOf (par attachDeclarations) : même valeur retenue, « laisse » pour le refus', () => {
  const t = table();
  const trace = { origin: 'feuille', href: 'https://a.test/s.css', line: 3, selector: '.bloc', written: '20px' };
  const records = t.families.spacing.rows.map((r) => ({ key: `spacing|${r.old}|marge|${r.scope}`, family: 'spacing', property: 'margin-top', page: '/', trace }));
  const conflicts = attachDeclarations(t, records, DECISIONS);
  assert.equal(conflicts.length, 1, 'une déclaration partagée, trois issues');
  const issues = Object.fromEntries(conflicts[0].rows.map((/** @type {any} */ r) => [r.id, r.outcome]));
  assert.deepEqual(issues, { M1: '16px', M2: '12px', M3: 'laisse' });
  const retenue = Object.fromEntries(Object.entries(issues).map(([id, o]) => [id, o === 'laisse' ? ANCIENNE[/** @type {'M1'} */ (id)] : o]));
  assert.deepEqual(retenue, RETENUE);
});

test('V3 controlAfter : la paire est recalculée avec les valeurs retenues (16 + 10 dans, 12 entre)', () => {
  const t = /** @type {any} */ (table());
  t.proximity = [{ in: { mode: 'sum', extra: 0, parts: ['20px', '10px'], scope: DANS, gapPx: 30 }, out: { mode: 'max', extra: 0, parts: ['18px'], scope: ENTRE, gapPx: 18 } }];
  controlAfter(t, DECISIONS);
  for (const r of t.families.spacing.rows) {
    assert.deepEqual(r.control?.after, { in: 16 + 10, out: 12 }, r.id);
    assert.equal(r.control?.signal, 'la hiérarchie reste inversée après les décisions', r.id);
  }
});

test('V4 statut de migration : appliquée, décidée, refusée, avec la même valeur retenue', () => {
  const meta = { host: 'a.test', stamp: '15/11/2026', viewport: { width: 1366, height: 900 }, target: 'cible.json', pages: ['/'], decisions: 'decisions.json' };
  const m = buildMigration({ table: table(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, decisions: DECISIONS, meta });
  const rows = m.data.rows.map((/** @type {any} */ r) => [r.id, r.status, r.new ?? r.value]);
  assert.deepEqual(rows, [
    ['M1', 'appliquée', RETENUE.M1],
    ['M2', 'décidée', RETENUE.M2],
    ['M3', 'refusée', RETENUE.M3],
  ]);
});
