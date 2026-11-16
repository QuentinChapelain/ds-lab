// @ts-check
/**
 * Revue de code, lot 6, point 1 (docs/attendus/revue-lot-6-structure.md) : une consigne structurée (src/report/consigne.js),
 * lue par migration.md et par modifications.json. modifications.json ne relit plus la prose. Sans navigateur.
 *
 * Attendus écrits à la main, sur une table de trois lignes de marge (M1 appliquée, M2 en attente, M3 refusée), un composant
 * tiers et un fichier de jetons vide :
 *   K1 chaque section en liste de migration.md (CHANGE AUSSI, NE TOUCHE PAS, SIGNALE SANS MODIFIER) est son titre, puis
 *      « - » et chaque entrée de la consigne, puis une ligne vide ; VÉRIFICATION, son titre puis ses entrées ;
 *   K2 modifications.json reprend telles quelles les entrées CHANGE AUSSI et SIGNALE SANS MODIFIER de la consigne, et sa
 *      VÉRIFICATION, où la phrase sur CONFLITS (section absente de reste.md) dit « déclarations marquées » ;
 *   K3 le texte de la consigne vidé ou changé ne change pas modifications.json : il ne lit que la structure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMigration } from '../src/report/migration.js';
import { buildModifications } from '../src/report/modifications.js';

const table = () => ({
  families: {
    spacing: {
      rows: [
        { id: 'M1', old: '20px', new: '16px', class: 'proche', usage: 'marge', count: 1 },
        { id: 'M2', old: '18px', new: '24px', class: 'décision', usage: 'marge', count: 1, candidates: [{ value: '24px', delta: 6 }, { value: '12px', delta: 6 }] },
        { id: 'M3', old: '10px', new: '12px', class: 'proche', usage: 'marge', count: 1 },
      ],
    },
  },
  thirdParty: ['.tiers'],
});
const meta = { host: 'a.test', stamp: '16/11/2026', viewport: { width: 1366, height: 900 }, target: 'cible.json', tokens: 'jetons.tokens.json', pages: ['/'], decisions: null };
const migration = () => buildMigration({ table: table(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, tokens: {}, decisions: { 'spacing|10px|marge': false }, meta });

/** Lignes d'une section de la consigne, de son titre à la ligne vide qui la ferme. @param {string[]} lines @param {string} titre */
const bloc = (lines, titre) => {
  const i = lines.indexOf(titre);
  assert.ok(i >= 0, titre);
  const j = lines.indexOf('', i);
  return lines.slice(i, j < 0 ? undefined : j + 1);
};

test('K1 migration.md : chaque section en liste est écrite depuis les entrées de la consigne', () => {
  const { data } = migration();
  const consigne = data.agent;
  const { lines } = consigne;
  for (const [titre, entrees] of /** @type {const} */ ([
    ['CHANGE AUSSI', consigne.changeAussi],
    ['NE TOUCHE PAS', consigne.neTouchePas],
    ['SIGNALE SANS MODIFIER', consigne.signale],
  ])) {
    assert.ok(entrees.length > 0, titre);
    assert.deepEqual(bloc(lines, titre), [titre, ...entrees.map((/** @type {string} */ x) => `- ${x}`), ''], titre);
  }
  assert.deepEqual(lines.slice(lines.indexOf('VÉRIFICATION')), ['VÉRIFICATION', ...consigne.verification]);
  assert.ok(consigne.neTouchePas.includes('Composant tiers : .tiers et tout ce qu\'il contient.'));
});

test('K2 modifications.json : entrées de la consigne, VÉRIFICATION sans renvoi à CONFLITS', () => {
  const { data, modifications } = migration();
  const consigne = data.agent;
  const b = /** @type {any} */ (modifications).brief;
  assert.deepEqual(b.changeAussi, consigne.changeAussi);
  assert.deepEqual(b.signale, consigne.signale);
  assert.ok(consigne.verification.some((/** @type {string} */ l) => l.includes('Les déclarations de CONFLITS et les unités relatives')));
  assert.equal(b.verification.length, consigne.verification.length);
  assert.ok(!b.verification.some((/** @type {string} */ l) => l.includes('CONFLITS')), b.verification.join('\n'));
  assert.ok(b.verification.some((/** @type {string} */ l) => l.includes('Les déclarations marquées /* ds-lab : conflit … */ et les unités relatives')));
  assert.ok(b.neTouchePas.includes('Composant tiers : .tiers et tout ce qu\'il contient.'));
});

test('K3 le texte de la consigne vidé ou changé ne change pas modifications.json', () => {
  const { data, modifications } = migration();
  const consigne = data.agent;
  const { lines } = consigne;
  // Parties de la table, comme buildMigration les découpe.
  const st = (/** @type {string[]} */ ...x) => data.rows.filter((/** @type {any} */ r) => x.includes(r.status));
  const s = { applied: st('appliquée', 'décidée'), pending: st('en attente'), refused: st('refusée'), outOfTable: st('hors table'), attached: [] };
  const vide = buildModifications({ d: { ...data, agent: { ...consigne, lines: [], markdown: '' } }, s, consigne: { ...consigne, lines: [], markdown: '' }, tokens: {} });
  assert.deepEqual(vide, modifications);
  const change = buildModifications({ d: data, s, consigne: { ...consigne, lines: lines.map((l) => l.replace('CHANGE AUSSI', 'CHANGE ÉGALEMENT')) }, tokens: {} });
  assert.deepEqual(change, modifications);
});
