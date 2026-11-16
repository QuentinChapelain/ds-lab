// @ts-check
/**
 * D30 (docs/attendus/revue-lot-6-structure.md, point 2) : orchestration et calculs dans leur couche.
 * Sans navigateur ; lecture des imports, sans parseur.
 *
 * Attendus écrits à la main :
 *   L1 src/cli/ ne sert que ses commandes : aucun module de src/ hors de src/cli/ n'en importe ; un test n'importe de
 *      src/cli/reduce.js que l'analyse des arguments (parseReduceArgs). src/cli/login.js, laissé tel quel, garde saveState et
 *      readState, lus par test/login.test.js (KNOWN_ISSUES.md) ;
 *   L2 src/browser/ n'importe que src/browser/ et src/lib/ ; src/apply/ n'importe rien de src/reduce/ ni de src/report/ ;
 *   L3 runReduce et linesOf dans src/reduce/run.js ; couplingsOf et simulationCouplings dans src/reduce/pleins.js ; unitOf
 *      dans src/reduce/declarations.js ; declarationId reste dans src/browser/trace.js (lue aussi par la simulation).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

/** @param {string} dir @returns {string[]} */
const fichiers = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiers(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []));

/**
 * Imports relatifs d'un fichier : noms importés et chemin depuis la racine.
 * @param {string} f @returns {{ noms: string[], vers: string }[]}
 */
const imports = (f) =>
  [...readFileSync(f, 'utf8').matchAll(/import\s+(?:\{([^}]*)\}|[\w*\s]+)\s+from\s+'(\.[^']+)'/g)].map((m) => ({
    noms: (m[1] ?? '').split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean),
    vers: relative(ROOT, resolve(dirname(f), m[2])),
  }));

test('L1 src/cli/ : importé par aucun module de src/ ; src/cli/reduce.js, par les tests, seulement pour parseReduceArgs', () => {
  const hors = fichiers(SRC)
    .filter((f) => !f.startsWith(join(SRC, 'cli')))
    .flatMap((f) => imports(f).filter((i) => i.vers.startsWith('src/cli/')).map((i) => `${relative(ROOT, f)} → ${i.vers}`));
  assert.deepEqual(hors, []);
  const tests = fichiers(join(ROOT, 'test')).flatMap((f) =>
    imports(f)
      .filter((i) => i.vers === 'src/cli/reduce.js')
      .flatMap((i) => i.noms.filter((n) => n !== 'parseReduceArgs').map((n) => `${relative(ROOT, f)} : ${n} de ${i.vers}`)),
  );
  assert.deepEqual(tests, []);
});

test('L2 src/browser/ n\'importe que browser/ et lib/ ; src/apply/ ni reduce/ ni report/', () => {
  const browser = fichiers(join(SRC, 'browser')).flatMap((f) => imports(f).filter((i) => !/^src\/(browser|lib)\//.test(i.vers)).map((i) => `${relative(ROOT, f)} → ${i.vers}`));
  assert.deepEqual(browser, []);
  const apply = fichiers(join(SRC, 'apply')).flatMap((f) => imports(f).filter((i) => /^src\/(reduce|report)\//.test(i.vers)).map((i) => `${relative(ROOT, f)} → ${i.vers}`));
  assert.deepEqual(apply, []);
});

test('L3 runReduce, couplages et unitOf rangés dans src/reduce/ ; declarationId dans trace.js', async () => {
  const run = await import('../src/reduce/run.js');
  assert.equal(typeof run.runReduce, 'function');
  assert.equal(typeof run.linesOf, 'function');
  const pleins = await import('../src/reduce/pleins.js');
  assert.equal(typeof pleins.couplingsOf, 'function');
  assert.equal(typeof pleins.simulationCouplings, 'function');
  const declarations = await import('../src/reduce/declarations.js');
  assert.equal(typeof declarations.unitOf, 'function');
  const trace = await import('../src/browser/trace.js');
  assert.equal(typeof trace.declarationId, 'function');
  assert.equal('unitOf' in trace, false);
  const migration = await import('../src/report/migration.js');
  assert.equal('couplingsOf' in migration, false);
  const cli = readFileSync(join(SRC, 'cli', 'reduce.js'), 'utf8');
  assert.doesNotMatch(cli, /export (async )?(function|const) (runReduce|linesOf)\b/);
});
