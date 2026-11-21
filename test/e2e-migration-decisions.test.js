// @ts-check
/**
 * migration.md, écrit par reduce, sur les réductions décidées des trois pages en
 * désordre : décisions du designer (passage 2c), puis un refus en plus. Comparé à
 * fixtures/marque-demo/expected-migration.json, écrit avant le code. Les réductions
 * sans décision, relancées ici pour les comparaisons, sont jugées dans
 * e2e-migration.test.js.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { E, reduire, pagesDesordre, sectionOf } from './helpers/migration.js';

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {import('./helpers/migration.js').Reduction} */
let desordre;
/** @type {import('./helpers/migration.js').Reduction} */
let pieges;
/** Passage 2c : décisions du designer (fixtures/marque-demo/decisions-passage-2c.json), puis un refus en plus. */
const DECISIONS = `${FIXTURE_DIR}decisions-passage-2c.json`;
/** Passage 2c plus la carte « Texte sur plein terre » (onSolid), fichier temporaire. */
let decisionsK = '';
/** @type {import('./helpers/migration.js').Reduction & { decisions: Record<string, string | false> }} */
const decidee = { data: null, md: '', table: null, decisions: {} };
/** @type {import('./helpers/migration.js').Reduction} */
let refusee;

before(async () => {
  servers = await startFixtureServers();
  const addresses = pagesDesordre(servers.origin);
  desordre = await reduire(addresses);
  pieges = await reduire([servers.origin + '/pieges/pieges.html']);
  // Le couplage est une décision par plein ; le passage 2c tranche aussi la carte du plein terre.
  const kDir = await mkdtemp(join(tmpdir(), 'ds-lab-migration-k-'));
  decisionsK = join(kDir, 'decisions-passage-2c-plein.json');
  decidee.decisions = { ...JSON.parse(await readFile(DECISIONS, 'utf8')), 'plein|terre': 'onSolid' };
  await writeFile(decisionsK, JSON.stringify(decidee.decisions));
  Object.assign(decidee, await reduire(addresses, { decisionsPath: decisionsK }));
  const withRefusal = join(await mkdtemp(join(tmpdir(), 'ds-lab-migration-')), 'decisions-refus.json');
  await writeFile(withRefusal, JSON.stringify({ ...decidee.decisions, 'colors|#999999|bordure': false }));
  refusee = await reduire(addresses, { decisionsPath: withRefusal });
});

after(async () => servers?.close());

test('désordre : exceptions', () => {
  const e = desordre.data.exceptions;
  const want = E.desordre.exceptions;
  assert.equal(e.links.length, want.ununderlinedLinks.count, 'liens sans soulignement');
  // Sans décision, la carte du plein terre attend (K5) : aucun couplage ; tranchée « onSolid », les deux.
  assert.deepEqual(e.onSolid, [], 'aucun couplage sans décision');
  assert.deepEqual(
    decidee.data.exceptions.onSolid.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    want.onSolid.pairs.map((/** @type {any} */ p) => `${p.text}|${p.bg}|${p.scale}|${p.onSolid}`).sort(),
    'texte sur plein à poser en onSolid',
  );
  assert.equal(e.states.length, want.unreadStates.count, 'états non lus');
  for (const v of want.unreadStates.values) {
    // D32 : l'anneau du navigateur se reconnaît par sa nature (état, propriété, anneau du navigateur), pas par sa
    // couleur, qui dépend du système ; une valeur écrite par le site se reconnaît par sa valeur.
    const s = e.states.find((/** @type {any} */ x) =>
      v.value ? x.value === v.value : !!x.navigateur === !!v.navigateur && x.contexts.some((/** @type {any} */ c) => c.state === v.state && c.property === v.property),
    );
    assert.ok(s?.contexts.some((/** @type {any} */ c) => c.state === v.state && c.property === v.property), `${v.value ?? 'anneau du navigateur'} ${v.state}`);
    // D19 : l'anneau de focus du navigateur est nommé comme tel.
    if (v.navigateur) assert.equal(s?.navigateur, true, `${v.value} : anneau du navigateur`);
  }
  assert.equal(e.injected, null, 'injecté : limite connue, sans compte');
  assert.deepEqual(
    e.ties.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    want.silentTies.rows.map((/** @type {any} */ t) => `${t.family}|${t.value}|${t.usage}|${t.class}|${t.new}|${t.tie.join('/')}`).sort(),
    'égalités tranchées en silence',
  );
});

test('décisions (passage 2c) : les 10 décisions lues décident 11 lignes (la marge de 10 px est coupée par relation), qui passent dans « Appliqué » ; trois en attente, la taille 40px née de la règle des tailles de texte et deux égalités (D20)', () => {
  // « plein|terre » est la décision d'une carte, pas d'une ligne ; ses lignes de fond la suivent.
  const n = Object.keys(decidee.decisions).filter((k) => !k.startsWith('plein|')).length;
  assert.equal(n, 10, 'décisions lues');
  // « spacing|10px|marge », choisi avant la coupure, vaut pour ses deux lignes.
  assert.equal(decidee.data.decided, n + 1);
  // D20 : 14px marge et 3px rayon, égalités, attendent le designer ; le passage 2c,
  // écrit avant, ne les décide pas.
  assert.equal(decidee.data.sections.pending.total, 3, 'en attente');
  const pending = decidee.data.rows.filter((/** @type {any} */ r) => r.status === 'en attente');
  assert.deepEqual(pending.map((/** @type {any} */ r) => `${r.family}|${r.value}`).sort(), ['fontSizes|40px', 'radii|3px', 'spacing|14px'], 'la taille de texte 40px et les deux égalités sont en attente');
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
  assert.equal(ink.token, 'color.blue.12', 'jeton de la valeur choisie');
  assert.ok(decidee.md.includes('| décision, décidée |'), 'mention « décidée » dans la table');
  assert.ok(decidee.md.includes('## Décisions en attente : 3'), 'D20 : la taille 40px et les deux égalités');
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
  // Deux règles générales s'ajoutent (D3 unité relative, D4 conflits).
  assert.equal(ctx.length, 5, 'contexte en 5 lignes');
  assert.ok(ctx.some((/** @type {string} */ l) => l.includes("en repli, l'ancienne valeur ; si la source l'écrit autrement (rem, rgb()), garde l'écriture de la source")));
  // tokens.css dans toute page qui charge une feuille modifiée (pages témoins comprises).
  assert.ok(a.lines.includes('0. Crée tokens.css, qui déclare dans :root chaque variable utilisée ci-dessous avec sa valeur, à partir de marque.resolver.json, et charge-la avant toutes les autres feuilles, dans toute page qui charge une feuille modifiée, pas seulement les pages de la table.'), 'étape 0');
  assert.ok(a.lines.includes('- Souligne tout lien posé dans du texte courant : 0 trouvé ici.'), 'change aussi');
  assert.ok(pieges.data.agent.lines.includes('- Souligne tout lien posé dans du texte courant : 1 trouvé ici (a.lien-discret).'), 'change aussi, pièges (L1)');
  const steps = (sectionOf(a.lines, 'REMPLACEMENTS (') ?? []).filter((/** @type {string} */ l) => /^[1-9]\d*\. /.test(l));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('Propriété font-size, usage taille du texte : remplace 13.5px par var(--font-size-14, 13.5px) (14px)')), 'usage taille du texte');
  // Une ligne dont toutes les déclarations sont en conflit passe en CONFLITS.
  const total = decidee.data.rows.filter((/** @type {any} */ r) => (r.status === 'appliquée' || r.status === 'décidée') && r.conflict === 'total').length;
  assert.equal(steps.length, decidee.data.sections.applied.total - total, 'une instruction par ligne appliquée, hors conflit total');
  // Une ligne aux déclarations tracées les liste ; sinon, la recherche par valeur.
  for (const l of steps) assert.ok(l.endsWith('Ne touche que ces déclarations.') || l.includes('Cherche toutes les déclarations de cette valeur pour cette propriété et cet usage, pas seulement cette ligne.'), l);
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #999999 par var(--color-neutral-11, #999999) (#6d675b)') && l.includes('Propriété color')));
  assert.ok(steps.some((/** @type {string} */ l) => l.includes('remplace #1f2a44 par var(--color-blue-12, #1f2a44) (#103060) [décidée]')));
  // Valise de démonstration aux noms d'échelle français, jetons en anglais : le couplage n'a plus de jeton (KNOWN_ISSUES.md).
  assert.ok(text.includes('Le texte posé sur un plein terre devient #220000 (onSolid) : texte #ffffff sur #c8553d'));
  assert.ok(text.includes('- Hors table : #2196f3'));
  assert.ok(text.includes('- Composant tiers : .tiers-cookies'));
  assert.ok(text.includes('- Valeur hors de sa tranche : #2b4c7e (bleu-9) en texte'));
  assert.ok(text.includes(`--decisions ${decisionsK}`), 'commande exacte');
  assert.ok(a.lines.includes('Après modification du CSS, relance reduce sur les pages de la table et sur les pages témoins, et compare au prévu ; signale tout écart avant la mise en ligne.'), 'pages témoins');
  assert.deepEqual(decidee.data.remaining.map((/** @type {any} */ p) => `${p.text}|${p.bg}`), ['#2196f3|#ffffff'], 'une seule paire sous 4,5:1 après migration');
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
  assert.ok(rep.some((l) => l.includes('remplace #999999 par var(--color-neutral-11, #999999) (#6d675b)')), '#999999 en bordure');
  const dec = sectionOf(decidee.data.agent.lines, 'REMPLACEMENTS (') ?? [];
  assert.ok(dec.some((l) => l.includes('remplace 6px par var(--radius-8, 6px) (8px) [décidée]')), 'rayon 6px décidé à 8px');
});

test('Correction 2 : COUPLAGES avec repli, l’ancienne couleur du texte', () => {
  // Le couplage n'existe que tranché « onSolid » (réduction décidée).
  const c = sectionOf(decidee.data.agent.lines, 'COUPLAGES (') ?? [];
  assert.ok(c.length > 1);
  for (const l of c.slice(1)) assert.ok(!/var\(--[^,)]*\)/.test(l), `variable sans repli : ${l}`);
  // Sans jeton (valise aux noms d'échelle français, jetons en anglais, KNOWN_ISSUES.md), la ligne n'a pas de variable.
  assert.ok(c.some((l) => l.startsWith('- Le texte posé sur un plein terre devient #220000 (onSolid) : ')));
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

test('aucune valeur de REMPLACEMENTS dans SIGNALE SANS MODIFIER', () => {
  for (const run of [desordre, decidee]) {
    const rep = run.data.rows.filter((/** @type {any} */ r) => (r.status === 'appliquée' || r.status === 'décidée') && r.conflict !== 'total');
    const sig = sectionOf(run.data.agent.lines, 'SIGNALE SANS MODIFIER') ?? [];
    for (const x of sig) {
      const both = rep.filter((/** @type {any} */ r) => x.includes(` ${r.value} `) && (x.includes(` en ${r.usage},`) || x.includes(`(${r.usage})`)));
      assert.deepEqual(both.map((/** @type {any} */ r) => r.id), [], x);
    }
  }
});
