// @ts-check
/**
 * Feuilles ajoutées (npm run ajout, verify --ajout) sur un site d'essai écrit dans un dossier temporaire :
 * docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026.
 *
 * Site : /essai/page.html charge x.css, y.css, z.css, dans cet ordre. modifications.json écrit à la main (ENTREES).
 * Attendus écrits à la main avant le code (17/11/2026) :
 *   F1 une feuille ajoutée par feuille modifiée : /essai/x.ajout.css, rien pour y.css ni z.css ; le texte de
 *      x.ajout.css est ATTENDU_X, à l'octet : chaque règle sous le sélecteur de la source (li:nth-child(even), pas la
 *      forme du navigateur), dans son contexte (@media, @supports, @layer), une propriété longue par déclaration
 *      (margin-top seul, pour une entrée tirée de margin: 8px), l'identifiant de ligne en commentaire au-dessus de
 *      la règle et après chaque déclaration ;
 *   F2 non écrites, dans le fichier des pertes avec leur cause : esp-01 (!important d'origine), esp-02 de .g (battue
 *      par l'ordre à spécificité égale : .h la suit dans x.css et gagne sur l'élément « g h »), coul-02 (garde d'apply :
 *      valeur écrite attendue #999999, trouvée #333333) ; .p et .q, sur le même élément, sont écrites toutes deux, dans
 *      l'ordre de la source ; .m, sans élément commun avec .n, est écrite ;
 *   F3 la ligne simplement rattachée (esp-04, RATTACHE) n'est pas écrite : « rattachement non fait » ;
 *   F4 le fichier des pertes dit en tête que la réduction ne voit pas les styles en ligne, et recopie les lignes
 *      du reste de modifications.json ;
 *   F5 deux générations identiques à l'octet ; aucun fichier du site modifié ;
 *   F6 verify --ajout : tokens.css avant toutes les feuilles, x.ajout.css juste après x.css, donc avant y.css :
 *      .a prend la nouvelle couleur, l'élément « a s » garde celle de .s (y.css) ; .c, .d, .e prennent 8 px dans leur
 *      contexte ; .g garde 12 px (non écrite) ; .b garde 8 px (!important d'origine) ;
 *   F7 commande : sortie 1 sur ce site (des lignes décidées non écrites), 0 quand tout est écrit, 2 sur une panne
 *      (option inconnue ; --modifications sans --sortie) ; elle écrit x.ajout.css, tokens.css, pertes.md et
 *      feuilles-ajoutees.json dans --sortie.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServers } from './helpers/serveur.js';
import { feuillesAjoutees } from '../src/apply/ajout.js';
import { poserAjouts } from '../src/verify/capture.js';
import { lancerChromium } from '../src/browser/lancement.js';
import { gotoAndSettle } from '../src/browser/navigate.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const X = `.a {
  color: #111111;
}
.b {
  color: #222222;
  margin-top: 8px !important;
}
@media (min-width: 1px) {
  .c {
    padding-top: 4px;
  }
}
@supports (display: grid) {
  .d {
    padding-left: 4px;
  }
}
@layer base {
  .e {
    padding-right: 4px;
  }
}
.f {
  margin: 8px;
}
.g {
  margin-bottom: 4px;
}
.h {
  margin-bottom: 12px;
}
.k {
  border-top-color: #333333;
}
li:nth-child(even) {
  background-color: #eeeeee;
}
.r {
  padding-bottom: 4px;
}
.m {
  margin-left: 4px;
}
.n {
  margin-left: 12px;
}
.p {
  margin-right: 4px;
}
.q {
  margin-right: 12px;
}
`;
const Y = '.s {\n  color: #444444;\n}\n';
const Z = '.z {\n  color: #555555;\n}\n';
const PAGE = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Essai</title>
  <link rel="stylesheet" href="/essai/x.css">
  <link rel="stylesheet" href="/essai/y.css">
  <link rel="stylesheet" href="/essai/z.css">
</head>
<body>
  <div class="a">a</div>
  <div class="a s">a s</div>
  <div class="b">b</div>
  <div class="c">c</div>
  <div class="d">d</div>
  <div class="e">e</div>
  <div class="f">f</div>
  <div class="g h">g h</div>
  <div class="k">k</div>
  <ul><li>un</li><li>deux</li></ul>
  <div class="r">r</div>
  <div class="m">m</div>
  <div class="n">n</div>
  <div class="p q">p q</div>
  <div class="z">z</div>
</body>
</html>
`;
const STAMP = '17/11/2026 12:00';
/** @param {number} line @param {string} selector @param {string} property @param {string} written @param {string} value @param {string} row @param {string} [section] */
const e = (line, selector, property, written, value, row, section = 'REMPLACEMENTS') => ({ sheet: '/essai/x.css', line, selector, property, written, value, rows: [row], section });
const ENTREES = [
  e(1, '.a', 'color', '#111111', 'var(--t-a, #111111)', 'coul-01'),
  e(4, '.b', 'margin-top', '8px', 'var(--e-12, 8px)', 'esp-01'),
  e(9, '.c', 'padding-top', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(14, '.d', 'padding-left', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(19, '.e', 'padding-right', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(23, '.f', 'margin-top', '8px', 'var(--e-12, 8px)', 'esp-03'),
  e(26, '.g', 'margin-bottom', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(32, '.k', 'border-top-color', '#999999', 'var(--t-k, #999999)', 'coul-02'),
  e(35, 'li:nth-child(2n)', 'background-color', '#eeeeee', 'var(--t-li, #eeeeee)', 'coul-03'),
  e(38, '.r', 'padding-bottom', '4px', 'var(--e-4, 4px)', 'esp-04', 'RATTACHE'),
  e(41, '.m', 'margin-left', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(47, '.p', 'margin-right', '4px', 'var(--e-8, 4px)', 'esp-02'),
  e(50, '.q', 'margin-right', '12px', 'var(--e-16, 12px)', 'esp-05'),
];
const RESTE = 'coul-90 Couleur du texte · texte « Essai » : jeton absent pour #abcdef ; écris #abcdef à la place de #123456 dans ses déclarations (x.css:1 .a { color: #111111 }).';
const TOKENS = ':root {\n  --e-12: 12px;\n  --e-16: 16px;\n  --e-4: 4px;\n  --e-8: 8px;\n  --t-a: #0000ff;\n  --t-k: #00ff00;\n  --t-li: #ff0000;\n}\n';
/** @param {any[]} entries @param {string[]} reste */
const mods = (entries, reste) => ({
  version: 1,
  host: 'essai.invalid',
  stamp: STAMP,
  tokens: 'jetons.tokens.json',
  entries,
  comments: [],
  tokensCss: { path: '/essai/tokens.css', content: TOKENS },
  brief: { pages: ['/essai/page.html'], sheets: ['/essai/x.css'], reste, changeAussi: [], neTouchePas: [], signale: [], verification: [] },
});

const ATTENDU_X = `/* ds-lab : feuille ajoutée de /essai/x.css, à charger juste après elle. Tirée de modifications.json (jetons.tokens.json, ${STAMP}). */

/* coul-01 ; /essai/x.css:1 */
.a {
  color: var(--t-a, #111111); /* coul-01 */
}

/* esp-02 ; /essai/x.css:9 */
@media (min-width: 1px) {
  .c {
    padding-top: var(--e-8, 4px); /* esp-02 */
  }
}

/* esp-02 ; /essai/x.css:14 */
@supports (display: grid) {
  .d {
    padding-left: var(--e-8, 4px); /* esp-02 */
  }
}

/* esp-02 ; /essai/x.css:19 */
@layer base {
  .e {
    padding-right: var(--e-8, 4px); /* esp-02 */
  }
}

/* esp-03 ; /essai/x.css:23 */
.f {
  margin-top: var(--e-12, 8px); /* esp-03 */
}

/* coul-03 ; /essai/x.css:35 */
li:nth-child(even) {
  background-color: var(--t-li, #eeeeee); /* coul-03 */
}

/* esp-02 ; /essai/x.css:41 */
.m {
  margin-left: var(--e-8, 4px); /* esp-02 */
}

/* esp-02 ; /essai/x.css:47 */
.p {
  margin-right: var(--e-8, 4px); /* esp-02 */
}

/* esp-05 ; /essai/x.css:50 */
.q {
  margin-right: var(--e-16, 12px); /* esp-05 */
}
`;

const NON_ECRITES = [
  "- esp-01 : /essai/x.css:4 .b { margin-top } : !important d'origine. À faire : écrire var(--e-12, 8px) dans la source, ou décider d'un !important dans la feuille ajoutée.",
  "- esp-02 : /essai/x.css:26 .g { margin-bottom } : battue par l'ordre à spécificité égale (.h, /essai/x.css:29, la suit dans la même feuille et gagne). À faire : écrire var(--e-8, 4px) dans la source.",
  "- coul-02 : /essai/x.css:32 .k { border-top-color } : valeur écrite attendue #999999, trouvée #333333. À faire : vérifier la déclaration ; si c'est bien elle, écrire var(--t-k, #999999) dans la source.",
];
const RATTACHEMENTS = ['- esp-04 : /essai/x.css:38 .r { padding-bottom } : var(--e-4, 4px). À faire : rattacher dans la source quand le composant sera refait.'];
const EN_TETE = "La réduction ne voit pas les styles en ligne : une valeur posée par un attribut style n'est ni dans modifications.json, ni dans ce fichier.";

/** @type {string} */
let site;
/** @type {Awaited<ReturnType<typeof startFixtureServers>>} */
let servers;
/** @type {Record<string, string>} */
let avant;
/** @type {Awaited<ReturnType<typeof feuillesAjoutees>>} */
let r;

/** Tous les fichiers du site, chemin → texte. */
async function fichiers() {
  /** @type {Record<string, string>} */
  const out = {};
  for (const n of await readdir(join(site, 'essai'))) out[n] = await readFile(join(site, 'essai', n), 'utf8');
  return out;
}

before(async () => {
  site = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-site-'));
  await mkdir(join(site, 'essai'));
  for (const [n, t] of Object.entries({ 'x.css': X, 'y.css': Y, 'z.css': Z, 'page.html': PAGE })) await writeFile(join(site, 'essai', n), t);
  servers = await startFixtureServers({ root: site });
  avant = await fichiers();
  r = await feuillesAjoutees(mods(ENTREES, [RESTE]), { origine: servers.origin, waitMs: 0 });
});

after(async () => servers?.close());

test('F1 une feuille ajoutée par feuille modifiée, texte attendu à l\'octet', () => {
  assert.deepEqual(r.feuilles.map((f) => [f.feuille, f.ajout]), [['/essai/x.css', '/essai/x.ajout.css']]);
  assert.equal(r.feuilles[0].texte, ATTENDU_X);
});

test('F2, F3, F4 fichier des pertes : non écrites avec leur cause, rattachement non fait, en-tête, reste recopié', () => {
  const t = r.pertes;
  assert.ok(t.includes(EN_TETE), t);
  for (const l of [...NON_ECRITES, ...RATTACHEMENTS, `- ${RESTE}`]) assert.ok(t.split('\n').includes(l), `${l}\n---\n${t}`);
  assert.ok(t.includes('NON ÉCRITES (3)'), t);
  assert.ok(t.includes('RATTACHEMENTS NON FAITS (1)'), t);
  assert.ok(t.includes('HORS DE MODIFICATIONS.JSON (1)'), t);
  assert.ok(t.includes('- /essai/tokens.css avant toutes les autres feuilles.'), t);
  assert.ok(t.includes('- /essai/x.ajout.css juste après /essai/x.css, dans toute page qui charge /essai/x.css.'), t);
  assert.deepEqual(r.compte, { ecrites: 9, nonEcrites: 3, rattachements: 1, horsModifications: 1 });
});

test('F5 deux générations identiques à l\'octet ; aucun fichier du site modifié', async () => {
  const b = await feuillesAjoutees(mods(ENTREES, [RESTE]), { origine: servers.origin, waitMs: 0 });
  assert.deepEqual(b.feuilles, r.feuilles);
  assert.equal(b.pertes, r.pertes);
  assert.deepEqual(await fichiers(), avant);
});

test('F6 verify --ajout : tokens.css en tête, chaque feuille ajoutée juste après la sienne', async () => {
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  const p = await commande(['--modifications', await modsSurDisque(ENTREES, [RESTE]), '--sortie', sortie, '--origine', servers.origin]);
  assert.equal(p.status, 1, p.stderr);
  const browser = await lancerChromium();
  try {
    const page = await browser.newPage();
    await gotoAndSettle(page, `${servers.origin}/essai/page.html`, { waitMs: 0 });
    await poserAjouts(page, sortie);
    const v = await page.evaluate(() => {
      const cs = (/** @type {string} */ s) => getComputedStyle(/** @type {Element} */ (document.querySelector(s)));
      return {
        a: cs('.a').color,
        as: cs('.a.s').color,
        c: cs('.c').paddingTop,
        d: cs('.d').paddingLeft,
        e: cs('.e').paddingRight,
        f: [cs('.f').marginTop, cs('.f').marginBottom],
        g: cs('.g').marginBottom,
        b: cs('.b').marginTop,
        li: cs('li:nth-child(2)').backgroundColor,
        pq: cs('.p').marginRight,
        ordre: [...document.querySelectorAll('head link, head style')].map((n) => n.getAttribute('href') ?? n.getAttribute('data-ds-lab-ajout')),
      };
    });
    assert.deepEqual(v, {
      a: 'rgb(0, 0, 255)',
      as: 'rgb(68, 68, 68)',
      c: '8px',
      d: '8px',
      e: '8px',
      f: ['12px', '8px'],
      g: '12px',
      b: '8px',
      li: 'rgb(255, 0, 0)',
      pq: '16px',
      ordre: ['/essai/tokens.css', '/essai/x.css', '/essai/x.ajout.css', '/essai/y.css', '/essai/z.css'],
    });
  } finally {
    await browser.close();
  }
});

/** @param {any[]} entries @param {string[]} reste */
async function modsSurDisque(entries, reste) {
  const f = join(await mkdtemp(join(tmpdir(), 'ds-lab-ajout-mods-')), 'modifications.json');
  await writeFile(f, JSON.stringify(mods(entries, reste), null, 2));
  return f;
}
/** Le serveur d'essai tourne dans ce processus : la commande est lancée sans bloquer la boucle. @param {string[]} args */
function commande(args) {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, ['src/cli/ajout.js', ...args], { cwd: ROOT });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => (stdout += d));
    p.stderr.on('data', (d) => (stderr += d));
    p.on('close', (status) => resolve({ status, stdout, stderr }));
  });
}

test('F7 commande : 1 avec des pertes, 0 sans, 2 sur une panne ; fichiers écrits dans --sortie seulement', async () => {
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  const p = /** @type {any} */ (await commande(['--modifications', await modsSurDisque(ENTREES, [RESTE]), '--sortie', sortie, '--origine', servers.origin]));
  assert.equal(p.status, 1, p.stderr);
  assert.equal(await readFile(join(sortie, 'essai', 'x.ajout.css'), 'utf8'), ATTENDU_X);
  assert.equal(await readFile(join(sortie, 'essai', 'tokens.css'), 'utf8'), TOKENS);
  assert.equal(await readFile(join(sortie, 'pertes.md'), 'utf8'), r.pertes);
  assert.deepEqual(JSON.parse(await readFile(join(sortie, 'feuilles-ajoutees.json'), 'utf8')), {
    tokensCss: '/essai/tokens.css',
    feuilles: [{ feuille: '/essai/x.css', ajout: '/essai/x.ajout.css' }],
  });
  assert.deepEqual(await fichiers(), avant);
  const sans = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  const q = /** @type {any} */ (await commande(['--modifications', await modsSurDisque([ENTREES[0]], []), '--sortie', sans, '--origine', servers.origin]));
  assert.equal(q.status, 0, q.stderr + q.stdout);
  const x = /** @type {any} */ (await commande(['--x']));
  assert.equal(x.status, 2);
  assert.equal(x.stderr, 'ajout : option inconnue --x\n');
  const y = /** @type {any} */ (await commande(['--modifications', 'm.json']));
  assert.equal(y.status, 2);
  assert.equal(y.stderr, 'ajout : --modifications et --sortie sont attendus\n');
});
