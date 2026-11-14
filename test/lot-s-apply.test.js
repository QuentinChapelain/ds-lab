// @ts-check
/**
 * Lot S : npm run apply, sur une feuille fictive. Attendus écrits à la main avant le code.
 * S2. Chaque entrée de modifications.json est appliquée à sa déclaration (feuille, ligne de la règle,
 *     sélecteur, propriété), composant d'un raccourci compris ; garde : une valeur écrite qui n'est
 *     pas celle attendue n'est pas appliquée et sort en écart ; un composant de raccourci partagé par
 *     des propriétés aux issues différentes sort en écart ; --essai n'écrit rien.
 * S3. Relancé sur la copie migrée : aucun changement, toutes les entrées « déjà appliquées », même
 *     quand les commentaires posés au premier passage ont décalé les lignes des règles suivantes.
 * S4. Le HTML n'est pas touché ; reste.md : CONTEXTE, RESTE, NE TOUCHE PAS, SIGNALE, VÉRIFICATION.
 * Aucun contraste en jeu : les valeurs des jetons ne servent qu'à tokens.css, recopié tel quel.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { applyModifications } from '../src/apply/apply.js';

const CSS = `/* Feuille fictive (lot S). */
.carte {
  padding: 5px 12px;
  border: 1px solid #dadada;
  color: #595959;
}

.titre {
  font-size: 1rem;
}

.champ {
  margin-bottom: 10px;
}

.carte {
  border-radius: 6px;
}

.note {
  margin: 10px;
  background-color: var(--fond, #ffffff);
}

.prix { color: #f0c987 }

.pied {
  gap: 6px;
}
`;

const EXPECTED = `/* Feuille fictive (lot S). */
.carte {
  padding: var(--espace-4, 5px) var(--espace-12, 12px);
  border: 1px solid var(--couleur-neutre-6, #dadada);
  color: var(--couleur-neutre-11, #595959);
}

.titre {
  /* ds-lab : unité relative, non rattachée (1rem, 2026-11-14) */
  font-size: 1rem;
}

.champ {
  /* ds-lab : conflit, esp-5 12px / esp-6 4px, même déclaration (2026-11-14) */
  margin-bottom: 10px;
}

.carte {
  border-radius: var(--rayon-4, 6px);
}

.note {
  margin: 10px;
  background-color: var(--fond, #ffffff);
}

.prix { color: var(--couleur-sable-11, #f0c987) }

.pied {
  /* ds-lab : en attente du designer, 6px gouttière (esp-7, 2026-11-14T1200) */
  gap: 6px;
}
`;

const HTML = '<!doctype html><html lang="fr"><head><link rel="stylesheet" href="/s/a.css"></head><body><p class="prix">3,90 €</p></body></html>\n';
const TOKENS_CSS = ':root {\n  --couleur-neutre-6: #d8d6d2;\n}\n';

const SIDES = ['top', 'right', 'bottom', 'left'];
/** @param {number} line @param {string} selector @param {string} property @param {string} written @param {string} value @param {string} row @param {string} section */
const entry = (line, selector, property, written, value, row, section = 'REMPLACEMENTS') => ({ sheet: '/s/a.css', line, selector, property, written, value, rows: [row], section });
const MODS = {
  version: 1,
  host: '127.0.0.1:1',
  stamp: '2026-11-14T1200',
  entries: [
    entry(2, '.carte', 'padding-top', '5px', 'var(--espace-4, 5px)', 'esp-1'),
    entry(2, '.carte', 'padding-bottom', '5px', 'var(--espace-4, 5px)', 'esp-1'),
    entry(2, '.carte', 'padding-right', '12px', 'var(--espace-12, 12px)', 'esp-2', 'RATTACHE'),
    entry(2, '.carte', 'padding-left', '12px', 'var(--espace-12, 12px)', 'esp-2', 'RATTACHE'),
    ...SIDES.map((s) => entry(2, '.carte', `border-${s}-color`, '#dadada', 'var(--couleur-neutre-6, #dadada)', 'coul-1', 'RATTACHE')),
    entry(2, '.carte', 'color', '#595959', 'var(--couleur-neutre-11, #595959)', 'coul-2'),
    ...['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c) => entry(16, '.carte', `border-${c}-radius`, '6px', 'var(--rayon-4, 6px)', 'arr-1')),
    entry(20, '.note', 'margin-top', '10px', 'var(--espace-12, 10px)', 'esp-3'),
    entry(20, '.note', 'margin-bottom', '10px', 'var(--espace-4, 10px)', 'esp-4'),
    entry(25, '.prix', 'color', '#f0c987', 'var(--couleur-sable-11, #f0c987)', 'coul-3'),
  ],
  comments: [
    { sheet: '/s/a.css', line: 8, selector: '.titre', property: 'font-size', kind: 'unité relative', rows: ['tail-1'], text: 'ds-lab : unité relative, non rattachée (1rem, 2026-11-14)' },
    { sheet: '/s/a.css', line: 12, selector: '.champ', property: 'margin-bottom', kind: 'conflit', rows: ['esp-5', 'esp-6'], text: 'ds-lab : conflit, esp-5 12px / esp-6 4px, même déclaration (2026-11-14)' },
    { sheet: '/s/a.css', line: 27, selector: '.pied', property: 'row-gap', kind: 'en attente', rows: ['esp-7'], text: 'ds-lab : en attente du designer, 6px gouttière (esp-7, 2026-11-14T1200)' },
  ],
  tokensCss: { path: '/s/tokens.css', content: TOKENS_CSS },
  brief: {
    pages: ['/p.html'],
    sheets: ['/s/a.css'],
    reste: ['coul-4 Fond · note : /s/a.css:20 .note { background-color: var(--fond, #ffffff) } : unité inconnue ; écris var(--couleur-blanc, …) à la main si la valeur calculée est bien #ffffff.'],
    changeAussi: ['Relie chaque message à son champ par aria-describedby : 0 trouvé ici.'],
    neTouchePas: ['Composant tiers : .tiers et tout ce qu’il contient.'],
    signale: ['Élément injecté après le chargement : non mesuré ; signale-le si tu en trouves.'],
    verification: ['Chaque variable écrite est déclarée dans tokens.css.'],
  },
};

/** Copie fraîche : la feuille et une page. */
async function fresh() {
  const root = await mkdtemp(join(tmpdir(), 'ds-lab-lot-s-'));
  await mkdir(join(root, 's'));
  await writeFile(join(root, 's', 'a.css'), CSS);
  await writeFile(join(root, 'p.html'), HTML);
  return root;
}
const sheet = (/** @type {string} */ root) => readFile(join(root, 's', 'a.css'), 'utf8');
/** @param {any} r @param {string} status */
const count = (r, status) => r.results.filter((/** @type {any} */ x) => x.status === status).length;

test('S2 : entrées appliquées (composants de raccourci compris), commentaires posés, tokens.css écrit ; feuille attendue octet pour octet', async () => {
  const root = await fresh();
  const r = await applyModifications(MODS, { root });
  assert.equal(await sheet(root), EXPECTED);
  assert.equal(await readFile(join(root, 's', 'tokens.css'), 'utf8'), TOKENS_CSS);
  assert.equal(count(r, 'appliquée'), 14);
  assert.equal(count(r, 'écart'), 2);
  assert.equal(r.comments.filter((/** @type {any} */ c) => c.status === 'posé').length, 3);
});

test('S2 : composant partagé par des propriétés aux issues différentes : écart, raccourci intact', async () => {
  const r = await applyModifications(MODS, { root: await fresh() });
  const gaps = r.results.filter((/** @type {any} */ x) => x.status === 'écart');
  assert.deepEqual(gaps.map((/** @type {any} */ x) => `${x.entry.rows[0]} ${x.entry.property}`).sort(), ['esp-3 margin-top', 'esp-4 margin-bottom']);
  for (const g of gaps) assert.match(g.reason, /partagé/);
});

test('S2 : garde : valeur écrite modifiée dans la copie, entrée non appliquée et sortie en écart', async () => {
  const root = await fresh();
  await writeFile(join(root, 's', 'a.css'), CSS.replace('.prix { color: #f0c987 }', '.prix { color: #f0c900 }'));
  const r = await applyModifications(MODS, { root });
  const x = r.results.find((/** @type {any} */ y) => y.entry.rows[0] === 'coul-3');
  assert.equal(x.status, 'écart');
  assert.match(x.reason, /#f0c987/);
  assert.match(x.reason, /#f0c900/);
  assert.ok((await sheet(root)).includes('.prix { color: #f0c900 }'));
  assert.equal(count(r, 'appliquée'), 13);
});

test('S2 : --essai : même rapport, rien n’est écrit', async () => {
  const root = await fresh();
  const r = await applyModifications(MODS, { root, dryRun: true });
  assert.equal(count(r, 'appliquée'), 14);
  assert.equal(await sheet(root), CSS);
  assert.deepEqual((await readdir(join(root, 's'))).sort(), ['a.css']);
  assert.deepEqual((await readdir(root)).sort(), ['p.html', 's']);
});

test('S3 : relancé sur la copie migrée, malgré les lignes décalées par les commentaires : aucun changement, tout « déjà appliqué »', async () => {
  const root = await fresh();
  await applyModifications(MODS, { root });
  // Les deux commentaires posés au-dessus de .titre et .champ décalent la seconde règle .carte de la
  // ligne 16 à la ligne 18 ; .carte existe aussi ligne 2 : le sélecteur seul ne suffit pas.
  assert.equal((await sheet(root)).split('\n')[17], '.carte {');
  const r = await applyModifications(MODS, { root });
  assert.equal(await sheet(root), EXPECTED);
  assert.equal(count(r, 'appliquée'), 0);
  assert.equal(count(r, 'déjà appliquée'), 14);
  assert.equal(count(r, 'écart'), 2, 'les deux écarts de .note restent des écarts');
  assert.equal(r.comments.filter((/** @type {any} */ c) => c.status === 'déjà posé').length, 3);
  assert.deepEqual(r.written, ['reste.md'], 'seul le rapport est réécrit');
});

test('S3 : deux copies fraîches : fichiers identiques octet pour octet', async () => {
  const [a, b] = [await fresh(), await fresh()];
  await applyModifications(MODS, { root: a });
  await applyModifications(MODS, { root: b });
  for (const f of ['s/a.css', 's/tokens.css', 'p.html', 'reste.md']) assert.equal(await readFile(join(a, f), 'utf8'), await readFile(join(b, f), 'utf8'), f);
});

test('S2 : sélecteur écrit autrement par le navigateur (:nth-child(even) lu :nth-child(2n)) : la règle seule à sa ligne est retrouvée', async () => {
  const root = await fresh();
  await writeFile(join(root, 's', 'b.css'), '.ligne:nth-child(even) {\n  background-color: #f6f5f6;\n}\n');
  const mods = { ...MODS, entries: [{ sheet: '/s/b.css', line: 1, selector: '.ligne:nth-child(2n)', property: 'background-color', written: '#f6f5f6', value: 'var(--couleur-neutre-2, #f6f5f6)', rows: ['coul-9'], section: 'REMPLACEMENTS' }], comments: [] };
  const r = await applyModifications(mods, { root });
  assert.equal(r.results[0].status, 'appliquée', r.results[0].reason);
  assert.equal(await readFile(join(root, 's', 'b.css'), 'utf8'), '.ligne:nth-child(even) {\n  background-color: var(--couleur-neutre-2, #f6f5f6);\n}\n');
});

test('S4 : le HTML n’est pas touché ; reste.md : contexte, reste (lien, change aussi, unité inconnue, écarts de l’exécution), puis les sections de la consigne', async () => {
  const root = await fresh();
  await applyModifications(MODS, { root });
  assert.equal(await readFile(join(root, 'p.html'), 'utf8'), HTML);
  const md = await readFile(join(root, 'reste.md'), 'utf8');
  const heads = md.split('\n').filter((l) => /^[A-ZÉ][A-ZÉ ]+( \(\d+\))?$/.test(l));
  assert.deepEqual(heads, ['CONTEXTE', 'RESTE (5)', 'NE TOUCHE PAS', 'SIGNALE SANS MODIFIER', 'VÉRIFICATION']);
  assert.match(md, /Le script a appliqué 14 entrées sur 16/);
  assert.match(md, /tokens\.css/);
  assert.ok(md.includes('/p.html'), 'pages qui chargent une feuille modifiée');
  assert.ok(md.includes('aria-describedby'));
  assert.ok(md.includes('unité inconnue'));
  assert.equal((md.match(/^\d+\. Écart : /gm) ?? []).length, 2);
  assert.ok(md.includes('Composant tiers : .tiers'));
  assert.ok(md.includes('Chaque variable écrite est déclarée dans tokens.css.'));
  assert.ok(!/REMPLACEMENTS|RATTACHE/.test(md));
});
