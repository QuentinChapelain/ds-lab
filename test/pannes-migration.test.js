// @ts-check
/**
 * Revue de code du 15/11, lot 1b : une panne n'est pas un résultat (docs/attendus/revue-lot-1b-pannes-migration.md, D18).
 * Sans navigateur quand c'est possible ; Chromium seulement quand il faut une vraie page (M1b à M1d, M2b, M3b, M8, M9).
 *   M1 audit : une étape qui tombe après le relevé ne laisse pas la page dans le rendu (page factice) ; une trace en panne
 *      garde la page, échantillons « non tracé » ; une page tombée est nommée par son étape, absente du rendu et du
 *      déclaré, sortie 2 « audit écrit, incomplet » ; aucune page mesurée : sortie 2, rien d'écrit ;
 *   M2 navigationWarnings : statut HTTP d'erreur, redirection, networkidle, feuilles illisibles ; reduce et la lecture de
 *      marque les rendent ;
 *   M3 clés de decisions.json qui ne visent aucune ligne ni carte : listées dans migration (données et markdown, sous
 *      « Décisions lues », seulement s'il y en a), au journal de reduce et dans table.json ;
 *   M4 resolveBrand lève en nommant l'emplacement ; reduce sort en 2 avant de lancer Chromium ;
 *   M5 (pas de test : aucune entrée connue ne fait osciller la boucle de propose) ;
 *   M6 option inconnue : audit, reduce, apply, login → 2, une ligne ;
 *   M7 apply : feuille absente → écart ; feuille illisible (dossier) ou CSS invalide → 2, la feuille nommée, rien d'écrit ;
 *   M8 reduce signale un sélecteur tiers invalide ;
 *   M9 trace : un élément détaché est « non tracé », pas « initiale » ;
 *   M10 apply : 0 tout appliqué, 1 au moins un écart (--essai compris).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { measureRendered } from '../src/rendered/run.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
// Espace de noms : navigationWarnings n'existe pas avant le lot ; seul M2 doit tomber, pas le fichier.
import * as navigate from '../src/browser/navigate.js';
import { traceElements } from '../src/browser/trace.js';
import { buildMigration } from '../src/report/migration.js';
import { resolveBrand } from '../src/brand/brand.js';
import { readBrand } from '../src/brand/read.js';
import { runReduce } from '../src/cli/reduce.js';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SANS_CHROMIUM = { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '/nulle/part' };
const tmp = (/** @type {string} */ nom) => mkdtempSync(join(tmpdir(), `ds-lab-${nom}-`));
/** @param {string} cli @param {string[]} args @param {NodeJS.ProcessEnv} [env] */
const run = (cli, args, env = process.env) => spawnSync(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd: ROOT, encoding: 'utf8', env });
/**
 * Commande lancée sans bloquer la boucle (le serveur du test doit répondre).
 * @param {string} cli @param {string[]} args @returns {Promise<{ status: number | null, stdout: string, stderr: string }>}
 */
const runAsync = (cli, args) =>
  new Promise((done) => {
    const p = spawn(process.execPath, [join(ROOT, 'src', 'cli', `${cli}.js`), ...args], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (status) => done({ status, stdout, stderr }));
  });

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

// Serveur du test : une page mesurable, une adresse dont la connexion est coupée (la navigation lève).
const PAGE = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>p</title><style>p { color: #123456; }</style></head><body><p>Texte</p><a href="/">Lien</a></body></html>';
/** @type {import('node:http').Server} */
let serveur;
let origine = '';
/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let fixture;
/** @type {{ log: string[], run: Awaited<ReturnType<typeof runReduce>>, out: string }} */
let reduit;

before(async () => {
  serveur = createServer((req, res) => {
    if (req.url === '/panne') return void req.socket.destroy();
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(PAGE);
  });
  await new Promise((done) => serveur.listen(0, '127.0.0.1', () => done(null)));
  origine = `http://127.0.0.1:${/** @type {any} */ (serveur.address()).port}`;
  fixture = await startFixtureServers();
  // M2b, M3b, M8 : une réduction sur la page fictive, avec une page 404, un sélecteur tiers invalide et une clé orpheline.
  const d = tmp('reduce-pannes');
  const sources = JSON.parse(readFileSync(join(FIXTURE_DIR, 'sources.json'), 'utf8'));
  sources.thirdParty = [...sources.thirdParty, 'div['];
  writeFileSync(join(d, 'sources.json'), JSON.stringify(sources));
  writeFileSync(join(d, 'decisions.json'), JSON.stringify({ 'spacing|99px': '16px' }));
  /** @type {string[]} */
  const log = [];
  const out = join(d, 'sorties');
  const r = await runReduce({
    addresses: [fixture.origin + '/', '/absente.html'],
    targetPath: `${FIXTURE_DIR}cible.json`,
    sourcesPath: join(d, 'sources.json'),
    decisionsPath: join(d, 'decisions.json'),
    outRoot: out,
    waitMs: 100,
    now: new Date(2026, 10, 16, 10, 0),
    log: (m) => log.push(m),
  });
  reduit = { log, run: r, out };
});
after(async () => {
  await new Promise((done) => serveur?.close(() => done(null)));
  await fixture?.close();
});

test('M1 measureRendered : une étape qui tombe après le relevé ne verse rien dans le rendu (page factice)', async () => {
  const pc = { url: 'https://a.test/', iframes: 0, excluded: 0, records: [{ retained: true, pseudo: false, role: 'bouton', selector: 'button', text: true }] };
  const page = /** @type {any} */ ({ evaluate: async () => pc, url: () => pc.url, context: () => ({ newCDPSession: async () => { throw new Error('CDP indisponible'); } }) });
  const agg = createRenderedAggregator();
  await assert.rejects(measureRendered(page, agg, { states: true }), /CDP indisponible/);
  assert.deepEqual(Object.keys(agg.result().byPage), []);
});

test('M1b measureRendered : une trace en panne garde la page, échantillons « non tracé », erreur rendue (Chromium)', async () => {
  const b = await chromium.launch();
  try {
    const vraie = await b.newPage();
    await vraie.setContent(PAGE);
    const page = /** @type {any} */ (new Proxy(vraie, {
      get: (t, k) => (k === 'context' ? () => ({ newCDPSession: async () => { throw new Error('CDP indisponible'); } }) : typeof (/** @type {any} */ (t))[k] === 'function' ? (/** @type {any} */ (t))[k].bind(t) : (/** @type {any} */ (t))[k]),
    }));
    const agg = createRenderedAggregator();
    const r = await measureRendered(page, agg, { trace: true });
    assert.match(String(r.traceError), /CDP indisponible/);
    const rendered = agg.result();
    assert.equal(Object.keys(rendered.byPage).length, 1, 'page gardée');
    const ctx = rendered.families.colors.values['#123456']?.contexts ?? [];
    assert.ok(ctx.length, '#123456 relevée');
    for (const c of ctx) assert.equal(c.trace?.origin, 'non tracé');
  } finally {
    await b.close();
  }
});

test('M1c audit : page tombée nommée par son étape, hors du rendu et du déclaré ; sortie 2, audit écrit, incomplet (Chromium)', async () => {
  const out = tmp('audit-partiel');
  const p = await runAsync('audit', [origine + '/', '/panne', '--out', out, '--wait-ms', '0', '--no-states']);
  panne(p, 'audit', /^audit : 1 page sur 2 non mesurée : audit écrit, incomplet$/);
  const [host] = readdirSync(out);
  const [stamp] = readdirSync(join(out, host));
  const audit = JSON.parse(readFileSync(join(out, host, stamp, 'audit.json'), 'utf8'));
  const tombee = audit.pages.find((/** @type {any} */ x) => x.url.endsWith('/panne'));
  assert.equal(tombee.etape, 'navigation');
  assert.ok(audit.warnings.some((/** @type {any} */ w) => /\/panne : étape navigation tombée/.test(w.text)), JSON.stringify(audit.warnings));
  assert.ok(!audit.warnings.some((/** @type {any} */ w) => /échec du chargement/.test(w.text)));
  assert.deepEqual(Object.keys(audit.rendered.byPage), [origine + '/']);
});

test('M1d audit : aucune page mesurée → sortie 2, rien d\'écrit (Chromium)', async () => {
  const out = tmp('audit-vide');
  const p = await runAsync('audit', [origine + '/panne', '--out', out, '--wait-ms', '0', '--no-states']);
  panne(p, 'audit', /aucune page mesurée : rien d'écrit/);
  assert.deepEqual(readdirSync(out), []);
});

test('M2 navigationWarnings : statut HTTP d\'erreur, redirection, networkidle, feuilles illisibles ; rien sur une page saine', () => {
  const w = navigate.navigationWarnings({ url: 'https://a.test/x', status: 404, finalUrl: 'https://a.test/login', networkIdle: false }, ['feuille illisible https://a.test/s.css (403)']).map((x) => x.text);
  assert.ok(w.some((t) => /https:\/\/a\.test\/x : statut HTTP 404/.test(t)), w.join('\n'));
  assert.ok(w.some((t) => /redirigée vers https:\/\/a\.test\/login/.test(t)));
  assert.ok(w.some((t) => /networkidle non atteint/.test(t)));
  assert.ok(w.some((t) => /https:\/\/a\.test\/x : feuille illisible https:\/\/a\.test\/s\.css \(403\)/.test(t)));
  assert.deepEqual(navigate.navigationWarnings({ url: 'https://a.test/', status: 200, finalUrl: 'https://a.test/', networkIdle: true }), []);
});

test('M2b reduce et la lecture de marque rendent les avertissements de navigation (Chromium)', async () => {
  assert.ok(reduit.log.some((l) => /absente\.html : statut HTTP 404/.test(l)), reduit.log.join('\n'));
  const r = await readBrand({ addresses: [fixture.origin + '/absente.html'], viewport: { width: 800, height: 600 }, prefix: '--' });
  assert.ok((r.warnings ?? []).some((/** @type {any} */ w) => /statut HTTP 404/.test(w.text)), JSON.stringify(r.warnings));
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

test('M3b reduce : clé orpheline au journal et dans table.json (Chromium)', () => {
  assert.ok(reduit.log.some((l) => /clé de décision sans ligne ni carte, ignorée : spacing\|99px/.test(l)), reduit.log.join('\n'));
  const t = JSON.parse(readFileSync(join(reduit.run[0].dir, 'table.json'), 'utf8'));
  assert.deepEqual(t.decisionsOrphelines, ['spacing|99px']);
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

test('M8 reduce signale un sélecteur tiers invalide (Chromium)', () => {
  assert.ok(reduit.log.some((l) => /sélecteur thirdParty invalide, ignoré : div\[/.test(l)), reduit.log.join('\n'));
});

test('M9 trace : un élément détaché est « non tracé », pas « initiale » (Chromium)', async () => {
  const b = await chromium.launch();
  try {
    const page = await b.newPage();
    await page.setContent('<style>.a { color: red; }</style><p class="a">un</p><p class="a" id="d">deux</p>');
    await page.evaluate(() => {
      /** @type {any} */ (window).els = [...document.querySelectorAll('p')];
      document.getElementById('d')?.remove();
    });
    const r = await traceElements(page, [0, 1].map((index) => ({ index, property: 'color', pseudo: false })), { sources: null, lookup: (i) => `window.els[${i}]` });
    assert.deepEqual(r.map((x) => x.origin), ['feuille', 'non tracé']);
  } finally {
    await b.close();
  }
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
