// @ts-check
/**
 * Garde : le code dit sa raison, pas son histoire. Aucun numéro de lot, d'étape ou de séance, ni la
 * revue qui a demandé un changement, dans les commentaires de src/ et de test/, dans les titres des
 * tests, ni dans les noms de fichiers de test. L'histoire est écrite dans docs/attendus/ et docs/decisions.md ; un
 * commentaire renvoie à une décision par son numéro (D12).
 *
 * Les textes que l'outil écrit sont gardés aussi : les chaînes de src/ (pages, migration, jetons, y compris
 * un commentaire placé dans le gabarit d'une page), les descriptions des jetons de tokens/ et le $comment
 * des cibles de fixtures/marque-demo/, que les sorties recopient. Le code de l'atelier (atelier/, D42) est gardé comme
 * src/ : commentaires et chaînes ; d'un composant .vue (D43), le script, le gabarit, le style et leurs commentaires. Hors de la garde : les attendus de
 * fixtures/ (notes datées) et la copie figée fixtures/marque-demo/jetons/, qui est une empreinte.
 * Le mot « étape » sans numéro (étape de chargement d'une page) n'est pas une mention d'histoire.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { lex, titres } from './helpers/commentaires.js';
import { codeAtelier, partiesVue } from './helpers/atelier.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Formes d'une mention d'histoire. */
const HISTOIRE = [
  /\b[Ll]ots? (?:[A-Z](?![a-zà-ÿ])|\d)/,
  /\b(?:du|au|le|ce|des|dernier) lot\b/,
  /[ÉéEe]tapes? \d/,
  /\b[Ss]éances? (?:\d|[a-c]\b)/,
  /[Rr]evue de code/,
];
const FICHIER_HISTOIRE = /(?:^|[^a-z])(?:lots?|etapes?|seances?)(?:[^a-z]|$)|lot\d/i;

/** @param {string} t */
const mentionne = (t) => HISTOIRE.some((r) => r.test(t));

/** @param {string} dir */
const fichiersJs = (dir) =>
  readdirSync(join(ROOT, dir), { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(dir, f));

/**
 * Lignes de commentaire qui portent une mention, « fichier:ligne  texte ».
 * @param {string} f
 */
function mentions(f) {
  const { comments } = lex(readFileSync(join(ROOT, f), 'utf8'));
  /** @type {string[]} */
  const out = [];
  for (const c of comments)
    c.text.split('\n').forEach((t, k) => {
      if (mentionne(t)) out.push(`${f}:${c.line + k}  ${t.trim()}`);
    });
  return out;
}

test('lexeur : commentaires séparés des chaînes, gabarits et expressions régulières (attendu écrit à la main)', () => {
  const src = [
    "const a = 'x // pas un commentaire'; // vrai 1",
    'const r = /\\/\\/[a/]*/g; /* vrai 2 */',
    'const t = `${a + `${"//"}`} /* dans un gabarit */`;',
    '/**',
    ' * vrai 3',
    ' */',
    'const q = 4 / 2 / 1; // vrai 4',
  ].join('\n');
  const { comments, code } = lex(src);
  assert.deepEqual(
    comments.map((c) => [c.line, c.kind, c.text]),
    [
      [1, 'line', '// vrai 1'],
      [2, 'block', '/* vrai 2 */'],
      [4, 'block', '/**\n * vrai 3\n */'],
      [7, 'line', '// vrai 4'],
    ],
  );
  assert.equal(code.split('\n').length, src.split('\n').length);
  assert.ok(code.includes('/* dans un gabarit */'));
  assert.deepEqual(titres("test('un titre', () => {});\ndescribe(`deux`, () => {});"), [
    { line: 1, text: 'un titre' },
    { line: 2, text: 'deux' },
  ]);
});

test('formes reconnues (attendu écrit à la main)', () => {
  for (const t of ['Lot J, J7 : x', 'lot P-fin : x', 'lot 3 bis', 'avant le lot', "de l'étape 3", 'Étape 4c', 'séance 3a', 'Revue de code du 15/11'])
    assert.ok(mentionne(t), t);
  for (const t of ['à valider par lot', 'une page tombée est nommée par son étape', 'étape navigation', 'Lot de cafés', 'une étape ou une séance'])
    assert.ok(!mentionne(t), t);
  for (const f of ['lot-j-revue.test.js', 'lot5.js', 'etape-4.test.js']) assert.ok(FICHIER_HISTOIRE.test(f), f);
  for (const f of ['pilote.test.js', 'tiers-masques.test.js', 'roles-ajoutes.js']) assert.ok(!FICHIER_HISTOIRE.test(f), f);
});

test('aucune mention d’histoire dans les commentaires de src/', () => {
  assert.deepEqual(fichiersJs('src').flatMap(mentions), []);
});

test('aucune mention d’histoire dans les commentaires et les titres de test/', () => {
  const out = fichiersJs('test').flatMap((f) => {
    const { code } = lex(readFileSync(join(ROOT, f), 'utf8'));
    return [...mentions(f), ...titres(code).filter((t) => mentionne(t.text)).map((t) => `${f}:${t.line}  titre « ${t.text} »`)];
  });
  assert.deepEqual(out, []);
});

test('aucune mention d’histoire dans les chaînes de src/ (textes écrits par l’outil)', () => {
  const out = fichiersJs('src').flatMap((f) =>
    lex(readFileSync(join(ROOT, f), 'utf8'))
      .code.split('\n')
      .flatMap((l, i) => (mentionne(l) ? [`${f}:${i + 1}  ${l.trim()}`] : [])),
  );
  assert.deepEqual(out, []);
});

test('aucune mention d’histoire dans les jetons de tokens/ ni dans le $comment des cibles de fixtures', () => {
  const tokens = readdirSync(join(ROOT, 'tokens'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.json')).map((f) => join('tokens', f));
  const cibles = readdirSync(join(ROOT, 'fixtures', 'marque-demo')).filter((f) => /^cible.*\.json$/.test(f)).map((f) => join('fixtures', 'marque-demo', f));
  /** @type {string[]} */
  const out = [];
  /** @param {string} f @param {any} o @param {string} chemin */
  const parcourir = (f, o, chemin) => {
    if (typeof o === 'string') {
      if (mentionne(o)) out.push(`${f} ${chemin}  ${o.slice(0, 80)}`);
    } else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) parcourir(f, v, `${chemin}.${k}`);
  };
  for (const f of tokens) parcourir(f, JSON.parse(readFileSync(join(ROOT, f), 'utf8')), '');
  for (const f of cibles) parcourir(f, JSON.parse(readFileSync(join(ROOT, f), 'utf8')).$comment ?? '', '.$comment');
  assert.deepEqual(out, []);
});

test('aucun nom de fichier de test ne porte un lot, une étape ou une séance', () => {
  const noms = readdirSync(join(ROOT, 'test'), { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.js'));
  assert.deepEqual(
    noms.filter((f) => FICHIER_HISTOIRE.test(f.split('/').pop() ?? '')),
    [],
  );
});

test('aucune mention d’histoire dans le code de l’atelier (commentaires et chaînes)', () => {
  const fs = codeAtelier();
  assert.ok(fs.some((f) => f.endsWith('preview.js')), 'la configuration de l’atelier est lue');
  assert.ok(fs.some((f) => f.endsWith('.vue')), 'les composants .vue de l’atelier sont lus');
  /** Lignes qui portent une mention, « fichier:ligne  texte ». @param {string} f @param {string} texte @param {number} [depuis] */
  const lignes = (f, texte, depuis = 1) => texte.split('\n').flatMap((l, i) => (mentionne(l) ? [`${f}:${depuis + i}  ${l.trim()}`] : []));
  const out = fs.flatMap((f) => {
    const src = readFileSync(join(ROOT, f), 'utf8');
    if (!f.endsWith('.vue')) return [...mentions(f), ...lignes(f, lex(src).code)];
    const v = partiesVue(src);
    const js = lex(v.script);
    return [
      ...js.comments.flatMap((c) => lignes(f, c.text, c.line)),
      ...lignes(f, js.code),
      ...lignes(f, v.reste),
      ...v.commentaires.flatMap((c) => lignes(f, c.text, c.line)),
    ];
  });
  assert.deepEqual(out, []);
});
