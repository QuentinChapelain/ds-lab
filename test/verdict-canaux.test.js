// @ts-check
/**
 * Verdict par ligne décidée sur la page des canaux (docs/attendus/verdict-par-decision.md, décisions de Quentin du
 * 17/11/2026). Page fixtures/marque-demo/canaux/canaux.html, réduite à 390×900 sur cible-valise.json :
 *   - esp-03, retrait 30px → 32px, tenu seulement par un attribut style (.en-ligne) ;
 *   - coul-02, fond #e0e0e0, tenu par .bouton-feuille (canaux.css) et par .bouton-theme, dans un bloc de style
 *     injecté par un script ;
 *   - coul-04, bordure #dadada, écrite dans un raccourci (.cadre { border: 1px solid var(--trait-cadre) }) dont la
 *     variable est posée par l'attribut style de l'élément ;
 *   - coul-03, fond #f2f2f2, tenu par .encart-a (propriété longue, écrite) et .encart-b (raccourci background en
 *     var(), qui ne peut pas être écrit) ;
 *   - coul-01, texte #333333 (body, a) : arrivée ; .titre, qui hérite sa couleur de body, et les liens ont une
 *     transition de couleur, les liens aussi de fond (docs/attendus/verify-se-reconnait.md).
 * Attendus écrits à la main avant le code (17/11/2026) :
 *   K1 modifications.json : simulation (la carte que la simulation applique), lignes (chaque ligne décidée, ses
 *      clés, son jeton, ses pages), hors (les lignes hors de modifications.json et leur cause) ; aucun de ces champs
 *      ne porte l'hôte ni le port ; brief.reste inchangé ;
 *   K2 causes justes : coul-03 (.encart-b) n'a pas pour cause « unité inconnue » ni un repli vide, ni dans hors ni
 *      dans pertes.md, rangé par cause ;
 *   K3 verdict : coul-01 arrivée ; coul-02 et coul-03 en partie (1 déclaration sur 2, 1 élément sur 2) ; coul-04 non
 *      arrivée (0 déclaration sur 4, 0 élément sur 1) ; esp-03 non arrivée (0 sur 1) ; sortie 1 ;
 *   K4 canal en clair et ce qu'il faut faire : attribut style ; bloc de style injecté par un script ; raccourci et
 *      variable (posée par l'attribut style de l'élément, ou nulle part : valeur de repli) ;
 *   K5 hauteurs de la page intacte (lue avant la pose, dans le même chargement) et avec les feuilles ;
 *   K6 commande verify --ajout : chaque ligne, la phrase finale qui compte chaque état, les hauteurs ; sortie 1 ;
 *      jamais « chaque ligne écrite est arrivée ».
 * Revus pour docs/attendus/verify-se-reconnait.md (décisions de Quentin du 17/11/2026), avant le code :
 *   K4 une cause par déclaration, celle du manifeste d'abord : esp-03 a pour cause « attribut style » et pour « à faire »
 *      celui du fichier des pertes ; l'attribut style reste nommé dans ce qui la tient ; la ligne coul-03 finit par
 *      « cause : raccourci en var() » ; le détail de coul-02 dit « cause : bloc <style> ou autre origine » ;
 *   K7 transitions : relevées transitions et animations coupées, les opérations de coul-01 (body, héritée par
 *      .titre ; a) et celle de .bouton-feuille (coul-02) arrivent ; aucun canal n'est « posé par verify » ;
 *   K8 la cause de chaque déclaration non arrivée est la même dans la ligne de verdict, le détail et le fichier des
 *      pertes ; coul-02, coul-03, coul-04 et esp-03 finissent par leur cause.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { TOKENS, desaccords } from './helpers/ajout.js';
import { runReduce } from '../src/reduce/run.js';
import { feuillesAjoutees, ecrireAjouts, MANIFESTE } from '../src/apply/ajout.js';
import { verifyPage } from '../src/verify/reference.js';
import { juger } from '../src/verify/arrivee.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PAGE = '/canaux/canaux.html';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let mods;
/** @type {Awaited<ReturnType<typeof feuillesAjoutees>>} */
let ajout;
/** @type {any} */
let manifeste;
/** @type {Awaited<ReturnType<typeof verifyPage>>} */
let preuve;
/** @type {ReturnType<typeof juger>} */
let verdict;
/** @type {string} */
let refs;
/** @type {string} */
let sortie;

before(async () => {
  servers = await startFixtureServers();
  refs = await mkdtemp(join(tmpdir(), 'ds-lab-canaux-refs-'));
  const [run] = await runReduce({
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: { width: 390, height: 900 },
    waitMs: 100,
    now: new Date(2026, 10, 17, 12, 0),
    referencesPath: refs,
    outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-canaux-reduce-')),
    addresses: [servers.origin + PAGE],
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
  });
  mods = JSON.parse(await readFile(/** @type {string} */ (run.files.find((f) => f.endsWith('modifications.json'))), 'utf8'));
  ajout = await feuillesAjoutees(mods, { waitMs: 100 });
  sortie = await mkdtemp(join(tmpdir(), 'ds-lab-canaux-sortie-'));
  await ecrireAjouts(ajout, sortie);
  manifeste = JSON.parse(await readFile(join(sortie, MANIFESTE), 'utf8'));
  preuve = await verifyPage({ url: servers.origin + PAGE, referenceDir: refs, waitMs: 100, ajout: sortie });
  verdict = juger(manifeste, [/** @type {any} */ (preuve.releve)]);
});

after(async () => servers?.close());

/** @param {string} id */
const ligneDe = (id) => /** @type {any} */ (verdict.lignes.find((l) => l.id === id));

test('K1 modifications.json : simulation, lignes et hors, sans hôte ni port', () => {
  assert.equal(mods.simulation.colors['#e0e0e0'], '#e3e2df');
  assert.equal(mods.simulation.spacing['30px'], '32px');
  assert.deepEqual(mods.lignes.map((/** @type {any} */ l) => l.id).sort(), ['coul-01', 'coul-02', 'coul-03', 'coul-04', 'esp-03']);
  const coul04 = mods.lignes.find((/** @type {any} */ l) => l.id === 'coul-04');
  assert.deepEqual([coul04.cles, coul04.jeton, coul04.ancienne, coul04.nouvelle, coul04.pages], [['colors|#dadada|bordure'], '--color-neutral-6', '#dadada', '#d8d6d2', [PAGE]]);
  const port = new URL(servers.origin).port;
  const champs = JSON.stringify({ simulation: mods.simulation, lignes: mods.lignes, hors: mods.hors });
  assert.ok(!champs.includes('127.0.0.1') && !champs.includes(port), champs);
  assert.deepEqual(
    mods.hors.map((/** @type {any} */ h) => h.texte),
    mods.brief.reste.map((/** @type {string} */ t) => t.replace(': unité inconnue ; si la valeur calculée est bien #f2f2f2, écris var(--color-neutral-3, ) à la main.', ': raccourci en var() ; si la valeur calculée est bien #f2f2f2, écris var(--color-neutral-3, #f2f2f2) à la main.')),
  );
  assert.deepEqual(Object.fromEntries(mods.hors.filter((/** @type {any} */ h) => h.lignes.length === 1 && h.lignes[0] !== 'tail-01').map((/** @type {any} */ h) => [h.lignes[0], h.cause])), {
    'esp-03': 'attribut style',
    'coul-02': 'bloc <style> ou autre origine',
    'coul-03': 'raccourci en var()',
  });
});

test('K2 pertes.md : causes justes, rangées par cause', () => {
  const L = ajout.pertes.split('\n');
  assert.ok(!ajout.pertes.includes('unité inconnue'), ajout.pertes);
  assert.ok(!ajout.pertes.includes(', )'), ajout.pertes);
  for (const l of ['HORS DE MODIFICATIONS.JSON, ATTRIBUT STYLE (1)', 'HORS DE MODIFICATIONS.JSON, BLOC <STYLE> OU AUTRE ORIGINE (1)', 'HORS DE MODIFICATIONS.JSON, RACCOURCI EN VAR() (1)']) assert.ok(L.includes(l), `${l}\n---\n${ajout.pertes}`);
  assert.ok(L.includes(`- ${mods.hors.find((/** @type {any} */ h) => h.cause === 'raccourci en var()').texte}`), ajout.pertes);
});

test('K3 verdict par ligne décidée, avec ses comptes ; sortie 1', () => {
  assert.deepEqual(
    Object.fromEntries(verdict.lignes.map((l) => [l.id, l.etat])),
    { 'coul-01': 'arrivée', 'coul-02': 'en partie', 'coul-03': 'en partie', 'coul-04': 'non arrivée', 'esp-03': 'non arrivée' },
  );
  assert.deepEqual(ligneDe('coul-01').declarations, { arrivees: 2, total: 2 });
  for (const [id, d, e] of /** @type {const} */ ([
    ['coul-02', [1, 2], [1, 2]],
    ['coul-03', [1, 2], [1, 2]],
    ['coul-04', [0, 4], [0, 1]],
    ['esp-03', [0, 1], [0, 1]],
  ])) {
    const l = ligneDe(id);
    assert.deepEqual([l.declarations, l.elements], [{ arrivees: d[0], total: d[1] }, { arrivees: e[0], total: e[1] }], id);
  }
  assert.equal(verdict.sortie, 1);
  assert.equal(verdict.resume, 'Lignes décidées : 5 ; arrivées 1, en partie 2, non arrivées 2, déjà en place 0, non vues 0, hors des pages vérifiées 0, non vérifiables (état) 0.');
});

test('K4 canal en clair et ce qu\'il faut faire', () => {
  /** Opérations non arrivées d'une ligne. @param {string} id */
  const ratees = (id) => /** @type {any[]} */ (preuve.releve?.ops ?? []).filter((o) => o.ligne === id && o.apres !== o.visee);
  const esp03 = ratees('esp-03');
  assert.deepEqual(esp03.map((o) => o.canal.categories), [['attribut style']]);
  assert.equal(esp03[0].canal.cause, 'attribut style');
  assert.match(esp03[0].canal.texte, /attribut style/);
  assert.match(esp03[0].canal.aFaire, /var\(--space-32, 30px\)/);
  assert.equal(esp03[0].annotation.ecrite, null);
  const coul02 = ratees('coul-02');
  assert.deepEqual(coul02.map((o) => [o.declaration, o.canal.categories]), [['<style> .bouton-theme', ['bloc de style injecté par un script']]]);
  assert.match(coul02[0].canal.aFaire, /var\(--color-neutral-5, #e0e0e0\)/);
  const coul04 = ratees('coul-04');
  assert.equal(coul04.length, 4);
  for (const o of coul04) {
    assert.deepEqual(o.canal.categories, ['raccourci', 'variable']);
    assert.match(o.canal.texte, /--trait-cadre/);
    assert.match(o.canal.texte, /attribut style de l'élément/);
    assert.match(o.canal.aFaire, /--color-neutral-6/);
    assert.deepEqual([o.annotation.ecrite, o.annotation.cause, o.annotation.injectee], [false, 'raccourci', false]);
  }
  const coul03 = ratees('coul-03');
  assert.deepEqual(coul03.map((o) => o.canal.categories), [['raccourci', 'variable']]);
  assert.match(coul03[0].canal.texte, /--fond-encart/);
  assert.match(coul03[0].canal.texte, /repli/);
  assert.ok(ligneDe('coul-03').texte.endsWith(' ; cause : raccourci en var()'), ligneDe('coul-03').texte);
  assert.ok(
    ligneDe('coul-02').details.some((/** @type {string} */ d) => d.startsWith(`${PAGE} <style> .bouton-theme { background-color } : hors de modifications.json ; non arrivée (0 élément sur 1) ; cause : bloc <style> ou autre origine ; tient : `)),
    ligneDe('coul-02').details.join('\n'),
  );
});

test('K5 hauteurs : page intacte, avec les feuilles, référence', () => {
  const h = /** @type {any} */ (preuve.hauteurs);
  assert.ok(h.intacte > 0 && h.reference > 0, JSON.stringify(h));
  assert.equal(h.avecFeuilles, h.intacte);
});

test('K6 commande verify --ajout : chaque ligne, phrase finale, hauteurs ; sortie 1', async () => {
  const out = await mkdtemp(join(tmpdir(), 'ds-lab-canaux-verify-'));
  const r = await new Promise((ok) => {
    const c = spawn(process.execPath, ['src/cli/verify.js', servers.origin + PAGE, '--reference', refs, '--ajout', sortie, '--out', out], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    c.stdout.on('data', (d) => (stdout += d));
    c.stderr.on('data', (d) => (stderr += d));
    c.on('close', (status) => ok({ status, stdout, stderr }));
  });
  const { status, stdout, stderr } = /** @type {any} */ (r);
  assert.equal(status, 1, stderr + stdout);
  for (const l of verdict.lignes) assert.ok(stdout.includes(`  ${l.texte}\n`), `${l.texte}\n---\n${stdout}`);
  assert.ok(stdout.includes(`${verdict.resume}\n`), stdout);
  assert.match(stdout, /Hauteur : page intacte \d+ px, avec les feuilles \d+ px, référence \d+ px/);
  assert.ok(!/écrite est arrivée/.test(stdout), stdout);
});

test('K7 transitions coupées le temps du relevé : coul-01 et .bouton-feuille arrivent', () => {
  const ops = /** @type {any[]} */ (preuve.releve?.ops ?? []);
  const coul01 = ops.filter((o) => o.ligne === 'coul-01');
  assert.ok(coul01.some((o) => / body$/.test(o.declaration)) && coul01.some((o) => / a$/.test(o.declaration)), JSON.stringify(coul01));
  for (const o of coul01) assert.equal(o.apres, o.visee, JSON.stringify(o));
  const feuille = ops.filter((o) => o.ligne === 'coul-02' && / \.bouton-feuille$/.test(o.declaration));
  assert.equal(feuille.length, 1);
  assert.equal(feuille[0].apres, feuille[0].visee, JSON.stringify(feuille[0]));
  for (const o of ops) if (o.canal) assert.ok(!o.canal.categories.includes('posé par verify'), JSON.stringify(o.canal));
});

test('K8 une cause par déclaration, la même dans le verdict, le détail et le fichier des pertes', () => {
  assert.deepEqual(desaccords(verdict, ajout.pertes), []);
  for (const [id, cause] of [
    ['coul-02', 'bloc <style> ou autre origine'],
    ['coul-03', 'raccourci en var()'],
    ['coul-04', 'raccourci'],
    ['esp-03', 'attribut style'],
  ])
    assert.ok(ligneDe(id).texte.endsWith(` ; cause : ${cause}`), ligneDe(id).texte);
});
