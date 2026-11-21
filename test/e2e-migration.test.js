// @ts-check
/**
 * migration.md, écrit par reduce à chaque réduction. Comparé à
 * fixtures/marque-demo/expected-migration.json, écrit avant le code : sur les
 * trois pages en désordre (instantané de la table par usage) et sur la page des
 * pièges (L1, lien sans soulignement dans un paragraphe). Réductions sans décision,
 * avec et sans fichier de jetons ; les réductions décidées sont dans
 * e2e-migration-decisions.test.js.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { wcagContrast } from 'culori';
import { startFixtureServers } from './helpers/serveur.js';
import { E, reduire, pagesDesordre, sectionOf, stepOf, withToken } from './helpers/migration.js';

const TOL = 0.01;

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('./helpers/migration.js').Reduction} */
let desordre;
/** @type {import('./helpers/migration.js').Reduction} */
let pieges;
/** Les pages en désordre sans fichier de jetons. */
/** @type {import('./helpers/migration.js').Reduction} */
let sansJetons;
/** Date de réduction des passages ci-dessous (now). */
const STAMP = '2026-11-12T1400';

before(async () => {
  servers = await startFixtureServers();
  desordre = await reduire(pagesDesordre(servers.origin));
  pieges = await reduire([servers.origin + '/pieges/pieges.html']);
  sansJetons = await reduire(pagesDesordre(servers.origin), { sansJetons: true });
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
  // Relation et motif sur chaque ligne de la table.
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

test('désordre : jetons DTCG repris du resolver d’Orbe Café', () => {
  for (const t of E.desordre.tokens) {
    const row = desordre.data.rows.find((/** @type {any} */ x) => x.family === t.family && x.value === t.value && (!t.usage || x.usage === t.usage));
    assert.ok(row, `${t.family} ${t.value} ${t.usage ?? ''} absente`);
    assert.equal(row.token, t.token, `${t.value} ${t.usage ?? ''}`);
  }
  assert.ok(desordre.data.rows.every((/** @type {any} */ r) => r.token === '—' || r.token === 'jeton absent' || /^(color|space|font-size|radius)\./.test(r.token)));
});

test('désordre et pièges : #ffffff → color.white ; aucun jeton sur-plein hors d’un texte posé sur un plein', () => {
  for (const d of [desordre.data, pieges.data]) {
    for (const r of d.rows.filter((/** @type {any} */ x) => x.family === 'colors' && x.value === '#ffffff' && x.class === 'inchangé')) assert.equal(r.token, 'color.white', `#ffffff ${r.usage}`);
    for (const r of d.rows.filter((/** @type {any} */ x) => /on-solid/.test(x.token))) assert.equal(r.usage, 'texte', `${r.value} ${r.usage} : ${r.token}`);
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

test('pièges : L1, un lien sans soulignement dans un paragraphe', () => {
  const want = E.pieges.exceptions.ununderlinedLinks;
  const links = pieges.data.exceptions.links;
  assert.equal(links.length, want.count);
  assert.equal(links[0].color, want.value);
  assert.equal(links[0].neighbor, want.neighbor);
  assert.ok(Math.abs(links[0].ratio - want.ratio) <= TOL, `contraste ${links[0].ratio}`);
  assert.ok(pieges.md.includes('### Liens sans soulignement dans un paragraphe : 1'));
});

test('consigne : tous les sélecteurs, sans plafond ; les deux lignes de la marge de 10 px, cherchées par valeur, usage et relation, citent leurs éléments', () => {
  // La marge basse de 10 px est coupée par relation ; p.aide est entre composants.
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

// Rattacher les valeurs inchangées à leur jeton, avec un repli.

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
    // « sur les pages mesurées » ; avec ses déclarations tracées, la ligne les liste
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
  assert.ok(stepOf(sec, white.id)?.includes('Propriété color, usage texte, valeur #ffffff : remplace la valeur écrite par var(--color-white, #ffffff) ; aucun changement visible sur les pages mesurées.'), '#ffffff en texte');
});

test('I2 : inchangé sans jeton absent de RATTACHE ; sans fichier de jetons, une seule phrase', () => {
  const sec = sectionOf(desordre.data.agent.lines, 'RATTACHE (') ?? [];
  for (const r of desordre.data.rows.filter((/** @type {any} */ x) => x.status === 'inchangé' && !withToken(desordre.data).includes(x)))
    assert.equal(stepOf(sec, r.id), undefined, `${r.id} sans jeton dans RATTACHE`);
  const n = sansJetons.data.rows.filter((/** @type {any} */ r) => r.status === 'inchangé').length;
  assert.ok(n > 1);
  assert.deepEqual(sectionOf(sansJetons.data.agent.lines, 'RATTACHE'), ['RATTACHE (0)', `Aucun fichier de jetons : relance avec --tokens pour rattacher ${n} valeurs.`]);
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
  // #2b4c7e (bleu-9) en texte et en bordure, #f0c987 (sable-9) en fond : inchangées, rattachées et signalées.
  // #f0c987 en texte est une correction, dans REMPLACEMENTS : plus dans SIGNALE.
  for (const [value, usage, attached] of /** @type {const} */ ([['#2b4c7e', 'texte', true], ['#2b4c7e', 'bordure', true], ['#f0c987', 'fond', true]])) {
    const r = desordre.data.rows.find((/** @type {any} */ x) => x.family === 'colors' && x.value === value && x.usage === usage);
    const l = sig.find((x) => x.startsWith(`- Valeur hors de sa tranche : ${value} `) && x.includes(` en ${usage},`));
    assert.ok(l, `${value} ${usage} signalée`);
    assert.equal(!!stepOf(rat, r.id), attached, `${value} ${usage} dans RATTACHE`);
    assert.equal(l.endsWith(' ; rattaché, rôle à revoir.'), attached, l);
  }
  assert.ok(!sig.some((x) => x.includes(' #f0c987 ') && x.includes(' en texte,')), '#f0c987 en texte : remplacée, pas signalée');
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
