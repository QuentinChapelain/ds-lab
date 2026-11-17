// @ts-check
/**
 * Feuilles ajoutées (npm run ajout, verify --ajout) sur un site d'essai écrit dans un dossier temporaire :
 * docs/attendus/feuille-ajoutee.md, décisions de Quentin du 17/11/2026.
 *
 * Site : /essai/page.html charge x.css, y.css, z.css, dans cet ordre. modifications.json écrit à la main (ENTREES).
 * Attendus écrits à la main avant le code (17/11/2026), revus le même jour pour les armes égales
 * (docs/attendus/feuille-ajoutee-reel.md : une déclaration d'origine en !important est écrite avec !important) :
 *   F1 une feuille ajoutée par feuille modifiée : /essai/x.ajout.css, rien pour y.css ni z.css ; le texte de
 *      x.ajout.css est ATTENDU_X, à l'octet : chaque règle sous le sélecteur de la source (li:nth-child(even), pas la
 *      forme du navigateur), dans son contexte (@media, @supports, @layer), une propriété longue par déclaration
 *      (margin-top seul, pour une entrée tirée de margin: 8px), l'identifiant de ligne en commentaire au-dessus de
 *      la règle et après chaque déclaration ; esp-01 (.b, !important d'origine) écrite avec !important, son
 *      commentaire dit « provisoire : !important d'origine » ;
 *   F2 non écrites, dans le fichier des pertes avec leur cause, une section par cause : esp-02 de .g (battue par
 *      l'ordre à spécificité égale : .h la suit dans x.css et gagne sur l'élément « g h »), coul-02 (garde d'apply :
 *      valeur écrite attendue #999999, trouvée #333333) ; esp-01 comptée à part, sous l'!important d'origine ;
 *      .p et .q, sur le même élément, sont écrites toutes deux, dans l'ordre de la source ; .m, sans élément commun
 *      avec .n, est écrite ;
 *   F3 la ligne simplement rattachée (esp-04, RATTACHE) n'est pas écrite : « rattachement non fait » ;
 *   F4 le fichier des pertes dit en tête ce qu'il en est des styles en ligne, et recopie les lignes du reste de
 *      modifications.json ;
 *   F5 deux générations identiques à l'octet ; aucun fichier du site modifié ;
 *   F6 verify --ajout : tokens.css avant toutes les feuilles, x.ajout.css juste après x.css, donc avant y.css :
 *      .a prend la nouvelle couleur, l'élément « a s » garde celle de .s (y.css) ; .c, .d, .e prennent 8 px dans leur
 *      contexte ; .g garde 12 px (non écrite) ; .b prend 12 px (!important contre !important, la feuille ajoutée
 *      après la sienne) ;
 *   F7 commande : sortie 1 sur ce site (des lignes décidées non écrites), 0 quand tout est écrit, 2 sur une panne
 *      (option inconnue, dont --viewport : la fenêtre est celle de modifications.json ; --modifications sans
 *      --sortie) ; elle écrit x.ajout.css, tokens.css, pertes.md et feuilles-ajoutees.json dans --sortie ; le
 *      manifeste porte la fenêtre, chaque déclaration décidée, et la simulation, les lignes décidées et les lignes
 *      hors de modifications.json (vides ou tirées du reste pour un modifications.json qui ne les porte pas) ;
 *   F8 verdict par ligne décidée (docs/attendus/verdict-par-decision.md), simulation et lignes écrites à la main, sur
 *      /essai/page.html : coul-01 (.a ; l'élément « a s », dont la couleur est celle de .s, n'est pas visé) et
 *      coul-03 (li:nth-child(even)) arrivées ; esp-09, sans élément sur sa page : non vue ; esp-10, d'une page non
 *      vérifiée : hors des pages vérifiées ; coul-11, vue seulement au focus : non vérifiable (état) ; sortie 1 ;
 *   F9 /essai/partie.html : .a sur deux éléments, dont un dans .zone, qui redéfinit --t-a : coul-01 en partie (0
 *      déclaration sur 1, 1 élément sur 2), canal « variable », --t-a posée par .zone ; esp-09 non vue ; la commande
 *      verify --ajout dit chaque ligne et la phrase finale, sort en 1, en 0 quand tout est arrivé, en 2 avec
 *      --viewport, et en 2 sur un dossier tiré d'un modifications.json sans simulation ;
 *   F10 la fenêtre vient de modifications.json : sur /essai/etroit.html, .w (même spécificité, après .v dans v.css,
 *      sous @media (max-width: 500px)) gagne sur l'élément « v w » à 390 px : .v est battue par l'ordre avec la
 *      fenêtre 390×900 de modifications.json, écrite sans fenêtre (1366×900).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startFixtureServers } from './helpers/serveur.js';
import { feuillesAjoutees, ecrireAjouts } from '../src/apply/ajout.js';
import { poserAjouts, capturePage } from '../src/verify/capture.js';
import { juger } from '../src/verify/arrivee.js';
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
const W = '.absent {\n  margin-top: 4px;\n}\n';
const V = '.v {\n  margin-bottom: 4px;\n}\n@media (max-width: 500px) {\n  .w {\n    margin-bottom: 12px;\n  }\n}\n';
const PARTIE = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Partie</title>
  <link rel="stylesheet" href="/essai/x.css">
  <link rel="stylesheet" href="/essai/w.css">
  <style>.zone { --t-a: #00ff00; }</style>
</head>
<body>
  <div class="a">a</div>
  <div class="zone"><div class="a">a dans zone</div></div>
</body>
</html>
`;
const ETROIT = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Étroit</title>
  <link rel="stylesheet" href="/essai/v.css">
</head>
<body>
  <div class="v">v</div>
  <div class="v w">v w</div>
</body>
</html>
`;
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
/** @param {any[]} entries @param {string[]} reste @param {Record<string, any>} [extra]  simulation, lignes, hors */
const mods = (entries, reste, extra = {}) => ({
  version: 1,
  host: 'essai.invalid',
  stamp: STAMP,
  tokens: 'jetons.tokens.json',
  entries,
  comments: [],
  tokensCss: { path: '/essai/tokens.css', content: TOKENS },
  brief: { pages: ['/essai/page.html'], sheets: ['/essai/x.css'], reste, changeAussi: [], neTouchePas: [], signale: [], verification: [] },
  ...extra,
});
/** Carte de simulation écrite à la main : couleurs seulement. @param {Record<string, string>} colors */
const simulation = (colors, spacing = {}) => ({ colors, spacing, radii: {}, fontSizes: {}, split: [], solid: [], couplings: [], thirdParty: [], conflits: [] });
/** Ligne décidée écrite à la main. @param {string} id @param {string} cle @param {string} ancienne @param {string} nouvelle @param {string | null} jeton @param {string[]} pages @param {Record<string, any>} [x] */
const decidee = (id, cle, ancienne, nouvelle, jeton, pages, x = {}) => ({ id, titre: `Ligne ${id}`, famille: cle.split('|')[0], cles: [cle], ancienne, nouvelle, jeton, pages, ...x });
const LIGNES = [
  decidee('coul-01', 'colors|#111111|texte', '#111111', '#0000ff', '--t-a', ['/essai/page.html']),
  decidee('coul-03', 'colors|#eeeeee|fond', '#eeeeee', '#ff0000', '--t-li', ['/essai/page.html']),
  decidee('esp-09', 'spacing|4px|gouttière', '4px', '8px', '--e-8', ['/essai/page.html']),
  decidee('esp-10', 'spacing|6px|marge', '6px', '8px', '--e-8', ['/essai/autre.html']),
  decidee('coul-11', 'colors|#abcdef|texte', '#abcdef', '#0000ff', '--t-a', [], { etats: ['focus'] }),
];
const SIMULATION = simulation({ '#111111': '#0000ff', '#eeeeee': '#ff0000' });

const ATTENDU_X = `/* ds-lab : feuille ajoutée de /essai/x.css, à charger juste après elle. Tirée de modifications.json (jetons.tokens.json, ${STAMP}). */

/* coul-01 ; /essai/x.css:1 */
.a {
  color: var(--t-a, #111111); /* coul-01 */
}

/* esp-01 ; /essai/x.css:4 */
.b {
  margin-top: var(--e-12, 8px) !important; /* esp-01 ; provisoire : !important d'origine */
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
  "- esp-02 : /essai/x.css:26 .g { margin-bottom } : battue par l'ordre à spécificité égale (.h, /essai/x.css:29, la suit dans la même feuille et gagne). À faire : écrire var(--e-8, 4px) dans la source.",
  "- coul-02 : /essai/x.css:32 .k { border-top-color } : valeur écrite attendue #999999, trouvée #333333. À faire : vérifier la déclaration ; si c'est bien elle, écrire var(--t-k, #999999) dans la source.",
];
const IMPORTANTS = [
  "- esp-01 : /essai/x.css:4 .b { margin-top } : écrite avec !important, comme la déclaration d'origine (provisoire). À faire : retirer !important de la source et de la feuille ajoutée quand le composant sera refait.",
];
const RATTACHEMENTS = ['- esp-04 : /essai/x.css:38 .r { padding-bottom } : var(--e-4, 4px). À faire : rattacher dans la source quand le composant sera refait.'];
const EN_TETE =
  "Une valeur posée par un attribut style n'est jamais dans modifications.json : une ligne tenue seulement par des attributs style est parmi les lignes hors de modifications.json, en fin de fichier (point de départ : attribut style) ; une ligne tenue en partie par eux ne le dit pas ici.";

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
  for (const [n, t] of Object.entries({ 'x.css': X, 'y.css': Y, 'z.css': Z, 'w.css': W, 'v.css': V, 'page.html': PAGE, 'partie.html': PARTIE, 'etroit.html': ETROIT })) await writeFile(join(site, 'essai', n), t);
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
  for (const l of [...NON_ECRITES, ...IMPORTANTS, ...RATTACHEMENTS, `- ${RESTE}`]) assert.ok(t.split('\n').includes(l), `${l}\n---\n${t}`);
  assert.ok(t.includes('NON ÉCRITES (2)'), t);
  for (const x of ['GARDE (1)', 'RACCOURCI (0)', 'RÈGLE INTROUVABLE (0)', "BATTUE PAR L'ORDRE (1)", 'CONTEXTE (0)', 'FEUILLE INTROUVABLE (0)']) assert.ok(t.split('\n').includes(`NON ÉCRITES, ${x}`), `${x}\n---\n${t}`);
  assert.ok(t.includes("ÉCRITES AVEC !IMPORTANT D'ORIGINE (1)"), t);
  assert.ok(t.includes('ÉCRITES DANS UNE FEUILLE INJECTÉE PAR UN SCRIPT (0)'), t);
  assert.ok(t.includes('RATTACHEMENTS NON FAITS (1)'), t);
  assert.ok(t.includes('HORS DE MODIFICATIONS.JSON (1)'), t);
  assert.ok(t.includes('- /essai/tokens.css avant toutes les autres feuilles.'), t);
  assert.ok(t.includes('- /essai/x.ajout.css juste après /essai/x.css, dans toute page qui charge /essai/x.css.'), t);
  assert.deepEqual(r.compte, { ecrites: 10, nonEcrites: 2, important: 1, injectees: 0, rattachements: 1, horsModifications: 1 });
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
      b: '12px',
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
/** Le serveur d'essai tourne dans ce processus : la commande est lancée sans bloquer la boucle. @param {string[]} args @param {string} [cli] */
function commande(args, cli = 'ajout') {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [`src/cli/${cli}.js`, ...args], { cwd: ROOT });
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
    feuilles: [{ feuille: '/essai/x.css', ajout: '/essai/x.ajout.css', injectee: false }],
    viewport: { width: 1366, height: 900 },
    simulation: null,
    lignes: [],
    hors: [{ lignes: [], cause: null, texte: RESTE }],
    declarations: ENTREES.filter((x) => x.section !== 'RATTACHE').map((x) => ({
      rows: x.rows,
      sheet: x.sheet,
      line: x.line,
      column: null,
      selector: x.selector,
      property: x.property,
      value: x.value,
      pages: ['/essai/page.html'],
      ecrite: !['.g', '.k'].includes(x.selector),
      cause: x.selector === '.g' ? "battue par l'ordre" : x.selector === '.k' ? 'garde' : null,
      // docs/attendus/verify-se-reconnait.md : l'« à faire » du fichier des pertes, que verify --ajout reprend.
      aFaire:
        x.selector === '.g'
          ? 'écrire var(--e-8, 4px) dans la source'
          : x.selector === '.k'
            ? "vérifier la déclaration ; si c'est bien elle, écrire var(--t-k, #999999) dans la source"
            : null,
      important: x.selector === '.b',
      injectee: false,
    })),
  });
  assert.deepEqual(await fichiers(), avant);
  const sans = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  const q = /** @type {any} */ (await commande(['--modifications', await modsSurDisque([ENTREES[0]], []), '--sortie', sans, '--origine', servers.origin]));
  assert.equal(q.status, 0, q.stderr + q.stdout);
  const x = /** @type {any} */ (await commande(['--x']));
  assert.equal(x.status, 2);
  assert.equal(x.stderr, 'ajout : option inconnue --x\n');
  const vp = /** @type {any} */ (await commande(['--modifications', 'm.json', '--sortie', sans, '--viewport', '390x900']));
  assert.equal(vp.status, 2);
  assert.equal(vp.stderr, 'ajout : option inconnue --viewport\n');
  const y = /** @type {any} */ (await commande(['--modifications', 'm.json']));
  assert.equal(y.status, 2);
  assert.equal(y.stderr, 'ajout : --modifications et --sortie sont attendus\n');
});

test('F8 verdict par ligne décidée : arrivée, non vue, hors des pages vérifiées, non vérifiable (état) ; sortie 1', async () => {
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  await ecrireAjouts(await feuillesAjoutees(mods(ENTREES, [RESTE], { simulation: SIMULATION, lignes: LIGNES }), { origine: servers.origin, waitMs: 0 }), sortie);
  const manifeste = JSON.parse(await readFile(join(sortie, 'feuilles-ajoutees.json'), 'utf8'));
  assert.deepEqual([manifeste.simulation, manifeste.lignes], [SIMULATION, LIGNES]);
  const shot = await capturePage({ url: `${servers.origin}/essai/page.html`, waitMs: 0, ajout: sortie });
  const j = juger(manifeste, [/** @type {any} */ (shot.releve)]);
  assert.deepEqual(
    j.lignes.map((l) => [l.id, l.etat, l.declarations, l.elements]),
    [
      ['coul-01', 'arrivée', { arrivees: 1, total: 1 }, { arrivees: 1, total: 1 }],
      ['coul-03', 'arrivée', { arrivees: 1, total: 1 }, { arrivees: 1, total: 1 }],
      ['esp-09', 'non vue', { arrivees: 0, total: 0 }, { arrivees: 0, total: 0 }],
      ['esp-10', 'hors des pages vérifiées', { arrivees: 0, total: 0 }, { arrivees: 0, total: 0 }],
      ['coul-11', 'non vérifiable (état)', { arrivees: 0, total: 0 }, { arrivees: 0, total: 0 }],
    ],
  );
  // L'élément « a s », où .a perdait déjà (sa couleur est celle de .s), n'est pas visé : sa couleur n'est pas #111111.
  assert.deepEqual(
    /** @type {any[]} */ (shot.releve?.ops).filter((o) => o.ligne === 'coul-01').map((o) => [o.declaration, o.annotation]),
    [['/essai/x.css:1:4 .a', { ecrite: true, cause: null, aFaire: null, injectee: false }]],
  );
  assert.equal(j.sortie, 1);
  assert.equal(j.resume, 'Lignes décidées : 5 ; arrivées 2, en partie 0, non arrivées 0, déjà en place 0, non vues 1, hors des pages vérifiées 1, non vérifiables (état) 1.');
});

test('F9 en partie (variable redéfinie), non vue ; commande verify --ajout : 1, 0, 2', async () => {
  const lignes = [decidee('coul-01', 'colors|#111111|texte', '#111111', '#0000ff', '--t-a', ['/essai/partie.html']), decidee('esp-09', 'spacing|4px|marge', '4px', '8px', '--e-8', ['/essai/partie.html'])];
  const m = { ...mods([{ ...ENTREES[0], pages: ['/essai/partie.html'] }], [], { simulation: simulation({ '#111111': '#0000ff' }, { '4px|marge': '8px' }), lignes }), brief: { ...mods([], []).brief, pages: ['/essai/partie.html'] } };
  const sortie = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  await ecrireAjouts(await feuillesAjoutees(m, { origine: servers.origin, waitMs: 0 }), sortie);
  const manifeste = JSON.parse(await readFile(join(sortie, 'feuilles-ajoutees.json'), 'utf8'));
  const shot = await capturePage({ url: `${servers.origin}/essai/partie.html`, waitMs: 0, ajout: sortie });
  const j = juger(manifeste, [/** @type {any} */ (shot.releve)]);
  assert.deepEqual(
    j.lignes.map((l) => [l.id, l.etat, l.declarations, l.elements]),
    [
      ['coul-01', 'en partie', { arrivees: 0, total: 1 }, { arrivees: 1, total: 2 }],
      ['esp-09', 'non vue', { arrivees: 0, total: 0 }, { arrivees: 0, total: 0 }],
    ],
  );
  // Dans .zone, la feuille ajoutée gagne, mais --t-a y est redéfinie par un bloc <style> du HTML.
  const zone = /** @type {any[]} */ (shot.releve?.ops).filter((o) => o.apres !== o.visee);
  assert.equal(zone.length, 1);
  assert.deepEqual(zone[0].canal.categories, ['variable']);
  assert.match(zone[0].canal.texte, /--t-a/);
  assert.match(zone[0].canal.texte, /\.zone/);
  assert.equal(j.sortie, 1);
  // Commande : référence prise sur la page intacte, puis comparaison avec les feuilles ajoutées.
  const refs = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-refs-'));
  const out = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-verify-'));
  for (const p of ['partie', 'page']) {
    const s = /** @type {any} */ (await commande([`${servers.origin}/essai/${p}.html`, '--reference', refs, '--save'], 'verify'));
    assert.equal(s.status, 0, s.stderr);
  }
  const un = /** @type {any} */ (await commande([`${servers.origin}/essai/partie.html`, '--reference', refs, '--ajout', sortie, '--out', out], 'verify'));
  assert.equal(un.status, 1, un.stderr);
  for (const l of j.lignes) assert.ok(un.stdout.includes(`  ${l.texte}\n`), un.stdout);
  assert.ok(un.stdout.includes(`${j.resume}\n`), un.stdout);
  assert.ok(un.stdout.includes('Pixels différents : '), un.stdout);
  const tout = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  await ecrireAjouts(await feuillesAjoutees(mods([ENTREES[0]], [], { simulation: simulation({ '#111111': '#0000ff' }), lignes: [LIGNES[0]] }), { origine: servers.origin, waitMs: 0 }), tout);
  const zero = /** @type {any} */ (await commande([`${servers.origin}/essai/page.html`, '--reference', refs, '--ajout', tout, '--out', out], 'verify'));
  assert.equal(zero.status, 0, zero.stderr + zero.stdout);
  assert.ok(zero.stdout.includes('Toutes les lignes décidées sont arrivées (1).\n'), zero.stdout);
  const deux = /** @type {any} */ (await commande([`${servers.origin}/essai/page.html`, '--reference', refs, '--ajout', tout, '--viewport', '390x900'], 'verify'));
  assert.equal(deux.status, 2);
  assert.equal(deux.stderr, "verify : --viewport ne s'emploie pas avec --ajout : la fenêtre est celle de la réduction\n");
  // Un dossier écrit d'un modifications.json sans simulation : panne, il faut relancer reduce puis ajout.
  const ancien = await mkdtemp(join(tmpdir(), 'ds-lab-ajout-sortie-'));
  await ecrireAjouts(await feuillesAjoutees(mods([ENTREES[0]], []), { origine: servers.origin, waitMs: 0 }), ancien);
  const vieux = /** @type {any} */ (await commande([`${servers.origin}/essai/page.html`, '--reference', refs, '--ajout', ancien, '--out', out], 'verify'));
  assert.equal(vieux.status, 2);
  assert.match(vieux.stderr, /sans simulation .*relancer npm run reduce, puis npm run ajout/);
});

test('F10 la fenêtre vient de modifications.json', async () => {
  const v = { sheet: '/essai/v.css', line: 1, selector: '.v', property: 'margin-bottom', written: '4px', value: 'var(--e-8, 4px)', rows: ['esp-08'], section: 'REMPLACEMENTS' };
  const base = { ...mods([v], []), brief: { ...mods([], []).brief, pages: ['/essai/etroit.html'] } };
  const etroit = await feuillesAjoutees({ ...base, viewport: { width: 390, height: 900 } }, { origine: servers.origin, waitMs: 0 });
  assert.deepEqual(etroit.nonEcrites.map((x) => x.categorie), ["battue par l'ordre"]);
  const large = await feuillesAjoutees(base, { origine: servers.origin, waitMs: 0 });
  assert.deepEqual(large.nonEcrites, []);
  assert.equal(large.compte.ecrites, 1);
});
