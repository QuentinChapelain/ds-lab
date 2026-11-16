// @ts-check
/**
 * Revue de code du 15/11, lot 1b : une panne n'est pas un résultat (docs/attendus/revue-lot-1b-pannes-migration.md, D18).
 * Tests sans navigateur ; ceux qui lancent Chromium sont dans test/pannes-migration-chromium.test.js. Aucune étape
 * commune ne lance Chromium ici (M4 l'empêche de se lancer par PLAYWRIGHT_BROWSERS_PATH=/nulle/part).
 *   M1 measureRendered : une étape qui tombe après le relevé ne verse rien dans le rendu (page factice) ;
 *   M2 navigationWarnings : statut HTTP d'erreur, redirection, networkidle, feuilles illisibles ;
 *   M3 clés de decisions.json qui ne visent aucune ligne ni carte : listées dans migration (données et markdown, sous
 *      « Décisions lues », seulement s'il y en a) ;
 *   M4 resolveBrand lève en nommant l'emplacement ; reduce sort en 2 avant de lancer Chromium ;
 *   M5 (pas de test : aucune entrée connue ne fait osciller la boucle de propose) ;
 *   M6 option inconnue : audit, reduce, apply, login → 2, une ligne ;
 *   M7 apply : feuille absente → écart ; feuille illisible (dossier) ou CSS invalide → 2, la feuille nommée, rien d'écrit ;
 *   M10 apply : 0 tout appliqué, 1 au moins un écart (--essai compris) ;
 *   M12 erreurs d'usage, toutes les commandes : une ligne préfixée par la commande, sortie 2, sans l'aide ; -h donne l'aide.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureRendered } from '../src/rendered/run.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
import { navigationWarnings } from '../src/browser/navigate.js';
import { buildMigration } from '../src/report/migration.js';
import { resolveBrand } from '../src/brand/brand.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURE_DIR = join(ROOT, 'fixtures', 'marque-demo');
const SANS_CHROMIUM = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/nulle/part' };
const tmp = (/** @type {string} */ nom) => mkdtempSync(join(tmpdir(), `ds-lab-${nom}-`));
/** @param {string} cli @param {string[]} args @param {NodeJS.ProcessEnv} [env] */
const run = (cli, args, env = SANS_CHROMIUM) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd: ROOT, encoding: 'utf8', env });

/**
 * Une panne : sortie 2, une ligne préfixée par le nom de la commande, sans pile.
 * @param {{ status: number | null, stdout: string, stderr: string }} p @param {string} nom @param {RegExp} [motif]
 */
function panne(p, nom, motif) {
  const err = p.stderr.trim();
  assert.equal(p.status, 2, `sortie ${p.status}\n${p.stdout}\n${p.stderr}`);
  assert.equal(err.split('\n').length, 1, `une ligne attendue :\n${err}`);
  assert.ok(err.startsWith(`${nom} : `), err);
  assert.doesNotMatch(err, /node:internal|\n\s+at /, err);
  if (motif) assert.match(err, motif);
}

test('M1 measureRendered : une étape qui tombe après le relevé ne verse rien dans le rendu (page factice)', async () => {
  const pc = { url: 'https://a.test/', iframes: 0, excluded: 0, records: [{ retained: true, pseudo: false, role: 'bouton', selector: 'button', text: true }] };
  const page = /** @type {any} */ ({ evaluate: async () => pc, url: () => pc.url, context: () => ({ newCDPSession: async () => { throw new Error('CDP indisponible'); } }) });
  const agg = createRenderedAggregator();
  await assert.rejects(measureRendered(page, agg, { states: true }), /CDP indisponible/);
  assert.deepEqual(Object.keys(agg.result().byPage), []);
});

test('M2 navigationWarnings : statut HTTP d\'erreur, redirection, networkidle, feuilles illisibles ; rien sur une page saine', () => {
  const w = navigationWarnings({ url: 'https://a.test/x', status: 404, finalUrl: 'https://a.test/login', networkIdle: false }, ['feuille illisible https://a.test/s.css (403)']).map((x) => x.text);
  assert.ok(w.some((t) => /https:\/\/a\.test\/x : statut HTTP 404/.test(t)), w.join('\n'));
  assert.ok(w.some((t) => /redirigée vers https:\/\/a\.test\/login/.test(t)));
  assert.ok(w.some((t) => /networkidle non atteint/.test(t)));
  assert.ok(w.some((t) => /https:\/\/a\.test\/x : feuille illisible https:\/\/a\.test\/s\.css \(403\)/.test(t)));
  assert.deepEqual(navigationWarnings({ url: 'https://a.test/', status: 200, finalUrl: 'https://a.test/', networkIdle: true }), []);
});

test('M3 clés orphelines : listées dans les données et sous « Décisions lues », absentes s\'il n\'y en a pas', () => {
  const table = () => ({ families: { spacing: { rows: [{ id: 'E1', old: '20px', new: '16px', class: 'proche', usage: 'marge', scope: 'dans le composant', count: 1 }] } } });
  const meta = { host: 'a.test', stamp: 's', viewport: { width: 1, height: 1 }, target: 'cible.json', pages: ['/'], decisions: 'decisions.json' };
  const avec = buildMigration({ table: table(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, decisions: { 'spacing|20px': '16px', 'spacing|99px': '8px', 'plein|violet': 'onSolid' }, meta });
  assert.deepEqual(avec.data.decisionKeys.orphelines, ['plein|violet', 'spacing|99px']);
  const L = avec.markdown.split('\n');
  const i = L.findIndex((l) => l.startsWith('Décisions lues : '));
  assert.ok(i >= 0);
  assert.equal(L[i + 1], 'Clés de décision sans ligne ni carte, ignorées : `plein|violet`, `spacing|99px`.');
  const sans = buildMigration({ table: table(), rendered: { usages: { pairs: [] } }, map: {}, target: {}, decisions: { 'spacing|20px|marge': '16px' }, meta });
  assert.deepEqual(sans.data.decisionKeys.orphelines, []);
  assert.ok(!sans.markdown.includes('sans ligne ni carte'));
});

test('M4 resolveBrand lève en nommant l\'emplacement ; reduce sort en 2 avant de lancer Chromium', () => {
  for (const [slots, motif] of /** @type {const} */ ([
    [{ primaire: { value: '#12345' } }, /primaire.*#12345/],
    [{ accent: { value: 'rouge' } }, /accent.*rouge/],
    [{ primaire: { value: '#2b4c7e', variants: [{ variable: '--x', value: 'bleuté' }] } }, /primaire.*bleuté/],
  ]))
    assert.throws(() => resolveBrand({ slots }, new Set(['bleu']), () => 'bleu'), motif);
  const d = tmp('cible');
  const cible = JSON.parse(readFileSync(join(FIXTURE_DIR, 'cible-marque.json'), 'utf8'));
  cible.brand.slots.primaire.value = '#12345';
  writeFileSync(join(d, 'cible.json'), JSON.stringify(cible));
  panne(run('reduce', ['http://127.0.0.1:9/', '--target', join(d, 'cible.json'), '--out', join(d, 'sorties')], SANS_CHROMIUM), 'reduce', /primaire.*#12345/);
});

test('M6 option inconnue : audit, reduce, apply, login → 2, une ligne', () => {
  for (const cli of ['audit', 'reduce', 'apply', 'login']) panne(run(cli, ['--inconnu']), cli, /option inconnue --inconnu/);
});

/** Copie d'un site pour apply : une feuille, une entrée. @param {string} css @param {string} ecrit */
function site(css, ecrit) {
  const racine = tmp('apply');
  mkdirSync(join(racine, 's'));
  writeFileSync(join(racine, 's', 'a.css'), css);
  const mods = {
    version: 1,
    host: '127.0.0.1:1',
    stamp: '2026-11-16T1000',
    entries: [{ sheet: '/s/a.css', line: 1, selector: '.carte', property: 'color', written: ecrit, value: 'var(--couleur-neutre-11, #595959)', rows: ['coul-1'], section: 'REMPLACEMENTS' }],
    comments: [],
    brief: { pages: ['/p.html'], sheets: ['/s/a.css'], reste: [], changeAussi: [], neTouchePas: [], signale: [], verification: [] },
  };
  const fichier = join(tmp('mods'), 'modifications.json');
  writeFileSync(fichier, JSON.stringify(mods));
  return { racine, fichier };
}

test('M7 apply : feuille absente → écart ; feuille illisible ou CSS invalide → 2, feuille nommée, rien d\'écrit', () => {
  const absente = site('.carte {\n  color: #595959;\n}\n', '#595959');
  spawnSync('rm', ['-r', join(absente.racine, 's')]);
  const a = run('apply', ['--modifications', absente.fichier, '--racine', absente.racine]);
  assert.match(a.stdout, /écart .* feuille introuvable sous la racine \(\/s\/a\.css\)/, a.stdout + a.stderr);
  const dossier = site('', '#595959');
  spawnSync('rm', [join(dossier.racine, 's', 'a.css')]);
  mkdirSync(join(dossier.racine, 's', 'a.css'));
  panne(run('apply', ['--modifications', dossier.fichier, '--racine', dossier.racine]), 'apply', /\/s\/a\.css/);
  assert.deepEqual(readdirSync(dossier.racine).sort(), ['s'], 'rien d\'écrit');
  const invalide = site('.carte {\n  color: #595959;\n', '#595959');
  panne(run('apply', ['--modifications', invalide.fichier, '--racine', invalide.racine]), 'apply', /\/s\/a\.css.*CSS illisible/);
  assert.deepEqual(readdirSync(invalide.racine).sort(), ['s'], 'rien d\'écrit');
  assert.equal(readFileSync(join(invalide.racine, 's', 'a.css'), 'utf8'), '.carte {\n  color: #595959;\n');
});

test('M10 apply : 0 tout appliqué ; 1 au moins un écart, --essai compris', () => {
  const ok = site('.carte {\n  color: #595959;\n}\n', '#595959');
  const a = run('apply', ['--modifications', ok.fichier, '--racine', ok.racine]);
  assert.equal(a.status, 0, a.stdout + a.stderr);
  assert.match(a.stdout, /1 appliquée\(s\)/);
  const again = run('apply', ['--modifications', ok.fichier, '--racine', ok.racine]);
  assert.equal(again.status, 0, 'déjà appliquée : 0');
  const ecart = site('.carte {\n  color: #000000;\n}\n', '#595959');
  const e = run('apply', ['--modifications', ecart.fichier, '--racine', ecart.racine]);
  assert.equal(e.status, 1, e.stdout + e.stderr);
  assert.match(e.stdout, /1 écart\(s\)/);
  assert.ok(readdirSync(ecart.racine).includes('reste.md'), 'écart listé dans reste.md');
  const essai = site('.carte {\n  color: #000000;\n}\n', '#595959');
  assert.equal(run('apply', ['--modifications', essai.fichier, '--racine', essai.racine, '--essai']).status, 1);
});

test('M12 erreurs d\'usage : une ligne préfixée par la commande, sortie 2, sans l\'aide ; -h donne l\'aide', () => {
  for (const [cli, args, motif] of /** @type {const} */ ([
    ['audit', [], /au moins une adresse est attendue/],
    ['reduce', [], /au moins une adresse est attendue/],
    ['reduce', ['http://127.0.0.1:9/'], /--target/],
    ['apply', [], /--modifications et --racine sont attendus/],
    ['login', [], /une adresse est attendue/],
    ['marque', [], /au moins une adresse est attendue/],
    ['marque', ['http://127.0.0.1:9/', '--viewport', 'large'], /--viewport : format LxH attendu/],
    ['verify', [], /une adresse et une seule est attendue/],
    ['verify', ['http://127.0.0.1:9/'], /--reference est attendu/],
    ['saisie', [], /aucun fichier d'entrée/],
    ['calibrage', [], /--sortie <dossier> et au moins un fichier d'entrée sont attendus/],
  ])) {
    const p = run(cli, [...args]);
    panne(p, cli, motif);
    assert.doesNotMatch(p.stdout + p.stderr, /Usage/, `${cli} : l'aide ne s'affiche pas sur une erreur`);
  }
  for (const cli of ['audit', 'reduce', 'apply', 'login', 'marque', 'verify']) {
    const h = run(cli, ['-h']);
    assert.equal(h.status, 0, `${cli} -h`);
    assert.match(h.stdout, /Usage/, `${cli} -h`);
  }
});
