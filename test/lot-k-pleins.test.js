// @ts-check
/**
 * Lot K : texte sur plein, une décision par plein. Attendus écrits avant le code :
 * K1. Un couplage devient une décision : une carte par plein concerné (par échelle, « Texte sur
 *     plein terre »), qui couvre tous les éléments portés par ce plein, y compris ceux dont le fond
 *     est déjà sur la cible. Un plein dont le texte passe (blanc sur bleu-9) n'a pas de carte.
 * K2. Trois versions, avec leur contraste : (a) onSolid sur le pas 9 ; (b) texte d'origine sur le
 *     pas 10, si le contraste passe ; (c) garder (fond pas 9, texte gardé), « sous le seuil ».
 *     Aucune recommandée ni présélectionnée.
 * K3. Une seule décision par plein : les lignes de fond qui y mènent suivent la carte et le disent,
 *     sans choix séparé ; une décision de ligne du fichier sur ces lignes est ignorée et signalée.
 * K4. Le choix (« plein|terre » : onSolid | pas-10 | garder) descend dans la simulation, les
 *     références et la consigne ; (c) : paire listée « sous 4,5:1, gardée par le designer ».
 *     (a) : l'onSolid sur tous les textes du plein.
 * K5. Non tranchée : rien n'est appliqué, ni texte ni fond ; les lignes de fond sont en attente.
 * Retouches (attendus écrits avant le code) :
 * K1 bis. Pas de carte quand chaque texte passe déjà sur le fond tel qu'il est, et sur le fond où la
 *     table le mène (blanc sur terre-10 après migration : 5,1669). Blanc sur #ba4834 que la table
 *     mène à terre-9 (4,3544) : carte.
 * En-tête. migration.md compte les décisions appliquées (clés de ligne qui changent une ligne, et
 *     cartes tranchées) et, à part, les décisions de ligne ignorées parce qu'elles suivent une carte.
 * Page fictive (cible-valise) : blanc sur #d0563f, #c4513a, #c8553d (terre-9, déjà sur la cible),
 * #f0c987 (sable-9) et #2b4c7e (bleu-9).
 * Contrastes (culori 4.0.2) :
 *   node -e 'import("culori").then(({wcagContrast:w})=>{for (const [a,b] of [["#220000","#c8553d"],["#ffffff","#ba4834"],["#ffffff","#c8553d"],["#ffffff","#d7b173"],["#4a2900","#f0c987"],["#ffffff","#f0c987"],["#ffffff","#2b4c7e"]]) console.log(a,b,w(a,b).toFixed(4))})'
 *   → 4,5155 ; 5,1669 ; 4,3544 ; 2,0142 (sable-10 : pas de (b)) ; 8,3375 ; 1,5660 ; 8,6144.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { wcagContrast } from 'culori';
import { startFixtureServers, FIXTURE_DIR } from './helpers/serveur.js';
import { runReduce } from '../src/cli/reduce.js';
import { referenceFiles } from '../src/verify/reference.js';

const TARGET = `${FIXTURE_DIR}cible-valise.json`;
const TOKENS = new URL('../tokens/orbe-cafe/primitives.tokens.json', import.meta.url).pathname;
const BOX = 'position:absolute;left:40px;width:200px;height:60px;padding:0 8px;font:700 14px/60px Arial,sans-serif;color:#ffffff';
const PAGE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>K</title>
<style>html,body{margin:0;background:#ffffff}.nouveau{${BOX};top:40px;background-color:#d0563f}.ancienne{${BOX};top:140px;background-color:#c4513a}.annulee{${BOX};top:240px;background-color:#c8553d}.sable{${BOX};top:340px;background-color:#f0c987}.pied{${BOX};top:440px;background-color:#2b4c7e}</style></head>
<body><span class="nouveau">Nouveau</span><span class="ancienne">Ancienne</span><span class="annulee">Annulée</span><span class="sable">Sable</span><span class="pied">Pied</span></body></html>`;
const Z = (/** @type {number} */ top) => ({ x: 40, y: top, w: 216, h: 60 });
const TERRE = [Z(40), Z(140), Z(240)];
const SABLE = Z(340);
const PIED = Z(440);
/** Décisions de ligne façon passage 2 : les deux fonds terre décidés vers terre-9. */
const ROWS = { 'colors|#d0563f|plein': '#c8553d', 'colors|#c4513a|plein': '#c8553d' };

/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, { run: any, refs: string, md: string, html: string }>} */
const R = {};

before(async () => {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-k-'));
  await mkdir(join(root, 'k'));
  await writeFile(join(root, 'k', 'p.html'), PAGE);
  servers = await startFixtureServers({ root });
  for (const [name, choice] of /** @type {const} */ ([['attente', null], ['a', 'onSolid'], ['b', 'pas-10'], ['c', 'garder']])) {
    const decisions = join(root, `decisions-${name}.json`);
    await writeFile(decisions, JSON.stringify(choice ? { ...ROWS, 'plein|terre': choice } : ROWS));
    const refs = await mkdtemp(join(tmpdir(), `ds-lab-lot-k-refs-${name}-`));
    const [run] = await runReduce({
      addresses: [`${servers.origin}/k/p.html`],
      targetPath: TARGET,
      tokensPath: TOKENS,
      decisionsPath: decisions,
      referencesPath: refs,
      viewport: { width: 400, height: 560 },
      waitMs: 50,
      outRoot: await mkdtemp(join(tmpdir(), `ds-lab-lot-k-out-${name}-`)),
    });
    R[name] = { run, refs, md: await readFile(run.files[2], 'utf8'), html: await readFile(run.files[1], 'utf8') };
  }
});

after(async () => servers?.close());

/** @param {PNG} png @param {string} hex @param {{ x: number, y: number, w: number, h: number }} [r] */
function countHex(png, hex, r = { x: 0, y: 0, w: png.width, h: png.height }) {
  const [Rr, G, B] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  let n = 0;
  for (let y = r.y; y < Math.min(png.height, r.y + r.h); y++)
    for (let x = r.x; x < Math.min(png.width, r.x + r.w); x++) {
      const i = (y * png.width + x) * 4;
      if (png.data[i] === Rr && png.data[i + 1] === G && png.data[i + 2] === B) n++;
    }
  return n;
}
/** @param {string} name */
const reference = async (name) => PNG.sync.read(await readFile(referenceFiles(R[name].refs, `${servers.origin}/k/p.html`).png));
/** @param {string} name @param {string} scale */
const card = (name, scale) => (R[name].run.table.pleins ?? []).find((/** @type {any} */ g) => g.scale === scale);
/** @param {string} name @param {string} old */
const row = (name, old) => R[name].run.migration.rows.find((/** @type {any} */ r) => r.family === 'colors' && r.value === old && r.usage === 'plein');
/** @param {string} name @param {string} head */
const section = (name, head) => {
  const a = /** @type {string[]} */ (R[name].run.migration.agent.lines);
  const i = a.findIndex((l) => l.startsWith(head));
  if (i < 0) return [];
  const j = a.findIndex((l, k) => k > i && l === '');
  return a.slice(i, j < 0 ? undefined : j);
};
/** Article de la revue dont data-key vaut key. @param {string} html @param {string} key */
const article = (html, key) => {
  const i = html.indexOf(`data-key="${key}"`);
  if (i < 0) return '';
  const start = html.lastIndexOf('<article', i);
  return html.slice(start, html.indexOf('</article>', i));
};
const r4 = (/** @type {number} */ x) => Math.round(x * 10000) / 10000;

test('précondition culori : contrastes des versions', () => {
  assert.equal(r4(wcagContrast('#220000', '#c8553d')), 4.5155);
  assert.equal(r4(wcagContrast('#ffffff', '#ba4834')), 5.1669);
  assert.equal(r4(wcagContrast('#ffffff', '#c8553d')), 4.3544);
  assert.equal(r4(wcagContrast('#ffffff', '#d7b173')), 2.0142);
  assert.equal(r4(wcagContrast('#4a2900', '#f0c987')), 8.3375);
  assert.ok(wcagContrast('#ffffff', '#2b4c7e') >= 4.5);
});

test('K1 : une carte par plein concerné (terre, sable) ; aucune pour bleu, qui passe', () => {
  const ids = (R.attente.run.table.pleins ?? []).map((/** @type {any} */ g) => `${g.id}|${g.key}|${g.title}`).sort();
  assert.deepEqual(ids, ['plein-sable|plein|sable|Texte sur plein sable', 'plein-terre|plein|terre|Texte sur plein terre']);
});

test('K1 : la carte terre couvre les trois fonds et tous leurs éléments, fond déjà sur la cible compris', () => {
  const g = card('attente', 'terre');
  assert.deepEqual(g.rows.map((/** @type {any} */ r) => r.old).sort(), ['#c4513a', '#c8553d', '#d0563f']);
  assert.deepEqual(g.elements.map((/** @type {any} */ e) => e.selector).sort(), ['span.ancienne', 'span.annulee', 'span.nouveau']);
});

test('K2 : trois versions pour terre, avec leur contraste ; (c) sous le seuil', () => {
  const v = card('attente', 'terre').versions.map((/** @type {any} */ x) => `${x.choice}|${x.text}|${x.bg}|${r4(x.ratio)}|${x.pass}`);
  assert.deepEqual(v, ['onSolid|#220000|#c8553d|4.5155|true', 'pas-10|#ffffff|#ba4834|5.1669|true', 'garder|#ffffff|#c8553d|4.3544|false']);
});

test('K2 : pas de (b) quand le texte d’origine échoue aussi sur le pas 10 (blanc sur sable-10)', () => {
  assert.deepEqual(card('attente', 'sable').versions.map((/** @type {any} */ x) => x.choice), ['onSolid', 'garder']);
});

test('K2 : la carte dans la revue : trois versions, contraste, aucune recommandée ni choisie', () => {
  const a = article(R.attente.html, 'plein|terre');
  assert.ok(a, 'carte plein|terre absente');
  assert.match(a, /Texte sur plein terre/);
  const values = [...a.matchAll(/class="v"[^>]*data-value="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(values, ['onSolid', 'pas-10', 'garder']);
  assert.match(a, /4,5155?/);
  assert.match(a, /5,1669?/);
  assert.match(a, /4,3544? · sous le seuil/);
  assert.ok(!/recommand/i.test(a), 'version recommandée');
  assert.ok(!a.includes('retenue'), 'version présélectionnée');
  assert.match(a, /Pas encore choisie/);
});

test('K2 : captures des trois versions (fond et texte de chaque version)', () => {
  const vs = card('attente', 'terre').capture?.versions ?? [];
  assert.equal(vs.length, 3, 'trois captures');
  const png = (/** @type {any} */ v) => PNG.sync.read(Buffer.from(v.shot.png, 'base64'));
  const [a, b, c] = vs.map(png);
  assert.ok(countHex(a, '#c8553d') > 0 && countHex(a, '#220000') > 0, '(a) onSolid sur terre-9');
  assert.ok(countHex(b, '#ba4834') > 0 && countHex(b, '#ffffff') > 0 && countHex(b, '#220000') === 0, '(b) blanc sur terre-10');
  assert.ok(countHex(c, '#c8553d') > 0 && countHex(c, '#220000') === 0, '(c) blanc gardé sur terre-9');
});

test('K3 : les lignes de fond suivent la carte, sans choix séparé ; décision de ligne ignorée et signalée', () => {
  for (const old of ['#d0563f', '#c4513a', '#c8553d']) {
    const a = article(R.attente.html, `colors|${old}|plein`);
    assert.ok(a, `carte de ligne ${old}`);
    assert.ok(!a.includes('class="v"'), `${old} : versions propres`);
    assert.match(a, /suit la carte Texte sur plein terre/);
  }
  assert.match(article(R.attente.html, 'colors|#d0563f|plein'), /décision de ligne ignorée \(#c8553d\)/);
  assert.deepEqual(card('attente', 'terre').ignored.map((/** @type {any} */ x) => `${x.key}|${x.value}`).sort(), ['colors|#c4513a|plein|#c8553d', 'colors|#d0563f|plein|#c8553d']);
  assert.match(R.attente.md, /décision de ligne ignorée/);
});

test('K5 : non tranchée, rien n’est appliqué : fonds et textes d’origine dans la référence', async () => {
  const png = await reference('attente');
  for (const [z, bg] of /** @type {const} */ ([[TERRE[0], '#d0563f'], [TERRE[1], '#c4513a'], [TERRE[2], '#c8553d'], [SABLE, '#f0c987']])) {
    assert.ok(countHex(png, bg, z) > 0, `fond ${bg}`);
    assert.equal(countHex(png, '#220000', z) + countHex(png, '#4a2900', z), 0, `texte changé sur ${bg}`);
  }
});

test('K5 : lignes de fond en attente (même celle déjà sur la cible), consigne : NE TOUCHE PAS et COUPLAGES', () => {
  for (const old of ['#d0563f', '#c4513a', '#c8553d']) assert.equal(row('attente', old)?.status, 'en attente', old);
  const keep = section('attente', 'NE TOUCHE PAS').filter((l) => l.includes('carte Texte sur plein terre'));
  assert.equal(keep.length, 3, keep.join('\n'));
  const c = section('attente', 'COUPLAGES (');
  assert.ok(c.some((l) => l.startsWith('- Plein terre : en attente du designer')), c.join('\n'));
  assert.ok(!c.some((l) => l.includes('devient #220000')), c.join('\n'));
  assert.ok(!section('attente', 'RATTACHE (').some((l) => l.includes('#c8553d') && l.includes('plein')), 'terre-9 rattaché');
  assert.deepEqual(R.attente.run.map?.couplings ?? [], []);
});

test('K4 (a) : fonds terre-9, onSolid sur tous les textes du plein ; sable reste en attente', async () => {
  const png = await reference('a');
  for (const z of TERRE) {
    assert.ok(countHex(png, '#c8553d', z) > 0, 'fond terre-9');
    assert.ok(countHex(png, '#220000', z) > 0, 'texte onSolid');
    assert.equal(countHex(png, '#ffffff', z), 0, 'texte encore blanc');
  }
  assert.ok(countHex(png, '#f0c987', SABLE) > 0 && countHex(png, '#4a2900', SABLE) === 0, 'sable inchangé');
  assert.ok(countHex(png, '#2b4c7e', PIED) > 0 && countHex(png, '#ffffff', PIED) > 0, 'bleu inchangé');
  assert.equal(row('a', '#d0563f').status, 'décidée');
  assert.equal(row('a', '#c8553d').status, 'inchangé');
  const c = section('a', 'COUPLAGES (');
  assert.ok(c.some((l) => l.startsWith('- Le texte posé sur un plein terre devient #220000')), c.join('\n'));
});

test('K4 (b) : fonds terre-10 (celui déjà sur terre-9 compris), texte gardé, aucun couplage', async () => {
  const png = await reference('b');
  for (const z of TERRE) {
    assert.ok(countHex(png, '#ba4834', z) > 0, 'fond terre-10');
    assert.ok(countHex(png, '#ffffff', z) > 0, 'texte blanc');
    assert.equal(countHex(png, '#220000', z), 0, 'onSolid posé');
  }
  for (const old of ['#d0563f', '#c4513a', '#c8553d']) assert.equal(`${row('b', old).status}|${row('b', old).new}`, 'décidée|#ba4834', old);
  const c = section('b', 'COUPLAGES (');
  assert.ok(c.some((l) => l.startsWith('- Plein terre : le fond passe au pas 10 (terre-10, #ba4834)') && l.includes('5,1669:1') && l.includes('choisi par le designer')), c.join('\n'));
  assert.ok(!c.some((l) => l.includes('devient #220000')), c.join('\n'));
});

test('K4 (c) : fonds terre-9, texte gardé ; paire listée « sous 4,5:1, gardée par le designer »', async () => {
  const png = await reference('c');
  for (const z of TERRE) {
    assert.ok(countHex(png, '#c8553d', z) > 0, 'fond terre-9');
    assert.ok(countHex(png, '#ffffff', z) > 0, 'texte blanc');
    assert.equal(countHex(png, '#220000', z), 0, 'onSolid posé');
  }
  const v = R.c.run.migration.agent.lines.find((/** @type {string} */ l) => l.startsWith('Il ne doit rester'));
  assert.ok(v?.includes('#ffffff sur #c8553d (4,3544:1), sous 4,5:1, gardée par le designer'), v);
  const c = section('c', 'COUPLAGES (');
  assert.ok(c.some((l) => l.startsWith('- Plein terre : le texte reste tel quel') && l.includes('gardé par le designer')), c.join('\n'));
});

test('K4 : la carte affiche le choix lu dans le fichier de décisions', () => {
  assert.equal(card('b', 'terre').choice, 'pas-10');
  assert.equal(card('attente', 'terre').choice, null);
  assert.match(R.b.html, /"plein\|terre":"pas-10"/);
});

test('K4 : une version absente ou inconnue est refusée au chargement des décisions', async () => {
  const { pleinChoices } = await import('../src/reduce/pleins.js');
  const groups = R.attente.run.table.pleins;
  assert.throws(() => pleinChoices(groups, { 'plein|terre': 'pas-11' }), /plein\|terre/);
  assert.throws(() => pleinChoices(groups, { 'plein|sable': 'pas-10' }), /plein\|sable/);
  assert.deepEqual(pleinChoices(groups, { 'plein|terre': 'garder' }), { terre: 'garder', sable: null });
});

// Lot K, retouche : libellés des versions, pour un designer. Attendus écrits avant le code :
// (a) « Texte foncé » (« Texte clair » si l'onSolid est plus clair que le pas 9) ; (b) « Texte blanc, fond
// plus foncé » (« Texte d'origine, … » si un texte d'origine n'est pas blanc ; « fond plus clair » si le
// pas 10 est plus clair que le pas 9) ; (c) « Garder (sous le seuil) ». Valeurs et contraste sur la ligne
// du dessous. Contrastes (culori 4.0.2) :
//   node -e 'import("culori").then(({wcagContrast:w})=>{for (const [a,b] of [["#f5f5f5","#c8553d"],["#f5f5f5","#ba4834"],["#1a1a1a","#2b4c7e"],["#1a1a1a","#27487a"]]) console.log(a,b,w(a,b).toFixed(4))})'
//   → 3,9941 (échoue sur terre-9) ; 4,7392 (passe sur terre-10) ; 2,0204 ; 1,9014 (pas de (b) sur bleu).
test('libellés : terre (blanc) et sable, dans la carte et dans la revue', () => {
  assert.deepEqual(card('attente', 'terre').versions.map((/** @type {any} */ x) => x.label), ['Texte foncé', 'Texte blanc, fond plus foncé', 'Garder (sous le seuil)']);
  assert.deepEqual(card('attente', 'sable').versions.map((/** @type {any} */ x) => x.label), ['Texte foncé', 'Garder (sous le seuil)']);
  const a = article(R.attente.html, 'plein|terre');
  for (const l of ['Texte foncé', 'Texte blanc, fond plus foncé', 'Garder (sous le seuil)']) assert.ok(a.includes(`<span>${l}</span>`), l);
  assert.ok(!/onSolid sur|texte d’origine sur/.test(a), 'anciens libellés');
  assert.match(a, /<span>Texte foncé<\/span><small>#220000 sur #c8553d<\/small><small>4,5155 · passe le seuil de 4,5<\/small>/);
});

test('libellés génériques : texte d’origine non blanc ; onSolid clair (« Texte clair »)', async () => {
  const { pleinGroups } = await import('../src/reduce/pleins.js');
  const target = JSON.parse(await readFile(TARGET, 'utf8'));
  /** @param {string} bg @param {string} text */
  const one = (bg, text) => {
    const table = { families: { colors: { rows: [{ id: 'coul-1', old: bg, usage: 'plein', class: 'inchangé', new: bg }] } } };
    const rendered = { usages: { pairs: [{ text, bg, bgUsage: 'plein', threshold: 4.5, n: 1 }] } };
    return pleinGroups({ table, rendered, target }).map((g) => g.versions.map((v) => v.label));
  };
  assert.equal(r4(wcagContrast('#f5f5f5', '#c8553d')), 3.9941);
  assert.equal(r4(wcagContrast('#f5f5f5', '#ba4834')), 4.7392);
  assert.deepEqual(one('#c8553d', '#f5f5f5'), [['Texte foncé', 'Texte d’origine, fond plus foncé', 'Garder (sous le seuil)']]);
  // Lot J, J4 (14/11/2026) : était [['Texte clair', 'Garder (sous le seuil)']] ; la version « teinte »
  // s'ajoute : #1a1a1a (échelle neutre) prend neutre-7 #bfbbb5, le plus proche qui passe sur bleu-9
  // (culori : wcagContrast('#bfbbb5', '#2b4c7e') = 4,5085 ; neutre-8 #958f84 : 2,6828).
  assert.equal(r4(wcagContrast('#bfbbb5', '#2b4c7e')), 4.5085);
  assert.deepEqual(one('#2b4c7e', '#1a1a1a'), [['Texte clair', 'Même teinte, plus claire', 'Garder (sous le seuil)']]);
});

test('K1 bis : pas de carte quand chaque texte passe déjà sur le fond tel qu’il est (blanc sur terre-10 après migration)', async () => {
  const { pleinGroups } = await import('../src/reduce/pleins.js');
  const target = JSON.parse(await readFile(TARGET, 'utf8'));
  /** @param {string} old @param {string} next @param {string} cls */
  const scales = (old, next, cls) => {
    const table = { families: { colors: { rows: [{ id: 'coul-1', old, usage: 'plein', class: cls, new: next }] } } };
    const rendered = { usages: { pairs: [{ text: '#ffffff', bg: old, bgUsage: 'plein', threshold: 4.5, n: 1 }] } };
    return pleinGroups({ table, rendered, target }).map((g) => g.scale);
  };
  assert.deepEqual(scales('#ba4834', '#ba4834', 'inchangé'), [], 'blanc sur terre-10, déjà migré');
  assert.deepEqual(scales('#ba4834', '#c8553d', 'proche'), ['terre'], 'passe tel quel, mais la table le mène sur terre-9');
  assert.deepEqual(scales('#c8553d', '#c8553d', 'inchangé'), ['terre'], 'blanc sur terre-9 tel quel');
});

test('en-tête : décisions appliquées, et à part les décisions de ligne ignorées (elles suivent une carte)', () => {
  const line = (/** @type {string} */ name) => R[name].md.split('\n').find((l) => l.startsWith('Décisions lues : '));
  assert.equal(line('b'), 'Décisions lues : `decisions-b.json`, 1 décidée, 0 refusée, 2 décisions de ligne ignorées : suivent une carte.');
  assert.equal(line('attente'), 'Décisions lues : `decisions-attente.json`, 0 décidée, 0 refusée, 2 décisions de ligne ignorées : suivent une carte.');
});
