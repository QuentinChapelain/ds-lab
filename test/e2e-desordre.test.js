// @ts-check
/**
 * Lot E : audit puis reduce sur les trois pages en désordre de la marque
 * fictive (desordre/carte, compte, gestion), comparés à
 * fixtures/marque-demo/expected-desordre.json, écrit avant les pages et
 * jamais recalé. Un test par piège et par côté (table, audit) : un écart
 * entre l'outil et l'attendu reste visible, en échec. Les entrées « lotB »
 * (rangement valeur × usage) sont en attente (todo), pas en échec. Une valeur
 * qui porte un « afterB » (lot B : R2, R4) est jugée sur lui.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { differenceEuclidean, wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runAudit } from '../src/audit/run.js';
import { runReduce } from '../src/cli/reduce.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-desordre.json', import.meta.url), 'utf8'));
const TOL = 0.01;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let audit;
/** @type {any} */
let table;

before(async () => {
  servers = await startFixtureServers();
  const [first, ...rest] = E.conditions.pages;
  const addresses = [servers.origin + first, ...rest];
  const common = { addresses, sourcesPath: `${FIXTURE_DIR}sources.json`, viewport: E.conditions.viewport, waitMs: 100, now: new Date(2026, 10, 11, 22, 0) };
  const auditRun = await runAudit({ ...common, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-desordre-audit-')) });
  audit = JSON.parse(await readFile(join(auditRun[0].dir, 'audit.json'), 'utf8'));
  const reduceRun = await runReduce({ ...common, targetPath: `${FIXTURE_DIR}cible.json`, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-desordre-reduce-')) });
  table = reduceRun[0].table;
});

after(async () => servers?.close());

/** @param {string} family @param {string} old */
const row = (family, old) => table.families[family].rows.find((/** @type {any} */ r) => r.old === old);
/** @param {string} family @param {string} old */
const rows = (family, old) => table.families[family].rows.filter((/** @type {any} */ r) => r.old === old);
/** @param {any} c @param {string} page */
const onPage = (c, page) => Object.keys(c.pages ?? {}).some((u) => u.endsWith(`/desordre/${page}.html`));
/** @param {string} family @param {string} value */
const contexts = (family, value) => audit.rendered.families[family]?.values[value]?.contexts ?? [];
/** @param {string} text @param {string} bg */
const pair = (text, bg) => audit.rendered.contrast.pairs.find((/** @type {any} */ p) => p.text === text && p.bg === bg);
/** @param {any[]} values */
const label = (values) => values.map((v) => (typeof v === 'string' ? v : v.value)).join(', ');

/**
 * Classe, cible et égalité d'une ligne de dimension ou de couleur.
 * @param {string} family @param {any} want
 */
function checkRow(family, want) {
  const r = row(family, want.value);
  assert.ok(r, `${want.value} absente de la table`);
  const classes = Array.isArray(want.class) ? want.class : [want.class];
  assert.ok(classes.includes(r.class), `${want.value} : classe « ${r.class} », attendu ${classes.map((c) => `« ${c} »`).join(' ou ')}`);
  if ('new' in want) assert.equal(r.new, want.new, `${want.value} : vers ${r.new}`);
  if (want.deltaE !== undefined) assert.ok(Math.abs(r.delta - want.deltaE) <= TOL, `${want.value} : ΔE ${r.delta}, attendu ${want.deltaE}`);
  if (want.tie) {
    // Lot C : candidats de dimension par valeur ; l'égalité se lit sur les deux plus proches.
    const [a, b] = [...r.candidates].sort((/** @type {any} */ x, /** @type {any} */ y) => x.delta - y.delta);
    assert.equal(a.delta, b.delta, `${want.value} : égalité entre ${a.value} et ${b.value}`);
    assert.deepEqual([a.value, b.value].sort(), [...want.tie].sort());
  }
}

test('expected-desordre.json : ΔE et contrastes recalculés avec culori', () => {
  const dOklab = differenceEuclidean('oklab');
  let checked = 0;
  for (const e of E.colors) {
    for (const v of e.values) {
      if (typeof v !== 'object' || v.deltaE === undefined) continue;
      assert.ok(Math.abs(100 * dOklab(v.value, v.new) - v.deltaE) < 5e-4, `${e.id} ${v.value} ΔE`);
      checked++;
      for (const c of [v.contrast, v.contrastGraphic, v.contrastAfter].filter(Boolean)) {
        assert.ok(Math.abs(wcagContrast(c.text ?? v.value, c.bg) - c.ratio) < 5e-4, `${e.id} ${v.value} contraste sur ${c.bg}`);
        checked++;
      }
      if (v.deltaEToAnswer) {
        assert.ok(Math.abs(100 * dOklab(v.value, v.deltaEToAnswer.value) - v.deltaEToAnswer.deltaE) < 5e-4, `${e.id} ΔE vers la bonne réponse`);
        checked++;
      }
    }
  }
  assert.ok(checked > 40);
});

test('les trois pages sont mesurées, la cible inchangée', () => {
  assert.equal(audit.pages.filter((/** @type {any} */ p) => !p.error).length, 3);
  for (const f of ['radii', 'spacing', 'fontSizes', 'colors']) assert.ok(table.families[f].rows.length > 0, f);
});

// Couleurs : un test « table » et un test « audit » par piège.
/**
 * Lot B : une valeur qui porte un « afterB » se juge sur lui (classe et règle) ;
 * hors table, elle n'a plus de cible.
 * @param {any} v
 */
const wanted = (v) => {
  if (!v.afterB) return v;
  const out = { value: v.value, class: v.afterB.class };
  if (String(v.afterB.class).startsWith('hors table')) return out;
  return 'new' in v.afterB ? { ...out, new: v.afterB.new } : { ...out, new: v.new, deltaE: v.deltaE };
};
/** @param {any[]} values */
const afterBLabel = (values) => {
  const rules = values.filter((v) => v.afterB).map((v) => `${v.value} ${v.afterB.rule}`);
  return rules.length ? ` (afterB : ${rules.join(', ')})` : '';
};

for (const e of E.colors.filter((/** @type {any} */ x) => !x.class)) {
  test(`${e.id} table : ${label(e.values)}${afterBLabel(e.values)}`, () => {
    for (const v of e.values) {
      checkRow('colors', wanted(v));
      if (v.contrast) {
        const p = pair(v.contrast.text ?? v.value, v.contrast.bg);
        assert.ok(p, `${e.id} : paire ${v.contrast.text ?? v.value} / ${v.contrast.bg} absente de l'audit`);
        assert.ok(Math.abs(p.ratio - v.contrast.ratio) <= TOL, `${e.id} : contraste ${p.ratio}, attendu ${v.contrast.ratio}`);
      }
    }
  });
  test(`${e.id} audit : usages (${e.uses.map((/** @type {any} */ u) => `${u.page} ${u.property}`).join(', ')})`, () => {
    for (const u of e.uses) {
      const value = u.value ?? e.values[0].value;
      if (u.state) {
        const s = audit.rendered.states.colors[value];
        assert.ok(s, `${value} absente des états forcés`);
        assert.ok(
          s.contexts.some((/** @type {any} */ c) => c.state === u.state && c.property === u.property && c.role === u.role),
          `${value} : ${u.state} ${u.property} / ${u.role} absent`,
        );
        continue;
      }
      assert.ok(
        contexts('colors', value).some((/** @type {any} */ c) => c.property === u.property && c.role === u.role && onPage(c, u.page)),
        `${value} : ${u.property} / ${u.role} absent de ${u.page} (${u.usage})`,
      );
    }
  });
  if (e.lotB) {
    // Remplacé par l'afterB de la même entrée : R4 range toute la valeur hors table, en une ligne.
    const by = e.values.find((/** @type {any} */ v) => v.afterB)?.afterB;
    test(`${e.id} lot B : une ligne par usage`, by ? { skip: `remplacé par ${e.id} afterB (${by.rule})` } : { todo: e.lotB }, () => {
      assert.ok(rows('colors', e.values[0].value).length >= e.uses.length);
    });
  }
}

test('C20 contenu : avatars et fonds d’attente comptés en contenu, absents de la table (R18)', () => {
  const c20 = E.colors.find((/** @type {any} */ x) => x.id === 'C20');
  for (const v of c20.values) {
    const got = audit.rendered.families.colors.values[v.value];
    assert.ok(got, `${v.value} absente de l'audit`);
    assert.equal(got.content, got.count, `${v.value} : ${got.content} occurrence(s) de contenu sur ${got.count}`);
    assert.ok(got.contexts.some((/** @type {any} */ c) => c.property === c20.property && onPage(c, v.page)), `${v.value} sur ${v.page}`);
    assert.equal(row('colors', v.value), undefined, `${v.value} ne doit pas être dans la table`);
  }
});

test('C21 tiers : bandeau de cookies écarté sur les trois pages (R17)', () => {
  const c21 = E.colors.find((/** @type {any} */ x) => x.id === 'C21');
  const T = audit.rendered.thirdParty;
  assert.deepEqual(T.invalid, []);
  assert.equal(T.selectors[`div${c21.selector}`], c21.pages.length, 'un bandeau par page');
  for (const hex of c21.values) {
    assert.equal(audit.rendered.families.colors.values[hex], undefined, `${hex} ne doit pas être rendue`);
    assert.equal(row('colors', hex), undefined, `${hex} ne doit pas être dans la table`);
  }
});

// Dimensions : espacements, tailles, rayons.
const AUDIT_FAMILY = /** @type {Record<string, string>} */ ({ fontSizes: 'fontSizes', radii: 'radii' });
for (const [family, entries] of /** @type {const} */ ([['spacing', E.spacing], ['fontSizes', E.fontSizes], ['radii', E.radii]])) {
  for (const e of entries) {
    test(`${e.id} table : ${label(e.values)}${afterBLabel(e.values)}`, () => {
      for (const v of e.values) checkRow(family, wanted(v));
    });
    test(`${e.id} audit : usages`, () => {
      for (const u of e.uses) {
        const value = u.value ?? e.values[0].value;
        const f = u.family ?? AUDIT_FAMILY[family];
        assert.ok(contexts(f, value).some((/** @type {any} */ c) => onPage(c, u.page)), `${value} absent de ${f} sur ${u.page} (${u.usage})`);
      }
    });
    if (e.lotB) {
      test(`${e.id} lot B : une ligne par usage`, { todo: e.lotB }, () => {
        assert.ok(rows(family, e.values[0].value).length >= e.uses.length);
      });
    }
  }
}

test('aucune valeur hors pièges : chaque ligne à revoir ou hors table est un piège de l’attendu', () => {
  /** @type {Record<string, Set<string>>} */
  const listed = { colors: new Set(), spacing: new Set(), fontSizes: new Set(), radii: new Set() };
  for (const e of E.colors) for (const v of e.values) if (typeof v === 'object') listed.colors.add(v.value);
  for (const [f, entries] of /** @type {const} */ ([['spacing', E.spacing], ['fontSizes', E.fontSizes], ['radii', E.radii]]))
    for (const e of entries) for (const v of e.values) listed[f].add(v.value);
  /** @type {string[]} */
  const surprises = [];
  for (const [f, set] of Object.entries(listed))
    for (const r of table.families[f].rows) if (r.class !== 'inchangé' && !set.has(r.old)) surprises.push(`${f} ${r.old} (${r.class})`);
  assert.deepEqual(surprises, []);
});
