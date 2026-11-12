// @ts-check
/**
 * Lot M : migration.md, écrit par reduce à chaque réduction. Comparé à
 * fixtures/marque-demo/expected-migration.json, écrit avant le code : sur les
 * trois pages en désordre (instantané de la table du lot B) et sur la page des
 * pièges (L1, lien sans soulignement dans un paragraphe).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-migration.json', import.meta.url), 'utf8'));
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const TOL = 0.01;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {{ data: any, md: string }} */
const desordre = { data: null, md: '' };
/** @type {{ data: any, md: string }} */
const pieges = { data: null, md: '' };

before(async () => {
  servers = await startFixtureServers();
  const common = {
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    now: new Date(2026, 10, 12, 14, 0),
  };
  const [first, ...rest] = E.conditions.pages;
  const [d] = await runReduce({ ...common, addresses: [servers.origin + first, ...rest], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  desordre.data = d.migration;
  desordre.md = await readFile(d.files[2], 'utf8');
  const [p] = await runReduce({ ...common, addresses: [servers.origin + '/pieges/pieges.html'], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  pieges.data = p.migration;
  pieges.md = await readFile(p.files[2], 'utf8');
});

after(async () => servers?.close());

test('expected-migration.json : contrastes recalculés avec culori', () => {
  const l = E.pieges.exceptions.ununderlinedLinks;
  assert.ok(Math.abs(wcagContrast(l.value, l.neighbor) - l.ratio) < 5e-4);
  for (const p of E.desordre.exceptions.onSolid.pairs) assert.ok(wcagContrast(p.text, p.bg) < 4.5, `${p.text} sur ${p.bg}`);
});

test('migration.md : table, trois sections et cinq exceptions nommées', () => {
  for (const h of ['## Table', '## Appliqué (auto, proche, correction)', '## Décisions en attente', '## Hors table', '## Exceptions'])
    assert.ok(desordre.md.includes(h), h);
  for (const h of ['Liens sans soulignement dans un paragraphe', 'onSolid', 'États non lus', 'Élément injecté après le chargement', 'Égalités tranchées en silence'])
    assert.ok(desordre.md.includes(`### ${h}`) || desordre.md.includes(h), h);
  assert.ok(desordre.md.includes('| famille | valeur | usage | jeton | classe | origine CSS | éléments |'));
});

test(`désordre : ${E.desordre.table.rows} lignes valeur × usage, dont ${E.desordre.table.unchanged} inchangées`, () => {
  assert.equal(desordre.data.rows.length, E.desordre.table.rows);
  assert.equal(desordre.data.unchanged, E.desordre.table.unchanged);
});

for (const [k, label] of [['applied', 'appliqué'], ['pending', 'décisions en attente'], ['outOfTable', 'hors table']]) {
  test(`désordre, section ${label} : ${JSON.stringify(E.desordre.sections[k])}`, () => {
    const want = E.desordre.sections[k];
    const got = desordre.data.sections[k];
    assert.equal(got.total, want.total, `${label} : total`);
    for (const f of ['colors', 'spacing', 'fontSizes', 'radii']) if (f in want) assert.equal(got[f], want[f], `${label} : ${f}`);
    for (const r of want.rows ?? []) {
      const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === r.family && x.value === r.value);
      assert.ok(row, `${r.value} absente`);
      assert.ok(String(row.reason).includes(r.reason), `${r.value} : motif « ${row.reason} »`);
    }
  });
}

test('désordre : jetons DTCG repris de primitives.tokens.json', () => {
  for (const t of E.desordre.tokens) {
    const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === t.family && x.value === t.value && (!t.usage || x.usage === t.usage));
    assert.ok(row, `${t.family} ${t.value} ${t.usage ?? ''} absente`);
    assert.equal(row.token, t.token, `${t.value} ${t.usage ?? ''}`);
  }
  assert.ok(desordre.data.rows.every((/** @type {any} */ r) => r.token === '—' || r.token === 'jeton absent' || /^(couleur|espace|taille-texte|rayon)\./.test(r.token)));
});

test('désordre : origine CSS (fichier:ligne de la règle)', () => {
  for (const o of E.desordre.origins) {
    const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === o.family && x.value === o.value && (!o.usage || x.usage === o.usage));
    assert.ok(row, `${o.value} absente`);
    assert.equal(row.origin, o.origin, o.value);
  }
});

test('désordre : exceptions', () => {
  const e = desordre.data.exceptions;
  const want = E.desordre.exceptions;
  assert.equal(e.links.length, want.ununderlinedLinks.count, 'liens sans soulignement');
  assert.deepEqual(
    e.onSolid.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    want.onSolid.pairs.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    'texte sur plein à poser en onSolid',
  );
  assert.equal(e.states.length, want.unreadStates.count, 'états non lus');
  for (const v of want.unreadStates.values) {
    const s = e.states.find((/** @type {any} */ x) => x.value === v.value);
    assert.ok(s?.contexts.some((/** @type {any} */ c) => c.state === v.state && c.property === v.property), `${v.value} ${v.state}`);
  }
  assert.equal(e.injected, null, 'injecté : limite connue, sans compte');
  assert.deepEqual(
    e.ties.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    want.silentTies.rows.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    'égalités tranchées en silence',
  );
});

test('pièges : L1, un lien sans soulignement dans un paragraphe', () => {
  const want = E.pieges.exceptions.ununderlinedLinks;
  const links = pieges.data.exceptions.links;
  assert.equal(links.length, want.count);
  assert.equal(links[0].color, want.value);
  assert.equal(links[0].neighbor, want.neighbor);
  assert.ok(Math.abs(links[0].ratio - want.ratio) <= TOL, `contraste ${links[0].ratio}`);
  assert.ok(pieges.md.includes('### Liens sans soulignement dans un paragraphe : 1'));
});
