// @ts-check
/**
 * Les points de départ des trois exercices du banc (D68, docs/attendus/etape-10-exercices.md), fabriqués une fois chacun
 * dans un dossier temporaire, sans npm ci :
 *   EX1 d'Installer à Composer, ne diffèrent que les fichiers annoncés : marques saisies et thème, composants et fiches,
 *       gabarit, pages, mode d'emploi ; données, dépendances, routes, entrées et construction sont les mêmes à l'octet ;
 *   EX3 verifier sort 0 sur le départ de Composer ;
 *   EX4 les composants, leurs menus et leurs fiches égalent ceux du dépôt à l'octet ; ni noms.json ni module ; chaque
 *       import d'un composant se résout dans l'app ou dans ses dépendances ;
 *   EX5 l'aplat des thèmes égale background.brand.strong et text.on-brand, trois marques, deux modes ; chaque exception de
 *       style de l'app est dans src/gabarit/ et égale le jeton qu'elle nomme, dans sa largeur ;
 *   EX8 chaque page du départ de Composer passe par le gabarit ; hors de src/components/ds/, aucune pièce de Vuetify qui a
 *       un composant Ds…, sauf la puce d'état (DsTag ne porte pas de statut).
 */
import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exercices, fabriquer, marquesDuBanc } from '../src/banc/departs.js';
import { loadRoles, resolveRoles } from '../src/tokens/roles.js';
import { largeurs } from '../src/tokens/resolver.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
/** @type {string} */
let racine;
const depart = (/** @type {string} */ e) => join(racine, e);
/** Les fichiers d'un dossier, en chemins relatifs. @param {string} d @returns {string[]} */
const arbre = (d) =>
  /** @type {string[]} */ (readdirSync(d, { recursive: true }))
    .filter((f) => statSync(join(d, f)).isFile())
    .sort();
/** Les fichiers qui diffèrent, ou qui ne sont que d'un côté. @param {string} a @param {string} b */
function differents(a, b) {
  const fichiers = [...new Set([...arbre(a), ...arbre(b)])].sort();
  return fichiers.filter((f) => !existsSync(join(a, f)) || !existsSync(join(b, f)) || !readFileSync(join(a, f)).equals(readFileSync(join(b, f))));
}
/** @param {string} f */
const lire = (f) => readFileSync(f, 'utf8');

before(() => {
  racine = mkdtempSync(join(tmpdir(), 'ds-lab-exercices-'));
  for (const e of Object.keys(exercices(ROOT).exercices)) fabriquer({ depot: ROOT, clone: ROOT, exercice: e, app: depart(e) });
});
after(() => rmSync(racine, { recursive: true, force: true }));

test('EX1 d’Installer à Composer, seuls diffèrent les fichiers annoncés', () => {
  const annonces = [
    /^tokens\/[^/]+\/(?!entree\.json)/,
    /^src\/plugins\//,
    /^src\/(marques|main)\.js$/,
    /^src\/styles\/app\.css$/,
    /^src\/components\/ds\//,
    /^docs\/(composants\/|gabarit\.md$)/,
    /^src\/gabarit\//,
    /^src\/App\.vue$/,
    /^src\/pages\//,
    /^README\.md$/,
  ];
  const d = differents(depart('installer'), depart('composer'));
  assert.deepEqual(d.filter((f) => !annonces.some((a) => a.test(f))), []);
  for (const a of annonces) assert.ok(d.some((f) => a.test(f)), `${a} : annoncé, rien ne change`);
  for (const f of ['package.json', 'package-lock.json', 'index.html', 'vite.config.js', 'src/router.js', 'src/data/membres.js', 'src/data/evenements.js'])
    assert.ok(existsSync(join(depart('composer'), f)) && !d.includes(f), `${f} : partagé`);
  assert.ok(!arbre(depart('composer')).some((f) => f.endsWith('.css')), 'plus aucune feuille : verifier ne les lit pas');
  for (const e of ['installer', 'composer']) assert.equal(existsSync(join(depart(e), 'banc.json')), false);
});

test('EX3 verifier sort 0 au départ de Composer', () => {
  const app = depart('composer');
  const copie = join(app, '.claude', 'skills', 'ds-lab');
  cpSync(join(ROOT, 'skill', 'ds-lab'), copie, { recursive: true });
  const r = spawnSync(process.execPath, [join(ROOT, 'src', 'cli', 'verifier.js'), '--marques', 'tokens', '--style', 'src/**/*.vue', '--skill', '.claude/skills/ds-lab'], { cwd: app, encoding: 'utf8' });
  rmSync(join(app, '.claude'), { recursive: true });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /^verifier : 0 échec/m);
});

test('EX4 les composants et leurs fiches sont ceux du dépôt, complets, et se résolvent dans l’app', () => {
  const app = depart('composer');
  const { copies } = exercices(ROOT).exercices.composer;
  for (const c of copies) {
    const poses = arbre(join(app, c.vers));
    assert.deepEqual(poses, arbre(join(ROOT, c.de)).filter((f) => !(c.sauf ?? []).includes(f)), c.vers);
    for (const f of poses) assert.ok(readFileSync(join(app, c.vers, f)).equals(readFileSync(join(ROOT, c.de, f))), f);
  }
  const ds = join(app, 'src', 'components', 'ds');
  const vue = arbre(ds).filter((f) => f.endsWith('.vue'));
  assert.equal(vue.length, 6);
  for (const f of vue) assert.ok(existsSync(join(ds, f.replace('.vue', '.menu.js'))), f);
  assert.ok(!arbre(app).some((f) => /(^|\/)(noms\.json|Member(Card|List)\b.*)$/.test(f)));
  const dependances = Object.keys(JSON.parse(lire(join(app, 'package.json'))).dependencies);
  for (const f of arbre(ds))
    for (const [, cible] of lire(join(ds, f)).matchAll(/^import .* from '([^']+)';$/gm))
      assert.ok(cible.startsWith('.') ? existsSync(resolve(ds, cible)) : dependances.some((d) => cible === d || cible.startsWith(`${d}/`)), `${f} : ${cible}`);
});

test('EX5 l’aplat et les exceptions du gabarit égalent leurs jetons', async () => {
  const app = depart('composer');
  const { avecAplat } = await import(pathToFileURL(join(app, 'src', 'plugins', 'aplat.js')).href);
  for (const m of marquesDuBanc(ROOT)) {
    const themes = avecAplat(JSON.parse(lire(join(app, 'tokens', m, 'vuetify.json'))).themes);
    for (const [nom, t] of Object.entries(themes)) {
      const set = loadRoles(join(app, 'tokens', m), { mode: t.dark ? 'dark' : 'light', largeur: 'wide' });
      const roles = resolveRoles(set.semantique, set.primitives, set.marque ?? {}, ...(set.echelles ?? []));
      assert.equal(t.colors['brand-strong'], roles.get('background.brand.strong')?.hex, nom);
      assert.equal(t.colors['on-brand-strong'], roles.get('text.on-brand')?.hex, nom);
    }
  }
  // Les jetons communs, lus par le resolver d'une marque ; l'étroit ne porte que ce qui change, ou l'alias de sa valeur.
  const l = largeurs(join(app, 'tokens', marquesDuBanc(ROOT)[0]));
  /** @param {any} o @param {string} chemin */
  const noeud = (o, chemin) => chemin.split('.').reduce((x, k) => x?.[k], o);
  /** @param {any} v @param {any[]} jeux @returns {any} */
  const resoudre = (v, jeux) => {
    const alias = typeof v === 'string' ? v.match(/^\{(.+)\}$/)?.[1] : undefined;
    if (!alias) return v && typeof v === 'object' && 'unit' in v ? `${v.value}${v.unit}` : String(v);
    return resoudre(jeux.map((j) => noeud(j, alias)).find((n) => n)?.$value, jeux);
  };
  const CHAMPS = /** @type {Record<string, string>} */ ({ 'font-size': 'fontSize', 'font-weight': 'fontWeight', 'line-height': 'lineHeight' });
  let comptees = 0;
  for (const f of arbre(join(app, 'src')).filter((x) => x.endsWith('.vue') && !x.startsWith('components/ds/'))) {
    const t = lire(join(app, 'src', f));
    const exceptions = [...t.matchAll(/\/\* stylelint-disable-next-line \S+ -- (.+?) : .+? \*\/\n\s*([\w-]+): (.+);/g)];
    assert.equal((t.match(/stylelint-disable/g) ?? []).length, exceptions.length, `${f} : une exception sans la forme « jeton : raison »`);
    if (exceptions.length) assert.match(f, /^gabarit\//, 'une exception hors du gabarit');
    for (const [, tete, propriete, valeur] of exceptions) {
      if (tete === 'aucun jeton de largeur de page') continue;
      comptees++;
      const [jeton, etroit] = tete.split(', en ');
      const jeux = etroit ? [l.etroit.semantique, l.large.semantique, l.large.primitives] : [l.large.semantique, l.large.primitives];
      const brut = jeux.map((j) => noeud(j, jeton)).find((n) => n)?.$value;
      assert.ok(brut !== undefined, `${f} : ${jeton} n'est pas un jeton`);
      assert.equal(valeur, resoudre(propriete in CHAMPS ? brut[CHAMPS[propriete]] : brut, jeux), `${f} : ${tete}, ${propriete}`);
    }
  }
  assert.ok(comptees >= 10, `${comptees} exceptions lues`);
});

test('EX8 chaque page passe par le gabarit, aucune pièce de Vuetify qui a un composant Ds…', () => {
  const app = depart('composer');
  for (const p of readdirSync(join(app, 'src', 'pages'))) assert.match(lire(join(app, 'src', 'pages', p)), /import GabaritPage from '\.\.\/gabarit\/GabaritPage\.vue';[\s\S]*<GabaritPage /, p);
  const emballees = readdirSync(join(ROOT, 'docs', 'composants'))
    .flatMap((f) => lire(join(ROOT, 'docs', 'composants', f)).match(/^wraps: (V\w+)$/m)?.[1] ?? [])
    .map((v) => v.replace(/(?<=.)[A-Z]/g, (c) => `-${c.toLowerCase()}`).toLowerCase());
  assert.ok(emballees.includes('v-btn') && emballees.includes('v-text-field'), emballees.join(', '));
  const trouvees = arbre(join(app, 'src'))
    .filter((f) => f.endsWith('.vue') && !f.startsWith('components/ds/'))
    .flatMap((f) => emballees.filter((v) => new RegExp(`<${v}[\\s>]`).test(lire(join(app, 'src', f)))).map((v) => `${f} : ${v}`));
  assert.deepEqual(trouvees, ['pages/Evenements.vue : v-chip']);
});
