// @ts-check
/**
 * Revue de code du 15/11, lot 1b : une panne n'est pas un résultat, tests qui lancent Chromium, faute d'autre moyen (vraie
 * page, vraie navigation, vraie trace). Les tests sans navigateur sont dans test/pannes-migration.test.js.
 *   M1b une trace en panne garde la page, échantillons « non tracé » ;
 *   M1c audit : une page tombée est nommée par son étape, absente du rendu et du déclaré, sortie 2 « audit écrit, incomplet » ;
 *   M1d audit : aucune page mesurée → sortie 2, rien d'écrit ;
 *   M2b reduce et la lecture de marque rendent les avertissements de navigation ;
 *   M3b reduce : clé orpheline au journal et dans table.json ;
 *   M8 reduce signale un sélecteur tiers invalide ;
 *   M9 trace : un élément détaché est « non tracé », pas « initiale » ;
 *   M11 audit : un script v1 en échec laisse la page mesurée, sans comparaison ; avertissement « script v1 », sortie 2.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { measureRendered } from '../src/rendered/run.js';
import { createRenderedAggregator } from '../src/rendered/aggregate.js';
import { traceElements } from '../src/browser/trace.js';
import { readBrand } from '../src/brand/read.js';
import { runReduce } from '../src/reduce/run.js';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const tmp = (/** @type {string} */ nom) => mkdtempSync(join(tmpdir(), `ds-lab-${nom}-`));
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

test('M2b reduce et la lecture de marque rendent les avertissements de navigation (Chromium)', async () => {
  assert.ok(reduit.log.some((l) => /absente\.html : statut HTTP 404/.test(l)), reduit.log.join('\n'));
  const r = await readBrand({ addresses: [fixture.origin + '/absente.html'], viewport: { width: 800, height: 600 }, prefix: '--' });
  assert.ok((r.warnings ?? []).some((/** @type {any} */ w) => /statut HTTP 404/.test(w.text)), JSON.stringify(r.warnings));
});

test('M3b reduce : clé orpheline au journal et dans table.json (Chromium)', () => {
  assert.ok(reduit.log.some((l) => /clé de décision sans ligne ni carte, ignorée : spacing\|99px/.test(l)), reduit.log.join('\n'));
  const t = JSON.parse(readFileSync(join(reduit.run[0].dir, 'table.json'), 'utf8'));
  assert.deepEqual(t.decisionsOrphelines, ['spacing|99px']);
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

test('M11 audit : script v1 en échec, la page reste mesurée sans comparaison ; avertissement « script v1 », sortie 2', async () => {
  const d = tmp('v1-panne');
  writeFileSync(join(d, 'v1.md'), '# Script v1 qui tombe (test)\n\n```js\nwindow.dsAudit = async function () {\n  throw new Error(\'v1 en panne\');\n};\n```\n');
  const out = join(d, 'sorties');
  const p = await runAsync('audit', [origine + '/', '--out', out, '--wait-ms', '0', '--no-states', '--v1-script', join(d, 'v1.md')]);
  panne(p, 'audit', /^audit : script v1 en échec sur 1 page sur 1 : audit écrit, incomplet$/);
  const [host] = readdirSync(out);
  const [stamp] = readdirSync(join(out, host));
  const audit = JSON.parse(readFileSync(join(out, host, stamp, 'audit.json'), 'utf8'));
  assert.deepEqual(Object.keys(audit.rendered.byPage), [origine + '/'], 'page gardée dans le rendu');
  assert.ok(!audit.pages[0].error, 'page mesurée');
  assert.ok(audit.warnings.some((/** @type {any} */ w) => /étape script v1 tombée \(.*v1 en panne.*\), comparaison absente pour cette page/.test(w.text)), JSON.stringify(audit.warnings));
  assert.match(audit.v1.pages[0].error, /v1 en panne/);
  assert.equal(audit.v1.pages[0].rows, undefined, 'comparaison absente');
});
