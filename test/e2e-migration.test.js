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
/** Lot K : passage 2c plus la carte « Texte sur plein terre » (onSolid), fichier temporaire. */
let decisionsK = '';
/** @type {{ data: any, md: string, decisions: Record<string, string | false> }} */
const decidee = { data: null, md: '', decisions: {} };
/** @type {{ data: any, md: string }} */
const refusee = { data: null, md: '' };
/** Lot I : les pages en désordre sans fichier de jetons. */
/** @type {{ data: any, md: string }} */
const sansJetons = { data: null, md: '' };
/** Date de réduction des passages ci-dessous (now). */
const STAMP = '2026-11-12T1400';

/** Lignes d'une section de la consigne, de son titre à la ligne vide. @param {string[]} lines @param {string} head */
const sectionOf = (lines, head) => {
  const i = lines.findIndex((l) => l.startsWith(head));
  if (i < 0) return null;
  const j = lines.indexOf('', i);
  return lines.slice(i, j < 0 ? undefined : j);
};
/** Ligne numérotée d'une section pour un identifiant. @param {string[]} sec @param {string} id */
const stepOf = (sec, id) => sec.find((l) => new RegExp(`^\\d+\\. ${id} `).test(l));
/** Valeurs inchangées qui ont un jeton. @param {any} d */
const withToken = (d) => d.rows.filter((/** @type {any} */ r) => r.status === 'inchangé' && /^(couleur|espace|taille-texte|rayon)\./.test(r.token));

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
  // Lot K : le couplage est une décision par plein ; le passage 2c tranche aussi la carte du plein terre.
  const kDir = await mkdtemp(join(tmpdir(), 'ds-lab-migration-k-'));
  decisionsK = join(kDir, 'decisions-passage-2c-plein.json');
  decidee.decisions = { ...JSON.parse(await readFile(DECISIONS, 'utf8')), 'plein|terre': 'onSolid' };
  await writeFile(decisionsK, JSON.stringify(decidee.decisions));
  const addresses = [servers.origin + first, ...rest];
  const [dd] = await runReduce({ ...common, addresses, decisionsPath: decisionsK, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  decidee.data = dd.migration;
  decidee.md = await readFile(dd.files[2], 'utf8');
  const tmp = await mkdtemp(join(tmpdir(), 'ds-lab-migration-'));
  const withRefusal = join(tmp, 'decisions-refus.json');
  await writeFile(withRefusal, JSON.stringify({ ...decidee.decisions, 'colors|#999999|bordure': false }));
  const [rr] = await runReduce({ ...common, addresses, decisionsPath: withRefusal, outRoot: tmp });
  refusee.data = rr.migration;
  refusee.md = await readFile(rr.files[2], 'utf8');
  const { tokensPath: _t, ...noTokens } = common;
  const [sj] = await runReduce({ ...noTokens, addresses, outRoot: await mkdtemp(join(tmpdir(), 'ds-lab-migration-')) });
  sansJetons.data = sj.migration;
  sansJetons.md = await readFile(sj.files[2], 'utf8');
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
  // Lot K : sans décision, la carte du plein terre attend (K5) : aucun couplage ; tranchée « onSolid », les deux.
  assert.deepEqual(e.onSolid, [], 'aucun couplage sans décision');
  assert.deepEqual(
    decidee.data.exceptions.onSolid.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
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
  // Lot K : « plein|terre » est la décision d'une carte, pas d'une ligne ; ses lignes de fond la suivent.
  const n = Object.keys(decidee.decisions).filter((k) => !k.startsWith('plein|')).length;
  assert.equal(n, 10, 'décisions lues');
  // Lot P : « spacing|10px|marge », choisi avant la coupure, vaut pour ses deux lignes.
  assert.equal(decidee.data.decided, n + 1);
  assert.equal(decidee.data.sections.pending.total, 1, 'en attente');
  const pending = decidee.data.rows.filter((/** @type {any} */ r) => r.status === 'en attente');
  assert.deepEqual(pending.map((/** @type {any} */ r) => `${r.family}|${r.value}`), ['fontSizes|40px'], 'seule la taille de texte 40px est en attente');
  assert.equal(decidee.data.sections.applied.total, E.desordre.sections.applied.total + n + 1, 'appliqué');
  assert.equal(decidee.data.sections.refused.total, 0, 'refusée');
  for (const [key, value] of Object.entries(decidee.decisions)) {
    if (key.startsWith('plein|')) continue;
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
  // Lot V, étape 6 : deux règles générales s'ajoutent (D3 unité relative, D4 conflits).
  assert.equal(ctx.length, 5, 'contexte en 5 lignes');
  assert.ok(ctx.some((/** @type {string} */ l) => l.includes("en repli, l'ancienne valeur ; si la source l'écrit autrement (rem, rgb()), garde l'écriture de la source")));
  // Lot V, étape 6 : tokens.css dans toute page qui charge une feuille modifiée (pages témoins comprises).
  assert.ok(a.lines.includes('0. Crée tokens.css, qui déclare dans :root chaque variable utilisée ci-dessous avec sa valeur, à partir de primitives.tokens.json, et charge-la avant toutes les autres feuilles, dans toute page qui charge une feuille modifiée, pas seulement les pages de la table.'), 'étape 0');
  assert.ok(a.lines.includes('- Souligne tout lien posé dans du texte courant : 0 trouvé ici.'), 'change aussi');
  assert.ok(pieges.data.agent.lines.includes('- Souligne tout lien posé dans du texte courant : 1 trouvé ici (a.lien-discret).'), 'change aussi, pièges (L1)');
  const steps = (sectionOf(a.lines, 'REMPLACEMENTS (') ?? []).filter((/** @type {string} */ l) => /^[1-9]\d*\. /.test(l));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('Propriété font-size, usage taille du texte : remplace 13.5px par var(--taille-texte-14, 13.5px) (14px)')), 'usage taille du texte');
  // Lot V, étape 6 (D4) : une ligne dont toutes les déclarations sont en conflit passe en CONFLITS.
  const total = decidee.data.rows.filter((/** @type {any} */ r) => (r.status === 'appliquée' || r.status === 'décidée') && r.conflict === 'total').length;
  assert.equal(steps.length, decidee.data.sections.applied.total - total, 'une instruction par ligne appliquée, hors conflit total');
  // Lot V, étape 6 : une ligne aux déclarations tracées les liste ; sinon, la recherche par valeur.
  for (const l of steps) assert.ok(l.endsWith('Ne touche que ces déclarations.') || l.includes('Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.'), l);
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #999999 par var(--couleur-neutre-11, #999999) (#6d675b)') && l.includes('Propriété color')));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #1f2a44 par var(--couleur-bleu-12, #1f2a44) (#103060) [décidée]')));
  assert.ok(text.includes('Le texte posé sur un plein terre devient #220000 (onSolid, var(--couleur-terre-sur-plein, #ffffff))'));
  assert.ok(text.includes('- Hors table : #2196f3'));
  assert.ok(text.includes('- Composant tiers : .tiers-cookies'));
  assert.ok(text.includes('- Valeur hors de sa tranche : #2b4c7e (bleu-9) en texte'));
  assert.ok(text.includes(`--decisions ${decisionsK}`), 'commande exacte');
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

// Lot I : rattacher les valeurs inchangées à leur jeton, avec un repli.

test('I1 : RATTACHE après REMPLACEMENTS, une ligne par valeur inchangée qui a un jeton, même forme que les remplacements', () => {
  const a = desordre.data.agent.lines;
  const want = withToken(desordre.data);
  assert.ok(want.length > 0, 'des valeurs inchangées ont un jeton');
  const iRep = a.findIndex((/** @type {string} */ l) => l.startsWith('REMPLACEMENTS ('));
  const sec = sectionOf(a, 'RATTACHE (');
  assert.ok(sec, 'section RATTACHE absente');
  assert.equal(sec[0], `RATTACHE (${want.length})`);
  assert.ok(a.indexOf(sec[0]) > iRep, 'après REMPLACEMENTS');
  assert.ok(a.indexOf(sec[0]) < a.findIndex((/** @type {string} */ l) => l.startsWith('COUPLAGES (')), 'avant COUPLAGES');
  assert.equal(sec.length - 1, want.length, 'une ligne par valeur');
  for (const r of want) {
    const l = stepOf(sec, r.id);
    assert.ok(l, `${r.id} absente de RATTACHE`);
    assert.ok(l.includes(`${r.id} ${r.title}.`), `titre : ${l}`);
    // Lot V, étape 6 (D3) : « sur les pages mesurées » ; avec ses déclarations tracées, la ligne les liste
    // (« Ne touche que ces déclarations. ») au lieu du point de départ et de la recherche.
    assert.ok(l.includes(`usage ${r.usage}, valeur ${r.value} : remplace la valeur écrite par var(--${r.token.replace(/\./g, '-')}, ${r.value}) ; aucun changement visible sur les pages mesurées.`), l);
    assert.ok(l.includes(' Propriété '), `propriété : ${l}`);
    assert.ok(l.includes(` Sélecteurs : ${r.selectors.join(', ') || '—'}`), `sélecteurs : ${l}`);
    if (r.declarations?.length) assert.ok(l.endsWith('Ne touche que ces déclarations.'), l);
    else {
      assert.ok(l.includes(` Point de départ : ${r.origin}.`), `point de départ : ${l}`);
      assert.ok(l.endsWith('Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.'), l);
    }
  }
  const white = desordre.data.rows.find((/** @type {any} */ r) => r.family === 'colors' && r.value === '#ffffff' && r.usage === 'texte');
  assert.ok(stepOf(sec, white.id)?.includes('Propriété color, usage texte, valeur #ffffff : remplace la valeur écrite par var(--couleur-blanc, #ffffff) ; aucun changement visible sur les pages mesurées.'), '#ffffff en texte');
});

test('I2 : inchangé sans jeton absent de RATTACHE ; sans fichier de jetons, une seule phrase', () => {
  const sec = sectionOf(desordre.data.agent.lines, 'RATTACHE (') ?? [];
  for (const r of desordre.data.rows.filter((/** @type {any} */ x) => x.status === 'inchangé' && !withToken(desordre.data).includes(x)))
    assert.equal(stepOf(sec, r.id), undefined, `${r.id} sans jeton dans RATTACHE`);
  const n = sansJetons.data.rows.filter((/** @type {any} */ r) => r.status === 'inchangé').length;
  assert.ok(n > 1);
  assert.deepEqual(sectionOf(sansJetons.data.agent.lines, 'RATTACHE'), ['RATTACHE (0)', `Aucun fichier de jetons : relance avec --tokens pour rattacher ${n} valeurs.`]);
});

test('I3 : repli partout, l’ancienne valeur mesurée de la ligne ; la source garde son écriture', () => {
  const a = desordre.data.agent.lines;
  const ctx = a.slice(1, a.indexOf(''));
  assert.ok(ctx.some((/** @type {string} */ l) => l.includes("en repli, l'ancienne valeur ; si la source l'écrit autrement (rem, rgb()), garde l'écriture de la source")), 'contexte');
  assert.ok(!a.join('\n').includes("valeur d'origine"), 'plus de texte « valeur d’origine »');
  for (const head of ['REMPLACEMENTS (', 'RATTACHE (']) {
    const sec = sectionOf(a, head) ?? [];
    const steps = sec.filter((l) => /^[1-9]\d*\. /.test(l));
    assert.ok(steps.length > 0, head);
    for (const l of steps) {
      const id = l.split(' ')[1];
      const r = desordre.data.rows.find((/** @type {any} */ x) => x.id === id);
      const vars = l.match(/var\(--[^)]*\)/g) ?? [];
      for (const v of vars) assert.equal(v.split(', ')[1], `${r.value})`, `${head} ${id} : ${v}`);
    }
  }
  const rep = sectionOf(a, 'REMPLACEMENTS (') ?? [];
  assert.ok(rep.some((l) => l.includes('remplace #999999 par var(--couleur-neutre-11, #999999) (#6d675b)')), '#999999 en bordure');
  const dec = sectionOf(decidee.data.agent.lines, 'REMPLACEMENTS (') ?? [];
  assert.ok(dec.some((l) => l.includes('remplace 6px par var(--rayon-8, 6px) (8px) [décidée]')), 'rayon 6px décidé à 8px');
});

test('Correction 2 : COUPLAGES avec repli, l’ancienne couleur du texte', () => {
  // Lot K : le couplage n'existe que tranché « onSolid » (réduction décidée).
  const c = sectionOf(decidee.data.agent.lines, 'COUPLAGES (') ?? [];
  assert.ok(c.length > 1);
  for (const l of c.slice(1)) assert.ok(!/var\(--[^,)]*\)/.test(l), `variable sans repli : ${l}`);
  assert.ok(c.some((l) => l.startsWith('- Le texte posé sur un plein terre devient #220000 (onSolid, var(--couleur-terre-sur-plein, #ffffff))')));
});

test('Correction 3 : « Décisions lues » au-dessus du tableau de synthèse, pas au milieu', () => {
  const L = decidee.md.split('\n');
  const iDec = L.findIndex((l) => l.startsWith('Décisions lues : '));
  const iHead = L.indexOf('| section | lignes | couleurs | espacements | tailles | rayons |');
  assert.ok(iDec >= 0 && iDec < iHead, 'au-dessus');
  assert.deepEqual(
    L.slice(iHead + 1, iHead + 7).map((l) => l.split(' | ')[0]),
    ['|---|---|---|---|---|---|', '| Appliqué (auto, proche, correction, décidée)', '| Décisions en attente', '| Refusée, laissée telle quelle', '| Hors table', '| Inchangé : 35 rattachées, 0 sans jeton'],
    'tableau d’un seul tenant',
  );
});

test('I4 : décision en attente, un commentaire CSS au-dessus de la déclaration', () => {
  const nt = sectionOf(desordre.data.agent.lines, 'NE TOUCHE PAS') ?? [];
  const pending = desordre.data.rows.filter((/** @type {any} */ r) => r.status === 'en attente');
  assert.ok(pending.length > 0);
  for (const r of pending) {
    const l = nt.find((x) => x.startsWith(`- ${r.id} `));
    const rel = r.relation === '—' ? '' : ` ${r.relation.split(' · ')[0]}`;
    assert.ok(l?.includes(` Ajoute au-dessus de la déclaration le commentaire /* ds-lab : en attente du designer, ${r.value} ${r.usage}${rel} (${r.id}, ${STAMP}) */.`), `${r.id} : ${l}`);
  }
  // Écrits à la main : la marge de 10 px entre composants, la taille de 40 px sans relation.
  const m10 = pending.find((/** @type {any} */ r) => r.value === '10px' && r.scope === 'entre composants');
  assert.ok(nt.some((x) => x.includes(`/* ds-lab : en attente du designer, 10px marge entre composants (${m10.id}, 2026-11-12T1400) */`)));
  const t40 = pending.find((/** @type {any} */ r) => r.value === '40px');
  assert.ok(nt.some((x) => x.includes(`/* ds-lab : en attente du designer, 40px taille du texte (${t40.id}, 2026-11-12T1400) */`)));
});

test('I5 : valeur hors tranche et inchangée, rattachée et toujours signalée', () => {
  const a = desordre.data.agent.lines;
  const rat = sectionOf(a, 'RATTACHE (') ?? [];
  const sig = sectionOf(a, 'SIGNALE SANS MODIFIER') ?? [];
  // #2b4c7e (bleu-9) en texte et en bordure, #f0c987 (sable-9) en fond : inchangées ; #f0c987 en texte : correction.
  for (const [value, usage, attached] of /** @type {const} */ ([['#2b4c7e', 'texte', true], ['#2b4c7e', 'bordure', true], ['#f0c987', 'fond', true], ['#f0c987', 'texte', false]])) {
    const r = desordre.data.rows.find((/** @type {any} */ x) => x.family === 'colors' && x.value === value && x.usage === usage);
    const l = sig.find((x) => x.startsWith(`- Valeur hors de sa tranche : ${value} `) && x.includes(` en ${usage},`));
    assert.ok(l, `${value} ${usage} signalée`);
    assert.equal(!!stepOf(rat, r.id), attached, `${value} ${usage} dans RATTACHE`);
    assert.equal(l.endsWith(" ; rattaché, rôle à revoir à l'étape 3."), attached, l);
  }
  const sigNo = sectionOf(sansJetons.data.agent.lines, 'SIGNALE SANS MODIFIER') ?? [];
  assert.ok(sigNo.every((x) => !x.includes('rattaché')), 'sans jetons : rien de rattaché');
});

test('I6 : VÉRIFICATION, variables déclarées dans tokens.css, repli retiré en fin de migration', () => {
  const v = sectionOf(desordre.data.agent.lines, 'VÉRIFICATION') ?? [];
  assert.ok(v.includes('Chaque variable écrite est déclarée dans tokens.css.'));
  assert.ok(v.includes('Retire le repli quand toutes les pages sont migrées, pas avant.'));
});

test('I7 : synthèse, la ligne Inchangé dit combien rattachées et combien sans jeton', () => {
  const n = desordre.data.unchanged;
  const k = withToken(desordre.data).length;
  assert.ok(desordre.md.includes(`| Inchangé : ${k} rattachées, ${n - k} sans jeton | ${n} |`), 'avec jetons');
  const m = sansJetons.data.unchanged;
  assert.ok(sansJetons.md.includes(`| Inchangé : 0 rattachée, ${m} sans jeton | ${m} |`), 'sans jetons');
});

test('I8 : README, glossaire « Rattacher » et « Repli », limites à jour', async () => {
  const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /^\| Rattacher \| .+ \|$/m);
  assert.match(readme, /^\| Repli \| .+ \|$/m);
  const limits = readme.slice(readme.indexOf('## Limites'));
  assert.ok(!limits.includes('R10, en cours'), 'R10 en cours retiré');
  assert.ok(limits.includes('repli à retirer en fin de migration'));
});
