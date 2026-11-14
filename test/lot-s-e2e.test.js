// @ts-check
/**
 * Lot S, sur les pages en désordre d'Orbe Café (marque fictive). Attendus écrits avant le code :
 * S1. reduce (avec --tokens) écrit modifications.json à côté de migration.md : chaque déclaration
 *     que la consigne liste à remplacer ou à rattacher (unité absolue) a son entrée, et aucune autre ;
 *     ex. recente.css:59 .produit, 12px → var(--rayon-12, 12px) (RATTACHE, lu dans la consigne du
 *     lot K). Commentaires : chaque déclaration en conflit ; chaque unité relative de RATTACHE.
 *     tokens.css dans /desordre/styles/ ; pages qui chargent une feuille modifiée, témoin compris.
 * S3. Deux copies fraîches : fichiers identiques octet pour octet ; relancé sur une copie migrée :
 *     aucun fichier modifié hors reste.md.
 * S4. Le HTML n'est pas touché. Une fois tokens.css chargé dans les pages (le reste de l'agent),
 *     reduce sur la copie : aucune ligne « appliquée » ni « décidée », sauf celles qui ont une
 *     déclaration en conflit (laissée telle quelle).
 * Décisions : passage 2c, plus la carte « Texte sur plein terre » (onSolid, pour les couplages).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, cp, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { applyModifications } from '../src/apply/apply.js';

const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const PAGES = ['/desordre/carte.html', '/desordre/compte.html', '/desordre/gestion.html'];
const WITNESS = '/desordre/temoin.html';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {any} */
let mods;
/** @type {any} */
let run;
let decisionsPath = '';
/** @type {Record<string, any>} */
const common = {};

/** Copie fraîche du site en désordre. */
async function fresh() {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-s-copie-'));
  await cp(join(FIXTURE_DIR, 'desordre'), join(root, 'desordre'), { recursive: true });
  return root;
}
/** Tous les fichiers d'une copie, chemin relatif → contenu. @param {string} root */
async function snapshot(root) {
  /** @type {Record<string, string>} */
  const out = {};
  /** @param {string} dir */
  const walk = async (dir) => {
    for (const n of await readdir(join(root, dir))) {
      const rel = dir ? `${dir}/${n}` : n;
      if ((await stat(join(root, rel))).isDirectory()) await walk(rel);
      else out[rel] = await readFile(join(root, rel), 'utf8');
    }
  };
  await walk('');
  return out;
}

before(async () => {
  servers = await startFixtureServers();
  const dir = await mkdtemp(join(tmpdir(), 'ds-lab-lot-s-'));
  decisionsPath = join(dir, 'decisions.json');
  await writeFile(decisionsPath, JSON.stringify({ ...JSON.parse(await readFile(`${FIXTURE_DIR}decisions-passage-2c.json`, 'utf8')), 'plein|terre': 'onSolid' }));
  Object.assign(common, {
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    decisionsPath,
    viewport: { width: 1366, height: 900 },
    waitMs: 100,
    temoins: [WITNESS],
    now: new Date(2026, 10, 14, 12, 0),
  });
  [run] = await runReduce({ ...common, addresses: [servers.origin + PAGES[0], ...PAGES.slice(1)], outRoot: dir });
  const file = join(dirname(run.files[2]), 'modifications.json');
  mods = JSON.parse(await readFile(file, 'utf8'));
});

after(async () => servers?.close());

test('S1 : modifications.json à côté de migration.md ; entrée lue dans la consigne du lot K', () => {
  assert.ok(run.files.some((/** @type {string} */ f) => f.endsWith('/modifications.json')));
  const produit = mods.entries.filter((/** @type {any} */ e) => e.sheet === '/desordre/styles/recente.css' && e.line === 59 && e.selector === '.produit' && /radius/.test(e.property));
  assert.ok(produit.length >= 1, 'recente.css:59 .produit');
  for (const e of produit) {
    assert.match(e.property, /^border-.*-radius$/);
    assert.equal(e.written, '12px');
    assert.equal(e.value, 'var(--rayon-12, 12px)');
    assert.equal(e.section, 'RATTACHE');
  }
  assert.equal(mods.tokensCss.path, '/desordre/styles/tokens.css');
  for (const p of [...PAGES, WITNESS]) assert.ok(mods.brief.pages.includes(p), p);
});

test('S1 : chaque déclaration listée par la consigne (à remplacer, à rattacher) a son entrée, et aucune autre', () => {
  const lines = /** @type {string[]} */ (run.migration.agent.lines);
  /** @type {Set<string>} */
  const listed = new Set();
  for (const l of lines) {
    const m = /Déclarations à (?:remplacer|rattacher) : (.*?)\. (?:Unité|Laisse|hors|Ne touche)/.exec(l);
    if (!m) continue;
    for (const d of m[1].split(/, (?=[\w-]+\.css:)/)) {
      const x = /^([\w-]+\.css):(\d+) (.+?) \((.+?)(?:, héritée)?\)$/.exec(d);
      assert.ok(x, d);
      listed.add(`${x[1]}:${x[2]} ${x[3]} ${x[4]}`);
    }
  }
  const unknown = new Set(mods.brief.reste.filter((/** @type {string} */ t) => t.includes('unité inconnue')));
  const got = new Set(mods.entries.filter((/** @type {any} */ e) => e.section !== 'COUPLAGES').map((/** @type {any} */ e) => `${e.sheet.split('/').pop()}:${e.line} ${e.selector} ${e.written}`));
  for (const k of listed) assert.ok(got.has(k) || [...unknown].some((t) => t.includes(k.split(' ')[0])), `listée sans entrée : ${k}`);
  for (const k of got) assert.ok(listed.has(k), `entrée non listée : ${k}`);
});

test('S1 : commentaires : conflits et unités relatives de RATTACHE', () => {
  for (const c of run.migration.conflicts ?? [])
    assert.ok(mods.comments.some((/** @type {any} */ x) => x.kind === 'conflit' && x.line === c.line && x.selector === c.selector && x.sheet.endsWith(`/${c.file}`)), `conflit ${c.file}:${c.line}`);
  const rel = run.migration.rows.filter((/** @type {any} */ r) => r.status === 'inchangé' && (r.declarations ?? []).some((/** @type {any} */ e) => e.unit === 'relative' && !e.conflict));
  assert.ok(rel.length > 0, 'au moins une unité relative rattachée');
  for (const r of rel) assert.ok(mods.comments.some((/** @type {any} */ x) => x.kind === 'unité relative' && x.rows.includes(r.id)), r.id);
});

test('S3, S4 : deux copies fraîches identiques ; relance sans changement ; HTML intact ; reduce sur la copie : plus rien à appliquer hors conflits', async () => {
  const [a, b] = [await fresh(), await fresh()];
  const before = await snapshot(a);
  await applyModifications(mods, { root: a });
  await applyModifications(mods, { root: b });
  const [sa, sb] = [await snapshot(a), await snapshot(b)];
  assert.deepEqual(Object.keys(sa).sort(), Object.keys(sb).sort());
  for (const f of Object.keys(sa)) assert.equal(sa[f], sb[f], `octet pour octet : ${f}`);
  for (const f of Object.keys(before).filter((x) => x.endsWith('.html'))) assert.equal(sa[f], before[f], `HTML intact : ${f}`);
  const again = await applyModifications(mods, { root: a });
  assert.deepEqual(again.written, ['reste.md']);
  assert.equal(again.results.filter((/** @type {any} */ x) => x.status === 'appliquée').length, 0);
  // Le reste de l'agent, pour la mesure : tokens.css chargé avant les autres feuilles.
  for (const f of Object.keys(sa).filter((x) => x.endsWith('.html'))) {
    const html = sa[f].replace(/(\n(\s*)<link rel="stylesheet")/, `\n$2<link rel="stylesheet" href="${mods.tokensCss.path}">$1`);
    assert.notEqual(html, sa[f], f);
    await writeFile(join(a, f), html);
  }
  const copy = await startFixtureServers({ root: a });
  try {
    const [r] = await runReduce({ ...common, addresses: [copy.origin + PAGES[0], ...PAGES.slice(1)], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-lot-s-')) });
    const left = r.migration.rows.filter((/** @type {any} */ x) => (x.status === 'appliquée' || x.status === 'décidée') && !x.conflict);
    assert.deepEqual(left.map((/** @type {any} */ x) => `${x.id} ${x.value} ${x.usage} → ${x.new}`), []);
  } finally {
    await copy.close();
  }
});

test('S4 : reste.md ne renvoie à aucune section absente (VÉRIFICATION : déclarations marquées ds-lab : conflit)', () => {
  const b = mods.brief;
  const text = [...b.reste, ...b.changeAussi, ...b.neTouchePas, ...b.signale, ...b.verification].join('\n');
  assert.doesNotMatch(text, /\b(CONFLITS|REMPLACEMENTS|RATTACHE|COUPLAGES)\b/);
  assert.ok(b.verification.some((/** @type {string} */ l) => l.includes('Les déclarations marquées /* ds-lab : conflit … */ et les unités relatives laissées ressortent telles quelles')), b.verification.join('\n'));
});
