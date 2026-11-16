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

// Revue de code du 15/11, lot 2 : une décision écrite sur une ligne « inchangé » l'emporte, pour les quatre lecteurs.
// Table écrite à la main : I1 8px inchangé (dans le composant), décidé à 12px ; I2 10px proche vers 12px (entre
// composants), refusé. Valeurs retenues : I1 12px, I2 10px ; la paire reste inversée (12 dans ≥ 10 entre).
test('V5 ligne « inchangé » avec une décision écrite : même valeur retenue (12px) pour les quatre lecteurs', () => {
  const t = () => ({
    families: {
      spacing: {
        rows: [
          { id: 'I1', old: '8px', new: '8px', class: 'inchangé', usage: 'marge', scope: DANS, count: 1 },
          { id: 'I2', old: '10px', new: '12px', class: 'proche', usage: 'marge', scope: ENTRE, count: 1 },
        ],
      },
    },
  });
  /** @type {Record<string, string | false>} */
  const decisions = { [`spacing|8px|marge|${DANS}`]: '12px', [`spacing|10px|marge|${ENTRE}`]: false };
  assert.deepEqual(mapping(t(), decisions), { spacing: { '8px': '12px' } }, 'mapping');
  const t2 = t();
  const trace = { origin: 'feuille', href: 'https://a.test/s.css', line: 3, selector: '.bloc', written: '8px' };
  const conflicts = attachDeclarations(t2, t2.families.spacing.rows.map((r) => ({ key: `spacing|${r.old}|marge|${r.scope}`, family: 'spacing', property: 'margin-top', page: '/', trace })), decisions);
  assert.deepEqual(Object.fromEntries(conflicts[0].rows.map((/** @type {any} */ r) => [r.id, r.outcome])), { I1: '12px', I2: 'laisse' }, 'outcomeOf');
  const t3 = /** @type {any} */ (t());
  t3.proximity = [{ in: { mode: 'max', extra: 0, parts: ['8px'], scope: DANS, gapPx: 8 }, out: { mode: 'max', extra: 0, parts: ['10px'], scope: ENTRE, gapPx: 10 } }];
  controlAfter(t3, decisions);
  assert.deepEqual(t3.families.spacing.rows[0].control?.after, { in: 12, out: 10 }, 'controlAfter');
  const meta = { host: 'a.test', stamp: '16/11/2026', viewport: { width: 1366, height: 900 }, target: 'cible.json', pages: ['/'], decisions: 'decisions.json' };
  const m = buildMigration({ table: t(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, decisions, meta });
  assert.deepEqual(m.data.rows.map((/** @type {any} */ r) => [r.id, r.status, r.new ?? r.value]), [['I1', 'décidée', '12px'], ['I2', 'refusée', '10px']], 'migration');
});

// Revue de code du 15/11, lot 4 (docs/attendus/revue-lot-4-copies.md, point 3 ; décision de Quentin du 16/11/2026) : une
// décision écrite égale à l'ancienne valeur laisse la ligne, pour les quatre lecteurs. Table écrite à la main : E1 20px
// proche vers 16px (dans le composant), décidé à 20px ; E2 18px décision proposée vers 24px (entre composants), décidé à
// 18px. Valeurs retenues : E1 20px, E2 18px (rien ne change) ; migration : « inchangé » pour les deux (avant : E1
// « appliquée » vers 16px, E2 « en attente » vers 24px) ; la paire reste inversée (20 dans ≥ 18 entre).
const egale = () => ({
  families: {
    spacing: {
      rows: [
        { id: 'E1', old: '20px', new: '16px', class: 'proche', usage: 'marge', scope: DANS, count: 1 },
        { id: 'E2', old: '18px', new: '24px', class: 'décision', usage: 'marge', scope: ENTRE, count: 1 },
      ],
    },
  },
});
/** @type {Record<string, string | false>} */
const EGALE = { [`spacing|20px|marge|${DANS}`]: '20px', [`spacing|18px|marge|${ENTRE}`]: '18px' };

test('V6 mapping : une décision égale à l’ancienne valeur laisse la ligne', () => {
  const m = mapping(egale(), EGALE);
  assert.deepEqual([m.spacing?.['20px'] ?? '20px', m.spacing?.['18px'] ?? '18px'], ['20px', '18px']);
});

// outcomeOf ne se lit que dans un conflit : un témoin E3 (10px proche vers 12px, sans décision) partage la déclaration.
test('V6 outcomeOf : une décision égale à l’ancienne valeur donne « laisse »', () => {
  const t2 = /** @type {any} */ (egale());
  t2.families.spacing.rows.push({ id: 'E3', old: '10px', new: '12px', class: 'proche', usage: 'marge', scope: DANS, count: 1 });
  const trace = { origin: 'feuille', href: 'https://a.test/s.css', line: 3, selector: '.bloc', written: '20px' };
  const conflicts = attachDeclarations(t2, t2.families.spacing.rows.map((/** @type {any} */ r) => ({ key: `spacing|${r.old}|marge|${r.scope}`, family: 'spacing', property: 'margin-top', page: '/', trace })), EGALE);
  assert.deepEqual(Object.fromEntries((conflicts[0]?.rows ?? []).map((/** @type {any} */ r) => [r.id, r.outcome])), { E1: 'laisse', E2: 'laisse', E3: '12px' });
});

test('V6 controlAfter : une décision égale à l’ancienne valeur garde l’ancienne', () => {
  const t3 = /** @type {any} */ (egale());
  t3.proximity = [{ in: { mode: 'max', extra: 0, parts: ['20px'], scope: DANS, gapPx: 20 }, out: { mode: 'max', extra: 0, parts: ['18px'], scope: ENTRE, gapPx: 18 } }];
  controlAfter(t3, EGALE);
  assert.deepEqual(t3.families.spacing.rows[0].control?.after, { in: 20, out: 18 });
});

test('V6 migration : une décision égale à l’ancienne valeur range la ligne en « inchangé »', () => {
  const meta = { host: 'a.test', stamp: '16/11/2026', viewport: { width: 1366, height: 900 }, target: 'cible.json', pages: ['/'], decisions: 'decisions.json' };
  const mg = buildMigration({ table: egale(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, decisions: EGALE, meta });
  assert.deepEqual(mg.data.rows.map((/** @type {any} */ r) => [r.id, r.status, r.new ?? r.value]), [['E1', 'inchangé', '20px'], ['E2', 'inchangé', '18px']]);
});
