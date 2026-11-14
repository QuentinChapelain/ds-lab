// @ts-check
/**
 * Bout en bout de l'audit complet sur la page de démonstration : sorties
 * JSON et Markdown, --v1-script (script factice), avertissements.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runAudit } from '../src/audit/run.js';

const expected = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected.json', import.meta.url), 'utf8'));
const NOW = new Date(2026, 10, 11, 15, 30);

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {string} */
let out;
/** @type {Awaited<ReturnType<typeof runAudit>>} */
let first;
/** @type {any} */
let audit;
/** @type {string} */
let report;

before(async () => {
  servers = await startFixtureServers();
  out = await mkdtemp(join(tmpdir(), 'ds-lab-audit-'));
  first = await runAudit({
    addresses: [`${servers.origin}/`, '/page-2.html'],
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    outRoot: out,
    waitMs: 0,
    trace: true,
    v1ScriptPath: 'fixtures/v1-factice.md',
    now: NOW,
  });
  audit = JSON.parse(await readFile(join(first[0].dir, 'audit.json'), 'utf8'));
  report = await readFile(join(first[0].dir, 'rapport.md'), 'utf8');
});

after(async () => {
  await servers?.close();
});

test('sorties : local/audits/<hôte>/<AAAA-MM-JJTHHMM>/ avec audit.json, rapport.md, v1.json', async () => {
  assert.equal(first.length, 1);
  const host = new URL(servers.origin).host.replace(':', '_');
  assert.equal(first[0].dir, join(out, host, '2026-11-11T1530'));
  assert.deepEqual((await readdir(first[0].dir)).sort(), ['audit.json', 'rapport.html', 'rapport.md', 'v1.json']);
});

test('audit.json : chiffres clés conformes à expected.json', () => {
  assert.equal(audit.declared.sheets.length, expected.sheets.total.value);
  assert.equal(audit.declared.families.colors.total, expected.declared.colors.total.value);
  assert.equal(audit.declared.families.colors.groupsDE5.length, expected.declared.colors.groupsDE5.value);
  assert.equal(audit.rendered.elements, expected.rendered.elements.value);
  assert.equal(audit.rendered.contrast.pairs.length, expected.contrast.pairsTotal.value);
  assert.deepEqual(audit.pages.map((/** @type {any} */ p) => p.rootPx), [18, 18]);
  assert.equal(audit.meta.traceRendered, true);
  assert.equal(audit.meta.v1Script, 'v1-factice.md');
});

test('--v1-script : résultat brut et tableau de comparaison par page', async () => {
  const raw = JSON.parse(await readFile(join(first[0].dir, 'v1.json'), 'utf8'));
  assert.equal(raw.pages.length, 2);
  assert.equal(raw.pages[0].result.pagesDemandees, 0, 'dsAudit([]) : page courante seulement');
  assert.equal(raw.pages[0].result.rendered.elements, expected.rendered.elements.byPage['/'].value, 'éléments visibles (sans pseudo)');
  const rows = audit.v1.pages[0].rows;
  const el = rows.find((/** @type {any} */ r) => r.mesure === 'Rendu : éléments');
  assert.deepEqual([el.v1, el.outil, el.ecart], [19, 19, '0']);
  assert.match(report, /## Comparaison avec le script v1/);
  assert.match(report, /### \/page-2\.html/);
});

test('rapport.md : sections, écarts v1, limites, étiquettes', () => {
  for (const h of ['## Avertissements', '## Pages', '## Synthèse par famille', '## Couleurs', '## Contraste (WCAG 2.1)', '## Feuilles', '## Écarts de méthode avec la v1', '## Limites', '## Origine des valeurs rendues']) {
    assert.ok(report.includes(h), h);
  }
  assert.match(report, /effet sur les chiffres de l’étape 1 à mesurer/);
  assert.match(report, /opacity n’entre pas dans le calcul/);
  assert.match(report, /<slot>/);
  assert.match(report, /pseudo-éléments ne sont pas tracés/);
  assert.match(report, /\*\*Graisses\*\* — déclaré : `700` ×2 · `300` ×1 · `600` ×1 ; rendu : `400` ×10 · `700` ×4/, 'tri par fréquence');
  assert.match(report, /Sources : fixtures\/marque-demo\/sources\.json\./, 'chemin relatif');
  assert.match(report, /`#c8553d` \| `#cecdcd` \| 2\.75 \| 3 \| 3 \| 3 \| \[V\] opacity ×1/);
  for (const line of report.split('\n').filter((l) => l.startsWith('- '))) assert.match(line, /\[(F|H|V)\]/, line);
});

test('second audit à la même minute : dossier suffixé, pas d’écrasement', async () => {
  const again = await runAudit({ addresses: [`${servers.origin}/page-2.html`], sourcesPath: `${FIXTURE_DIR}sources.json`, outRoot: out, waitMs: 0, now: NOW });
  assert.equal(again[0].dir, `${first[0].dir}-2`);
});

test('avertissements : rootPx différente et iframes', async () => {
  const r = await runAudit({ addresses: [`${servers.origin}/`, '/cadres.html'], sourcesPath: `${FIXTURE_DIR}sources.json`, outRoot: out, waitMs: 0, now: NOW });
  const texts = r[0].warnings.map((w) => w.text);
  assert.ok(texts.some((t) => /rootPx différente/.test(t) && /18 px/.test(t) && /16 px/.test(t)), texts.join('\n'));
  assert.ok(texts.some((t) => /cadres\.html : 2 iframe\(s\) non parcourue/.test(t)), texts.join('\n'));
  const md = await readFile(join(r[0].dir, 'rapport.md'), 'utf8');
  assert.match(md, /rootPx différente/);
});
