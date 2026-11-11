// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { parseAuditArgs } from '../src/cli/audit.js';
import { extractV1Script, v1Top, compareV1 } from '../src/audit/v1.js';
import { pageWarnings } from '../src/audit/run.js';
import { stampOf } from '../src/report/json.js';
import { V1_DIFFERENCES, LIMITS } from '../src/report/differences.js';

test('parseAuditArgs : défauts et options', () => {
  const r = parseAuditArgs(['https://a.test/', '/b', '--trace-rendered', '--viewport', '390x844', '--wait-ms', '0']);
  assert.equal(r.help, false);
  assert.deepEqual(r.options?.addresses, ['https://a.test/', '/b']);
  assert.deepEqual(r.options?.viewport, { width: 390, height: 844 });
  assert.equal(r.options?.waitMs, 0);
  assert.equal(r.options?.trace, true);
  assert.equal(r.options?.outRoot, 'local/audits');
  const d = parseAuditArgs(['https://a.test/']);
  assert.deepEqual(d.options?.viewport, { width: 1366, height: 900 });
  assert.equal(d.options?.waitMs, 2000);
  assert.equal(d.options?.trace, false);
  assert.throws(() => parseAuditArgs(['https://a.test/', '--viewport', 'grand']), /LxH/);
  assert.throws(() => parseAuditArgs(['https://a.test/', '--wait-ms=-1']), /positif/);
  assert.throws(() => parseAuditArgs(['https://a.test/', '--wait-ms', '-1']), /ambiguous/, 'refusé par parseArgs');
  assert.throws(() => parseAuditArgs([]), /adresse/);
  assert.throws(() => parseAuditArgs(['https://a.test/', '--inconnue']), /inconnue|Unknown/i);
});

test('CLI : aide et erreur d’argument', () => {
  const help = spawnSync(process.execPath, ['src/cli/audit.js', '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--v1-script/);
  const bad = spawnSync(process.execPath, ['src/cli/audit.js', 'https://a.test/', '--viewport', 'x'], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /--viewport/);
});

test('extractV1Script : premier bloc js qui définit dsAudit', () => {
  const md = 'Texte\n```sh\nls\n```\n```js\nwindow.dsAudit = async () => ({});\n```\n```js\nautre\n```\n';
  assert.equal(extractV1Script(md).trim(), 'window.dsAudit = async () => ({});');
  assert.throws(() => extractV1Script('pas de code'), /aucun bloc/);
  assert.throws(() => extractV1Script('```js\nconst x = 1;\n```\n'), /dsAudit/);
});

test('v1Top : même présentation que top() de la v1', () => {
  assert.equal(v1Top({ '14px': 2, '18px': 7, '16px': 2 }), '18px:7 14px:2 16px:2');
  assert.equal(v1Top({ a: 1, b: 2, c: 3 }, 2), 'c:3 b:2');
});

test('compareV1 : écarts chiffrés et renvois aux écarts de méthode', () => {
  const fam = (/** @type {object} */ extra = {}) => ({ distinct: 0, ...extra });
  const rows = compareV1(
    { rootPx: 18, rules: 10, declared: { colors: 12, opaque: 10, once: 5, groups_dE2: 9, groups_dE5: 7, sizes: 4, bySource: { a: 3 } }, rendered: { elements: 20, colors: 8, sizes: '18px:7' } },
    {
      rootPx: 18,
      elements: 22,
      declared: {
        sheets: [{ rules: 12 }],
        families: {
          colors: { distinct: 14, opaque: 12, opaqueOnce: 10, groupsDE2: [1, 2], groupsDE5: [1], bySource: { a: { distinct: 5 } } },
          fontSizes: fam({ distinct: 8 }),
        },
      },
      rendered: { families: { colors: fam({ distinct: 10 }), fontSizes: { v1Keys: { '18px': 7 } } } },
    },
  );
  const by = Object.fromEntries(rows.map((r) => [r.mesure, r]));
  assert.equal(by['rootPx'].ecart, '0');
  assert.equal(by['Déclaré : couleurs distinctes'].ecart, '+2');
  assert.equal(by['Déclaré : groupes ΔE 2'].ecart, '-7');
  assert.equal(by['Rendu : éléments'].ecart, '+2');
  assert.equal(by['Rendu : tailles (clé v1, 20 premières)'].ecart, '0');
  assert.equal(by['Déclaré : couleurs distinctes par source'].v1, 'a:3');
  for (const r of rows) assert.ok(r.ecarts, r.mesure);
});

test('pageWarnings : rootPx différente, iframes, networkidle, redirection, échec', () => {
  const w = pageWarnings([
    { url: 'https://a.test/', finalUrl: 'https://a.test/', rootPx: 18, iframes: 0, networkIdle: true, status: 200 },
    { url: 'https://a.test/b', finalUrl: 'https://a.test/login', rootPx: 16, iframes: 2, networkIdle: false, status: 200 },
    { url: 'https://a.test/c', error: 'net::ERR_NAME_NOT_RESOLVED' },
  ]).map((x) => x.text);
  assert.ok(w.some((t) => /rootPx différente.*18 px.*16 px.*18 px \(première page\)/.test(t)), 'rootPx');
  assert.ok(w.some((t) => /2 iframe\(s\) non parcourue/.test(t)), 'iframes');
  assert.ok(w.some((t) => /networkidle non atteint/.test(t)), 'networkidle');
  assert.ok(w.some((t) => /redirigée vers https:\/\/a\.test\/login/.test(t)), 'redirection');
  assert.ok(w.some((t) => /échec du chargement/.test(t)), 'échec');
  assert.deepEqual(pageWarnings([{ url: 'https://a.test/', finalUrl: 'https://a.test/', rootPx: 16, iframes: 0, networkIdle: true, status: 200 }]), []);
});

test('stampOf : horodatage local à la minute', () => {
  assert.equal(stampOf(new Date(2026, 10, 11, 9, 5)), '2026-11-11T0905');
});

test('écarts v1 et limites : contenu convenu', () => {
  assert.equal(V1_DIFFERENCES.length, 15);
  assert.deepEqual(V1_DIFFERENCES.map((d) => d.n), Array.from({ length: 15 }, (_, i) => i + 1));
  const alpha = V1_DIFFERENCES.find((d) => /alpha/i.test(d.point));
  assert.equal(alpha?.effet, 'effet sur les chiffres de l’étape 1 à mesurer');
  assert.ok(!V1_DIFFERENCES.some((d) => /hidden/.test(d.point + d.v1)), 'écart « bordure hidden » retiré');
  const limits = LIMITS.map((l) => l.text).join('\n');
  for (const re of [/opacity/, /<slot>/, /pseudo-éléments ne sont pas tracés/, /iframes/, /rootPx/]) assert.match(limits, re);
});
