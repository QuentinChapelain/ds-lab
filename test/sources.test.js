// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileSources, loadSources, attributeSource, RESERVED } from '../src/lib/sources.js';

const PAGE = 'https://www.marque-demo.test/fr/';

const config = compileSources({
  rules: [
    { label: 'theme-commun', match: '/theme/commun/' },
    { label: 'theme', match: '/theme/' },
    { label: 'cdn', regex: '^https://cdn\\.example\\.com/' },
  ],
  default: 'autre',
});

test('attributeSource : feuilles sans URL', () => {
  assert.equal(attributeSource({ inline: true }, config, PAGE), RESERVED.inline);
  assert.equal(attributeSource({}, config, PAGE), RESERVED.injected);
  assert.equal(attributeSource({ href: '' }, null, PAGE), RESERVED.injected);
});

test('attributeSource : première règle qui correspond, dans l’ordre du fichier', () => {
  assert.equal(attributeSource({ href: 'https://www.marque-demo.test/theme/commun/a.css' }, config, PAGE), 'theme-commun');
  assert.equal(attributeSource({ href: 'https://www.marque-demo.test/theme/b.css' }, config, PAGE), 'theme');
  assert.equal(attributeSource({ href: 'https://cdn.example.com/lib.css' }, config, PAGE), 'cdn');
  assert.equal(attributeSource({ href: 'https://x.cdn.example.com/lib.css' }, config, PAGE), 'autre', 'regex ancrée');
});

test('attributeSource : repli sur l’origine sans configuration ou sans default', () => {
  assert.equal(attributeSource({ href: 'https://www.marque-demo.test/a.css' }, null, PAGE), RESERVED.sameOrigin);
  assert.equal(attributeSource({ href: 'https://autre.test/a.css' }, null, PAGE), RESERVED.crossOrigin);
  const sansDefault = compileSources({ rules: [{ label: 'theme', match: '/theme/' }] });
  assert.equal(attributeSource({ href: 'https://autre.test/a.css' }, sansDefault, PAGE), RESERVED.crossOrigin);
  assert.equal(attributeSource({ href: 'https://autre.test/theme/a.css' }, sansDefault, PAGE), 'theme');
});

test('compileSources : configurations invalides refusées avec un message clair', () => {
  /** @type {[unknown, RegExp][]} */
  const bad = [
    [null, /rules/],
    [{}, /rules/],
    [{ rules: [{ match: '/x/' }] }, /label/],
    [{ rules: [{ label: 'x' }] }, /soit "match", soit "regex"/],
    [{ rules: [{ label: 'x', match: '/a/', regex: 'a' }] }, /soit "match", soit "regex"/],
    [{ rules: [{ label: 'x', match: '' }] }, /vide/],
    [{ rules: [{ label: 'x', regex: '(' }] }, /expression invalide/],
    [{ rules: [{ label: 'inline', match: '/a/' }] }, /réservée/],
    [{ rules: [], default: '' }, /default/],
  ];
  for (const [cfg, re] of bad) assert.throws(() => compileSources(cfg), re, JSON.stringify(cfg));
});

test('loadSources : fichier par défaut absent → avertissement et repli', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-sources-'));
  const r = await loadSources({ cwd: dir });
  assert.equal(r.sources, null);
  assert.match(r.warning ?? '', /local\/sources\.json absent/);
});

test('loadSources : fichier par défaut présent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-sources-'));
  await mkdir(join(dir, 'local'));
  await writeFile(join(dir, 'local/sources.json'), JSON.stringify({ rules: [{ label: 'theme', match: '/theme/' }] }));
  const r = await loadSources({ cwd: dir });
  assert.equal(r.warning, null);
  assert.equal(r.sources?.rules.length, 1);
});

test('loadSources : chemin explicite absent ou JSON invalide → erreur', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-sources-'));
  await assert.rejects(loadSources({ cwd: dir, path: 'absent.json' }), /lecture impossible/);
  await writeFile(join(dir, 'casse.json'), '{ rules: ');
  await assert.rejects(loadSources({ cwd: dir, path: 'casse.json' }), /JSON invalide/);
});

test('config/sources.example.json est valide', async () => {
  const r = await loadSources({ path: 'config/sources.example.json' });
  assert.ok(r.sources && r.sources.rules.length > 0);
  assert.equal(attributeSource({ href: 'https://cdn.example.com/a.css' }, r.sources, PAGE), 'cdn');
});
