// @ts-check
/**
 * Lot M : migration.md, écrit par reduce à chaque réduction. Comparé à
 * fixtures/marque-demo/expected-migration.json, écrit avant le code : sur les
 * trois pages en désordre (instantané de la table du lot B) et sur la page des
 * pièges (L1, lien sans soulignement dans un paragraphe).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';

const E = JSON.parse(await readFile(new URL('../fixtures/marque-demo/expected-migration.json', import.meta.url), 'utf8'));
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const TOL = 0.01;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {{ data: any, md: string, table: any }} */
const desordre = { data: null, md: '', table: null };
/** @type {{ data: any, md: string }} */
const pieges = { data: null, md: '' };
/** Passage 2c : décisions du designer (fixtures/marque-demo/decisions-passage-2c.json), puis un refus en plus. */
const DECISIONS = `${FIXTURE_DIR}decisions-passage-2c.json`;
/** @type {{ data: any, md: string, decisions: Record<string, string | false> }} */
const decidee = { data: null, md: '', decisions: {} };
/** @type {{ data: any, md: string }} */
const refusee = { data: null, md: '' };

before(async () => {
  servers = await startFixtureServers();
  const common = {
    targetPath: `${FIXTURE_DIR}cible-valise.json`,
    tokensPath: TOKENS,
    sourcesPath: `${FIXTURE_DIR}sources.json`,
    viewport: E.conditions.viewport,
    waitMs: 100,
    now: new Date(2026, 10, 12, 14, 0),
  };
  const [first, ...rest] = E.conditions.pages;
  const [d] = await runReduce({ ...common, addresses: [servers.origin + first, ...rest], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  desordre.data = d.migration;
  desordre.table = d.table;
  desordre.md = await readFile(d.files[2], 'utf8');
  const [p] = await runReduce({ ...common, addresses: [servers.origin + '/pieges/pieges.html'], outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  pieges.data = p.migration;
  pieges.md = await readFile(p.files[2], 'utf8');
  decidee.decisions = JSON.parse(await readFile(DECISIONS, 'utf8'));
  const addresses = [servers.origin + first, ...rest];
  const [dd] = await runReduce({ ...common, addresses, decisionsPath: DECISIONS, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  decidee.data = dd.migration;
  decidee.md = await readFile(dd.files[2], 'utf8');
  const tmp = await mkdtemp(join(tmpdir(), 'ds-lab-migration-'));
  const withRefusal = join(tmp, 'decisions-refus.json');
  await writeFile(withRefusal, JSON.stringify({ ...decidee.decisions, 'colors|#999999|bordure': false }));
  const [rr] = await runReduce({ ...common, addresses, decisionsPath: withRefusal, outRoot: tmp });
  refusee.data = rr.migration;
  refusee.md = await readFile(rr.files[2], 'utf8');
});

after(async () => servers?.close());

test('expected-migration.json : contrastes recalculés avec culori', () => {
  const l = E.pieges.exceptions.ununderlinedLinks;
  assert.ok(Math.abs(wcagContrast(l.value, l.neighbor) - l.ratio) < 5e-4);
  for (const p of E.desordre.exceptions.onSolid.pairs) assert.ok(wcagContrast(p.text, p.bg) < 4.5, `${p.text} sur ${p.bg}`);
});

test('migration.md : table, trois sections et cinq exceptions nommées', () => {
  for (const h of ['## Table', '## Appliqué (auto, proche, correction, décidée)', '## Décisions en attente', '## Refusée, laissée telle quelle', '## Hors table', '## Exceptions'])
    assert.ok(desordre.md.includes(h), h);
  for (const h of ['Liens sans soulignement dans un paragraphe', 'onSolid', 'États non lus', 'Élément injecté après le chargement', 'Égalités tranchées en silence'])
    assert.ok(desordre.md.includes(`### ${h}`) || desordre.md.includes(h), h);
  // Lot P, étape 3 : relation et motif sur chaque ligne de la table.
  assert.ok(desordre.md.includes('| famille | valeur | usage | jeton | classe | relation | motif | origine CSS | éléments |'));
});

test(`désordre : ${E.desordre.table.rows} lignes valeur × usage, dont ${E.desordre.table.unchanged} inchangées`, () => {
  assert.equal(desordre.data.rows.length, E.desordre.table.rows);
  assert.equal(desordre.data.unchanged, E.desordre.table.unchanged);
});

for (const [k, label] of [['applied', 'appliqué'], ['pending', 'décisions en attente'], ['outOfTable', 'hors table']]) {
  test(`désordre, section ${label} : ${JSON.stringify(E.desordre.sections[k])}`, () => {
    const want = E.desordre.sections[k];
    const got = desordre.data.sections[k];
    assert.equal(got.total, want.total, `${label} : total`);
    for (const f of ['colors', 'spacing', 'fontSizes', 'radii']) if (f in want) assert.equal(got[f], want[f], `${label} : ${f}`);
    for (const r of want.rows ?? []) {
      const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === r.family && x.value === r.value);
      assert.ok(row, `${r.value} absente`);
      assert.ok(String(row.reason).includes(r.reason), `${r.value} : motif « ${row.reason} »`);
    }
  });
}

test('désordre : jetons DTCG repris de primitives.tokens.json', () => {
  for (const t of E.desordre.tokens) {
    const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === t.family && x.value === t.value && (!t.usage || x.usage === t.usage));
    assert.ok(row, `${t.family} ${t.value} ${t.usage ?? ''} absente`);
    assert.equal(row.token, t.token, `${t.value} ${t.usage ?? ''}`);
  }
  assert.ok(desordre.data.rows.every((/** @type {any} */ r) => r.token === '—' || r.token === 'jeton absent' || /^(couleur|espace|taille-texte|rayon)\./.test(r.token)));
});

test('désordre et pièges : #ffffff → couleur.blanc ; aucun jeton sur-plein hors d’un texte posé sur un plein', () => {
  for (const d of [desordre.data, pieges.data]) {
    for (const r of d.rows.filter((/** @type {any} */ x) => x.family === 'colors' && x.value === '#ffffff' && x.class === 'inchangé')) assert.equal(r.token, 'couleur.blanc', `#ffffff ${r.usage}`);
    for (const r of d.rows.filter((/** @type {any} */ x) => /sur-plein/.test(x.token))) assert.equal(r.usage, 'texte', `${r.value} ${r.usage} : ${r.token}`);
  }
});

test('désordre : exception « valeur de la valise utilisée hors de sa tranche » (#2b4c7e, bleu-9, en texte)', () => {
  const list = desordre.data.exceptions.outOfSlice;
  const x = list.find((/** @type {any} */ y) => y.value === '#2b4c7e' && y.usage === 'texte');
  assert.ok(x, '#2b4c7e en texte absent de la liste');
  assert.equal(x.name, 'bleu-9');
  assert.equal(x.expected, 'texte 11-12');
  assert.ok(x.elements > 0);
  assert.ok(desordre.md.includes('### Valeur de la valise utilisée hors de sa tranche'));
});

test('désordre : origine CSS (fichier:ligne de la règle)', () => {
  for (const o of E.desordre.origins) {
    const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === o.family && x.value === o.value && (!o.usage || x.usage === o.usage));
    assert.ok(row, `${o.value} absente`);
    assert.equal(row.origin, o.origin, o.value);
  }
});

test('désordre : exceptions', () => {
  const e = desordre.data.exceptions;
  const want = E.desordre.exceptions;
  assert.equal(e.links.length, want.ununderlinedLinks.count, 'liens sans soulignement');
  assert.deepEqual(
    e.onSolid.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    want.onSolid.pairs.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    'texte sur plein à poser en onSolid',
  );
  assert.equal(e.states.length, want.unreadStates.count, 'états non lus');
  for (const v of want.unreadStates.values) {
    const s = e.states.find((/** @type {any} */ x) => x.value === v.value);
    assert.ok(s?.contexts.some((/** @type {any} */ c) => c.state === v.state && c.property === v.property), `${v.value} ${v.state}`);
  }
  assert.equal(e.injected, null, 'injecté : limite connue, sans compte');
  assert.deepEqual(
    e.ties.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    want.silentTies.rows.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    'égalités tranchées en silence',
  );
});

test('pièges : L1, un lien sans soulignement dans un paragraphe', () => {
  const want = E.pieges.exceptions.ununderlinedLinks;
  const links = pieges.data.exceptions.links;
  assert.equal(links.length, want.count);
  assert.equal(links[0].color, want.value);
  assert.equal(links[0].neighbor, want.neighbor);
  assert.ok(Math.abs(links[0].ratio - want.ratio) <= TOL, `contraste ${links[0].ratio}`);
  assert.ok(pieges.md.includes('### Liens sans soulignement dans un paragraphe : 1'));
});

test('décisions (passage 2c) : les 10 décisions lues décident 11 lignes (la marge de 10 px est coupée par relation), qui passent dans « Appliqué » ; une seule en attente, la taille 40px née du lot R', () => {
  const n = Object.keys(decidee.decisions).length;
  assert.equal(n, 10, 'décisions lues');
  // Lot P : « spacing|10px|marge », choisi avant la coupure, vaut pour ses deux lignes.
  assert.equal(decidee.data.decided, n + 1);
  assert.equal(decidee.data.sections.pending.total, 1, 'en attente');
  const pending = decidee.data.rows.filter((/** @type {any} */ r) => r.status === 'en attente');
  assert.deepEqual(pending.map((/** @type {any} */ r) => `${r.family}|${r.value}`), ['fontSizes|40px'], 'seule la taille de texte 40px est en attente');
  assert.equal(decidee.data.sections.applied.total, E.desordre.sections.applied.total + n + 1, 'appliqué');
  assert.equal(decidee.data.sections.refused.total, 0, 'refusée');
  for (const [key, value] of Object.entries(decidee.decisions)) {
    const [family, old, usage] = key.split('|');
    const row = decidee.data.rows.find((/** @type {any} */ r) => r.family === family && r.value === old && r.usage === usage);
    assert.ok(row, `${key} absente`);
    assert.equal(row.status, 'décidée', key);
    assert.equal(row.new, value, `${key} : valeur choisie`);
  }
  const ink = decidee.data.rows.find((/** @type {any} */ r) => r.value === '#1f2a44' && r.usage === 'texte');
  assert.equal(ink.token, 'couleur.bleu.12', 'jeton de la valeur choisie');
  assert.ok(decidee.md.includes('| décision, décidée |'), 'mention « décidée » dans la table');
  assert.ok(decidee.md.includes('## Décisions en attente : 1'));
});

test('décisions : une ligne refusée va dans « Refusée, laissée telle quelle »', () => {
  assert.equal(refusee.data.sections.refused.total, 1);
  const row = refusee.data.rows.find((/** @type {any} */ r) => r.value === '#999999' && r.usage === 'bordure');
  assert.equal(row.status, 'refusée');
  assert.equal(row.new, null);
  assert.equal(refusee.data.sections.applied.total, decidee.data.sections.applied.total - 1);
  assert.ok(refusee.md.includes('## Refusée, laissée telle quelle : 1'));
  assert.ok(refusee.data.agent.lines.some((/** @type {string} */ l) => l.startsWith('- Refusée : #999999 (bordure)')), 'consigne : ne pas toucher');
});

test('consigne pour un agent : contexte, une instruction par ligne appliquée, couplage onSolid, vérification', () => {
  const a = decidee.data.agent;
  const text = a.lines.join('\n');
  assert.ok(decidee.md.includes('## Consigne pour un agent'));
  const ctx = a.lines.slice(1, a.lines.indexOf(''));
  assert.equal(ctx.length, 3, 'contexte en 3 lignes');
  assert.ok(ctx.some((/** @type {string} */ l) => l.includes('var(--couleur-neutre-11)')));
  assert.ok(a.lines.includes('0. Crée tokens.css, qui déclare dans :root chaque variable utilisée ci-dessous avec sa valeur, à partir de primitives.tokens.json, et charge-la avant toutes les autres feuilles.'), 'étape 0');
  assert.ok(a.lines.includes('- Souligne tout lien posé dans du texte courant : 0 trouvé ici.'), 'change aussi');
  assert.ok(pieges.data.agent.lines.includes('- Souligne tout lien posé dans du texte courant : 1 trouvé ici (a.lien-discret).'), 'change aussi, pièges (L1)');
  const steps = a.lines.filter((/** @type {string} */ l) => /^[1-9]\d*\. /.test(l));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('Propriété font-size, usage taille du texte : remplace 13.5px par var(--taille-texte-14) (14px)')), 'usage taille du texte');
  assert.equal(steps.length, decidee.data.sections.applied.total, 'une instruction par ligne appliquée');
  for (const l of steps) assert.ok(l.includes('Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.'), l);
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #999999 par var(--couleur-neutre-11) (#6d675b)') && l.includes('Propriété color')));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #1f2a44 par var(--couleur-bleu-12) (#103060) [décidée]')));
  assert.ok(text.includes('Le texte posé sur un plein terre devient #220000 (onSolid, var(--couleur-terre-sur-plein))'));
  assert.ok(text.includes('- Hors table : #2196f3'));
  assert.ok(text.includes('- Composant tiers : .tiers-cookies'));
  assert.ok(text.includes('- Valeur hors de sa tranche : #2b4c7e (bleu-9) en texte'));
  assert.ok(text.includes(`--decisions ${DECISIONS}`), 'commande exacte');
  assert.ok(a.lines.includes('Après modification du CSS, relance reduce sur les pages de la table et sur les pages témoins, et compare au prévu ; signale tout écart avant la mise en ligne.'), 'pages témoins');
  assert.deepEqual(decidee.data.remaining.map((/** @type {any} */ p) => `${p.text}|${p.bg}`), ['#2196f3|#ffffff'], 'une seule paire sous 4,5:1 après migration');
});

test('consigne : tous les sélecteurs, sans plafond ; les deux lignes de la marge de 10 px, cherchées par valeur, usage et relation, citent leurs éléments', () => {
  // Lot P : la marge basse de 10 px est coupée par relation ; p.aide est entre composants.
  const want = { 'entre composants': ['input#nom', 'p.erreur', 'p.aide'], 'dans le composant': ['input#courriel', 'input#telephone'] };
  const pending = desordre.md.slice(desordre.md.indexOf('## Décisions en attente'), desordre.md.indexOf('## Refusée'));
  for (const [scope, sels] of Object.entries(want)) {
    const r = desordre.table.families.spacing.rows.find((/** @type {any} */ x) => x.old === '10px' && x.usage === 'marge' && x.scope === scope);
    assert.ok(r, `10px marge « ${scope} » absente`);
    const line = desordre.data.agent.lines.find((/** @type {string} */ l) => l.startsWith(`- ${r.id} `));
    assert.ok(line, `${r.id} absente de la consigne`);
    for (const sel of sels) assert.ok(line.includes(sel), `${sel} : ${line}`);
    // Table « Décisions en attente » : sélecteurs en dernière colonne.
    const row = pending.split('\n').find((/** @type {string} */ l) => l.startsWith(`| ${r.id} `));
    for (const sel of sels) assert.ok(row?.includes(`\`${sel}\``), `table : ${row}`);
  }
});
